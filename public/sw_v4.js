const swconfig = {
    CACHE_VERSION: "v4.2",
    backgroundSyncInterval: 60 * 60 * 24 * 1000, // 24小时，后台同步更新间隔，但可能出现 Permission denied 错误
    maxCacheSize: 100 * 1024 * 1024, // 100MB 缓存大小限制，注意，无法记录 opaque 响应大小
    maxCacheEntries: 1000, // 最大缓存条目数
    opaqueResponse: true, // 是否缓存不透明响应
    runtimeCaching: [{
            urlPattern: /^https:\/\/unpkg\.com\/.*/,
            handler: "CacheFirst",
            maxAgeSeconds: 60 * 60 * 24 * 365,
            autoUpdate: true, // 新增：是否自动更新
            // 添加内容类型，
            // 注意，opaque 响应是获取不到 contentType
            // 可以用 * 或 unknown 匹配所有 opaque 响应
            contentType: ['text/*']
        },
        {
            urlPattern: RegExp('^https://unpkg.ihwx.cn'),
            handler: "CacheFirst",
            maxAgeSeconds: 60 * 60 * 24 * 365,
            autoUpdate: true
        },
        {
            urlPattern: RegExp('^https://www.favicon.vip/get.php'),
            handler: "CacheFirst",
            maxAgeSeconds: 60 * 60 * 24 * 365,
            autoUpdate: false // 设置为false时删除而不更新
        },
        {
            urlPattern: RegExp('^https://image.thum.io/'),
            handler: "CacheFirst",
            maxAgeSeconds: 60 * 60 * 24 * 30,
            autoUpdate: true
        },
        {
            urlPattern: /https?:\/\/[^\/]+\/.*\.(png|jpg|jpeg|gif|svg|ico|woff2|ttf|js|css?)(\?.*)?/,
            handler: "CacheFirst",
            maxAgeSeconds: 60 * 60 * 24 * 365,
            autoUpdate: true
        },
        {
            urlPattern: /^https:\/\/ik.imagekit.io\//,
            handler: "CacheFirst",
            maxAgeSeconds: 0,
            autoUpdate: true
        },
        {
            urlPattern: /^https:\/\/weavatar.com\/avatar\//,
            handler: "CacheFirst",
            maxAgeSeconds: 60 * 60 * 24 * 30,
            autoUpdate: true
        },
        {
            urlPattern: /^https:\/\/assets.ksable.top\/js\/my-js.js/,
            handler: "CacheFirst",
            maxAgeSeconds: 60 * 60 * 24 * 1,
            autoUpdate: true
        }
    ],
    exclude: [
    ],
    precacheUrls: [
        'https://unpkg.com/react@19.2.4/package.json'
    ]
};

const CACHE_NAME = `${swconfig.CACHE_VERSION}-cache`;
const OFFLINE_URL = '/offline.html';
const DB_NAME = 'CacheDB';
const DB_VERSION = 1;

