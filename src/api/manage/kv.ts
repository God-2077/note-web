import { Context } from 'hono';
import { defaultJsonResponse, JsonResponseType, mergeObject } from '../../models/models';

const kv = async (c: Context) => {
    const operation = c.req.query('operation');
    const key = c.req.query('key');
    const putvalue = c.req.query('value') || '';

    if (!operation) {
        return c.json(mergeObject(defaultJsonResponse, {
            code: 400,
            success: false,
            message: "operation is required"
        }) as JsonResponseType, 400);
    }

    if (!key && operation !== 'list') {
        return c.json(mergeObject(defaultJsonResponse, {
            code: 400,
            success: false,
            message: "key is required"
        }) as JsonResponseType, 400);
    }
    if (operation === 'put' && !putvalue) {
        return c.json(mergeObject(defaultJsonResponse, {
            code: 400,
            success: false,
            message: "value is required"
        }) as JsonResponseType, 400);
    }
    let value = null;
    switch (operation) {
        case 'get':
            value = await c.env.KV.get(key);
            return c.json(mergeObject(defaultJsonResponse, {
                code: 200,
                success: true,
                message: "success",
                date: {
                    operation: operation,
                    key: key,
                    value: value
                }
            }) as JsonResponseType, 200);
        case 'put':
            await c.env.KV.put(key, putvalue);
            value = await c.env.KV.get(key);
            return c.json(mergeObject(defaultJsonResponse, {
                code: 200,
                success: true,
                message: "success",
                date: {
                    operation: operation,
                    key: key,
                    value: value
                }
            }) as JsonResponseType, 200);
        case 'delete':
            await c.env.KV.delete(key);
            return c.json(mergeObject(defaultJsonResponse, {
                code: 200,
                success: true,
                date: {
                    operation: operation,
                    key: key,
                    value: null
                }
            }) as JsonResponseType, 200);
        case 'list':
            value = await c.env.KV.list();
            return c.json(mergeObject(defaultJsonResponse, {
                code: 200,
                success: true,
                message: "success",
                date: {
                    operation: operation,
                    key,
                    list: value
                }
            }) as JsonResponseType, 200);
        default:
            return c.json(mergeObject(defaultJsonResponse, {
                code: 400,
                success: false,
                message: "operation not found"
            }) as JsonResponseType, 400);
    }
}
export { kv }