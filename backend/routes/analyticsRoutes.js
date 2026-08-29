const express = require('express');
const router = express.Router();
const Return = require('../models/Return');
const moment = require('moment');

// Advanced Analytics
router.get('/advanced', async (req, res) => {
    try {
        const now = moment();
        const last7Days = await Return.countDocuments({ createdAt: { $gte: now.clone().subtract(7, 'days').toDate() } });
        const prev7Days = await Return.countDocuments({ 
            createdAt: { 
                $gte: now.clone().subtract(14, 'days').toDate(),
                $lt: now.clone().subtract(7, 'days').toDate()
            } 
        });

        const trend = last7Days >= prev7Days ? 'Increasing' : 'Decreasing';

        // Reason distribution
        const reasonDist = await Return.aggregate([
            { $group: { _id: "$returnReason", count: { $sum: 1 } } }
        ]);

        // Top 5 products
        const topProducts = await Return.aggregate([
            { $group: { _id: "$productName", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Most active warehouse
        const activeWarehouse = await Return.aggregate([
            { $group: { _id: "$warehouse", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        // Peak return days (day of week)
        const peakDays = await Return.aggregate([
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            trend,
            reasonDist,
            topProducts,
            activeWarehouse: activeWarehouse[0] || { _id: 'N/A', count: 0 },
            peakDays
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching advanced analytics' });
    }
});

// KPI Metrics
router.get('/kpis', async (req, res) => {
    try {
        const total = await Return.countDocuments();
        const repaired = await Return.countDocuments({ status: { $in: ['Repair', 'Resale'] } });
        const scrapped = await Return.countDocuments({ status: 'Scrap' });

        const successRate = total > 0 ? ((repaired / total) * 100).toFixed(1) : 0;
        const scrapRate = total > 0 ? ((scrapped / total) * 100).toFixed(1) : 0;

        // Avg processing time (simulated logic)
        const avgProcessingTime = "1.5 Days"; 

        res.json({
            successRate: `${successRate}%`,
            scrapRate: `${scrapRate}%`,
            avgProcessingTime
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching KPIs' });
    }
});

module.exports = router;
