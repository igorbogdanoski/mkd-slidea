import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { PLAN_CATALOG, SELLABLE_PLANS, PAYMENT_METHODS, BILLING, yearlySavingPercent, yearlySavingAmount } from '../lib/billing';
import { PLANS, PAID_PLANS, isPro } from '../lib/plans';

// The client shows a price, the server charges one, and the feature limits
// live in a third file. Nothing enforces that the three agree — and a plan
// that exists in one but not the others fails at the worst possible moment:
// mid-checkout, or by silently downgrading a customer who has paid.

const orderApi = readFileSync('api/v1/create-order.js', 'utf8');
const serverTable = (name) => {
  const body = orderApi.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\};`))[1];
  return Object.fromEntries(
    [...body.matchAll(/(\w+):\s*(\d+)/g)].map(([, k, v]) => [k, Number(v)])
  );
};

const SERVER_AMOUNTS = serverTable('PLAN_AMOUNTS');
const SERVER_DAYS = serverTable('PLAN_DAYS');

describe('plan catalogue integrity', () => {
  it('every catalogue plan is priced identically on the server', () => {
    for (const [code, plan] of Object.entries(PLAN_CATALOG)) {
      expect(SERVER_AMOUNTS[code], `${code} missing from server PLAN_AMOUNTS`).toBeDefined();
      expect(SERVER_AMOUNTS[code], `${code} price differs between client and server`).toBe(plan.amount);
    }
  });

  it('every catalogue plan grants the same number of days on the server', () => {
    for (const [code, plan] of Object.entries(PLAN_CATALOG)) {
      expect(SERVER_DAYS[code], `${code} missing from server PLAN_DAYS`).toBeDefined();
      expect(SERVER_DAYS[code], `${code} duration differs between client and server`).toBe(plan.days);
    }
  });

  it('the server offers nothing the catalogue does not describe', () => {
    for (const code of Object.keys(SERVER_AMOUNTS)) {
      expect(PLAN_CATALOG[code], `server accepts "${code}" but the catalogue has no entry`).toBeDefined();
    }
  });

  it('every sellable plan has feature limits defined', () => {
    for (const plan of SELLABLE_PLANS) {
      expect(PLANS[plan.code], `${plan.code} is sold but has no entry in PLANS`).toBeDefined();
    }
  });
});

describe('grandfathering', () => {
  // Removing a retired plan from PLANS would drop its holders to `free` — the
  // people who have actually paid us money.
  const RETIRED = ['monthly', 'quarterly', 'semester', 'yearly', 'pro'];

  it('retired plans still resolve to their original limits', () => {
    for (const code of RETIRED) {
      expect(PLANS[code], `legacy plan "${code}" was removed — its customers would silently become free`).toBeDefined();
    }
    expect(PLANS.yearly.maxParticipants).toBe(Infinity);
  });

  it('retired plans still count as paid', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    for (const code of RETIRED) {
      expect(isPro({ plan: code, pro_until: future }), `${code} holder lost Pro`).toBe(true);
    }
  });

  it('PAID_PLANS is derived, so a new plan cannot be forgotten', () => {
    for (const code of Object.keys(PLANS)) {
      if (code === 'free' || code === 'admin') continue;
      expect(PAID_PLANS).toContain(code);
    }
    expect(PAID_PLANS).not.toContain('free');
  });
});

describe('the price ladder is not inverted', () => {
  // The old ladder charged €5/month (€60 a year) for 200 participants and 10
  // polls, while €20/year bought unlimited: paying more often cost three
  // times as much and delivered less. Whatever the prices become, paying
  // annually must never cost more than paying monthly for the same year.
  it('annual is cheaper than twelve monthly payments', () => {
    const monthlyYear = PLAN_CATALOG.teacher_monthly.amount * 12;
    expect(PLAN_CATALOG.teacher_yearly.amount).toBeLessThan(monthlyYear);
  });

  it('annual and monthly buy exactly the same product', () => {
    const { label: _m, ...monthly } = PLANS.teacher_monthly;
    const { label: _y, ...yearly } = PLANS.teacher_yearly;
    expect(monthly).toEqual(yearly);
  });

  it('the advertised saving matches the actual saving', () => {
    const monthlyYear = PLAN_CATALOG.teacher_monthly.amount * 12;
    expect(yearlySavingAmount()).toBe(monthlyYear - PLAN_CATALOG.teacher_yearly.amount);
    expect(yearlySavingPercent()).toBe(
      Math.round((yearlySavingAmount() / monthlyYear) * 100)
    );
  });

  it('the discount stays in credible territory', () => {
    // 67% "off" was not a discount, it was a mispriced monthly plan.
    expect(yearlySavingPercent()).toBeGreaterThanOrEqual(10);
    expect(yearlySavingPercent()).toBeLessThanOrEqual(40);
  });
});

describe('only payment methods that can actually receive money are offered', () => {
  // The failure this guards against is a customer who has decided to buy,
  // picks a method, and then cannot finish — the worst place in the funnel to
  // stop someone. So a method appears only when the details needed to pay it
  // are present.
  it('PayPal is offered exactly when an address is configured', () => {
    const offered = PAYMENT_METHODS.map((m) => m.id).includes('paypal');
    expect(offered).toBe(BILLING.paypal.enabled);
    expect(BILLING.paypal.enabled).toBe(Boolean(BILLING.paypal.email || BILLING.paypal.meLink));
  });

  it('the server accepts every method the UI offers', () => {
    // Superset, not equality: the server is a separate deployment and does not
    // see the client's build-time PayPal config, and an old pending order can
    // name a method no longer shown. It must never reject one currently
    // offered — that would break checkout for a build it cannot see.
    const allowed = orderApi.match(/\[([^\]]*)\]\.includes\(method\)/)[1]
      .split(',')
      .map((s) => s.trim().replace(/['"]/g, ''));
    for (const m of PAYMENT_METHODS) expect(allowed).toContain(m.id);
  });

  it('every offered method has the details needed to actually pay', () => {
    const CONFIG = { bank_eur: BILLING.bankEUR, bank_mkd: BILLING.bankMKD, paypal: BILLING.paypal };
    for (const m of PAYMENT_METHODS) {
      const config = CONFIG[m.id];
      // A method with no config object at all is the failure this catches:
      // mapping an unknown id onto some other method's details would let a
      // method ship that points a customer at the wrong account.
      expect(config, `${m.id} is offered but has no config`).toBeTruthy();
      expect(config.enabled, `${m.id} is offered but disabled`).toBe(true);
      if (m.id === 'paypal') {
        expect(config.email || config.meLink, 'PayPal is offered with no address').toBeTruthy();
      } else {
        expect(config.beneficiary, `${m.id} has no beneficiary`).toBeTruthy();
        expect(config.iban || config.account, `${m.id} has no account number`).toBeTruthy();
      }
    }
  });
});

describe('participant ceilings stay within what was load-tested', () => {
  // 300 concurrent voters measured at 100% success, 500 at 85–94% under a
  // fully synchronised burst, nothing above that measured at all. New plans
  // must not promise a number nobody has verified.
  it('no plan sold today claims more than 500 participants', () => {
    for (const plan of SELLABLE_PLANS) {
      expect(PLANS[plan.code].maxParticipants, `${plan.code} promises an untested ceiling`).toBeLessThanOrEqual(500);
    }
  });

  it('the one-off event plan is time-boxed, not a subscription', () => {
    expect(PLAN_CATALOG.event.days).toBeLessThanOrEqual(14);
    expect(PLAN_CATALOG.event.period).toBe('еднократно');
  });
});
