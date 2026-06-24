import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-xl font-bold text-destructive mb-4">
            Something went wrong.
          </h2>
          <details className="space-y-2">
            <summary>
              <span className="font-medium">Details</span>
              <svg
                className="ml-2 h-4 w-4 shrink-0 opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-2.938a.75.75 0 111.08 1.27l-4.25 3.372a.75.75 0 01-1.08.02l-1.32-1.047a.75.75 0 01.02-1.06zm1.27 5.488a.75.75 0 01-1.06.02L7 12.168l-1.88 1.489a.75.75 0 01-1.07-1.07l2.14-1.69a.75.75 0 011.07 0l2.14 1.689a.75.75 0 01-.02 1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </summary>
            <pre className="bg-muted p-3 rounded">{this.state.error?.toString() ?? ''}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}