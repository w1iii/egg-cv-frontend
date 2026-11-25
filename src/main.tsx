import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <main role="alert" style={{ minHeight: '100vh', padding: 32, fontFamily: 'system-ui, sans-serif', color: '#0f172a' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Egg-CV could not load this page</h1>
          <p style={{ marginTop: 12 }}>A page error occurred. Reload the page, or report this message to the site maintainer:</p>
          <pre style={{ marginTop: 12, padding: 16, whiteSpace: 'pre-wrap', background: '#f1f5f9', borderRadius: 8 }}>{this.state.error.message}</pre>
        </main>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </React.StrictMode>,
)
