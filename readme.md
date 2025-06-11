# GanttDebugger - Performance Monitoring Tool

A comprehensive debugging and performance analysis tool for DHTMLX Gantt chart libraries that provides detailed execution statistics, performance metrics, and optimization insights.

**Source Code:** `react_client/src/assets/gantt/debugger.js`

## 🚀 Features

- **Function Wrapping**: Automatically wraps all Gantt chart functions with performance monitoring
- **Detailed Statistics**: Comprehensive metrics including execution time, call frequency, memory usage, and error tracking
- **Performance Analysis**: Percentile calculations, standard deviation, and efficiency metrics
- **Hotspot Detection**: Identifies performance bottlenecks and optimization opportunities
- **Memory Monitoring**: Tracks memory usage changes during function execution (Chrome/Chromium browsers)
- **Call Stack Analysis**: Monitors function call depth and patterns
- **Error Tracking**: Captures and reports function execution errors
- **Built-in Exclusions**: Automatically excludes frequently called functions like `getState`, `assert`, `checkEvent`

## 🖥️ Using in Browser Console (Quick Start)

### Step 1: Copy the Code
Copy the entire GanttDebugger class from `react_client/src/assets/gantt/debugger.js`.

### Step 2: Open Developer Tools
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
- **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows/Linux) / `Cmd+Option+K` (Mac)
- **Safari**: Press `Cmd+Option+I` (Mac) - Enable Developer menu first in Safari preferences

### Step 3: Navigate to Console Tab
Click on the "Console" tab in the developer tools.

### Step 4: Paste and Execute the Code
1. Paste the entire GanttDebugger code into the console
2. Press `Enter` to execute it
3. You should see: `🔧 GanttDebugger initialized`

### Step 5: Create Debugger Instance
```javascript
// Find your gantt instance (common variable names)
// Try one of these based on your Gantt library:
const debugger = new GanttDebugger(gantt);           // dhtmlxGantt
// const debugger = new GanttDebugger(ganttChart);   // If your variable is ganttChart
// const debugger = new GanttDebugger(myGantt);      // If your variable is myGantt
// const debugger = new GanttDebugger(window.gantt); // If gantt is global
```

### Step 6: Use Your Gantt Normally
Interact with your Gantt chart (add tasks, scroll, resize, etc.). The debugger is now monitoring all function calls.

### Step 7: View Results
```javascript
// Print detailed statistics (includes console output)
const stats = debugger.getStats();

// Print performance hotspots (includes console output)
const hotspots = debugger.getHotspots();
```

## 🔧 Console Usage Examples

### Quick Performance Check
```javascript
// Paste GanttDebugger code first, then:
const debugger = new GanttDebugger(gantt);

// Do some operations that might be slow
// click stuff
// reorder
// create
// etc.

// Check what's taking time
debugger.getHotspots();
```

### Memory Leak Investigation
```javascript
// Paste GanttDebugger code first, then:
const debugger = new GanttDebugger(gantt);

// Perform operations that might leak memory
for(let i = 0; i < 100; i++) {
    gantt.addTask({id: i, text: `Task ${i}`});
}

// Check memory usage
const stats = debugger.getStats();
stats.filter(s => s.avgMemoryDelta > 50).forEach(s => 
    console.log(`${s.function}: ${s.avgMemoryDelta.toFixed(1)}KB avg memory usage`)
);
```

### Before/After Performance Comparison
```javascript
// Paste GanttDebugger code first, then:
const debugger = new GanttDebugger(gantt);

// Test current performance
performYourOperations();
const beforeStats = debugger.getStats();
console.log('Before optimization:', beforeStats.slice(0, 5));

// Reset and test after changes
debugger.reset();
performYourOptimizedOperations();
const afterStats = debugger.getStats();
console.log('After optimization:', afterStats.slice(0, 5));
```

### Finding Your Gantt Instance
If you're not sure what your gantt variable is called, try these in the console:

```javascript
// Check common variable names
console.log('gantt:', typeof gantt);
console.log('ganttChart:', typeof ganttChart);
console.log('myGantt:', typeof myGantt);

// Search in window object
Object.keys(window).filter(key => key.toLowerCase().includes('gantt'));

// Or look for objects with gantt-like methods
Object.keys(window).filter(key => {
    const obj = window[key];
    return obj && typeof obj === 'object' && 
           (obj.render || obj.parse || obj.addTask);
});
```

### Quick Troubleshooting in Console
```javascript
// If debugger seems not to work:
console.log('Debugger active:', debugger.isActive);
console.log('Functions wrapped:', debugger.originalFunctions.size);
console.log('Stats collected:', debugger.stats.size);

// Check if gantt instance is valid
console.log('Gantt instance:', debugger.ganttInstance);
console.log('Gantt methods:', Object.getOwnPropertyNames(debugger.ganttInstance).filter(prop => 
    typeof debugger.ganttInstance[prop] === 'function'
));
```

### Cleaning Up
```javascript
// Stop monitoring but keep wrappers
debugger.stop();

// Start monitoring again
debugger.start();

// Completely remove debugger and restore original functions
debugger.destroy();

// Verify cleanup
console.log('Debugger destroyed:', !debugger.isActive);
```

## 📊 API Reference

### Constructor
```javascript
new GanttDebugger(ganttInstance)
```

**Parameters:**
- `ganttInstance` (required): Your Gantt chart instance

