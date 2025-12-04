'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showStack: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showStack: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, would send to error reporting service
    // this.reportError(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private toggleStack = () => {
    this.setState((prev) => ({ showStack: !prev.showStack }));
  };

  private copyError = async () => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
    `.trim();

    await navigator.clipboard.writeText(errorText);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    const { hasError, error, errorInfo, showStack, copied } = this.state;
    const { children, fallback, showDetails = true } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Ops! Qualcosa è andato storto
              </h1>
              <p className="text-gray-600">
                Si è verificato un errore imprevisto. Prova a ricaricare la pagina.
              </p>
            </div>

            {/* Error Details (Development) */}
            {showDetails && error && (
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-mono text-sm break-all">
                    {error.message}
                  </p>
                </div>

                {/* Stack Trace Toggle */}
                {errorInfo && (
                  <div className="mt-2">
                    <button
                      onClick={this.toggleStack}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                      {showStack ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {showStack ? 'Nascondi' : 'Mostra'} dettagli tecnici
                    </button>

                    {showStack && (
                      <div className="mt-2 bg-gray-900 rounded-lg p-4 overflow-auto max-h-48">
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                          {error.stack}
                          {'\n\n--- Component Stack ---\n'}
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
                Ricarica Pagina
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                <Home className="h-5 w-5" />
                Torna alla Home
              </button>
            </div>

            {/* Report Bug */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <button
                  onClick={this.copyError}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      Copiato!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copia errore
                    </>
                  )}
                </button>

                <a
                  href="mailto:support@edu-atelier.it?subject=Bug Report"
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  <Bug className="h-4 w-4" />
                  Segnala problema
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Hook version for functional components
interface UseErrorHandlerOptions {
  onError?: (error: Error) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const handleError = React.useCallback(
    (error: Error) => {
      console.error('Error caught by useErrorHandler:', error);
      options.onError?.(error);
    },
    [options.onError]
  );

  return handleError;
}

// Error fallback for specific sections
interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  message?: string;
  compact?: boolean;
}

export function ErrorFallback({
  error,
  resetError,
  message = 'Si è verificato un errore',
  compact = false,
}: ErrorFallbackProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-800">{message}</p>
          {error && (
            <p className="text-xs text-red-600 mt-1 font-mono">
              {error.message}
            </p>
          )}
        </div>
        {resetError && (
          <button
            onClick={resetError}
            className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
      {error && (
        <p className="text-sm text-gray-600 mb-4 font-mono">{error.message}</p>
      )}
      {resetError && (
        <button
          onClick={resetError}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <RefreshCw className="h-4 w-4" />
          Riprova
        </button>
      )}
    </div>
  );
}

// Loading fallback
interface LoadingFallbackProps {
  message?: string;
}

export function LoadingFallback({
  message = 'Caricamento...',
}: LoadingFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

// Network error component
interface NetworkErrorProps {
  onRetry?: () => void;
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Connessione assente
      </h3>
      <p className="text-gray-600 mb-4">
        Verifica la tua connessione internet e riprova
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <RefreshCw className="h-4 w-4" />
          Riprova
        </button>
      )}
    </div>
  );
}

// Not found component
export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">
          Pagina non trovata
        </h2>
        <p className="text-gray-600 mt-2 mb-6">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700"
        >
          <Home className="h-5 w-5" />
          Torna alla Dashboard
        </a>
      </div>
    </div>
  );
}
