const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;

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
        <title>Butterfly Landing</title>
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
        </style>
    </head>
    <body>
        <div class="container">
            
            <img src="/static/Butterfly - Swag-1.jpg" alt="Beautiful Butterfly" class="butterfly-image">
            
        </div>
    </body>
    </html>
  `);
});

// Health check endpoint (useful for App Runner)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🦋 Butterfly webapp running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});