**Built-in Settings:**
- Automatically excludes: `getState`, `assert`, `checkEvent`
- Tracks last 10 calls per function
- Memory monitoring (Chrome/Chromium only)
- Auto-starts monitoring on creation

### Methods

#### Control Methods
```javascript
debugger.start()           // Start monitoring
debugger.stop()            // Stop monitoring (keeps wrappers)
debugger.reset()           // Reset all statistics
debugger.destroy()         // Remove all wrappers and restore original functions
```

#### Statistics Methods
```javascript
debugger.getStats()        // Get statistics array AND print to console
debugger.getHotspots()     // Get hotspots object AND print to console
```

**Note:** Both `getStats()` and `getHotspots()` automatically print formatted output to the console and return data objects.

## 📈 Understanding the Output

### Statistics Report (from `getStats()`)
```
📈 ADVANCED GANTT FUNCTION EXECUTION STATISTICS
===============================================
📊 Total: 1,234 calls in 567.890ms
===============================================

1. 🔧 render
   📞 Executions: 45 (2.34/sec)
   ⏱️  Total Time: 234.567ms
   📊 Avg: 5.2126ms | Min: 1.2340ms | Max: 15.6780ms
   📈 Percentiles: P50=4.5600ms | P90=8.9000ms | P95=12.3400ms
   📉 StdDev: 2.3456ms | Efficiency: 8.76 calls/ms
   🎯 Stack Depth: 1.2 avg | Memory: 45.6KB avg
   🕐 Recent calls: 4.56ms, 5.23ms, 3.78ms, 6.12ms, 4.89ms
```

### Performance Hotspots (from `getHotspots()`)
```
🔥 PERFORMANCE HOTSPOTS
=======================

🐌 Slowest functions (by avg time):
1. complexCalculation: 15.6789ms avg
2. heavyRendering: 12.3456ms avg

📞 Most called functions:
1. updateView: 456 calls
2. processData: 234 calls

⏰ Biggest time consumers:
1. render: 234.567ms total
2. processData: 123.456ms total

❌ Most error-prone functions:
1. validateData: 5.2% error rate
```

### Statistics Object Structure
```javascript
{
    function: "functionName",
    executions: 45,
    totalTime: 234.567,
    avgTime: 5.2126,
    minTime: 1.2340,
    maxTime: 15.6780,
    stdDev: 2.3456,
    percentiles: {
        p50: 4.5600,
        p90: 8.9000,
        p95: 12.3400,
        p99: 14.2300
    },
    errors: 2,
    errorRate: 4.44,
    callsPerSecond: 2.34,
    avgStackDepth: 1.2,
    avgMemoryDelta: 45.6,
    efficiency: 8.76,
    recentCalls: [...]
}
```

## 💡 Use Cases

### 1. Performance Optimization
```javascript
const debugger = new GanttDebugger(gantt);

// Perform operations you want to analyze
gantt.parse(largeDataSet);
gantt.render();

// Identify bottlenecks
const hotspots = debugger.getHotspots();
// Check console output for detailed analysis
```

### 2. Memory Leak Detection
```javascript
const debugger = new GanttDebugger(gantt);

// Monitor memory usage over time
const stats = debugger.getStats();
stats.forEach(stat => {
    if (stat.avgMemoryDelta > 100) { // Functions using >100KB
        console.warn(`Memory concern: ${stat.function} uses ${stat.avgMemoryDelta}KB avg`);
    }
});
```

### 3. Error Analysis
```javascript
const debugger = new GanttDebugger(gantt);

// After operations that might fail
const hotspots = debugger.getHotspots();
if (hotspots.errorProne.length > 0) {
    console.log('Functions with errors:', hotspots.errorProne);
}
```

### 4. Performance Regression Testing
```javascript
// Before changes
const debugger = new GanttDebugger(gantt);
performStandardOperations();
const baselineStats = debugger.getStats();
debugger.reset();

// After changes
performStandardOperations();
const newStats = debugger.getStats();

// Compare performance
newStats.forEach(newStat => {
    const baseline = baselineStats.find(s => s.function === newStat.function);
    if (baseline && newStat.avgTime > baseline.avgTime * 1.1) {
        console.warn(`Performance regression in ${newStat.function}: ${newStat.avgTime}ms vs ${baseline.avgTime}ms`);
    }
});
```

## 🔍 Troubleshooting

### Common Issues

1. **Functions not being wrapped**
   - Ensure the gantt instance is passed correctly
   - Check if functions are already wrapped or protected
   - Functions starting with `_` or `$` are automatically excluded

2. **Memory statistics showing 0**
   - `performance.memory` is only available in Chrome/Chromium browsers
   - Other browsers will show 0 for memory statistics

4. **Performance impact**
   - The debugger adds minimal overhead (~0.1ms per function call)
   - Use `stop()` to pause monitoring without removing wrappers
   - Use `destroy()` to completely remove monitoring

5. **No statistics showing**
   - Check if `debugger.isActive` is `true`
   - Verify your gantt instance has callable methods
   - Ensure you're interacting with the gantt after creating the debugger

## 📝 Built-in Exclusions

The debugger automatically excludes these frequently called functions to reduce noise:
- `getState`
- `assert`
- `checkEvent`

These functions are typically called very frequently (especially during mouse movements) and would clutter the statistics.

## 📄 License

MIT License - Feel free to use, modify, and distribute as needed.

---

**Happy debugging! 🐛🔧** 
