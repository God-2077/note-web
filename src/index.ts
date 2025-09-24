// import {
    // Hono
// } from 'hono/tiny';
// import { Context, Env, ExecutionContext, Next } from 'hono';
import { Request, ScheduledController } from '@cloudflare/workers-types';
import { app as backend_api } from './backend_api';

// const app = new Hono();

// app.route('/api', backend_api);

export default {
    fetch(request: Request, env: Env, ctx: ExecutionContext) {
        return backend_api.fetch(request, env, ctx)
    },
}