
import { Context, Next } from 'hono';

const timing_header = async (c: Context, next: Next) => {
    const start = performance.now();
    await next();
    const end = performance.now();
    const timing = end - start; // duration of the subrequest to developers.cloudflare.com
    c.header('Timing', timing)
};

export { timing_header };