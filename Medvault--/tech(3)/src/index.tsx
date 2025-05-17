import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/global.css'; // Import the global CSS
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: console.log)
// or send to an analytics endpoint.