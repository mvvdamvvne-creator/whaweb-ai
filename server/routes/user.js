const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `profile-${req.user._id}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
    }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update profile details
router.put('/profile', auth, async (req, res) => {
    try {
        const { username, email, fullName } = req.body;
        const user = await User.findById(req.user._id);

        if (username) user.username = username;
        if (email) user.email = email;
        if (fullName !== undefined) user.fullName = fullName;

        await user.save();
        res.json({ message: 'Profile updated successfully', user: { id: user._id, username: user.username, email: user.email, fullName: user.fullName, profilePicture: user.profilePicture } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Upload profile picture
router.post('/profile/picture', auth, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a file' });
        }

        const profilePicturePath = `/uploads/${req.file.filename}`;
        await User.findByIdAndUpdate(req.user._id, { profilePicture: profilePicturePath });

        res.json({ message: 'Profile picture updated', profilePicture: profilePicturePath });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

const Contact = require('../models/Contact');
const MessageLog = require('../models/MessageLog');
const AIConfig = require('../models/AIConfig');
const whatsappManager = require('../whatsappManager');

// ... (existing multer config and other routes)

// Delete account and all associated data
router.delete('/profile', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Delete all associated data in parallel
        await Promise.all([
            Contact.deleteMany({ userId }),
            MessageLog.deleteMany({ userId }),
            AIConfig.deleteMany({ userId })
        ]);

        // 2. Remove from User model
        await User.findByIdAndDelete(userId);

        // 3. Cleanup WhatsApp session (Manager handles session deletion if logic is there, but at least remove from memory)
        // Note: The files in 'sessions/user_<id>' will remain but won't be accessible.
        // A more thorough cleanup could be added to whatsappManager if needed.
        if (whatsappManager.clients.has(userId.toString())) {
            const client = whatsappManager.clients.get(userId.toString());
            try {
                await client.destroy();
            } catch (err) {
                console.error(`Error destroying client for ${userId} during deletion:`, err.message);
            }
            whatsappManager.clients.delete(userId.toString());
            whatsappManager.statuses.delete(userId.toString());
            whatsappManager.qrCodes.delete(userId.toString());
        }

        res.json({ message: 'Compte et données supprimés avec succès' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
