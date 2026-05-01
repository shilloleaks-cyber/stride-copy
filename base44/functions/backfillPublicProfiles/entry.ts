import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const normalize = (email) => String(email || '').toLowerCase().trim();

  // Collect all data in parallel
  const [users, posts, comments, existingProfiles] = await Promise.all([
    base44.asServiceRole.entities.User.list(),
    base44.asServiceRole.entities.Post.list('-created_date', 500),
    base44.asServiceRole.entities.Comment.list('-created_date', 500),
    base44.asServiceRole.entities.PublicUserProfile.list('-updated_date', 500),
  ]);

  // Build existing profile map
  const existingMap = {};
  for (const p of existingProfiles) {
    if (p.user_email) existingMap[normalize(p.user_email)] = p;
  }

  // Build user map (email → user record)
  const userMap = {};
  for (const u of users) {
    if (u.email) userMap[normalize(u.email)] = u;
  }

  // Collect unique emails from all sources
  const emailSources = {}; // email → { displayName, avatarUrl }

  const addEmail = (email, displayName, avatarUrl) => {
    const key = normalize(email);
    if (!key) return;
    if (!emailSources[key]) {
      emailSources[key] = { displayName: null, avatarUrl: null };
    }
    if (displayName && !emailSources[key].displayName) {
      emailSources[key].displayName = displayName;
    }
    if (avatarUrl && !emailSources[key].avatarUrl) {
      emailSources[key].avatarUrl = avatarUrl;
    }
  };

  // From users
  for (const u of users) {
    const email = normalize(u.email);
    if (!email) continue;
    const displayName = u.display_name || u.full_name || null;
    const avatarUrl = u.avatar_url || u.profile_image || null;
    addEmail(email, displayName, avatarUrl);
  }

  // From posts (newest first already)
  for (const p of posts) {
    const email = normalize(p.author_email || p.created_by);
    if (!email) continue;
    const displayName = p.author_display_name || p.author_name || null;
    const avatarUrl = p.author_avatar_url || p.author_image || null;
    addEmail(email, displayName, avatarUrl);
  }

  // From comments (newest first already)
  for (const c of comments) {
    const email = normalize(c.author_email || c.created_by);
    if (!email) continue;
    const displayName = c.author_display_name || c.author_name || null;
    const avatarUrl = c.author_avatar_url || c.author_image || null;
    addEmail(email, displayName, avatarUrl);
  }

  const totalUnique = Object.keys(emailSources).length;
  const alreadyExisted = Object.keys(emailSources).filter(e => existingMap[e]).length;

  // Create missing profiles
  const toCreate = [];
  for (const [email, { displayName, avatarUrl }] of Object.entries(emailSources)) {
    if (existingMap[email]) continue; // skip existing

    // Try to get best display name from user map as final fallback
    const userRecord = userMap[email];
    const resolvedName =
      displayName ||
      userRecord?.display_name ||
      userRecord?.full_name ||
      email.split('@')[0];

    const resolvedAvatar = avatarUrl || userRecord?.avatar_url || userRecord?.profile_image || null;

    toCreate.push({ email, resolvedName, resolvedAvatar });
  }

  // Create in batches of 10
  let created = 0;
  const errors = [];
  for (let i = 0; i < toCreate.length; i += 10) {
    const batch = toCreate.slice(i, i + 10);
    await Promise.all(
      batch.map(({ email, resolvedName, resolvedAvatar }) =>
        base44.asServiceRole.entities.PublicUserProfile.create({
          user_email: email,
          display_name: resolvedName,
          avatar_url: resolvedAvatar,
        }).then(() => { created++; }).catch(err => errors.push({ email, error: err.message }))
      )
    );
  }

  return Response.json({
    success: true,
    stats: {
      total_unique_emails: totalUnique,
      already_existed: alreadyExisted,
      newly_created: created,
      errors: errors.length > 0 ? errors : undefined,
    },
    resolution_status: {
      feed_display_names: 'resolved via PublicUserProfile map',
      comments_display_names: 'resolved via PublicUserProfile map',
      search_avatars: 'resolved via PublicUserProfile map',
    },
  });
});