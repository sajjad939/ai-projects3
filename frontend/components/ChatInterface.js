class ChatInterface {
    constructor() {
        this.currentSessionId = null;
        this.isLoading = false;
        this.conversations = [];
        this.currentConversation = [];
        this.emotionHistory = [];
        this.messageQueue = [];
        this.isTyping = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        
        this.init();
    }

    init() {
        this.createChatInterface();
        this.bindEvents();
        this.loadConversations();
        this.setupKeyboardShortcuts();
        this.setupAutoSave();
        
        // Auto-focus message input
        setTimeout(() => {
            const messageInput = document.getElementById('chat-message-input');
            if (messageInput) messageInput.focus();
        }, 100);
    }

    createChatInterface() {
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chat-interface';
        chatContainer.className = 'chat-interface';
        
        chatContainer.innerHTML = `
            <div class="chat-header">
                <div class="chat-title">
                    <h2>Spiritual Companion</h2>
                    <div class="chat-status">
                        <span class="status-indicator online" id="connection-status"></span>
                        <span id="status-text">Ready to listen</span>
                    </div>
                </div>
                <div class="chat-controls">
                    <button id="new-conversation-btn" class="btn-secondary" title="Start New Conversation">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        New Chat
                    </button>
                    <button id="conversation-history-btn" class="btn-secondary" title="Conversation History">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 3h18v18H3zM9 9h6M9 15h6"/>
                        </svg>
                        History
                    </button>
                    <button id="analytics-btn" class="btn-secondary" title="Analytics">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 3v18h18M9 17V9M13 17V5M17 17v-3"/>
                        </svg>
                        Stats
                    </button>
                </div>
            </div>

            <div class="chat-sidebar" id="chat-sidebar">
                <div class="sidebar-header">
                    <h3>Conversations</h3>
                    <button id="close-sidebar-btn" class="btn-icon">×</button>
                </div>
                <div class="sidebar-content">
                    <div class="conversation-search">
                        <input type="text" id="conversation-search" placeholder="Search conversations..." />
                    </div>
                    <div class="conversation-list" id="conversation-list">
                        <!-- Conversations will be loaded here -->
                    </div>
                </div>
            </div>

            <div class="analytics-panel" id="analytics-panel">
                <div class="analytics-header">
                    <h3>Your Journey</h3>
                    <button id="close-analytics-btn" class="btn-icon">×</button>
                </div>
                <div class="analytics-content" id="analytics-content">
                    <!-- Analytics will be loaded here -->
                </div>
            </div>

            <div class="chat-messages" id="chat-messages">
                <div class="welcome-message">
                    <div class="welcome-content">
                        <div class="welcome-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </div>
                        <h3>Welcome to your spiritual companion</h3>
                        <p>I'm here to listen, support, and guide you on your spiritual journey. 
                           Share your thoughts, feelings, or questions, and I'll respond with care and wisdom.</p>
                        <div class="conversation-starters">
                            <button class="starter-btn" data-message="I'm feeling overwhelmed today and need some guidance">
                                I'm feeling overwhelmed today
                            </button>
                            <button class="starter-btn" data-message="Help me find peace in my heart">
                                Help me find peace in my heart
                            </button>
                            <button class="starter-btn" data-message="I want to strengthen my spiritual practice">
                                I want to strengthen my spiritual practice
                            </button>
                            <button class="starter-btn" data-message="I'm grateful for the blessings in my life">
                                I'm feeling grateful today
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="emotion-indicator" id="emotion-indicator">
                <div class="emotion-display">
                    <span class="emotion-label">Current mood:</span>
                    <span class="emotion-value" id="current-emotion">Neutral</span>
                    <div class="emotion-confidence" id="emotion-confidence"></div>
                </div>
                <div class="emotion-history" id="emotion-history">
                    <!-- Recent emotions will appear here -->
                </div>
            </div>

            <div class="chat-input-container">
                <div class="input-controls">
                    <button id="voice-input-btn" class="btn-icon" title="Voice Input">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                            <path d="M12 19v4M8 23h8"/>
                        </svg>
                    </button>
                    <div class="message-input-wrapper">
                        <textarea 
                            id="chat-message-input" 
                            placeholder="Share your thoughts, feelings, or questions..."
                            rows="1"
                            maxlength="2000"
                        ></textarea>
                        <div class="input-footer">
                            <div class="tone-selector">
                                <label for="conversation-tone">Tone:</label>
                                <select id="conversation-tone">
                                    <option value="supportive">Supportive</option>
                                    <option value="spiritual">Spiritual Guidance</option>
                                    <option value="reflective">Reflective</option>
                                </select>
                            </div>
                            <div class="character-count">
                                <span id="char-count">0</span>/2000
                            </div>
                        </div>
                    </div>
                    <button id="send-message-btn" class="btn-primary" title="Send Message">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                    </button>
                </div>
                <div class="quick-actions" id="quick-actions">
                    <button class="quick-action-btn" data-action="gratitude">
                        <span>🙏</span> Gratitude
                    </button>
                    <button class="quick-action-btn" data-action="prayer">
                        <span>🤲</span> Prayer
                    </button>
                    <button class="quick-action-btn" data-action="reflection">
                        <span>🧘</span> Reflection
                    </button>
                    <button class="quick-action-btn" data-action="guidance">
                        <span>✨</span> Guidance
                    </button>
                </div>
            </div>

            <div class="offline-indicator" id="offline-indicator">
                <span>You're offline. Messages will be sent when connection is restored.</span>
            </div>
        `;

        // Find the chat block or create it
        let chatBlock = document.getElementById('chat-section');
        if (!chatBlock) {
            chatBlock = document.createElement('div');
            chatBlock.id = 'chat-section';
            chatBlock.className = 'chatgpt-block';
            
            // Insert into the first column
            const firstColumn = document.querySelector('.chatgpt-column');
            if (firstColumn) {
                firstColumn.appendChild(chatBlock);
            } else {
                document.body.appendChild(chatBlock);
            }
        }
        
        chatBlock.innerHTML = '';
        chatBlock.appendChild(chatContainer);
    }

    bindEvents() {
        // Send message
        const sendBtn = document.getElementById('send-message-btn');
        const messageInput = document.getElementById('chat-message-input');
        
        sendBtn.addEventListener('click', () => this.sendMessage());
        
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea and update character count
        messageInput.addEventListener('input', (e) => {
            this.autoResizeTextarea(e.target);
            this.updateCharacterCount();
            this.showTypingIndicator();
        });

        // Conversation starters
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('starter-btn')) {
                const message = e.target.dataset.message;
                messageInput.value = message;
                this.sendMessage();
            }
        });

        // Quick actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-action-btn')) {
                const action = e.target.closest('.quick-action-btn').dataset.action;
                this.handleQuickAction(action);
            }
        });

        // New conversation
        document.getElementById('new-conversation-btn').addEventListener('click', () => {
            this.startNewConversation();
        });

        // Conversation history
        document.getElementById('conversation-history-btn').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Analytics
        document.getElementById('analytics-btn').addEventListener('click', () => {
            this.toggleAnalytics();
        });

        // Close sidebar
        document.getElementById('close-sidebar-btn').addEventListener('click', () => {
            this.toggleSidebar(false);
        });

        // Close analytics
        document.getElementById('close-analytics-btn').addEventListener('click', () => {
            this.toggleAnalytics(false);
        });

        // Voice input
        document.getElementById('voice-input-btn').addEventListener('click', () => {
            this.toggleVoiceInput();
        });

        // Conversation search
        document.getElementById('conversation-search').addEventListener('input', (e) => {
            this.filterConversations(e.target.value);
        });

        // Online/offline detection
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to send message
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
            
            // Ctrl/Cmd + N for new conversation
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.startNewConversation();
            }
            
            // Ctrl/Cmd + H for history
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                this.toggleSidebar();
            }
        });
    }

    setupAutoSave() {
        // Auto-save draft messages
        const messageInput = document.getElementById('chat-message-input');
        let saveTimeout;
        
        messageInput.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                localStorage.setItem('chat-draft', messageInput.value);
            }, 1000);
        });

        // Restore draft on load
        const draft = localStorage.getItem('chat-draft');
        if (draft && draft.trim()) {
            messageInput.value = draft;
            this.updateCharacterCount();
            this.autoResizeTextarea(messageInput);
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('chat-message-input');
        const message = messageInput.value.trim();
        
        if (!message || this.isLoading) return;

        const conversationTone = document.getElementById('conversation-tone').value;
        
        // Clear input and draft
        messageInput.value = '';
        localStorage.removeItem('chat-draft');
        this.updateCharacterCount();
        this.autoResizeTextarea(messageInput);
        
        this.addMessage('user', message);
        this.setLoading(true);

        try {
            const response = await this.makeApiRequest('/api/chatbot/message', {
                method: 'POST',
                body: JSON.stringify({
                    message,
                    sessionId: this.currentSessionId,
                    conversationTone,
                    inputType: 'text'
                })
            });

            if (response.success) {
                this.currentSessionId = response.data.sessionId;
                this.addMessage('assistant', response.data.response);
                
                // Update emotion display
                if (response.data.emotion) {
                    this.updateEmotionDisplay(response.data.emotion);
                }
                
                // Hide welcome message
                this.hideWelcomeMessage();
                
                // Update conversation in sidebar if visible
                if (document.getElementById('chat-sidebar').classList.contains('visible')) {
                    this.loadConversations();
                }
                
            } else {
                throw new Error(response.error || 'Failed to send message');
            }

        } catch (error) {
            console.error('Send message error:', error);
            this.handleError(error);
        } finally {
            this.setLoading(false);
        }
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
            throw new Error('Too many messages sent. Please wait a moment before sending another message.');
        }
        
        if (response.status === 401) {
            // Token expired, redirect to login
            window.location.href = '/login.html';
            return;
        }
        
        return await response.json();
    }

    handleError(error) {
        let errorMessage = 'Sorry, I encountered an error. Please try again.';
        
        if (error.message.includes('Too many messages')) {
            errorMessage = error.message;
        } else if (error.message.includes('temporarily unavailable')) {
            errorMessage = 'AI service is temporarily unavailable. Please try again in a few moments.';
        } else if (!navigator.onLine) {
            errorMessage = 'You appear to be offline. Please check your connection and try again.';
        }
        
        this.addMessage('system', errorMessage);
    }

    handleQuickAction(action) {
        const messageInput = document.getElementById('chat-message-input');
        const quickMessages = {
            gratitude: "I want to express gratitude for the blessings in my life",
            prayer: "I would like guidance on prayer and connecting with the divine",
            reflection: "Help me reflect on my spiritual journey and growth",
            guidance: "I'm seeking spiritual guidance for a decision I need to make"
        };

        if (quickMessages[action]) {
            messageInput.value = quickMessages[action];
            this.sendMessage();
        }
    }

    addMessage(role, content, timestamp = new Date()) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const timeStr = timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(content)}</div>
                <div class="message-time">${timeStr}</div>
                ${role === 'assistant' ? '<div class="message-actions"><button class="copy-btn" title="Copy message">📋</button></div>' : ''}
            </div>
        `;

        // Add copy functionality for assistant messages
        if (role === 'assistant') {
            const copyBtn = messageDiv.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(content);
                copyBtn.textContent = '✓';
                setTimeout(() => copyBtn.textContent = '📋', 2000);
            });
        }

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to current conversation
        this.currentConversation.push({ role, content, timestamp });
        
        // Animate message appearance
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 10);
    }

    formatMessage(content) {
        // Enhanced message formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    }

    setLoading(loading) {
        this.isLoading = loading;
        const sendBtn = document.getElementById('send-message-btn');
        const messageInput = document.getElementById('chat-message-input');
        const statusText = document.getElementById('status-text');
        
        if (loading) {
            sendBtn.disabled = true;
            messageInput.disabled = true;
            statusText.textContent = 'Thinking...';
            this.addTypingIndicator();
        } else {
            sendBtn.disabled = false;
            messageInput.disabled = false;
            statusText.textContent = 'Ready to listen';
            messageInput.focus();
            this.removeTypingIndicator();
        }
    }

    addTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    showTypingIndicator() {
        // Show that user is typing (for future real-time features)
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
        }, 1000);
        this.isTyping = true;
    }

    hideWelcomeMessage() {
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    updateCharacterCount() {
        const messageInput = document.getElementById('chat-message-input');
        const charCount = document.getElementById('char-count');
        const count = messageInput.value.length;
        
        charCount.textContent = count;
        
        if (count > 1800) {
            charCount.style.color = '#e74c3c';
        } else if (count > 1500) {
            charCount.style.color = '#f39c12';
        } else {
            charCount.style.color = '#666';
        }
    }

    updateEmotionDisplay(emotionData) {
        const emotionValue = document.getElementById('current-emotion');
        const emotionConfidence = document.getElementById('emotion-confidence');
        const emotionHistory = document.getElementById('emotion-history');
        
        if (emotionData.emotion) {
            emotionValue.textContent = emotionData.emotion;
            emotionValue.className = `emotion-value emotion-${emotionData.emotion.toLowerCase()}`;
            
            if (emotionData.confidence) {
                emotionConfidence.textContent = `${Math.round(emotionData.confidence * 100)}% confidence`;
                emotionConfidence.style.display = 'block';
            }
            
            // Add to emotion history
            this.emotionHistory.push({
                emotion: emotionData.emotion,
                confidence: emotionData.confidence,
                timestamp: new Date()
            });
            
            // Keep only last 5 emotions
            if (this.emotionHistory.length > 5) {
                this.emotionHistory = this.emotionHistory.slice(-5);
            }
            
            // Update emotion history display
            emotionHistory.innerHTML = this.emotionHistory
                .slice(-3)
                .map(e => `<span class="emotion-chip emotion-${e.emotion.toLowerCase()}">${e.emotion}</span>`)
                .join('');
        }
    }

    async loadConversations() {
        try {
            const response = await this.makeApiRequest('/api/chatbot/conversations');
            
            if (response.success) {
                this.conversations = response.data.conversations;
                this.renderConversationList();
            }

        } catch (error) {
            console.error('Load conversations error:', error);
        }
    }

    renderConversationList() {
        const conversationList = document.getElementById('conversation-list');
        
        if (this.conversations.length === 0) {
            conversationList.innerHTML = `
                <div class="empty-conversations">
                    <div class="empty-icon">💬</div>
                    <p>No conversations yet</p>
                    <p>Start chatting to see your conversation history here</p>
                </div>
            `;
            return;
        }

        conversationList.innerHTML = this.conversations.map(conv => `
            <div class="conversation-item ${conv.sessionId === this.currentSessionId ? 'active' : ''}" 
                 data-session-id="${conv.sessionId}">
                <div class="conversation-header">
                    <div class="conversation-title">${this.escapeHtml(conv.title)}</div>
                    <div class="conversation-actions">
                        <button class="btn-icon edit-title" data-session-id="${conv.sessionId}" title="Edit title">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn-icon delete-conversation" data-session-id="${conv.sessionId}" title="Delete">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="conversation-preview">${this.escapeHtml(conv.preview || 'No messages')}</div>
                <div class="conversation-meta">
                    <span class="conversation-date">${new Date(conv.lastActivity).toLocaleDateString()}</span>
                    <span class="message-count">${conv.messageCount} messages</span>
                    ${conv.currentMood ? `<span class="conversation-mood emotion-${conv.currentMood.toLowerCase()}">${conv.currentMood}</span>` : ''}
                </div>
            </div>
        `).join('');

        // Bind conversation item events
        conversationList.addEventListener('click', (e) => {
            if (e.target.closest('.delete-conversation')) {
                const sessionId = e.target.closest('.delete-conversation').dataset.sessionId;
                this.deleteConversation(sessionId);
            } else if (e.target.closest('.edit-title')) {
                const sessionId = e.target.closest('.edit-title').dataset.sessionId;
                this.editConversationTitle(sessionId);
            } else if (e.target.closest('.conversation-item')) {
                const sessionId = e.target.closest('.conversation-item').dataset.sessionId;
                this.loadConversation(sessionId);
            }
        });
    }

    filterConversations(query) {
        const items = document.querySelectorAll('.conversation-item');
        const searchTerm = query.toLowerCase();
        
        items.forEach(item => {
            const title = item.querySelector('.conversation-title').textContent.toLowerCase();
            const preview = item.querySelector('.conversation-preview').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || preview.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    async editConversationTitle(sessionId) {
        const conversation = this.conversations.find(c => c.sessionId === sessionId);
        if (!conversation) return;

        const newTitle = prompt('Enter new conversation title:', conversation.title);
        if (!newTitle || newTitle.trim() === conversation.title) return;

        try {
            const response = await this.makeApiRequest(`/api/chatbot/conversations/${sessionId}/title`, {
                method: 'PUT',
                body: JSON.stringify({ title: newTitle.trim() })
            });

            if (response.success) {
                this.loadConversations();
            } else {
                alert('Failed to update title: ' + response.error);
            }

        } catch (error) {
            console.error('Edit title error:', error);
            alert('Failed to update conversation title');
        }
    }

    async deleteConversation(sessionId) {
        if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) return;

        try {
            const response = await this.makeApiRequest(`/api/chatbot/conversations/${sessionId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.loadConversations();
                
                // If this was the current conversation, start a new one
                if (this.currentSessionId === sessionId) {
                    this.startNewConversation();
                }
            } else {
                alert('Failed to delete conversation: ' + response.error);
            }

        } catch (error) {
            console.error('Delete conversation error:', error);
            alert('Failed to delete conversation');
        }
    }

    async loadConversation(sessionId) {
        if (sessionId === this.currentSessionId) {
            this.toggleSidebar(false);
            return;
        }

        try {
            const response = await this.makeApiRequest(`/api/chatbot/conversations/${sessionId}`);
            
            if (response.success) {
                this.currentSessionId = sessionId;
                this.currentConversation = response.data.messages;
                
                // Clear current messages and load conversation
                const messagesContainer = document.getElementById('chat-messages');
                messagesContainer.innerHTML = '';
                
                response.data.messages.forEach(msg => {
                    this.addMessage(msg.role, msg.content, new Date(msg.timestamp));
                });
                
                // Update emotion display with last emotion
                const lastEmotion = response.data.messages
                    .slice()
                    .reverse()
                    .find(m => m.emotion);
                
                if (lastEmotion) {
                    this.updateEmotionDisplay({
                        emotion: lastEmotion.emotion,
                        confidence: lastEmotion.confidence
                    });
                }
                
                this.toggleSidebar(false);
                document.getElementById('chat-message-input').focus();
            }

        } catch (error) {
            console.error('Load conversation error:', error);
            alert('Failed to load conversation');
        }
    }

    startNewConversation() {
        this.currentSessionId = null;
        this.currentConversation = [];
        
        // Clear messages and show welcome
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-content">
                    <div class="welcome-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </div>
                    <h3>New conversation started</h3>
                    <p>How can I support you today?</p>
                </div>
            </div>
        `;
        
        // Reset emotion display
        document.getElementById('current-emotion').textContent = 'Neutral';
        document.getElementById('emotion-confidence').style.display = 'none';
        document.getElementById('emotion-history').innerHTML = '';
        
        // Focus input
        document.getElementById('chat-message-input').focus();
        
        // Update conversation list
        this.renderConversationList();
    }

    async loadAnalytics() {
        try {
            const response = await this.makeApiRequest('/api/chatbot/analytics?timeframe=7d');
            
            if (response.success) {
                this.renderAnalytics(response.data);
            }

        } catch (error) {
            console.error('Load analytics error:', error);
        }
    }

    renderAnalytics(data) {
        const analyticsContent = document.getElementById('analytics-content');
        
        analyticsContent.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <div class="analytics-number">${data.totalConversations}</div>
                    <div class="analytics-label">Conversations</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-number">${data.totalMessages}</div>
                    <div class="analytics-label">Messages</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-number">${Math.round(data.averageMessagesPerConversation)}</div>
                    <div class="analytics-label">Avg per Chat</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-number emotion-${data.mostCommonEmotion?.toLowerCase() || 'neutral'}">${data.mostCommonEmotion || 'Neutral'}</div>
                    <div class="analytics-label">Common Mood</div>
                </div>
            </div>
            
            <div class="emotion-chart">
                <h4>Emotional Journey (${data.timeframe})</h4>
                <div class="emotion-bars">
                    ${Object.entries(data.emotionDistribution || {}).map(([emotion, count]) => `
                        <div class="emotion-bar">
                            <div class="emotion-bar-label">${emotion}</div>
                            <div class="emotion-bar-fill emotion-${emotion.toLowerCase()}" 
                                 style="width: ${(count / Math.max(...Object.values(data.emotionDistribution))) * 100}%">
                                <span class="emotion-bar-count">${count}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="insights">
                <h4>Insights</h4>
                <ul>
                    <li>You've been actively engaging in spiritual conversations</li>
                    <li>Your emotional awareness is growing through our chats</li>
                    <li>Consider setting aside regular time for reflection</li>
                </ul>
            </div>
        `;
    }

    toggleSidebar(show = null) {
        const sidebar = document.getElementById('chat-sidebar');
        const isVisible = sidebar.classList.contains('visible');
        
        if (show === null) {
            show = !isVisible;
        }
        
        if (show) {
            sidebar.classList.add('visible');
            this.loadConversations();
            document.getElementById('conversation-search').focus();
        } else {
            sidebar.classList.remove('visible');
        }
    }

    toggleAnalytics(show = null) {
        const panel = document.getElementById('analytics-panel');
        const isVisible = panel.classList.contains('visible');
        
        if (show === null) {
            show = !isVisible;
        }
        
        if (show) {
            panel.classList.add('visible');
            this.loadAnalytics();
        } else {
            panel.classList.remove('visible');
        }
    }

    toggleVoiceInput() {
        // Voice input functionality would be implemented here
        // For now, show a placeholder
        alert('Voice input feature coming soon! This will allow you to speak your messages instead of typing.');
    }

    handleOnline() {
        document.getElementById('offline-indicator').style.display = 'none';
        document.getElementById('connection-status').className = 'status-indicator online';
        document.getElementById('status-text').textContent = 'Ready to listen';
        
        // Process any queued messages
        this.processMessageQueue();
    }

    handleOffline() {
        document.getElementById('offline-indicator').style.display = 'block';
        document.getElementById('connection-status').className = 'status-indicator offline';
        document.getElementById('status-text').textContent = 'Offline';
    }

    processMessageQueue() {
        // Process any messages that were queued while offline
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            // Re-send the message
            this.sendMessage();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Cleanup method
    destroy() {
        // Remove event listeners and clean up
        this.conversations = [];
        this.currentConversation = [];
        this.emotionHistory = [];
        this.messageQueue = [];
    }
}

// Initialize chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if user is logged in
    if (localStorage.getItem('token')) {
        window.chatInterface = new ChatInterface();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatInterface;
}