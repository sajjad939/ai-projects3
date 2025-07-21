const API_BASE = '/api';

// Submit text journal
document.getElementById('submit-journal').onclick = async () => {
    const text = document.getElementById('journal-input').value;
    if (!text.trim()) return alert('Please enter your thoughts.');
    const res = await fetch(`${API_BASE}/journals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId: 'demo-user' })
    });
    const data = await res.json();
    updateEmotionDisplay(data.entry?.emotions || {});
};

// Submit voice journal
document.getElementById('submit-voice').onclick = async () => {
    const text = document.getElementById('voice-text').value;
    if (!text.trim()) return alert('Please record or enter your voice text.');
    const res = await fetch(`${API_BASE}/journals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId: 'demo-user' })
    });
    const data = await res.json();
    updateEmotionDisplay(data.entry?.emotions || {});
};

// Update emotion display
function updateEmotionDisplay(emotions) {
    const el = document.getElementById('emotion-display');
    if (!emotions || Object.keys(emotions).length === 0) {
        el.textContent = 'No emotion detected yet.';
    } else {
        el.textContent = `Emotion: ${emotions.emotion || 'Unknown'} (Confidence: ${emotions.confidence || 'N/A'})`;
    }
}
