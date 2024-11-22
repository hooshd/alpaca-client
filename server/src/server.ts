import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { setupRoutes } from './routes';
import { errorHandler } from './errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Setup routes
setupRoutes(app);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
});
