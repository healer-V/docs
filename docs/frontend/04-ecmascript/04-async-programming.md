---
title: "ES6+ 异步编程"
category: "前端 · ECMAScript"
tags:
  - ECMAScript
  - Promise
  - async/await
  - Generator
date: 2026-03-17
excerpt: "系统梳理 ES6+ 的异步编程体系：从 Promise 的状态机制与组合方法，到 Generator 协程控制流，再到 async/await 语法糖与异步迭代器，帮助你写出清晰可维护的异步代码。"
---

# ES6+ 异步编程

## 一、Promise

### 1. 三种状态

Promise 是一个表示异步操作最终完成或失败的对象，内部有且仅有三种状态：

| 状态 | 说明 | 是否可逆 |
|------|------|----------|
| `pending` | 初始状态，操作进行中 | — |
| `fulfilled` | 操作成功完成 | 不可逆 |
| `rejected` | 操作失败 | 不可逆 |

状态只能由 `pending` 单向转移到 `fulfilled` 或 `rejected`，一旦转移就不再变化。

::: tip 状态不可逆的意义
已敲定（settled）的 Promise 可以被多次 `.then()` 监听，每次都会获得相同的值，不会因重复订阅而触发副作用。
:::

::: details 基本创建与状态演示

```js
// 创建一个立即完成的 Promise
const p1 = new Promise((resolve, reject) => {
  resolve('操作成功');
});

// 创建一个延迟完成的 Promise
const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// 创建一个失败的 Promise
const p2 = new Promise((resolve, reject) => {
  reject(new Error('操作失败'));
});

p1.then((value) => console.log(value));   // '操作成功'
p2.catch((err) => console.error(err.message)); // '操作失败'
```
:::

### 2. 链式调用

`.then()` 返回一个新的 Promise，因此可以无限链式调用，替代回调地狱。

::: details 链式调用示例

```js
// src/api/user.js
function fetchUserId() {
  return Promise.resolve(42);
}

function fetchUserProfile(id) {
  return Promise.resolve({ id, name: '张三', age: 28 });
}

function fetchUserPosts(userId) {
  return Promise.resolve([
    { id: 1, title: '第一篇文章' },
    { id: 2, title: '第二篇文章' },
  ]);
}

fetchUserId()
  .then((id) => fetchUserProfile(id))       // 返回新 Promise
  .then((profile) => {
    console.log('用户信息:', profile.name);
    return fetchUserPosts(profile.id);      // 继续链式
  })
  .then((posts) => {
    console.log('文章数量:', posts.length);
  });
```
:::

### 3. 错误处理

链式调用中任意一环抛出错误，都会被最近的 `.catch()` 捕获。

::: warning 注意 `.then(null, handler)` 与 `.catch()` 的区别
`.catch(handler)` 等价于 `.then(null, handler)`，但 `.catch()` 还能捕获前一个 `.then()` 成功回调中抛出的错误，而 `.then(onFulfilled, onRejected)` 的 `onRejected` 无法捕获同一个 `.then()` 的 `onFulfilled` 中抛出的错误。
:::

::: details 错误处理示例

```js{8,12}
function riskyOperation(value) {
  return new Promise((resolve, reject) => {
    if (value < 0) reject(new Error('值不能为负数'));
    else resolve(value * 2);
  });
}

riskyOperation(-1)
  .then((result) => {
    console.log('结果:', result);
    // 这里抛出的错误也会被下方 .catch() 捕获
    throw new Error('then 中的错误');
  })
  .catch((err) => {
    console.error('捕获到错误:', err.message);
  })
  .finally(() => {
    // 无论成功失败都会执行，常用于清理操作
    console.log('清理完毕');
  });
```
:::

### 4. 组合方法

ES6+ 提供了四个静态组合方法，适用于不同的并发场景：

| 方法 | 触发条件 | 适用场景 |
|------|----------|----------|
| `Promise.all(arr)` | 全部成功才 fulfilled，任一失败立即 rejected | 多个互相依赖的请求 |
| `Promise.race(arr)` | 最快敲定的那个决定结果 | 超时控制、竞速 |
| `Promise.allSettled(arr)` | 全部敲定后返回每个结果状态 | 批量操作，需要知道每个结果 |
| `Promise.any(arr)` | 任一成功即 fulfilled，全部失败才 rejected | 多个备用数据源 |

