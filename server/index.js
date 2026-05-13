const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Manager and Auth
const whatsappManager = require('./whatsappManager');
const auth = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const contactRoutes = require('./routes/contacts');
const campaignRoutes = require('./routes/campaigns');
const aiConfigRoutes = require('./routes/aiConfig');
const statsRoutes = require('./routes/stats');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/contacts', auth, contactRoutes);
app.use('/api/campaigns', auth, campaignRoutes);
app.use('/api/ai-config', auth, aiConfigRoutes);
app.use('/api/stats', auth, statsRoutes);

// API Endpoints
app.get('/api/health', auth, async (req, res) => {
    // Attempt to get client to trigger initialization if not already started
    await whatsappManager.getClient(req.user._id);
    
    res.json({ 
        status: 'OK', 
        whatsapp: whatsappManager.getStatus(req.user._id),
        user: req.user.username,
        message: 'Backend is running' 
    });
});

app.get('/api/whatsapp/qr', auth, async (req, res) => {
    const qr = await whatsappManager.getQrCode(req.user._id);
    res.json({ qr, status: whatsappManager.getStatus(req.user._id) });
});

app.get('/api/whatsapp/screenshot', auth, async (req, res) => {
    const screenshot = await whatsappManager.getScreenshot(req.user._id);
    if (!screenshot) return res.status(404).json({ error: 'Screenshot not available' });
    res.json({ screenshot });
});

app.post('/api/whatsapp/click', auth, async (req, res) => {
    const { x, y } = req.body;
    const success = await whatsappManager.sendClick(req.user._id, x, y);
    res.json({ success });
});

app.post('/api/whatsapp/type', auth, async (req, res) => {
    const { text } = req.body;
    const success = await whatsappManager.sendText(req.user._id, text);
    res.json({ success });
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/whaweb';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
