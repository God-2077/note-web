// 注册Service Worker的函数
async function registerServiceWorker() {
    // 检查浏览器是否支持Service Worker
    if ('serviceWorker' in navigator) {
        try {
            // 延迟注册，避免影响关键资源加载
            await new Promise(resolve => setTimeout(resolve, 3000));

            // 注册Service Worker
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('Service Worker注册成功，范围:', registration.scope);

            // 处理更新逻辑
            if (registration.waiting) {
                console.log('有新的Service Worker等待激活');
                // 可以提示用户更新
            }

            // 监听新的Service Worker安装
            registration.addEventListener('updatefound', () => {
                const installingWorker = registration.installing;
                console.log('发现新的Service Worker正在安装:', installingWorker);

                installingWorker.addEventListener('statechange', () => {
                    switch (installingWorker.state) {
                        case 'installed':
                            if (navigator.serviceWorker.controller) {
                                console.log('新的Service Worker已安装，等待激活');
                                // 可以提示用户重启应用
                            } else {
                                console.log('Service Worker首次安装并激活');
                                iziToast.success({
                                    title: 'Service Worker首次安装并激活',
                                    message: '范围:' + registration.scope + '<br />页面加载速度将会大幅度提升',
                                    timeout: 5000,
                                    displayMode: 2,
                                    position: 'topRight'
                                });
                            }
                            break;
                        case 'activated':
                            console.log('Service Worker已激活');
                            break;
                    }
                });
            });
        } catch (error) {
            console.error('Service Worker注册失败:', error);
            iziToast.error({
                title: 'Service Worker注册失败',
                message: 'ERROR: ' + error,
                timeout: 5000,
                displayMode: 2,
                position: 'topRight',
                buttons: [
                    ['<button>禁用 Service Worker</button>', (instance, toast) => {
                        // 注销Service Worker
                        try {
                            navigator.serviceWorker.getRegistrations().then(registrations => {
                                registrations.forEach(registration => {
                                    registration.unregister();
                                });
                            });
                            localStorage.setItem('serviceWorkerRegistered', '0')
                        } catch (error) { }
                        localStorage.setItem('serviceWorkerEnabled', '0');
                        iziToast.success({
                            title: 'Service Worker 已禁用',
                            timeout: 5000,
                            displayMode: 2,
                            position: 'topRight'
                        });
                        instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                    }, true],
                ]
            });
        }
    } else {
        console.log('浏览器不支持Service Worker');
        localStorage.setItem('serviceWorkerEnabled', '0');
    }
}

// 页面加载完成后注册Service Worker
if (localStorage.getItem('serviceWorkerEnabled') !== '0') {
    // 确保只添加一次事件监听
    if (!window.__serviceWorkerRegistered) {
        window.addEventListener('load', registerServiceWorker);
        window.__serviceWorkerRegistered = true;
    }
}

// 监听控制器变更事件
navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker控制器已变更');
    // 可以执行页面刷新等操作
});