import { describe, it, expect } from 'vitest';
import { POLL_COLUMNS, OPTION_COLUMNS, POLLS_WITH_OPTIONS } from '../lib/pollColumns';

// These exist because the call sites they replaced were `select('*, options(*)')`,
// and a wildcard is not neutral here: polls.embedding is a 1536-float pgvector
// column that only the server-side RAG endpoints use, and nothing in src/ reads.
// On the largest event measured it was 93% of the payload a participant's phone
// downloaded — on init, on every realtime change to options (so on every vote,
// for every phone in the room) and again on a 6-second fallback.
//
// A test is worth having because the failure mode of reverting this is invisible:
// everything still works, it is simply 15x heavier, and the cost lands on a
// classroom of phones and one self-hosted database.
describe('pollColumns', () => {
  const pollCols = POLL_COLUMNS.split(',').map((s) => s.trim());
  const optionCols = OPTION_COLUMNS.split(',').map((s) => s.trim());

  it('never asks for the embedding column', () => {
    expect(pollCols).not.toContain('embedding');
    expect(POLLS_WITH_OPTIONS).not.toMatch(/embedding/);
  });

  it('is not a wildcard', () => {
    // `*` would silently re-admit embedding, and would also turn any future
    // REVOKE into a 42501 that fails the whole request instead of omitting the
    // column — which is how the host screen stopped loading on 2026-08-06.
    expect(POLLS_WITH_OPTIONS).not.toMatch(/\*/);
  });

  it('carries every column the participant and presenter screens read', () => {
    // The reveal flag, the timer, moderation, the survey sub-questions and the
    // branding all come off this one read.
    for (const col of [
      'id', 'event_id', 'question', 'type', 'is_quiz', 'position',
      'answer_revealed', 'results_visible', 'needs_moderation', 'survey_questions',
      'timer_ends_at', 'presenter_notes', 'curriculum_tags', 'cover_url', 'cover_meta',
    ]) {
      expect(pollCols, col).toContain(col);
    }
  });

  it('does not carry the answer key', () => {
    // These are what poll_answer_key() and participant_blanks() hand out instead,
    // and only once the host has revealed. Leaving them in this list would not
    // merely undo that: the REVOKE in SUPABASE_ANSWER_KEY_SCOPED.sql turns a
    // named-but-unreadable column into a 42501 that fails the entire fetch, which
    // is a blank screen for every participant rather than a missing answer.
    for (const col of ['blanks', 'correct_answer', 'answer_explanation', 'embedding']) {
      expect(pollCols, col).not.toContain(col);
    }
  });

  it('carries every column an option button or chart reads', () => {
    for (const col of ['id', 'poll_id', 'text', 'votes', 'label', 'is_approved']) {
      expect(optionCols, col).toContain(col);
    }
  });

  it('does not carry the quiz answer sheet', () => {
    // quiz_verdict() returns the verdict and the correct option id, and only to a
    // session that has a votes row for that activity.
    expect(optionCols).not.toContain('is_correct');
  });

  it('embeds options inside the polls select', () => {
    expect(POLLS_WITH_OPTIONS).toMatch(/options\(/);
    expect(POLLS_WITH_OPTIONS).toContain(OPTION_COLUMNS);
  });

  it('has no duplicate or empty entries', () => {
    // A duplicate column makes PostgREST answer 42002, and an empty entry from a
    // trailing comma fails the same way — both blank the screen rather than warn.
    for (const [name, cols] of [['polls', pollCols], ['options', optionCols]]) {
      expect(cols.every((c) => c.length > 0), `${name} has an empty entry`).toBe(true);
      expect(new Set(cols).size, `${name} has a duplicate`).toBe(cols.length);
    }
  });
});
