import express, { Express } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

import { setupRoutes } from './routes';
import { errorHandler } from './errorHandler';

// Load environment variables
dotenv.config();

// Create Express app
const createApp = (): Express => {
    const app: Express = express();

    // Get __dirname equivalent in ES module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Middleware
    app.use(express.json());
    app.use(express.static(path.join(__dirname, '../../dist')));

    // Setup routes
    setupRoutes(app);

    // Serve the frontend for all other routes
    app.get('*', (req, res): void => {
        console.log('Serving index.html for route:', req.path);
        res.sendFile(path.join(__dirname, '../../dist/index.html'));
    });

    // Add error handling middleware
    app.use(errorHandler);

    return app;
};

// Create and start server
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const app = createApp();
const server = http.createServer(app);

const startServer = () => {
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

// Start the server if this file is run directly
if (import.meta.url === `file://${fileURLToPath(import.meta.url)}`) {
    startServer();
}

export { app, server, startServer, createApp };
