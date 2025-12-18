// Debug Panel UI
// Provides visual interface for telemetry logs and screenshots

class DebugPanel {
    constructor(telemetrySystem, gameInstance) {
        this.telemetry = telemetrySystem;
        this.game = gameInstance;
        
        // Load saved panel state from localStorage
        const savedState = localStorage.getItem('debugPanelOpen');
        this.isOpen = savedState === 'true';
        
        this.screenshots = [];
        this.screenshotInterval = null;
        this.screenshotIntervalMs = 3000; // 3 seconds
        this.pausedScreenshot = null;
        this.autoScrollLogs = true;
        this.autoScrollScreenshots = true;
        
        this.createUI();
        this.setupEventListeners();
        this.startScreenshotCapture();
        
        // Restore panel state after UI is created
        this.restorePanelState();
    }
    
    createUI() {
        // Create container
        const container = document.createElement('div');
        container.id = 'debugPanel';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        `;
        
        // Bug icon button
        const bugButton = document.createElement('button');
        bugButton.id = 'debugBugButton';
        bugButton.innerHTML = '🐛';
        bugButton.title = 'Open Debug Panel';
        bugButton.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid #ff4444;
            background: rgba(0, 0, 0, 0.8);
            color: #ff4444;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
            transition: all 0.3s;
            outline: none;
        `;
        // Prevent button from receiving keyboard focus
        bugButton.setAttribute('tabindex', '-1');
        bugButton.onmouseover = () => {
            bugButton.style.transform = 'scale(1.1)';
            bugButton.style.background = 'rgba(255, 68, 68, 0.2)';
        };
        bugButton.onmouseout = () => {
            bugButton.style.transform = 'scale(1)';
            bugButton.style.background = 'rgba(0, 0, 0, 0.8)';
        };
        
        // Panel (hidden by default)
        const panel = document.createElement('div');
        panel.id = 'debugPanelContent';
        panel.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background: rgba(20, 20, 20, 0.95);
            border-left: 2px solid #444;
            transition: right 0.3s ease;
            overflow: hidden; /* the panel itself never scrolls */
            color: #fff;
            box-shadow: -2px 0 10px rgba(0,0,0,0.5);
            z-index: 9999;
            display: flex;
            flex-direction: column;
        `;
        // Don't allow keyboard focus to land here (spacebar scrolling)
        panel.setAttribute('tabindex', '-1');
        
        // Panel header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 15px;
            border-bottom: 2px solid #444;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const title = document.createElement('h3');
        title.textContent = '🐛 Debug Panel';
        title.style.cssText = 'margin: 0; color: #ff4444;';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            background: transparent;
            border: 1px solid #666;
            color: #fff;
            width: 30px;
            height: 30px;
            cursor: pointer;
            border-radius: 4px;
        `;
        closeBtn.onclick = () => this.toggle();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Controls section
        const controls = document.createElement('div');
        controls.style.cssText = 'padding: 15px; border-bottom: 2px solid #444;';
        
        const pauseBtn = document.createElement('button');
        pauseBtn.id = 'debugPauseBtn';
        pauseBtn.textContent = '⏸ Pause';
        pauseBtn.style.cssText = `
            padding: 8px 15px;
            margin-right: 10px;
            background: #444;
            border: 1px solid #666;
            color: #fff;
            cursor: pointer;
            border-radius: 4px;
            outline: none;
        `;
        // Prevent pause button from keeping focus and reacting to space/enter repeatedly
        pauseBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.togglePause();
            pauseBtn.blur();
        };
        pauseBtn.onkeydown = (e) => {
            // Block space/enter toggling from keyboard focus
            if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                this.togglePause();
                pauseBtn.blur();
            }
        };
        
        const exportLogBtn = document.createElement('button');
        exportLogBtn.textContent = '📥 Export Log';
        exportLogBtn.style.cssText = `
            padding: 8px 15px;
            margin-right: 10px;
            background: #444;
            border: 1px solid #666;
            color: #fff;
            cursor: pointer;
            border-radius: 4px;
        `;
        exportLogBtn.onclick = () => this.exportLogs();
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '🗑 Clear';
        clearBtn.style.cssText = `
            padding: 8px 15px;
            background: #444;
            border: 1px solid #666;
            color: #fff;
            cursor: pointer;
            border-radius: 4px;
        `;
        clearBtn.onclick = () => this.clearLogs();
        
        controls.appendChild(pauseBtn);
        controls.appendChild(exportLogBtn);
        controls.appendChild(clearBtn);
        
        // Screenshots section
        const screenshotsSection = document.createElement('div');
        screenshotsSection.id = 'debugScreenshots';
        screenshotsSection.style.cssText = 'padding: 15px; border-bottom: 2px solid #444; flex: 0 0 auto;';
        
        const screenshotsTitle = document.createElement('h4');
        screenshotsTitle.textContent = '📸 Screenshots';
        screenshotsTitle.style.cssText = 'margin: 0 0 10px 0; color: #ffaa00;';
        screenshotsSection.appendChild(screenshotsTitle);
        
        const screenshotsContainer = document.createElement('div');
        screenshotsContainer.id = 'debugScreenshotsContainer';
        screenshotsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            max-height: 260px;
            overflow-y: auto;
            padding-right: 6px;
        `;
        screenshotsSection.appendChild(screenshotsContainer);
        
        // Logs section
        const logsSection = document.createElement('div');
        logsSection.style.cssText = 'padding: 15px; flex: 1 1 auto; min-height: 0;';
        
        const logsTitle = document.createElement('h4');
        logsTitle.textContent = '📋 Logs';
        logsTitle.style.cssText = 'margin: 0 0 10px 0; color: #00ff00;';
        logsSection.appendChild(logsTitle);
        
        const logsContainer = document.createElement('div');
        logsContainer.id = 'debugLogsContainer';
        logsContainer.style.cssText = `
            height: 100%;
            overflow-y: auto;
            padding-right: 6px;
            font-size: 11px;
        `;
        logsSection.appendChild(logsContainer);
        
        // Assemble panel
        panel.appendChild(header);
        panel.appendChild(controls);
        panel.appendChild(screenshotsSection);
        panel.appendChild(logsSection);
        
        container.appendChild(bugButton);
        container.appendChild(panel);
        
        document.body.appendChild(container);
        
        this.bugButton = bugButton;
        this.panel = panel;
        this.logsContainer = logsContainer;
        this.screenshotsContainer = screenshotsContainer;
        this.pauseBtn = pauseBtn;
    }
    
    setupEventListeners() {
        this.bugButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
            // Remove focus immediately after click
            this.bugButton.blur();
        };
        
        // Prevent keyboard events from triggering the button
        this.bugButton.onkeydown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.key === 'Enter' || e.key === ' ') {
                this.toggle();
                this.bugButton.blur();
            }
        };
        
        // Subscribe to telemetry logs
        this.telemetry.subscribe((logEntry) => {
            this.addLogEntry(logEntry);
        });
        
        // Load existing logs
        this.telemetry.getLogs().forEach(log => this.addLogEntry(log));

        // If the user scrolls the logs away from the bottom, stop auto-scroll until they return near bottom
        this.logsContainer.addEventListener('scroll', () => {
            this.autoScrollLogs = this.isNearBottom(this.logsContainer, 24);
        });
        this.screenshotsContainer.addEventListener('scroll', () => {
            this.autoScrollScreenshots = this.isNearBottom(this.screenshotsContainer, 24);
        });

        // Prevent Space from scrolling the page/debug panel. Space is for the game.
        // We only block when the active element isn't a text input.
        window.addEventListener('keydown', (e) => {
            if (e.code !== 'Space') return;
            const el = document.activeElement;
            const tag = el && el.tagName ? el.tagName.toUpperCase() : '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || (el && el.isContentEditable)) return;
            e.preventDefault();
        }, { passive: false });
    }
    
    restorePanelState() {
        // Restore panel state without toggling (for initialization)
        const gameContainer = document.getElementById('gameContainer');
        
        if (this.isOpen) {
            this.panel.style.right = '0';
            this.bugButton.innerHTML = '🐛';
            this.bugButton.title = 'Close Debug Panel';
            
            // Slide game container to the left to make room for panel
            if (gameContainer) {
                gameContainer.style.transition = 'margin-right 0.3s ease';
                gameContainer.style.marginRight = '400px';
            }
        } else {
            this.panel.style.right = '-400px';
            this.bugButton.innerHTML = '🐛';
            this.bugButton.title = 'Open Debug Panel';
            
            // Slide game container back to normal position
            if (gameContainer) {
                gameContainer.style.marginRight = '0';
            }
        }
    }
    
    toggle() {
        this.isOpen = !this.isOpen;
        
        // Update UI based on new state
        this.restorePanelState();
        
        // Save state to localStorage
        localStorage.setItem('debugPanelOpen', String(this.isOpen));
        
        // Always blur the button after toggling
        this.bugButton.blur();
    }
    
    addLogEntry(logEntry) {
        const shouldStickToBottom = !this.game?.isPaused && this.autoScrollLogs;

        const logDiv = document.createElement('div');
        logDiv.style.cssText = `
            padding: 8px;
            margin-bottom: 5px;
            border-left: 3px solid ${this.getLogColor(logEntry.type)};
            background: rgba(255, 255, 255, 0.05);
            word-wrap: break-word;
        `;
        
        const timestamp = document.createElement('span');
        timestamp.textContent = `[${(logEntry.timestamp / 1000).toFixed(2)}s] `;
        timestamp.style.color = '#888';
        
        const content = document.createElement('span');
        
        if (logEntry.type === 'call') {
            content.innerHTML = `
                <span style="color: #00aaff;">${logEntry.from}</span> 
                → 
                <span style="color: #ffaa00;">${logEntry.to}</span>
                .<span style="color: #00ff00;">${logEntry.method}</span>()
                ${logEntry.data ? `<br>  <span style="color: #aaa;">Data: ${JSON.stringify(logEntry.data).substring(0, 100)}</span>` : ''}
            `;
        } else if (logEntry.type === 'event') {
            content.innerHTML = `
                <span style="color: #ff00ff;">[${logEntry.eventType}]</span> 
                from <span style="color: #00aaff;">${logEntry.source}</span>
            `;
        } else if (logEntry.type === 'error') {
            content.innerHTML = `
                <span style="color: #ff4444;">ERROR</span> in 
                <span style="color: #00aaff;">${logEntry.source}</span>: 
                <span style="color: #ff6666;">${logEntry.error}</span>
            `;
        }
        
        logDiv.appendChild(timestamp);
        logDiv.appendChild(content);
        
        this.logsContainer.appendChild(logDiv);
        
        // Auto-scroll to bottom only if not paused and user is at/near bottom
        if (shouldStickToBottom) {
            this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
        }
        
        // Keep only last 100 visible logs in DOM
        while (this.logsContainer.children.length > 100) {
            this.logsContainer.removeChild(this.logsContainer.firstChild);
        }
    }
    
    getLogColor(type) {
        switch (type) {
            case 'call': return '#00aaff';
            case 'event': return '#ff00ff';
            case 'error': return '#ff4444';
            default: return '#666';
        }
    }
    
    startScreenshotCapture() {
        this.screenshotInterval = setInterval(() => {
            if (this.game && this.game.gameState === 'playing' && !this.game.isPaused) {
                this.captureScreenshot();
            }
        }, this.screenshotIntervalMs);
    }
    
    captureScreenshot() {
        if (!this.game || !this.game.canvas) return;
        
        try {
            const dataURL = this.game.canvas.toDataURL('image/png');
            const timestamp = Date.now();
            
            const screenshot = {
                id: timestamp,
                dataURL: dataURL,
                timestamp: timestamp,
                time: new Date().toISOString()
            };
            
            this.screenshots.push(screenshot);
            
            // Keep only last 20 screenshots
            if (this.screenshots.length > 20) {
                this.screenshots.shift();
            }
            
            this.updateScreenshotsDisplay();
        } catch (e) {
            console.error('Failed to capture screenshot:', e);
        }
    }
    
    updateScreenshotsDisplay() {
        this.screenshotsContainer.innerHTML = '';
        
        // Show regular screenshots oldest -> newest (new ones added to bottom)
        this.screenshots.forEach(screenshot => {
            const thumb = this.createScreenshotThumbnail(screenshot, false);
            this.screenshotsContainer.appendChild(thumb);
        });

        // Add paused screenshot at the bottom (so newest stays at bottom)
        if (this.pausedScreenshot) {
            const pausedDiv = this.createScreenshotThumbnail(this.pausedScreenshot, true);
            this.screenshotsContainer.appendChild(pausedDiv);
        }

        // Keep screenshots scrolled to bottom unless paused or user scrolled up
        if (!this.game?.isPaused && this.autoScrollScreenshots) {
            this.screenshotsContainer.scrollTop = this.screenshotsContainer.scrollHeight;
        }
    }
    
    createScreenshotThumbnail(screenshot, isPaused) {
        const div = document.createElement('div');
        div.style.cssText = `
            position: relative;
            cursor: pointer;
            border: 2px solid ${isPaused ? '#ff4444' : '#666'};
            border-radius: 4px;
            overflow: hidden;
        `;
        
        const img = document.createElement('img');
        img.src = screenshot.dataURL;
        img.style.cssText = 'width: 100%; height: auto; display: block;';
        
        const label = document.createElement('div');
        label.textContent = isPaused ? '⏸ PAUSED' : new Date(screenshot.timestamp).toLocaleTimeString();
        label.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.8);
            color: ${isPaused ? '#ff4444' : '#fff'};
            padding: 4px;
            font-size: 10px;
            text-align: center;
        `;
        
        // Hover preview
        const preview = document.createElement('div');
        preview.style.cssText = `
            position: fixed;
            display: none;
            z-index: 10001;
            border: 2px solid #ffaa00;
            box-shadow: 0 4px 20px rgba(0,0,0,0.8);
            pointer-events: none;
        `;
        const previewImg = document.createElement('img');
        previewImg.src = screenshot.dataURL;
        previewImg.style.cssText = 'max-width: 400px; max-height: 300px; display: block;';
        preview.appendChild(previewImg);
        document.body.appendChild(preview);
        
        div.onmouseenter = (e) => {
            preview.style.display = 'block';
            preview.style.left = (e.clientX + 20) + 'px';
            preview.style.top = (e.clientY + 20) + 'px';
        };
        
        div.onmouseleave = () => {
            preview.style.display = 'none';
        };
        
        div.onmousemove = (e) => {
            preview.style.left = (e.clientX + 20) + 'px';
            preview.style.top = (e.clientY + 20) + 'px';
        };
        
        div.onclick = () => {
            this.downloadScreenshot(screenshot, isPaused);
        };
        
        div.appendChild(img);
        div.appendChild(label);
        
        return div;
    }
    
    downloadScreenshot(screenshot, isPaused) {
        const link = document.createElement('a');
        link.download = `tyrian-${isPaused ? 'paused' : 'screenshot'}-${screenshot.id}.png`;
        link.href = screenshot.dataURL;
        link.click();
    }
    
    togglePause() {
        if (!this.game) return;
        
        if (this.game.isPaused) {
            // Resume
            this.game.isPaused = false;
            // Don't change gameState if it was already paused by the game itself
            if (this.game.gameState === 'paused' && this.game.wasPausedByDebug) {
                this.game.gameState = this.game.previousGameState || 'playing';
                this.game.wasPausedByDebug = false;
            }
            this.pauseBtn.textContent = '⏸ Pause';
            this.pausedScreenshot = null;
            this.updateScreenshotsDisplay();
            // On resume, snap logs/screenshots to bottom again
            this.autoScrollLogs = true;
            this.autoScrollScreenshots = true;
            this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
            this.screenshotsContainer.scrollTop = this.screenshotsContainer.scrollHeight;
        } else {
            // Pause
            this.game.previousGameState = this.game.gameState;
            this.game.isPaused = true;
            this.game.wasPausedByDebug = true;
            this.game.gameState = 'paused';
            
            // Capture paused screenshot
            setTimeout(() => {
                if (this.game && this.game.canvas) {
                    const dataURL = this.game.canvas.toDataURL('image/png');
                    this.pausedScreenshot = {
                        id: Date.now(),
                        dataURL: dataURL,
                        timestamp: Date.now(),
                        time: new Date().toISOString()
                    };
                    this.updateScreenshotsDisplay();
                }
            }, 100);
            
            this.pauseBtn.textContent = '▶ Resume';
            // While paused, stop auto-scroll so user can inspect history
            this.autoScrollLogs = false;
            this.autoScrollScreenshots = false;
        }
    }

    isNearBottom(container, thresholdPx = 24) {
        const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
        return distance <= thresholdPx;
    }
    
    exportLogs() {
        const logs = this.telemetry.exportLogs();
        const blob = new Blob([logs], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `tyrian-debug-log-${Date.now()}.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
    }
    
    clearLogs() {
        this.telemetry.clearLogs();
        this.logsContainer.innerHTML = '';
    }
}

export { DebugPanel };

