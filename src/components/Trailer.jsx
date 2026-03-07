import React, { useState, useEffect } from 'react'
import {
    Play,
    MessageSquare,
    TrendingUp,
    Smartphone,
    MousePointer2,
    CheckCircle2,
    X,
    LayoutDashboard,
    Zap
} from 'lucide-react'

const scenes = [
    {
        id: 'intro',
        tag: 'PLATAFORMA 2026',
        title: 'Gestor360',
        subtitle: 'A inteligência que o seu condomínio merece, com a simplicidade que você deseja.',
        bg: 'bg-[#020617]',
        gradient: 'from-sky-500/20 via-transparent to-indigo-500/20',
        icon: Zap,
        color: 'text-sky-400'
    },
    {
        id: 'landing',
        tag: 'PRESENÇA DIGITAL',
        title: 'Vitrine de Alto Nível',
        subtitle: 'Sua marca com planos transparentes e suporte prioritário 24/7.',
        bg: 'bg-[#020617]',
        gradient: 'from-indigo-600/20 via-transparent to-transparent',
        icon: TrendingUp,
        color: 'text-indigo-400'
    },
    {
        id: 'dashboard',
        tag: 'CONTROLE TOTAL',
        title: 'Ações Rápidas',
        subtitle: 'Resolva tudo em segundos: encomendas, visitas e recados no mural.',
        bg: 'bg-slate-950',
        gradient: 'from-blue-500/20 via-transparent to-orange-500/10',
        icon: LayoutDashboard,
        color: 'text-blue-400'
    },
    {
        id: 'mural',
        tag: 'COMUNIDADE',
        title: 'Conexão Real',
        subtitle: 'Chat privado, canais oficiais e mural social para uma vizinhança unida.',
        bg: 'bg-[#0f172a]',
        gradient: 'from-blue-600/20 via-slate-900 to-transparent',
        icon: MessageSquare,
        color: 'text-sky-300'
    },
    {
        id: 'final',
        tag: 'VAMOS COMEÇAR?',
        title: 'Pronto para o Futuro?',
        subtitle: 'O valor da assinatura pode ser dividido por cada morador. Teste grátis hoje.',
        bg: 'bg-[#020617]',
        gradient: 'from-sky-900/40 via-transparent to-indigo-900/40',
        icon: CheckCircle2,
        color: 'text-sky-400'
    }
]

