// import { Hono } from 'hono/tiny';
import { Context, Next } from "hono";
import { defaultJsonResponse, invalidtokenJsonResponse, mergeObject} from '../models/models';

// 配置
// let security = {
//     admin_token: null,
//     guest_visit: true
// }


// 中间件：认证检查
const authMiddleware = async (c: Context, next: Next) => {
    const token = c.req.header('X-Token') || c.req.query('token');

    const admin_token = c.env.ADMIN_TOKEN ?? '123456';
    const guest_visit = c.env.GUEST_VISIT == 1 ? true : false;

    const is_admin = token == admin_token;

    // 设置上下文变量，用于后续路由使用
    c.set('is_admin', is_admin);
    c.set('guest_visit', guest_visit);

    await next();
};

const guest_visitAuthMiddleware = async(c: Context, next: Next) => {
    // 没有 admin_token，跳过检查，直接放行
    // 没有 guest_visit，也没有 admin_token，拒绝访问
    if (!c.get('is_admin') && !c.get('guest_visit')) {
        return c.json(invalidtokenJsonResponse, 401);
    }

    await next();
}

const adminAuthMiddleware = async (c: Context, next: Next) => {
    const is_admin = c.get('is_admin');
    if (!is_admin) {
        return c.json(invalidtokenJsonResponse, 401);
    }
    await next();
};

export {
    authMiddleware,
    guest_visitAuthMiddleware,
    adminAuthMiddleware
}