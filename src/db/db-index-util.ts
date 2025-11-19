import { Context } from 'hono';



const db_index = {
    note: createIndexPart("note", "note-index"),
    share: createIndexPart("share", "share-index"),
    file: createIndexPart("file", "file-index")
};

function createIndexPart(part: string, originalKey: string) {
    return {
        key: originalKey, // 保留原有key属性，但内部不再使用
        index: async function(c: Context) {
            const dbIndexRaw = await c.env.KV.get("db-index");
            if (!dbIndexRaw) return {}
            const dbIndex = JSON.parse(dbIndexRaw);
            const now = Date.now();
            let hasChanges = false;
            const collections = Object.keys(dbIndex);
            for (const collection of collections) {
                if (!dbIndex[collection]) continue;

                // 检查并删除过期项
                for (const [id, item] of Object.entries(dbIndex[collection])) {
                    const typedItem = item as { expiration?: number };
                    if (typedItem.expiration && typedItem.expiration < now) {
                        delete dbIndex[collection][id];
                        hasChanges = true;
                        // console.log(`Deleted expired item: ${collection}/${id}`);
                    }
                }
            }
            if (hasChanges) {
                c.executionCtx.waitUntil(c.env.KV.put("db-index", JSON.stringify(dbIndex)));
                // return "Expired items deleted successfully";
            }
            return dbIndex[part] || {}; // 返回指定部分的数据，如果不存在则返回空对象

        },
        get: async function(c: Context, key: string | number | any) {
            const index = await this.index(c); // 获取部分索引
            return index[key]; // 返回指定键的值
        },
        put: async function(c: Context, key: string | number | any, data: object) {
            const dbIndexRaw = await c.env.KV.get("db-index") || "{}";
            let dbIndex = JSON.parse(dbIndexRaw);
            if (!dbIndex[part]) {
                dbIndex[part] = {}; // 如果部分不存在，初始化空对象
            }
            dbIndex[part][key] = data; // 设置数据
            await c.env.KV.put("db-index", JSON.stringify(dbIndex)); // 保存整个db-index
        },
        delete: async function(c: Context, key: string | number | any) {
            const dbIndexRaw = await c.env.KV.get("db-index") || "{}";
            let dbIndex = JSON.parse(dbIndexRaw);
            if (dbIndex[part]) {
                delete dbIndex[part][key]; // 删除指定键
                await c.env.KV.put("db-index", JSON.stringify(dbIndex)); // 保存修改
            }
        },
        del: async function(c: Context, key: string | number | any) {
            await this.delete(c, key); // 别名方法，调用delete
        }
    };
}

export { db_index };
