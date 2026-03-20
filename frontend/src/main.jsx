import { Component } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { Toaster } from 'sonner';
import App from './App.jsx';
import './index.css';

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, componentStack: '' };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ componentStack: info?.componentStack ? String(info.componentStack) : '' });
  }

  render() {
    if (this.state.error) {
      const message = this.state.error?.message ? String(this.state.error.message) : 'Unknown error';
      const stack = this.state.error?.stack ? String(this.state.error.stack) : '';
      const componentStack = this.state.componentStack || '';
      return (
        <div className="min-h-[100svh] bg-bg-primary text-white flex items-center justify-center p-6">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 max-w-xl w-full">
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-sm text-white/60 mb-4">The app hit a runtime error and couldn’t render.</p>
            <pre className="text-xs bg-black/30 border border-white/10 rounded-xl p-3 overflow-auto whitespace-pre-wrap">{message}</pre>
            {stack && (
              <pre className="mt-3 text-[11px] bg-black/30 border border-white/10 rounded-xl p-3 overflow-auto whitespace-pre-wrap">{stack}</pre>
            )}
            {componentStack && (
              <pre className="mt-3 text-[11px] bg-black/30 border border-white/10 rounded-xl p-3 overflow-auto whitespace-pre-wrap">{componentStack}</pre>
            )}
            <button
              type="button"
              className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <RootErrorBoundary>
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="parkease-theme">
        <App />
        <Toaster 
          position="top-right" 
          toastOptions={{
            className: 'glass-panel border border-white/10 text-white',
            style: {
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
            }
          }} 
        />
      </ThemeProvider>
    </BrowserRouter>
  </RootErrorBoundary>,
);
