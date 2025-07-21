// Voice recording and emotion analysis
const startBtn = document.getElementById('start-recording');
const stopBtn = document.getElementById('stop-recording');
const voiceText = document.getElementById('voice-text');

let recognition;
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    startBtn.onclick = () => {
        recognition.start();
        startBtn.disabled = true;
        stopBtn.disabled = false;
    };

    stopBtn.onclick = () => {
        recognition.stop();
        startBtn.disabled = false;
        stopBtn.disabled = true;
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        voiceText.value = transcript;
        analyzeVoiceEmotion(transcript);
    };

    recognition.onerror = (event) => {
        alert('Speech recognition error: ' + event.error);
        startBtn.disabled = false;
        stopBtn.disabled = true;
    };
} else {
    startBtn.disabled = true;
    stopBtn.disabled = true;
    voiceText.placeholder = 'Speech recognition not supported in this browser.';
}

async function analyzeVoiceEmotion(text) {
    if (!text.trim()) return;
    const res = await fetch('/api/emotions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    const data = await res.json();
    window.updateEmotionDisplay && window.updateEmotionDisplay(data.result || {});
}
