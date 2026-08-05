import { describe, it, expect, beforeEach, vi } from 'vitest';

// The offline queue's whole job is that a vote cast without connectivity is
// eventually *counted*, not merely recorded. `votes` rows are idempotent;
// the aggregate increments are not — so these tests pin down both that the
// increments are replayed and that they are never replayed twice.

const rpc = vi.fn();
const upsert = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: (...args) => rpc(...args),
    from: () => ({ upsert: (...args) => upsert(...args) }),
  },
}));

const { queueVote, flushQueue, pendingCount } = await import('../lib/offlineQueue');

const STORAGE_KEY = 'mkd_slidea_pending_votes_v1';
const readQueue = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

const row = { poll_id: 'p1', session_id: 's1', username: 'Ана', answer_text: 'A', is_correct: null };

describe('offlineQueue replay', () => {
  beforeEach(() => {
    localStorage.clear();
    rpc.mockReset();
    upsert.mockReset();
    rpc.mockResolvedValue({ error: null });
    upsert.mockResolvedValue({ error: null });
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it('replays the aggregate increment, not just the votes row', async () => {
    queueVote({ row, ops: [{ kind: 'option', optionId: 'o1' }] });
    await flushQueue();

    expect(rpc).toHaveBeenCalledWith('increment_vote', { option_id: 'o1' });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(pendingCount()).toBe(0);
  });

  it('keeps the item queued and skips the votes row when the increment fails', async () => {
    rpc.mockResolvedValue({ error: { message: 'network' } });
    queueVote({ row, ops: [{ kind: 'option', optionId: 'o1' }] });

    await flushQueue();

    expect(upsert).not.toHaveBeenCalled();
    expect(pendingCount()).toBe(1);
    expect(readQueue()[0].ops).toEqual([{ kind: 'option', optionId: 'o1' }]);
  });

  it('never replays an increment that already landed (partial ranking flush)', async () => {
    const ops = [
      { kind: 'weighted', optionId: 'o1', weight: 3 },
      { kind: 'weighted', optionId: 'o2', weight: 2 },
      { kind: 'weighted', optionId: 'o3', weight: 1 },
    ];
    queueVote({ row, ops });

    // First flush: o1 lands, o2 dies with the connection.
    rpc.mockResolvedValueOnce({ error: null }).mockResolvedValue({ error: { message: 'network' } });
    await flushQueue();

    expect(rpc).toHaveBeenCalledTimes(2);
    expect(readQueue()[0].ops).toEqual([ops[1], ops[2]]);

    // Second flush: only the two survivors run — o1 must not be double-counted.
    rpc.mockReset();
    rpc.mockResolvedValue({ error: null });
    await flushQueue();

    expect(rpc.mock.calls.map(([, args]) => args.option_id)).toEqual(['o2', 'o3']);
    expect(pendingCount()).toBe(0);
  });

  it('replays text votes through the vote-text endpoint', async () => {
    queueVote({ row, ops: [{ kind: 'text', pollId: 'p1', text: 'иновација' }] });
    await flushQueue();

    expect(global.fetch).toHaveBeenCalledWith('/api/vote-text', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ pollId: 'p1', text: 'иновација' });
    expect(pendingCount()).toBe(0);
  });

  it('still flushes legacy items queued without ops', async () => {
    queueVote({ row });
    await flushQueue();

    expect(rpc).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(pendingCount()).toBe(0);
  });
});
