import React from 'react'
import {
  Home,
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
  BarChart3
} from 'lucide-react'

const SidebarItem = ({ icon: Icon, label, active, onClick, showLabel = false, compact = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center rounded-lg transition-all duration-300 ${compact ? 'gap-2 px-3 py-2.5' : 'gap-3 px-4 py-3'} ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-800 hover:bg-slate-100 hover:text-slate-900'}`}
  >
    <Icon size={compact ? 18 : 20} className={`shrink-0 ${active && !compact ? 'scale-110' : ''}`} />
    <span className={`font-bold text-sm truncate ${showLabel ? 'block' : 'hidden md:block'}`}>{label}</span>
  </button>
)

export const Sidebar = ({ activeTab, setActiveTab, userProfile, onLogout }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-card-border bg-surface sticky top-0 h-screen z-50">
      {/* Logo - prioridade, sempre visível no topo */}
      <div className="shrink-0 flex flex-col items-center px-4 pt-4 pb-2 overflow-hidden">
        <div className="flex items-center justify-center w-full">
          <img src="/logo.png" alt="Gestor360 Logo" className="app-logo w-[126px] object-contain drop-shadow-lg drop-shadow-primary/20" />
        </div>
        <span className="text-xs font-black tracking-tight text-slate-800 leading-tight -mt-1">Gestão de Condomínio</span>
      </div>

      {/* Menu com grupos mais distribuídos para melhorar a leitura */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 custom-scrollbar">
        <div className="flex flex-col gap-5">
          <div className="space-y-4">
            <SidebarItem icon={Home} label="Dashboard" active={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')} />
            <SidebarItem icon={Users} label="Visitantes" active={activeTab === 'visitantes'} onClick={() => setActiveTab('visitantes')} />
            <SidebarItem icon={Package} label="Encomendas" active={activeTab === 'encomendas'} onClick={() => setActiveTab('encomendas')} />

            {(userProfile?.tipo === 'sindico' || userProfile?.tipo === 'admin_master' || userProfile?.tipo === 'superadmin') && (
              <SidebarItem icon={Users} label="Gestão de Perfis" active={activeTab === 'usuarios'} onClick={() => setActiveTab('usuarios')} />
            )}
          </div>

          <div className="space-y-4">
            <SidebarItem icon={Settings} label="Configurações" active={activeTab === 'config'} onClick={() => setActiveTab('config')} />
            <SidebarItem icon={User} label="Meu Perfil" active={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')} />
            {(userProfile?.tipo === 'admin_master' || userProfile?.tipo === 'superadmin') && (
              <SidebarItem icon={ShieldAlert} label="SuperAdmin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
            )}
          </div>
        </div>
      </nav>

      {/* Sair - fixo no final */}
      <div className="shrink-0 p-4 pt-2 border-t border-card-border">
        <button
          onClick={() => onLogout?.()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-red-500 hover:bg-red-500/10 font-bold text-sm"
        >
          <LogOut size={20} /> Sair
        </button>
      </div>
    </aside>
  )
}

export const Drawer = ({ isOpen, onClose, activeTab, setActiveTab, userProfile, onLogout }) => {
  if (!isOpen) return null

  const go = (tab) => { setActiveTab(tab); onClose(); }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] md:hidden" onClick={onClose}>
      <div
        className="w-[min(280px,85vw)] h-full bg-surface border-r border-card-border flex flex-col animate-in slide-in-from-left duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Fixo - padding menor no celular */}
        <div className="px-4 py-4 pb-3 shrink-0 flex items-center justify-between w-full">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.png" alt="Gestor360 Logo" className="app-logo w-[90px] object-contain drop-shadow-lg drop-shadow-primary/20 shrink-0" />
            <div className="flex flex-col border-l-2 border-primary/20 pl-2 min-w-0">
              <span className="text-xs font-black text-slate-900 leading-tight truncate">Gestão de Condomínio</span>
            </div>
          </div>
          <button onClick={onClose} className="size-9 flex shrink-0 items-center justify-center hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <X size={22} />
          </button>
        </div>

        {/* Conteúdo Rolável - padding menor no celular */}
        <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-1 custom-scrollbar min-h-0">
          <SidebarItem icon={Home} label="Início" active={activeTab === 'inicio'} onClick={() => go('inicio')} showLabel compact />
          <SidebarItem icon={Users} label="Visitantes" active={activeTab === 'visitantes'} onClick={() => go('visitantes')} showLabel compact />
          <SidebarItem icon={Package} label="Encomendas" active={activeTab === 'encomendas'} onClick={() => go('encomendas')} showLabel compact />

          {(userProfile?.tipo === 'sindico' || userProfile?.tipo === 'admin_master' || userProfile?.tipo === 'superadmin') && (
            <SidebarItem icon={Users} label="Gestão de Perfis" active={activeTab === 'usuarios'} onClick={() => go('usuarios')} showLabel compact />
          )}
        </nav>

        {/* Footer Fixo - padding menor no celular */}
        <div className="px-4 py-3 pt-3 border-t border-card-border space-y-1 shrink-0">
          <SidebarItem icon={Settings} label="Configurações" active={activeTab === 'config'} onClick={() => go('config')} showLabel compact />
          <SidebarItem icon={User} label="Perfil do Morador" active={activeTab === 'perfil'} onClick={() => go('perfil')} showLabel compact />
          {(userProfile?.tipo === 'admin_master' || userProfile?.tipo === 'superadmin') && (
            <SidebarItem icon={ShieldAlert} label="SuperAdmin" active={activeTab === 'admin'} onClick={() => go('admin')} showLabel compact />
          )}
          <button
            onClick={() => { onLogout?.(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-300 text-red-500 hover:bg-red-500/10 font-bold text-sm"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </div>
    </div>
  )
}
