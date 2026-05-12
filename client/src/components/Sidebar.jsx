import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Send, 
  MessageSquare, 
  Zap, 
  Settings, 
  BarChart3 
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick, badge }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all duration-200 rounded-lg mx-2 ${
      active 
        ? 'bg-emerald-600 text-white shadow-md' 
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      <span className={`text-sm font-semibold tracking-tight ${active ? 'opacity-100' : 'opacity-90'}`}>{label}</span>
    </div>
    {badge && (
      <span className={`${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'} text-[10px] font-medium px-2 py-0.5 rounded-md`}>
        {badge}
      </span>
    )}
  </div>
);

const Sidebar = ({ activeTab, setActiveTab, contactsCount }) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 relative z-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <MessageSquare size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">WhaWeb</h1>
            <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-[0.2em] leading-none">PRO DASHBOARD</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto custom-scrollbar">
        <div className="px-6 mt-4 mb-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Menu</div>
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
        <SidebarItem icon={Users} label="Contacts" badge={contactsCount > 0 ? contactsCount.toString() : null} active={activeTab === 'Contacts'} onClick={() => setActiveTab('Contacts')} />
        <SidebarItem icon={Send} label="Campagnes" active={activeTab === 'Campaigns'} onClick={() => setActiveTab('Campaigns')} />
        <SidebarItem icon={MessageSquare} label="Messages" active={activeTab === 'Conversations'} onClick={() => setActiveTab('Conversations')} />

        <div className="px-6 mt-8 mb-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Automatisation</div>
        <SidebarItem icon={Zap} label="Workflows" active={activeTab === 'Flows'} onClick={() => setActiveTab('Flows')} />
        <SidebarItem icon={Settings} label="IA Config" active={activeTab === 'AI Config'} onClick={() => setActiveTab('AI Config')} />

        <div className="px-6 mt-8 mb-3 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Système</div>
        <SidebarItem icon={BarChart3} label="Analyses" active={activeTab === 'Analytics'} onClick={() => setActiveTab('Analytics')} />
        <SidebarItem icon={Settings} label="Paramètres" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
      </nav>

      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60 group cursor-pointer hover:bg-slate-100 transition-all duration-200">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium shrink-0 text-xs">AK</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">Amine K.</p>
            <p className="text-[10px] text-slate-500 font-medium">Plan Illimité</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
