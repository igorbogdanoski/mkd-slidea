import { describe, it, expect } from 'vitest';
import handler from '../../api/og-png.js';

// /api/og-png returned HTTP 500 in production for every request — the fonts it
// fetched from fonts.gstatic.com had been 404ing, and satori threw on the HTML
// error page. Nothing failed at build time and nothing failed in review; it was
// only caught by fetching the live URL by hand. These tests render for real, so
// a broken renderer fails here instead of silently stripping the image from
// every share of the site.

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const mockRes = () => ({
  statusCode: 200,
  body: null,
  headers: {},
  setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
  status(c) { this.statusCode = c; return this; },
  send(b) { this.body = b; return this; },
  end(b) { this.body = b; return this; },
});

const render = async (query) => {
  const res = mockRes();
  await handler({ url: `/api/og-png${query}`, headers: { host: 'slidea.mismath.net' } }, res);
  return res;
};

describe('/api/og-png', () => {
  it('renders the default branded card as a real PNG', async () => {
    const res = await render('');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(Buffer.from(res.body).subarray(0, 4)).toEqual(PNG_MAGIC);
  }, 20000);

  it('renders a template card with Cyrillic title, subject and grade', async () => {
    const res = await render('?type=template&title=Периодниот систем&subject=Хемија&grade=8 одделение');
    expect(res.statusCode).toBe(200);
    expect(Buffer.from(res.body).subarray(0, 4)).toEqual(PNG_MAGIC);
  }, 20000);

  it('renders an event card with a join code', async () => {
    const res = await render('?type=event&title=Час по физика&code=482913');
    expect(res.statusCode).toBe(200);
    expect(Buffer.from(res.body).subarray(0, 4)).toEqual(PNG_MAGIC);
  }, 20000);

  it('caches successful renders at the CDN for a day', async () => {
    const res = await render('');
    expect(res.headers['cache-control']).toContain('s-maxage=86400');
  }, 20000);
});
