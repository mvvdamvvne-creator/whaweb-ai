const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const MessageLog = require('../models/MessageLog');
const whatsappManager = require('../whatsappManager');

// Send Campaign
router.post('/send', async (req, res) => {
    const { segment, message } = req.body;
    const userId = req.user._id;

    if (!message) {
        return res.status(400).json({ message: 'Message is required' });
    }

    try {
        const whatsappClient = await whatsappManager.getClient(userId);
        
        if (whatsappManager.getStatus(userId) !== 'CONNECTED') {
            return res.status(400).json({ message: 'WhatsApp is not connected' });
        }

        let query = { userId: userId };
        if (segment && segment !== 'Tous les contacts') {
            query.tags = segment;
        }

        const contacts = await Contact.find(query);
        
        if (contacts.length === 0) {
            return res.status(404).json({ message: 'No contacts found for this segment' });
        }

        let sentCount = 0;
        let failedCount = 0;

        // Process in background to avoid timeout
        res.json({ 
            message: 'Campaign started', 
            total: contacts.length
        });

        for (const contact of contacts) {
            try {
                let chatId = contact.phone.replace('+', '');
                if (!chatId.includes('@c.us')) {
                    chatId += '@c.us';
                }

                const sentMsg = await whatsappClient.sendMessage(chatId, message);
                
                await MessageLog.create({
                    userId: userId,
                    messageId: sentMsg.id._serialized,
                    to: chatId,
                    from: sentMsg.from,
                    body: message,
                    type: 'SENT',
                    status: 'SENT',
                    campaignName: req.body.projectName || 'Default Campaign'
                });

                sentCount++;
                // Delay between messages to avoid ban
                await new Promise(resolve => setTimeout(resolve, 3000)); 
            } catch (err) {
                console.error(`[User ${userId}] Failed to send to ${contact.phone}:`, err);
                failedCount++;
            }
        }

        console.log(`[User ${userId}] Campaign finished: ${sentCount} sent, ${failedCount} failed`);

    } catch (err) {
        if (!res.headersSent) {
            res.status(500).json({ message: err.message });
        }
    }
});

module.exports = router;