// IndexedDB 管理类
class CacheDB {
    constructor() {
        this.db = null;
        this.totalCacheSize = 0;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = async () => {
                this.db = request.result;
                // 初始化时计算总缓存大小
                await this.calculateTotalSize();
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('cacheMeta')) {
                    const store = db.createObjectStore('cacheMeta', {
                        keyPath: 'url'
                    });
                    store.createIndex('timestamp', 'timestamp', {
                        unique: false
                    });
                    store.createIndex('cachedAt', 'cachedAt', {
                        unique: false
                    });
                    store.createIndex('size', 'size', {
                        unique: false
                    });
                    store.createIndex('isPrecached', 'isPrecached', {
                        unique: false
                    });
                }

                if (!db.objectStoreNames.contains('cacheLogs')) {
                    const store = db.createObjectStore('cacheLogs', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('timestamp', 'timestamp', {
                        unique: false
                    });
                    store.createIndex('type', 'type', {
                        unique: false
                    });
                }

                if (!db.objectStoreNames.contains('syncLogs')) {
                    const store = db.createObjectStore('syncLogs', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('timestamp', 'timestamp', {
                        unique: false
                    });
                    store.createIndex('url', 'url', {
                        unique: false
                    });
                }
            };
        });
    }

    // 计算总缓存大小
    async calculateTotalSize() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cacheMeta'], 'readonly');
            const store = transaction.objectStore('cacheMeta');
            const request = store.getAll();

            request.onsuccess = () => {
                this.totalCacheSize = request.result.reduce((sum, meta) => sum + (meta.size || 0), 0);
                resolve(this.totalCacheSize);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // 检查是否需要清理缓存
    async needsCleanup() {
        await this.calculateTotalSize();
        const allMeta = await this.getAllCacheMeta();

        return this.totalCacheSize > swconfig.maxCacheSize ||
            allMeta.length > swconfig.maxCacheEntries;
    }

    // 清理过期或最旧的缓存
    async cleanupCache() {
        if (!this.db) await this.init();

        const allMeta = await this.getAllCacheMeta();
        const now = Date.now();

        // 按缓存时间排序（最旧的在前）
        allMeta.sort((a, b) => a.cachedAt - b.cachedAt);

        const cache = await caches.open(CACHE_NAME);
        let cleanedSize = 0;
        let cleanedCount = 0;

        for (const meta of allMeta) {
            // 检查是否超过限制
            const currentSize = await this.calculateTotalSize();
            const currentCount = allMeta.length - cleanedCount;

            if (currentSize - cleanedSize <= swconfig.maxCacheSize &&
                currentCount <= swconfig.maxCacheEntries) {
                break;
            }

            // 跳过预缓存资源
            if (meta.isPrecached) {
                continue;
            }

            try {
                // 删除缓存
                await cache.delete(meta.url);
                await this.deleteCacheMeta(meta.url);
                cleanedSize += meta.size || 0;
                cleanedCount++;

                await this.logCacheEvent('cache_cleaned', meta.url, {
                    reason: 'storage_limit',
                    size: meta.size
                });
            } catch (error) {
                console.error('Failed to clean cache:', error);
            }
        }

        await this.calculateTotalSize();
        return {
            cleanedSize,
            cleanedCount
        };
    }

    // 记录缓存日志
    async logCacheEvent(type, url, details = {}) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cacheLogs'], 'readwrite');
            const store = transaction.objectStore('cacheLogs');

            const log = {
                type,
                url,
                timestamp: Date.now(),
                details: JSON.stringify(details)
            };

            const request = store.add(log);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 记录后台同步事件
    async logSyncEvent(url, action, success = true, details = {}) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncLogs'], 'readwrite');
            const store = transaction.objectStore('syncLogs');

            const log = {
                url,
                action,
                success,
                timestamp: Date.now(),
                details: JSON.stringify(details)
            };

            const request = store.add(log);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 获取缓存元数据
    async getCacheMeta(url) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cacheMeta'], 'readonly');
            const store = transaction.objectStore('cacheMeta');
            const request = store.get(url);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 更新缓存元数据
    async updateCacheMeta(url, response, timestamp, isPrecached = false) {
        if (!this.db) await this.init();

        const contentLength = response.headers.get('content-length');
        const size = contentLength ? parseInt(contentLength) : await getResponseSize(response);
        const contentType = response.headers.get('content-type') || 'unknown';
        const etag = response.headers.get('etag') || '';

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cacheMeta'], 'readwrite');
            const store = transaction.objectStore('cacheMeta');

            const meta = {
                url,
                timestamp,
                cachedAt: Date.now(),
                size,
                type: contentType,
                etag,
                lastSync: Date.now(),
                isPrecached
            };

            const request = store.put(meta);

            request.onsuccess = async () => {
                await this.calculateTotalSize();
                await this.logCacheEvent('cache_updated', url, meta);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // 获取所有缓存元数据
    async getAllCacheMeta() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cacheMeta'], 'readonly');
            const store = transaction.objectStore('cacheMeta');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 删除缓存元数据
    async deleteCacheMeta(url) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cacheMeta'], 'readwrite');
            const store = transaction.objectStore('cacheMeta');
            const request = store.delete(url);

            request.onsuccess = async () => {
                await this.calculateTotalSize();
                await this.logCacheEvent('cache_deleted', url);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // 获取需要更新的过期缓存
    async getExpiredCacheUrls() {
        const allMeta = await this.getAllCacheMeta();
        const now = Date.now();
        const expiredUrls = [];

        for (const meta of allMeta) {
            const rule = matchRuleByUrl(meta.url);
            if (rule && rule.maxAgeSeconds > 0) {
                const age = (now - meta.cachedAt) / 1000;
                if (age > rule.maxAgeSeconds) {
                    expiredUrls.push({
                        url: meta.url,
                        rule: rule,
                        age: age
                    });
                }
            }
        }

        return expiredUrls;
    }
}

const cacheDB = new CacheDB();

// 检查响应是否是可缓存的内容类型
function isCacheableContentType(response, rule = {}) {
    const contentType = response.headers.get('content-type')?.toLowerCase()?.split(';')[0] || 'unknown';
    const isUnknown = contentType === 'unknown';
    // 主类型、子类型
    let mainType = '',
        subType = '';
    if (!isUnknown) {
        mainType = contentType.split('/')[0];
        subType = contentType.split('/')[1];
    }

    const RuleContentTypeList = rule.contentType || [];
    
    if (RuleContentTypeList.length === 0) return true;

    for (const item of RuleContentTypeList) {
        const contentTypeRule = item.contentType?.toLowerCase();
        if (
            contentTypeRule === undefined ||
            contentTypeRule === "" ||
            contentTypeRule === '*' ||
            contentTypeRule === "*/*") {
            return true;
        }
        if (contentType === contentTypeRule) {
            return true;
        }

        if (!isUnknown) {
            const contentTypeRuleMainType = contentTypeRule.split('/')[0];
            const contentTypeRuleSubType = contentTypeRule.split('/')[1];
            if (contentTypeRule.startsWith("*/")) {
                if (contentTypeRuleSubType === subType) {
                    return true;
                }
            } else if (contentTypeRule.endsWith("/*")) {
                if (contentTypeRuleMainType === mainType) {
                    return true;
                }
            }
        }
    }
    // 没有匹配的内容类型规则
    return false;
}

// 获取响应大小
async function getResponseSize(response) {
    // 优先使用 content-length
    const headers = response.headers
    // 检查是否有 content-length 头
    const contentLength = headers.get('content-length');
    if (
        contentLength !== null &&
        contentLength !== '' &&
        !isNaN(parseInt(contentLength)) &&
        parseInt(contentLength) > 0 &&
        contentLength !== undefined
    ) {
        return parseInt(contentLength);
    }

    // 克隆response，避免修改原始响应
    const blob = await response.clone().blob();
    return blob.size;
}

// fetch
async function _fetch(request) {
    // 回退
    return fetch(request);
    const url = request.url;
    const headers = new Headers(request.headers);
    // headers.set('Cache-Control', 'no-store');
    const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        headers: headers,
        cache: 'no-store'
    });
    return response;
}

// 根据URL匹配规则（独立函数，供getExpiredCacheUrls使用）
function matchRuleByUrl(url) {
    // 检查排除规则
    for (const pattern of swconfig.exclude) {
        if (pattern.test(url)) {
            return null;
        }
    }

    // 反向遍历确保后面的规则优先级更高
    for (let i = swconfig.runtimeCaching.length - 1; i >= 0; i--) {
        const rule = swconfig.runtimeCaching[i];
        if (rule.urlPattern.test(url)) {
            return rule;
        }
    }
    return null;
}

// 匹配请求对应的规则
function matchRule(request) {
    const url = request.url;

    // 检查排除规则
    for (const pattern of swconfig.exclude) {
        if (pattern.test(url)) {
            cacheDB.logCacheEvent('cache_skipped', url, {
                reason: 'excluded'
            });
            return null;
        }
    }

    // 反向遍历确保后面的规则优先级更高
    for (let i = swconfig.runtimeCaching.length - 1; i >= 0; i--) {
        const rule = swconfig.runtimeCaching[i];
        if (rule.urlPattern.test(url)) {
            return rule;
        }
    }

    cacheDB.logCacheEvent('cache_skipped', url, {
        reason: 'no_matching_rule'
    });
    return null;
}

// 后台更新缓存
async function backgroundUpdate(request, rule, skipSyncInterval = false) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);

        if (!cachedResponse) return;

        // 检查是否需要更新（基于时间间隔）
        const meta = await cacheDB.getCacheMeta(request.url);
        const now = Date.now();

        if (!skipSyncInterval && (meta && meta.lastSync)) {
            const timeSinceLastSync = now - meta.lastSync;
            if (timeSinceLastSync < swconfig.backgroundSyncInterval) {
                await cacheDB.logSyncEvent(request.url, 'skip_sync', true, {
                    reason: 'within_interval',
                    timeSinceLastSync
                });
                return;
            }
        }

        // 新增：如果autoUpdate为false，则删除缓存
        if (rule.autoUpdate === false) {
            await cache.delete(request);
            await cacheDB.deleteCacheMeta(request.url);
            await cacheDB.logSyncEvent(request.url, 'cache_deleted', true, {
                reason: 'autoUpdate_false'
            });
            return;
        }

        // 准备验证头
        const headers = new Headers();
        let useConditionalRequest = false;

        // 如果有 ETag，使用条件请求
        if (meta && meta.etag) {
            headers.set('If-None-Match', meta.etag);
            useConditionalRequest = true;
            await cacheDB.logSyncEvent(request.url, 'conditional_sync_start', true, {
                etag: meta.etag
            });
        }

        // 发送验证请求
        const networkResponse = await fetch(request, {
            headers,
            cache: 'no-store'
        });

        if (useConditionalRequest && networkResponse.status === 304) {
            // 资源未修改，更新同步时间
            await cacheDB.updateCacheMeta(request.url, cachedResponse, Date.now());
            await cacheDB.logSyncEvent(request.url, 'conditional_sync_304', true, {
                reason: 'not_modified'
            });
        } else if (networkResponse.ok || networkResponse.type === 'opaque') {
            // 资源已更新，更新缓存
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
            await cacheDB.updateCacheMeta(request.url, networkResponse, Date.now());
            await cacheDB.logSyncEvent(request.url, 'cache_updated', true, {
                status: networkResponse.status,
                newEtag: networkResponse.headers.get('etag')
            });
        } else {
            await cacheDB.logSyncEvent(request.url, 'sync_failed', false, {
                status: networkResponse.status
            });
        }
    } catch (error) {
        console.error('Background update failed:', error);
        await cacheDB.logSyncEvent(request.url, 'sync_error', false, {
            error: error.message
        });
    }
}

