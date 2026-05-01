import React from 'react';
import { 
  Home, Presentation, LayoutGrid, Users, 
  CreditCard, Share2, Trash2, LogOut, BarChart2, Lock, Shield, Gift, KeyRound, User
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }) => {
  const userPlan = user?.plan || 'basic';

  const menuItems = [
    { id: 'home', label: 'Почетна', icon: <Home size={20} /> },
    { id: 'presentations', label: 'Мои презентации', icon: <Presentation size={20} /> },
    { id: 'analytics', label: 'Аналитика', icon: <BarChart2 size={20} />, locked: userPlan === 'basic' },
    { id: 'templates', label: 'Сите шаблони', icon: <LayoutGrid size={20} /> },
    { id: 'team', label: 'Креирај тим', icon: <Users size={20} />, locked: userPlan === 'basic' },
    { id: 'plan', label: 'Мој план', icon: <CreditCard size={20} /> },
    { id: 'profile', label: 'Профил', icon: <User size={20} /> },
    { id: 'referrals', label: 'Препорачај', icon: <Gift size={20} /> },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Админ панел', icon: <Shield size={20} /> }] : []),
    { id: 'integrations', label: 'Интеграции', icon: <Share2 size={20} /> },
    { id: 'api', label: 'API клучеви', icon: <KeyRound size={20} /> },
    { id: 'trash', label: 'Корпа', icon: <Trash2 size={20} /> },
  ];

  return (
    <div className="w-80 bg-white border-r border-slate-100 flex flex-col h-full sticky top-0">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <Presentation size={20} />
        </div>
        <span className="text-2xl font-black tracking-tight text-slate-900">MKD Slidea</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 pt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all relative ${
              activeTab === item.id 
                ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item.icon}
            {item.label}
            {item.locked && (
              <Lock size={14} className="ml-auto text-slate-300" />
            )}
            {activeTab === item.id && !item.locked && (
              <div className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        {userPlan === 'basic' && (
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 mb-4 overflow-hidden relative group cursor-pointer">
            <div className="relative z-10">
              <h4 className="font-black mb-1">Upgrade to PRO</h4>
              <p className="text-[10px] font-bold text-indigo-100 mb-4 opacity-80 uppercase tracking-widest">Неограничени учесници</p>
              <button onClick={() => setActiveTab('plan')} className="w-full py-2.5 bg-white text-indigo-600 rounded-xl font-black text-xs hover:bg-indigo-50 transition-colors">
                Види планови →
              </button>
            </div>
            <CreditCard className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
          </div>
        )}
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-red-400 hover:bg-red-50 transition-all mb-4"
        >
          <LogOut size={20} />
          Одјави се
        </button>

        <div className="px-6 py-4 border-t border-slate-50 text-[10px] font-black text-slate-300 uppercase tracking-widest text-center leading-relaxed">
          © 2026 MKD Slidea <br />
          Автор: Игор Богданоски
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
