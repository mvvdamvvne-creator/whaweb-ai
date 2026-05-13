const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Get all contacts for the authenticated user
router.get('/', async (req, res) => {
    try {
        const contacts = await Contact.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a contact
router.post('/', async (req, res) => {
    const contact = new Contact({
        userId: req.user._id,
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
        console.log(`Attempting bulk import for user ${req.user._id}. Contacts count: ${req.body.contacts?.length}`);
        
        if (!req.body.contacts || !Array.isArray(req.body.contacts)) {
            return res.status(400).json({ message: "Données de contacts invalides" });
        }

        const contacts = req.body.contacts.map(c => ({
            ...c,
            userId: req.user._id
        }));

        const result = await Contact.insertMany(contacts, { ordered: false });
        console.log(`Bulk import successful: ${result.length} contacts created`);
        res.status(201).json({ message: `${result.length} contacts importés`, count: result.length });
    } catch (err) {
        console.error("Bulk import error details:");
        console.error("- Error Name:", err.name);
        console.error("- Error Message:", err.message);
        
        // If some fail (e.g. duplicates), we still return success for those that worked
        if (err.writeErrors || err.name === 'BulkWriteError' || err.name === 'MongoBulkWriteError') {
            const insertedCount = err.result?.nInserted || err.result?.insertedCount || (err.insertedDocs ? err.insertedDocs.length : 0);
            const writeErrors = err.writeErrors || (err.result && err.result.writeErrors) || [];
            
            console.error(`- Inserted: ${insertedCount}`);
            console.error(`- Write Errors: ${writeErrors.length}`);
            if (writeErrors.length > 0) {
                console.error("- First Write Error:", JSON.stringify(writeErrors[0]));
            }

            let message = `${insertedCount} contacts importés avec quelques erreurs`;
            
            // Check for duplicate key errors
            if (writeErrors.some(e => e.code === 11000 || (e.errmsg && e.errmsg.includes('E11000')))) {
                message += " (certains contacts existent déjà)";
            } else if (writeErrors.length > 0) {
                // If it's not a duplicate, maybe it's a validation error
                message += ` (Erreur: ${writeErrors[0].errmsg || 'Validation échouée'})`;
            }
            
            return res.status(207).json({ 
                message: message, 
                count: insertedCount 
            });
        }
        
        console.error("- General Error Stack:", err.stack);
        res.status(400).json({ message: err.message });
    }
});

// Delete a contact (ensure it belongs to the user)
router.delete('/:id', async (req, res) => {
    try {
        const contact = await Contact.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!contact) return res.status(404).json({ message: 'Contact not found or unauthorized' });
        res.json({ message: 'Contact deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all unique tags for the user
router.get('/tags', async (req, res) => {
    try {
        const tags = await Contact.distinct('tags', { userId: req.user._id });
        res.json(tags);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
