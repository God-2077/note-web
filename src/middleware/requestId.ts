import { Context, Next } from 'hono';

const requestId = async (c: Context, next: Next) => {
    const id = crypto.randomUUID()
    c.header('X-Request-Id', id);
    c.set('requestId', id);
    await next();
};

export { requestId };