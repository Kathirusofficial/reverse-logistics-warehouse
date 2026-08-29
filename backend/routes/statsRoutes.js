const express = require('express');
const router = express.Router();
const Return = require('../models/Return');

router.get('/', async (req, res) => {
    try {
        const stats = await Return.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const summary = { total: await Return.countDocuments(), Received: 0, Inspection: 0, Repair: 0, Resale: 0, Scrap: 0 };
        stats.forEach(s => { summary[s._id] = s.count; });

        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;