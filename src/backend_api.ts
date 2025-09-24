import {
    Hono
} from 'hono/tiny';
// import {
    // getConnInfo
// } from 'hono/cloudflare-workers';
import {
    prettyJSON
} from 'hono/pretty-json';
import {
    cors
} from 'hono/cors';
// import { logger } from 'hono/logger';
// import { HTTPException } from 'hono/http-exception';
// import { compress } from 'hono/compress';
import {
    getRouterName,
    showRoutes
} from 'hono/dev';
import {
    timeout
} from 'hono/timeout';
import {
    etag
} from 'hono/etag';
import { Context, Env, ExecutionContext, Next } from 'hono';
import { Request, ScheduledController } from '@cloudflare/workers-types';
import { verify } from 'hono/jwt';
// import {
// 	LocalKV
// } from './local-kv';
const getConnInfo = (c) => ({
  remote: {
    address: c.req.header("x-vercel-proxied-for") || c.req.header("cf-connecting-ip")
  }
});
const generateId = (length = 8) => {
    //简短id生成
    let id = '';
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // 添加时间戳部分（32进制压缩）
    id += Date.now().toString(32).slice(0, 5);

    // 补充随机字符直到达到指定长度
    while (id.length < length) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return id.slice(0, length);
}
// console.log(generateId)
const getClientIp = (c: Context) => {
    try {
        const connInfo = getConnInfo(c);
        return connInfo?.remote?.address || null;
    } catch {
        return null;
    }
};


const isValidToken = (token: string | number | any) => {
    if (!security.admin_token) return true;
    // console.log("=====")
    // console.log(security.admin_token)
    // console.log(token)
    // console.log(token == security.admin_token)
    return token == security.admin_token;
};
// 中间件：认证检查
const authMiddleware = async (c: Context, next: Next) => {
    const token = c.req.header('X-Token') || c.req.query('token');

    if (!security.guest_visit && !isValidToken(token)) {
        return c.json({
            code: 401,
            success: false,
            message: 'Invalid Token'
        }, 401);
    }

    await next();
};

// 中间件：管理员权限检查
const adminAuthMiddleware = async (c: Context, next: Next) => {
    const token = c.req.header('X-Token') || c.req.query('token');

    if (!isValidToken(token)) {
        return c.json({
            code: 401,
            success: false,
            message: 'Admin access required'
        }, 401);
    }

    await next();
};
const no_cache = async (c: Context, next: Next) => {
    await next();
    c.header('Cache-Control', 'no-cache');
    c.header('Pragma', 'no-cache');
};
const requestId = async (c: Context, next: Next) => {
    const id = crypto.randomUUID()
    c.header('X-Request-Id', id);
    c.set('requestId', id);
    await next();
};
const date_header = async (c: Context, next: Next) => {
    const date = new Date().toUTCString();
    c.header('Date', date);
    await next();
}

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

async function purge_expired_data_and_refresh(c: Context, returnData: boolean = true) {
    // try {
    // 获取当前时间戳（毫秒）
    const now = Date.now();
    let hasChanges = false;

    // 从 KV 获取整个数据库
    const db = await c.env.KV.get("db-index", "json");
    if (!db) return {};

    // 处理每个集合
    const collections = Object.keys(db);
    for (const collection of collections) {
        if (!db[collection]) continue;

        // 检查并删除过期项
        for (const [id, item] of Object.entries(db[collection])) {
            const typedItem = item as { expiration?: number };
            if (typedItem.expiration && typedItem.expiration < now) {
                delete db[collection][id];
                hasChanges = true;
                // console.log(`Deleted expired item: ${collection}/${id}`);
            }
        }
    }

    // 如果有变更，更新 KV
    if (hasChanges) {
        c.executionCtx.waitUntil(c.env.KV.put("db-index", JSON.stringify(db)));
        // return "Expired items deleted successfully";
    }
    return returnData ? db : null;
    // return "No expired items found";
    // } catch (err) {
    // console.error("Error deleting expired items:", err);
    // throw err;
    // }
}

