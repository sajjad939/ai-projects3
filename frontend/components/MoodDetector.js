/**
 * Advanced Mood Detection Component for Mirror of Heart
 * Provides comprehensive mood analysis interface with multiple input types
 */
class MoodDetector {
    constructor() {
        this.currentAnalysis = null;
        this.analysisHistory = [];
        this.isAnalyzing = false;
        this.supportedEmotions = [];
        this.userPreferences = {};
        
        // Audio recording
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        
        // Camera capture
        this.videoStream = null;
        this.isCapturing = false;
        
        this.init();
    }

    async init() {
        this.createMoodInterface();
        this.bindEvents();
        await this.loadSupportedEmotions();
        await this.loadUserPreferences();
        this.setupKeyboardShortcuts();
        
        // Auto-focus text input
        setTimeout(() => {
            const textInput = document.getElementById('mood-text-input');
            if (textInput) textInput.focus();
        }, 100);
    }

    createMoodInterface() {
        const moodContainer = document.createElement('div');
        moodContainer.id = 'mood-detector';
        moodContainer.className = 'mood-detector';
        
        moodContainer.innerHTML = `
            <div class="mood-header">
                <div class="mood-title">
                    <h2>Mood Detection</h2>
                    <div class="mood-status">
                        <span class="status-indicator" id="mood-status"></span>
                        <span id="mood-status-text">Ready to analyze</span>
                    </div>
                </div>
                <div class="mood-controls">
                    <button id="mood-history-btn" class="btn-secondary" title="View History">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        History
                    </button>
                    <button id="mood-analytics-btn" class="btn-secondary" title="View Analytics">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 3v18h18M9 17V9M13 17V5M17 17v-3"/>
                        </svg>
                        Analytics
                    </button>
                </div>
            </div>

            <div class="mood-input-tabs">
                <button class="tab-btn active" data-tab="text">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    Text
                </button>
                <button class="tab-btn" data-tab="voice">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <path d="M12 19v4M8 23h8"/>
                    </svg>
                    Voice
                </button>
                <button class="tab-btn" data-tab="image">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    Image
                </button>
                <button class="tab-btn" data-tab="combined">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Multi-Modal
                </button>
            </div>

            <div class="mood-input-content">
                <!-- Text Input Tab -->
                <div class="tab-content active" id="text-tab">
                    <div class="text-input-section">
                        <textarea 
                            id="mood-text-input" 
                            placeholder="Share your thoughts, feelings, or what's on your mind..."
                            rows="4"
                            maxlength="5000"
                        ></textarea>
                        <div class="input-footer">
                            <div class="character-count">
                                <span id="text-char-count">0</span>/5000
                            </div>
                            <div class="input-options">
                                <label>
                                    <input type="checkbox" id="include-context" checked>
                                    Include spiritual context
                                </label>
                            </div>
                        </div>
                    </div>
                    <button id="analyze-text-btn" class="btn-primary analyze-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4"/>
                            <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                            <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                        </svg>
                        Analyze Mood
                    </button>
                </div>

                <!-- Voice Input Tab -->
                <div class="tab-content" id="voice-tab">
                    <div class="voice-input-section">
                        <div class="voice-controls">
                            <button id="start-recording-btn" class="btn-record">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                    <path d="M12 19v4M8 23h8"/>
                                </svg>
                                Start Recording
                            </button>
                            <button id="stop-recording-btn" class="btn-stop" disabled>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="6" y="6" width="12" height="12"/>
                                </svg>
                                Stop Recording
                            </button>
                        </div>
                        <div class="recording-status" id="recording-status">
                            <div class="recording-indicator"></div>
                            <span>Click "Start Recording" to begin</span>
                        </div>
                        <div class="voice-transcript" id="voice-transcript">
                            <p>Transcript will appear here...</p>
                        </div>
                        <audio id="recorded-audio" controls style="display: none;"></audio>
                    </div>
                    <button id="analyze-voice-btn" class="btn-primary analyze-btn" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4"/>
                        </svg>
                        Analyze Voice
                    </button>
                </div>

                <!-- Image Input Tab -->
                <div class="tab-content" id="image-tab">
                    <div class="image-input-section">
                        <div class="image-upload-area" id="image-upload-area">
                            <div class="upload-placeholder">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21,15 16,10 5,21"/>
                                </svg>
                                <p>Drop an image here or click to upload</p>
                                <p class="upload-hint">Supports JPG, PNG, GIF up to 10MB</p>
                            </div>
                            <input type="file" id="image-file-input" accept="image/*" style="display: none;">
                        </div>
                        <div class="camera-section">
                            <button id="use-camera-btn" class="btn-secondary">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                    <circle cx="12" cy="13" r="4"/>
                                </svg>
                                Use Camera
                            </button>
                            <video id="camera-preview" autoplay playsinline style="display: none;"></video>
                            <canvas id="camera-canvas" style="display: none;"></canvas>
                            <button id="capture-photo-btn" class="btn-primary" style="display: none;">Capture Photo</button>
                        </div>
                        <div class="image-preview" id="image-preview" style="display: none;">
                            <img id="preview-image" alt="Selected image">
                            <button id="remove-image-btn" class="btn-remove">×</button>
                        </div>
                    </div>
                    <button id="analyze-image-btn" class="btn-primary analyze-btn" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4"/>
                        </svg>
                        Analyze Image
                    </button>
                </div>

                <!-- Combined Input Tab -->
                <div class="tab-content" id="combined-tab">
                    <div class="combined-input-section">
                        <div class="combined-text">
                            <label>Text Input:</label>
                            <textarea 
                                id="combined-text-input" 
                                placeholder="Describe your current state..."
                                rows="3"
                                maxlength="2000"
                            ></textarea>
                        </div>
                        <div class="combined-options">
                            <label>
                                <input type="checkbox" id="combined-include-voice">
                                Include voice recording
                            </label>
                            <label>
                                <input type="checkbox" id="combined-include-image">
                                Include image/photo
                            </label>
                        </div>
                        <div class="combined-voice" id="combined-voice-section" style="display: none;">
                            <button id="combined-record-btn" class="btn-secondary">Record Voice</button>
                            <div id="combined-voice-status"></div>
                        </div>
                        <div class="combined-image" id="combined-image-section" style="display: none;">
                            <button id="combined-image-btn" class="btn-secondary">Add Image</button>
                            <div id="combined-image-preview"></div>
                        </div>
                    </div>
                    <button id="analyze-combined-btn" class="btn-primary analyze-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4"/>
                        </svg>
                        Analyze All Inputs
                    </button>
                </div>
            </div>

            <div class="mood-results" id="mood-results" style="display: none;">
                <div class="results-header">
                    <h3>Analysis Results</h3>
                    <div class="results-actions">
                        <button id="save-analysis-btn" class="btn-secondary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                <polyline points="17,21 17,13 7,13 7,21"/>
                                <polyline points="7,3 7,8 15,8"/>
                            </svg>
                            Save
                        </button>
                        <button id="share-analysis-btn" class="btn-secondary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                <polyline points="16,6 12,2 8,6"/>
                                <line x1="12" y1="2" x2="12" y2="15"/>
                            </svg>
                            Share
                        </button>
                    </div>
                </div>
                
                <div class="primary-emotion" id="primary-emotion">
                    <div class="emotion-display">
                        <div class="emotion-icon" id="emotion-icon">😊</div>
                        <div class="emotion-info">
                            <div class="emotion-name" id="emotion-name">Happy</div>
                            <div class="emotion-confidence" id="emotion-confidence">85% confidence</div>
                            <div class="emotion-intensity" id="emotion-intensity">Medium intensity</div>
                        </div>
                    </div>
                </div>

                <div class="emotion-breakdown" id="emotion-breakdown">
                    <h4>Emotion Breakdown</h4>
                    <div class="emotion-bars" id="emotion-bars">
                        <!-- Emotion bars will be populated here -->
                    </div>
                </div>

                <div class="spiritual-context" id="spiritual-context" style="display: none;">
                    <h4>Spiritual Context</h4>
                    <div class="spiritual-info" id="spiritual-info">
                        <!-- Spiritual context will be populated here -->
                    </div>
                </div>

                <div class="insights-section" id="insights-section">
                    <h4>Insights</h4>
                    <div class="insights-list" id="insights-list">
                        <!-- Insights will be populated here -->
                    </div>
                </div>

                <div class="suggestions-section" id="suggestions-section">
                    <h4>Personalized Suggestions</h4>
                    <div class="suggestions-grid" id="suggestions-grid">
                        <!-- Suggestions will be populated here -->
                    </div>
                </div>

                <div class="analysis-metadata" id="analysis-metadata">
                    <div class="metadata-item">
                        <span class="metadata-label">Analysis Type:</span>
                        <span class="metadata-value" id="analysis-type">Text</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Processing Time:</span>
                        <span class="metadata-value" id="processing-time">1.2s</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Timestamp:</span>
                        <span class="metadata-value" id="analysis-timestamp">Just now</span>
                    </div>
                </div>
            </div>

            <div class="mood-history-panel" id="mood-history-panel">
                <div class="panel-header">
                    <h3>Mood History</h3>
                    <button id="close-history-btn" class="btn-icon">×</button>
                </div>
                <div class="history-filters">
                    <select id="history-timeframe">
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                    <select id="history-emotion-filter">
                        <option value="">All emotions</option>
                        <!-- Options will be populated dynamically -->
                    </select>
                </div>
                <div class="history-content" id="history-content">
                    <!-- History entries will be loaded here -->
                </div>
            </div>

            <div class="mood-analytics-panel" id="mood-analytics-panel">
                <div class="panel-header">
                    <h3>Mood Analytics</h3>
                    <button id="close-analytics-btn" class="btn-icon">×</button>
                </div>
                <div class="analytics-content" id="analytics-content">
                    <!-- Analytics will be loaded here -->
                </div>
            </div>

            <div class="loading-overlay" id="mood-loading" style="display: none;">
                <div class="loading-spinner"></div>
                <p>Analyzing your mood...</p>
            </div>
        `;

        // Find the mood block or create it
        let moodBlock = document.getElementById('mood-section');
        if (!moodBlock) {
            moodBlock = document.createElement('div');
            moodBlock.id = 'mood-section';
            moodBlock.className = 'chatgpt-block';
            
            // Insert into the second column
            const columns = document.querySelectorAll('.chatgpt-column');
            const targetColumn = columns[1] || columns[0];
            if (targetColumn) {
                targetColumn.appendChild(moodBlock);
            } else {
                document.body.appendChild(moodBlock);
            }
        }
        
        moodBlock.innerHTML = '';
        moodBlock.appendChild(moodContainer);
    }

