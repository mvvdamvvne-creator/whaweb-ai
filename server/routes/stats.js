const express = require('express');
const router = express.Router();
const MessageLog = require('../models/MessageLog');
const Contact = require('../models/Contact');

router.get('/summary', async (req, res) => {
    try {
        const totalSent = await MessageLog.countDocuments({ type: 'SENT' });
        const totalRead = await MessageLog.countDocuments({ status: 'READ' });
        const totalReplied = await MessageLog.countDocuments({ status: 'REPLIED' });
        const totalContacts = await Contact.countDocuments();

        // Calculate rates
        const openRate = totalSent > 0 ? (totalRead / totalSent * 100).toFixed(1) : 0;
        const replyRate = totalSent > 0 ? (totalReplied / totalSent * 100).toFixed(1) : 0;

        res.json({
            totalSent,
            openRate: `${openRate}%`,
            replyRate: `${replyRate}%`,
            totalContacts
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/recent', async (req, res) => {
    try {
        const recentMessages = await MessageLog.find()
            .sort({ timestamp: -1 })
            .limit(10);
        res.json(recentMessages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/chart', async (req, res) => {
    try {
        // Simple 7-day volume chart data
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const stats = await MessageLog.aggregate([
            { $match: { timestamp: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const chartData = stats.map(s => ({
            name: days[new Date(s._id).getDay()],
            messages: s.count
        }));

        res.json(chartData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
