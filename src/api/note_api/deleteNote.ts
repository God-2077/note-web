import { Context } from 'hono';
import { defaultJsonResponse, mergeObject, JsonResponseType } from '../../models/models';
import { db_index } from '../../db/db-index-util';

const deleteNote = async (c: Context) => {
    const id = c.req.param('id');
    const a = await c.env.KV.get(`note:${id}`);
    const b = await db_index.note.get(c, id);
    if (!a && !b) {
        return c.json(mergeObject(defaultJsonResponse, {
            code: 404,
            success: false,
            message: 'Note not found'
        }) as JsonResponseType, 404);
    }
    await c.env.KV.delete(`note:${id}`);
    await db_index.note.delete(c, id);
    return c.json(mergeObject(defaultJsonResponse, {
        code: 200,
        success: true,
        message: "Deleted successfully"
    }) as JsonResponseType, 200);
}

export { deleteNote }