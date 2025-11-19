import { Context } from 'hono';
import { defaultJsonResponse, mergeObject, JsonResponseType, defaultNote, NoteType} from '../../models/models';
import { rawHandle } from './rawHandle';

const getNote = async (c: Context) => {
    const id = c.req.param('id');
    const password = c.req.query('pwd');
    const noteRaw = await c.env.KV.get(`note:${id}`);
    if (!noteRaw || noteRaw.isDeleted) {
        return c.json(mergeObject(defaultJsonResponse, {
            code: 404,
            success: false,
            message: 'Note not found'
        }) as JsonResponseType, 404);
    }

    const note = mergeObject(defaultNote, JSON.parse(noteRaw)) as NoteType;
    if (note.encryption && !c.get('is_admin')) {
        if (!password) {
            return c.json(mergeObject(defaultJsonResponse, {
                code: 401,
                success: false,
                message: 'Encrypted content, password required'
            }) as JsonResponseType, 401);
        }

        if (password !== note.password) {
            return c.json(mergeObject(defaultJsonResponse, {
                code: 401,
                success: false,
                message: 'Incorrect password'
            }) as JsonResponseType, 401);
        }
    }

    if (!c.get('is_admin')) {
        note.ip = null;
        note.user_agent = null
    }

    // 正则匹配 /api/notes/*/raw/* 或 /api/notes/*/raw
    const isRaw = c.req.path.match(/^\/api\/notes\/[a-zA-Z0-9]+\/raw\/.*/) || c.req.path.match(/^\/api\/notes\/[a-zA-Z0-9]+\/raw/);

    if (isRaw) {

        return await rawHandle(c, note);
        // 性能优化
        // if (c.req.header('Range')) {
        //     return await handleMultiThreadDownload(c, note);
        // } else {
        //     const contentType = `${note.mimeType || 'text/plain'}; charset=utf-8`;
        //     const contentDisposition = `inline; ${encodeFilenameForContentDisposition(note.title)}`;
        //     return c.body(note.content, {
        //         headers: {
        //             'Content-Type': contentType,
        //             'Content-Disposition': contentDisposition
        //         }
        //     });
        // }
    } else {

        return c.json(mergeObject(defaultJsonResponse, {
            code: 200,
            success: true,
            message: "successful",
            data: note
        }) as JsonResponseType, 200);
    }
}

export { getNote }