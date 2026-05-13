const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const MessageLog = require('./models/MessageLog');
const AIConfig = require('./models/AIConfig');
const axios = require('axios');
const OpenAI = require('openai');

class WhatsAppManager {
    constructor() {
        this.clients = new Map();
        this.qrCodes = new Map();
        this.statuses = new Map();
    }

    async getClient(userId) {
        if (this.clients.has(userId.toString())) {
            return this.clients.get(userId.toString());
        }
        return this.initClient(userId);
    }

    async initClient(userId) {
        console.log(`⏳ Initialisation du client WhatsApp pour l'utilisateur ${userId}...`);
        
        const client = new Client({
            authStrategy: new LocalAuth({ 
                clientId: `user_${userId}`,
                dataPath: path.join(__dirname, 'sessions')
            }),
            puppeteer: {
                headless: true,
                defaultViewport: {
                    width: 1440,
                    height: 900
                },
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

        this.clients.set(userId.toString(), client);
        this.statuses.set(userId.toString(), 'INITIALIZING');

        client.on('qr', (qr) => {
            console.log(`QR RECEIVED for ${userId}`);
            this.qrCodes.set(userId.toString(), qr);
            this.statuses.set(userId.toString(), 'QR_READY');
        });

        client.on('ready', () => {
            console.log(`Client is ready for ${userId}!`);
            this.qrCodes.delete(userId.toString());
            this.statuses.set(userId.toString(), 'CONNECTED');
        });

        client.on('authenticated', () => {
            console.log(`AUTHENTICATED for ${userId}`);
        });

        client.on('auth_failure', msg => {
            console.error(`AUTHENTICATION FAILURE for ${userId}`, msg);
            this.statuses.set(userId.toString(), 'AUTH_FAILURE');
        });

        client.on('disconnected', (reason) => {
            console.log(`Client was logged out for ${userId}`, reason);
            this.statuses.set(userId.toString(), 'DISCONNECTED');
            this.clients.delete(userId.toString());
        });

        client.on('message_ack', async (msg, ack) => {
            let status = 'SENT';
            if (ack === 2) status = 'DELIVERED';
            if (ack === 3) status = 'READ';

            try {
                await MessageLog.findOneAndUpdate(
                    { messageId: msg.id._serialized, userId: userId },
                    { status: status }
                );
            } catch (err) {
                console.error(`Error updating message ack for ${userId}:`, err);
            }
        });

        client.on('message', async (msg) => {
            await this.handleIncomingMessage(userId, msg);
        });

        client.initialize().catch(err => {
            console.error(`Failed to initialize client for ${userId}:`, err.message);
            this.statuses.set(userId.toString(), 'ERROR');
        });

        return client;
    }

    async handleIncomingMessage(userId, msg) {
        console.log(`📩 [User: ${userId}] Message de ${msg.from}: ${msg.body}`);

        try {
            const contactInfo = await msg.getContact();
            const resolvedId = contactInfo.number || msg.from.split('@')[0];
            const phoneNumber = resolvedId.replace(/\D/g, ''); 

            await MessageLog.create({
                userId: userId,
                messageId: msg.id._serialized,
                from: msg.from,
                to: msg.to,
                body: msg.body,
                type: 'RECEIVED',
                status: 'SENT'
            });

            const contactId = msg.from; 
            const cleanId = contactId.split('@')[0];
            const searchPattern = phoneNumber.length > 8 ? phoneNumber.slice(-8) : phoneNumber;

            await MessageLog.findOneAndUpdate(
                { 
                    userId: userId,
                    $or: [
                        { to: { $regex: cleanId } },
                        { to: { $regex: searchPattern } }
                    ],
                    type: 'SENT' 
                },
                { status: 'REPLIED' },
                { sort: { timestamp: -1 } }
            );

            const config = await AIConfig.getOrCreate(userId);

            if (config.n8nWebhookUrl) {
                try {
                    await axios.post(config.n8nWebhookUrl, {
                        userId: userId,
                        sender: msg.from,
                        content: msg.body,
                        timestamp: new Date()
                    });
                } catch (error) {}
            }

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

                await MessageLog.create({
                    userId: userId,
                    messageId: reply.id._serialized,
                    from: reply.from,
                    to: reply.to,
                    body: replyText,
                    type: 'SENT',
                    status: 'SENT'
                });
            }
        } catch (error) {
            console.error(`❌ Error handling message for user ${userId}:`, error.message);
        }
    }

    async getScreenshot(userId) {
        const client = this.clients.get(userId.toString());
        if (!client || !client.pupPage) return null;
        
        try {
            const screenshot = await client.pupPage.screenshot({
                encoding: 'base64',
                type: 'jpeg',
                quality: 80
            });
            return screenshot;
        } catch (err) {
            console.error(`Error taking screenshot for ${userId}:`, err.message);
            return null;
        }
    }

    async sendClick(userId, x, y) {
        const client = this.clients.get(userId.toString());
        if (!client || !client.pupPage) return false;

        try {
            await client.pupPage.mouse.click(x, y);
            return true;
        } catch (err) {
            console.error(`Error sending click for ${userId}:`, err.message);
            return false;
        }
    }

    async sendText(userId, text) {
        const client = this.clients.get(userId.toString());
        if (!client || !client.pupPage) return false;

        try {
            if (text === 'Backspace') {
                await client.pupPage.keyboard.press('Backspace');
            } else if (text === 'Enter') {
                await client.pupPage.keyboard.press('Enter');
            } else {
                await client.pupPage.keyboard.type(text);
            }
            return true;
        } catch (err) {
            console.error(`Error sending text for ${userId}:`, err.message);
            return false;
        }
    }

    getStatus(userId) {
        return this.statuses.get(userId.toString()) || 'DISCONNECTED';
    }

    async getQrCode(userId) {
        const qr = this.qrCodes.get(userId.toString());
        if (!qr) return null;
        return qrcode.toDataURL(qr);
    }
}

module.exports = new WhatsAppManager();