// 定期后台同步任务
async function runPeriodicSync() {
    try {
        await cacheDB.logSyncEvent('system', 'periodic_sync_start', true);

        const expiredUrls = await cacheDB.getExpiredCacheUrls();
        let updatedCount = 0;
        let errorCount = 0;

        for (const item of expiredUrls) {
            try {
                const request = new Request(item.url);
                await backgroundUpdate(request, item.rule);
                updatedCount++;

                // 添加延迟避免过多请求
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                errorCount++;
                console.error(`Failed to sync ${item.url}:`, error);
            }
        }

        await cacheDB.logSyncEvent('system', 'periodic_sync_complete', true, {
            total: expiredUrls.length,
            updated: updatedCount,
            errors: errorCount
        });
    } catch (error) {
        await cacheDB.logSyncEvent('system', 'periodic_sync_error', false, {
            error: error.message
        });
    }
}

// 检查并清理缓存（如果需要）
async function checkAndCleanupCache() {
    if (await cacheDB.needsCleanup()) {
        const result = await cacheDB.cleanupCache();
        await cacheDB.logCacheEvent('storage_cleanup', '', result);
    }
}

try {
    console.log('当前缓存版本: ', swconfig.CACHE_VERSION);
} catch (e) {}

// 安装阶段 - 初始化缓存和数据库
self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            await cacheDB.init();
            await cacheDB.logCacheEvent('sw_install', '', {
                version: swconfig.CACHE_VERSION
            });

            const cache = await caches.open(CACHE_NAME);
            if (swconfig.precacheUrls.length > 0) {
                // 修改：单独处理每个预缓存URL
                for (const url of swconfig.precacheUrls) {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response.clone());
                            // 标记为预缓存资源
                            await cacheDB.updateCacheMeta(url, response, Date.now(), true);
                            await cacheDB.logCacheEvent('precached', url);
                        }
                    } catch (error) {
                        console.error('Precache failed for:', url, error);
                    }
                }
            }

            return self.skipWaiting();
        })()
    );
});

