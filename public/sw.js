const swconfig = {
    CACHE_VERSION: "v2.0",
    runtimeCaching: [
        // {
        //     urlPattern: /^https:\/\/cdn\.example\.com\/.*/,
        //     handler: "CacheFirst",
        //     maxAgeSeconds: 60 * 60 * 24 * 365
        // },
        // {
        //     urlPattern: /https:\/\/blog.ksable.top\//gi,
        //     handler: "NetworkFirst",
        //     maxAgeSeconds: 60 * 60 * 24 * 7
        // },
        {
            urlPattern: RegExp('^https://www.favicon.vip/get.php'),
            handler: "CacheFirst",
            maxAgeSeconds: 60 * 60 * 24 * 365
        },
        {
            urlPattern: RegExp('^https://image.thum.io/'),
            handler: "CacheFirst",
            maxAgeSeconds: 60 * 60 * 24 * 30
        },
        {
            urlPattern: /https?:\/\/[^\/]+\/.*\.(png|jpg|jpeg|gif|svg|ico|woff2|ttf|js|css?)(\?.*)?/,
            handler: "CacheFirst",
            maxAgeSeconds: 60 * 60 * 24 * 365
        },
        {
            urlPattern: /^https:\/\/ik.imagekit.io\//,
            handler: "CacheFirst",
            maxAgeSeconds: 0
        },
        {
            urlPattern: /^https:\/\/weavatar.com\/avatar\//,
            handler: "CacheFirst",
            maxAgeSeconds: 60 * 60 * 24 * 30
        },
        {
            urlPattern: /^https:\/\/assets.ksable.top\/js\/my-js.js/,
            handler: "CacheFirst",
            maxAgeSeconds: 60 * 60 * 24 * 1
        }
    ],
    exclude: [
        new RegExp(`^https://${location.hostname}/sw.js`,'gi')
    ],
    precacheUrls: [
    ]
};

const CACHE_NAME = `${swconfig.CACHE_VERSION}-cache`;
const CACHE_META_KEY = 'cache-meta';
const OFFLINE_URL = '/offline.html';

// 匹配请求对应的规则
function matchRule(request) {
    const url = request.url;

    // 检查排除规则
    for (const pattern of swconfig.exclude) {
        if (pattern.test(url)) return null;
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

// 获取缓存元数据
async function getCacheMeta() {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(CACHE_META_KEY);
    return response ? await response.json() : {};
}

// 更新缓存元数据
async function updateCacheMeta(url, timestamp) {
    const cache = await caches.open(CACHE_NAME);
    const meta = await getCacheMeta();

    meta[url] = {
        timestamp,
        cachedAt: Date.now()
    };

    await cache.put(
        CACHE_META_KEY,
        new Response(JSON.stringify(meta), {
            headers: { 'Content-Type': 'application/json' }
        })
    );
}

// 后台更新缓存
async function backgroundUpdate(request, rule) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);

        if (!cachedResponse) return;

        // 准备验证头
        const headers = new Headers();
        const etag = cachedResponse.headers.get('ETag');
        const lastModified = cachedResponse.headers.get('Last-Modified');

        if (etag) headers.set('If-None-Match', etag);
        if (lastModified) headers.set('If-Modified-Since', lastModified);

        // 发送验证请求
        const networkResponse = await fetch(request, {
            headers,
            cache: 'no-cache'
        });

        if (networkResponse.status === 304) {  // 未修改
            await updateCacheMeta(request.url, Date.now());
        } else if (networkResponse.ok) {  // 资源已更新
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
            await updateCacheMeta(request.url, Date.now());
        }
    } catch (error) {
        console.error('Background update failed:', error);
    }
}

// 安装阶段 - 初始化缓存
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // 初始化缓存元数据
            return cache.put(
                CACHE_META_KEY,
                new Response('{}', {
                    headers: { 'Content-Type': 'application/json' }
                })
            ).then(() => {
                // 预缓存关键资源
                return cache.addAll(swconfig.precacheUrls);
            });
        }).then(() => self.skipWaiting())
    );
});

// 激活阶段 - 清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME && name.startsWith('v')) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
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
                    // 首先尝试网络请求
                    const networkResponse = await fetch(request);
                    return networkResponse;
                } catch (error) {
                    // 网络失败时返回离线页面
                    if (OFFLINE_URL){
                        const offlineResponse = await caches.match(OFFLINE_URL);
                        if (offlineResponse) {
                            return offlineResponse;
                        }
                    }
                    // 如果离线页面也未缓存，返回简单错误响应
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
            event.respondWith(fetch(request));
            break;

        case 'CacheOnly':
            event.respondWith(
                caches.match(request).then(response => response || Response.error())
            );
            break;

        case 'NetworkFirst':
            event.respondWith(
                fetch(request).catch(() => caches.match(request))
            );
            break;

        case 'CacheFirst':
        default:
            event.respondWith((async () => {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(request);
                const meta = await getCacheMeta();
                const url = request.url;
                const metaEntry = meta[url];

                // 如果找到缓存
                if (cachedResponse) {
                    // 检查是否需要后台更新
                    if (rule.maxAgeSeconds > 0 && metaEntry) {
                        const age = (Date.now() - metaEntry.cachedAt) / 1000;
                        if (age > rule.maxAgeSeconds) {
                            // 后台更新不影响当前响应
                            event.waitUntil(backgroundUpdate(request, rule));
                        }
                    }
                    return cachedResponse;
                }

                // 没有缓存则请求网络
                try {
                    const networkResponse = await fetch(request);
                    if (networkResponse.ok) {
                        const responseClone = networkResponse.clone();
                        await cache.put(request, responseClone);
                        await updateCacheMeta(url, Date.now());
                    }
                    return networkResponse;
                } catch (error) {
                    return Response.error();
                }
            })());
            break;
    }
});