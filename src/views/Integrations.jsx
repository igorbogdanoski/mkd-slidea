import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import { CheckCircle2, Copy, ExternalLink, ArrowRight, Download } from 'lucide-react';

const SITE = 'https://slidea.mismath.net';

function CodeBlock({ code, lang = '' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs overflow-x-auto leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
      >
        <Copy className="w-3 h-3" /> {copied ? 'Копирано!' : 'Копирај'}
      </button>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm">{n}</div>
      <div className="flex-1 pb-8">
        <h4 className="font-black text-slate-900 mb-3">{title}</h4>
        {children}
      </div>
    </div>
  );
}

const INTEGRATIONS = [
  { id: 'google', label: 'Google Classroom', color: '#4285F4', icon: '🎓' },
  { id: 'teams',  label: 'Microsoft Teams',  color: '#6264A7', icon: '💜' },
  { id: 'moodle', label: 'Moodle',            color: '#f98012', icon: '📚' },
  { id: 'zoom',   label: 'Zoom',              color: '#2D8CFF', icon: '📹' },
];

export default function Integrations() {
  const [active, setActive] = useState('google');

  useSEO({
    title: 'Интеграции — Google Classroom, Teams, Moodle | MKD Slidea',
    description: 'Поврзи MKD Slidea со Google Classroom, Microsoft Teams, Moodle и Zoom. Чекор по чекор упатства за наставници и IT администратори.',
    keywords: 'google classroom интеграција, microsoft teams квиз, moodle embed, slidea интеграција, lms macedonia',
    path: '/integrations',
    image: `${SITE}/api/og-png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      'name': 'Интегрирај MKD Slidea со твојот LMS',
      'url': `${SITE}/integrations`,
      'step': [
        { '@type': 'HowToStep', 'name': 'Google Classroom', 'text': 'Сподели сесија директно во Google Classroom преку Share URL.' },
        { '@type': 'HowToStep', 'name': 'Microsoft Teams', 'text': 'Додај MKD Slidea како Teams Tab или сподели линк во канал.' },
        { '@type': 'HowToStep', 'name': 'Moodle', 'text': 'Вграде embed iframe во Moodle HTML блок или External Tool (LTI).' },
      ],
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pt-28 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
          🔗 Интеграции
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-3">Поврзи со твојот LMS</h1>
        <p className="text-slate-500 text-lg">Google Classroom, Microsoft Teams, Moodle и Zoom — чекор по чекор.</p>
      </motion.div>

      {/* Tab selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {INTEGRATIONS.map(it => (
          <button
            key={it.id}
            onClick={() => setActive(it.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all border-2 ${active === it.id ? 'border-current text-white' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
            style={active === it.id ? { background: it.color, borderColor: it.color } : {}}
          >
            {it.icon} {it.label}
          </button>
        ))}
      </div>

      {/* ── Google Classroom ──────────────────────────────────────── */}
      {active === 'google' && (
        <motion.div key="google" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="p-6 rounded-2xl border border-blue-100 bg-blue-50">
            <p className="font-black text-blue-900 mb-1">Две опции за Google Classroom</p>
            <p className="text-sm text-blue-700">Опција А: Share копче (без API). Опција Б: Google Classroom API (напредно).</p>
          </div>

          <div className="space-y-0 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <Step n="1" title="Создај настан во MKD Slidea">
              <p className="text-sm text-slate-600 mb-2">Во Dashboard → Нов настан → добивај 6-цифрен код (пр. <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">AB1234</code>).</p>
            </Step>
            <Step n="2" title='Кликни "Сподели → Google Classroom" во Settings'>
              <p className="text-sm text-slate-600 mb-2">Во Host панелот, Поставки → секција „Сподели со класот" → кликни <strong>Google Classroom</strong>.</p>
              <p className="text-sm text-slate-500">Ова отвора Classroom Share Dialog со веќе пополнет линк за учество.</p>
            </Step>
            <Step n="3" title="Избери клас и испрати">
              <p className="text-sm text-slate-600">Google Classroom прикажува листа на твоите класови. Избери, додај опис, кликни Испрати. Учениците добиваат нотификација веднаш.</p>
            </Step>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="font-black text-slate-700 mb-2 text-sm">Или рачно — конструирај share URL:</p>
            <CodeBlock code={`https://classroom.google.com/share?url=https://slidea.mismath.net/event/КОД&title=Интерактивен+час`} />
          </div>

          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
            <span className="text-xl">💡</span>
            <p><strong>Совет:</strong> Создај Classroom Assignment (не само announcement) за да можеш да ги следиш учениците кои се приклучиле.</p>
          </div>
        </motion.div>
      )}

      {/* ── Microsoft Teams ───────────────────────────────────────── */}
      {active === 'teams' && (
        <motion.div key="teams" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="p-6 rounded-2xl border border-purple-100 bg-purple-50">
            <p className="font-black text-purple-900 mb-1">Три начини за Teams</p>
            <p className="text-sm text-purple-700">A) Share во канал · B) MKD Slidea Tab (препорачано) · C) Meeting Sidebar</p>
          </div>

          <h3 className="font-black text-slate-900 text-lg">Опција A — Share линк во Teams канал</h3>
          <div className="space-y-0 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <Step n="1" title="Во Host панелот кликни Teams share копче">
              <p className="text-sm text-slate-600">Поставки → „Сподели со класот" → кликни <strong>Microsoft Teams</strong>. Ова отвара Teams Share Dialog.</p>
            </Step>
            <Step n="2" title="Избери тим / канал / чет и испрати">
              <p className="text-sm text-slate-600">Учениците добиваат линк директно во Teams — кликнуваат и влегуваат без регистрација.</p>
            </Step>
          </div>

          <h3 className="font-black text-slate-900 text-lg mt-6">Опција B — MKD Slidea Tab (инсталирај еднаш за целиот тим)</h3>
          <div className="space-y-0 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <Step n="1" title="Преземи Teams App Manifest">
              <a href="/teams-manifest.json" download="mkd-slidea-teams-manifest.json"
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-700 transition-all">
                <Download className="w-4 h-4" /> teams-manifest.json
              </a>
            </Step>
            <Step n="2" title="Во Teams Admin Center — Upload Custom App">
              <p className="text-sm text-slate-600 mb-2">Teams Admin Center → Apps → Upload an app → избери <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">mkd-slidea-teams-manifest.json</code>.</p>
              <p className="text-sm text-slate-500">Или: директно во тимот → + (Add Tab) → Upload custom app.</p>
            </Step>
            <Step n="3" title='Додај Tab "MKD Slidea" на твојот канал'>
              <p className="text-sm text-slate-600">Сите членови на тимот гледаат Tab со Host панелот на MKD Slidea директно во Teams.</p>
            </Step>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="font-black text-slate-700 mb-2 text-sm">Teams share URL формат:</p>
            <CodeBlock code={`https://teams.microsoft.com/share?href=https://slidea.mismath.net/event/КОД&msgText=Приклучи+се+на+мојот+интерактивен+час!`} />
          </div>
        </motion.div>
      )}

      {/* ── Moodle ────────────────────────────────────────────────── */}
      {active === 'moodle' && (
        <motion.div key="moodle" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="p-6 rounded-2xl border border-orange-100 bg-orange-50">
            <p className="font-black text-orange-900 mb-1">Две опции за Moodle</p>
            <p className="text-sm text-orange-700">Опција А: HTML Embed (без IT помош, 2 мин) · Опција Б: External Tool / LTI (напредно)</p>
          </div>

          <h3 className="font-black text-slate-900 text-lg">Опција A — HTML Embed (препорачано)</h3>
          <div className="space-y-0 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <Step n="1" title="Во Moodle курсот — Уреди → Додај активност или ресурс → Страница/Етикета (Label)">
              <p className="text-sm text-slate-600">Избери <strong>Етикета</strong> за embed директно на страницата на курсот, или <strong>Страница</strong> за целосен приказ.</p>
            </Step>
            <Step n="2" title='Во текст едиторот кликни "HTML" и налепи го кодот'>
              <CodeBlock code={`<iframe\n  src="https://slidea.mismath.net/event/КОД/embed"\n  width="100%"\n  height="520"\n  frameborder="0"\n  allowfullscreen\n  style="border:0;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.1)"\n></iframe>`} />
            </Step>
            <Step n="3" title="Зачувај — учениците гледаат live сесија директно во Moodle">
              <p className="text-sm text-slate-600">Резултатите се ажурираат во реално време без да го напуштат Moodle.</p>
            </Step>
          </div>

          <h3 id="moodle" className="font-black text-slate-900 text-lg mt-6">Опција B — External Tool (LTI 1.1)</h3>
          <div className="space-y-0 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <Step n="1" title="Во Moodle Admin → External Tool → Add Tool">
              <div className="text-sm text-slate-600 space-y-1">
                <p><strong>Tool URL:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">https://slidea.mismath.net</code></p>
                <p><strong>Consumer Key:</strong> (побарај на <a href="mailto:bogdanoskiigor@gmail.com" className="text-indigo-600 font-bold">bogdanoskiigor@gmail.com</a>)</p>
                <p><strong>Shared Secret:</strong> (испраќаме по email)</p>
              </div>
            </Step>
            <Step n="2" title="Додај External Tool активност во курсот">
              <p className="text-sm text-slate-600">Учениците се автентицирани преку LTI — нема посебна регистрација.</p>
            </Step>
          </div>
        </motion.div>
      )}

      {/* ── Zoom ──────────────────────────────────────────────────── */}
      {active === 'zoom' && (
        <motion.div key="zoom" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="p-6 rounded-2xl border border-sky-100 bg-sky-50">
            <p className="font-black text-sky-900 mb-1">MKD Slidea + Zoom</p>
            <p className="text-sm text-sky-700">Сподели го линкот за учество во Zoom Chat — учениците отвораат на телефон додека слушаат.</p>
          </div>

          <div className="space-y-0 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <Step n="1" title="Во Host панелот — Settings → Zoom (копирај линк)">
              <p className="text-sm text-slate-600 mb-2">Кликни на Zoom копчето — линкот за учество се копира автоматски во clipboard.</p>
            </Step>
            <Step n="2" title="Налепи го линкот во Zoom Chat">
              <p className="text-sm text-slate-600">Во Zoom Meeting → Chat → Everyone → Ctrl+V. Учениците кликнуваат и влегуваат на телефон/таб.</p>
            </Step>
            <Step n="3" title="Паралелно: Share Screen со Presenter режим">
              <p className="text-sm text-slate-600">Во Presenter режимот (F за fullscreen) share-ни го екранот — учениците гледаат резултати на твојот екран, одговараат на свои уреди.</p>
            </Step>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700">
            <span className="text-xl">🎯</span>
            <p><strong>Pro tip:</strong> Пред сесијата, испрати ја join URL во Zoom Invite — учениците ја имаат уред уред пред да влезат на предавањето.</p>
          </div>
        </motion.div>
      )}

      {/* Bottom CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mt-14 p-8 rounded-3xl text-center"
        style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)', border: '1px solid #e0e7ff' }}>
        <h3 className="text-xl font-black text-slate-900 mb-2">Треба институционална лиценца?</h3>
        <p className="text-slate-500 text-sm mb-5">За училишта со повеќе наставници — централна конзола, фактура, приоритетна поддршка.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/schools" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all">
            Планови за училишта <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="mailto:bogdanoskiigor@gmail.com?subject=LTI/Moodle интеграција — MKD Slidea"
            className="inline-flex items-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-2xl font-bold text-sm border border-slate-200 hover:border-indigo-300 transition-all">
            Контактирај за LTI поддршка
          </a>
        </div>
      </motion.div>
    </div>
  );
}
