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
  paypal: {
    enabled: true,
    email: env.VITE_PAYPAL_EMAIL || 'igor.bogdanoski@mismath.net',
    meLink: env.VITE_PAYPAL_ME || '',
    note: 'Во полето „Note“ внеси го бројот на нарачка (Order ID). PayPal.me не е достапен за Македонија — се користи email.',
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

export const PLAN_CATALOG = {
  monthly:   { code: 'monthly',   label: 'Месечен',     amount: 5,  currency: 'EUR', period: 'месечно',   days: 31 },
  quarterly: { code: 'quarterly', label: 'Квартален',   amount: 10, currency: 'EUR', period: '3 месеци',  days: 93 },
  semester:  { code: 'semester',  label: 'Семестрален', amount: 15, currency: 'EUR', period: '6 месеци',  days: 186 },
  yearly:    { code: 'yearly',    label: 'Годишен',     amount: 20, currency: 'EUR', period: 'годишно',   days: 366 },
};

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

export const PAYMENT_METHODS = [
  { id: 'paypal', label: 'PayPal', icon: 'paypal', description: 'Брзо плаќање преку PayPal email.' },
  { id: 'bank_eur', label: 'IBAN / SWIFT (EUR)', icon: 'bank', description: 'Меѓународен банкарски трансфер.' },
  { id: 'bank_mkd', label: 'Трансакциска сметка (МКД)', icon: 'bank-mk', description: 'Домашен трансфер во денари.' },
];
