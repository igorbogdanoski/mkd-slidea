// Shared IP-bucket rate limiter (Vercel KV backed, in-memory fallback).
import { kv } from '@vercel/kv';

const fallbackMap = new Map();

export function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimitFallback(bucketKey, limit, windowMs) {
  const now = Date.now();
  const entry = fallbackMap.get(bucketKey) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count++;
  fallbackMap.set(bucketKey, entry);
  return {
    allowed: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export async function checkRateLimit(namespace, ip, limit, windowMs) {
  const bucket = Math.floor(Date.now() / windowMs);
  const key = `rate:${namespace}:${ip}:${bucket}`;
  try {
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, Math.ceil(windowMs / 1000));
    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt: (bucket + 1) * windowMs,
    };
  } catch {
    return checkRateLimitFallback(`${namespace}:${ip}`, limit, windowMs);
  }
}
