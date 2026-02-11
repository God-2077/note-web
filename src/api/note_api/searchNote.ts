import { Context } from 'hono';
import { defaultJsonResponse, JsonResponseType, mergeObject, mergelistitem, defaultNoteIndexItem, NoteIndexItemType } from '../../models/models';
import { db_index } from '../../db/db-index-util';
import { hasIntersection } from '../../utils/hasIntersection';

const searchNote = async (c: Context) => {
    const query = c.req.query('q');

    if (!query) {
        return c.json(mergeObject(defaultJsonResponse, {
            code: 400,
            success: false,
            message: "Search query parameter 'q' is required"
        }) as JsonResponseType, 400);
    }

    // 获取所有note索引
    const noteIndex = mergelistitem(await db_index.note.index(c), defaultNoteIndexItem) as NoteIndexItemType[];
    const noteList = Object.values(noteIndex);

    // 排序
    noteList.sort((a: any, b: any) => b.createdAt - a.createdAt);

    // 转换为小写以便不区分大小写搜索
    const searchTerm = query.toLowerCase();

    // 搜索id和title
    let searchResults = noteList.filter((note: any) => {
        return note.id.toLowerCase() == searchTerm ||
            note.title.toLowerCase().includes(searchTerm);
    });

    // 文件夹过滤
    const folders = (function () {
        const folder_raw = c.req.query('folders');
        if (!folder_raw || typeof folder_raw !== 'string' || folder_raw.trim() === '') {
            return [];
        }
        const folderList = folder_raw.split(',')
            .map(f => f.trim().toLowerCase())
            .map(f => f.replace(/^uncat$/i, 'uncategorized'))
        const uniqueFolderList = [...new Set(folderList)];
        return uniqueFolderList;
    })();
    if (folders.length > 0) {
        searchResults = searchResults.filter((note: any) => {
            // 处理无文件夹的情况
            if (!note.folders) if (note.folders = []) note.folders = ['uncategorized'];
            // 所有 note 添加 all 文件夹
            note.folders.push('all');
            return hasIntersection(folders, note.folders, true)
        })
    }

    // 分页参数处
    const total = searchResults.length;
    const limit = parseInt(c.req.query('limit') || '100');
    const page = parseInt(c.req.query('page') || '1') - 1;
    let paginatedList;
    const startIndex = page * limit;
    // 应用分页
    paginatedList = searchResults.slice(startIndex, startIndex + limit);



    return c.json(mergeObject(defaultJsonResponse, {
        code: 200,
        success: true,
        message: "successfully",
        data: {
            keywords: query,
            folders,
            resultCount: searchResults.length,
            total,
            page: page + 1,
            data: paginatedList
        }
    }) as JsonResponseType, 200);
}

export { searchNote }
