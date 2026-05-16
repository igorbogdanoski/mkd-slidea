-- ============================================================================
-- ФАЗА 8.3.6 — Presenter notes (PearDeck-style speaker notes)
-- ----------------------------------------------------------------------------
-- Додава `presenter_notes` TEXT колона на `polls` за приватни белешки
-- видливи само за хостот во Presenter view (toggle со 'N' клавиш).
-- ============================================================================

ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS presenter_notes TEXT;

-- Безбедност: postgres RLS веќе ограничува UPDATE на полот само за owner на event;
-- SELECT-от на presenter_notes за анонимни корисници (учесници) НЕ е сензитивен
-- бидејќи Presenter.jsx го прикажува само на host route, но за extra-strict
-- setup-и опционално може да се додаде column-level GRANT revoke од anon.

-- (Optional hardening — uncomment ако сакате полето да биде host-only:)
-- REVOKE SELECT (presenter_notes) ON polls FROM anon;
-- GRANT SELECT (presenter_notes) ON polls TO authenticated, service_role;
