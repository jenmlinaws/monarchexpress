const express = require('express');
const path = require('path');
const AWS = require('aws-sdk');

const app = express();
const PORT = process.env.PORT || 80;

// Configure AWS SDK
AWS.config.update({
    region: process.env.AWS_REGION || 'af-south-1'
});

const ecs = new AWS.ECS();

// Serve static files (images, CSS, etc.)
app.use('/static', express.static(path.join(__dirname, 'public')));

// Main route
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ECS Express Mode</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Arial', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .container {
                text-align: center;
                background: rgba(255, 255, 255, 0);
                padding: 2rem;
                border-radius: 20px;
                box-shadow: 0 0px 0px rgba(0, 0, 0, 0);
                max-width: 800px;
                margin: 2rem;
            }
            .butterfly-image {
                max-width: 100%;
                height: auto;
                border-radius: 15px;
                box-shadow: 0 0px 0px rgba(0, 0, 0, 0);
                margin-bottom: 1.5rem;
            }
            h1 {
                color: #333;
                margin-bottom: 1rem;
                font-size: 2.5rem;
            }
            p {
                color: #666;
                font-size: 1.2rem;
                line-height: 1.6;
            }
            .status-container {
                margin-top: 2rem;
                padding: 1.5rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .status-container h3 {
                color: #333;
                margin-bottom: 1rem;
                font-size: 1.5rem;
            }
            .status-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                text-align: left;
            }
            .status-item {
                background: rgba(255, 255, 255, 0.8);
                padding: 0.8rem;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            }
            .status-item strong {
                color: #333;
                display: block;
                margin-bottom: 0.3rem;
            }
            .status-value {
                color: #666;
                font-size: 0.9rem;
            }
            .status-running { border-left-color: #28a745; }
            .status-pending { border-left-color: #ffc107; }
            .status-error { border-left-color: #dc3545; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1></h1>
            <img src="/static/Butterfly - Swag-1.jpg" alt="Beautiful Butterfly" class="butterfly-image">
            <p></p>
            <div id="ecs-status" class="status-container">
                <div id="status-content">Loading service status...</div>
            </div>
        </div>
        <script>
            async function fetchECSStatus() {
                try {
                    const response = await fetch('/ecs-status');
                    const data = await response.json();
                    
                    if (response.ok) {
                        displayStatus(data);
                    } else {
                        displayError(data);
                    }
                } catch (error) {
                    displayError({ error: 'Network error', message: error.message });
                }
            }
            
            function displayStatus(status) {
                const statusClass = status.status === 'ACTIVE' ? 'status-running' : 
                                  status.status === 'PENDING' ? 'status-pending' : 'status-error';
                
                const content = \`
                    <div class="status-grid">
                        <div class="status-item \${statusClass}">
                            <strong>Service Name</strong>
                            <div class="status-value">\${status.serviceName}</div>
                        </div>
                        <div class="status-item \${statusClass}">
                            <strong>Status</strong>
                            <div class="status-value">\${status.status}</div>
                        </div>
                        <div class="status-item">
                            <strong>Running Tasks</strong>
                            <div class="status-value">\${status.runningCount} / \${status.desiredCount}</div>
                        </div>
                        <div class="status-item">
                            <strong>Pending Tasks</strong>
                            <div class="status-value">\${status.pendingCount}</div>
                        </div>
                        <div class="status-item">
                            <strong>Launch Type</strong>
                            <div class="status-value">\${status.launchType || 'N/A'}</div>
                        </div>
                        <div class="status-item">
                            <strong>Last Updated</strong>
                            <div class="status-value">\${new Date(status.updatedAt).toLocaleString()}</div>
                        </div>
                    </div>
                \`;
                
                document.getElementById('status-content').innerHTML = content;
            }
            
            function displayError(error) {
                const content = \`
                    <div class="status-item status-error">
                        <strong>Error</strong>
                        <div class="status-value">\${error.message || error.error}</div>
                        \${error.fallback ? \`
                            <div style="margin-top: 0.5rem;">
                                <strong>Service:</strong> \${error.fallback.serviceName}<br>
                                <strong>Status:</strong> \${error.fallback.status}
                            </div>
                        \` : ''}
                    </div>
                \`;
                
                document.getElementById('status-content').innerHTML = content;
            }
            
            // Fetch status on page load
            fetchECSStatus();
            
            // Refresh status every 30 seconds
            setInterval(fetchECSStatus, 30000);
        </script>
    </body>
    </html>
  `);
});

// ECS service status endpoint
app.get('/ecs-status', async (req, res) => {
    try {
        const clusterName = process.env.ECS_CLUSTER || 'default';
        const serviceName = process.env.ECS_SERVICE || 'monarch-express-service';

        const params = {
            cluster: clusterName,
            services: [serviceName]
        };

        const data = await ecs.describeServices(params).promise();

        if (data.services && data.services.length > 0) {
            const service = data.services[0];
            const status = {
                serviceName: service.serviceName,
                status: service.status,
                runningCount: service.runningCount,
                pendingCount: service.pendingCount,
                desiredCount: service.desiredCount,
                taskDefinition: service.taskDefinition,
                createdAt: service.createdAt,
                updatedAt: service.updatedAt,
                platformVersion: service.platformVersion,
                launchType: service.launchType
            };
            res.json(status);
        } else {
            res.status(404).json({ error: 'Service not found' });
        }
    } catch (error) {
        console.error('Error fetching ECS status:', error);
        res.status(500).json({
            error: 'Failed to fetch ECS status',
            message: error.message,
            fallback: {
                serviceName: process.env.ECS_SERVICE || 'monarch-express-service',
                status: 'UNKNOWN',
                message: 'Unable to connect to ECS API'
            }
        });
    }
});

// Health check endpoint (useful for App Runner)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🦋 Butterfly webapp running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});