const timing = async (c: Context, next: Next) => {
    const start = performance.now();
    await next();
    const end = performance.now();
    const timing = end - start; // duration of the subrequest to developers.cloudflare.com
    c.header('Timing', timing)
};



// 配置
let security = {
    admin_token: null,
    guest_visit: true
}

const set_security = async (c: Context, next: Next) => {
    security.admin_token = c.env.ADMIN_TOKEN ?? '123456';
    security.guest_visit = c.env.GUEST_VISIT == 1 ? true : false;
    await next();
};

const app = new Hono({
    strict: false
});




app.use(set_security);
app.use(timing);
app.use(cors());
// app.use(logger());
// app.use(compress()); // Cloudflare Workers 不支持压缩
app.use(authMiddleware);
app.use(timeout(10000));
app.use(etag());
app.use(no_cache);
app.use(requestId);
app.use(date_header);
app.use(prettyJSON({
    query: '' // ?pretty
})); // 必须最后


app.notFound((c) => {
    return c.json({
        code: 404,
        success: false,
        message: "Not Found"
    }, 404)
})
app.onError((err, c) => {
    console.error(`${err.stack}`)
    const token = c.req.header('X-Token') || c.req.query('token');
    return c.json({
        code: 500,
        success: false,
        message: err.message,
        error: {
            message: err.message,
            stack: isValidToken(token) ? err.stack : "null (Admin access required)"
        }
    }, 500)
})





const backend_api = new Hono({
    strict: false
});

backend_api.on(["PUT", "POST"], '/create', adminAuthMiddleware, async (c: Context) => {
    // app.all('/create', async (c: Context) => {
    const user_agent = c.req.header('User-Agent');
    const id = generateId();
    const now = new Date().getTime();
    const ip = getClientIp(c);

    let body = null;
    try {
        body = await c.req.json();
    } catch (error) {
        return c.json({
            code: 400,
            success: false,
            message: 'Request body is required'
        }, 400);
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
            return c.json({
                code: 400,
                success: false,
                message: 'Expiration targets that are less than 60 seconds into the future are not supported.'
            }, 400);
        }
    }

    const data = {
        id: id,
        title: body.title ?? "Untitled",
        content: body.content ?? "",
        length: body.length ?? NaN,
        textType: body.textType ?? "plain",
        ip: ip ?? null,
        user_agent: user_agent ?? "Unknown",
        encryption: body.password ? true : false,
        password: body.password ?? null,
        createdAt: now ?? null,
        updatedAt: now ?? null,
        expiration: expiration ?? null
    }

    data.length = data.content.length
    // 写入 note
    if (expiration) {
        await c.env.KV.put(`note:${id}`, JSON.stringify(data), {
            expiration: Math.round(expiration / 1000)
        });
    } else {
        await c.env.KV.put(`note:${id}`, JSON.stringify(data));
    }
    // 写入 db-index
    await db_index.note.put(c, id, {
        id: data.id,
        title: data.title,
        length: data.length,
        textType: data.textType,
        encryption: data.encryption,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        expiration: data.expiration
    })
    return c.json({
        code: 201,
        success: true,
        message: "Created successfully",
        id: data.id,
        title: data.title,
        length: data.length
    }, 201)
})

