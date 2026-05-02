import { Component, ReactNode } from 'react'

interface Props {
    children: ReactNode
    /** Optional fallback UI. If not provided, a default error card is shown. */
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

/** Functional wrapper so we can use react-router navigate inside a class boundary */
function DashboardButton() {
    return (
        <button
            className="btn btn--outline"
            onClick={() => window.location.href = '/dashboard'}
        >
            Go to Dashboard
        </button>
    )
}

/**
 * Global error boundary — catches any unhandled JS error in the React tree
 * and shows a recoverable error screen instead of a white page.
 */
export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div className="error-boundary-wrap">
                    <div className="card error-boundary-card">
                        <div className="error-boundary-icon">⚠️</div>
                        <h2 className="error-boundary-title">Something went wrong</h2>
                        <p className="error-boundary-msg">
                            An unexpected error occurred. Your data is safe — try refreshing or going back.
                        </p>
                        {this.state.error && (
                            <details className="error-boundary-details">
                                <summary className="error-boundary-summary">Technical details</summary>
                                <pre className="error-boundary-pre">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <div className="error-boundary-actions">
                            <button className="btn btn--primary" onClick={this.handleReset}>
                                Try Again
                            </button>
                            <DashboardButton />
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
