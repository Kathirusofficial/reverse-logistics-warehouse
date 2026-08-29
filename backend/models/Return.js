const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    category: { type: String, required: true },
    productValue: { type: Number, required: true, default: 0 },
    returnReason: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Received', 'Inspection', 'Repair', 'Resale', 'Scrap'],
        default: 'Received'
    },
    warehouse: { type: String, enum: ['Chennai', 'Delhi', 'Mumbai'], required: true },
    section: { type: String, default: 'A1' },
    rack: { type: String, default: 'R1' },
    manufactureDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    lastHandledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    company: { type: String, default: 'Warelytics' },
    imageUrl: { type: String },
    processingStartTime: { type: Date, default: Date.now },
    isDelayed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Return', returnSchema);