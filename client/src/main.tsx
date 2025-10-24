import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { ThemeProvider } from './components/theme-provider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OpenFinWorkspaceProvider } from './openfin/services/OpenfinWorkspaceProvider';
import './index.css';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    },
  },
});

const PlatformProvider = lazy(() => import('./openfin/platform/OpenfinProvider'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      <p className="mt-4 text-muted-foreground">Loading platform...</p>
    </div>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <OpenFinWorkspaceProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<App />} />
                <Route
                  path="/platform/provider"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <PlatformProvider />
                    </Suspense>
                  }
                />
              </Routes>
            </BrowserRouter>
          </OpenFinWorkspaceProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
