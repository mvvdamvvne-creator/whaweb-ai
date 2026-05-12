const mongoose = require('mongoose');

const aiConfigSchema = new mongoose.Schema({
    openaiKey: {
        type: String,
        default: ''
    },
    systemPrompt: {
        type: String,
        default: "Tu es un assistant commercial utile. Tu réponds de manière professionnelle et concise."
    },
    knowledgeBase: {
        type: String,
        default: ''
    },
    model: {
        type: String,
        default: 'gpt-4o'
    },
    autoReplyEnabled: {
        type: Boolean,
        default: false
    },
    n8nWebhookUrl: {
        type: String,
        default: 'http://localhost:5678/webhook/whaweb'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Since we only need one config, we can ensure only one document exists
aiConfigSchema.statics.getOrCreate = async function() {
    let config = await this.findOne();
    if (!config) {
        config = await this.create({});
    }
    return config;
};

module.exports = mongoose.model('AIConfig', aiConfigSchema);
