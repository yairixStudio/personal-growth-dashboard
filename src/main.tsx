import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Plain-browser dev: no preload bridge, so fake one (never bundled for prod).
if (import.meta.env.DEV && !window.desktop) {
  const { browserShim } = await import('./dev/browserShim');
  window.desktop = browserShim;
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root is missing from index.html');

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
