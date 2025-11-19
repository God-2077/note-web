import { Hono } from 'hono/tiny';
import { adminAuthMiddleware } from '../../auth/access-control';
import { Context } from 'hono';

import { kv } from './kv';
import { echoMiddleware } from '../../middleware/echoMiddleware';
import { echo } from './echo';

// 控制台
const manage = new Hono<{ Bindings: CloudflareBindings }>({
    strict: false
});
// KV 控制台路由
manage.get('/kv', adminAuthMiddleware, kv);

manage.use('/echo/*', echoMiddleware);

// 处理所有请求
manage.all('/echo/*',echo);

export { manage }