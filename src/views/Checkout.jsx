import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Copy, ShieldCheck, Mail, Building2,
  CreditCard, Banknote, Loader2, AlertCircle, Clock
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { BILLING, PLAN_CATALOG, getPlan, generateOrderId, formatAmount, PAYMENT_METHODS } from '../lib/billing';
import { supabase } from '../lib/supabase';

const Checkout = ({ user }) => {
  const { planCode } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = useMemo(() => getPlan(planCode) || getPlan(searchParams.get('plan')) || PLAN_CATALOG.yearly, [planCode, searchParams]);

  const [orderId, setOrderId] = useState(() => searchParams.get('order') || generateOrderId());
  const [method, setMethod] = useState('paypal');
  const [email, setEmail] = useState(user?.email || '');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [orgName, setOrgName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [needsInvoice, setNeedsInvoice] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useSEO({
    title: `Активирај ${plan.label} план | MKD Slidea — PayPal · IBAN · Банкарска уплата`,
    description: `Активирај го ${plan.label} планот (${formatAmount(plan.amount, plan.currency)}) преку PayPal, IBAN или трансакциска сметка. Рачна потврда во рок од 24 часа.`,
    keywords: `активирај ${plan.label.toLowerCase()}, paypal, iban, swift, банкарска уплата, mkd slidea`,
    path: `/checkout/${plan.code}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Order',
      'orderNumber': orderId,
      'priceCurrency': plan.currency,
      'price': String(plan.amount),
      'acceptedOffer': {
        '@type': 'Offer',
        'name': `MKD Slidea — ${plan.label}`,
        'price': String(plan.amount),
        'priceCurrency': plan.currency,
      },
      'seller': {
        '@type': 'Organization',
        'name': 'MKD Slidea',
        'url': 'https://slidea.mismath.net',
      },
    },
  });

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      setError('Не успеа копирањето. Маркирај и копирај рачно.');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Внеси валидна email адреса.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        order_id: orderId,
        plan: plan.code,
        amount: plan.amount,
        currency: plan.currency,
        method,
        email,
        full_name: fullName,
        org_name: orgName,
        tax_id: taxId,
        needs_invoice: needsInvoice,
        note,
        user_id: user?.id || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      let apiOk = false;
      try {
        const r = await fetch('/api/v1/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (r.ok) apiOk = true;
      } catch { /* fallback below */ }

      if (!apiOk && supabase) {
        try {
          await supabase.from('manual_orders').insert(payload);
        } catch (e) {
          console.warn('manual_orders insert fallback failed:', e?.message);
        }
      }

      setSubmitted(true);
    } catch (e) {
      setError(e?.message || 'Грешка при креирање нарачка.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-28 pb-24 px-6 min-h-screen bg-[#F8FAFC]"
      >
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3">Нарачката е примена</h1>
          <p className="text-slate-600 mb-8">
            Бројот на твојата нарачка е <span className="font-mono font-black text-indigo-600">{orderId}</span>.
            Внеси го овој број во „Note“ полето при плаќањето за да можеме брзо да ја поврземе уплатата.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left mb-8">
            <div className="flex gap-3">
              <Clock className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-black text-amber-900 mb-1">Следни чекори</p>
                <ol className="text-amber-800 text-sm space-y-1 list-decimal list-inside">
                  <li>Изврши ја уплатата според избраниот метод подолу.</li>
                  <li>Запиши го Order ID <span className="font-mono font-bold">{orderId}</span> во описот.</li>
                  <li>Ќе добиеш email потврда на <b>{email}</b> во рок од 24 часа.</li>
                </ol>
              </div>
            </div>
          </div>
          <PaymentInstructions method={method} orderId={orderId} amount={plan.amount} currency={plan.currency} />
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-8 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            Кон dashboard <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-28 pb-24 px-6 min-h-screen bg-[#F8FAFC]"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3">
            Активирај {plan.label} план
          </h1>
          <p className="text-slate-500 font-medium">
            {formatAmount(plan.amount, plan.currency)} / {plan.period} · Рачна потврда во рок од 24h
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT: form */}
          <form onSubmit={submit} className="lg:col-span-3 bg-white rounded-3xl shadow-lg p-8 space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-4">Твои податоци</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Email" required>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ime@primer.mk"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium"
                    required
                  />
                </Field>
                <Field label="Име и презиме">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Игор Богданоски"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-3 mt-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={needsInvoice}
                  onChange={(e) => setNeedsInvoice(e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600"
                />
                <span className="text-sm font-bold text-slate-700">Ми треба фактура (правно лице / училиште)</span>
              </label>

              {needsInvoice && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <Field label="Назив на фирма / институција" required>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="ОУ „Кирил и Методиј“"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-medium"
                      required={needsInvoice}
                    />
                  </Field>
                  <Field label="ЕДБ / Даночен број">
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="MK1234567890"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-medium"
                    />
                  </Field>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900 mb-4">Избери метод на плаќање</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.id === 'paypal' ? CreditCard : m.id === 'bank_eur' ? Building2 : Banknote;
                  const active = method === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        active ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${active ? 'text-indigo-600' : 'text-slate-500'}`} />
                      <p className="font-black text-sm text-slate-900">{m.label}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">{m.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Дополнителна белешка (опционално)">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Пр. промо код, прашање..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-medium"
              />
            </Field>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <p className="text-sm font-bold text-rose-900">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-sm shadow-xl hover:bg-indigo-700 disabled:opacity-60 transition-all active:scale-95 inline-flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {submitting ? 'Се креира нарачка...' : `Креирај нарачка (${formatAmount(plan.amount, plan.currency)})`}
            </button>

            <p className="text-xs text-slate-400 text-center">
              Со кликнување, прифаќаш дека плаќањето е рачно и активацијата трае до 24h по верификација.
            </p>
          </form>

          {/* RIGHT: summary + bank details preview */}
          <aside className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-3xl p-8 shadow-xl">
              <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Нарачка</p>
              <p className="font-mono font-black text-2xl mb-6">{orderId}</p>

              <div className="space-y-3 text-sm">
                <Row k="План" v={plan.label} />
                <Row k="Период" v={plan.period} />
                <Row k="Цена" v={formatAmount(plan.amount, plan.currency)} />
              </div>

              <div className="border-t border-white/20 mt-6 pt-6 flex items-baseline justify-between">
                <span className="font-bold opacity-80">Вкупно</span>
                <span className="text-3xl font-black">{formatAmount(plan.amount, plan.currency)}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Преглед на метод</h3>
              <PaymentInstructions
                method={method}
                orderId={orderId}
                amount={plan.amount}
                currency={plan.currency}
                onCopy={copy}
                copied={copied}
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex gap-3">
              <Mail className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-emerald-900 leading-relaxed">
                Прашања? Пиши ни на <a className="underline" href={`mailto:${BILLING.company.supportEmail}`}>{BILLING.company.supportEmail}</a>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </motion.div>
  );
};

const Field = ({ label, required, children }) => (
  <label className="block">
    <span className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
      {label} {required && <span className="text-rose-500">*</span>}
    </span>
    {children}
  </label>
);

const Row = ({ k, v }) => (
  <div className="flex justify-between items-center">
    <span className="font-bold opacity-80">{k}</span>
    <span className="font-black">{v}</span>
  </div>
);

const PaymentInstructions = ({ method, orderId, amount, currency, onCopy, copied }) => {
  const copyBtn = (text, key) => onCopy && (
    <button
      type="button"
      onClick={() => onCopy(text, key)}
      className="ml-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
    >
      <Copy className="w-3.5 h-3.5" /> {copied === key ? 'Копирано' : 'Копирај'}
    </button>
  );

  if (method === 'paypal') {
    return (
      <div className="space-y-3 text-sm">
        <Detail label="PayPal email" value={BILLING.paypal.email} copy={copyBtn(BILLING.paypal.email, 'pp-email')} />
        {BILLING.paypal.meLink && <Detail label="PayPal.me" value={BILLING.paypal.meLink} />}
        <Detail label="Износ" value={`${amount} ${currency}`} />
        <Detail label="Note (задолжително)" value={orderId} copy={copyBtn(orderId, 'order')} highlight />
      </div>
    );
  }
  if (method === 'bank_eur') {
    return (
      <div className="space-y-3 text-sm">
        <Detail label="Примач" value={BILLING.bankEUR.beneficiary} />
        <Detail label="Банка" value={BILLING.bankEUR.bankName} />
        <Detail label="IBAN" value={BILLING.bankEUR.iban} copy={copyBtn(BILLING.bankEUR.iban, 'iban')} />
        <Detail label="SWIFT / BIC" value={BILLING.bankEUR.swift} copy={copyBtn(BILLING.bankEUR.swift, 'swift')} />
        <Detail label="Износ" value={`${amount} ${currency}`} />
        <Detail label="Назнака за плаќање" value={orderId} copy={copyBtn(orderId, 'order2')} highlight />
      </div>
    );
  }
  return (
    <div className="space-y-3 text-sm">
      <Detail label="Примач" value={BILLING.bankMKD.beneficiary} />
      <Detail label="Банка" value={BILLING.bankMKD.bankName} />
      <Detail label="Трансакциска сметка" value={BILLING.bankMKD.account} copy={copyBtn(BILLING.bankMKD.account, 'mkd-acc')} />
      <Detail label="Износ (EUR контравредност во МКД)" value={`${amount} EUR`} />
      <Detail label="Цел на дознака" value={orderId} copy={copyBtn(orderId, 'order3')} highlight />
    </div>
  );
};

const Detail = ({ label, value, copy, highlight }) => (
  <div className={`p-3 rounded-xl ${highlight ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50'}`}>
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
    <div className="flex items-center justify-between gap-2">
      <span className={`font-mono font-bold ${highlight ? 'text-indigo-700' : 'text-slate-900'} break-all`}>{value}</span>
      {copy}
    </div>
  </div>
);

export default Checkout;
