import { describe, it, expect, beforeEach, vi } from 'vitest';

// The offline queue's whole job is that a vote cast without connectivity is
// eventually *counted*, not merely recorded. `votes` rows are idempotent;
// the aggregate increments are not — so these tests pin down both that the
// increments are replayed and that they are never replayed twice.
//
// The audit row goes through claim_vote_graded(), not through the table. That
// is not a style choice: anon has no UPDATE privilege on `votes`, and an upsert
// is INSERT … ON CONFLICT DO UPDATE, which the planner checks for UPDATE
// whether or not a conflict occurs. Writing to the table directly answered
// 42501 on every replay, so the queued vote never arrived — `upsert` is
// asserted absent here so that cannot quietly come back.

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

const row = { poll_id: 'p1', session_id: 's1', username: 'Ана', answer_text: 'A', option_id: 'opt-1' };

/** Increments resolve clean; claim_vote_graded reports a fresh row unless a test says otherwise. */
const happyRpc = async (name) =>
  name === 'claim_vote_graded' ? { data: true, error: null } : { data: null, error: null };

const rpcNames = () => rpc.mock.calls.map(([name]) => name);

describe('offlineQueue replay', () => {
  beforeEach(() => {
    localStorage.clear();
    rpc.mockReset();
    upsert.mockReset();
    rpc.mockImplementation(happyRpc);
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it('replays the aggregate increment, not just the votes row', async () => {
    queueVote({ row, ops: [{ kind: 'option', optionId: 'o1' }] });
    await flushQueue();

    expect(rpc).toHaveBeenCalledWith('increment_vote', { option_id: 'o1' });
    expect(rpcNames()).toContain('claim_vote_graded');
    expect(pendingCount()).toBe(0);
  });

  it('claims the audit row through claim_vote_graded, never through the table', async () => {
    queueVote({ row, ops: [{ kind: 'option', optionId: 'o1' }] });
    await flushQueue();

    expect(upsert).not.toHaveBeenCalled();
    // The option id goes up, not a verdict. Grading against a key the caller
    // cannot read is the whole point of the _graded function; sending
    // is_correct from here would put the caller back in charge of its own score.
    expect(rpc).toHaveBeenCalledWith('claim_vote_graded', {
      p_poll_id: 'p1',
      p_session_id: 's1',
      p_username: 'Ана',
      p_answer_text: 'A',
      p_option_id: 'opt-1',
    });
  });

  it('keeps the item queued and skips the votes row when the increment fails', async () => {
    rpc.mockImplementation(async (name) =>
      name === 'claim_vote_graded' ? { data: true, error: null } : { data: null, error: { message: 'network' } });
    queueVote({ row, ops: [{ kind: 'option', optionId: 'o1' }] });

    await flushQueue();

    expect(rpcNames()).not.toContain('claim_vote_graded');
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
    rpc.mockImplementation(async (name, args) => {
      if (name === 'claim_vote_graded') return { data: true, error: null };
      return args.option_id === 'o1'
        ? { data: null, error: null }
        : { data: null, error: { message: 'network' } };
    });
    await flushQueue();

    expect(rpcNames().filter((n) => n !== 'claim_vote_graded')).toEqual([
      'increment_vote_weighted',
      'increment_vote_weighted',
    ]);
    expect(readQueue()[0].ops).toEqual([ops[1], ops[2]]);

    // Second flush: only the two survivors run — o1 must not be double-counted.
    rpc.mockReset();
    rpc.mockImplementation(happyRpc);
    await flushQueue();

    expect(rpc.mock.calls.filter(([n]) => n !== 'claim_vote_graded').map(([, args]) => args.option_id))
      .toEqual(['o2', 'o3']);
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

    expect(rpcNames()).toEqual(['claim_vote_graded']);
    expect(upsert).not.toHaveBeenCalled();
    expect(pendingCount()).toBe(0);
  });

  it('treats an already-claimed row as a finished replay, not a failure', async () => {
    // claim_vote_graded answers false when the UNIQUE(poll_id, session_id) row is
    // already there. That is the state a repeated flush lands in, and retrying
    // it forever would pin the vote to the queue for the life of the browser.
    rpc.mockImplementation(async () => ({ data: false, error: null }));
    queueVote({ row, ops: [{ kind: 'option', optionId: 'o1' }] });

    await flushQueue();

    expect(pendingCount()).toBe(0);
  });

  it('retries only the claim when the increments landed but the claim failed', async () => {
    // Aggregates run first, so by the time claim_vote_graded fails the count has
    // already moved. Leaving the op on the item would count it a second time
    // on the next flush; leaving the item out entirely would lose the audit
    // row. It has to stay, with nothing owed but the claim.
    rpc.mockImplementation(async (name) =>
      name === 'claim_vote_graded'
        ? { data: null, error: { message: 'Failed to fetch' } }
        : { data: null, error: null });
    queueVote({ row, ops: [{ kind: 'option', optionId: 'o1' }] });

    await flushQueue();

    expect(pendingCount()).toBe(1);
    expect(readQueue()[0].ops).toEqual([]);

    rpc.mockReset();
    rpc.mockImplementation(happyRpc);
    await flushQueue();

    expect(rpcNames()).toEqual(['claim_vote_graded']);
    expect(pendingCount()).toBe(0);
  });
});
