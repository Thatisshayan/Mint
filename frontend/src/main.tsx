import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './components/ToastProvider';
import { ThemeProvider } from './components/ThemeProvider';
import App from './App';
import './styles/globals.css';

// Global error display — catches JS crashes that would otherwise show a white screen
window.addEventListener('error', (e) => {
  const root = document.getElementById('root');
  if (root && root.childElementCount === 0) {
    root.innerHTML = `<div style="padding:32px;font-family:monospace;color:#f87171;background:#0a0a0a;min-height:100vh">
      <div style="color:#4ade80;font-size:18px;margin-bottom:16px">MINT — startup error</div>
      <div style="color:#f87171;margin-bottom:8px">${e.message}</div>
      <pre style="color:#9ca3af;font-size:12px;white-space:pre-wrap">${e.filename}:${e.lineno}\n${e.error?.stack ?? ''}</pre>
    </div>`;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  const root = document.getElementById('root');
  if (root && root.childElementCount === 0) {
    root.innerHTML = `<div style="padding:32px;font-family:monospace;color:#f87171;background:#0a0a0a;min-height:100vh">
      <div style="color:#4ade80;font-size:18px;margin-bottom:16px">MINT — startup error (unhandled promise)</div>
      <pre style="color:#9ca3af;font-size:12px;white-space:pre-wrap">${String(e.reason)}</pre>
    </div>`;
  }
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <App />
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
