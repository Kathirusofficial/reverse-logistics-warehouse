const express = require('express');
const router = express.Router();
const Return = require('../models/Return');

// Grouped by Day
router.get('/daily', async (req, res) => {
    try {
        const data = await Return.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$returnDate" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } },
            { $limit: 15 } // Last 15 active days
        ]);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Chart error' });
    }
});

// Grouped by Week
router.get('/weekly', async (req, res) => {
    try {
        const data = await Return.aggregate([
            {
                $group: {
                    _id: { $week: "$returnDate" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Chart error' });
    }
});

// Grouped by Month
router.get('/monthly', async (req, res) => {
    try {
        const data = await Return.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$returnDate" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Chart error' });
    }
});

module.exports = router;
