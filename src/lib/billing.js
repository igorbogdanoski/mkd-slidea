// Manual billing config. Stripe ќе се додаде подоцна; засега:
//   - PayPal (по email — Friends & Family или Goods)
//   - IBAN/SWIFT банкарски трансфер (EUR за странство)
//   - Трансакциска сметка во МКД (за домашни клиенти)
//
// Сите чувствителни вредности може да се override преку Vite env (VITE_*) на
// build време; ако недостасуваат, се користат placeholder вредностите подолу.
// За продукција препорачано: постави ги во Vercel Environment Variables.

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

export const BILLING = {
  company: {
    legalName: env.VITE_BILLING_COMPANY || 'Игор Богданоски',
    address: env.VITE_BILLING_ADDRESS || 'ул. Кузман Јосифоски 221, 7500 Прилеп, Северна Македонија',
    taxId: env.VITE_BILLING_TAX_ID || '',
    email: env.VITE_BILLING_EMAIL || 'igorbogdanoski@mismath.net',
    supportEmail: env.VITE_BILLING_SUPPORT || 'igorbogdanoski@mismath.net',
    phone: env.VITE_BILLING_PHONE || '+389 70 246 814',
  },
  // Kept, disabled, so the moment receiving becomes possible it is one flag
  // rather than a rebuild. See PAYMENT_METHODS below for why it is off.
  paypal: {
    enabled: false,
    email: env.VITE_PAYPAL_EMAIL || '',
    meLink: env.VITE_PAYPAL_ME || '',
    note: 'PayPal во Северна Македонија поддржува само испраќање, не и примање средства.',
  },
  bankEUR: {
    enabled: true,
    label: 'EUR (IBAN / SWIFT)',
    beneficiary: env.VITE_BANK_EUR_NAME || 'Igor Bogdanoski',
    bankName: env.VITE_BANK_EUR_BANK || 'NLB Banka AD Skopje',
    iban: env.VITE_BANK_EUR_IBAN || 'MK07210501596102457',
    swift: env.VITE_BANK_EUR_SWIFT || 'TUTNMK22',
    reference: 'Order ID',
  },
  bankMKD: {
    enabled: true,
    label: 'МКД трансакциска сметка',
    beneficiary: env.VITE_BANK_MKD_NAME || 'Игор Богданоски',
    bankName: env.VITE_BANK_MKD_BANK || 'НЛБ Банка АД Скопје',
    account: env.VITE_BANK_MKD_ACCOUNT || '210501596102457',
    reference: 'Order ID',
  },
};

// Prices are mirrored in api/v1/create-order.js, which is the authority — the
// server never trusts an amount sent by the client. Keep the two in step; a
// unit test fails if they drift.
export const PLAN_CATALOG = {
  teacher_monthly: { code: 'teacher_monthly', label: 'Наставник',              amount: 4,   currency: 'EUR', period: 'месечно', days: 31 },
  teacher_yearly:  { code: 'teacher_yearly',  label: 'Наставник (годишно)',    amount: 36,  currency: 'EUR', period: 'годишно', days: 366 },
  event:           { code: 'event',           label: 'Еден настан',            amount: 80,  currency: 'EUR', period: 'еднократно', days: 7 },
  school:          { code: 'school',          label: 'Училиште / Организација', amount: 390, currency: 'EUR', period: 'годишно', days: 366 },

  // Legacy — no longer offered on /pricing, but a saved checkout link or an
  // unpaid pending order from before the change must still resolve rather
  // than 404 the customer mid-purchase.
  monthly:   { code: 'monthly',   label: 'Месечен (стар)',     amount: 5,  currency: 'EUR', period: 'месечно',  days: 31,  legacy: true },
  quarterly: { code: 'quarterly', label: 'Квартален (стар)',   amount: 10, currency: 'EUR', period: '3 месеци', days: 93,  legacy: true },
  semester:  { code: 'semester',  label: 'Семестрален (стар)', amount: 15, currency: 'EUR', period: '6 месеци', days: 186, legacy: true },
  yearly:    { code: 'yearly',    label: 'Годишен (стар)',     amount: 20, currency: 'EUR', period: 'годишно',  days: 366, legacy: true },
};

// What /pricing sells today.
export const SELLABLE_PLANS = Object.values(PLAN_CATALOG).filter((p) => !p.legacy);

// Saving of the yearly teacher plan against paying monthly for a year —
// computed, never written by hand, so the badge on /pricing cannot claim a
// discount the prices do not actually give.
export function yearlySavingPercent() {
  const monthlyYear = PLAN_CATALOG.teacher_monthly.amount * 12;
  const yearly = PLAN_CATALOG.teacher_yearly.amount;
  return Math.round(((monthlyYear - yearly) / monthlyYear) * 100);
}

export function yearlySavingAmount() {
  return PLAN_CATALOG.teacher_monthly.amount * 12 - PLAN_CATALOG.teacher_yearly.amount;
}

export function getPlan(code) {
  return PLAN_CATALOG[code] || null;
}

export function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SLD-${ts}-${rand}`;
}

export function formatAmount(amount, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('mk-MK', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

// PayPal is deliberately absent.
//
// PayPal supports North Macedonia for *sending* money only — a Macedonian
// account cannot receive a payment. Offering it as a method meant a customer
// could pick it, follow the instructions, and either fail at PayPal's end or
// send money that never arrives, then wait for an activation that could never
// come. Stripe does not operate in North Macedonia either. Until a local card
// gateway (CaSys/CPay through a bank contract) or a merchant-of-record is in
// place, bank transfer is the only method that actually completes, so it is
// the only one shown.
export const PAYMENT_METHODS = [
  { id: 'bank_eur', label: 'IBAN / SWIFT (EUR)', icon: 'bank', description: 'Меѓународен банкарски трансфер во евра.' },
  { id: 'bank_mkd', label: 'Трансакциска сметка (МКД)', icon: 'bank-mk', description: 'Домашен трансфер во денари.' },
];
