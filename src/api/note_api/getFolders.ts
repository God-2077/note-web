import { Context } from 'hono';
import { defaultJsonResponse, defaultNoteIndexItem, mergelistitem, mergeObject, NoteIndexItemType } from '../../models/models';
import { db_index } from '../../db/db-index-util';

const getFolders = async (c: Context) => {
    const rawList = Object.values(mergelistitem(
        await db_index.note.index(c) as NoteIndexItemType[],
        defaultNoteIndexItem
    ) as NoteIndexItemType[]);

    // 获取所有文件夹，并统计每个文件夹下的 note 数量
    const folderMap = new Map<string, number>();
    for (const item of rawList) {
        if (item.folders) {
            for (const folder of item.folders) {
                folderMap.set(folder, (folderMap.get(folder) || 0) + 1);
            }
        }
    }
    // const folderList = function () {
    //     const folders: string[] = [];
    //     for (const item of rawList) {
    //         if (item.folders) {
    //             // 添加文件夹到列表
    //             folders.push(...item.folders);
    //         }
    //     }
    //     return [...new Set(folders)];
    // }()

    // 生成文件夹列表，每个文件夹包含文件夹名称和 note 数量
    const folderList = Array.from(folderMap.entries()).map(([folder, count]) => ({
        folder,
        count,
    }));

    return c.json(mergeObject(defaultJsonResponse, {
        data: folderList,
    }));
};

export { getFolders };