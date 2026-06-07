import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, BarChart2, Plus, Presentation, User } from 'lucide-react';
import Sidebar from '../components/Dashboard/Sidebar';
import HomeTab from '../components/Dashboard/HomeTab';
import AnalyticsTab from '../components/Dashboard/AnalyticsTab';
import EventResultsModal from '../components/Dashboard/EventResultsModal';
import AdminTab from '../components/Dashboard/AdminTab';
import OrdersTab from '../components/Dashboard/OrdersTab';
import ReferralsTab from '../components/Dashboard/ReferralsTab';
import ApiKeysTab from '../components/Dashboard/ApiKeysTab';
import ProfileTab from '../components/Dashboard/ProfileTab';
import SemanticSearchTab from '../components/Dashboard/SemanticSearchTab';
import OrganizationsTab from '../components/Dashboard/OrganizationsTab';
import PresentationsTab from '../components/Dashboard/PresentationsTab';
import TemplatesTab from '../components/Dashboard/TemplatesTab';
import PlanTab from '../components/Dashboard/PlanTab';
import IntegrationsTab from '../components/Dashboard/IntegrationsTab';
import { templates } from '../data/templates';
import { useDashboardData } from '../hooks/useDashboardData';

const Dashboard = ({ setView, user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { allEvents, eventsLoading, communityTemplates, templatesLoading, useTemplate } =
    useDashboardData({ user, activeTab, setView });

  // Redirect new users (zero events, flag not set) to onboarding wizard.
  useEffect(() => {
    if (!user?.id || localStorage.getItem('onboarding_v1_done')) return;
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => { if (count === 0) navigate('/onboarding'); });
  }, [user?.id]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab setView={setView} setActiveTab={setActiveTab} user={user} useTemplate={useTemplate} />;
      case 'analytics':
        return <AnalyticsTab user={user} />;
      case 'presentations':
        return <PresentationsTab allEvents={allEvents} eventsLoading={eventsLoading} setSelectedEvent={setSelectedEvent} setView={setView} />;
      case 'templates':
        return <TemplatesTab allTemplates={[...templates, ...communityTemplates]} templatesLoading={templatesLoading} useTemplate={useTemplate} />;
      case 'admin':
        return user?.role === 'admin' ? <AdminTab currentUser={user} /> : null;
      case 'orders':
        return user?.role === 'admin' ? <OrdersTab currentUser={user} /> : null;
      case 'referrals':
        return <ReferralsTab user={user} />;
      case 'api':
        return <ApiKeysTab user={user} />;
      case 'profile':
        return <ProfileTab user={user} />;
      case 'semantic':
        return <SemanticSearchTab user={user} />;
      case 'organizations':
        return <OrganizationsTab user={user} />;
      case 'plan':
        return <PlanTab user={user} setView={setView} setActiveTab={setActiveTab} />;
      case 'team':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 max-w-4xl mx-auto text-center pt-32">
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-16 rounded-[4rem] border-2 border-indigo-100/50 shadow-2xl shadow-indigo-50 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-indigo-600 mx-auto mb-10 shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                  <span className="text-5xl font-black tracking-tighter">TEAM</span>
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Работете заедно со вашиот тим</h2>
                <p className="text-xl text-slate-500 font-bold mb-12 leading-relaxed opacity-80 uppercase tracking-widest text-xs">Функција достапна само во Pro и Semester плановите.</p>
                <button onClick={() => setActiveTab('plan')} className="px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-95">
                  Надгради сега
                </button>
              </div>
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/40 rounded-full blur-[80px]" />
            </div>
          </motion.div>
        );
      case 'integrations':
        return <IntegrationsTab setView={setView} />;
      default:
        return (
          <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-8 animate-bounce">
              <span className="text-5xl">⚙️</span>
            </div>
            <h2 className="text-3xl font-black text-slate-300">Наскоро достапно...</h2>
            <p className="text-slate-200 font-bold mt-2 uppercase tracking-widest">Овој дел се подготвува за вас.</p>
          </div>
        );
    }
  };

  // Mobile bottom nav items — the 5 most-used tabs
  const mobileNavItems = [
    { id: 'home',          icon: Home,         label: 'Почетна'   },
    { id: 'presentations', icon: Presentation, label: 'Сесии'     },
    { id: 'CREATE',        icon: Plus,         label: 'Ново',      special: true },
    { id: 'analytics',     icon: BarChart2,    label: 'Аналитика' },
    { id: 'profile',       icon: User,         label: 'Профил'    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={onLogout} />
      </div>

      <main className="flex-1 min-h-screen relative overflow-y-auto h-screen pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom navigation — visible only on small screens */}
      <nav
        aria-label="Мобилна навигација"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-2xl flex items-stretch safe-area-inset-bottom"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isSpecial = item.special;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (isSpecial) {
                  setView('host');
                } else {
                  setActiveTab(item.id);
                }
              }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all ${
                isSpecial
                  ? 'relative'
                  : isActive
                  ? 'text-indigo-600'
                  : 'text-slate-400'
              }`}
            >
              {isSpecial ? (
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 -mt-5">
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              ) : (
                <Icon
                  className={`w-5 h-5 transition-all ${isActive ? 'scale-110' : ''}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              )}
              <span className={`text-[10px] font-black uppercase tracking-wider leading-none ${isSpecial ? 'text-indigo-600 mt-1' : ''}`}>
                {item.label}
              </span>
              {isActive && !isSpecial && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      <EventResultsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};

export default Dashboard;
