

import { Context } from 'hono'
import { generateId } from '../../utils/generateId';
import { getClientIp } from '../../utils/getIp';
import { db_index } from '../../db/db-index-util';
import { mergeObject, defaultJsonResponse, NoteType, defaultNote, defaultNoteIndexItem, NoteIndexItemType, JsonResponseType } from '../../models/models';

const createNote = async (c: Context) => {
    // app.all('/create', async (c: Context) => {
    const user_agent = c.req.header('User-Agent');
    const id = generateId();
    const now = new Date().getTime();
    const ip = getClientIp(c);

    let body = null;
    try {
        body = await c.req.json();
    } catch (error) {
        return c.json(mergeObject(defaultJsonResponse, {
            code: 400,
            success: false,
            message: 'Request body is required'
        }) as JsonResponseType, 400);
    }

    // 过期时间，单位为秒，不支持未来少于 60 秒的过期目标
    let expiration = null;
    if (body.expiration || body.expirationTtl) {
        if (body.expiration) {
            // expiration = ((body.expiration).toString()).slice(0, 10);
            expiration = Number(body.expiration) * 1000;
        } else {
            expiration = now + Number(body.expirationTtl) * 1000;
        }
        expiration = parseInt(expiration);
        if (expiration < (now + 60 * 1000)) {
            return c.json(mergeObject(defaultJsonResponse, {
                code: 400,
                success: false,
                message: 'Expiration targets that are less than 60 seconds into the future are not supported.'
            }) as JsonResponseType, 400);
        }
    }

    // 处理文件夹
    const folders = (function () {
        // 1. 获取查询参数并确保为字符串类型
        const folder_raw: string[] = body.folders ?? [];
        // 2. 定义需要排除的关键词（小写，集合查询效率更高）
        const excludeSet: Set<string> = new Set(['', 'all', 'uncat', 'uncategorized']);
        // 3. 拆分 + 一次过滤（兼顾大小写 + 去重）
        const folderList: string[] = folder_raw
            .map((f: string) => f.trim().toLowerCase()) // 统一转小写
            .filter((f: string) => !excludeSet.has(f));
        // 4. 可选：去重（根据业务需求决定是否保留）
        const uniqueFolderList = [...new Set(folderList)];
        return uniqueFolderList;
    })();

    const data = mergeObject(defaultNote, {
        id: id,
        title: body.title ?? body.content?.substring(0, 60) ?? "Untitled",
        content: body.content ?? "",
        length: body.length ?? NaN,
        textType: body.textType ?? "markdown",
        mimeType: body.mimeType ?? "text/markdown", // 新增 mime 类型
        folders: folders,
        ip: ip ?? null,
        user_agent: user_agent ?? "Unknown",
        encryption: body.password ? true : false,
        password: body.password ?? null,
        createdAt: now ?? null,
        updatedAt: now ?? null,
        expiration: expiration ?? null
    }) as NoteType;

    data.length = data.content.length;
    // 写入 note
    if (expiration) {
        await c.env.KV.put(`note:${id}`, JSON.stringify(data), {
            expiration: Math.round(expiration / 1000)
        });
    } else {
        await c.env.KV.put(`note:${id}`, JSON.stringify(data));
    }
    // 写入 db-index
    await db_index.note.put(c, id, mergeObject(defaultNoteIndexItem, {
        id: data.id,
        title: data.title,
        length: data.length,
        textType: data.textType,
        mimeType: data.mimeType,
        folders: data.folders,
        encryption: data.encryption,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        expiration: data.expiration
    }) as NoteIndexItemType);
    return c.json(mergeObject(defaultJsonResponse, {
        code: 201,
        success: true,
        message: "Created successfully",
        data: {
            id: data.id,
            title: data.title,
            length: data.length
        }
    }) as JsonResponseType, 201)
}

export { createNote }