class GanttDebugger {
    constructor(ganttInstance) {
        this.ganttInstance = ganttInstance;
        this.stats = new Map(); // functionName -> detailed stats object
        this.originalFunctions = new Map(); // Store original functions
        this.callStack = []; // Track call stack depth
        this.isActive = false;
        this.startTime = performance.now();
        
        // Functions to exclude from timing (frequently called during mouse movement)
        this.excludedFunctions = new Set([
            'getState',
            'assert',
            'checkEvent',
        ]);
        
        console.log('🔧 GanttDebugger initialized');
        this.wrapFunctions();
    }
    
    wrapFunctions() {
        if (!this.ganttInstance) {
            console.error('❌ No gantt instance provided');
            return;
        }
        
        console.log('🚀 Wrapping gantt functions with advanced monitoring...');
        console.log('📊 Gantt object type:', typeof this.ganttInstance);
        
        let wrapperCount = 0;
        
        // Get all gantt properties and wrap functions
        Object.getOwnPropertyNames(this.ganttInstance).forEach(prop => {
            try {
                if (typeof this.ganttInstance[prop] === 'function' && 
                    prop !== 'constructor' && 
                    !prop.startsWith('_') && 
                    !prop.startsWith('$') &&
                    !this.excludedFunctions.has(prop)) {
                    
                    const originalFunc = this.ganttInstance[prop];
                    const funcName = prop;
                    
                    // Store original function
                    this.originalFunctions.set(funcName, originalFunc);
                    
                    // Initialize detailed stats for this function
                    this.stats.set(funcName, {
                        count: 0,
                        totalTime: 0,
                        times: [], // Store all execution times for percentiles
                        minTime: Infinity,
                        maxTime: 0,
                        errors: 0,
                        lastCalled: null,
                        firstCalled: null,
                        callsPerSecond: 0,
                        avgStackDepth: 0,
                        totalStackDepth: 0,
                        memoryBefore: 0,
                        memoryAfter: 0,
                        callHistory: [] // Last 10 calls with timestamps
                    });
                    
                    // Create advanced timing wrapper
                    this.ganttInstance[prop] = (...args) => {
                        if (!this.isActive) {
                            return originalFunc.apply(this.ganttInstance, args);
                        }
                        
                        const currentTime = performance.now();
                        const relativeTime = currentTime - this.startTime;
                        const stackDepth = this.callStack.length;
                        
                        // Memory usage (if available)
                        const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;
                        
                        // Add to call stack
                        this.callStack.push(funcName);
                        
                        const startTime = performance.now();
                        
                        try {
                            const result = originalFunc.apply(this.ganttInstance, args);
                            const endTime = performance.now();
                            const duration = endTime - startTime;
                            
                            // Memory after execution
                            const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0;
                            
                            // Update detailed stats
                            const stats = this.stats.get(funcName);
                            stats.count++;
                            stats.totalTime += duration;
                            stats.times.push(duration);
                            stats.minTime = Math.min(stats.minTime, duration);
                            stats.maxTime = Math.max(stats.maxTime, duration);
                            stats.lastCalled = currentTime;
                            stats.totalStackDepth += stackDepth;
                            stats.avgStackDepth = stats.totalStackDepth / stats.count;
                            stats.memoryBefore += memoryBefore;
                            stats.memoryAfter += memoryAfter;
                            
                            if (!stats.firstCalled) {
                                stats.firstCalled = currentTime;
                            }
                            
                            // Keep last 10 calls
                            stats.callHistory.push({
                                timestamp: relativeTime,
                                duration: duration,
                                stackDepth: stackDepth,
                                memoryDelta: memoryAfter - memoryBefore
                            });
                            if (stats.callHistory.length > 10) {
                                stats.callHistory.shift();
                            }
                            
                            // Calculate calls per second
                            const timeSinceFirst = (currentTime - stats.firstCalled) / 1000;
                            stats.callsPerSecond = timeSinceFirst > 0 ? stats.count / timeSinceFirst : 0;
                                                        
                            // Remove from call stack
                            this.callStack.pop();
                            
                            return result;
                        } catch (error) {
                            const endTime = performance.now();
                            const duration = endTime - startTime;
                            
                            // Update stats for errors too
                            const stats = this.stats.get(funcName);
                            stats.count++;
                            stats.errors++;
                            stats.totalTime += duration;
                            stats.times.push(duration);
                            stats.lastCalled = currentTime;
                            
                            console.log(`❌ GANTT: ${funcName} → ${duration.toFixed(4)}ms (ERROR: ${error.message})`);
                            
                            // Remove from call stack
                            this.callStack.pop();
                            
                            throw error;
                        }
                    };
                    
                    // Preserve original function properties
                    Object.defineProperty(this.ganttInstance[prop], 'name', { value: funcName });
                    wrapperCount++;
                }
            } catch (e) {
                // Skip properties that can't be wrapped
            }
        });
        
        console.log(`✅ Successfully wrapped ${wrapperCount} gantt functions with advanced monitoring`);
        this.isActive = true;
    }
    