// 激活阶段 - 清理旧缓存和旧数据库，启动定期同步
self.addEventListener('activate', event => {
    event.waitUntil(
        (async () => {
            // 清理旧缓存
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME && name.startsWith('v') && name.endsWith('-cache')) {
                        return caches.delete(name);
                    }
                })
            );

            // 清理旧版本数据库
            const dbNames = await indexedDB.databases();
            for (const dbInfo of dbNames) {
                if (dbInfo.name === DB_NAME && dbInfo.version < DB_VERSION) {
                    indexedDB.deleteDatabase(DB_NAME);
                    break;
                }
            }

            await cacheDB.logCacheEvent('sw_activate', '', {
                version: swconfig.CACHE_VERSION
            });

            // 启动定期同步
            if ('periodicSync' in self.registration) {
                try {
                    await self.registration.periodicSync.register('background-sync', {
                        minInterval: swconfig.backgroundSyncInterval // 毫秒
                    });
                    await cacheDB.logSyncEvent('system', 'periodic_sync_registered', true);
                } catch (error) {
                    await cacheDB.logSyncEvent('system', 'periodic_sync_failed', false, {
                        error: error.message
                    });
                }
            }

            return self.clients.claim();
        })()
    );
});

// 监听定期同步事件
self.addEventListener('periodicsync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(runPeriodicSync());
    }
});

