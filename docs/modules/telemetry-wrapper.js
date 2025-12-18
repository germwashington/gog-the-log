// Telemetry Wrapper
// Wraps modules to automatically log all method calls

export function wrapWithTelemetry(moduleInstance, moduleName, telemetrySystem) {
    if (!telemetrySystem) return moduleInstance;
    
    // Create a proxy to intercept method calls
    return new Proxy(moduleInstance, {
        get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver);
            
            // If it's a function, wrap it with telemetry
            if (typeof original === 'function' && prop !== 'constructor') {
                return function(...args) {
                    const caller = getCallerModule();
                    const result = original.apply(target, args);
                    
                    // Log the call
                    telemetrySystem.logCall(
                        caller || 'Game',
                        moduleName,
                        prop,
                        args.length > 0 ? args : null,
                        result
                    );
                    
                    return result;
                };
            }
            
            return original;
        }
    });
}

// Try to detect caller module from stack trace
function getCallerModule() {
    try {
        const stack = new Error().stack;
        if (!stack) return null;
        
        const lines = stack.split('\n');
        // Look for module names in stack trace
        for (const line of lines) {
            if (line.includes('game.js')) return 'Game';
            if (line.includes('Player')) return 'Player';
            if (line.includes('Enemy')) return 'Enemy';
            if (line.includes('Bullet')) return 'Bullet';
        }
    } catch (e) {
        // Ignore
    }
    return null;
}

