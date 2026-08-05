import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[KidGuard ErrorBoundary] Uncaught React rendering error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-slate-100 rounded-2xl border border-red-500/30 m-4 shadow-2xl">
          <div className="p-4 bg-red-500/10 rounded-full mb-4 text-red-400">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-100">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
            {this.props.fallbackMessage ||
              'An unforeseen error occurred in this view. Your safety monitoring configuration remains active.'}
          </p>
          {this.state.error && (
            <div className="w-full max-w-md bg-slate-950 p-3 rounded-lg text-xs font-mono text-red-300 text-left overflow-x-auto mb-6 border border-slate-800">
              {this.state.error.toString()}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Reload application view"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
