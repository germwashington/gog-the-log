// Telemetry System - The Observer
// Logs all cross-module communication and game events

class TelemetrySystem {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000; // Keep last 1000 log entries
        this.listeners = [];
        this.enabled = true;
        this.startTime = Date.now();
    }
    
    /**
     * Log a cross-module call
     * @param {string} fromModule - Name of module sending the call
     * @param {string} toModule - Name of module receiving the call
     * @param {string} method - Method/function being called
     * @param {*} data - Data being passed (will be serialized)
     * @param {*} result - Result returned (optional)
     */
    logCall(fromModule, toModule, method, data = null, result = null) {
        if (!this.enabled) return;
        
        const logEntry = {
            timestamp: Date.now() - this.startTime,
            type: 'call',
            from: fromModule,
            to: toModule,
            method: method,
            data: this.serializeData(data),
            result: this.serializeData(result),
            time: new Date().toISOString()
        };
        
        this.addLog(logEntry);
    }
    
    /**
     * Log a game event
     * @param {string} eventType - Type of event
     * @param {string} source - Source module/component
     * @param {*} data - Event data
     */
    logEvent(eventType, source, data = null) {
        if (!this.enabled) return;
        
        const logEntry = {
            timestamp: Date.now() - this.startTime,
            type: 'event',
            eventType: eventType,
            source: source,
            data: this.serializeData(data),
            time: new Date().toISOString()
        };
        
        this.addLog(logEntry);
    }
    
    /**
     * Log an error
     * @param {string} source - Source module/component
     * @param {Error|string} error - Error object or message
     */
    logError(source, error) {
        const logEntry = {
            timestamp: Date.now() - this.startTime,
            type: 'error',
            source: source,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : null,
            time: new Date().toISOString()
        };
        
        this.addLog(logEntry);
    }
    
    /**
     * Add log entry and notify listeners
     */
    addLog(logEntry) {
        this.logs.push(logEntry);
        
        // Keep only last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Notify listeners
        this.listeners.forEach(listener => {
            try {
                listener(logEntry);
            } catch (e) {
                console.error('Telemetry listener error:', e);
            }
        });
    }
    
    /**
     * Serialize data for logging (handle circular references, large objects)
     */
    serializeData(data) {
        if (data === null || data === undefined) return null;
        
        try {
            // Handle functions
            if (typeof data === 'function') {
                return `[Function: ${data.name || 'anonymous'}]`;
            }
            
            // Handle objects/arrays
            if (typeof data === 'object') {
                // Limit depth and size
                const serialized = JSON.stringify(data, (key, value) => {
                    if (typeof value === 'function') {
                        return `[Function: ${value.name || 'anonymous'}]`;
                    }
                    if (value instanceof Error) {
                        return { message: value.message, stack: value.stack };
                    }
                    // Limit string length
                    if (typeof value === 'string' && value.length > 200) {
                        return value.substring(0, 200) + '...';
                    }
                    return value;
                }, 2);
                
                // Limit total size
                if (serialized.length > 500) {
                    return serialized.substring(0, 500) + '... [truncated]';
                }
                
                return JSON.parse(serialized);
            }
            
            return data;
        } catch (e) {
            return `[Serialization Error: ${e.message}]`;
        }
    }
    
    /**
     * Subscribe to log events
     * @param {Function} callback - Function to call when new log is added
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    
    /**
     * Get all logs
     */
    getLogs() {
        return [...this.logs];
    }
    
    /**
     * Get logs filtered by criteria
     */
    getFilteredLogs(filter = {}) {
        return this.logs.filter(log => {
            if (filter.type && log.type !== filter.type) return false;
            if (filter.from && log.from !== filter.from) return false;
            if (filter.to && log.to !== filter.to) return false;
            if (filter.source && log.source !== filter.source) return false;
            return true;
        });
    }
    
    /**
     * Clear all logs
     */
    clearLogs() {
        this.logs = [];
        this.startTime = Date.now();
    }
    
    /**
     * Export logs as JSON
     */
    exportLogs() {
        return JSON.stringify({
            exportedAt: new Date().toISOString(),
            totalLogs: this.logs.length,
            logs: this.logs
        }, null, 2);
    }
    
    /**
     * Enable/disable logging
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Create global instance
const telemetry = new TelemetrySystem();

export { TelemetrySystem, telemetry };