    reset() {
        console.log('🔄 Resetting debugger stats...');
        this.startTime = performance.now();
        this.callStack = [];
        
        // Clear all stats
        this.stats.forEach((stats, funcName) => {
            stats.count = 0;
            stats.totalTime = 0;
            stats.times = [];
            stats.minTime = Infinity;
            stats.maxTime = 0;
            stats.errors = 0;
            stats.lastCalled = null;
            stats.firstCalled = null;
            stats.callsPerSecond = 0;
            stats.avgStackDepth = 0;
            stats.totalStackDepth = 0;
            stats.memoryBefore = 0;
            stats.memoryAfter = 0;
            stats.callHistory = [];
        });
        console.log('✅ Advanced stats reset complete');
    }
    
    // Calculate percentiles from timing data
    calculatePercentiles(times) {
        if (times.length === 0) return { p50: 0, p90: 0, p95: 0, p99: 0 };
        
        const sorted = [...times].sort((a, b) => a - b);
        const getPercentile = (p) => {
            const index = Math.ceil((p / 100) * sorted.length) - 1;
            return sorted[Math.max(0, index)];
        };
        
        return {
            p50: getPercentile(50),
            p90: getPercentile(90),
            p95: getPercentile(95),
            p99: getPercentile(99)
        };
    }
    
    // Calculate standard deviation
    calculateStdDev(times, mean) {
        if (times.length <= 1) return 0;
        const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length;
        return Math.sqrt(variance);
    }
    
    getStats() {
        console.log('📊 Generating advanced execution statistics...');
        
        // Convert stats to array and filter out functions with 0 executions
        const statsArray = Array.from(this.stats.entries())
            .filter(([funcName, stats]) => stats.count > 0)
            .map(([funcName, stats]) => {
                const avgTime = stats.totalTime / stats.count;
                const percentiles = this.calculatePercentiles(stats.times);
                const stdDev = this.calculateStdDev(stats.times, avgTime);
                const avgMemoryDelta = stats.count > 0 ? (stats.memoryAfter - stats.memoryBefore) / stats.count / 1024 : 0;
                
                return {
                    function: funcName,
                    executions: stats.count,
                    totalTime: stats.totalTime,
                    avgTime: avgTime,
                    minTime: stats.minTime === Infinity ? 0 : stats.minTime,
                    maxTime: stats.maxTime,
                    stdDev: stdDev,
                    percentiles: percentiles,
                    errors: stats.errors,
                    errorRate: stats.count > 0 ? (stats.errors / stats.count * 100) : 0,
                    callsPerSecond: stats.callsPerSecond,
                    avgStackDepth: stats.avgStackDepth,
                    avgMemoryDelta: avgMemoryDelta,
                    efficiency: stats.totalTime > 0 ? stats.count / stats.totalTime : 0,
                    recentCalls: stats.callHistory.slice(-5) // Last 5 calls
                };
            })
            .sort((a, b) => b.executions - a.executions); // Sort by executions desc
        
        // Print formatted advanced stats
        console.log('\n📈 ADVANCED GANTT FUNCTION EXECUTION STATISTICS');
        console.log('===============================================');
        
        if (statsArray.length === 0) {
            console.log('No function executions recorded yet.');
            return [];
        }
        
        // Summary header
        const totalCalls = statsArray.reduce((sum, stat) => sum + stat.executions, 0);
        const totalTime = statsArray.reduce((sum, stat) => sum + stat.totalTime, 0);
        console.log(`📊 Total: ${totalCalls} calls in ${totalTime.toFixed(3)}ms`);
        console.log('===============================================');
        
        statsArray.forEach((stat, index) => {
            console.log(`\n${index + 1}. 🔧 ${stat.function}`);
            console.log(`   📞 Executions: ${stat.executions} (${stat.callsPerSecond.toFixed(2)}/sec)`);
            console.log(`   ⏱️  Total Time: ${stat.totalTime.toFixed(3)}ms`);
            console.log(`   📊 Avg: ${stat.avgTime.toFixed(4)}ms | Min: ${stat.minTime.toFixed(4)}ms | Max: ${stat.maxTime.toFixed(4)}ms`);
            console.log(`   📈 Percentiles: P50=${stat.percentiles.p50.toFixed(4)}ms | P90=${stat.percentiles.p90.toFixed(4)}ms | P95=${stat.percentiles.p95.toFixed(4)}ms`);
            console.log(`   📉 StdDev: ${stat.stdDev.toFixed(4)}ms | Efficiency: ${stat.efficiency.toFixed(2)} calls/ms`);
            console.log(`   🎯 Stack Depth: ${stat.avgStackDepth.toFixed(1)} avg | Memory: ${stat.avgMemoryDelta.toFixed(1)}KB avg`);
            
            if (stat.errors > 0) {
                console.log(`   ❌ Errors: ${stat.errors} (${stat.errorRate.toFixed(1)}%)`);
            }
            
            if (stat.recentCalls.length > 0) {
                const recentTimes = stat.recentCalls.map(call => call.duration.toFixed(2)).join('ms, ');
                console.log(`   🕐 Recent calls: ${recentTimes}ms`);
            }
        });
        
        console.log('\n===============================================\n');
        
        return statsArray;
    }
    