::: details 四种组合方法对比示例

```js{3,14,25,36}
const p1 = Promise.resolve(1);
const p2 = Promise.resolve(2);
const p3 = Promise.reject(new Error('p3 失败'));

// Promise.all —— 全部成功才返回
Promise.all([p1, p2])
  .then((values) => console.log('all:', values)) // [1, 2]
  .catch((err) => console.error(err.message));

Promise.all([p1, p3])
  .catch((err) => console.error('all 失败:', err.message)); // 'p3 失败'

// Promise.race —— 最快的决定结果
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('超时')), 3000)
);
Promise.race([fetch('/api/data'), timeout])
  .then((res) => console.log('race 结果:', res))
  .catch((err) => console.error('race 失败:', err.message));

// Promise.allSettled —— 全部完成，不管成败
Promise.allSettled([p1, p2, p3]).then((results) => {
  results.forEach((r) => {
    if (r.status === 'fulfilled') console.log('成功:', r.value);
    else console.log('失败:', r.reason.message);
  });
});

// Promise.any —— 任一成功即可
Promise.any([p3, p1, p2])
  .then((first) => console.log('any 第一个成功:', first)) // 1
  .catch((err) => console.error('全部失败:', err)); // AggregateError
```
:::

---

## 二、Generator 函数

### 1. 基本概念

Generator 函数使用 `function*` 声明，调用后返回一个迭代器对象，执行到 `yield` 时暂停，并将值传出。

::: details Generator 基本用法

```js{1,3,5}
function* counter() {
  console.log('开始');
  yield 1;
  console.log('第二步');
  yield 2;
  console.log('结束');
  return 3;
}

const gen = counter();

console.log(gen.next()); // 开始  →  { value: 1, done: false }
console.log(gen.next()); // 第二步 → { value: 2, done: false }
console.log(gen.next()); // 结束  →  { value: 3, done: true }
console.log(gen.next()); //          { value: undefined, done: true }
```
:::

### 2. next() 传参

`next(value)` 的参数会成为上一个 `yield` 表达式的返回值，实现双向通信。

::: details next() 传参示例

```js{6}
function* dialog() {
  const name = yield '你叫什么名字？';
  const age  = yield `${name}，你几岁了？`;
  return `${name} 今年 ${age} 岁。`;
}

const gen = dialog();
console.log(gen.next().value);          // '你叫什么名字？'
console.log(gen.next('张三').value);    // '张三，你几岁了？'
console.log(gen.next(28).value);        // '张三 今年 28 岁。'
```
:::

### 3. return() 与 throw()

- `gen.return(value)` 强制终止迭代，返回指定值
- `gen.throw(error)` 向 Generator 内部抛出错误，可被内部 `try/catch` 捕获

::: details return 与 throw 示例

```js
function* safeGen() {
  try {
    yield 1;
    yield 2;
  } catch (err) {
    console.error('内部捕获:', err.message);
    yield -1; // 错误恢复后继续
  }
}

const gen = safeGen();
console.log(gen.next());          // { value: 1, done: false }
console.log(gen.throw(new Error('外部错误'))); // 内部捕获: 外部错误  → { value: -1, done: false }
console.log(gen.return('终止'));  // { value: '终止', done: true }
```
:::

---

## 三、async/await

### 1. 基本用法

`async` 函数始终返回 Promise，`await` 只能在 `async` 函数或顶层模块中使用，它暂停当前 `async` 函数直到 Promise 敲定。

::: details async/await 基本示例

```js
// src/api/order.js
async function createOrder(userId, items) {
  const user    = await fetchUser(userId);        // 等待用户信息
  const stock   = await checkStock(items);        // 检查库存
  const orderId = await saveOrder(user, stock);   // 保存订单
  return orderId;
}

createOrder(1, ['商品A', '商品B'])
  .then((id) => console.log('订单ID:', id))
  .catch((err) => console.error('下单失败:', err.message));
```
:::

### 2. 错误捕获

有两种常见的错误捕获方式：`try/catch` 块和封装工具函数。

::: details 错误捕获方式对比

