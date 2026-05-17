import * as React from 'react';
import { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // @ts-ignore
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    // @ts-ignore
    const { hasError, error } = this.state;

    if (hasError) {
      return (
        <div className="min-h-screen bg-[#020306] flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-[#0A0B0E] border border-white/5 rounded-2xl p-8 text-center space-y-6 shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Something went wrong</h1>
              <p className="text-sm text-zinc-500 leading-relaxed">
                The application encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-left">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Error Details</p>
              <p className="text-[11px] font-mono text-red-400/80 line-clamp-3">
                {error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 group"
            >
              <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
              Reload Page
            </button>
          </motion.div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