// 更新 note
backend_api.on(["PUT", "POST"], '/update/:id', adminAuthMiddleware, async (c: Context) => {
    const id = c.req.param('id');
    const now = new Date().getTime();

    // 验证笔记ID是否存在
    const existingNote = await c.env.KV.get(`note:${id}`, 'json');
    if (!existingNote) {
        return c.json({
            code: 404,
            success: false,
            message: 'Note not found'
        }, 404);
    }

    let body = null;
    try {
        body = await c.req.json();
    } catch (error) {
        return c.json({
            code: 400,
            success: false,
            message: 'Request body is required'
        }, 400);
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
            return c.json({
                code: 400,
                success: false,
                message: 'Expiration targets that are less than 60 seconds into the future are not supported.'
            }, 400);
        }
    } else {
        expiration = null;
    }
    
    

    // 构建更新数据
    const updatedData = {
        ...existingNote,
        title: body.title ?? existingNote.title,
        content: body.content ?? existingNote.content,
        length: body.content.length ?? existingNote.length,
        textType: body.textType ?? existingNote.textType,
        encryption: body.password ? true : false,
        password: body.password ?? null,
        updatedAt: now,
        expiration: expiration
    };


    // 更新KV存储
    const putOptions = expiration ? {
        expiration: Math.round(expiration / 1000)
    } : {};
    await c.env.KV.put(`note:${id}`, JSON.stringify(updatedData), putOptions);

    // 更新db-index
    await db_index.note.put(c, id, {
        id: id,
        title: updatedData.title,
        length: updatedData.length,
        textType: updatedData.textType,
        encryption: updatedData.encryption,
        createdAt: existingNote.createdAt,
        updatedAt: now,
        expiration: expiration
    });

    return c.json({
        code: 200,
        success: true,
        message: "Updated successfully",
        id: id,
        title: updatedData.title,
        length: updatedData.length
    });
});


backend_api.get('/notes/:id', async (c: Context) => {
    const id = c.req.param('id');
    const token = c.req.header('X-Token') || c.req.query('token');
    const password = c.req.query('pwd');

    const noteRaw = await c.env.KV.get(`note:${id}`);
    if (!noteRaw || noteRaw.isDeleted) {
        return c.json({
            code: 404,
            success: false,
            message: 'Note not found'
        }, 404);
    }

    const note = JSON.parse(noteRaw);
    if (note.encryption && !isValidToken(token)) {
        if (!password) {
            return c.json({
                code: 401,
                success: false,
                message: 'Encrypted content, password required'
            }, 401);
        }

        if (password !== note.password) {
            return c.json({
                code: 401,
                success: false,
                message: 'Incorrect password'
            }, 401);
        }
    }

    note.code = 200;
    note.success = true;
    note.message = "successful";

    // 移除敏感信息
    // delete note.password;
    return c.json(note);
});

// 删除 note
backend_api.on(["DELETE", "GET"], '/delete/:id', adminAuthMiddleware, async (c: Context) => {
    const id = c.req.param('id');
    const a = await c.env.KV.get(`note:${id}`);
    const b = await db_index.note.get(c, id);
    if (!a && !b) {
        return c.json({
            code: 404,
            success: false,
            message: 'Note not found'
        }, 404);
    }
    await c.env.KV.delete(`note:${id}`);
    await db_index.note.delete(c, id);
    return c.json({
        code: 200,
        success: true,
        message: "Deleted successfully"
    })
})

// list note
backend_api.get('/list', async (c: Context) => {
    const rawList = await db_index.note.index(c);

    // 参数处理
    const sort = c.req.query('sort') || "date";
    const limit = parseInt(c.req.query('limit') || '100');
    const page = parseInt(c.req.query('page') || '1') - 1; // 页码应该从一开始
    const startTime = parseInt(c.req.query('startTime') || '0');
    const endTime = parseInt(c.req.query('endTime') || '0');

    // 转换为数组并过滤
    let noteList = Object.values(rawList);

    // 时间范围过滤
    if (startTime || endTime) {
        noteList = noteList.filter(note => {
            const noteTime = note.createdAt;
            if (startTime && endTime) return noteTime >= startTime && noteTime <= endTime;
            if (startTime) return noteTime >= startTime;
            return noteTime <= endTime;
        });
    }

    // 排序处理
    switch (sort.toLowerCase()) {
        case "a-z":
            noteList.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case "z-a":
            noteList.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case "update":
            noteList.sort((a, b) => b.updatedAt - a.updatedAt);
            break;
        case "date":
            noteList.sort((a, b) => b.createdAt - a.createdAt);
            break;
        default: // "date" 默认按创建时间降序
            return c.json({
                code: 400,
                success: false,
                message: `Unsupported sorting method ${sort}`
            }, 400);
    }

    // 分页处理
    const total = noteList.length;
    const startIndex = page * limit;
    const paginatedList = noteList.slice(startIndex, startIndex + limit);

    return c.json({
        code: 200,
        success: true,
        message: "successfully",
        total,
        page: page + 1,
        limit,
        sort,
        startTime,
        endTime,
        totalPages: Math.ceil(total / limit),
        data: paginatedList
    }, 200);
});

