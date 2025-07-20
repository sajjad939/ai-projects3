// Webcam image capture and emotion analysis (ChatGPT-style)
const video = document.getElementById('webcam');
const startWebcamBtn = document.getElementById('start-webcam');
const captureBtn = document.getElementById('capture-image');
const imgEl = document.getElementById('captured-image');
let stream = null;

startWebcamBtn.onclick = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.style.display = 'block';
        captureBtn.style.display = 'inline-block';
        startWebcamBtn.style.display = 'none';
    }
};

captureBtn.onclick = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/png');
    imgEl.src = base64;
    imgEl.style.display = 'block';
    // Stop webcam after capture
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        video.style.display = 'none';
        captureBtn.style.display = 'none';
        startWebcamBtn.style.display = 'inline-block';
    }
    // Send to backend for emotion analysis
    const res = await fetch('/api/emotions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64.split(',')[1] })
    });
    const data = await res.json();
    window.updateEmotionDisplay && window.updateEmotionDisplay(data.result || {});
};
