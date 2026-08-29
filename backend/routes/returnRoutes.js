const express = require('express');
const router = express.Router();
const Return = require('../models/Return');
const Activity = require('../models/Activity');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const moment = require('moment');

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// GET returns with advanced filters, searching, and pagination
router.get('/', async (req, res) => {
    try {
        const { search = '', status = '', warehouse = '', startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;
        const query = {};
        
        if (search) query.productName = { $regex: search, $options: 'i' };
        if (status) query.status = status;
        if (warehouse) query.warehouse = warehouse;
        if (startDate && endDate) {
            query.createdAt = { 
                $gte: moment(startDate).startOf('day').toDate(),
                $lte: moment(endDate).endOf('day').toDate()
            };
        }

        const data = await Return.find(query)
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Return.countDocuments(query);
        
        // SLA detection (client-side property update)
        const enrichedData = data.map(item => {
            const daysOpen = moment().diff(moment(item.createdAt), 'days');
            const isDelayed = (item.status === 'Received' && daysOpen > 2) || (item.status === 'Inspection' && daysOpen > 3);
            return { ...item.toObject(), isDelayed };
        });

        res.json({ data: enrichedData, totalPages: Math.ceil(count / limit), totalItems: count });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching returns' });
    }
});

// GET automated suggestion for a return item
router.get('/:id/suggest', async (req, res) => {
    try {
        const item = await Return.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        let suggestion = 'Inspection';
        const reason = item.returnReason.toLowerCase();
        
        if (reason.includes('damage') || reason.includes('broken') || reason.includes('shattered')) {
            suggestion = 'Scrap';
        } else if (item.productValue > 500 && (reason.includes('defect') || reason.includes('faulty'))) {
            suggestion = 'Repair';
        } else if (item.productValue < 100) {
            suggestion = 'Scrap';
        } else if (reason.includes('no longer needed') || reason.includes('wrong item')) {
            suggestion = 'Resale';
        }

        res.json({ suggestion });
    } catch (err) {
        res.status(500).json({ message: 'Error suggesting status' });
    }
});

// Auto-move lifecycle status
router.post('/:id/auto-move', async (req, res) => {
    try {
        const item = await Return.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const statusOrder = ['Received', 'Inspection', 'Repair', 'Resale']; // Scrap is end of road
        const currentIndex = statusOrder.indexOf(item.status);
        
        if (currentIndex === -1 || currentIndex === statusOrder.length - 1) {
            return res.status(400).json({ message: 'Cannot auto-move from current status' });
        }

        const newStatus = statusOrder[currentIndex + 1];
        item.status = newStatus;
        await item.save();
        
        await Activity.create({ returnId: item._id, action: `Auto-moved to ${newStatus}` });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error auto-moving status' });
    }
});

// ADD return with image support (Admin only)
router.post('/add', auth, upload.single('image'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Only admins can log new returns' });
        }
        const returnData = { 
            ...req.body,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null
        };
        const newReturn = new Return(returnData);
        await newReturn.save();
        await Activity.create({ returnId: newReturn._id, action: `Item added at ${newReturn.warehouse}` });
        res.status(201).json(newReturn);
    } catch (err) {
        res.status(500).json({ message: 'Error adding return' });
    }
});

// UPDATE status with employee tracking
router.put('/:id/status', async (req, res) => {
    try {
        const { status, workerId } = req.body;
        const item = await Return.findByIdAndUpdate(req.params.id, { 
            status,
            lastHandledBy: workerId || undefined
        }, { new: true });

        if (workerId) {
            await User.findByIdAndUpdate(workerId, { $inc: { handledCount: 1 } });
        }

        await Activity.create({ returnId: item._id, action: `Status updated to ${status}` });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: 'Error updating status' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await Return.findByIdAndDelete(req.params.id);
        await Activity.deleteMany({ returnId: req.params.id });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

module.exports = router;