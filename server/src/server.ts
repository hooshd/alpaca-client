import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { setupRoutes } from './routes';
import { errorHandler } from './errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
setupRoutes(app);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../client/build')));

// Error handling middleware for API routes
app.use('/api', errorHandler);

// The "catchall" handler: for any request that doesn't
// match an API route, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/build/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
