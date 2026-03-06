import React from 'react'
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

export const Sidebar = ({ activeTab, setActiveTab, userProfile }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-card-border bg-surface p-4 gap-1 sticky top-0 h-screen z-50">
      <div className="flex flex-col items-center px-2 mb-2 overflow-hidden w-full">
        <div className="flex items-center justify-center shrink-0 w-full">
          <img src="/logo.png" alt="Gestor360 Logo" className="w-[120px] object-contain drop-shadow-lg drop-shadow-primary/20" />
        </div>
        <div className="flex flex-col min-w-0 text-center w-full -mt-6">
          <span className="text-xs font-black tracking-tight text-slate-900 leading-tight">Gestão de Condomínio</span>
        </div>
      </div>

      <div className="space-y-1">
        <SidebarItem icon={Home} label="Dashboard" active={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')} />

        {userProfile?.tipo !== 'porteiro' && (
          <>
            <SidebarItem icon={MessageSquare} label="Mural" active={activeTab === 'mural'} onClick={() => setActiveTab('mural')} />
            <SidebarItem icon={CreditCard} label="Financeiro" active={activeTab === 'financeiro'} onClick={() => setActiveTab('financeiro')} />
            <SidebarItem icon={Calendar} label="Reservas" active={activeTab === 'reservas'} onClick={() => setActiveTab('reservas')} />
            <SidebarItem icon={Wrench} label="Chamados" active={activeTab === 'chamados'} onClick={() => setActiveTab('chamados')} />
          </>
        )}

        {(userProfile?.tipo === 'sindico' || userProfile?.tipo === 'admin_master') && (
          <SidebarItem icon={Box} label="Patrimônio" active={activeTab === 'patrimonio'} onClick={() => setActiveTab('patrimonio')} />
        )}

        <SidebarItem icon={Bell} label="Notificações" active={activeTab === 'notificacoes'} onClick={() => setActiveTab('notificacoes')} />
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
      </div>

      <div className="mt-auto space-y-1">
        <SidebarItem icon={Settings} label="Configurações" active={activeTab === 'config'} onClick={() => setActiveTab('config')} />
        <SidebarItem icon={User} label="Meu Perfil" active={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')} />
      </div>
    </aside>
  )
}

export const Drawer = ({ isOpen, onClose, activeTab, setActiveTab, userProfile, onLogout }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] md:hidden" onClick={onClose}>
      <div className="w-80 h-full bg-surface border-r border-card-border p-8 flex flex-col gap-2 animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-10 w-full pl-2">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Gestor360 Logo" className="w-[100px] object-contain drop-shadow-lg drop-shadow-primary/20 shrink-0" />
            <div className="flex flex-col ml-1 border-l-2 border-primary/20 pl-3">
              <span className="text-xs font-black text-slate-900 leading-tight">Gestão de Condomínio</span>
            </div>
          </div>
          <button onClick={onClose} className="size-10 flex shrink-0 items-center justify-center hover:bg-white/5 rounded-full transition-colors text-slate-600">
            <X size={24} />
          </button>
        </div>

        <SidebarItem icon={Home} label="Início" active={activeTab === 'inicio'} onClick={() => { setActiveTab('inicio'); onClose(); }} showLabel />

        {userProfile?.tipo !== 'porteiro' && (
          <>
            <SidebarItem icon={MessageSquare} label="Mural" active={activeTab === 'mural'} onClick={() => { setActiveTab('mural'); onClose(); }} showLabel />
            <SidebarItem icon={CreditCard} label="Financeiro" active={activeTab === 'financeiro'} onClick={() => { setActiveTab('financeiro'); onClose(); }} showLabel />
            <SidebarItem icon={Calendar} label="Reservas" active={activeTab === 'reservas'} onClick={() => { setActiveTab('reservas'); onClose(); }} showLabel />
            <SidebarItem icon={Wrench} label="Chamados" active={activeTab === 'chamados'} onClick={() => { setActiveTab('chamados'); onClose(); }} showLabel />
          </>
        )}

        {(userProfile?.tipo === 'sindico' || userProfile?.tipo === 'admin_master') && (
          <SidebarItem icon={Box} label="Patrimônio" active={activeTab === 'patrimonio'} onClick={() => { setActiveTab('patrimonio'); onClose(); }} showLabel />
        )}

        <SidebarItem icon={Bell} label="Notificações" active={activeTab === 'notificacoes'} onClick={() => { setActiveTab('notificacoes'); onClose(); }} showLabel />
        <SidebarItem icon={User} label="Visitantes" active={activeTab === 'visitantes'} onClick={() => { setActiveTab('visitantes'); onClose(); }} showLabel />
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
