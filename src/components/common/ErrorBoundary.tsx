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
        <div className="min-h-screen bg-app-bg flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-app-card border border-app-border rounded-3xl p-10 text-center space-y-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500 opacity-50" />
            
            <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="text-red-500" size={40} />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-app-foreground tracking-tight">Signal Interrupted</h1>
              <p className="text-sm text-app-muted font-medium leading-relaxed opacity-70">
                The secure communication channel has encountered a critical fault. Protocol re-initialization recommended.
              </p>
            </div>

            <div className="p-5 bg-app-muted-bg border border-app-border rounded-2xl text-left shadow-inner">
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.2em] mb-2 opacity-50">Fault Telemetry</p>
              <p className="text-xs font-mono text-red-500/80 break-words leading-relaxed">
                {error?.message || 'CRITICAL_FAULT_UNSPECIFIED'}
              </p>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-app-foreground text-app-bg rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-95 group shadow-lg"
            >
              <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
              Reset Console
            </button>
          </motion.div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
