-- ============================================================================
-- FIX: infinite recursion in org_members RLS policies
-- ============================================================================
-- members_self_read and members_admin_write (defined on org_members) each
-- contain a subquery that reads org_members from *within* a policy on
-- org_members itself. Postgres cannot resolve that — evaluating the policy
-- re-triggers the same policy on its own subquery, recursing until it gives
-- up with "infinite recursion detected in policy for relation org_members".
--
-- This isn't cosmetic: any query that needs to read org_members through RLS
-- hits it, including creating an organization (INSERT ... RETURNING on
-- organizations evaluates orgs_member_read, which subqueries org_members).
-- So org creation itself was broken.
--
-- Fix: route the membership checks through SECURITY DEFINER helper
-- functions. Like my_organizations() and accept_org_invite() already do in
-- SUPABASE_ORGANIZATIONS.sql, a SECURITY DEFINER function owned by postgres
-- reads org_members as the table owner, bypassing RLS — which breaks the
-- recursive chain instead of re-entering it.
--
-- Run this in the Supabase SQL editor after SUPABASE_ORGANIZATIONS.sql.
-- ============================================================================

CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members WHERE org_id = p_org_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION is_org_admin(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id AND user_id = p_user_id AND role IN ('owner', 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION is_org_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_admin(UUID, UUID) TO authenticated;

-- organizations
DROP POLICY IF EXISTS orgs_member_read ON organizations;
CREATE POLICY orgs_member_read ON organizations FOR SELECT
  USING (is_org_member(id, auth.uid()));

DROP POLICY IF EXISTS orgs_admin_update ON organizations;
CREATE POLICY orgs_admin_update ON organizations FOR UPDATE
  USING (is_org_admin(id, auth.uid()));

-- org_members — this is the one that was actually recursive
DROP POLICY IF EXISTS members_self_read ON org_members;
CREATE POLICY members_self_read ON org_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_org_member(org_id, auth.uid())
  );

DROP POLICY IF EXISTS members_admin_write ON org_members;
CREATE POLICY members_admin_write ON org_members FOR ALL
  USING (is_org_admin(org_id, auth.uid()))
  WITH CHECK (is_org_admin(org_id, auth.uid()));

-- org_invites
DROP POLICY IF EXISTS invites_admin_all ON org_invites;
CREATE POLICY invites_admin_all ON org_invites FOR ALL
  USING (is_org_admin(org_id, auth.uid()))
  WITH CHECK (is_org_admin(org_id, auth.uid()));

-- org_audit_log
DROP POLICY IF EXISTS audit_member_read ON org_audit_log;
CREATE POLICY audit_member_read ON org_audit_log FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

-- ============================================================================
-- DONE.
-- ============================================================================
