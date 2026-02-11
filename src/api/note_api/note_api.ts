import { Hono } from 'hono/tiny';
import { guest_visitAuthMiddleware, adminAuthMiddleware } from '../../auth/access-control';
import { getClientIp, getConnInfo } from '../../utils/getIp';
import { mergeObject, defaultJsonResponse, JsonResponseType } from '../../models/models';

import { createNote } from './createNote';
import { updateNote } from './updateNote';
import { getNote } from './getNote';
import { deleteNote } from './deleteNote';
import { listNote } from './listNote';
import { searchNote } from './searchNote';
import { verifyAdmin } from './verifyAdmin'
import { getVersion } from './getVersion';
import { getFolders } from './getFolders'

const note_api = new Hono<{ Bindings: CloudflareBindings }>({
    strict: false
});

note_api.use(guest_visitAuthMiddleware);

// 根路由，返回一些基本信息
note_api.get('/', (c) => {
    const user_agent = c.req.header('User-Agent') || null;
    const requestId = c.get("requestId") || null;
    return c.json(mergeObject(defaultJsonResponse, {
        code: 200,
        success: true,
        message: "successfully",
        data: {
            requestId,
            ip: getClientIp(c),
            user_agent,
            getConnInfo: getConnInfo(c)
        }
    }) as JsonResponseType, 200);
    // return c.text("Hello, World!")
})


note_api.on(["PUT", "POST"], '/create', adminAuthMiddleware, createNote)

// 更新 note
note_api.on(["PUT", "POST"], '/update/:id', adminAuthMiddleware, updateNote);


note_api.on('GET', ['/notes/:id', '/notes/:id/raw', '/notes/:id/raw/*'], getNote);

// 删除 note
note_api.on(["DELETE", "GET"], '/delete/:id', adminAuthMiddleware, deleteNote);

// list note
note_api.get('/list', listNote);

// 获取所有文件夹
note_api.get('/folders', getFolders);

// 搜索路由
note_api.get('/search', searchNote);

// 密码验证路由
note_api.get('/verify-admin', verifyAdmin)

// 版本信息
note_api.get('/version', getVersion);

export { note_api }