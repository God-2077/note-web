import { Hono } from 'hono/tiny';

const test_api = new Hono<{ Bindings: CloudflareBindings }>({
    strict: false
});


export { test_api }
