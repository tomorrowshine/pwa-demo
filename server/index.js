// Use the web-push library to hide the implementation details of the communication
// between the application server and the push service.
// For details, see https://tools.ietf.org/html/draft-ietf-webpush-protocol and
// https://tools.ietf.org/html/draft-ietf-webpush-encryption.

// 公钥私钥生成 https://web-push-codelab.glitch.me/ 

// http://www.connecto.io/kb/knwbase/getting-gcm-sender-id-and-gcm-api-key/

const webPush = require('web-push');
const http = require('http');

process.env.VAPID_PUBLIC_KEY = 'BBh0BvNIu56yhPEScv6KxycqSmpRBY2cc5-Z2697zS412keLKLuAYXDtPGVPE2uijwWhj14Ffoq1J0PhzwWOba4';
process.env.VAPID_PRIVATE_KEY = 'jOH8LzYbt8a0O2Rgbvd1N3ZPxVNYtlVsfQ7tJNcXKpE';

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log("You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY " +
        "environment variables. You can use the following ones:");
    console.log(webPush.generateVAPIDKeys());
    return;
}
// webpush.setGCMAPIKey('<Your GCM API Key Here>');
// // Set the keys used for encrypting the push messages.
// webPush.setVapidDetails(
//     'https://serviceworke.rs/',
//     process.env.VAPID_PUBLIC_KEY,
//     process.env.VAPID_PRIVATE_KEY
// );

const server = http.createServer((req, res) => {
    console.log('req', req.url);
    // 添加响应头
    res.setHeader('Access-Control-Allow-Origin', '*');
    var postData = "";
    /**
     * 因为post方式的数据不太一样可能很庞大复杂，
     * 所以要添加监听来获取传递的数据
     * 也可写作 req.on("data",function(data){});
     */
    req.addListener("data", function (data) {
        postData += data;
    });
    /**
     * 这个是如果数据读取完毕就会执行的监听方法
     */
    req.addListener("end", function () {
        console.log(postData);

        var query = JSON.parse(postData);
        if (req.url === '/sendNotification') {
            pushMsg(query, res);
        } else if (req.url === '/sendSync') {
            setTimeout(function () {
                console.log('setTimeout end');
                const payload = {
                    title: '后端同步测试',
                    body: '点开看看吧',
                    icon: '/img/icon.png',
                    tag: 'openWindow',//silent  openWindow,
                    data: { title: '电脑', url: "http://127.0.0.1:3000/img/other.jpg" }
                };
                res.end(JSON.stringify(payload));
            }, 5000);
        }
    });

});

function pushMsg(query, res) {
    if (!query.subscription) {
        return res.end('subscription is null');
    } else {
        setTimeout(function () {
            console.log('setTimeout end');
            // push的数据
            const payload = {
                title: '收到一个图片',
                body: '点开看看吧',
                icon: '/img/icon.png',
                tag: 'openWindow',//silent  openWindow,
                data: { title: '电脑', url: "http://127.0.0.1:3000/img/other.jpg" }
            };
            webPush.sendNotification(query.subscription, JSON.stringify(payload));
        }, 5000);
        res.end('ok');
    }
}

server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(8000);