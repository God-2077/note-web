import { Context, Next } from 'hono';

const date_header = async (c: Context, next: Next) => {
    const date = new Date().toUTCString();
    c.header('Date', date);
    await next();
}

export { date_header };
