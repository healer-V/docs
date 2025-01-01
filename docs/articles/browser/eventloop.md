# Event Loop

## 1、什么是 Event Loop？
>[!tip]
> - Event Loop 是 JavaScript 运行环境中用于处理并执行异步任务的机制。它是单线程的，这意味着同一时刻只能执行一个任务。
> - Event Loop 的工作原理是，当执行栈为空，Event Loop 会等待异步任务的完成，并将回调函数推入执行栈，执行完毕后再继续下一个任务。

## 2、Event Loop 的实现

> - Event Loop 的实现主要依赖于浏览器的内核，比如 Chrome 浏览器的 V8 引擎，Node.js 的 libuv 库。

### 2.1、浏览器的 Event Loop

> - 浏览器的 Event Loop 实现是基于 HTML5 规范中的 Web Workers API。
