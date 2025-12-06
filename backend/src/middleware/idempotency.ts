import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

const IDEMPOTENCY_TTL_HOURS = 24;

export async function idempotencyCheck(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // Only apply to POST/PUT/PATCH requests
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] as string;
  
  if (!idempotencyKey) {
    // Not required, but recommended for critical operations
    return next();
  }

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required for idempotency' });
  }

  try {
    // Check if we've seen this key before
    const { data: existing } = await supabaseAdmin
      .from('request_idempotency')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existing && new Date(existing.expires_at) > new Date()) {
      // Return cached response
      return res.status(200).json(existing.response);
    }

    // Store the key (will be updated with response after processing)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_TTL_HOURS);

    await supabaseAdmin
      .from('request_idempotency')
      .upsert({
        idempotency_key: idempotencyKey,
        user_id: userId,
        endpoint: req.path,
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'idempotency_key',
      });

    // Attach to request for later use
    (req as any).idempotencyKey = idempotencyKey;
    (req as any).storeIdempotencyResponse = async (response: any) => {
      await supabaseAdmin
        .from('request_idempotency')
        .update({ response })
        .eq('idempotency_key', idempotencyKey);
    };

    next();
  } catch (error) {
    console.error('Idempotency check error:', error);
    // Don't block request on idempotency errors
    next();
  }
}


