import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={onLogout} />
      <main className="flex-1 min-h-screen relative overflow-y-auto h-screen">
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
      <EventResultsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};

export default Dashboard;
