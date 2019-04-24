const cacheName = 'v1';
const appShellFiles = [
    '/img/other.jpg',
];

// 当页面成功注册了 service workers 之后,就会发生 install 事件
self.addEventListener('install', function (e) {
    console.log('[Service Worker] Install');
    self.skipWaiting();
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(appShellFiles);
        })
    );
});

// 当监听到 activate 时，可以对CacheStorage进行更新、清理等：
self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Activate');
    event.waitUntil(
        Promise.all([
            // 更新客户端
            self.clients.claim(),
            // 清理旧版本
            caches.keys().then(function (keyList) {
                return Promise.all(keyList.map(function (key) {
                    if (cacheName.indexOf(key) === -1) {
                        return caches.delete(key);
                    }
                }));
            })
        ])
    );
});

const noCacheUrls = ['index.html', 'sendNotification', '8000', 'npm', '5984', 'cradb', 'sendSync'];

// 拦截与处理请求
self.addEventListener('fetch', function (e) {

    e.respondWith(
        caches.match(e.request).then(function (r) {
            // 这里可以定义缓存读取策略
            let item = noCacheUrls.find(item => {
                return e.request.url.indexOf(item) !== -1;
            });
            if (item) {
                return fetch(e.request).then(function (response) {
                    return response;
                });
            } else {
                console.log('[Service Worker] Fetching resource: ' + e.request.url);
                return r || fetch(e.request).then(function (response) {
                    return caches.open(cacheName).then(function (cache) {
                        console.log('[Service Worker] Caching new resource: ' + e.request.url);
                        cache.put(e.request, response.clone());
                        return response;
                    });
                });
            }
        })
    );
});

// Register event listener for the 'push' event.
self.addEventListener('push', function (event) {
    // Retrieve the textual payload from event.data (a PushMessageData object).
    // Other formats are supported (ArrayBuffer, Blob, JSON), check out the documentation
    // on https://developer.mozilla.org/en-US/docs/Web/API/PushMessageData.

    const payload = event.data ? event.data.json() : {};

    if (payload.tag === 'silent') {
        SendMsg(payload.data);
    } else if (payload.tag === 'openWindow') {
        showNotification(event, payload);
    }

});

const messageMap = {};

self.addEventListener('message', function (e) {
    console.log('service worker收到消息', e.data);
    messageMap[e.data.tag] = e.data.msg;
});


// 后端同步
self.addEventListener('sync', event => {
    if (event.tag === 'send-tag') {
        console.log(event.tag, messageMap[event.tag]);
        event.waitUntil(
            fetch('http://127.0.0.1:8000/sendSync', {
                method: 'post',
                mode: 'cors',
                body: JSON.stringify(messageMap[event.tag]),
            }).then(response => {
                return response.json();
            })
                .then(payload => {
                    if (payload.tag === 'silent') {
                        SendMsg(payload.data);
                    } else if (payload.tag === 'openWindow') {
                        showNotification(event, payload);
                    }
                    return payload;
                })
                .catch(err => {
                    console.log(err);
                })
        );
    }
});

// 点击通知事件
self.onnotificationclick = function (event) {
    console.log('On notification click: ', event.notification.tag);
    event.notification.close();
    openWindow(event, event.notification.data || 'http://haojie.58.com/');
};

function openWindow(event, url) {
    event.waitUntil(
        clients.matchAll({
            type: 'window'
        })
            .then(function (windowClients) {
                console.log('WindowClients', windowClients);
                for (var i = 0; i < windowClients.length; i++) {
                    var client = windowClients[i];
                    console.log('WindowClient', client);
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
}

// postMessage
function SendMsg(data) {
    self.clients.matchAll()
        .then(function (clients) {
            if (clients && clients.length) {
                clients.forEach(function (client) {
                    client.postMessage(data);
                })
            }
        })
}

// showNotification
function showNotification(event, payload) {
    var notif = self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon,
        tag: payload.tag,
        data: payload.data.url
    });
    event.waitUntil(notif);
}

