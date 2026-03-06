import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export const useToast = () => {
    const ctx = useContext(ToastContext)
    if (!ctx) return { toast: (msg) => alert(msg) }
    return ctx
}

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([])

    const toast = useCallback((message, type = 'info') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3000)
    }, [])

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm flex flex-col gap-2 z-[200] pointer-events-none">
                {toasts.map(({ id, message, type }) => (
                    <div
                        key={id}
                        className={`pointer-events-auto px-4 py-3 rounded-2xl border shadow-xl ${
                            type === 'error'
                                ? 'bg-red-500/95 text-white border-red-400/50'
                                : type === 'success'
                                    ? 'bg-green-500/95 text-white border-green-400/50'
                                    : 'bg-surface border-card-border text-slate-900'
                        }`}
                    >
                        <p className="text-sm font-semibold">{message}</p>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
