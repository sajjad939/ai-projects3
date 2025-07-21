// Digital Tasbih functionality for Mirror of Heart
const tasbihSection = document.createElement('section');
tasbihSection.id = 'tasbih-section';
tasbihSection.innerHTML = `
    <h2>Digital Tasbih</h2>
    <div id="tasbih-count" style="font-size:2rem; margin-bottom:1rem;">0</div>
    <button id="tasbih-increment">Count</button>
    <button id="tasbih-reset">Reset</button>
`;
document.querySelector('.container').appendChild(tasbihSection);

const countDisplay = document.getElementById('tasbih-count');
const incrementBtn = document.getElementById('tasbih-increment');
const resetBtn = document.getElementById('tasbih-reset');
let tasbihCount = parseInt(localStorage.getItem('tasbihCount')) || 0;
countDisplay.textContent = tasbihCount;

// Sync with backend
async function syncTasbihCount() {
    await fetch('/api/tasbih/count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-user' })
    });
}

// Increment count
incrementBtn.onclick = () => {
    tasbihCount++;
    countDisplay.textContent = tasbihCount;
    localStorage.setItem('tasbihCount', tasbihCount);
    syncTasbihCount();
    // Optional feedback
    if (window.navigator.vibrate) window.navigator.vibrate(50);
    // Optional tick sound
    const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
    audio.play();
};

// Reset count
resetBtn.onclick = () => {
    tasbihCount = 0;
    countDisplay.textContent = tasbihCount;
    localStorage.setItem('tasbihCount', tasbihCount);
};

// Persist count across sessions
window.addEventListener('load', () => {
    tasbihCount = parseInt(localStorage.getItem('tasbihCount')) || 0;
    countDisplay.textContent = tasbihCount;
});
