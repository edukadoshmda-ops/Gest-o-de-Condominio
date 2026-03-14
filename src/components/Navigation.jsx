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
  Bell,
  BarChart3
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

export const Sidebar = ({ activeTab, setActiveTab, userProfile, onLogout }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-card-border bg-surface sticky top-0 h-screen z-50">
      {/* Logo - prioridade, sempre visível no topo */}
      <div className="shrink-0 flex flex-col items-center px-4 pt-4 pb-2 overflow-hidden">
        <div className="flex items-center justify-center w-full">
          <img src="/logo.png" alt="Gestor360 Logo" className="app-logo w-[126px] object-contain drop-shadow-lg drop-shadow-primary/20" />
        </div>
        <span className="text-xs font-black tracking-tight text-slate-900 leading-tight -mt-1">Gestão de Condomínio</span>
      </div>

      {/* Menu com grupos mais distribuídos para melhorar a leitura */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 custom-scrollbar">
        <div className="flex flex-col gap-10">
          <div className="space-y-4">
            <SidebarItem icon={Home} label="Dashboard" active={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')} />

            {userProfile?.tipo === 'admin_master' && (
              <SidebarItem icon={ShieldAlert} label="SuperAdmin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
            )}
            {(userProfile?.tipo === 'sindico' || userProfile?.tipo === 'admin_master') && (
              <SidebarItem icon={Users} label="Gestão de Perfis" active={activeTab === 'usuarios'} onClick={() => setActiveTab('usuarios')} />
            )}
          </div>

          <div className="space-y-4 pt-2">
            <SidebarItem icon={Settings} label="Configurações" active={activeTab === 'config'} onClick={() => setActiveTab('config')} />
            <SidebarItem icon={User} label="Meu Perfil" active={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')} />
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
        className="w-80 h-full bg-surface border-r border-card-border flex flex-col animate-in slide-in-from-left duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Fixo */}
        <div className="p-8 pb-4 shrink-0 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Gestor360 Logo" className="app-logo w-[105px] object-contain drop-shadow-lg drop-shadow-primary/20 shrink-0" />
            <div className="flex flex-col ml-1 border-l-2 border-primary/20 pl-3">
              <span className="text-xs font-black text-slate-900 leading-tight">Gestão de Condomínio</span>
            </div>
          </div>
          <button onClick={onClose} className="size-10 flex shrink-0 items-center justify-center hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo Rolável */}
        <nav className="flex-1 overflow-y-auto px-8 py-4 space-y-2 custom-scrollbar min-h-0">
          <SidebarItem icon={Home} label="Início" active={activeTab === 'inicio'} onClick={() => go('inicio')} showLabel />

          {userProfile?.tipo === 'admin_master' && (
            <SidebarItem icon={ShieldAlert} label="SuperAdmin" active={activeTab === 'admin'} onClick={() => go('admin')} showLabel />
          )}
          {(userProfile?.tipo === 'sindico' || userProfile?.tipo === 'admin_master') && (
            <SidebarItem icon={Users} label="Gestão de Perfis" active={activeTab === 'usuarios'} onClick={() => go('usuarios')} showLabel />
          )}
        </nav>

        {/* Footer Fixo */}
        <div className="p-8 pt-4 border-t border-card-border space-y-1 shrink-0">
          <SidebarItem icon={Settings} label="Configurações" active={activeTab === 'config'} onClick={() => go('config')} showLabel />
          <SidebarItem icon={User} label="Perfil do Morador" active={activeTab === 'perfil'} onClick={() => go('perfil')} showLabel />
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
