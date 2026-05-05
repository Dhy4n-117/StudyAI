import React from 'react';
import './ErrorDisplay.css';

export function ErrorDisplay({ message, onRetry }) {
  return (
    <div className="error-display" role="alert">
      <div className="error-icon">⚠</div>
      <p className="error-message">{message || 'Something went wrong. Please try again.'}</p>
      {onRetry && (
        <button className="error-retry-btn" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-inner">
            <div className="error-boundary-icon">💀</div>
            <h2>Something crashed</h2>
            <p>{this.state.error?.message}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })}>
              Reset
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
