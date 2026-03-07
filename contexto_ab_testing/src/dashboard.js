/**
 * Real-time Dashboard for A/B Testing
 * Displays metrics and results as tests execute
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');

class ABTestDashboard {
    constructor(port = 8080) {
        this.port = port;
        this.server = null;
        this.wss = null;
        this.activeTests = new Map();
        this.metricsHistory = [];
    }

    async start() {
        // Create HTTP server
        this.server = http.createServer(async (req, res) => {
            if (req.url === '/') {
                await this.serveDashboard(res);
            } else if (req.url === '/api/tests') {
                await this.serveTestsAPI(res);
            } else if (req.url === '/api/metrics') {
                await this.serveMetricsAPI(res);
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });

        // Create WebSocket server for real-time updates
        this.wss = new WebSocket.Server({ server: this.server });
        this.wss.on('connection', (ws) => {
            console.log('📱 Dashboard client connected');

            // Send initial data
            ws.send(JSON.stringify({
                type: 'initial',
                activeTests: Array.from(this.activeTests.values()),
                metricsHistory: this.metricsHistory.slice(-50) // Last 50 metrics
            }));
        });

        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log(`📊 Dashboard running at http://localhost:${this.port}`);
                resolve();
            });
        });
    }

    async serveDashboard(res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>A/B Test Dashboard - GitNexus vs Traditional</title>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .metric-label { color: #666; font-size: 0.9em; }
        .comparison-chart { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); height: 400px; }
        .test-status { padding: 10px; border-radius: 5px; margin: 10px 0; }
        .status-running { background: #fff3cd; border-left: 4px solid #ffc107; }
        .status-completed { background: #d4edda; border-left: 4px solid #28a745; }
        .status-error { background: #f8d7da; border-left: 4px solid #dc3545; }
        .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s ease; }
        .swarm-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .swarm-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .swarm-traditional { border-top: 4px solid #dc3545; }
        .swarm-experimental { border-top: 4px solid #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 A/B Test Dashboard</h1>
        <p>GitNexus + RLM Navigator vs Traditional Investigation</p>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-label">Tests Activos</div>
            <div class="metric-value" id="activeTests">-</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Tests Completados</div>
            <div class="metric-value" id="completedTests">-</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Mejora Promedio en Tiempo</div>
            <div class="metric-value" id="avgTimeImprovement">-</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Mejora Promedio en Precisión</div>
            <div class="metric-value" id="avgAccuracyImprovement">-</div>
        </div>
    </div>

    <div class="swarm-comparison">
        <div class="swarm-card swarm-traditional">
            <h3>🔄 Control Swarm (Traditional)</h3>
            <div id="traditionalStatus">Esperando...</div>
            <div class="progress-bar">
                <div class="progress-fill" id="traditionalProgress" style="width: 0%"></div>
            </div>
            <div id="traditionalMetrics"></div>
        </div>

        <div class="swarm-card swarm-experimental">
            <h3>🧠 Experimental Swarm (GitNexus+RLM)</h3>
            <div id="experimentalStatus">Esperando...</div>
            <div class="progress-bar">
                <div class="progress-fill" id="experimentalProgress" style="width: 0%"></div>
            </div>
            <div id="experimentalMetrics"></div>
        </div>
    </div>

    <div class="comparison-chart" id="chartContainer">
        <h3>📊 Comparación en Tiempo Real</h3>
        <div id="chartPlaceholder">Gráfico se mostrará aquí cuando inicien los tests...</div>
    </div>

    <div id="testLogs" style="margin-top: 20px;"></div>

    <script>
        // WebSocket connection for real-time updates
        const ws = new WebSocket('ws://localhost:8080');
        let currentTest = null;

        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            updateDashboard(data);
        };

        function updateDashboard(data) {
            if (data.type === 'initial') {
                document.getElementById('activeTests').textContent = data.activeTests.length;
                // Initialize dashboard with existing data
            } else if (data.type === 'testUpdate') {
                updateTestProgress(data.testData);
            } else if (data.type === 'testComplete') {
                updateCompletedTest(data.results);
            }
        }

        function updateTestProgress(testData) {
            // Update progress bars and metrics
            if (testData.swarmType === 'control') {
                document.getElementById('traditionalStatus').textContent = testData.status;
                document.getElementById('traditionalProgress').style.width = testData.progress + '%';
            } else if (testData.swarmType === 'experimental') {
                document.getElementById('experimentalStatus').textContent = testData.status;
                document.getElementById('experimentalProgress').style.width = testData.progress + '%';
            }
        }

        function updateCompletedTest(results) {
            // Update final results
            const timeImprovement = results.comparison.timeImprovement;
            const accuracyImprovement = results.comparison.accuracyImprovement;

            document.getElementById('avgTimeImprovement').textContent = timeImprovement;
            document.getElementById('avgAccuracyImprovement').textContent = accuracyImprovement;

            // Add to logs
            const logEntry = document.createElement('div');
            logEntry.className = 'test-status status-completed';
            logEntry.innerHTML =
                '<strong>Test Completado:</strong> ' + results.testId + '<br>' +
                'Mejora en tiempo: ' + timeImprovement + '<br>' +
                'Mejora en precisión: ' + accuracyImprovement;
            document.getElementById('testLogs').appendChild(logEntry);
        }
    </script>
</body>
</html>
        `;

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }

    async serveTestsAPI(res) {
        const tests = Array.from(this.activeTests.values());
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(tests));
    }

    async serveMetricsAPI(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.metricsHistory));
    }

    // Methods to update dashboard data
    addTest(testId, testData) {
        this.activeTests.set(testId, {
            id: testId,
            ...testData,
            startTime: Date.now(),
            status: 'running'
        });

        this.broadcast({
            type: 'testStarted',
            testId,
            testData
        });
    }

    updateTest(testId, updateData) {
        if (this.activeTests.has(testId)) {
            const test = this.activeTests.get(testId);
            Object.assign(test, updateData);

            this.broadcast({
                type: 'testUpdate',
                testId,
                testData: test
            });
        }
    }

    completeTest(testId, results) {
        if (this.activeTests.has(testId)) {
            const test = this.activeTests.get(testId);
            test.status = 'completed';
            test.results = results;
            test.endTime = Date.now();

            // Move to metrics history
            this.metricsHistory.push({
                timestamp: Date.now(),
                testId,
                results,
                duration: test.endTime - test.startTime
            });

            this.activeTests.delete(testId);

            this.broadcast({
                type: 'testComplete',
                testId,
                results
            });
        }
    }

    broadcast(data) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }

    async stop() {
        if (this.server) {
            this.server.close();
        }
        if (this.wss) {
            this.wss.close();
        }
    }
}

module.exports = ABTestDashboard;
