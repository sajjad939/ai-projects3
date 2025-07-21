const { analyzeTextEmotion, analyzeImageEmotion, analyzeAudioEmotion } = require('../utils/emotionAnalysis');

exports.analyzeEmotion = async (req, res) => {
    try {
        const { text, image, audio } = req.body;
        let result = {};
        if (text) {
            result = await analyzeTextEmotion(text);
        } else if (image) {
            result = await analyzeImageEmotion(image);
        } else if (audio) {
            result = await analyzeAudioEmotion(audio);
        } else {
            return res.status(400).json({ error: 'No input provided for analysis' });
        }
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: 'Emotion analysis failed' });
    }
};
