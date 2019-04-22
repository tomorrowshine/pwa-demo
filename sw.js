// https://segmentfault.com/a/1190000012353473?utm_source=tag-newest
var cacheName = 'v1';
var appShellFiles = [
  '/index.html',
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

// 拦截与处理请求
self.addEventListener('fetch', function (e) {

  e.respondWith(
    caches.match(e.request).then(function (r) {
      // 这里可以定义缓存读取策略
      if (e.request.url.indexOf('index.html') !== -1 || e.request.url.indexOf('sendNotification') !== -1 || e.request.url.indexOf('8000') !== -1 || e.request.url.indexOf('npm') !== -1 || e.request.url.indexOf('5984') !== -1 || e.request.url.indexOf('cradb') !== -1) {
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
    var notif = self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      tag: payload.tag,
      data: payload.data.url
    });
    event.waitUntil(notif);
  }

});

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

