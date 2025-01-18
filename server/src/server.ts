import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { setupRoutes } from './routes';
import { errorHandler } from './errorHandler';
import { getAccounts } from './sheetsClient';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Start server with initialization
const startServer = async () => {
  try {
    // Setup routes and get the initialization function
    const { initializeAlpacaClient } = setupRoutes(app);

    // Pre-fetch accounts and trigger initial initialization
    const accounts = await getAccounts();
    console.log(`Pre-initialization: Found ${accounts.length} accounts`);
    
    if (accounts.length > 0) {
      // Initialize directly using the first account
      await initializeAlpacaClient(accounts[0]);
    }

    // Serve static files from the React app
    app.use(express.static(path.join(__dirname, '../../client/dist')));

    // Error handling middleware for API routes
    app.use('/api', errorHandler);

    // The "catchall" handler: for any request that doesn't
    // match an API route, send back React's index.html file.
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });
    
    // Start listening only after initialization is complete
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle startup errors
startServer().catch((error) => {
  console.error('Fatal error during server startup:', error);
  process.exit(1);
});