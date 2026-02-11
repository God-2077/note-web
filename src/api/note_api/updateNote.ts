import { Context } from 'hono';
import { defaultJsonResponse, defaultNote, defaultNoteIndexItem, JsonResponseType, mergeObject, NoteIndexItemType, NoteType } from '../../models/models';
import { db_index } from '../../db/db-index-util';

const updateNote = async (c: Context) => {
    const id = c.req.param('id');
    const now = new Date().getTime();

    // 验证笔记ID是否存在
    const existingNote_b = await c.env.KV.get(`note:${id}`, 'json');
    if (!existingNote_b) {
        return c.json(mergeObject(defaultJsonResponse, {
            code: 404,
            success: false,
            message: 'Note not found'
        }) as JsonResponseType, 404);
    }
    const existingNote = mergeObject(defaultNote, existingNote_b) as NoteType;

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

    // 处理过期时间
    let expiration = existingNote.expiration || null;
    if (body.expiration || body.expirationTtl) {
        if (body.expiration) {
            expiration = Number(body.expiration) * 1000;
        } else {
            expiration = now + Number(body.expirationTtl) * 1000;
        }
        // expiration = Number(expiration);
        if (expiration < (now + 60 * 1000)) {
            return c.json(mergeObject(defaultJsonResponse, {
                code: 400,
                success: false,
                message: 'Expiration targets that are less than 60 seconds into the future are not supported.'
            }) as JsonResponseType, 400);
        }
    } else {
        expiration = null;
    }

    // 处理文件夹
    const folders = (function () {
        // 0. 如果未提供新文件夹列表，保持原文件夹不变
        if (!body.folders) {
            return existingNote.folders;
        }
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

    // 构建更新数据
    const updatedData = mergeObject(existingNote, {
        title: body.title ?? existingNote.title,
        content: body.content ?? existingNote.content,
        length: body.content.length ?? existingNote.length,
        textType: body.textType ?? existingNote.textType,
        mimeType: body.mimeType ?? existingNote.mimeType,
        folders: folders ?? existingNote.folders,
        encryption: body.password ? true : false,
        password: body.password ?? null,
        updatedAt: now,
        expiration: expiration
    }) as NoteType;


    // 更新KV存储
    const putOptions = expiration ? {
        expiration: Math.round(expiration / 1000)
    } : {};
    await c.env.KV.put(`note:${id}`, JSON.stringify(updatedData), putOptions);

    // 更新db-index
    await db_index.note.put(c, id, mergeObject(defaultNoteIndexItem, {
        id: id,
        title: updatedData.title,
        length: updatedData.length,
        textType: updatedData.textType,
        mimeType: updatedData.mimeType,
        folders: updatedData.folders,
        encryption: updatedData.encryption,
        createdAt: existingNote.createdAt,
        updatedAt: now,
        expiration: expiration
    }) as NoteIndexItemType);

    return c.json(mergeObject(defaultJsonResponse, {
        code: 200,
        success: true,
        message: "Updated successfully",
        data: {
            id: id,
            title: updatedData.title,
            length: updatedData.length
        }
    }) as JsonResponseType, 200);
}

export { updateNote }