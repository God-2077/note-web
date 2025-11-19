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



    // 构建更新数据
    const updatedData = mergeObject(existingNote, {
        title: body.title ?? existingNote.title,
        content: body.content ?? existingNote.content,
        length: body.content.length ?? existingNote.length,
        textType: body.textType ?? existingNote.textType,
        mimeType: body.mimeType ?? existingNote.mimeType,
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