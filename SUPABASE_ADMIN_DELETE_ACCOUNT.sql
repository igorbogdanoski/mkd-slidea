-- ============================================================================
-- Admin account deletion — "right to be forgotten" tooling. Previously the
-- Privacy Policy promised deletion "within 30 days" with no matching feature
-- (a mailto: link only) — this makes it a real, one-click admin action.
-- ----------------------------------------------------------------------------
-- events.user_id has NO ACTION on delete (would block deleting auth.users
-- directly if the user has any events), so events are deleted explicitly
-- first — this cascades to polls/options/votes/questions/reactions/
-- leaderboard/survey_responses. profiles, org_members, email_drip_log,
-- and the auth.* internal tables cascade automatically once auth.users is
-- deleted. community_templates/manual_orders/org_audit_log/org_invites/
-- organizations/search_logs reference the user with SET NULL — their rows
-- survive (audit trail / community content), just anonymized.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete accounts';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account through this tool';
  END IF;

  DELETE FROM public.events WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID) TO authenticated;
