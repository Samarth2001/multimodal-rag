"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
        if (this.props.fallback) {
            return this.props.fallback;
        }
        return (
            <div className="flex flex-col items-center justify-center p-4 m-4 border border-dashed border-red-500/50 bg-red-900/10 rounded-lg text-red-400">
                <AlertCircle className="w-8 h-8 mb-2" />
                <h2 className="text-lg font-semibold mb-1">Something went wrong</h2>
                <p className="text-sm text-center mb-4">
                    An unexpected error occurred in this section.
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                    <pre className="text-xs bg-neutral-800 p-2 rounded-md w-full overflow-auto text-left mb-4">
                        {this.state.error.name}: {this.state.error.message}
                        {this.state.error.stack && `\n${this.state.error.stack}`}
                    </pre>
                )}
                <Button variant="outline" onClick={this.handleReset}>
                    Try again
                </Button>
            </div>
        );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 