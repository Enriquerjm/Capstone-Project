class PomodoroTimer {
    constructor() {
        // Timer modes with durations in seconds
        this.modes = {
            work: 25 * 60,    // 25 minutes
            short: 5 * 60,    // 5 minutes  
            long: 15 * 60     // 15 minutes
        };
        
        // Current state
        this.currentMode = 'work';
        this.timeLeft = this.modes[this.currentMode];
        this.totalTime = this.modes[this.currentMode];
        this.isRunning = false;
        this.timer = null;
        
        // Load statistics from localStorage
        this.stats = {
            workSessions: parseInt(localStorage.getItem('pomodoroWorkSessions') || '0'),
            totalTime: parseInt(localStorage.getItem('pomodoroTotalTime') || '0'),
            streak: parseInt(localStorage.getItem('pomodoroStreak') || '0')
        };
        
        // Initialize the application
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
        this.updateStats();
        this.checkDailyStreak();
    }
    
    /**
     * Initialize DOM elements and store references
     */
    initializeElements() {
        this.timerDisplay = document.getElementById('timer');
        this.startPauseBtn = document.getElementById('startPause');
        this.resetBtn = document.getElementById('reset');
        this.progressBar = document.getElementById('progress');
        this.notification = document.getElementById('notification');
        this.modeButtons = document.querySelectorAll('.mode-btn');
        
        // Statistics elements
        this.workSessionsEl = document.getElementById('workSessions');
        this.totalTimeEl = document.getElementById('totalTime');
        this.streakEl = document.getElementById('streak');
    }
    
    /**
     * Bind event listeners to interactive elements
     */
    bindEvents() {
        // Control buttons
        this.startPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        
        // Mode selection buttons
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                if (!this.isRunning) {
                    this.switchMode(mode);
                }
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleTimer();
            } else if (e.code === 'KeyR') {
                e.preventDefault();
                this.resetTimer();
            }
        });
        
        // Page visibility API - pause when tab is not active
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning) {
                // Optional: pause timer when tab is not visible
                // this.pauseTimer();
            }
        });
    }
    
    /**
     * Toggle timer between start and pause states
     */
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    /**
     * Start the countdown timer
     */
    startTimer() {
        this.isRunning = true;
        this.startPauseBtn.textContent = 'Pause';
        this.timerDisplay.classList.add('pulse');
        
        // Disable mode buttons while timer is running
        this.modeButtons.forEach(btn => {
            btn.disabled = true;
        });
        
        // Start the countdown
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            this.updateProgress();
            
            // Check if session is complete
            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
        
        this.showNotification('Timer started! Stay focused! 🎯');
    }
    
    /**
     * Pause the timer
     */
    pauseTimer() {
        this.isRunning = false;
        this.startPauseBtn.textContent = 'Start';
        this.timerDisplay.classList.remove('pulse');
        
        // Re-enable mode buttons
        this.modeButtons.forEach(btn => {
            btn.disabled = false;
        });
        
        clearInterval(this.timer);
        this.showNotification('Timer paused ⏸️');
    }
    
    /**
     * Reset timer to initial state
     */
    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.modes[this.currentMode];
        this.totalTime = this.modes[this.currentMode];
        this.updateDisplay();
        this.updateProgress();
        this.showNotification('Timer reset 🔄');
    }
    
    /**
     * Switch between different timer modes
     * @param {string} mode - The mode to switch to ('work', 'short', 'long')
     */
    switchMode(mode) {
        if (this.modes[mode] === undefined) {
            console.error(`Invalid mode: ${mode}`);
            return;
        }
        
        this.currentMode = mode;
        this.timeLeft = this.modes[mode];
        this.totalTime = this.modes[mode];
        
        // Update active mode button
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        this.updateDisplay();
        this.updateProgress();
        
        const modeNames = {
            work: 'Work Session',
            short: 'Short Break',
            long: 'Long Break'
        };
        
        this.showNotification(`Switched to ${modeNames[mode]} mode`);
    }
    
    /**
     * Handle session completion
     */
    completeSession() {
        this.pauseTimer();
        
        // Handle work session completion
        if (this.currentMode === 'work') {
            this.stats.workSessions++;
            this.stats.totalTime += 25; // 25 minutes per work session
            this.stats.streak++;
            
            this.saveStats();
            this.updateStats();
            
            this.showNotification('🎉 Work session completed! Great job!');
            
            // Auto-suggest break mode
            const nextMode = this.stats.workSessions % 4 === 0 ? 'long' : 'short';
            const breakType = nextMode === 'long' ? 'long break' : 'short break';
            
            setTimeout(() => {
                this.switchMode(nextMode);
                this.showNotification(`Time for a ${breakType}! 😌`);
            }, 2000);
            
        } else {
            // Break session completed
            this.showNotification('✨ Break time over! Ready to focus again?');
            
            setTimeout(() => {
                this.switchMode('work');
                this.showNotification('Back to work! Let\'s stay productive! 💪');
            }, 2000);
        }
        
        // Play notification sound (if browser supports it)
        this.playNotificationSound();
    }
    
    /**
     * Update the timer display
     */
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.timerDisplay.textContent = display;
        
        // Update document title for tab notification
        if (this.isRunning) {
            document.title = `${display} - Pomodoro Timer`;
        } else {
            document.title = 'Pomodoro Timer - Focus & Productivity';
        }
    }
    
    /**
     * Update the progress bar
     */
    updateProgress() {
        const progress = ((this.totalTime - this.timeLeft) / this.totalTime) * 100;
        this.progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    }
    
    /**
     * Update statistics display
     */
    updateStats() {
        this.workSessionsEl.textContent = this.stats.workSessions;
        this.totalTimeEl.textContent = `${this.stats.totalTime}m`;
        this.streakEl.textContent = this.stats.streak;
    }
    
    /**
     * Save statistics to localStorage
     */
    saveStats() {
        try {
            localStorage.setItem('pomodoroWorkSessions', this.stats.workSessions.toString());
            localStorage.setItem('pomodoroTotalTime', this.stats.totalTime.toString());
            localStorage.setItem('pomodoroStreak', this.stats.streak.toString());
            localStorage.setItem('pomodoroLastVisit', new Date().toDateString());
        } catch (error) {
            console.error('Failed to save statistics:', error);
        }
    }
    
    /**
     * Check and update daily streak
     */
    checkDailyStreak() {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('pomodoroLastVisit');
        
        if (lastVisit && lastVisit !== today) {
            const lastVisitDate = new Date(lastVisit);
            const todayDate = new Date(today);
            const daysDifference = Math.floor((todayDate - lastVisitDate) / (1000 * 60 * 60 * 24));
            
            // Reset streak if more than 1 day has passed
            if (daysDifference > 1) {
                this.stats.streak = 0;
                this.saveStats();
                this.updateStats();
                this.showNotification('Daily streak reset. Start fresh today! 🌅');
            }
        }
        
        // Update last visit date
        localStorage.setItem('pomodoroLastVisit', today);
    }
    
    /**
     * Show notification message
     * @param {string} message - The message to display
     */
    showNotification(message) {
        this.notification.textContent = message;
        this.notification.classList.add('show');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }
    
    /**
     * Play notification sound (if supported)
     */
    playNotificationSound() {
        try {
            // Create audio context for notification sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            // Notification sound not supported or blocked
            console.log('Notification sound not available');
        }
    }
    
    /**
     * Get current timer state for debugging
     */
    getState() {
        return {
            mode: this.currentMode,
            timeLeft: this.timeLeft,
            isRunning: this.isRunning,
            stats: this.stats
        };
    }
    
    /**
     * Reset all statistics (for testing/debugging)
     */
    resetStats() {
        this.stats = {
            workSessions: 0,
            totalTime: 0,
            streak: 0
        };
        this.saveStats();
        this.updateStats();
        this.showNotification('Statistics reset! 📊');
    }
}

/**
 * Utility functions
 */
const PomodoroUtils = {
    /**
     * Format time in seconds to MM:SS format
     * @param {number} seconds 
     * @returns {string}
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    /**
     * Check if notifications are supported and enabled
     * @returns {boolean}
     */
    isNotificationSupported() {
        return 'Notification' in window;
    },
    
    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if (this.isNotificationSupported()) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }
};

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.pomodoroTimer = new PomodoroTimer();
    
    // Request notification permission
    if (PomodoroUtils.isNotificationSupported() && Notification.permission === 'default') {
        PomodoroUtils.requestNotificationPermission();
    }
    
    // Add service worker registration for PWA features (optional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service Worker registration failed');
        });
    }
    
    console.log('🍅 Pomodoro Timer initialized successfully!');
    console.log('Keyboard shortcuts: Space = Start/Pause, R = Reset');
});

/**
 * Handle page unload - save current state
 */
window.addEventListener('beforeunload', () => {
    if (window.pomodoroTimer) {
        window.pomodoroTimer.saveStats();
    }
});

/**
 * Export for testing purposes
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PomodoroTimer, PomodoroUtils };
}