const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    returnId: { type: mongoose.Schema.Types.ObjectId, ref: 'Return', required: true },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);