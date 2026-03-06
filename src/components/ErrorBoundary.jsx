import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Erro no app:', error, info)
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error
      const msg = err?.message || String(err || 'Erro desconhecido')
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui',
          background: '#0f172a',
          color: '#fff',
        }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Erro ao carregar</h1>
          <p style={{ color: '#94a3b8', marginBottom: 8, textAlign: 'center' }}>
            Recarregue a página ou verifique o console (F12).
          </p>
          <p style={{ fontSize: 11, color: '#64748b', maxWidth: 360, wordBreak: 'break-word', textAlign: 'center', marginBottom: 24 }}>
            {msg}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#ec5b13',
              color: '#000',
              border: 'none',
              borderRadius: 12,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