    bindEvents() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // Text input events
        const textInput = document.getElementById('mood-text-input');
        textInput.addEventListener('input', () => {
            this.updateCharacterCount('text');
        });

        // Analyze buttons
        document.getElementById('analyze-text-btn').addEventListener('click', () => {
            this.analyzeText();
        });

        document.getElementById('analyze-voice-btn').addEventListener('click', () => {
            this.analyzeVoice();
        });

        document.getElementById('analyze-image-btn').addEventListener('click', () => {
            this.analyzeImage();
        });

        document.getElementById('analyze-combined-btn').addEventListener('click', () => {
            this.analyzeCombined();
        });

        // Voice recording
        document.getElementById('start-recording-btn').addEventListener('click', () => {
            this.startRecording();
        });

        document.getElementById('stop-recording-btn').addEventListener('click', () => {
            this.stopRecording();
        });

        // Image upload
        const imageUploadArea = document.getElementById('image-upload-area');
        const imageFileInput = document.getElementById('image-file-input');

        imageUploadArea.addEventListener('click', () => {
            imageFileInput.click();
        });

        imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadArea.classList.add('drag-over');
        });

        imageUploadArea.addEventListener('dragleave', () => {
            imageUploadArea.classList.remove('drag-over');
        });

        imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImageFile(files[0]);
            }
        });

        imageFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageFile(e.target.files[0]);
            }
        });

        // Camera
        document.getElementById('use-camera-btn').addEventListener('click', () => {
            this.startCamera();
        });

        document.getElementById('capture-photo-btn').addEventListener('click', () => {
            this.capturePhoto();
        });

        // Remove image
        document.getElementById('remove-image-btn').addEventListener('click', () => {
            this.removeImage();
        });

        // History and analytics
        document.getElementById('mood-history-btn').addEventListener('click', () => {
            this.toggleHistoryPanel();
        });

        document.getElementById('mood-analytics-btn').addEventListener('click', () => {
            this.toggleAnalyticsPanel();
        });

        document.getElementById('close-history-btn').addEventListener('click', () => {
            this.toggleHistoryPanel(false);
        });

        document.getElementById('close-analytics-btn').addEventListener('click', () => {
            this.toggleAnalyticsPanel(false);
        });

        // History filters
        document.getElementById('history-timeframe').addEventListener('change', () => {
            this.loadHistory();
        });

        document.getElementById('history-emotion-filter').addEventListener('change', () => {
            this.loadHistory();
        });

        // Combined input options
        document.getElementById('combined-include-voice').addEventListener('change', (e) => {
            document.getElementById('combined-voice-section').style.display = 
                e.target.checked ? 'block' : 'none';
        });

        document.getElementById('combined-include-image').addEventListener('change', (e) => {
            document.getElementById('combined-image-section').style.display = 
                e.target.checked ? 'block' : 'none';
        });

        // Results actions
        document.getElementById('save-analysis-btn').addEventListener('click', () => {
            this.saveAnalysis();
        });

        document.getElementById('share-analysis-btn').addEventListener('click', () => {
            this.shareAnalysis();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to analyze current tab
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
                this.analyzeCurrentTab(activeTab);
            }
            
            // Ctrl/Cmd + H for history
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                this.toggleHistoryPanel();
            }
            
            // Ctrl/Cmd + A for analytics
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                this.toggleAnalyticsPanel();
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Focus appropriate input
        setTimeout(() => {
            if (tabName === 'text') {
                document.getElementById('mood-text-input').focus();
            } else if (tabName === 'combined') {
                document.getElementById('combined-text-input').focus();
            }
        }, 100);
    }

    updateCharacterCount(inputType) {
        const input = document.getElementById(`${inputType === 'text' ? 'mood-text-input' : 'combined-text-input'}`);
        const counter = document.getElementById(`${inputType === 'text' ? 'text-char-count' : 'combined-char-count'}`);
        
        if (input && counter) {
            const count = input.value.length;
            counter.textContent = count;
            
            // Update color based on usage
            if (count > 4500) {
                counter.style.color = '#ef4444';
            } else if (count > 3500) {
                counter.style.color = '#f59e0b';
            } else {
                counter.style.color = '#6b7280';
            }
        }
    }

    async analyzeCurrentTab(tabName) {
        switch (tabName) {
            case 'text':
                await this.analyzeText();
                break;
            case 'voice':
                await this.analyzeVoice();
                break;
            case 'image':
                await this.analyzeImage();
                break;
            case 'combined':
                await this.analyzeCombined();
                break;
        }
    }

    async analyzeText() {
        const textInput = document.getElementById('mood-text-input');
        const includeContext = document.getElementById('include-context').checked;
        
        const text = textInput.value.trim();
        if (!text) {
            this.showError('Please enter some text to analyze.');
            return;
        }

        const input = {
            type: 'text',
            content: text,
            context: includeContext ? this.getContextInfo() : {}
        };

        const options = {
            includeInsights: true,
            includeSuggestions: true,
            saveToHistory: true
        };

        await this.performAnalysis(input, options);
    }

    async analyzeVoice() {
        if (!this.audioChunks.length) {
            this.showError('Please record some audio first.');
            return;
        }

        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        const audioData = await this.blobToBase64(audioBlob);
        const transcript = document.getElementById('voice-transcript').textContent;

        const input = {
            type: 'voice',
            audioData,
            content: transcript !== 'Transcript will appear here...' ? transcript : '',
            context: this.getContextInfo()
        };

        const options = {
            includeInsights: true,
            includeSuggestions: true,
            saveToHistory: true
        };

        await this.performAnalysis(input, options);
    }

    async analyzeImage() {
        const previewImage = document.getElementById('preview-image');
        if (!previewImage.src) {
            this.showError('Please select or capture an image first.');
            return;
        }

        const imageData = previewImage.src;

        const input = {
            type: 'image',
            imageData,
            context: this.getContextInfo()
        };

        const options = {
            includeInsights: true,
            includeSuggestions: true,
            saveToHistory: true
        };

        await this.performAnalysis(input, options);
    }

    async analyzeCombined() {
        const textInput = document.getElementById('combined-text-input');
        const includeVoice = document.getElementById('combined-include-voice').checked;
        const includeImage = document.getElementById('combined-include-image').checked;

        const text = textInput.value.trim();
        
        if (!text && !includeVoice && !includeImage) {
            this.showError('Please provide at least one input type.');
            return;
        }

        const input = {
            type: 'combined',
            content: text || null,
            audioData: includeVoice && this.audioChunks.length ? 
                await this.blobToBase64(new Blob(this.audioChunks, { type: 'audio/wav' })) : null,
            imageData: includeImage ? document.getElementById('preview-image')?.src : null,
            context: this.getContextInfo()
        };

        const options = {
            includeInsights: true,
            includeSuggestions: true,
            saveToHistory: true
        };

        await this.performAnalysis(input, options);
    }

    async performAnalysis(input, options) {
        if (this.isAnalyzing) return;

        this.isAnalyzing = true;
        this.showLoading(true);
        this.updateStatus('analyzing', 'Analyzing your mood...');

        try {
            const response = await this.makeApiRequest('/api/mood/analyze', {
                method: 'POST',
                body: JSON.stringify({ input, options })
            });

            if (response.success) {
                this.currentAnalysis = response.data;
                this.displayResults(response.data);
                this.updateStatus('complete', 'Analysis complete');
                
                // Add to history
                this.analysisHistory.unshift(response.data);
                if (this.analysisHistory.length > 50) {
                    this.analysisHistory = this.analysisHistory.slice(0, 50);
                }
            } else {
                throw new Error(response.error || 'Analysis failed');
            }

        } catch (error) {
            console.error('Mood analysis error:', error);
            this.showError(error.message);
            this.updateStatus('error', 'Analysis failed');
        } finally {
            this.isAnalyzing = false;
            this.showLoading(false);
        }
    }

    displayResults(analysis) {
        const resultsContainer = document.getElementById('mood-results');
        resultsContainer.style.display = 'block';

        // Primary emotion
        this.displayPrimaryEmotion(analysis);
        
        // Emotion breakdown
        this.displayEmotionBreakdown(analysis.emotions);
        
        // Spiritual context
        if (analysis.spiritualContext?.isSpiritual) {
            this.displaySpiritualContext(analysis.spiritualContext);
        }
        
        // Insights
        if (analysis.insights?.length > 0) {
            this.displayInsights(analysis.insights);
        }
        
        // Suggestions
        if (analysis.suggestions?.length > 0) {
            this.displaySuggestions(analysis.suggestions);
        }
        
        // Metadata
        this.displayMetadata(analysis);

        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    displayPrimaryEmotion(analysis) {
        const emotionIcon = document.getElementById('emotion-icon');
        const emotionName = document.getElementById('emotion-name');
        const emotionConfidence = document.getElementById('emotion-confidence');
        const emotionIntensity = document.getElementById('emotion-intensity');

        // Emotion icons mapping
        const emotionIcons = {
            peaceful: '🕊️',
            grateful: '🙏',
            anxious: '😰',
            sad: '😢',
            joyful: '😊',
            spiritual: '✨',
            angry: '😠',
            hopeful: '🌟',
            neutral: '😐'
        };

        emotionIcon.textContent = emotionIcons[analysis.primaryEmotion] || '😐';
        emotionName.textContent = analysis.primaryEmotion.charAt(0).toUpperCase() + 
                                 analysis.primaryEmotion.slice(1);
        emotionConfidence.textContent = `${Math.round(analysis.confidence * 100)}% confidence`;
        emotionIntensity.textContent = `${analysis.intensity.charAt(0).toUpperCase() + 
                                       analysis.intensity.slice(1)} intensity`;

        // Apply emotion color
        const primaryEmotionEl = document.getElementById('primary-emotion');
        primaryEmotionEl.className = `primary-emotion emotion-${analysis.primaryEmotion}`;
    }

    displayEmotionBreakdown(emotions) {
        const emotionBars = document.getElementById('emotion-bars');
        emotionBars.innerHTML = '';

        // Sort emotions by score
        const sortedEmotions = Object.entries(emotions)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5); // Show top 5

        sortedEmotions.forEach(([emotion, score]) => {
            const barContainer = document.createElement('div');
            barContainer.className = 'emotion-bar-container';
            
            barContainer.innerHTML = `
                <div class="emotion-bar-label">${emotion}</div>
                <div class="emotion-bar">
                    <div class="emotion-bar-fill emotion-${emotion}" 
                         style="width: ${score * 100}%">
                        <span class="emotion-bar-score">${Math.round(score * 100)}%</span>
                    </div>
                </div>
            `;
            
            emotionBars.appendChild(barContainer);
        });
    }

    displaySpiritualContext(spiritualContext) {
        const spiritualSection = document.getElementById('spiritual-context');
        const spiritualInfo = document.getElementById('spiritual-info');
        
        spiritualSection.style.display = 'block';
        
        spiritualInfo.innerHTML = `
            <div class="spiritual-score">
                <span class="spiritual-label">Spiritual Awareness:</span>
                <span class="spiritual-value">${Math.round(spiritualContext.score * 100)}%</span>
            </div>
            ${spiritualContext.suggestedTradition ? `
                <div class="spiritual-tradition">
                    <span class="spiritual-label">Detected Tradition:</span>
                    <span class="spiritual-value">${spiritualContext.suggestedTradition}</span>
                </div>
            ` : ''}
            ${spiritualContext.detectedTerms?.spiritual?.length > 0 ? `
                <div class="spiritual-terms">
                    <span class="spiritual-label">Spiritual Terms:</span>
                    <div class="spiritual-tags">
                        ${spiritualContext.detectedTerms.spiritual.map(term => 
                            `<span class="spiritual-tag">${term}</span>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    displayInsights(insights) {
        const insightsList = document.getElementById('insights-list');
        insightsList.innerHTML = '';

        insights.forEach(insight => {
            const insightEl = document.createElement('div');
            insightEl.className = `insight insight-${insight.type}`;
            
            insightEl.innerHTML = `
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <div class="insight-message">${insight.message}</div>
                </div>
            `;
            
            insightsList.appendChild(insightEl);
        });
    }

    displaySuggestions(suggestions) {
        const suggestionsGrid = document.getElementById('suggestions-grid');
        suggestionsGrid.innerHTML = '';

        suggestions.forEach(suggestion => {
            const suggestionEl = document.createElement('div');
            suggestionEl.className = 'suggestion-card';
            
            suggestionEl.innerHTML = `
                <div class="suggestion-icon">${suggestion.icon}</div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-description">${suggestion.description}</div>
                    <button class="suggestion-action" data-action="${suggestion.action}">
                        Try This
                    </button>
                </div>
            `;
            
            // Add click handler for suggestion action
            suggestionEl.querySelector('.suggestion-action').addEventListener('click', () => {
                this.handleSuggestionAction(suggestion.action);
            });
            
            suggestionsGrid.appendChild(suggestionEl);
        });
    }

    displayMetadata(analysis) {
        document.getElementById('analysis-type').textContent = analysis.analysisType || 'Unknown';
        document.getElementById('processing-time').textContent = 
            analysis.processingTime ? `${analysis.processingTime}ms` : 'N/A';
        document.getElementById('analysis-timestamp').textContent = 
            new Date(analysis.timestamp).toLocaleString();
    }

    handleSuggestionAction(action) {
        switch (action) {
            case 'breathing_exercise':
                this.startBreathingExercise();
                break;
            case 'prayer_session':
                this.openPrayerSession();
                break;
            case 'gratitude_journal':
                this.openGratitudeJournal();
                break;
            case 'meditation_session':
                this.startMeditation();
                break;
            case 'tasbih_counter':
                this.openTasbihCounter();
                break;
            case 'spiritual_reading':
                this.openSpiritualReading();
                break;
            default:
                console.log('Unknown suggestion action:', action);
        }
    }

    // Voice recording methods
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                this.processRecording();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            
            document.getElementById('start-recording-btn').disabled = true;
            document.getElementById('stop-recording-btn').disabled = false;
            document.getElementById('recording-status').innerHTML = `
                <div class="recording-indicator active"></div>
                <span>Recording... Click stop when finished</span>
            `;

        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Could not access microphone. Please check permissions.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            document.getElementById('start-recording-btn').disabled = false;
            document.getElementById('stop-recording-btn').disabled = true;
            document.getElementById('analyze-voice-btn').disabled = false;
            
            document.getElementById('recording-status').innerHTML = `
                <div class="recording-indicator"></div>
                <span>Recording complete. Ready to analyze.</span>
            `;
        }
    }

    async processRecording() {
        if (this.audioChunks.length > 0) {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const audioElement = document.getElementById('recorded-audio');
            audioElement.src = audioUrl;
            audioElement.style.display = 'block';
            
            // Try to get transcript using Web Speech API (if available)
            await this.transcribeAudio();
        }
    }

    async transcribeAudio() {
        // Placeholder for speech-to-text functionality
        // In a real implementation, you would use a speech recognition service
        document.getElementById('voice-transcript').innerHTML = `
            <p><em>Transcript will be generated during analysis...</em></p>
        `;
    }

    // Image handling methods
    handleImageFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showError('Image file too large. Please select an image under 10MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.displayImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    displayImagePreview(imageSrc) {
        const previewContainer = document.getElementById('image-preview');
        const previewImage = document.getElementById('preview-image');
        
        previewImage.src = imageSrc;
        previewContainer.style.display = 'block';
        
        document.getElementById('analyze-image-btn').disabled = false;
    }

    removeImage() {
        const previewContainer = document.getElementById('image-preview');
        const previewImage = document.getElementById('preview-image');
        
        previewImage.src = '';
        previewContainer.style.display = 'none';
        
        document.getElementById('analyze-image-btn').disabled = true;
        document.getElementById('image-file-input').value = '';
    }

    async startCamera() {
        try {
            this.videoStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            
            const video = document.getElementById('camera-preview');
            video.srcObject = this.videoStream;
            video.style.display = 'block';
            
            document.getElementById('capture-photo-btn').style.display = 'block';
            document.getElementById('use-camera-btn').textContent = 'Stop Camera';
            
            this.isCapturing = true;

        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showError('Could not access camera. Please check permissions.');
        }
    }

    capturePhoto() {
        const video = document.getElementById('camera-preview');
        const canvas = document.getElementById('camera-canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        this.displayImagePreview(imageData);
        this.stopCamera();
    }

    stopCamera() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }
        
        document.getElementById('camera-preview').style.display = 'none';
        document.getElementById('capture-photo-btn').style.display = 'none';
        document.getElementById('use-camera-btn').textContent = 'Use Camera';
        
        this.isCapturing = false;
    }

    // History and analytics methods
    async toggleHistoryPanel(show = null) {
        const panel = document.getElementById('mood-history-panel');
        const isVisible = panel.classList.contains('visible');
        
        if (show === null) {
            show = !isVisible;
        }
        
        if (show) {
            panel.classList.add('visible');
            await this.loadHistory();
        } else {
            panel.classList.remove('visible');
        }
    }

    async toggleAnalyticsPanel(show = null) {
        const panel = document.getElementById('mood-analytics-panel');
        const isVisible = panel.classList.contains('visible');
        
        if (show === null) {
            show = !isVisible;
        }
        
        if (show) {
            panel.classList.add('visible');
            await this.loadAnalytics();
        } else {
            panel.classList.remove('visible');
        }
    }

    async loadHistory() {
        try {
            const timeframe = document.getElementById('history-timeframe').value;
            const emotionFilter = document.getElementById('history-emotion-filter').value;
            
            const params = new URLSearchParams({
                timeframe,
                limit: '20',
                includeInsights: 'true'
            });
            
            if (emotionFilter) {
                params.append('emotions', emotionFilter);
            }

            const response = await this.makeApiRequest(`/api/mood/history?${params}`);
            
            if (response.success) {
                this.displayHistory(response.data.entries);
            }

        } catch (error) {
            console.error('Error loading history:', error);
            this.showError('Failed to load mood history');
        }
    }

    displayHistory(entries) {
        const historyContent = document.getElementById('history-content');
        
        if (entries.length === 0) {
            historyContent.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">📊</div>
                    <p>No mood entries found</p>
                    <p>Start analyzing your mood to see history here</p>
                </div>
            `;
            return;
        }

        historyContent.innerHTML = entries.map(entry => `
            <div class="history-entry">
                <div class="history-header">
                    <div class="history-emotion emotion-${entry.primaryEmotion}">
                        ${entry.primaryEmotion}
                    </div>
                    <div class="history-date">
                        ${new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div class="history-details">
                    <div class="history-confidence">
                        ${Math.round(entry.confidence * 100)}% confidence
                    </div>
                    <div class="history-intensity">
                        ${entry.intensity} intensity
                    </div>
                    <div class="history-type">
                        ${entry.analysisType} analysis
                    </div>
                </div>
                ${entry.insights && entry.insights.length > 0 ? `
                    <div class="history-insights">
                        ${entry.insights.slice(0, 2).map(insight => `
                            <div class="history-insight">
                                ${insight.icon} ${insight.message}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    async loadAnalytics() {
        try {
            const response = await this.makeApiRequest('/api/mood/analytics?timeframe=30d');
            
            if (response.success) {
                this.displayAnalytics(response.data);
            }

        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Failed to load mood analytics');
        }
    }

    displayAnalytics(analytics) {
        const analyticsContent = document.getElementById('analytics-content');
        
        analyticsContent.innerHTML = `
            <div class="analytics-overview">
                <div class="analytics-card">
                    <div class="analytics-number">${analytics.totalEntries}</div>
                    <div class="analytics-label">Total Analyses</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-number emotion-${analytics.dominantEmotion}">
                        ${analytics.dominantEmotion}
                    </div>
                    <div class="analytics-label">Dominant Emotion</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-number">${Math.round(analytics.averageConfidence * 100)}%</div>
                    <div class="analytics-label">Avg Confidence</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-number">${Math.round(analytics.moodStability * 100)}%</div>
                    <div class="analytics-label">Mood Stability</div>
                </div>
            </div>

            <div class="emotion-distribution">
                <h4>Emotion Distribution</h4>
                <div class="distribution-chart">
                    ${Object.entries(analytics.emotionDistribution).map(([emotion, count]) => `
                        <div class="distribution-bar">
                            <div class="distribution-label">${emotion}</div>
                            <div class="distribution-fill emotion-${emotion}" 
                                 style="width: ${(count / analytics.totalEntries) * 100}%">
                                <span class="distribution-count">${count}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="intensity-distribution">
                <h4>Intensity Distribution</h4>
                <div class="intensity-chart">
                    ${Object.entries(analytics.intensityDistribution).map(([intensity, count]) => `
                        <div class="intensity-item">
                            <div class="intensity-label">${intensity}</div>
                            <div class="intensity-value">${count}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${analytics.insights && analytics.insights.length > 0 ? `
                <div class="analytics-insights">
                    <h4>Key Insights</h4>
                    ${analytics.insights.map(insight => `
                        <div class="analytics-insight">
                            <div class="insight-title">${insight.title}</div>
                            <div class="insight-message">${insight.message}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    // Utility methods
    async loadSupportedEmotions() {
        try {
            const response = await this.makeApiRequest('/api/mood/emotions');
            if (response.success) {
                this.supportedEmotions = response.data.emotions;
                this.populateEmotionFilters();
            }
        } catch (error) {
            console.error('Error loading supported emotions:', error);
        }
    }

    populateEmotionFilters() {
        const emotionFilter = document.getElementById('history-emotion-filter');
        
        this.supportedEmotions.forEach(emotion => {
            const option = document.createElement('option');
            option.value = emotion;
            option.textContent = emotion.charAt(0).toUpperCase() + emotion.slice(1);
            emotionFilter.appendChild(option);
        });
    }

    async loadUserPreferences() {
        try {
            const response = await this.makeApiRequest('/api/user/me');
            if (response.success) {
                this.userPreferences = response.data.spiritualPreferences || {};
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }

    getContextInfo() {
        const now = new Date();
        return {
            timeOfDay: this.getTimeOfDay(now.getHours()),
            dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
            spiritualPreferences: this.userPreferences,
            location: null // Could be added with geolocation API
        };
    }

    getTimeOfDay(hour) {
        if (hour < 6) return 'early_morning';
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        if (hour < 22) return 'evening';
        return 'night';
    }

    async makeApiRequest(url, options = {}) {
        const token = localStorage.getItem('token');
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment before trying again.');
        }
        
        if (response.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        
        return await response.json();
    }

    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('mood-loading');
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    updateStatus(status, message) {
        const statusIndicator = document.getElementById('mood-status');
        const statusText = document.getElementById('mood-status-text');
        
        statusIndicator.className = `status-indicator ${status}`;
        statusText.textContent = message;
    }

    showError(message) {
        // Create or update error notification
        let errorNotification = document.getElementById('mood-error-notification');
        if (!errorNotification) {
            errorNotification = document.createElement('div');
            errorNotification.id = 'mood-error-notification';
            errorNotification.className = 'error-notification';
            document.body.appendChild(errorNotification);
        }
        
        errorNotification.textContent = message;
        errorNotification.style.display = 'block';
        
        setTimeout(() => {
            errorNotification.style.display = 'none';
        }, 5000);
    }

    // Suggestion action handlers
    startBreathingExercise() {
        alert('Breathing exercise feature coming soon!');
    }

    openPrayerSession() {
        alert('Prayer session feature coming soon!');
    }

    openGratitudeJournal() {
        // Navigate to journal section
        const journalSection = document.getElementById('journal-section');
        if (journalSection) {
            journalSection.scrollIntoView({ behavior: 'smooth' });
            const journalInput = document.getElementById('journal-input');
            if (journalInput) {
                journalInput.focus();
                journalInput.placeholder = 'Write about what you\'re grateful for today...';
            }
        }
    }

    startMeditation() {
        alert('Meditation session feature coming soon!');
    }

    openTasbihCounter() {
        // Navigate to tasbih section
        const tasbihSection = document.getElementById('tasbih-section');
        if (tasbihSection) {
            tasbihSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    openSpiritualReading() {
        alert('Spiritual reading feature coming soon!');
    }

    saveAnalysis() {
        if (this.currentAnalysis) {
            // Analysis is already saved automatically
            this.showError('Analysis has been saved to your history.');
        }
    }

    shareAnalysis() {
        if (this.currentAnalysis) {
            const shareText = `I just analyzed my mood and I'm feeling ${this.currentAnalysis.primaryEmotion} with ${Math.round(this.currentAnalysis.confidence * 100)}% confidence. #MoodTracking #SelfAwareness`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'My Mood Analysis',
                    text: shareText
                });
            } else {
                navigator.clipboard.writeText(shareText);
                this.showError('Analysis summary copied to clipboard!');
            }
        }
    }

    // Cleanup method
    destroy() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
        }
        
        this.analysisHistory = [];
        this.currentAnalysis = null;
    }
}

// Initialize mood detector when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('token')) {
        window.moodDetector = new MoodDetector();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoodDetector;
}