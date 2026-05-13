const mongoose = require('mongoose');

const aiConfigSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
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

// Update to ensure one config per user
aiConfigSchema.statics.getOrCreate = async function(userId) {
    if (!userId) throw new Error('userId is required for AIConfig.getOrCreate');
    let config = await this.findOne({ userId });
    if (!config) {
        config = await this.create({ userId });
    }
    return config;
};

module.exports = mongoose.model('AIConfig', aiConfigSchema);
