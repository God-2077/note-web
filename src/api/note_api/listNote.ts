import { Context } from 'hono';
import { defaultJsonResponse, mergeObject, NoteIndexItemType, mergelistitem, defaultNoteIndexItem, JsonResponseType } from '../../models/models';
import { db_index } from '../../db/db-index-util';
import { hasIntersection } from '../../utils/hasIntersection';

const listNote = async (c: Context) => {
    const rawList = mergelistitem(
        await db_index.note.index(c) as NoteIndexItemType[],
        defaultNoteIndexItem
    ) as NoteIndexItemType[];

    // 参数处理
    const sort = c.req.query('sort') || "date";
    const limit = parseInt(c.req.query('limit') || '100');
    const page = parseInt(c.req.query('page') || '1') - 1; // 页码应该从一开始
    const startTime = parseInt(c.req.query('startTime') || '0');
    const endTime = parseInt(c.req.query('endTime') || '0');
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
    console.log(folders);


    // 转换为数组并过滤
    let noteList = Object.values(rawList);

    // 时间范围过滤
    if (startTime || endTime) {
        noteList = noteList.filter((note: any) => {
            const noteTime = note.createdAt;
            if (startTime && endTime) return noteTime >= startTime && noteTime <= endTime;
            if (startTime) return noteTime >= startTime;
            return noteTime <= endTime;
        });
    }

    // 排序处理
    switch (sort.toLowerCase()) {
        case "a-z":
            noteList.sort((a: any, b: any) => a.title.localeCompare(b.title));
            break;
        case "z-a":
            noteList.sort((a: any, b: any) => b.title.localeCompare(a.title));
            break;
        case "update":
            noteList.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
            break;
        case "date":
            noteList.sort((a: any, b: any) => b.createdAt - a.createdAt);
            break;
        default: // "date" 默认按创建时间降序
            return c.json(mergeObject(defaultJsonResponse, {
                code: 400,
                success: false,
                message: `Unsupported sorting method ${sort}`
            }) as JsonResponseType, 400);
    }

    // 文件夹过滤
    if (folders.length > 0) {
        noteList = noteList.filter((note: any) => {
            console.log(note.folders);
            // 处理无文件夹的情况
            if (!note.folders || note.folders?.length === 0) note.folders = ['uncategorized'];

            // 所有 note 添加 all 文件夹
            note.folders.push('all');
            console.log(note.folders);
            return hasIntersection(folders, note.folders, true)
        })
    }

    // 分页处理
    const total = noteList.length;
    const startIndex = page * limit;
    const paginatedList = noteList.slice(startIndex, startIndex + limit);



    return c.json(mergeObject(defaultJsonResponse, {
        code: 200,
        success: true,
        message: "successfully",
        data: {
            total,
            page: page + 1,
            limit,
            sort,
            startTime,
            endTime,
            folders,
            totalPages: Math.ceil(total / limit),
            data: paginatedList
        }
    }) as JsonResponseType, 200);
}

export { listNote }
