# Mirror of Heart

A modern web application for emotional journaling and digital tasbih (prayer beads), powered by AI emotion analysis and multi-language support.

## Features

- Secure user authentication
- Text, voice, and webcam journaling
- AI-powered emotion analysis (Gemini, Hugging Face)
- Multi-language UI (English, Urdu, Arabic)
- Digital tasbih counter with vibration and sound
- Journal editing, deletion, favorites, and search/filter
- Export journals to CSV
- Dark mode and accessibility enhancements
- Browser notifications and reminders

## Getting Started

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/mirror-of-heart.git
   cd mirror-of-heart
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file:
     ```
     MONGO_URI=your_mongodb_connection_string
     PORT=5000
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

4. **Run the backend**
   ```
   node server.js
   ```

5. **Open `frontend/index.html` in your browser**

## API Endpoints

- `/api/journals` - Journal CRUD
- `/api/emotions/analyze` - Emotion analysis
- `/api/tasbih/count` - Tasbih counter
- `/api/gemini` - Gemini AI integration

## Credits

- Developed by [Your Name]
- AI powered by Google Gemini and Hugging Face
- UI inspired by modern journaling apps

## Screenshots

![Journal UI](screenshots/journal.png)
![Tasbih Counter](screenshots/tasbih.png)
![Emotion Analysis](screenshots/emotion.png)
![Dark Mode](screenshots/darkmode.png)

## License

MIT

---

**Devpost Documentation**

- **Project Name:** Mirror of Heart
- **Description:** Emotional journaling and digital tasbih app with AI emotion analysis, multi-language support, and accessibility.
- **Demo:** [Link to live demo or video]
- **How to Run:** See README above.
- **Features:** See README above.
- **Tech Stack:** Node.js, Express, MongoDB, JavaScript, HTML/CSS, Gemini API, Hugging Face API
- **Team:** [Your Name]
- **Screenshots:** See README above.
