import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AcceptInvite = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token');
    if (!token) {
      setStatus('error');
      setError('Недостасува покана токен во линкот.');
      return;
    }
    (async () => {
      const { error: rpcErr } = await supabase.rpc('accept_org_invite', { p_token: token });
      if (rpcErr) {
        setStatus('error');
        setError(
          rpcErr.message === 'invalid_or_expired'
            ? 'Оваа покана е невалидна или е истечена.'
            : 'Прифаќањето на поканата не успеа.'
        );
        return;
      }
      setStatus('success');
    })();
  }, [location.search]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl max-w-md w-full p-10 text-center"
      >
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-indigo-500" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-4" />
            <p className="font-bold text-slate-500">Ја прифаќаме поканата...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Се приклучи на организацијата!</h2>
            <p className="text-sm font-bold text-slate-400 mb-6">Сега имаш пристап преку „Организации" во контролната табла.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Оди во контролна табла
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Поканата не важи</h2>
            <p className="text-sm font-bold text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
              Оди во контролна табла
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AcceptInvite;
