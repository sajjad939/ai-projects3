const mongoose = require('mongoose');

const JournalEntrySchema = new mongoose.Schema({
    title: {
        type: String,
        required: false
    },
    text: {
        type: String,
        required: true
    },
    image: {
        type: String // Store image as base64 or URL
    },
    audio: {
        type: String // Store audio as base64 or URL
    },
    tags: [{
        type: String
    }],
    emotion: {
        type: [String], // Array for multiple detected emotions
        default: []
    },
    location: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);
