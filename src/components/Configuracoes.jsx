import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import {
    Bell,
    Shield,
    Smartphone,
    Volume2,
    Eye,
    ChevronRight,
    ToggleLeft as Toggle,
    X,
    Lock,
    Loader2
} from 'lucide-react'

const ConfigSection = ({ title, children }) => (
    <div className="bg-surface rounded-3xl border border-card-border p-6 md:p-8 space-y-6">
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-1">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
)

const ConfigItem = ({ icon: Icon, label, description, rightElement, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center justify-between p-4 rounded-2xl bg-background border border-card-border hover:border-primary/30 transition-all ${onClick ? 'cursor-pointer group' : ''}`}
    >
        <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-slate-200 border border-card-border flex items-center justify-center text-slate-600 group-hover:text-primary transition-colors">
                <Icon size={20} />
            </div>
            <div>
                <p className="text-slate-900 text-sm font-bold">{label}</p>
                {description && <p className="text-slate-500 text-[10px] font-medium">{description}</p>}
            </div>
        </div>
        <div>
            {rightElement || <ChevronRight size={18} className="text-slate-600 group-hover:translate-x-1 transition-transform" />}
        </div>
    </div>
)

const ToggleSwitch = ({ active, onToggle }) => (
    <div
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${active ? 'bg-primary shadow-[0_0_15px_rgba(236,91,19,0.3)]' : 'bg-slate-200 border border-card-border'}`}
    >
        <div className={`absolute top-1 size-4 rounded-full bg-white transition-all ${active ? 'left-7' : 'left-1'}`}></div>
    </div>
)

const STORAGE_KEY = 'app-config'

const loadConfig = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) return JSON.parse(saved)
    } catch (_) {}
    return {
        notificacoes: { avisos: true, encomendas: true, mural: false, som: true }
    }
}

const saveConfig = (config) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch (_) {}
}

export const Configuracoes = () => {
    const [config, setConfig] = useState(loadConfig)
    const notificacoes = config.notificacoes

    useEffect(() => {
        saveConfig(config)
    }, [config])
    const { toast } = useToast()
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)
    const [passwords, setPasswords] = useState({ new: '', confirm: '' })

    const toggleNotif = (key) => {
        setConfig(prev => ({
            ...prev,
            notificacoes: { ...prev.notificacoes, [key]: !prev.notificacoes[key] }
        }))
    }

    const handleUpdatePassword = async (e) => {
        e.preventDefault()
        if (passwords.new !== passwords.confirm) {
            toast('As senhas não coincidem.', 'error')
            return
        }
        if (passwords.new.length < 6) {
            toast('A senha deve ter no mínimo 6 caracteres.', 'error')
            return
        }
        setSavingPassword(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: passwords.new })
            if (error) throw error
            toast('Senha alterada com sucesso!', 'success')
            setShowPasswordModal(false)
            setPasswords({ new: '', confirm: '' })
        } catch (error) {
            console.error('Erro ao alterar senha:', error)
            toast('Falha ao alterar senha: ' + (error.message || 'Tente novamente.'), 'error')
        } finally {
            setSavingPassword(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="px-1 text-center md:text-left">
                <h2 className="text-slate-900 text-2xl font-black tracking-tight mb-2">Configurações</h2>
                <p className="text-slate-500 text-sm font-medium">Personalize sua experiência no Gestão de Condominios.</p>
            </header>

            <div className="flex flex-col gap-6 pb-20 md:pb-0 max-w-2xl">
                <ConfigSection title="Centro de Notificações">
                        <ConfigItem
                            icon={Bell}
                            label="Avisos do Síndico"
                            description="Alertas de comunicados oficiais"
                            rightElement={<ToggleSwitch active={notificacoes.avisos} onToggle={() => toggleNotif('avisos')} />}
                        />
                        <ConfigItem
                            icon={Smartphone}
                            label="Encomendas"
                            description="Notificar quando chegar entrega"
                            rightElement={<ToggleSwitch active={notificacoes.encomendas} onToggle={() => toggleNotif('encomendas')} />}
                        />
                        <ConfigItem
                            icon={Eye}
                            label="Novidades no Mural"
                            description="Ver posts novos da comunidade"
                            rightElement={<ToggleSwitch active={notificacoes.mural} onToggle={() => toggleNotif('mural')} />}
                        />
                        <ConfigItem
                            icon={Volume2}
                            label="Sons do Aplicativo"
                            description="Ativar alertas sonoros"
                            rightElement={<ToggleSwitch active={notificacoes.som} onToggle={() => toggleNotif('som')} />}
                        />
                </ConfigSection>

                <ConfigSection title="Sobre o Gestão de Condominios">
                        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20 flex flex-col items-center text-center space-y-3">
                            <p className="text-slate-900 font-black text-sm uppercase tracking-widest">Gestão de Condominios v1.0.4</p>
                            <p className="text-slate-500 text-[10px] font-bold leading-relaxed px-4">
                                Desenvolvido para tornar a gestão condominial mais simples e elegante.
                                Todos os direitos reservados 2024.
                            </p>
                            <button
                                onClick={() => toast('Você está na versão mais recente (v1.0.4).', 'success')}
                                className="text-primary text-[10px] font-black uppercase tracking-widest pt-2 hover:underline"
                            >
                                Verificar Atualizações
                            </button>
                        </div>
                </ConfigSection>

                <ConfigSection title="Acesso e Segurança">
                    <ConfigItem
                        icon={Shield}
                        label="Alterar Senha"
                        description="Mantenha sua conta protegida"
                        onClick={() => setShowPasswordModal(true)}
                    />
                </ConfigSection>
            </div>

            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-md rounded-[40px] border border-card-border p-8 md:p-10 animate-in zoom-in-95 duration-300 relative shadow-2xl">
                        <button onClick={() => setShowPasswordModal(false)} className="size-10 absolute right-6 top-6 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-white transition-all">
                            <X size={20} />
                        </button>
                        <div className="text-center mb-8">
                            <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary">
                                <Lock size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Alterar Senha</h2>
                            <p className="text-slate-600 text-sm font-medium">Escolha uma senha forte para sua segurança.</p>
                        </div>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nova Senha</label>
                                <input
                                    type="password"
                                    required
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                    placeholder="No mínimo 6 caracteres"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Confirmar Senha</label>
                                <input
                                    type="password"
                                    required
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-700"
                                    placeholder="Repita a nova senha"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={savingPassword}
                                className="w-full mt-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {savingPassword ? <Loader2 className="animate-spin" size={16} /> : 'ATUALIZAR SENHA'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
