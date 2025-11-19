import { Context } from 'hono';

const echo = async (c: Context) => {
    // 获取查询参数
    const url = new URL(c.req.url);
    const args = {};
    url.searchParams.forEach((value, key) => {
        args[key] = value;
    });

    // 获取请求头
    const headers = {};
    c.req.raw.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
    });

    // 构建响应数据
    const responseData = {
        method: c.req.method,
        args: args,
        data: c.get('rawBody') || '',
        headers: headers,
        path: url.pathname,
        isBase64Encoded: c.get('isBase64Encoded') || false
    };
    return c.json(responseData);
};

export { echo };