---
title: "03-WebSocket"
category: "网络协议"
excerpt: "客户端每隔一段时间就向服务器发送请求，询问是否有新数据，服务器不断响应请求。 缺点：服务器端需要不断的维护连接，占用资源，浪费带宽。 适用场景：实时性要求不高，数据量不大，对实时性要求不高的场景。 客户端发起一个 HTTP 请求到服务器。服..."
---



## 轮询
>[!TIP]
> - 客户端每隔一段时间就向服务器发送请求，询问是否有新数据，服务器不断响应请求。
> - 缺点：服务器端需要不断的维护连接，占用资源，浪费带宽。
> - 适用场景：实时性要求不高，数据量不大，对实时性要求不高的场景。
 
## 长轮询
>[!TIP]
> - 客户端发起一个 HTTP 请求到服务器。服务器不会立即响应，而是保持连接。
> - 直到有数据可读，才会返回数据，或者超时时间到达时，服务器关闭连接。
> - 客户端收到响应后，立即（或稍作延迟）发起下一个新的长轮询请求。
> - 优点：服务器端不需要维护连接，节省资源，减少带宽消耗。
> - 适用场景：实时性要求高，数据量大，对实时性要求高的场景。

## SSE
>[!TIP]
> - 服务器端发送事件流到客户端。
> - 客户端接收到事件流后，可以立即处理事件，或者等待事件流结束。
> - 优点：服务器端可以主动推送数据，节省客户端请求，提高实时性。
> - 适用场景：实时性要求高，数据量大，对实时性要求高的场景。
::: details 前端实现 SSE
```javascript
// 客户端
const source = new EventSource('http://localhost:8080/events');

source.onmessage = function(event) {
  console.log('收到消息：' + event.data);
};

    // 服务器
const http = require('http');
const sse = require('sse-stream');

const server = http.createServer();
const stream = sse();

// 监听客户端连接 监听 request 事件
server.on('request', function(req, res) {
  if (req.url === '/events') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.writeHead(200);
    res.write(stream.init());
    // 发送消息
    stream.write('hello');
    // 关闭连接
    stream.end();
    res.end();
  }
});

server.listen(8080, function() {
  console.log('服务器已启动，端口：8080');
});
```
:::

## WebSocket
>[!TIP]
> - WebSocket 是一种协议，使得客户端和服务器之间可以建立持久性连接。
> - WebSocket 连接建立后，服务器和客户端之间可以互相发送数据，双方都可以实时收发数据。
> - WebSocket 协议自身支持压缩，解决了 HTTP 协议的性能瓶颈。
> - 优点：WebSocket 协议支持双向通信，实时性高，节省带宽。
> - 适用场景：实时性要求高，数据量大，对实时性要求高的场景。
> - 缺点：兼容性不好，需要浏览器支持，需要服务器支持。
::: details 前端实现 WebSocket
```javascript
// 客户端
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = function() {
  console.log('WebSocket 已连接');
};
// 接收服务端消息 监听 onmessage 事件
ws.onmessage = function(event) {
  console.log('收到消息：' + event.data);
};

// 服务器
const http = require('http');
const WebSocketServer = require('ws').Server;

const server = http.createServer();
const wss = new WebSocketServer({ server });

// 监听客户端连接 监听 connection 事件
wss.on('connection', function(ws) {
  console.log('WebSocket 已连接');
  ws.on('message', function(message) {
    console.log('收到消息：' + message);
    ws.send('已收到消息：' + message);
  });
});

server.listen(8080, function() {
  console.log('服务器已启动，端口：8080');
});
```
:::