// 搜索路由
backend_api.get('/search', async (c: Context) => {
    const query = c.req.query('q');
    
    if (!query) {
        return c.json({
            code: 400,
            success: false,
            message: "Search query parameter 'q' is required"
        }, 400);
    }
    
    // 获取所有note索引
    const noteIndex = await db_index.note.index(c);
    const noteList = Object.values(noteIndex);
    
    // 排序
    noteList.sort((a, b) => b.createdAt - a.createdAt);
    
    // 转换为小写以便不区分大小写搜索
    const searchTerm = query.toLowerCase();
    
    // 搜索id和title
    const searchResults = noteList.filter(note => {
        return note.id.toLowerCase() == searchTerm || 
               note.title.toLowerCase().includes(searchTerm);
    });
    
    // 分页参数处
    const total = searchResults.length;
    const limit = parseInt(c.req.query('limit') || '100');
    const page = parseInt(c.req.query('page') || '1') - 1;
    let paginatedList;
    const startIndex = page * limit;
    // 应用分页
    paginatedList = searchResults.slice(startIndex, startIndex + limit);
    
    return c.json({
        code: 200,
        success: true,
        message: "successfully",
        keywords: query,
        resultCount: searchResults.length,
        total,
        page: page + 1,
        data: paginatedList
    }, 200);
});







// 密码验证路由
backend_api.get('/verify-admin', async (c: Context) => {
    const token = c.req.header('X-Token') || c.req.query('token');
    const isValid = isValidToken(token);
    return c.json({
        code: 200,
        success: true,
        message: `Admin access ${isValid ? 'granted' : 'denied'}`,
        verify: isValid
    })
})

backend_api.get('/', (c) => {
    const user_agent = c.req.header('User-Agent') || null;
    const requestId = c.get("requestId") || null;
    return c.json({
        code: 200,
        success: true,
        message: "successfully",
        id: generateId(),
        requestId,
        ip: getClientIp(c),
        user_agent,
        getConnInfo: getConnInfo(c)
    })
    // return c.text("Hello, World!")
})

// 版本信息
backend_api.get('/version', (c) => {
    // const {
        // id,
        // tag,
        // timestamp
    // } = c.env.CF_VERSION_METADATA;
    
    const user_agent = c.req.header('User-Agent') || null;
    const requestId = c.get("requestId") || null;
    
    const { id: versionId, tag: versionTag, timestamp: versionTimestamp } = c.env.CF_VERSION_METADATA;

    // 将版本信息以 JSON 格式返回
    return c.json({
        code: 200,
        success: true,
        message: "successful",
        id: generateId(),
        requestId,
        ip: getClientIp(c),
        user_agent,
        getConnInfo: getConnInfo(c),
        workerVersion: {
            versionId,
            versionTag,
            versionTimestamp
        }
    });
});

