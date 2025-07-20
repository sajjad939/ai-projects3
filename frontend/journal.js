// Journal functionality for Mirror of Heart
const journalInput = document.getElementById('journal-input');
const submitJournalBtn = document.getElementById('submit-journal');
const journalList = document.createElement('div');
journalList.id = 'journal-list';
journalList.style.maxHeight = '250px';
journalList.style.overflowY = 'auto';
document.getElementById('journal-section').appendChild(journalList);
const searchBar = document.getElementById('search-bar');
const exportBtn = document.getElementById('export-csv');
const darkToggle = document.getElementById('toggle-dark');
const languageSelect = document.getElementById('language-select');
let allEntries = [];
let currentLanguage = 'en';

const translations = {
    en: {
        journal: 'Text Journal',
        webcam: 'Webcam Emotion',
        voice: 'Voice Journal',
        detected: 'Detected Emotions',
        submit: 'Submit Journal',
        edit: 'Edit',
        delete: 'Delete',
        favorite: 'Favorite',
        tags: 'Tags',
        emotion: 'Emotion',
        export: 'Export CSV',
        dark: 'Dark Mode',
        search: 'Search journals by text, tag, or emotion...'
    },
    ur: {
        journal: 'متنی جرنل',
        webcam: 'ویب کیم جذبات',
        voice: 'آواز جرنل',
        detected: 'پائے گئے جذبات',
        submit: 'جرنل جمع کریں',
        edit: 'ترمیم',
        delete: 'حذف کریں',
        favorite: 'پسندیدہ',
        tags: 'ٹیگز',
        emotion: 'جذبہ',
        export: 'CSV برآمد کریں',
        dark: 'ڈارک موڈ',
        search: 'متن، ٹیگ یا جذبہ سے جرنل تلاش کریں...'
    },
    ar: {
        journal: 'يوميات نصية',
        webcam: 'مشاعر الكاميرا',
        voice: 'يوميات صوتية',
        detected: 'المشاعر المكتشفة',
        submit: 'إرسال اليوميات',
        edit: 'تعديل',
        delete: 'حذف',
        favorite: 'مفضل',
        tags: 'الوسوم',
        emotion: 'العاطفة',
        export: 'تصدير CSV',
        dark: 'الوضع الليلي',
        search: 'ابحث في اليوميات بالنص أو الوسوم أو العاطفة...'
    }
};

// Save journal entry
submitJournalBtn.onclick = async () => {
    const text = journalInput.value;
    if (!text.trim()) return alert('Please enter your thoughts.');
    const emotionTags = prompt('Add emotion tags (comma separated, optional):');
    const res = await fetch('/api/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId: 'demo-user', tags: emotionTags ? emotionTags.split(',').map(t => t.trim()) : [] })
    });
    journalInput.value = '';
    loadJournalEntries();
};

// Edit, delete, favorite journal entries
function createJournalEntryDiv(entry) {
    const div = document.createElement('div');
    div.className = 'journal-entry';
    div.tabIndex = 0;
    div.setAttribute('aria-label', `Journal entry on ${new Date(entry.createdAt).toLocaleString()}`);
    div.innerHTML = `<strong>${new Date(entry.createdAt).toLocaleString()}</strong><br>
        <span>${entry.text}</span><br>
        <em>Tags: ${entry.tags?.join(', ') || 'None'}</em><br>
        <span>Emotion: ${entry.emotions?.emotion || 'N/A'} (${entry.emotions?.confidence || ''})</span>`;
    // Actions
    const actions = document.createElement('div');
    actions.className = 'journal-actions';
    // Edit
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit entry');
    editBtn.onclick = () => editJournalEntry(entry);
    // Delete
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('aria-label', 'Delete entry');
    delBtn.onclick = () => deleteJournalEntry(entry._id);
    // Favorite
    const favBtn = document.createElement('button');
    favBtn.textContent = entry.favorite ? '★' : '☆';
    favBtn.className = 'favorite';
    favBtn.setAttribute('aria-label', 'Favorite entry');
    favBtn.onclick = () => toggleFavorite(entry._id);
    actions.append(editBtn, delBtn, favBtn);
    div.appendChild(actions);
    return div;
}