export const Trailer = ({ onFinish }) => {
    const [currentScene, setCurrentScene] = useState(0)
    const [progress, setProgress] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)

    const sceneDuration = 9000

    useEffect(() => {
        let interval
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        if (currentScene < scenes.length - 1) {
                            setCurrentScene(s => s + 1)
                            return 0
                        } else {
                            setIsPlaying(false)
                            return 100
                        }
                    }
                    return prev + (100 / (sceneDuration / 100))
                })
            }, 100)
        }
        return () => clearInterval(interval)
    }, [isPlaying, currentScene])

    const scene = scenes[currentScene]
    const Icon = scene.icon

    return (
        <div className={`fixed inset-0 z-[1000] ${scene.bg} text-white transition-all duration-1000 flex flex-col font-sans overflow-hidden select-none`}>
            {/* Dynamic Background Layer */}
            <div className={`absolute inset-0 bg-gradient-to-br ${scene.gradient} transition-all duration-1000 opacity-60`}></div>

            {/* Header / Progress Bar */}
            <div className="relative z-10 p-6 md:p-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="size-14 bg-sky-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-sky-500/40 border border-white/20">
                            <img src="/logo.png" alt="Logo" className="h-10 w-auto brightness-0 invert" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="font-black text-base tracking-[0.2em] uppercase leading-none mb-1">Gestor360</span>
                            <span className="text-[9px] font-bold tracking-[0.4em] text-sky-400 uppercase opacity-60">Presentation</span>
                        </div>
                    </div>
                    <button onClick={onFinish} className="size-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors border border-white/10">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex gap-1.5 w-full max-w-7xl mx-auto">
                    {scenes.map((_, i) => (
                        <div key={i} className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-sky-400 transition-all duration-100 ease-out`}
                                style={{
                                    width: i < currentScene ? '100%' : i === currentScene ? `${progress}%` : '0%'
                                }}
                            ></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center relative z-10 min-h-0">
                <div key={currentScene} className="flex flex-col items-center max-w-5xl w-full animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-1000">

                    {/* Scene Tag */}
                    <span className={`text-[10px] font-black tracking-[0.4em] mb-4 py-1.5 px-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-md ${scene.color} uppercase`}>
                        {scene.tag}
                    </span>

                    {/* Content Box with Glassmorphism */}
                    <div className="relative group w-full flex flex-col items-center">
                        <div className="flex items-center justify-center gap-6 md:gap-12 mb-4 w-full">
                            <div className="hidden md:block flex-1 text-right">
                                <p className={`text-[9px] font-black tracking-[0.3em] uppercase opacity-30 ${scene.color}`}>Gestão Inteligente</p>
                            </div>

                            <div className={`size-20 md:size-28 rounded-[28px] bg-sky-500/10 border border-sky-400/20 flex items-center justify-center shadow-2xl shadow-sky-400/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-700 shrink-0`}>
                                <Icon className={`${scene.color}`} size={40} />
                            </div>

                            <div className="hidden md:block flex-1 text-left">
                                <p className={`text-[9px] font-black tracking-[0.3em] uppercase opacity-30 ${scene.color}`}>Controle Absoluto</p>
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tighter leading-tight text-white uppercase">
                            {scene.title}
                        </h1>
                        <p className="text-sm md:text-lg text-slate-300 font-medium max-w-xl mx-auto leading-relaxed opacity-70">
                            {scene.subtitle}
                        </p>
                    </div>

                    {/* Simplified Device Mockup Overlay */}
                    <div className="mt-4 flex items-center gap-4 opacity-10">
                        <Smartphone size={16} />
                        <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-white to-transparent"></div>
                        <LayoutDashboard size={16} />
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="relative z-10 p-5 md:p-6 mt-auto bg-black/40 backdrop-blur-2xl border-t border-white/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                            className="size-12 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 transition-all shadow-xl shadow-white/10"
                        >
                            {isPlaying ? <div className="size-3 bg-slate-950 rounded-sm"></div> : <Play size={22} className="fill-slate-950 ml-1" />}
                        </button>
                        <div className="text-left hidden sm:block">
                            <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-0.5">Automático</p>
                            <p className="text-xs font-bold text-white/80">{isPlaying ? 'Reproduzindo' : 'Pausado'}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <div className="hidden lg:flex items-center gap-4 py-3 px-6 rounded-2xl bg-white/5 border border-white/5">
                            <div className="text-right">
                                <p className="text-[9px] font-black tracking-widest text-white/20 uppercase mb-0.5">Próxima Etapa</p>
                                <p className="text-xs font-bold text-white/60">
                                    {currentScene < scenes.length - 1 ? scenes[currentScene + 1].title : 'Início da Gestão'}
                                </p>
                            </div>
                        </div>

                        {currentScene === scenes.length - 1 ? (
                            <button
                                onClick={onFinish}
                                className="bg-sky-500 hover:bg-sky-400 px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-sky-500/30 text-white"
                            >
                                Experimentar Agora
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    if (currentScene < scenes.length - 1) {
                                        setCurrentScene(s => s + 1);
                                        setProgress(0);
                                    }
                                }}
                                className="size-16 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Animated Cursor Decoration */}
            <div className="absolute pointer-events-none opacity-10 hidden md:block" style={{ top: '65%', left: '75%' }}>
                <MousePointer2 size={40} className="text-white fill-white animate-pulse" />
            </div>
        </div>
    )
}

const ChevronRight = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
)
