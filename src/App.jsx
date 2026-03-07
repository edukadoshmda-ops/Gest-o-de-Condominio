import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Sidebar, Drawer } from './components/Navigation'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { Financeiro } from './components/Financeiro'
import { Reservas } from './components/Reservas'
import { Visitantes } from './components/Visitantes'
import { Chamados } from './components/Chamados'
import { Mural } from './components/Mural'
import { Login } from './components/Login'
import { Landing } from './components/Landing'
import { Perfil } from './components/Perfil'
import { Configuracoes } from './components/Configuracoes'
import { AdminMaster } from './components/AdminMaster'
import { Patrimonio } from './components/Patrimonio'
import { GestaoUsuarios } from './components/GestaoUsuarios'
import { Encomendas } from './components/Encomendas'
import { Busca } from './components/Busca'
import { CentroNotificacoes } from './components/CentroNotificacoes'
import { Relatorios } from './components/Relatorios'
import { Documentos } from './components/Documentos'
import { Trailer } from './components/Trailer'
import { Plus } from 'lucide-react'

const THEMES = {
    midnight: {
        primary: '234 88 12', // Orange-600 vibrante
        background: '248 250 252',
        surface: '255 255 255',
        'card-border': '226 232 240',
    },
    ocean: {
        primary: '2 132 199', // Sky-600 vibrante
        background: '248 250 252',
        surface: '255 255 255',
        'card-border': '226 232 240',
    },
    emerald: {
        primary: '234 179 8', // Amber-500 dourado vibrante
        background: '248 250 252',
        surface: '255 255 255',
        'card-border': '226 232 240',
    },
    sunset: {
        primary: '219 39 119', // Pink-600 vibrante
        background: '248 250 252',
        surface: '255 255 255',
        'card-border': '226 232 240',
    },
    purple: {
        primary: '124 58 237', // Violet-600 vibrante
        background: '248 250 252',
        surface: '255 255 255',
        'card-border': '226 232 240',
    },
}

const themes = Object.keys(THEMES).map(id => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1) }))

