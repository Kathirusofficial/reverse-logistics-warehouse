const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET all workers performance
router.get('/performance', async (req, res) => {
    try {
        const workers = await User.find({ role: 'worker' }).select('name email handledCount');
        res.json(workers);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching performance' });
    }
});

module.exports = router;
