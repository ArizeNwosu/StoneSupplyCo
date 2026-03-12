import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App crashed', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f3eee4',
            color: '#22312b',
            padding: '24px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#5d8a7a', marginBottom: 12 }}>
              Launch Error
            </p>
            <h1 style={{ fontSize: 28, lineHeight: 1.15, marginBottom: 12 }}>Callmate hit an error while opening.</h1>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#66756f', marginBottom: 16 }}>
              {this.state.error.message || 'Unknown error'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