    // Get performance hotspots
    getHotspots() {
        const stats = this.getStats();
        console.log('🔥 PERFORMANCE HOTSPOTS');
        console.log('=======================');
        
        const hotspots = {
            slowest: stats.sort((a, b) => b.avgTime - a.avgTime).slice(0, 5),
            mostCalled: stats.sort((a, b) => b.executions - a.executions).slice(0, 5),
            timeConsumers: stats.sort((a, b) => b.totalTime - a.totalTime).slice(0, 5),
            errorProne: stats.filter(s => s.errors > 0).sort((a, b) => b.errorRate - a.errorRate).slice(0, 5)
        };
        
        console.log('\n🐌 Slowest functions (by avg time):');
        hotspots.slowest.forEach((stat, i) => {
            console.log(`${i+1}. ${stat.function}: ${stat.avgTime.toFixed(4)}ms avg`);
        });
        
        console.log('\n📞 Most called functions:');
        hotspots.mostCalled.forEach((stat, i) => {
            console.log(`${i+1}. ${stat.function}: ${stat.executions} calls`);
        });
        
        console.log('\n⏰ Biggest time consumers:');
        hotspots.timeConsumers.forEach((stat, i) => {
            console.log(`${i+1}. ${stat.function}: ${stat.totalTime.toFixed(3)}ms total`);
        });
        
        if (hotspots.errorProne.length > 0) {
            console.log('\n❌ Most error-prone functions:');
            hotspots.errorProne.forEach((stat, i) => {
                console.log(`${i+1}. ${stat.function}: ${stat.errorRate.toFixed(1)}% error rate`);
            });
        }
        
        return hotspots;
    }
    
    start() {
        console.log('▶️  Starting debugger...');
        this.isActive = true;
    }
    
    stop() {
        console.log('⏸️  Stopping debugger...');
        this.isActive = false;
    }
    
    destroy() {
        console.log('🗑️  Destroying debugger...');
        
        // Restore original functions
        this.originalFunctions.forEach((originalFunc, funcName) => {
            this.ganttInstance[funcName] = originalFunc;
        });
        
        this.stats.clear();
        this.originalFunctions.clear();
        this.callStack = [];
        this.isActive = false;
        
        console.log('✅ debugger destroyed and original functions restored');
    }
}

// Export for use
window.GanttDebugger = GanttDebugger;
