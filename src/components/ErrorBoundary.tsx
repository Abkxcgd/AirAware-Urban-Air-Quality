import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected rendering error occurred.',
    };
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 p-6 sm:p-8 text-center max-w-lg mx-auto my-8 shadow-xs"
        >
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto" />
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-3">
            Something went wrong displaying this view
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
