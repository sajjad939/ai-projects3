class MoodDetector {
    constructor() {
        this.currentAnalysis = null;
        this.analysisHistory = [];
        this.isAnalyzing = false;
        this.retryAttempts = 0;
        this.maxRetryAttempts = 3;
        
        this.init();
    }

    init() {
        this.createMoodInterface();
        this.bindEvents();
        this.loadAnalyticsData();
        
        // Auto-focus first input
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
                        <span class="status-indicator" id="mood-status-indicator"></span>
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
                            placeholder="Share your thoughts and feelings... How are you doing today?"
                            rows="4"
                            maxlength="5000"
                        ></textarea>
                        <div class="input-footer">
                            <div class="input-options">
                                <label>
                                    <input type="checkbox" id="include-spiritual-context" checked>
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
                            <div class="recording-indicator" id="recording-indicator"></div>
                            <span id="recording-text">Click "Start Recording" to begin</span>
                        </div>
                        <div class="voice-transcript" id="voice-transcript">
                            Voice transcript will appear here...
                        </div>
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
                                <p>Upload an image or take a photo</p>
                                <p class="upload-hint">Drag and drop or click to select</p>
                            </div>
                            <input type="file" id="image-file-input" accept="image/*" style="display: none;">
                        </div>
                        <div class="camera-section">
                            <video id="camera-preview" autoplay playsinline style="display: none;"></video>
                            <div class="image-preview" id="image-preview" style="display: none;">
                                <img id="preview-image" alt="Selected image">
                                <button class="btn-remove" id="remove-image">×</button>
                            </div>
                            <button id="camera-btn" class="btn-secondary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                    <circle cx="12" cy="13" r="4"/>
                                </svg>
                                Use Camera
                            </button>
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
                            <label for="combined-text-input">Text (Optional)</label>
                            <textarea 
                                id="combined-text-input" 
                                placeholder="Add text to complement your voice or image..."
                                rows="3"
                                maxlength="2000"
                            ></textarea>
                        </div>
                        <div class="combined-options">
                            <label>
                                <input type="checkbox" id="combined-voice">
                                Include voice recording
                            </label>
                            <label>
                                <input type="checkbox" id="combined-image">
                                Include image
                            </label>
                        </div>
                        <button id="analyze-combined-btn" class="analyze-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4"/>
                            </svg>
                            Analyze Combined
                        </button>
                    </div>
                </div>
            </div>

            <!-- Results Section -->
            <div class="mood-results" id="mood-results" style="display: none;">
                <div class="results-header">
                    <h3>Analysis Results</h3>
                    <div class="results-actions">
                        <button id="save-result-btn" class="btn-secondary">Save</button>
                        <button id="share-result-btn" class="btn-secondary">Share</button>
                    </div>
                </div>

                <!-- Primary Emotion Display -->
                <div class="primary-emotion" id="primary-emotion">
                    <div class="emotion-display">
                        <div class="emotion-icon" id="emotion-icon">😊</div>
                        <div class="emotion-info">
                            <div class="emotion-name" id="emotion-name">Peaceful</div>
                            <div class="emotion-confidence" id="emotion-confidence">Confidence: 85%</div>
                            <div class="emotion-intensity" id="emotion-intensity">Intensity: Medium</div>
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
                    <div id="insights-content"></div>
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

            <!-- Loading Overlay -->
            <div class="loading-overlay" id="loading-overlay" style="display: none;">
                <div class="loading-spinner"></div>
                <p id="loading-text">Analyzing your mood...</p>
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
                        <option value="30d">Last 30 days</option>
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

            <!-- Error Notification -->
            <div class="error-notification" id="error-notification" style="display: none;">
                <span id="error-message">An error occurred</span>
            </div>
        `;

        // Find the appropriate container and insert the mood detector
        let targetContainer = document.getElementById('mood-section');
        if (!targetContainer) {
            // Create a new block in the first column
            targetContainer = document.createElement('div');
            targetContainer.id = 'mood-section';
            targetContainer.className = 'chatgpt-block';
            
            const firstColumn = document.querySelector('.chatgpt-column');
            if (firstColumn) {
                firstColumn.appendChild(targetContainer);
            } else {
                // Fallback: append to body
                document.body.appendChild(targetContainer);
            }
        }
        
        targetContainer.innerHTML = '';
        targetContainer.appendChild(moodContainer);
    }

    bindEvents() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // Text analysis
        const textInput = document.getElementById('mood-text-input');
        const analyzeTextBtn = document.getElementById('analyze-text-btn');
        
        if (textInput) {
            textInput.addEventListener('input', () => {
                this.updateCharacterCount('text');
                this.validateTextInput();
            });
        }
        
        if (analyzeTextBtn) {
            analyzeTextBtn.addEventListener('click', () => this.analyzeText());
        }

        // Voice recording
        const startRecordingBtn = document.getElementById('start-voice-recording');
        const stopRecordingBtn = document.getElementById('stop-voice-recording');
        const analyzeVoiceBtn = document.getElementById('analyze-voice-btn');
        
        if (startRecordingBtn) {
            startRecordingBtn.addEventListener('click', () => this.startVoiceRecording());
        }
        if (stopRecordingBtn) {
            stopRecordingBtn.addEventListener('click', () => this.stopVoiceRecording());
        }
        if (analyzeVoiceBtn) {
            analyzeVoiceBtn.addEventListener('click', () => this.analyzeVoice());
        }

        // Image upload
        const imageUploadArea = document.getElementById('image-upload-area');
        const imageFileInput = document.getElementById('image-file-input');
        const cameraBtn = document.getElementById('camera-btn');
        const analyzeImageBtn = document.getElementById('analyze-image-btn');
        const removeImageBtn = document.getElementById('remove-image');
        
        if (imageUploadArea) {
            imageUploadArea.addEventListener('click', () => imageFileInput?.click());
            imageUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            imageUploadArea.addEventListener('drop', (e) => this.handleImageDrop(e));
        }
        
        if (imageFileInput) {
            imageFileInput.addEventListener('change', (e) => this.handleImageSelect(e));
        }
        
        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => this.toggleCamera());
        }
        
        if (analyzeImageBtn) {
            analyzeImageBtn.addEventListener('click', () => this.analyzeImage());
        }
        
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', () => this.removeImage());
        }

        // Combined analysis
        const analyzeCombinedBtn = document.getElementById('analyze-combined-btn');
        if (analyzeCombinedBtn) {
            analyzeCombinedBtn.addEventListener('click', () => this.analyzeCombined());
        }

        // History and analytics
        const historyBtn = document.getElementById('mood-history-btn');
        const analyticsBtn = document.getElementById('mood-analytics-btn');
        const closeHistoryBtn = document.getElementById('close-history-btn');
        const closeAnalyticsBtn = document.getElementById('close-analytics-btn');
        
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.toggleHistoryPanel());
        }
        if (analyticsBtn) {
            analyticsBtn.addEventListener('click', () => this.toggleAnalyticsPanel());
        }
        if (closeHistoryBtn) {
            closeHistoryBtn.addEventListener('click', () => this.toggleHistoryPanel(false));
        }
        if (closeAnalyticsBtn) {
            closeAnalyticsBtn.addEventListener('click', () => this.toggleAnalyticsPanel(false));
        }

        // History filters
        const historyTimeframe = document.getElementById('history-timeframe');
        const historyEmotionFilter = document.getElementById('history-emotion-filter');
        
        if (historyTimeframe) {
            historyTimeframe.addEventListener('change', () => this.loadHistory());
        }
        if (historyEmotionFilter) {
            historyEmotionFilter.addEventListener('change', () => this.loadHistory());
        }

        // Result actions
        const saveResultBtn = document.getElementById('save-result-btn');
        const shareResultBtn = document.getElementById('share-result-btn');
        
        if (saveResultBtn) {
            saveResultBtn.addEventListener('click', () => this.saveResult());
        }
        if (shareResultBtn) {
            shareResultBtn.addEventListener('click', () => this.shareResult());
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
                document.getElementById('mood-text-input')?.focus();
            } else if (tabName === 'combined') {
                document.getElementById('combined-text-input')?.focus();
            }
        }, 100);
    }

    updateCharacterCount(type) {
        const input = document.getElementById(type === 'text' ? 'mood-text-input' : 'combined-text-input');
        const counter = document.getElementById(type === 'text' ? 'text-char-count' : 'combined-char-count');
        
        if (input && counter) {
            const count = input.value.length;
            counter.textContent = count;
            
            // Update color based on length
            if (count > 4500) {
                counter.style.color = '#e74c3c';
            } else if (count > 4000) {
                counter.style.color = '#f39c12';
            } else {
                counter.style.color = '#666';
            }
        }
    }

    validateTextInput() {
        const textInput = document.getElementById('mood-text-input');
        const analyzeBtn = document.getElementById('analyze-text-btn');
        
        if (textInput && analyzeBtn) {
            const hasText = textInput.value.trim().length > 0;
            analyzeBtn.disabled = !hasText || this.isAnalyzing;
        }
    }

    async analyzeText() {
        const textInput = document.getElementById('mood-text-input');
        const includeSpiritual = document.getElementById('include-spiritual-context');
        
        if (!textInput || !textInput.value.trim()) {
            this.showError('Please enter some text to analyze');
            return;
        }

        const analysisData = {
            input: {
                type: 'text',
                content: textInput.value.trim(),
                context: {
                    includeSpiritual: includeSpiritual?.checked || false,
                    timeOfDay: this.getTimeOfDay()
                }
            },
            options: {
                includeInsights: true,
                includeSuggestions: true,
                saveToHistory: true
            }
        };

        await this.performAnalysis(analysisData);
    }

    async startVoiceRecording() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.showError('Voice recording is not supported in this browser');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.processAudioRecording(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.updateRecordingUI(true);

        } catch (error) {
            console.error('Voice recording error:', error);
            this.showError('Failed to start voice recording. Please check microphone permissions.');
        }
    }

    stopVoiceRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.updateRecordingUI(false);
        }
    }

    updateRecordingUI(isRecording) {
        const startBtn = document.getElementById('start-voice-recording');
        const stopBtn = document.getElementById('stop-voice-recording');
        const indicator = document.getElementById('recording-indicator');
        const text = document.getElementById('recording-text');
        const analyzeBtn = document.getElementById('analyze-voice-btn');

        if (startBtn) startBtn.disabled = isRecording;
        if (stopBtn) stopBtn.disabled = !isRecording;
        if (analyzeBtn) analyzeBtn.disabled = isRecording;

        if (indicator) {
            indicator.classList.toggle('active', isRecording);
        }

        if (text) {
            text.textContent = isRecording ? 'Recording... Click stop when finished' : 'Recording complete';
        }
    }

    async processAudioRecording(audioBlob) {
        try {
            // Convert audio to base64
            const reader = new FileReader();
            reader.onload = () => {
                this.currentAudioData = reader.result.split(',')[1]; // Remove data URL prefix
                document.getElementById('analyze-voice-btn').disabled = false;
                
                // Try to get transcript using Web Speech API
                this.transcribeAudio();
            };
            reader.readAsDataURL(audioBlob);

        } catch (error) {
            console.error('Audio processing error:', error);
            this.showError('Failed to process audio recording');
        }
    }

    transcribeAudio() {
        // For now, show placeholder text
        // In a real implementation, you would use a speech-to-text service
        const transcript = document.getElementById('voice-transcript');
        if (transcript) {
            transcript.textContent = 'Audio recorded successfully. Click "Analyze Voice" to process.';
        }
    }

    async analyzeVoice() {
        if (!this.currentAudioData) {
            this.showError('No audio recording available');
            return;
        }

        const analysisData = {
            input: {
                type: 'voice',
                audioData: this.currentAudioData,
                context: {
                    timeOfDay: this.getTimeOfDay()
                }
            },
            options: {
                includeInsights: true,
                includeSuggestions: true,
                saveToHistory: true
            }
        };

        await this.performAnalysis(analysisData);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
    }

    handleImageDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processImageFile(files[0]);
        }
    }

    handleImageSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processImageFile(file);
        }
    }

    processImageFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showError('Image file is too large. Please select a file under 10MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImageData = e.target.result.split(',')[1]; // Remove data URL prefix
            this.showImagePreview(e.target.result);
            document.getElementById('analyze-image-btn').disabled = false;
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(imageSrc) {
        const uploadArea = document.getElementById('image-upload-area');
        const preview = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-image');

        if (uploadArea) uploadArea.style.display = 'none';
        if (preview) preview.style.display = 'block';
        if (previewImg) previewImg.src = imageSrc;
    }

    removeImage() {
        const uploadArea = document.getElementById('image-upload-area');
        const preview = document.getElementById('image-preview');
        const analyzeBtn = document.getElementById('analyze-image-btn');
        const fileInput = document.getElementById('image-file-input');

        if (uploadArea) uploadArea.style.display = 'block';
        if (preview) preview.style.display = 'none';
        if (analyzeBtn) analyzeBtn.disabled = true;
        if (fileInput) fileInput.value = '';

        this.currentImageData = null;
    }

    async toggleCamera() {
        // Camera functionality would be implemented here
        this.showError('Camera functionality coming soon!');
    }

    async analyzeImage() {
        if (!this.currentImageData) {
            this.showError('No image selected');
            return;
        }

        const analysisData = {
            input: {
                type: 'image',
                imageData: this.currentImageData,
                context: {
                    timeOfDay: this.getTimeOfDay()
                }
            },
            options: {
                includeInsights: true,
                includeSuggestions: true,
                saveToHistory: true
            }
        };

        await this.performAnalysis(analysisData);
    }

    async analyzeCombined() {
        const textInput = document.getElementById('combined-text-input');
        const includeVoice = document.getElementById('combined-voice');
        const includeImage = document.getElementById('combined-image');

        const hasText = textInput && textInput.value.trim();
        const hasVoice = includeVoice?.checked && this.currentAudioData;
        const hasImage = includeImage?.checked && this.currentImageData;

        if (!hasText && !hasVoice && !hasImage) {
            this.showError('Please provide at least one input (text, voice, or image)');
            return;
        }

        const analysisData = {
            input: {
                type: 'combined',
                content: hasText ? textInput.value.trim() : undefined,
                audioData: hasVoice ? this.currentAudioData : undefined,
                imageData: hasImage ? this.currentImageData : undefined,
                context: {
                    timeOfDay: this.getTimeOfDay()
                }
            },
            options: {
                includeInsights: true,
                includeSuggestions: true,
                saveToHistory: true
            }
        };

        await this.performAnalysis(analysisData);
    }

    async performAnalysis(analysisData) {
        if (this.isAnalyzing) return;

        this.isAnalyzing = true;
        this.showLoading(true);
        this.retryAttempts = 0;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch('/api/mood/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(analysisData)
            });

            if (response.status === 429) {
                throw new Error('Too many requests. Please wait a moment before analyzing again.');
            }

            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Analysis failed');
            }

            const result = await response.json();
            
            if (result.success) {
                this.currentAnalysis = result.data;
                this.displayResults(result.data);
                this.analysisHistory.unshift(result.data);
            } else {
                throw new Error(result.error || 'Analysis failed');
            }

        } catch (error) {
            console.error('Analysis error:', error);
            this.handleAnalysisError(error, analysisData);
        } finally {
            this.isAnalyzing = false;
            this.showLoading(false);
        }
    }

    handleAnalysisError(error, analysisData) {
        if (error.message.includes('rate limit') || error.message.includes('Too many requests')) {
            this.showError('You\'ve reached the analysis limit. Please wait a moment before trying again.');
        } else if (error.message.includes('Authentication')) {
            this.showError('Please log in to use mood analysis.');
        } else if (this.retryAttempts < this.maxRetryAttempts) {
            this.retryAttempts++;
            this.showError(`Analysis failed. Retrying... (${this.retryAttempts}/${this.maxRetryAttempts})`);
            setTimeout(() => {
                this.performAnalysis(analysisData);
            }, Math.pow(2, this.retryAttempts) * 1000);
        } else {
            this.showError(error.message || 'Analysis failed. Please try again.');
        }
    }

    displayResults(data) {
        const resultsSection = document.getElementById('mood-results');
        if (!resultsSection) return;

        // Show results section
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        // Update primary emotion
        this.updatePrimaryEmotion(data);

        // Update emotion breakdown
        this.updateEmotionBreakdown(data.emotions);

        // Update spiritual context
        this.updateSpiritualContext(data.spiritualContext);

        // Update insights
        this.updateInsights(data.insights);

        // Update suggestions
        this.updateSuggestions(data.suggestions);

        // Update metadata
        this.updateMetadata(data);
    }

    updatePrimaryEmotion(data) {
        const emotionIcon = document.getElementById('emotion-icon');
        const emotionName = document.getElementById('emotion-name');
        const emotionConfidence = document.getElementById('emotion-confidence');
        const emotionIntensity = document.getElementById('emotion-intensity');
        const primaryEmotion = document.getElementById('primary-emotion');

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

        if (emotionIcon) emotionIcon.textContent = emotionIcons[data.primaryEmotion] || '😐';
        if (emotionName) emotionName.textContent = data.primaryEmotion.charAt(0).toUpperCase() + data.primaryEmotion.slice(1);
        if (emotionConfidence) emotionConfidence.textContent = `Confidence: ${Math.round(data.confidence * 100)}%`;
        if (emotionIntensity) emotionIntensity.textContent = `Intensity: ${data.intensity.charAt(0).toUpperCase() + data.intensity.slice(1)}`;
        
        if (primaryEmotion) {
            primaryEmotion.className = `primary-emotion emotion-${data.primaryEmotion}`;
        }
    }

    updateEmotionBreakdown(emotions) {
        const emotionBars = document.getElementById('emotion-bars');
        if (!emotionBars || !emotions) return;

        const maxScore = Math.max(...Object.values(emotions));
        
        emotionBars.innerHTML = Object.entries(emotions)
            .sort(([,a], [,b]) => b - a)
            .map(([emotion, score]) => `
                <div class="emotion-bar-container">
                    <div class="emotion-bar-label">${emotion}</div>
                    <div class="emotion-bar">
                        <div class="emotion-bar-fill emotion-${emotion}" 
                             style="width: ${(score / maxScore) * 100}%">
                            <span class="emotion-bar-score">${Math.round(score * 100)}%</span>
                        </div>
                    </div>
                </div>
            `).join('');
    }

    updateSpiritualContext(spiritualContext) {
        const spiritualSection = document.getElementById('spiritual-context');
        const spiritualScore = document.getElementById('spiritual-score-value');
        const spiritualTradition = document.getElementById('spiritual-tradition-value');
        const spiritualTags = document.getElementById('spiritual-tags');

        if (!spiritualContext || !spiritualContext.isSpiritual) {
            if (spiritualSection) spiritualSection.style.display = 'none';
            return;
        }

        if (spiritualSection) spiritualSection.style.display = 'block';
        
        if (spiritualScore) {
            const scoreText = spiritualContext.score > 0.7 ? 'High' : 
                             spiritualContext.score > 0.4 ? 'Medium' : 'Low';
            spiritualScore.textContent = scoreText;
        }
        
        if (spiritualTradition) {
            spiritualTradition.textContent = spiritualContext.suggestedTradition || 'Universal';
        }
        
        if (spiritualTags) {
            const allTerms = [
                ...spiritualContext.detectedTerms.spiritual,
                ...spiritualContext.detectedTerms.religious,
                ...spiritualContext.detectedTerms.practices
            ];
            
            spiritualTags.innerHTML = allTerms
                .slice(0, 5)
                .map(term => `<span class="spiritual-tag">${term}</span>`)
                .join('');
        }
    }

    updateInsights(insights) {
        const insightsContent = document.getElementById('insights-content');
        if (!insightsContent || !insights || insights.length === 0) {
            if (insightsContent) insightsContent.innerHTML = '<p>No specific insights available.</p>';
            return;
        }

        insightsContent.innerHTML = insights.map(insight => `
            <div class="insight insight-${insight.type}">
                <div class="insight-icon">${insight.icon || '💡'}</div>
                <div class="insight-content">
                    <div class="insight-message">${insight.message}</div>
                </div>
            </div>
        `).join('');
    }

    updateSuggestions(suggestions) {
        const suggestionsGrid = document.getElementById('suggestions-grid');
        if (!suggestionsGrid || !suggestions || suggestions.length === 0) {
            if (suggestionsGrid) suggestionsGrid.innerHTML = '<p>No suggestions available at this time.</p>';
            return;
        }

        suggestionsGrid.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-card" data-action="${suggestion.action}">
                <div class="suggestion-icon">${suggestion.icon || '💡'}</div>
                <div class="suggestion-title">${suggestion.title}</div>
                <div class="suggestion-description">${suggestion.description}</div>
                <button class="suggestion-action" onclick="window.moodDetector.handleSuggestionAction('${suggestion.action}')">
                    Try This
                </button>
            </div>
        `).join('');
    }

    updateMetadata(data) {
        const processingTime = document.getElementById('processing-time');
        const analysisType = document.getElementById('analysis-type');
        const analysisTimestamp = document.getElementById('analysis-timestamp');

        if (processingTime) processingTime.textContent = `${data.processingTime}ms`;
        if (analysisType) analysisType.textContent = data.analysisType;
        if (analysisTimestamp) {
            const date = new Date(data.timestamp);
            analysisTimestamp.textContent = date.toLocaleString();
        }
    }

    handleSuggestionAction(action) {
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
            default:
                this.showError('This suggestion action is not yet implemented.');
        }
    }

    showBreathingExercise() {
        alert('Breathing Exercise:\n\n1. Inhale for 4 counts\n2. Hold for 7 counts\n3. Exhale for 8 counts\n4. Repeat 4 times\n\nThis helps activate your parasympathetic nervous system and reduce anxiety.');
    }

    showPrayerGuidance() {
        alert('Take a moment for prayer or meditation:\n\n• Find a quiet space\n• Focus on your breathing\n• Connect with your spiritual center\n• Ask for guidance and peace\n• Express gratitude for your blessings');
    }

    showGratitudePractice() {
        const gratitudeItems = prompt('Gratitude Practice:\n\nList 3 things you\'re grateful for today (separate with commas):');
        if (gratitudeItems) {
            alert(`Beautiful! Your gratitude list:\n\n${gratitudeItems.split(',').map((item, i) => `${i + 1}. ${item.trim()}`).join('\n')}\n\nTake a moment to feel the warmth of these blessings.`);
        }
    }

    openTasbihCounter() {
        // This would integrate with the existing tasbih functionality
        alert('Opening Digital Tasbih counter...\n\nThis would connect to your existing tasbih feature for dhikr and remembrance.');
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        const statusIndicator = document.getElementById('mood-status-indicator');
        const statusText = document.getElementById('mood-status-text');

        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }

        if (statusIndicator) {
            statusIndicator.className = show ? 'status-indicator analyzing' : 'status-indicator';
        }

        if (statusText) {
            statusText.textContent = show ? 'Analyzing...' : 'Ready to analyze';
        }

        // Disable all analyze buttons while loading
        document.querySelectorAll('.analyze-btn').forEach(btn => {
            btn.disabled = show;
        });
    }

    showError(message) {
        const errorNotification = document.getElementById('error-notification');
        const errorMessage = document.getElementById('error-message');

        if (errorNotification && errorMessage) {
            errorMessage.textContent = message;
            errorNotification.style.display = 'block';

            setTimeout(() => {
                errorNotification.style.display = 'none';
            }, 5000);
        } else {
            // Fallback to alert
            alert(`Error: ${message}`);
        }
    }

    toggleHistoryPanel(show = null) {
        const panel = document.getElementById('mood-history-panel');
        if (!panel) return;

        const isVisible = panel.classList.contains('visible');
        
        if (show === null) {
            show = !isVisible;
        }

        if (show) {
            panel.classList.add('visible');
            this.loadHistory();
        } else {
            panel.classList.remove('visible');
        }
    }

    toggleAnalyticsPanel(show = null) {
        const panel = document.getElementById('mood-analytics-panel');
        if (!panel) return;

        const isVisible = panel.classList.contains('visible');
        
        if (show === null) {
            show = !isVisible;
        }

        if (show) {
            panel.classList.add('visible');
            this.loadAnalyticsData();
        } else {
            panel.classList.remove('visible');
        }
    }

    async loadHistory() {
        const historyContent = document.getElementById('history-content');
        const timeframe = document.getElementById('history-timeframe')?.value || '30d';
        const emotionFilter = document.getElementById('history-emotion-filter')?.value || '';

        if (!historyContent) return;

        try {
            const token = localStorage.getItem('token');
            let url = `/api/mood/history?timeframe=${timeframe}&limit=20`;
            if (emotionFilter) {
                url += `&emotions=${emotionFilter}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load history');

            const result = await response.json();
            
            if (result.success && result.data.entries.length > 0) {
                historyContent.innerHTML = result.data.entries.map(entry => `
                    <div class="history-entry">
                        <div class="history-header">
                            <span class="history-emotion emotion-${entry.primaryEmotion}">${entry.primaryEmotion}</span>
                            <span class="history-date">${new Date(entry.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="history-details">
                            <span>Confidence: ${Math.round(entry.confidence * 100)}%</span>
                            <span>Intensity: ${entry.intensity}</span>
                            <span>Type: ${entry.analysisType}</span>
                        </div>
                        ${entry.insights && entry.insights.length > 0 ? `
                            <div class="history-insights">
                                ${entry.insights.slice(0, 2).map(insight => `
                                    <div class="history-insight">${insight.message}</div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            } else {
                historyContent.innerHTML = `
                    <div class="empty-history">
                        <div class="empty-icon">📊</div>
                        <p>No mood entries found</p>
                        <p>Start analyzing your mood to see history here</p>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Load history error:', error);
            historyContent.innerHTML = '<p>Failed to load history. Please try again.</p>';
        }
    }

    async loadAnalyticsData() {
        const analyticsContent = document.getElementById('analytics-content');
        if (!analyticsContent) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/mood/analytics?timeframe=30d', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load analytics');

            const result = await response.json();
            
            if (result.success) {
                const data = result.data;
                analyticsContent.innerHTML = `
                    <div class="analytics-overview">
                        <div class="analytics-card">
                            <div class="analytics-number">${data.totalEntries}</div>
                            <div class="analytics-label">Total Analyses</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-number">${data.dominantEmotion || 'N/A'}</div>
                            <div class="analytics-label">Dominant Emotion</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-number">${Math.round(data.averageConfidence * 100)}%</div>
                            <div class="analytics-label">Avg Confidence</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-number">${Math.round(data.moodStability * 100)}%</div>
                            <div class="analytics-label">Mood Stability</div>
                        </div>
                    </div>

                    <div class="emotion-chart">
                        <h4>Emotion Distribution</h4>
                        <div class="distribution-chart">
                            ${Object.entries(data.emotionDistribution || {}).map(([emotion, count]) => {
                                const percentage = (count / data.totalEntries) * 100;
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
                            ${Object.entries(data.intensityDistribution || {}).map(([intensity, count]) => `
                                <div class="intensity-item">
                                    <div class="intensity-value">${count}</div>
                                    <div class="intensity-label">${intensity}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    ${data.insights && data.insights.length > 0 ? `
                        <div class="insights">
                            <h4>Key Insights</h4>
                            <ul>
                                ${data.insights.map(insight => `<li>${insight.message}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                `;
            }

        } catch (error) {
            console.error('Load analytics error:', error);
            analyticsContent.innerHTML = '<p>Failed to load analytics. Please try again.</p>';
        }
    }

    saveResult() {
        if (!this.currentAnalysis) {
            this.showError('No analysis result to save');
            return;
        }

        // Analysis is already saved to history by default
        // This could trigger additional save actions like bookmarking
        alert('Analysis result saved to your mood history!');
    }

    shareResult() {
        if (!this.currentAnalysis) {
            this.showError('No analysis result to share');
            return;
        }

        const shareText = `My mood analysis: ${this.currentAnalysis.primaryEmotion} (${Math.round(this.currentAnalysis.confidence * 100)}% confidence) - Mirror of Heart`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My Mood Analysis',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Analysis result copied to clipboard!');
            }).catch(() => {
                alert('Share text:\n\n' + shareText);
            });
        }
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 6) return 'early_morning';
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        if (hour < 22) return 'evening';
        return 'night';
    }

    // Cleanup method
    destroy() {
        this.analysisHistory = [];
        this.currentAnalysis = null;
        this.currentAudioData = null;
        this.currentImageData = null;
        
        if (this.mediaRecorder) {
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