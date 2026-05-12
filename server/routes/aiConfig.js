const express = require('express');
const router = express.Router();
const AIConfig = require('../models/AIConfig');

// Get AI Config
router.get('/', async (req, res) => {
    try {
        const config = await AIConfig.getOrCreate();
        res.json(config);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update AI Config
router.post('/', async (req, res) => {
    try {
        let config = await AIConfig.getOrCreate();
        
        config.openaiKey = req.body.openaiKey !== undefined ? req.body.openaiKey : config.openaiKey;
        config.systemPrompt = req.body.systemPrompt !== undefined ? req.body.systemPrompt : config.systemPrompt;
        config.knowledgeBase = req.body.knowledgeBase !== undefined ? req.body.knowledgeBase : config.knowledgeBase;
        config.model = req.body.model !== undefined ? req.body.model : config.model;
        config.autoReplyEnabled = req.body.autoReplyEnabled !== undefined ? req.body.autoReplyEnabled : config.autoReplyEnabled;
        config.n8nWebhookUrl = req.body.n8nWebhookUrl !== undefined ? req.body.n8nWebhookUrl : config.n8nWebhookUrl;
        config.updatedAt = Date.now();

        const updatedConfig = await config.save();
        res.json(updatedConfig);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
