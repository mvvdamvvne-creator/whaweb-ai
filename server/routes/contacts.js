const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Get all contacts
router.get('/', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a contact
router.post('/', async (req, res) => {
    const contact = new Contact({
        name: req.body.name,
        phone: req.body.phone,
        tags: req.body.tags
    });

    try {
        const newContact = await contact.save();
        res.status(201).json(newContact);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Bulk create contacts
router.post('/bulk', async (req, res) => {
    try {
        const contacts = req.body.contacts; // Array of {name, phone, tags}
        const result = await Contact.insertMany(contacts, { ordered: false });
        res.status(201).json({ message: `${result.length} contacts importés`, count: result.length });
    } catch (err) {
        // If some fail (e.g. duplicates), we still return success for those that worked
        if (err.writeErrors) {
            const insertedCount = err.result.nInserted;
            return res.status(207).json({ 
                message: `${insertedCount} contacts importés avec quelques erreurs`, 
                count: insertedCount 
            });
        }
        res.status(400).json({ message: err.message });
    }
});

// Delete a contact
router.delete('/:id', async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) return res.status(404).json({ message: 'Contact not found' });
        res.json({ message: 'Contact deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all unique tags
router.get('/tags', async (req, res) => {
    try {
        const tags = await Contact.distinct('tags');
        res.json(tags);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