// 控制台
const console = new Hono({
    strict: false
});
// KV 控制台路由
console.get('/kv', adminAuthMiddleware, async (c: Context) => {
    const operation = c.req.query('operation');
    const key = c.req.query('key');
    const putvalue = c.req.query('value') || '';
    
    if (!operation) {
        return c.json({
            code: 400,
            success: false,
            message: "operation is required"
        })
    }

    if (!key && operation !== 'list') {
        return c.json({
            code: 400,
            success: false,
            message: "key is required"
        })
    }
    if (operation === 'put' && !putvalue) {
        return c.json({
            code: 400,
            success: false,
            message: "value is required"
        })
    }
    let value = null;
    switch (operation) {
        case 'get':
            value = await c.env.KV.get(key);
            return c.json({
                code: 200,
                success: true,
                message: "success",
                operation: operation,
                key: key,
                KV: {
                    key: key,
                    value: value
                }
            })
        case 'put':
            await c.env.KV.put(key, putvalue);
            value = await c.env.KV.get(key);
            return c.json({
                code: 200,
                success: true,
                message: "success",
                operation: operation,
                key: key,
                KV: {
                    key: key,
                    value: value
                }
            })
        case 'delete':
            await c.env.KV.delete(key);
            return c.json({
                code: 200,
                success: true,
                operation: operation,
                key: key,
                message: "success",
                KV: null
            })
        case 'list':
            value = await c.env.KV.list();
            return c.json({
                code: 200,
                success: true,
                operation: operation,
                key: key,
                message: "success",
                KV: {
                    ...value
                }
            })
        default:
            return c.json({
                code: 400,
                success: false,
                message: "operation not found"
            })
    }
});

console.use('/echo/*', async (c, next) => {
  const contentType = c.req.header('Content-Type') || '';
  
  // 只处理非 GET/HEAD 请求
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    try {
      // 对于 multipart/form-data 请求，获取 ArrayBuffer
      if (contentType.includes('multipart/form-data')) {
        const arrayBuffer = await c.req.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        c.set('rawBody', buffer.toString('base64'));
        c.set('isBase64Encoded', true);
      } else {
        // 其他类型请求获取文本
        const rawBody = await c.req.text();
        c.set('rawBody', rawBody);
        c.set('isBase64Encoded', false);
      }
    } catch (error) {
      c.set('rawBody', '');
      c.set('isBase64Encoded', false);
    }
  } else {
    c.set('rawBody', '');
    c.set('isBase64Encoded', false);
  }
  
  await next();
});

// 处理所有请求
console.all('/echo/*', async (c) => {
  // 获取查询参数
  const url = new URL(c.req.url);
  const args = {};
  url.searchParams.forEach((value, key) => {
    args[key] = value;
  });

  // 获取请求头
  const headers = {};
  c.req.raw.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  // 构建响应数据
  const responseData = {
    method: c.req.method,
    args: args,
    data: c.get('rawBody') || '',
    headers: headers,
    path: url.pathname,
    isBase64Encoded: c.get('isBase64Encoded') || false
  };
  return c.json(responseData);
});


app.route('/api', backend_api);
app.route('/console', console);


showRoutes(app, {
    verbose: true,
    colorize: true
})




async function deleteExpiredItems(env) {
    try {
        // 获取当前时间戳（毫秒）
        const now = Date.now();
        let hasChanges = false;

        // 从 KV 获取整个数据库
        const db = await env.KV.get("db-index", "json");
        if (!db) return;

        // 处理每个集合
        const collections = Object.keys(db);
        for (const collection of collections) {
            if (!db[collection]) continue;

            // 检查并删除过期项
            for (const [id, item] of Object.entries(db[collection])) {
                if (item.expiration && item.expiration < now) {
                    delete db[collection][id];
                    hasChanges = true;
                    console.log(`Deleted expired item: ${collection}/${id}`);
                }
            }
        }

        // 如果有变更，更新 KV
        if (hasChanges) {
            await env.KV.put("db-index", JSON.stringify(db));
            return "Expired items deleted successfully";
        }
        return "No expired items found";
    } catch (err) {
        console.error("Error deleting expired items:", err);
        throw err;
    }
}

// export default app

export { app }
