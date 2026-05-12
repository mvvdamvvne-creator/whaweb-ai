const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const MessageLog = require('../models/MessageLog');

module.exports = (whatsappClient) => {
    // Send Campaign
    router.post('/send', async (req, res) => {
        const { segment, message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        try {
            let query = {};
            if (segment && segment !== 'Tous les contacts') {
                query = { tags: segment };
            }

            const contacts = await Contact.find(query);
            
            if (contacts.length === 0) {
                return res.status(404).json({ message: 'No contacts found for this segment' });
            }

            let sentCount = 0;
            let failedCount = 0;

            for (const contact of contacts) {
                try {
                    let chatId = contact.phone.replace('+', '');
                    if (!chatId.includes('@c.us')) {
                        chatId += '@c.us';
                    }

                    const sentMsg = await whatsappClient.sendMessage(chatId, message);
                    
                    // Log the sent message
                    await MessageLog.create({
                        messageId: sentMsg.id._serialized,
                        to: chatId,
                        from: sentMsg.from,
                        body: message,
                        type: 'SENT',
                        status: 'SENT',
                        campaignName: req.body.projectName || 'Default Campaign'
                    });

                    sentCount++;
                    await new Promise(resolve => setTimeout(resolve, 2000)); 
                } catch (err) {
                    console.error(`Failed to send to ${contact.phone}:`, err);
                    failedCount++;
                }
            }

            res.json({ 
                message: 'Campaign processed', 
                sent: sentCount, 
                failed: failedCount,
                total: contacts.length
            });

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    return router;
};