```js
// 方式一：try/catch（推荐，语义清晰）
async function loadData(id) {
  try {
    const data = await fetchData(id);
    return data;
  } catch (err) {
    console.error('加载失败:', err.message);
    return null;
  }
}

// 方式二：封装 to() 工具，避免嵌套 try/catch
function to(promise) {
  return promise.then((data) => [null, data]).catch((err) => [err, null]);
}

async function loadUser(id) {
  const [err, user] = await to(fetchUser(id));
  if (err) {
    console.error('获取用户失败:', err.message);
    return;
  }
  console.log('用户:', user.name);
}
```
:::

### 3. 并行执行

顺序 `await` 会导致请求串行，应使用 `Promise.all` 实现真正的并行。

::: warning 串行 await 的性能陷阱
如果两个请求没有依赖关系，却写成顺序 `await`，总耗时 = 请求1耗时 + 请求2耗时，而并行写法总耗时 = max(请求1耗时, 请求2耗时)。
:::

::: details 串行 vs 并行对比

```js
// 串行（错误示范）—— 总耗时约 2s
async function loadSerial() {
  const user    = await fetchUser(1);    // 1s
  const posts   = await fetchPosts(1);  // 1s
  return { user, posts };
}

// 并行（正确做法）—— 总耗时约 1s
async function loadParallel() {
  const [user, posts] = await Promise.all([
    fetchUser(1),    // 同时发起
    fetchPosts(1),   // 同时发起
  ]);
  return { user, posts };
}

// 当需要用第一个结果决定第二个请求时，才应串行
async function loadDependent() {
  const user    = await fetchUser(1);
  const profile = await fetchProfile(user.profileId); // 依赖 user
  return profile;
}
```
:::

### 4. 常见陷阱

::: danger 在 forEach 中使用 await
`Array.prototype.forEach` 不等待异步回调，应改用 `for...of` 或 `Promise.all + map`。
:::

::: details forEach 陷阱与修复

```js{3,13,20}
const ids = [1, 2, 3];

// 错误：forEach 不等待 async 回调
async function wrongWay() {
  ids.forEach(async (id) => {
    await processItem(id); // 这里的 await 只在回调内部有效
  });
  console.log('完成'); // 实际上在所有 processItem 完成前就打印了
}

// 正确方式一：for...of（串行，按顺序处理）
async function serialWay() {
  for (const id of ids) {
    await processItem(id);
  }
  console.log('全部完成');
}

// 正确方式二：Promise.all + map（并行）
async function parallelWay() {
  await Promise.all(ids.map((id) => processItem(id)));
  console.log('全部完成');
}
```
:::

---

## 四、异步迭代器

### 1. for await...of

`for await...of` 用于消费异步可迭代对象（实现了 `Symbol.asyncIterator` 的对象），常见于处理流式数据。

::: details for await...of 基本示例

```js
// 模拟异步数据源（如分页接口、文件流）
async function* pageFetcher(totalPages) {
  for (let page = 1; page <= totalPages; page++) {
    // 模拟网络请求
    const data = await fetch(`/api/items?page=${page}`).then((r) => r.json());
    yield data.items;
  }
}

async function loadAllItems() {
  const allItems = [];
  for await (const items of pageFetcher(5)) {
    allItems.push(...items);
    console.log(`已加载 ${allItems.length} 条数据`);
  }
  return allItems;
}
```
:::

### 2. 自定义异步可迭代对象

通过实现 `Symbol.asyncIterator` 方法，可以让任意对象支持 `for await...of`。

::: details 自定义异步迭代器

```js{5}
class AsyncQueue {
  #items = [];
  #waiters = [];

  [Symbol.asyncIterator]() {
    return {
      next: () =>
        new Promise((resolve) => {
          if (this.#items.length > 0) {
            resolve({ value: this.#items.shift(), done: false });
          } else {
            this.#waiters.push(resolve);
          }
        }),
    };
  }

  push(item) {
    if (this.#waiters.length > 0) {
      this.#waiters.shift()({ value: item, done: false });
    } else {
      this.#items.push(item);
    }
  }
}

// 使用
const queue = new AsyncQueue();
setTimeout(() => queue.push('消息1'), 100);
setTimeout(() => queue.push('消息2'), 200);

(async () => {
  for await (const msg of queue) {
    console.log('收到:', msg);
    // 注意：此示例中需要额外的终止逻辑
    break;
  }
})();
```
:::