// 请求处理
self.addEventListener('fetch', event => {
    const request = event.request;

    // 只处理GET请求
    if (request.method !== 'GET') return;

    // 特殊处理导航请求的离线回退
    if (request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const networkResponse = await _fetch(request);
                    await cacheDB.logCacheEvent('navigate_network', request.url, {
                        status: networkResponse.status
                    });
                    return networkResponse;
                } catch (error) {
                    if (OFFLINE_URL) {
                        const offlineResponse = await caches.match(OFFLINE_URL);
                        if (offlineResponse) {
                            await cacheDB.logCacheEvent('navigate_offline', request.url);
                            return offlineResponse;
                        }
                    }
                    await cacheDB.logCacheEvent('navigate_error', request.url, {
                        error: error.message
                    });
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                }
            })()
        );
        return;
    }

    // 匹配缓存规则
    const rule = matchRule(request);
    if (!rule) return;

    // 处理不同缓存策略
    switch (rule.handler) {
        case 'NetworkOnly':
            event.respondWith(
                (async () => {
                    await cacheDB.logCacheEvent('network_only', request.url);
                    return // 交给网络请求处理
                })()
            );
            break;

        case 'CacheOnly':
            event.respondWith(
                (async () => {
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) {
                        await cacheDB.logCacheEvent('cache_only_hit', request.url);
                        return cachedResponse;
                    } else {
                        await cacheDB.logCacheEvent('cache_only_miss', request.url);
                        return Response('Cache miss', {
                            status: 404,
                            statusText: 'Not Found'
                        });
                    }
                })()
            );
            break;

        case 'NetworkFirst':
            event.respondWith(
                (async () => {
                    try {
                        const networkResponse = await _fetch(request);
                        await cacheDB.logCacheEvent('network_first_network', request.url, {
                            status: networkResponse.status
                        });
                        const isAllowCacheContentType = isCacheableContentType(networkResponse, rule);

                        // 缓存成功响应
                        if (
                            isAllowCacheContentType &&
                            (
                                networkResponse.ok ||
                                (swconfig.opaqueResponse && networkResponse.type === 'opaque')
                            )
                        ) {
                            const cache = await caches.open(CACHE_NAME);
                            const responseClone = networkResponse.clone();
                            event.waitUntil(
                                (async () => {
                                    await cache.put(request, responseClone);
                                    await cacheDB.updateCacheMeta(request.url, networkResponse, Date.now());
                                    await checkAndCleanupCache();
                                    await cacheDB.logCacheEvent('network_first_cache_added', request.url);
                                })());
                        } else if (!networkResponse.ok && networkResponse.type !== 'opaque') {
                            await cacheDB.logCacheEvent('network_first_cache_fetch_failed', request.url, {
                                status: networkResponse.status
                            });
                        } else if (!swconfig.opaqueResponse && networkResponse.type === 'opaque') {
                            await cacheDB.logCacheEvent('network_first_cache_skip_opaque', request.url, {
                                status: networkResponse.status
                            });
                        } else if (!isAllowCacheContentType) {
                            await cacheDB.logCacheEvent('network_first_cache_skip_uncacheable', request.url, {
                                status: networkResponse.status
                            });
                        }

                        return networkResponse;
                    } catch (error) {
                        const cachedResponse = await caches.match(request);
                        if (cachedResponse) {
                            await cacheDB.logCacheEvent('network_first_cache', request.url);
                            return cachedResponse;
                        }
                        await cacheDB.logCacheEvent('network_first_error', request.url, {
                            error: error.message
                        });
                        throw error;
                    }
                })()
            );
            break;

        case 'CacheFirst':
        default:
            event.respondWith((async () => {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(request);

                // 如果找到缓存
                if (cachedResponse) {
                    await cacheDB.logCacheEvent('cache_hit', request.url);

                    // 修改：移除间隔检查，立即触发更新
                    if (rule.maxAgeSeconds > 0) {
                        const meta = await cacheDB.getCacheMeta(request.url);
                        if (meta) {
                            const age = (Date.now() - meta.cachedAt) / 1000;
                            if (age > rule.maxAgeSeconds) {
                                // 异步更新过期缓存
                                event.waitUntil(backgroundUpdate(request, rule, true));
                            }
                        }
                    }
                    return cachedResponse;
                }

                // 没有缓存则请求网络
                await cacheDB.logCacheEvent('cache_miss', request.url);
                try {
                    const networkResponse = await _fetch(request);
                        const isAllowCacheContentType = isCacheableContentType(networkResponse, rule);
                    // 缓存成功响应
                    if (
                        isAllowCacheContentType &&
                        (
                            networkResponse.ok ||
                            (swconfig.opaqueResponse && networkResponse.type === 'opaque')
                        )
                    ) {
                        const responseClone = networkResponse.clone();
                        await cache.put(request, responseClone);
                        await cacheDB.updateCacheMeta(request.url, networkResponse, Date.now());
                        await checkAndCleanupCache();
                        await cacheDB.logCacheEvent('cache_added', request.url, {
                            status: networkResponse.status
                        });
                    } else if (!networkResponse.ok && networkResponse.type !== 'opaque') {
                        await cacheDB.logCacheEvent('cache_fetch_failed', request.url, {
                            status: networkResponse.status
                        });
                    } else if (!swconfig.opaqueResponse && networkResponse.type === 'opaque') {
                        await cacheDB.logCacheEvent('cache_skip_opaque', request.url, {
                            status: networkResponse.status
                        });
                    } else if (!isAllowCacheContentType) {
                        await cacheDB.logCacheEvent('cache_skip_uncacheable', request.url, {
                            status: networkResponse.status
                        });
                    }
                    return networkResponse;
                } catch (error) {
                    await cacheDB.logCacheEvent('cache_fetch_error', request.url, {
                        error: error.message
                    });
                    return Response.error();
                }
            })());
            break;
    }
});
// 在 Service Worker 中
self.addEventListener('message', event => {
  if (event.data.type === 'PAGE_LOADED') {
    console.log('页面已打开:', event.data.url);
    // 执行你的函数
    doSomethingOnPageLoad();
  }
});