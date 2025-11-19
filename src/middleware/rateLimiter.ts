import { Context, Next } from 'hono';
import { rateLimitJsonResponse } from '../models/models';

const rateLimiterMiddleware = async (c: Context, next: Next) => {
    if (c.get('is_admin')) {
        c.set('is_rate_limited', false);
    } else {
        const rateLimitKey = `rate_limit:${c.req.header('cf-connecting-ip') ?? 'unknown'}`;
        const success = (await c.env.GUEST_RATE_LIMITER_10.limit({ key: rateLimitKey })).success &&
            (await c.env.GUEST_RATE_LIMITER_60.limit({ key: rateLimitKey })).success
        c.set('is_rate_limited', !success);

        if (!success) {
            return c.json(rateLimitJsonResponse, 429);
        }
    }
    await next();
};

export { rateLimiterMiddleware };