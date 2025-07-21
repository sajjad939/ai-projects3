const mongoose = require('mongoose');

const JournalSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    text: { type: String, required: true },
    image: { type: String }, // base64 or URL
    audio: { type: String }, // base64 or URL
    createdAt: { type: Date, default: Date.now },
    emotions: { type: Object } // optional, for AI analysis
});

module.exports = mongoose.model('Journal', JournalSchema);
