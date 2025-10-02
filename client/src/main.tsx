import { StrictMode, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import { ThemeProvider } from './components/theme-provider';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const PlatformProvider = lazy(() => import('./platform/Provider'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/platform/provider" element={<PlatformProvider />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
