import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AlpacaProvider } from './context/AlpacaContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AlpacaProvider>
      <App />
    </AlpacaProvider>
  </React.StrictMode>
);
