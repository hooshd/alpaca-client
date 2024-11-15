# Alpaca Trading Interface

## Prerequisites
- Node.js (v18 or later)
- npm

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your Alpaca Paper Trading credentials:
   ```
   ALPACA_API_KEY=your_paper_trading_api_key
   ALPACA_SECRET_KEY=your_paper_trading_secret_key
   PORT=3000
   ```

## Running the Application

To start the development server:
```
npm start
```

The application will be available at `http://localhost:3000`

## Features
- View current account balance
- List current positions
- Close individual positions

## Technologies
- TypeScript
- Express.js
- Alpaca Trade API
- Tailwind CSS

## Notes
- This application uses Alpaca's Paper Trading API
- Ensure you have valid Paper Trading credentials
- All trades and positions are simulated

## Configuration
Modify the `.env` file to change:
- API credentials
- Server port

## Troubleshooting
- Verify your Alpaca Paper Trading API credentials
- Check network connectivity
- Ensure all dependencies are installed correctly
