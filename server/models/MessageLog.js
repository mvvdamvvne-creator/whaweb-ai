const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messageId: String,
    to: String,
    from: String,
    body: String,
    type: {
        type: String,
        enum: ['SENT', 'RECEIVED'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'REPLIED'],
        default: 'PENDING'
    },
    campaignName: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MessageLog', messageLogSchema);
