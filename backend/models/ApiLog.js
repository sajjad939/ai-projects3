const mongoose = require('mongoose');

const ApiLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    endpoint: { type: String },
    method: { type: String },
    timestamp: { type: Date, default: Date.now },
    status: { type: Number },
    details: { type: Object }
});

module.exports = mongoose.model('ApiLog', ApiLogSchema);
