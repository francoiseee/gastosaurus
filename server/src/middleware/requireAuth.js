import { HttpError } from '../utils/HttpError.js';
import { verifySupabaseToken } from '../lib/verifySupabaseToken.js';

/**
 * Put this in front of any route that needs a logged-in user.
 * Reads "Authorization: Bearer <supabase access token>" and sets
 * req.user = { id, email, name }  (id = auth.users.id = profiles.id)
 *
 *   router.get('/groups', requireAuth, groupsController.list)
 */
export async function requireAuth(req, _res, next) {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  const user = scheme?.toLowerCase() === 'bearer' ? await verifySupabaseToken(token) : null;
  if (!user) throw HttpError.unauthorized();
  req.user = user;
  next();
}
