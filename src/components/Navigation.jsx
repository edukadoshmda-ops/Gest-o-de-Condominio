import React, { useState } from 'react'
import {
  Home,
  Calendar,
  FileText,
  Package,
  User,
  Settings,
  X,
  MessageSquare,
  Wrench,
  CreditCard,
  ShieldAlert,
  LogOut,
  Box,
  Users,
  Bell,
  BarChart3,
  Zap,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

const SidebarItem = ({ icon: Icon, label, active, onClick, showLabel = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-900 hover:bg-slate-100'}`}
  >
    <Icon size={20} className={active ? 'scale-110' : ''} />
    <span className={`font-bold text-sm ${showLabel ? 'block' : 'hidden md:block'}`}>{label}</span>
  </button>
)

const rapidActions = [
  { id: 'financeiro', label: 'Financeiro', icon: CreditCard, hideFor: 'porteiro' },
  { id: 'reservas', label: 'Reservas', icon: Calendar, hideFor: 'porteiro' },
  { id: 'chamados', label: 'Chamados', icon: Wrench, hideFor: 'porteiro' },
  { id: 'patrimonio', label: 'Patrimônio', icon: Box, onlyFor: ['sindico', 'admin_master'] },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'documentos', label: 'Atas e Regulamentos', icon: FileText }
]

export const Sidebar = ({ activeTab, setActiveTab, userProfile }) => {
  const [rapidPanelOpen, setRapidPanelOpen] = useState(false)

  const filteredRapidActions = rapidActions.filter(a => {
    if (a.hideFor === userProfile?.tipo) return false
    if (a.onlyFor && !a.onlyFor.includes(userProfile?.tipo)) return false
    return true
  })

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-card-border bg-surface sticky top-0 h-screen z-50">
      {/* Logo - prioridade, sempre visível no topo */}
      <div className="shrink-0 flex flex-col items-center px-4 pt-4 pb-2 overflow-hidden">
        <div className="flex items-center justify-center w-full">
          <img src="/logo.png" alt="Gestor360 Logo" className="w-[126px] object-contain drop-shadow-lg drop-shadow-primary/20" />
        </div>
        <span className="text-xs font-black tracking-tight text-slate-900 leading-tight -mt-1">Gestão de Condomínio</span>
      </div>

      {/* Menu com barra de rolagem - acesso a todos os itens */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-2 custom-scrollbar">
        <div className="space-y-1">
          <SidebarItem icon={Home} label="Dashboard" active={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')} />

          {/* Painel de Ações Rápidas */}
          <div className="rounded-lg overflow-hidden border border-transparent hover:border-slate-200">
            <button
              onClick={() => setRapidPanelOpen(prev => !prev)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-slate-900 hover:bg-slate-100 ${rapidPanelOpen ? 'bg-slate-50' : ''}`}
            >
              <Zap size={20} className="text-primary shrink-0" />
              <span className="font-bold text-sm hidden md:block flex-1 text-left">Painel de Ações Rápidas</span>
              {rapidPanelOpen ? <ChevronDown size={18} className="shrink-0" /> : <ChevronRight size={18} className="shrink-0" />}
            </button>
            {rapidPanelOpen && (
              <div className="pl-4 pr-2 pb-2 space-y-0.5 border-t border-slate-100 mt-0.5 pt-1">
                {filteredRapidActions.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === id ? 'bg-primary text-white font-bold' : 'text-slate-600 hover:bg-slate-100 font-medium'}`}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {userProfile?.tipo !== 'porteiro' && (
            <SidebarItem icon={MessageSquare} label="Mural" active={activeTab === 'mural'} onClick={() => setActiveTab('mural')} />
          )}

          <SidebarItem icon={Users} label="Visitantes" active={activeTab === 'visitantes'} onClick={() => setActiveTab('visitantes')} />
          <SidebarItem icon={Package} label="Encomendas" active={activeTab === 'encomendas'} onClick={() => setActiveTab('encomendas')} />

          {userProfile?.tipo === 'admin_master' && (
            <SidebarItem icon={ShieldAlert} label="SuperAdmin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
          )}
          {(userProfile?.tipo === 'sindico' || userProfile?.tipo === 'admin_master') && (
            <>
              <SidebarItem icon={BarChart3} label="Relatórios" active={activeTab === 'relatorios'} onClick={() => setActiveTab('relatorios')} />
              <SidebarItem icon={Users} label="Gestão de Perfis" active={activeTab === 'usuarios'} onClick={() => setActiveTab('usuarios')} />
            </>
          )}

          <SidebarItem icon={Settings} label="Configurações" active={activeTab === 'config'} onClick={() => setActiveTab('config')} />
          <SidebarItem icon={User} label="Meu Perfil" active={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')} />
        </div>
      </nav>
    </aside>
  )
}

export const Drawer = ({ isOpen, onClose, activeTab, setActiveTab, userProfile, onLogout }) => {
  const [rapidPanelOpen, setRapidPanelOpen] = useState(false)
  const filteredRapidActions = rapidActions.filter(a => {
    if (a.hideFor === userProfile?.tipo) return false
    if (a.onlyFor && !a.onlyFor.includes(userProfile?.tipo)) return false
    return true
  })

  if (!isOpen) return null

  const go = (tab) => { setActiveTab(tab); onClose(); }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] md:hidden" onClick={onClose}>
      <div className="w-80 h-full bg-surface border-r border-card-border p-8 flex flex-col gap-2 animate-in slide-in-from-left duration-300 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-10 w-full pl-2">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Gestor360 Logo" className="w-[105px] object-contain drop-shadow-lg drop-shadow-primary/20 shrink-0" />
            <div className="flex flex-col ml-1 border-l-2 border-primary/20 pl-3">
              <span className="text-xs font-black text-slate-900 leading-tight">Gestão de Condomínio</span>
            </div>
          </div>
          <button onClick={onClose} className="size-10 flex shrink-0 items-center justify-center hover:bg-white/5 rounded-full transition-colors text-slate-600">
            <X size={24} />
          </button>
        </div>

        <SidebarItem icon={Home} label="Início" active={activeTab === 'inicio'} onClick={() => go('inicio')} showLabel />

        {/* Painel de Ações Rápidas (mobile) */}
        <div className="rounded-lg overflow-hidden border border-slate-200">
          <button
            onClick={() => setRapidPanelOpen(prev => !prev)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-900 hover:bg-slate-100 ${rapidPanelOpen ? 'bg-slate-50' : ''}`}
          >
            <Zap size={20} className="text-primary shrink-0" />
            <span className="font-bold text-sm">Painel de Ações Rápidas</span>
            {rapidPanelOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          {rapidPanelOpen && (
            <div className="pl-4 pr-2 pb-2 space-y-0.5 border-t border-slate-100 pt-1">
              {filteredRapidActions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => go(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === id ? 'bg-primary text-white font-bold' : 'text-slate-600 hover:bg-slate-100 font-medium'}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {userProfile?.tipo !== 'porteiro' && (
          <SidebarItem icon={MessageSquare} label="Mural" active={activeTab === 'mural'} onClick={() => go('mural')} showLabel />
        )}

        <SidebarItem icon={Users} label="Visitantes" active={activeTab === 'visitantes'} onClick={() => go('visitantes')} showLabel />
        <SidebarItem icon={Package} label="Encomendas" active={activeTab === 'encomendas'} onClick={() => { setActiveTab('encomendas'); onClose(); }} showLabel />

        {userProfile?.tipo === 'admin_master' && (
          <SidebarItem icon={ShieldAlert} label="SuperAdmin" active={activeTab === 'admin'} onClick={() => { setActiveTab('admin'); onClose(); }} showLabel />
        )}
        {(userProfile?.tipo === 'sindico' || userProfile?.tipo === 'admin_master') && (
          <>
            <SidebarItem icon={BarChart3} label="Relatórios" active={activeTab === 'relatorios'} onClick={() => { setActiveTab('relatorios'); onClose(); }} showLabel />
            <SidebarItem icon={Users} label="Gestão de Perfis" active={activeTab === 'usuarios'} onClick={() => { setActiveTab('usuarios'); onClose(); }} showLabel />
          </>
        )}

        <div className="mt-auto border-t border-card-border pt-6 space-y-1">
          <SidebarItem icon={Settings} label="Configurações" active={activeTab === 'config'} onClick={() => { setActiveTab('config'); onClose(); }} showLabel />
          <SidebarItem icon={User} label="Perfil do Morador" active={activeTab === 'perfil'} onClick={() => { setActiveTab('perfil'); onClose(); }} showLabel />
          <button
            onClick={() => { onLogout?.(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-red-500 hover:bg-red-500/10 font-bold text-sm"
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </div>
    </div>
  )
}
