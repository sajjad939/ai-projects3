class MoodDetector {
    constructor() {
        this.isAnalyzing = false;
        this.currentAnalysis = null;
        this.analysisHistory = [];
        this.voiceRecognition = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.currentImageData = null;
        this.retryAttempts = 0;
        this.maxRetryAttempts = 3;
        
        this.init();
    }

    init() {
        this.createMoodInterface();
        this.bindEvents();
        this.setupVoiceRecognition();
        this.loadAnalyticsData();
        
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
                        <span class="status-indicator ready" id="mood-status-indicator"></span>
                        <span id="mood-status-text">Ready to analyze</span>
                    </div>
                </div>
                <div class="mood-controls">
                    <button id="mood-history-btn" class="btn-secondary" title="View History">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 3h18v18H3zM9 9h6M9 15h6"/>
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
                    Combined
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
                            <div class="input-options">
                                <label>
                                    <input type="checkbox" id="include-spiritual-context"> 
                                    Include spiritual context
                                </label>
                            </div>
                            <div class="character-count">
                                <span id="text-char-count">0</span>/5000
                            </div>
                        </div>
                        <button id="analyze-text-btn" class="analyze-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4"/>
                                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                                <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
                                <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
                            </svg>
                            Analyze Mood
                        </button>
                    </div>
                </div>

                <!-- Voice Input Tab -->
                <div class="tab-content" id="voice-tab">
                    <div class="voice-input-section">
                        <div class="voice-controls">
                            <button id="start-voice-recording" class="btn-record">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                    <path d="M12 19v4M8 23h8"/>
                                </svg>
                                Start Recording
                            </button>
                            <button id="stop-voice-recording" class="btn-stop" disabled>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="6" y="6" width="12" height="12"/>
                                </svg>
                                Stop Recording
                            </button>
                        </div>
                        <div class="recording-status" id="recording-status">
                            <span class="recording-indicator" id="recording-indicator"></span>
                            <span id="recording-text">Click "Start Recording" to begin</span>
                        </div>
                        <textarea 
                            id="voice-transcript" 
                            class="voice-transcript" 
                            placeholder="Voice transcript will appear here..."
                            readonly
                        ></textarea>
                        <button id="analyze-voice-btn" class="analyze-btn" disabled>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4"/>
                            </svg>
                            Analyze Voice
                        </button>
                    </div>
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
                            <button id="start-camera-btn" class="btn-secondary">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                    <circle cx="12" cy="13" r="4"/>
                                </svg>
                                Use Camera
                            </button>
                            <video id="camera-preview" autoplay playsinline style="display: none;"></video>
                            <button id="capture-photo-btn" class="btn-primary" style="display: none;">Capture Photo</button>
                        </div>

                        <div class="image-preview" id="image-preview" style="display: none;">
                            <img id="preview-image" alt="Preview">
                            <button class="btn-remove" id="remove-image-btn">×</button>
                        </div>

                        <button id="analyze-image-btn" class="analyze-btn" disabled>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4"/>
                            </svg>
                            Analyze Image
                        </button>
                    </div>
                </div>

                <!-- Combined Input Tab -->
                <div class="tab-content" id="combined-tab">
                    <div class="combined-input-section">
                        <div class="combined-text">
                            <label for="combined-text-input">Text Input (Optional)</label>
                            <textarea 
                                id="combined-text-input" 
                                placeholder="Add text to complement your voice or image..."
                                rows="3"
                                maxlength="5000"
                            ></textarea>
                        </div>
                        
                        <div class="combined-options">
                            <label>
                                <input type="checkbox" id="combined-include-voice"> 
                                Include voice recording
                            </label>
                            <label>
                                <input type="checkbox" id="combined-include-image"> 
                                Include image
                            </label>
                            <label>
                                <input type="checkbox" id="combined-spiritual-context"> 
                                Include spiritual context
                            </label>
                        </div>

                        <button id="analyze-combined-btn" class="analyze-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4"/>
                            </svg>
                            Analyze Combined Input
                        </button>
                    </div>
                </div>
            </div>

            <!-- Results Section -->
            <div class="mood-results" id="mood-results" style="display: none;">
                <div class="results-header">
                    <h3>Analysis Results</h3>
                    <div class="results-actions">
                        <button id="save-analysis-btn" class="btn-secondary">Save</button>
                        <button id="share-analysis-btn" class="btn-secondary">Share</button>
                        <button id="clear-results-btn" class="btn-icon">×</button>
                    </div>
                </div>

                <!-- Primary Emotion Display -->
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

                <!-- Emotion Breakdown -->
                <div class="emotion-breakdown" id="emotion-breakdown">
                    <h4>Emotion Breakdown</h4>
                    <div id="emotion-bars"></div>
                </div>

                <!-- Spiritual Context -->
                <div class="spiritual-context" id="spiritual-context" style="display: none;">
                    <h4>Spiritual Context</h4>
                    <div class="spiritual-score">
                        <span class="spiritual-label">Spiritual Content:</span>
                        <span class="spiritual-value" id="spiritual-score-value">Low</span>
                    </div>
                    <div class="spiritual-tradition">
                        <span class="spiritual-label">Detected Tradition:</span>
                        <span class="spiritual-value" id="spiritual-tradition-value">Universal</span>
                    </div>
                    <div class="spiritual-tags" id="spiritual-tags"></div>
                </div>

                <!-- Insights Section -->
                <div class="insights-section" id="insights-section">
                    <h4>Insights</h4>
                    <div id="insights-container"></div>
                </div>

                <!-- Suggestions Section -->
                <div class="suggestions-section" id="suggestions-section">
                    <h4>Personalized Suggestions</h4>
                    <div class="suggestions-grid" id="suggestions-grid"></div>
                </div>

                <!-- Analysis Metadata -->
                <div class="analysis-metadata" id="analysis-metadata">
                    <div class="metadata-item">
                        <div class="metadata-label">Processing Time</div>
                        <div class="metadata-value" id="processing-time">--</div>
                    </div>
                    <div class="metadata-item">
                        <div class="metadata-label">Analysis Type</div>
                        <div class="metadata-value" id="analysis-type">--</div>
                    </div>
                    <div class="metadata-item">
                        <div class="metadata-label">Timestamp</div>
                        <div class="metadata-value" id="analysis-timestamp">--</div>
                    </div>
                </div>
            </div>

            <!-- History Panel -->
            <div class="mood-history-panel" id="mood-history-panel">
                <div class="panel-header">
                    <h3>Mood History</h3>
                    <button id="close-history-btn" class="btn-icon">×</button>
                </div>
                <div class="history-filters">
                    <select id="history-timeframe">
                        <option value="7d">Last 7 days</option>
                        <option value="30d" selected>Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                    <select id="history-emotion-filter">
                        <option value="">All emotions</option>
                        <option value="peaceful">Peaceful</option>
                        <option value="grateful">Grateful</option>
                        <option value="anxious">Anxious</option>
                        <option value="sad">Sad</option>
                        <option value="joyful">Joyful</option>
                        <option value="spiritual">Spiritual</option>
                        <option value="angry">Angry</option>
                        <option value="hopeful">Hopeful</option>
                        <option value="neutral">Neutral</option>
                    </select>
                </div>
                <div class="history-content" id="history-content">
                    <!-- History entries will be loaded here -->
                </div>
            </div>

            <!-- Analytics Panel -->
            <div class="mood-analytics-panel" id="mood-analytics-panel">
                <div class="analytics-header">
                    <h3>Mood Analytics</h3>
                    <button id="close-analytics-btn" class="btn-icon">×</button>
                </div>
                <div class="analytics-content" id="analytics-content">
                    <!-- Analytics will be loaded here -->
                </div>
            </div>

            <!-- Loading Overlay -->
            <div class="loading-overlay" id="mood-loading-overlay" style="display: none;">
                <div class="loading-spinner"></div>
                <p id="loading-text">Analyzing your mood...</p>
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
            const secondColumn = columns[1] || columns[0];
            if (secondColumn) {
                secondColumn.appendChild(moodBlock);
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
        const textCharCount = document.getElementById('text-char-count');
        
        textInput.addEventListener('input', () => {
            textCharCount.textContent = textInput.value.length;
            this.updateCharacterCount(textInput, textCharCount);
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
        document.getElementById('start-voice-recording').addEventListener('click', () => {
            this.startVoiceRecording();
        });

        document.getElementById('stop-voice-recording').addEventListener('click', () => {
            this.stopVoiceRecording();
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
        document.getElementById('start-camera-btn').addEventListener('click', () => {
            this.startCamera();
        });

        document.getElementById('capture-photo-btn').addEventListener('click', () => {
            this.capturePhoto();
        });

        document.getElementById('remove-image-btn').addEventListener('click', () => {
            this.removeImage();
        });

        // Results actions
        document.getElementById('save-analysis-btn').addEventListener('click', () => {
            this.saveAnalysis();
        });

        document.getElementById('share-analysis-btn').addEventListener('click', () => {
            this.shareAnalysis();
        });

        document.getElementById('clear-results-btn').addEventListener('click', () => {
            this.clearResults();
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

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
                this.analyzeCurrentTab(activeTab);
            }
        });
    }

    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.voiceRecognition = new SpeechRecognition();
            
            this.voiceRecognition.continuous = false;
            this.voiceRecognition.interimResults = false;
            this.voiceRecognition.lang = 'en-US';

            this.voiceRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('voice-transcript').value = transcript;
                document.getElementById('analyze-voice-btn').disabled = false;
            };

            this.voiceRecognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showError('Speech recognition error: ' + event.error);
                this.resetVoiceRecording();
            };

            this.voiceRecognition.onend = () => {
                this.resetVoiceRecording();
            };
        } else {
            // Disable voice features if not supported
            document.querySelector('[data-tab="voice"]').disabled = true;
            document.querySelector('[data-tab="voice"]').title = 'Voice recognition not supported in this browser';
        }
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

    async analyzeText() {
        const textInput = document.getElementById('mood-text-input');
        const text = textInput.value.trim();
        
        if (!text) {
            this.showError('Please enter some text to analyze.');
            return;
        }

        const includeSpiritual = document.getElementById('include-spiritual-context').checked;

        await this.performAnalysis({
            type: 'text',
            content: text,
            context: {
                includeSpiritual,
                timeOfDay: new Date().getHours()
            }
        });
    }

    async analyzeVoice() {
        const transcript = document.getElementById('voice-transcript').value.trim();
        
        if (!transcript) {
            this.showError('Please record some voice input first.');
            return;
        }

        await this.performAnalysis({
            type: 'voice',
            content: transcript,
            // audioData would be included here if we had actual audio recording
            context: {
                hasAudioData: false, // Would be true with actual audio
                timeOfDay: new Date().getHours()
            }
        });
    }

    async analyzeImage() {
        if (!this.currentImageData) {
            this.showError('Please upload or capture an image first.');
            return;
        }

        await this.performAnalysis({
            type: 'image',
            imageData: this.currentImageData,
            context: {
                timeOfDay: new Date().getHours()
            }
        });
    }

    async analyzeCombined() {
        const textInput = document.getElementById('combined-text-input');
        const text = textInput.value.trim();
        const includeVoice = document.getElementById('combined-include-voice').checked;
        const includeImage = document.getElementById('combined-include-image').checked;
        const includeSpiritual = document.getElementById('combined-spiritual-context').checked;

        if (!text && !includeVoice && !includeImage) {
            this.showError('Please provide at least one input type for combined analysis.');
            return;
        }

        const analysisInput = {
            type: 'combined',
            content: text || null,
            context: {
                includeSpiritual,
                timeOfDay: new Date().getHours()
            }
        };

        if (includeVoice) {
            // In a real implementation, we would include voice data here
            analysisInput.audioData = null; // Placeholder
        }

        if (includeImage && this.currentImageData) {
            analysisInput.imageData = this.currentImageData;
        }

        await this.performAnalysis(analysisInput);
    }

    analyzeCurrentTab(tabName) {
        switch (tabName) {
            case 'text':
                this.analyzeText();
                break;
            case 'voice':
                this.analyzeVoice();
                break;
            case 'image':
                this.analyzeImage();
                break;
            case 'combined':
                this.analyzeCombined();
                break;
        }
    }

    async performAnalysis(input) {
        if (this.isAnalyzing) return;

        this.isAnalyzing = true;
        this.showLoading(true);
        this.updateStatus('analyzing', 'Analyzing your mood...');

        try {
            const response = await this.makeApiRequest('/api/mood/analyze', {
                method: 'POST',
                body: JSON.stringify({
                    input,
                    options: {
                        includeInsights: true,
                        includeSuggestions: true,
                        saveToHistory: true
                    }
                })
            });

            if (response.success) {
                this.currentAnalysis = response.data;
                this.displayResults(response.data);
                this.analysisHistory.unshift(response.data);
                
                // Keep only last 10 analyses in memory
                if (this.analysisHistory.length > 10) {
                    this.analysisHistory = this.analysisHistory.slice(0, 10);
                }
            } else {
                throw new Error(response.error || 'Analysis failed');
            }

        } catch (error) {
            console.error('Mood analysis error:', error);
            this.handleAnalysisError(error);
        } finally {
            this.isAnalyzing = false;
            this.showLoading(false);
            this.updateStatus('ready', 'Ready to analyze');
        }
    }

    displayResults(analysisData) {
        const resultsContainer = document.getElementById('mood-results');
        resultsContainer.style.display = 'block';

        // Primary emotion
        this.displayPrimaryEmotion(analysisData);

        // Emotion breakdown
        this.displayEmotionBreakdown(analysisData.emotions);

        // Spiritual context
        if (analysisData.spiritualContext && analysisData.spiritualContext.isSpiritual) {
            this.displaySpiritualContext(analysisData.spiritualContext);
        } else {
            document.getElementById('spiritual-context').style.display = 'none';
        }

        // Insights
        this.displayInsights(analysisData.insights || []);

        // Suggestions
        this.displaySuggestions(analysisData.suggestions || []);

        // Metadata
        this.displayMetadata(analysisData);

        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    displayPrimaryEmotion(analysisData) {
        const emotionIcon = document.getElementById('emotion-icon');
        const emotionName = document.getElementById('emotion-name');
        const emotionConfidence = document.getElementById('emotion-confidence');
        const emotionIntensity = document.getElementById('emotion-intensity');
        const primaryEmotion = document.getElementById('primary-emotion');

        // Emotion icons mapping
        const emotionIcons = {
            peaceful: '😌',
            grateful: '🙏',
            anxious: '😰',
            sad: '😢',
            joyful: '😊',
            spiritual: '✨',
            angry: '😠',
            hopeful: '🌟',
            neutral: '😐'
        };

        emotionIcon.textContent = emotionIcons[analysisData.primaryEmotion] || '😐';
        emotionName.textContent = analysisData.primaryEmotion.charAt(0).toUpperCase() + 
                                 analysisData.primaryEmotion.slice(1);
        emotionConfidence.textContent = `${Math.round(analysisData.confidence * 100)}% confidence`;
        emotionIntensity.textContent = `${analysisData.intensity.charAt(0).toUpperCase() + 
                                       analysisData.intensity.slice(1)} intensity`;

        // Add emotion-specific styling
        primaryEmotion.className = `primary-emotion emotion-${analysisData.primaryEmotion}`;
    }

    displayEmotionBreakdown(emotions) {
        const emotionBars = document.getElementById('emotion-bars');
        emotionBars.innerHTML = '';

        // Sort emotions by score
        const sortedEmotions = Object.entries(emotions)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6); // Show top 6 emotions

        sortedEmotions.forEach(([emotion, score]) => {
            const barContainer = document.createElement('div');
            barContainer.className = 'emotion-bar-container';

            const maxScore = Math.max(...Object.values(emotions));
            const percentage = (score / maxScore) * 100;

            barContainer.innerHTML = `
                <div class="emotion-bar-label">${emotion}</div>
                <div class="emotion-bar">
                    <div class="emotion-bar-fill emotion-${emotion}" style="width: ${percentage}%">
                        <span class="emotion-bar-score">${Math.round(score * 100)}%</span>
                    </div>
                </div>
            `;

            emotionBars.appendChild(barContainer);
        });
    }

    displaySpiritualContext(spiritualContext) {
        const spiritualContextDiv = document.getElementById('spiritual-context');
        const spiritualScoreValue = document.getElementById('spiritual-score-value');
        const spiritualTraditionValue = document.getElementById('spiritual-tradition-value');
        const spiritualTags = document.getElementById('spiritual-tags');

        spiritualContextDiv.style.display = 'block';

        // Spiritual score
        const scoreText = spiritualContext.score > 0.7 ? 'High' : 
                         spiritualContext.score > 0.4 ? 'Medium' : 'Low';
        spiritualScoreValue.textContent = scoreText;

        // Detected tradition
        spiritualTraditionValue.textContent = spiritualContext.suggestedTradition || 'Universal';

        // Spiritual tags
        spiritualTags.innerHTML = '';
        const allTerms = [
            ...spiritualContext.detectedTerms.spiritual,
            ...spiritualContext.detectedTerms.religious,
            ...spiritualContext.detectedTerms.practices
        ];

        allTerms.slice(0, 8).forEach(term => {
            const tag = document.createElement('span');
            tag.className = 'spiritual-tag';
            tag.textContent = term;
            spiritualTags.appendChild(tag);
        });
    }

    displayInsights(insights) {
        const insightsContainer = document.getElementById('insights-container');
        insightsContainer.innerHTML = '';

        if (insights.length === 0) {
            insightsContainer.innerHTML = '<p>No specific insights available for this analysis.</p>';
            return;
        }

        insights.forEach(insight => {
            const insightDiv = document.createElement('div');
            insightDiv.className = `insight insight-${insight.type}`;

            insightDiv.innerHTML = `
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <div class="insight-message">${insight.message}</div>
                </div>
            `;

            insightsContainer.appendChild(insightDiv);
        });
    }

    displaySuggestions(suggestions) {
        const suggestionsGrid = document.getElementById('suggestions-grid');
        suggestionsGrid.innerHTML = '';

        if (suggestions.length === 0) {
            suggestionsGrid.innerHTML = '<p>No specific suggestions available for this analysis.</p>';
            return;
        }

        suggestions.forEach(suggestion => {
            const suggestionCard = document.createElement('div');
            suggestionCard.className = 'suggestion-card';

            suggestionCard.innerHTML = `
                <div class="suggestion-icon">${suggestion.icon}</div>
                <div class="suggestion-title">${suggestion.title}</div>
                <div class="suggestion-description">${suggestion.description}</div>
                <button class="suggestion-action" data-action="${suggestion.action}">
                    Try This
                </button>
            `;

            // Add click handler for suggestion actions
            suggestionCard.querySelector('.suggestion-action').addEventListener('click', () => {
                this.handleSuggestionAction(suggestion.action, suggestion);
            });

            suggestionsGrid.appendChild(suggestionCard);
        });
    }

    displayMetadata(analysisData) {
        document.getElementById('processing-time').textContent = `${analysisData.processingTime}ms`;
        document.getElementById('analysis-type').textContent = analysisData.analysisType;
        document.getElementById('analysis-timestamp').textContent = 
            new Date(analysisData.timestamp).toLocaleString();
    }

    handleSuggestionAction(action, suggestion) {
        switch (action) {
            case 'breathing_exercise':
                this.showBreathingExercise();
                break;
            case 'prayer_time':
                this.showPrayerGuidance();
                break;
            case 'gratitude_practice':
                this.showGratitudePractice();
                break;
            case 'tasbih_counter':
                this.openTasbihCounter();
                break;
            case 'spiritual_reflection':
                this.showSpiritualReflection();
                break;
            default:
                alert(`Action: ${action}\n\n${suggestion.description}`);
        }
    }

    showBreathingExercise() {
        alert('Breathing Exercise:\n\n1. Breathe in for 4 counts\n2. Hold for 7 counts\n3. Breathe out for 8 counts\n4. Repeat 4 times\n\nThis will help calm your nervous system.');
    }

    showPrayerGuidance() {
        alert('Take a moment for prayer or meditation:\n\n• Find a quiet space\n• Focus on your breathing\n• Connect with the divine\n• Ask for peace and guidance\n• Express gratitude for your blessings');
    }

    showGratitudePractice() {
        const gratitudeItems = prompt('List three things you\'re grateful for today (separate with commas):');
        if (gratitudeItems) {
            alert(`Beautiful! You\'re grateful for:\n\n${gratitudeItems.split(',').map((item, i) => `${i + 1}. ${item.trim()}`).join('\n')}\n\nGratitude opens the heart to more blessings.`);
        }
    }

    openTasbihCounter() {
        // This would integrate with the existing tasbih functionality
        alert('Opening Digital Tasbih...\n\nThis would open the tasbih counter for dhikr and remembrance.');
    }

    showSpiritualReflection() {
        alert('Spiritual Reflection Guide:\n\n• What is your heart telling you right now?\n• How can you grow closer to the divine?\n• What spiritual practices bring you peace?\n• How can you serve others today?\n\nTake time to contemplate these questions.');
    }

    startVoiceRecording() {
        if (!this.voiceRecognition) {
            this.showError('Voice recognition is not supported in this browser.');
            return;
        }

        try {
            this.voiceRecognition.start();
            
            document.getElementById('start-voice-recording').disabled = true;
            document.getElementById('stop-voice-recording').disabled = false;
            document.getElementById('recording-indicator').classList.add('active');
            document.getElementById('recording-text').textContent = 'Recording... Speak now';
            
        } catch (error) {
            console.error('Voice recording error:', error);
            this.showError('Failed to start voice recording: ' + error.message);
        }
    }

    stopVoiceRecording() {
        if (this.voiceRecognition) {
            this.voiceRecognition.stop();
        }
        this.resetVoiceRecording();
    }

    resetVoiceRecording() {
        document.getElementById('start-voice-recording').disabled = false;
        document.getElementById('stop-voice-recording').disabled = true;
        document.getElementById('recording-indicator').classList.remove('active');
        document.getElementById('recording-text').textContent = 'Click "Start Recording" to begin';
    }

    handleImageFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showError('Image file is too large. Please select a file under 10MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImageData = e.target.result;
            this.showImagePreview(e.target.result);
            document.getElementById('analyze-image-btn').disabled = false;
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(imageSrc) {
        const imagePreview = document.getElementById('image-preview');
        const previewImage = document.getElementById('preview-image');
        
        previewImage.src = imageSrc;
        imagePreview.style.display = 'block';
    }

    removeImage() {
        this.currentImageData = null;
        document.getElementById('image-preview').style.display = 'none';
        document.getElementById('analyze-image-btn').disabled = true;
        document.getElementById('image-file-input').value = '';
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.getElementById('camera-preview');
            
            video.srcObject = stream;
            video.style.display = 'block';
            document.getElementById('capture-photo-btn').style.display = 'inline-block';
            document.getElementById('start-camera-btn').style.display = 'none';
            
        } catch (error) {
            console.error('Camera access error:', error);
            this.showError('Failed to access camera: ' + error.message);
        }
    }

    capturePhoto() {
        const video = document.getElementById('camera-preview');
        const canvas = document.createElement('canvas');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        this.currentImageData = canvas.toDataURL('image/png');
        this.showImagePreview(this.currentImageData);
        
        // Stop camera
        const stream = video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        video.style.display = 'none';
        document.getElementById('capture-photo-btn').style.display = 'none';
        document.getElementById('start-camera-btn').style.display = 'inline-block';
        document.getElementById('analyze-image-btn').disabled = false;
    }

    async saveAnalysis() {
        if (!this.currentAnalysis) return;

        try {
            // Analysis is already saved to history by default
            // This could trigger additional save actions like bookmarking
            this.showSuccess('Analysis saved to your mood history!');
            
        } catch (error) {
            console.error('Save analysis error:', error);
            this.showError('Failed to save analysis.');
        }
    }

    async shareAnalysis() {
        if (!this.currentAnalysis) return;

        const shareText = `My mood analysis: ${this.currentAnalysis.primaryEmotion} (${Math.round(this.currentAnalysis.confidence * 100)}% confidence) - Mirror of Heart App`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Mood Analysis',
                    text: shareText
                });
            } catch (error) {
                console.error('Share error:', error);
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(shareText);
                this.showSuccess('Analysis copied to clipboard!');
            } catch (error) {
                console.error('Clipboard error:', error);
                this.showError('Failed to copy to clipboard.');
            }
        }
    }

    clearResults() {
        document.getElementById('mood-results').style.display = 'none';
        this.currentAnalysis = null;
    }

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
            await this.loadAnalyticsData();
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
            } else {
                throw new Error(response.error);
            }

        } catch (error) {
            console.error('Load history error:', error);
            this.showError('Failed to load mood history.');
        }
    }

    displayHistory(entries) {
        const historyContent = document.getElementById('history-content');
        
        if (entries.length === 0) {
            historyContent.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">📊</div>
                    <p>No mood entries found</p>
                    <p>Start analyzing your mood to see your history here</p>
                </div>
            `;
            return;
        }

        historyContent.innerHTML = entries.map(entry => `
            <div class="history-entry">
                <div class="history-header">
                    <span class="history-emotion emotion-${entry.primaryEmotion}">
                        ${entry.primaryEmotion}
                    </span>
                    <span class="history-date">
                        ${new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <div class="history-details">
                    <span>Confidence: ${Math.round(entry.confidence * 100)}%</span>
                    <span>Intensity: ${entry.intensity}</span>
                    <span>Type: ${entry.analysisType}</span>
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

    async loadAnalyticsData() {
        try {
            const response = await this.makeApiRequest('/api/mood/analytics?timeframe=30d');
            
            if (response.success) {
                this.displayAnalytics(response.data);
            } else {
                throw new Error(response.error);
            }

        } catch (error) {
            console.error('Load analytics error:', error);
            this.showError('Failed to load mood analytics.');
        }
    }

    displayAnalytics(analyticsData) {
        const analyticsContent = document.getElementById('analytics-content');
        
        analyticsContent.innerHTML = `
            <div class="analytics-overview">
                <div class="analytics-card">
                    <div class="analytics-number">${analyticsData.totalEntries}</div>
                    <div class="analytics-label">Total Analyses</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-number emotion-${analyticsData.dominantEmotion?.toLowerCase() || 'neutral'}">
                        ${analyticsData.dominantEmotion || 'None'}
                    </div>
                    <div class="analytics-label">Dominant Emotion</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-number">${Math.round(analyticsData.averageConfidence * 100)}%</div>
                    <div class="analytics-label">Avg Confidence</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-number">${Math.round(analyticsData.moodStability * 100)}%</div>
                    <div class="analytics-label">Mood Stability</div>
                </div>
            </div>
            
            <div class="emotion-chart">
                <h4>Emotion Distribution (${analyticsData.timeframe})</h4>
                <div class="distribution-chart">
                    ${Object.entries(analyticsData.emotionDistribution || {}).map(([emotion, count]) => {
                        const maxCount = Math.max(...Object.values(analyticsData.emotionDistribution));
                        const percentage = (count / maxCount) * 100;
                        return `
                            <div class="distribution-bar">
                                <div class="distribution-label">${emotion}</div>
                                <div class="distribution-fill emotion-${emotion}" style="width: ${percentage}%">
                                    <span class="distribution-count">${count}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="intensity-chart">
                <h4>Intensity Distribution</h4>
                <div class="intensity-chart">
                    ${Object.entries(analyticsData.intensityDistribution || {}).map(([intensity, count]) => `
                        <div class="intensity-item">
                            <div class="intensity-label">${intensity}</div>
                            <div class="intensity-value">${count}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${analyticsData.insights && analyticsData.insights.length > 0 ? `
                <div class="insights">
                    <h4>Key Insights</h4>
                    <ul>
                        ${analyticsData.insights.map(insight => `
                            <li>${insight.message}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
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
            throw new Error('Too many requests. Please wait a moment before analyzing again.');
        }
        
        if (response.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        
        return await response.json();
    }

    handleAnalysisError(error) {
        this.retryAttempts++;
        
        if (error.message.includes('Too many requests')) {
            this.showError('Rate limit reached. Please wait a moment before analyzing again.');
        } else if (error.message.includes('timeout')) {
            this.showError('Analysis timed out. Please try again.');
        } else if (this.retryAttempts < this.maxRetryAttempts) {
            this.showError(`Analysis failed. Retrying... (${this.retryAttempts}/${this.maxRetryAttempts})`);
            setTimeout(() => {
                // Retry the last analysis
                const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
                this.analyzeCurrentTab(activeTab);
            }, 2000);
        } else {
            this.showError('Analysis failed after multiple attempts. Please try again later.');
            this.retryAttempts = 0;
        }
    }

    updateCharacterCount(input, countElement) {
        const count = input.value.length;
        const max = input.maxLength;
        
        countElement.textContent = count;
        
        if (count > max * 0.9) {
            countElement.style.color = '#ef4444';
        } else if (count > max * 0.7) {
            countElement.style.color = '#f59e0b';
        } else {
            countElement.style.color = '#6b7280';
        }
    }

    updateStatus(status, text) {
        const indicator = document.getElementById('mood-status-indicator');
        const statusText = document.getElementById('mood-status-text');
        
        indicator.className = `status-indicator ${status}`;
        statusText.textContent = text;
    }

    showLoading(show) {
        const overlay = document.getElementById('mood-loading-overlay');
        overlay.style.display = show ? 'flex' : 'none';
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

    showSuccess(message) {
        // Create or update success notification
        let successNotification = document.getElementById('mood-success-notification');
        if (!successNotification) {
            successNotification = document.createElement('div');
            successNotification.id = 'mood-success-notification';
            successNotification.className = 'error-notification';
            successNotification.style.background = '#10b981';
            document.body.appendChild(successNotification);
        }
        
        successNotification.textContent = message;
        successNotification.style.display = 'block';
        
        setTimeout(() => {
            successNotification.style.display = 'none';
        }, 3000);
    }

    // Cleanup method
    destroy() {
        this.analysisHistory = [];
        this.currentAnalysis = null;
        this.currentImageData = null;
        
        if (this.voiceRecognition) {
            this.voiceRecognition.abort();
        }
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }
}

// Initialize mood detector when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if user is logged in
    if (localStorage.getItem('token')) {
        window.moodDetector = new MoodDetector();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoodDetector;
}