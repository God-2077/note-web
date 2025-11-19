import { Context } from 'hono';
import { defaultJsonResponse, JsonResponseType, mergeObject } from '../../models/models';

const verifyAdmin = async (c: Context) => {
    const isValid = c.get('is_admin');
    return c.json(mergeObject(defaultJsonResponse, {
        code: 200,
        success: true,
        message: `Admin access ${isValid ? 'granted' : 'denied'}`,
        data: {
            is_admin: isValid
        }
    }) as JsonResponseType);
}

export { verifyAdmin }