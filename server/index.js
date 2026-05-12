const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let qrCodeData = null;
let clientStatus = 'DISCONNECTED';

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './sessions' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    }
});

const axios = require('axios');
const OpenAI = require('openai');
const AIConfig = require('./models/AIConfig');
const MessageLog = require('./models/MessageLog');

// Routes
const contactRoutes = require('./routes/contacts');
const campaignRoutes = require('./routes/campaigns')(client);
const aiConfigRoutes = require('./routes/aiConfig');
const statsRoutes = require('./routes/stats');

app.use('/api/contacts', contactRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ai-config', aiConfigRoutes);
app.use('/api/stats', statsRoutes);

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrCodeData = qr;
    clientStatus = 'QR_READY';
});

client.on('ready', () => {
    console.log('Client is ready!');
    qrCodeData = null;
    clientStatus = 'CONNECTED';
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
    clientStatus = 'AUTH_FAILURE';
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    clientStatus = 'DISCONNECTED';
});

client.on('message_ack', async (msg, ack) => {
    // ack: 0 = error, 1 = sent, 2 = delivered, 3 = read
    let status = 'SENT';
    if (ack === 2) status = 'DELIVERED';
    if (ack === 3) status = 'READ';

    try {
        await MessageLog.findOneAndUpdate(
            { messageId: msg.id._serialized },
            { status: status }
        );
    } catch (err) {
        console.error('Error updating message ack:', err);
    }
});

client.on('message', async (msg) => {
    console.log(`📩 Nouveau message de ${msg.from}: ${msg.body}`);

    // Log the received message
    try {
        await MessageLog.create({
            messageId: msg.id._serialized,
            from: msg.from,
            to: msg.to,
            body: msg.body,
            type: 'RECEIVED',
            status: 'SENT'
        });

        // Update last sent message to this contact as REPLIED
        await MessageLog.findOneAndUpdate(
            { to: msg.from, type: 'SENT' },
            { status: 'REPLIED' },
            { sort: { timestamp: -1 } }
        );

        // Fetch AI Config
        const config = await AIConfig.getOrCreate();

        // 1. Send to n8n if needed (optional flow)
        if (config.n8nWebhookUrl) {
            try {
                await axios.post(config.n8nWebhookUrl, {
                    sender: msg.from,
                    content: msg.body,
                    timestamp: new Date()
                });
                console.log('✅ Message envoyé à n8n');
            } catch (error) {
                // Silently fail if n8n is not running
            }
        }

        // 2. AI Auto-Reply
        if (config.autoReplyEnabled && config.openaiKey) {
            const openai = new OpenAI({ apiKey: config.openaiKey });
            
            const completion = await openai.chat.completions.create({
                model: config.model || "gpt-4o",
                messages: [
                    { role: "system", content: `${config.systemPrompt}\n\nKnowledge Base:\n${config.knowledgeBase}` },
                    { role: "user", content: msg.body }
                ],
            });

            const replyText = completion.choices[0].message.content;
            const reply = await msg.reply(replyText);

            // Log the AI reply
            await MessageLog.create({
                messageId: reply.id._serialized,
                from: reply.from,
                to: reply.to,
                body: replyText,
                type: 'SENT',
                status: 'SENT'
            });
            
            console.log('🤖 AI Replied:', replyText);
        }

    } catch (error) {
        console.error('❌ Error handling message:', error.message);
    }
});

client.initialize();

// API Endpoints
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        whatsapp: clientStatus,
        message: 'Backend is running' 
    });
});

app.get('/api/whatsapp/qr', async (req, res) => {
    if (qrCodeData) {
        try {
            const url = await qrcode.toDataURL(qrCodeData);
            res.json({ qr: url });
        } catch (err) {
            res.status(500).json({ error: 'Failed to generate QR code' });
        }
    } else {
        res.json({ qr: null, status: clientStatus });
    }
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/whaweb';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});