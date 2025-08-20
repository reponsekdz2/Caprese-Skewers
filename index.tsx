
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom'; // Changed import
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CallProvider } from './contexts/CallContext'; // Import CallProvider
import ToastContainer from './components/common/ToastContainer';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter> {/* Changed usage */}
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <CallProvider> {/* Wrap with CallProvider */}
              <App />
              <ToastContainer />
            </CallProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </HashRouter> {/* Changed usage */}
  </React.StrictMode>
);