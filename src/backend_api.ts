import { Hono } from 'hono/tiny';
import { prettyJSON } from 'hono/pretty-json';
import { cors } from 'hono/cors';
import { showRoutes } from 'hono/dev';
import { timeout } from 'hono/timeout';
import { etag } from 'hono/etag';

// middleware
import { no_cache_header } from './middleware/no_cache_header';
import { requestId } from './middleware/requestId';
import { date_header } from './middleware/date_header';
import { timing_header } from './middleware/timing_header';
import { rateLimiterMiddleware } from './middleware/rateLimiter';

// auth
import { authMiddleware } from './auth/access-control';

// models
import { JsonResponseType, defaultErrorJsonResponse, mergeObject, notFoundJsonResponse } from './models/models';

// api
import { note_api } from './api/note_api/note_api';
import { test_api } from './api/test_api/test_api';
import { manage } from './api/manage/manage';



const app = new Hono<{ Bindings: CloudflareBindings }>({
    strict: false
});

// rate limiter

app.use(timing_header);
app.use(cors());
app.use(authMiddleware);
app.use(rateLimiterMiddleware);
app.use(timeout(10000));
app.use(etag());
app.use(no_cache_header);
app.use(requestId);
app.use(date_header);
app.use(prettyJSON({ query: '' })); // 必须最后


app.notFound((c) => {
    return c.json(notFoundJsonResponse, 404)
})
app.onError((err, c) => {
    globalThis.console.error(`${err.stack}`);
    return c.json(mergeObject(defaultErrorJsonResponse, {
        code: 500,
        success: false,
        message: err.message,
        error: {
            message: err.message,
            stack: c.get('is_admin') ? err.stack : "null (Admin access required)"
        }
    }) as JsonResponseType, 500)
})




app.route('/test', test_api);
app.route('/api', note_api);
app.route('/manage', manage);


showRoutes(app, {
    verbose: true,
    colorize: true
})




export { app }
