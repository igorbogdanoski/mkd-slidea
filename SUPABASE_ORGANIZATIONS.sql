-- ============================================================================
-- ФАЗА 8.4.1 — Organizations / училишни и корпоративни sub-accounts
-- ----------------------------------------------------------------------------
-- Цел: едно училиште / НВО / фирма да може да има повеќе наставници / hostови
--       под единствен план, со билинг и админ контрола.
--
-- Минимален скелет (UI integration може постепено).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────
-- 1) organizations
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  domain TEXT,                              -- e.g. 'sou-gimnazija.edu.mk' за SSO allowlist
  plan TEXT NOT NULL DEFAULT 'free',        -- free | school | enterprise
  seats INT NOT NULL DEFAULT 5,
  brand_color TEXT,
  brand_font TEXT,
  logo_url TEXT,
  custom_domain TEXT,
  billing_email TEXT,
  vat_number TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orgs_domain ON organizations(domain);

-- ─────────────────────────────────────────────────────────────────
-- 2) org_members (joiner со улоги)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS org_members (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',      -- owner | admin | member | viewer
  invited_email TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);

-- ─────────────────────────────────────────────────────────────────
-- 3) org_invites (pending email invites)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS org_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_id, email)
);

CREATE INDEX IF NOT EXISTS idx_org_invites_email ON org_invites(email);

-- ─────────────────────────────────────────────────────────────────
-- 4) audit_log (за SaaS зрелост)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS org_audit_log (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  actor UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_org_time ON org_audit_log(org_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- 5) events.org_id (опционално прикачување на event кон org)
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_org ON events(org_id);

-- ─────────────────────────────────────────────────────────────────
-- 6) RLS
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_audit_log ENABLE ROW LEVEL SECURITY;

-- Members can read their orgs
DROP POLICY IF EXISTS orgs_member_read ON organizations;
CREATE POLICY orgs_member_read ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = organizations.id AND m.user_id = auth.uid()
    )
  );

-- Owner/admin can update
DROP POLICY IF EXISTS orgs_admin_update ON organizations;
CREATE POLICY orgs_admin_update ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );

-- Authenticated users can insert (creator becomes owner via trigger below)
DROP POLICY IF EXISTS orgs_authed_insert ON organizations;
CREATE POLICY orgs_authed_insert ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Members read their own membership rows
DROP POLICY IF EXISTS members_self_read ON org_members;
CREATE POLICY members_self_read ON org_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM org_members m2
      WHERE m2.org_id = org_members.org_id AND m2.user_id = auth.uid()
    )
  );

-- Owner/admin manage members
DROP POLICY IF EXISTS members_admin_write ON org_members;
CREATE POLICY members_admin_write ON org_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members m2
      WHERE m2.org_id = org_members.org_id
        AND m2.user_id = auth.uid()
        AND m2.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members m2
      WHERE m2.org_id = org_members.org_id
        AND m2.user_id = auth.uid()
        AND m2.role IN ('owner', 'admin')
    )
  );

-- Invites: admins manage, invitee can read by email
DROP POLICY IF EXISTS invites_admin_all ON org_invites;
CREATE POLICY invites_admin_all ON org_invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = org_invites.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = org_invites.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );

-- Audit: members read, no client write (server only)
DROP POLICY IF EXISTS audit_member_read ON org_audit_log;
CREATE POLICY audit_member_read ON org_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = org_audit_log.org_id AND m.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- 7) Trigger: при создавање на org, creator => owner
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION on_organization_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO org_members (org_id, user_id, role)
      VALUES (NEW.id, NEW.created_by, 'owner')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_created ON organizations;
CREATE TRIGGER trg_org_created
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION on_organization_created();

-- ─────────────────────────────────────────────────────────────────
-- 8) RPC: my_organizations() — листа на org-и за тековен корисник
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION my_organizations()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  plan TEXT,
  seats INT,
  role TEXT,
  member_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT
    o.id, o.name, o.slug, o.plan, o.seats, m.role,
    (SELECT COUNT(*) FROM org_members mm WHERE mm.org_id = o.id) AS member_count
  FROM organizations o
  JOIN org_members m ON m.org_id = o.id AND m.user_id = uid
  ORDER BY o.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION my_organizations() TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 9) RPC: accept_org_invite(token)
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION accept_org_invite(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  v_invite org_invites%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT * INTO v_invite FROM org_invites
    WHERE token = p_token
      AND accepted_at IS NULL
      AND expires_at > NOW();
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_or_expired'; END IF;

  INSERT INTO org_members (org_id, user_id, role)
    VALUES (v_invite.org_id, uid, COALESCE(v_invite.role, 'member'))
    ON CONFLICT DO NOTHING;

  UPDATE org_invites SET accepted_at = NOW() WHERE id = v_invite.id;
  RETURN v_invite.org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_org_invite(TEXT) TO authenticated;

-- ============================================================================
-- DONE.
-- ============================================================================