// Edit journal entry
async function editJournalEntry(entry) {
    const newText = prompt('Edit your entry:', entry.text);
    if (newText !== null) {
        await fetch(`/api/journals/${entry._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: newText })
        });
        loadJournalEntries();
    }
}

// Delete journal entry
async function deleteJournalEntry(id) {
    if (confirm('Delete this entry?')) {
        await fetch(`/api/journals/${id}`, { method: 'DELETE' });
        loadJournalEntries();
    }
}

// Toggle favorite
async function toggleFavorite(id) {
    await fetch(`/api/journals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: true })
    });
    loadJournalEntries();
}

// Search/filter
searchBar.oninput = () => {
    const val = searchBar.value.toLowerCase();
    const filtered = allEntries.filter(e =>
        e.text.toLowerCase().includes(val) ||
        (e.tags && e.tags.join(',').toLowerCase().includes(val)) ||
        (e.emotions && e.emotions.emotion && e.emotions.emotion.toLowerCase().includes(val))
    );
    renderJournalEntries(filtered);
};

// Export to CSV
exportBtn.onclick = () => {
    let csv = 'Date,Text,Tags,Emotion,Confidence\n';
    allEntries.forEach(e => {
        csv += `${new Date(e.createdAt).toLocaleString()},"${e.text}","${e.tags?.join(', ')}",${e.emotions?.emotion || ''},${e.emotions?.confidence || ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'journals.csv';
    a.click();
    URL.revokeObjectURL(url);
};

// Dark mode toggle
darkToggle.onclick = () => {
    document.body.classList.toggle('dark-mode');
};

function translateUI(lang) {
    document.querySelector('#journal-section h2').textContent = translations[lang].journal;
    document.querySelector('#webcam-section h2').textContent = translations[lang].webcam;
    document.querySelector('#voice-section h2').textContent = translations[lang].voice;
    document.querySelector('#emotion-section h2').textContent = translations[lang].detected;
    document.getElementById('submit-journal').textContent = translations[lang].submit;
    document.getElementById('search-bar').placeholder = translations[lang].search;
    document.getElementById('export-csv').textContent = translations[lang].export;
    document.getElementById('toggle-dark').textContent = translations[lang].dark;
}

languageSelect.onchange = () => {
    currentLanguage = languageSelect.value;
    translateUI(currentLanguage);
};

window.addEventListener('DOMContentLoaded', () => {
    translateUI(currentLanguage);
});

// Notification UI
function showReminderUI() {
    let notif = document.getElementById('reminder-notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'reminder-notification';
        notif.textContent = 'Time to reflect and journal!';
        document.body.appendChild(notif);
    }
    notif.style.display = 'block';
    setTimeout(() => notif.style.display = 'none', 5000);
}
if ('Notification' in window) {
    Notification.requestPermission();
    setInterval(() => {
        showReminder();
        showReminderUI();
    }, 1000 * 60 * 60 * 6);
}

// Accessibility: keyboard navigation for journal entries
journalList.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') {
        e.target.nextSibling?.focus();
    } else if (e.key === 'ArrowUp') {
        e.target.previousSibling?.focus();
    }
});

// Render journal entries
function renderJournalEntries(entries) {
    journalList.innerHTML = '';
    entries.forEach(entry => journalList.appendChild(createJournalEntryDiv(entry)));
}

// Load and display journal entries (with favorites)
async function loadJournalEntries() {
    const res = await fetch('/api/journals?userId=demo-user');
    const data = await res.json();
    allEntries = data.entries || [];
    renderJournalEntries(allEntries);
}

// Initial load
loadJournalEntries();
