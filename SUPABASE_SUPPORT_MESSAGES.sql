-- ============================================================================
-- In-app support/feedback channel — previously the only path was a mailto:
-- link in the footer, which loses all app/user context. This table stores
-- submissions from the in-app widget (src/components/SupportWidget.jsx);
-- api/support-message.js also emails BILLING_EMAIL a copy via Resend.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  message TEXT NOT NULL,
  page_url TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_messages_created_at_idx ON public.support_messages (created_at DESC);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_messages_admin_read ON public.support_messages;
CREATE POLICY support_messages_admin_read ON public.support_messages FOR SELECT USING (public.is_admin());

-- No client INSERT policy: writes go through api/support-message.js using the
-- service-role key, so the endpoint controls rate limiting and validation.