const App = () => {
    const [activeTab, setActiveTab] = useState('mural')
    const [searchTerm, setSearchTerm] = useState('')
    const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'emerald')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [session, setSession] = useState(null)
    const [userProfile, setUserProfile] = useState(null)
    const [loadingAuth, setLoadingAuth] = useState(true)
    const [errorAuth, setErrorAuth] = useState(null)
    const [showLogin, setShowLogin] = useState(false)
    const [showTrailer, setShowTrailer] = useState(false)

    const fetchUserProfile = async (userId, userEmail) => {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*, condominios(*)')
                .eq('id', userId)
                .maybeSingle()

            if (error) throw error

            if (!data) {
                // Perfil não existe. Para evitar travar, em vez de criar automático, vamos avisar o usuário.
                console.log("Perfil não encontrado.")

                // Se for o Admin Master (edukadoshmda@gmail.com), ele deve poder entrar para criar o primeiro condo
                const envEmail = (import.meta.env.VITE_SUPERADMIN_EMAIL || '').trim().toLowerCase()
                const superAdminEmail = envEmail || 'edukadoshmda@gmail.com'
                const isSuperAdmin = superAdminEmail && userEmail?.toLowerCase() === superAdminEmail

                if (isSuperAdmin) {
                    // Busca o primeiro condomínio disponível se existir
                    let { data: condos } = await supabase.from('condominios').select('id, nome, status').limit(1).maybeSingle()
                    setUserProfile({
                        id: userId,
                        tipo: 'admin_master',
                        nome: 'Super Admin',
                        condominio_id: condos?.id || null,
                        condominios: condos || null
                    })
                    setLoadingAuth(false)
                    return
                }

                throw new Error("Perfil não encontrado no banco de dados. Contate o síndico ou o administrador master para realizar seu cadastro.")
            }

            // 1. Verificar se o condomínio está ativo (admin_master e síndico podem entrar para reativar)
            const podeGerenciarCondo = data.tipo === 'admin_master' || data.tipo === 'sindico'
            if (data.condominios && data.condominios.status !== 'ativo' && !podeGerenciarCondo) {
                alert("Este condomínio está suspenso. Entre em contato com o administrador.")
                await supabase.auth.signOut()
                setUserProfile(null)
                return
            }

            // 2. Verificar se a assinatura expirou (apenas para não-admins)
            if (data.condominios?.data_vencimento && data.tipo !== 'admin_master') {
                const hoje = new Date().toISOString().split('T')[0]
                if (data.condominios.data_vencimento < hoje) {
                    alert("A assinatura do condomínio expirou. O acesso foi bloqueado.")
                    await supabase.auth.signOut()
                    setUserProfile(null)
                    return
                }
            }

            // Superadmin: e-mail em VITE_SUPERADMIN_EMAIL ou fallback edukadoshmda@gmail.com
            const envEmail = (import.meta.env.VITE_SUPERADMIN_EMAIL || '').trim().toLowerCase()
            const superAdminEmail = envEmail || 'edukadoshmda@gmail.com'
            const isSuperAdmin = superAdminEmail && userEmail?.toLowerCase() === superAdminEmail

            const finalProfile = { ...data }
            if (isSuperAdmin) {
                finalProfile.tipo = 'admin_master'
            } else if (userEmail.includes('sindico') && finalProfile.tipo === 'morador') {
                finalProfile.tipo = 'sindico'
            }

            setUserProfile(finalProfile)
        } catch (error) {
            console.error('Erro ao buscar perfil:', error)
            const envEmail = (import.meta.env.VITE_SUPERADMIN_EMAIL || '').trim().toLowerCase()
            const superAdminEmail = envEmail || 'edukadoshmda@gmail.com'
            const isSuperAdmin = superAdminEmail && userEmail?.toLowerCase() === superAdminEmail
            if (isSuperAdmin) {
                // Busca primeiro condomínio para o perfil superadmin
                const { data: primeiroCondo } = await supabase.from('condominios').select('id, nome, status').limit(1).maybeSingle()
                setUserProfile({
                    id: userId,
                    tipo: 'admin_master',
                    nome: 'Super Admin',
                    condominio_id: primeiroCondo?.id,
                    condominios: primeiroCondo || null
                })
            } else {
                setErrorAuth("Perfil não encontrado no banco de dados. Contate o síndico ou administrador para liberar seu acesso.")
            }
        } finally {
            setLoadingAuth(false)
        }
    }

    useEffect(() => {
        localStorage.setItem('app-theme', theme)
        const colors = THEMES[theme] || THEMES.midnight
        const root = document.documentElement
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value)
        })
        root.setAttribute('data-theme', theme) // keep for reference
    }, [theme])

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session?.user) {
                fetchUserProfile(session.user.id, session.user.email)
            } else {
                setLoadingAuth(false)
            }
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            if (session?.user) {
                setLoadingAuth(true)
                fetchUserProfile(session.user.id, session.user.email)
            } else {
                setUserProfile(null)
                setLoadingAuth(false)
                setShowLogin(false) // Volta à landing após logout
            }
        })

        // Timeout de segurança: se após 5 segundos ainda estiver carregando, libera a tela
        const timeout = setTimeout(() => {
            setLoadingAuth(false)
        }, 5000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 font-bold text-slate-900">
                <div className="uppercase tracking-widest text-xs">Iniciando Sistema...</div>
                <p className="text-xs text-slate-500 font-normal max-w-xs text-center">
                    Se demorar, clique abaixo para ir ao login
                </p>
                <button
                    onClick={() => setLoadingAuth(false)}
                    className="px-6 py-3 rounded-xl bg-primary/20 text-slate-800 text-xs uppercase tracking-wider hover:bg-primary/30 transition"
                >
                    Ir ao Login
                </button>
            </div>
        )
    }

    if (errorAuth) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 font-bold">X</div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Erro de Acesso</h2>
                <p className="text-slate-500 font-medium mb-8">{errorAuth}</p>
                <button onClick={() => {
                    setErrorAuth(null)
                    supabase.auth.signOut()
                }} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20">
                    Voltar ao Login
                </button>
            </div>
        )
    }

    if (!session) {
        return (
            <>
                {showLogin ? <Login onBack={() => setShowLogin(false)} /> : <Landing onEnter={() => setShowLogin(true)} onWatchTrailer={() => setShowTrailer(true)} />}
                {showTrailer && <Trailer onFinish={() => setShowTrailer(false)} />}
            </>
        )
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'inicio':
                return <Dashboard session={session} userProfile={userProfile} setActiveTab={setActiveTab} />
            case 'mural':
                return <Mural session={session} userProfile={userProfile} />
            case 'financeiro':
                return <Financeiro session={session} userProfile={userProfile} />
            case 'reservas':
                return <Reservas session={session} userProfile={userProfile} />
            case 'chamados':
                return <Chamados session={session} userProfile={userProfile} />
            case 'visitantes':
                return <Visitantes session={session} userProfile={userProfile} />
            case 'encomendas':
                return <Encomendas session={session} userProfile={userProfile} />
            case 'documentos':
                return <Documentos session={session} userProfile={userProfile} />
            case 'perfil':
                return <Perfil session={session} userProfile={userProfile} />
            case 'patrimonio':
                return <Patrimonio session={session} userProfile={userProfile} />
            case 'admin':
                return <AdminMaster session={session} userProfile={userProfile} setUserProfile={setUserProfile} setActiveTab={setActiveTab} />
            case 'usuarios':
                return <GestaoUsuarios session={session} userProfile={userProfile} />
            case 'config':
                return <Configuracoes />
            case 'busca':
                return <Busca searchTerm={searchTerm} session={session} userProfile={userProfile} setActiveTab={setActiveTab} />
            case 'notificacoes':
                return <CentroNotificacoes session={session} userProfile={userProfile} setActiveTab={setActiveTab} />
            case 'relatorios':
                return <Relatorios session={session} userProfile={userProfile} />
            default:
                return <Dashboard session={session} userProfile={userProfile} setActiveTab={setActiveTab} />
        }
    }

    return (
        <div className="flex min-h-screen bg-background text-slate-800 font-sans selection:bg-primary/30 selection:text-primary overflow-x-hidden">
            {/* Sidebar - Desktop */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <Header
                    onOpenDrawer={() => setDrawerOpen(true)}
                    session={session}
                    setActiveTab={setActiveTab}
                    currentTheme={theme}
                    onThemeChange={setTheme}
                    onLogout={handleLogout}
                    onSearch={(term) => { setSearchTerm(term); setActiveTab('busca'); }}
                />

                <main className="flex-1 p-4 md:p-8 xl:p-12 max-w-[1600px] mx-auto w-full pb-32 md:pb-12 h-full">
                    {renderContent()}
                </main>

                {/* Mobile FAB (Only shown on Dashboard/Home) */}
                {activeTab === 'inicio' && (
                    <button
                        onClick={() => setActiveTab('mural')}
                        className="fixed md:hidden right-6 bottom-28 size-16 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/40 flex items-center justify-center active:scale-95 hover:scale-105 transition-all z-40 ring-4 ring-background"
                    >
                        <Plus size={32} />
                    </button>
                )}

            </div>

            {/* Mobile Drawer (Menu Overlay) */}
            <Drawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                userProfile={userProfile}
                onLogout={handleLogout}
            />

            {showTrailer && <Trailer onFinish={() => setShowTrailer(false)} />}
        </div>
    )
}

export default App

