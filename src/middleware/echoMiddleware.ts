import { Context } from 'hono';

const echoMiddleware = async (c: Context, next: () => Promise<any>) => {
    const contentType = c.req.header('Content-Type') || '';

    // 只处理非 GET/HEAD 请求
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
        try {
            // 对于 multipart/form-data 请求，获取 ArrayBuffer
            if (contentType.includes('multipart/form-data')) {
                const arrayBuffer = await c.req.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                c.set('rawBody', buffer.toString('base64'));
                c.set('isBase64Encoded', true);
            } else {
                // 其他类型请求获取文本
                const rawBody = await c.req.text();
                c.set('rawBody', rawBody);
                c.set('isBase64Encoded', false);
            }
        } catch (error) {
            c.set('rawBody', '');
            c.set('isBase64Encoded', false);
        }
    } else {
        c.set('rawBody', '');
        c.set('isBase64Encoded', false);
    }

    await next();
};

export { echoMiddleware }