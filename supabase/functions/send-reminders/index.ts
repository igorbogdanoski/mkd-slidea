/**
 * Supabase Edge Function — send-reminders
 *
 * Deploy:  supabase functions deploy send-reminders
 * Invoke:  via pg_cron every 5 minutes (see setup below) OR manually
 *
 * pg_cron setup (run once in Supabase SQL Editor):
 *   SELECT cron.schedule(
 *     'send-event-reminders',
 *     '* /5 * * * *',   -- every 5 minutes (remove space before /5)
 *     $$
 *       SELECT net.http_post(
 *         url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
 *         headers := '{"Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb
 *       );
 *     $$
 *   );
 *
 * Required env vars (set in Supabase Dashboard → Project → Settings → Edge Functions):
 *   SUPABASE_URL          — your project URL
 *   SUPABASE_SERVICE_KEY  — service role key (has RLS bypass)
 *   RESEND_API_KEY        — Resend.com API key
 *   FROM_EMAIL            — e.g. "MKD Slidea <noreply@mismath.net>"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_KEY')!,
);

const RESEND_KEY  = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL  = Deno.env.get('FROM_EMAIL') ?? 'MKD Slidea <noreply@mismath.net>';
const WINDOW_MIN  = 15; // remind when event starts in ≤ 15 minutes

Deno.serve(async () => {
  const now    = new Date();
  const cutoff = new Date(now.getTime() + WINDOW_MIN * 60 * 1000);

  // Find events starting in the next 15 min that haven't been reminded yet
  const { data: events, error } = await supabase
    .from('events')
    .select('id, code, title, starts_at, user_id, profiles:user_id(name, email:auth_users(email))')
    .gte('starts_at', now.toISOString())
    .lte('starts_at', cutoff.toISOString())
    .eq('reminded', false)
    .limit(50);

  if (error) {
    console.error('Query error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!events?.length) {
    return new Response(JSON.stringify({ sent: 0, message: 'No upcoming events' }), { status: 200 });
  }

  let sent = 0;

  for (const ev of events) {
    const email = (ev as any).profiles?.email ?? null;
    if (!email) continue;

    const startsAt = new Date(ev.starts_at);
    const timeStr  = startsAt.toLocaleTimeString('mk-MK', { hour: '2-digit', minute: '2-digit' });
    const joinUrl  = `https://slidea.mismath.net/event/${ev.code}`;
    const hostUrl  = `https://slidea.mismath.net/host`;

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;padding:24px;color:white;margin-bottom:24px;">
          <h1 style="margin:0;font-size:22px;font-weight:900;">⏰ Вашиот настан почнува за 15 минути</h1>
          <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">${timeStr} · MKD Slidea</p>
        </div>
        <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;">${ev.title || 'Мојот настан'}</h2>
        <p style="color:#64748b;margin-bottom:24px;">Код за учесниците: <strong style="font-size:18px;letter-spacing:2px;">${ev.code}</strong></p>
        <a href="${hostUrl}" style="display:inline-block;background:#6366f1;color:white;padding:14px 28px;border-radius:12px;font-weight:900;text-decoration:none;margin-bottom:12px;">
          ▶ Отвори ја сесијата
        </a>
        <p style="margin-top:12px;color:#94a3b8;font-size:12px;">
          Учесниците можат да се приклучат на <a href="${joinUrl}" style="color:#6366f1;">${joinUrl}</a>
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#cbd5e1;font-size:11px;">MKD Slidea · <a href="https://slidea.mismath.net" style="color:#a5b4fc;">slidea.mismath.net</a></p>
      </div>
    `;

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `⏰ „${ev.title || ev.code}" почнува за 15 минути — MKD Slidea`,
        html,
      }),
    });

    if (res.ok) {
      // Mark as reminded so we don't send again
      await supabase.from('events').update({ reminded: true }).eq('id', ev.id);
      sent++;
    } else {
      console.error(`Resend failed for event ${ev.id}:`, await res.text());
    }
  }

  return new Response(JSON.stringify({ sent, total: events.length }), { status: 200 });
});
