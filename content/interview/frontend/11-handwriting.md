---
title: "手写题面试题"
tags:
  - JavaScript
  - Promise
  - 算法
excerpt: "围绕发布订阅、Promise 组合、函数绑定、数组处理、深拷贝以及防抖节流，明确手写实现的输入约束、核心机制、可运行结果和与原生 API 的差距。"
---

# 手写题面试题

手写题首先要说清实现范围：是否处理空输入、异常、对象身份、构造调用和取消。下面的片段均以 Node.js 22 或更高版本为运行环境；每道题使用独立的 `.mjs` 文件，按所在题目的文件名创建后运行。

## 一、发布订阅如何实现，取消订阅为什么必须使用原回调？

**发布订阅把主题与多个监听函数关联起来；发布时只调用该主题当前登记的监听函数。** 用 `Map` 保存主题，用 `Set` 避免同一函数重复登记。

在空目录创建 `pubsub.mjs`，运行 `node pubsub.mjs`：

::: details 查看发布订阅完整实现

```javascript
// pubsub.mjs
/** 按主题维护监听函数的最小发布订阅器。 */
class PubSub {
  /** 初始化主题表；无返回值。 */
  constructor() { this.topics = new Map(); }

  /**
   * 订阅主题。
   * @param topic 非空主题名，作为 Map 键使用。
   * @param listener 收到消息时执行的函数。
   * @returns 无返回值；登记同一函数两次只保留一次。
   */
  on(topic, listener) {
    if (!this.topics.has(topic)) this.topics.set(topic, new Set());
    this.topics.get(topic).add(listener);
  }

  /**
   * 取消指定订阅。
   * @param topic 原订阅时使用的主题名。
   * @param listener 原订阅时的同一个函数对象。
   * @returns 无返回值；主题不存在时不报错。
   */
  off(topic, listener) {
    const listeners = this.topics.get(topic);
    if (!listeners) return;
    listeners.delete(listener);
    if (listeners.size === 0) this.topics.delete(topic);
  }

  /**
   * 向当前订阅者发布消息。
   * @param topic 要通知的主题名。
   * @param payload 传给监听函数的业务数据。
   * @returns 无返回值；监听函数抛错时错误向调用方传播。
   */
  emit(topic, payload) {
    for (const listener of [...(this.topics.get(topic) ?? [])]) listener(payload);
  }
}

/** 输出已支付订单编号；无返回值。 */
function reportPaid(orderId) { console.log(orderId); }
const bus = new PubSub();
bus.on("paid", reportPaid);
bus.emit("paid", "A-42");
bus.off("paid", reportPaid);
bus.emit("paid", "B-17");
```

:::

输出仅有 `A-42`。示例会让监听异常向发布方传播，生产实现还需定义错误隔离、一次性订阅和生命周期清理策略。

::: tip 退订必须使用登记时的同一个函数
取消订阅比较的是函数身份。临时写一个内容相同的新箭头函数，也无法移除原监听；组件卸载时应保存并传入原回调。
:::

## 二、手写 Promise 状态机要守住哪些规则？

**Promise 有 pending、fulfilled、rejected 三种状态；一旦确定结果就不能再次改变。** executor 同步执行，后续处理回调异步安排；抛出的异常转为拒绝。

### 1. 状态变化如何约束

1. 只有 pending 能转到 fulfilled 或 rejected；第二次调用 resolve/reject 无效。
2. 成功值或失败原因应保存，使结果已确定后注册的 `then` 回调仍能收到结果。
3. 真正符合规范的 resolve 还要采用其他 Promise 或 thenable 的结果，检查自解析，并处理可抛错的 `then` 访问。只做“赋状态”不等于完整 Promise。

下面一题给出教学版实现，它接受构造函数 resolve 的普通值；回调返回值的 thenable 采用由原生 `Promise.resolve` 处理，因此不宣称它是独立的规范实现。

::: warning 状态已确定不等于回调立即同步执行
`then` 回调需要异步排队。若在 resolve 时直接调用回调，`console.log` 输出顺序会与原生 Promise 不同，可能产生难以发现的重入问题。
:::

参考：[ECMAScript：Promise 对象](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-objects)。

## 三、then 链如何传播返回值和错误？

**每次 `then` 返回一个新 Promise。** 成功回调的返回值决定下一段成功值，抛错决定下一段失败原因；没有对应回调时，应把原结果继续传下去。

在空目录创建 `promise-chain.mjs`，运行 `node promise-chain.mjs`。下面的教学版演示状态、异步通知和基础链式传播；构造函数的 resolve 不采用 thenable，回调返回 thenable 时委托原生 Promise 处理。

::: details 查看教学版 Promise 状态与 then 链

```javascript
// promise-chain.mjs
/** 演示 Promise 状态转换与基础 then 链，不实现完整规范。 */
class MiniPromise {
  #state = "pending";
  #result;
  #handlers = [];

  /** 同步执行 executor，接收普通成功值或失败原因；无返回值。 */
  constructor(executor) {
    /** 将实例确定为成功；无返回值，重复调用无效。 */
    const fulfill = value => this.#settle("fulfilled", value);
    /** 将实例确定为失败；无返回值，重复调用无效。 */
    const reject = reason => this.#settle("rejected", reason);
    try { executor(fulfill, reject); } catch (error) { reject(error); }
  }

  /**
   * 只在 pending 时确定结果并排队通知。
   * @param state 只能是 fulfilled 或 rejected。
   * @param result 成功值或失败原因。
   * @returns 无返回值；已经确定的结果不会改变。
   */
  #settle(state, result) {
    if (this.#state !== "pending") return;
    this.#state = state;
    this.#result = result;
    for (const handler of this.#handlers) queueMicrotask(handler);
    this.#handlers = [];
  }

  /**
   * 注册处理并返回新的教学版 Promise。
   * @param onFulfilled 可选成功回调，接收成功值。
   * @param onRejected 可选失败回调，接收失败原因。
   * @returns 由回调结果确定状态的新 MiniPromise。
   */
  then(onFulfilled, onRejected) {
    let child;
    /**
     * 为子实例登记结果处理。
     * @param fulfill 子实例的成功入口。
     * @param reject 子实例的失败入口。
     * @returns 无返回值；处理在微任务中运行。
     */
    const register = (fulfill, reject) => {
      /** 根据当前状态处理回调；无返回值，异常转为拒绝。 */
      const run = () => {
        try {
          const callback = this.#state === "fulfilled" ? onFulfilled : onRejected;
          if (typeof callback !== "function") {
            if (this.#state === "fulfilled") fulfill(this.#result);
            else reject(this.#result);
            return;
          }
          const next = callback(this.#result);
          if (next === child) throw new TypeError("不能返回自身的链式结果");
          Promise.resolve(next).then(fulfill, reject);
        } catch (error) { reject(error); }
      };
      if (this.#state === "pending") this.#handlers.push(run);
      else queueMicrotask(run);
    };
    child = new MiniPromise(register);
    return child;
  }

  /** 注册失败处理；返回新的 MiniPromise。 */
  catch(onRejected) { return this.then(undefined, onRejected); }
}

/** 将教学实例兑现为 1；无返回值。 */
function resolveOne(resolve) { resolve(1); }
/** 创建已成功的教学版 Promise；返回实例。 */
function createValue() { return new MiniPromise(resolveOne); }
/** 将输入加一；返回新数值。 */
function addOne(value) { return value + 1; }
/** 输出结果；无返回值。 */
function report(value) { console.log(value); }
createValue().then(addOne).then(report);
console.log("同步结束");
```

:::

预期先输出 `同步结束`，再输出 `2`。漏写 return 会把下一段收到的值变成 `undefined`；`catch` 正常返回会把链恢复为成功。这个实现依赖原生 Promise 采用回调结果，未覆盖原生 Promise 的完整 thenable、子类、静态方法和宿主未处理拒绝报告，不能替代生产实现。

## 四、Promise.all 如何保留顺序并处理空输入？

**`all` 等待全部成员成功；任一成员失败时，组合结果拒绝。** 输出顺序按输入位置，而不是完成先后。

在空目录创建 `promise-all.mjs`，运行 `node promise-all.mjs`：

::: details 查看 Promise.all 的完整实现与验证

```javascript
// promise-all.mjs
/**
 * 汇总可迭代输入的结果。
 * @param iterable 任意可迭代对象，成员可以是值或 thenable。
 * @returns 全部成功时按原顺序排列的 Promise；遇首个拒绝即拒绝。
 */
function all(iterable) {
  /**
   * 建立汇总结果。
   * @param resolve 全部成员完成时兑现有序结果的入口。
   * @param reject 任一成员失败时拒绝组合结果的入口。
   * @returns 无返回值；后续成员回调决定结果。
   */
  function collectAll(resolve, reject) {
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) { resolve([]); return; }
    /**
     * 将每个成员映射到原始位置。
     * @param item 当前值或 thenable。
     * @param index 当前输入位置。
     * @returns 无返回值；结果由内部 Promise 回调写入。
     */
    function collect(item, index) {
      /** 保存已完成成员；最后一个成员到达时兑现组合结果。 */
      function save(value) {
        results[index] = value;
        remaining -= 1;
        if (remaining === 0) resolve(results);
      }
      Promise.resolve(item).then(save, reject);
    }
    items.forEach(collect);
  }
  return new Promise(collectAll);
}
console.log(await all([Promise.resolve("A"), "B"]));
console.log(await all([]));
```

:::

输出 `[ 'A', 'B' ]` 和 `[]`。`Promise.resolve` 使普通值与 thenable 都参与组合；已启动的其他操作不会因为组合结果拒绝而自动取消。

参考：[MDN：Promise.all()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)。

## 五、Promise.race 的空输入和失败如何处理？

**`race` 采用第一个确定结果的成员，不论该结果是成功还是失败。** 空输入没有任何成员确定，因此返回的 Promise 保持 pending。

在空目录创建 `promise-race.mjs`，运行 `node promise-race.mjs`：

::: details 查看 promise-race.mjs 的完整代码

```javascript
// promise-race.mjs
/**
 * 使用第一个确定的成员结果。
 * @param iterable 任意可迭代对象，成员可以是值或 thenable。
 * @returns 最先成功或失败的成员所决定的 Promise。
 */
function race(iterable) {
  /**
   * 订阅所有成员的确定结果。
   * @param resolve 首个成功成员的兑现入口。
   * @param reject 首个失败成员的拒绝入口。
   * @returns 无返回值；首个确定的成员决定结果。
   */
  function firstResult(resolve, reject) {
    for (const item of iterable) Promise.resolve(item).then(resolve, reject);
  }
  return new Promise(firstResult);
}
console.log(await race([Promise.resolve("先到"), "后到"]));
```

:::

预期输出 `先到`。如果传入空数组，`race([])` 永不确定；如果第一个确定的成员拒绝，组合结果也拒绝。使用 `race` 做超时只能让等待方提前得到结果，不会停止原请求，还要用底层取消机制清理资源。

参考：[MDN：Promise.race()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)。

## 六、bind 如何保留 this、预设参数与构造调用？

**`bind` 返回新函数；普通调用使用绑定的 this 和预设参数，`new` 调用还要遵守构造规则。** 仅返回 `fn.apply(thisArg, args)` 的简单闭包会在构造调用时出错。

在空目录创建 `bind.mjs`，运行 `node bind.mjs`：

::: details 查看受限 bind 实现与构造验证

```javascript
// bind.mjs
/**
 * 绑定普通函数及部分参数。
 * @param target 可调用函数；构造使用时必须可被 new 调用。
 * @param thisArg 普通调用时指定的 this。
 * @param presetArgs 预设在调用参数前的零个或多个参数。
 * @returns 绑定后的函数；仅演示普通调用与构造调用。
 */
function bindFn(target, thisArg, ...presetArgs) {
  if (typeof target !== "function") throw new TypeError("target 必须是函数");
  /** 合并参数并根据调用形式处理 this；返回目标函数结果。 */
  function bound(...callArgs) {
    const args = [...presetArgs, ...callArgs];
    if (new.target) return Reflect.construct(target, args, target);
    return Reflect.apply(target, thisArg, args);
  }
  return bound;
}
/**
 * 创建订单。
 * @param id 非空订单编号。
 * @param status 初始状态。
 * @returns 构造实例；将字段写入 this。
 */
function Order(id, status) { this.id = id; this.status = status; }
const BoundOrder = bindFn(Order, null, "A-42");
const order = new BoundOrder("paid");
console.log(order.id, order instanceof Order);
```

:::

输出 `A-42 true`。该教学版未模拟原生绑定函数的 `length`、`name`、`prototype` 和全部 `new.target` 语义；生产代码使用原生 `bind`。箭头函数捕获的词法 this 也不能靠 `bind` 改写。

参考：[MDN：Function.bind()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)。

## 七、数组去重为什么不能自动按对象内容合并？

**`Set` 按 SameValueZero 判断原始值是否重复，对象仍按身份判断。** 两个字段相同的新对象会保留为两项。

在空目录创建 `unique.mjs`，运行 `node unique.mjs`：

```javascript
// unique.mjs
/** 按 JavaScript 值身份去重；返回保留首次出现顺序的新数组。 */
function unique(values) { return [...new Set(values)]; }
console.log(unique([1, 1, NaN, NaN]));
const first = { id: "A-42" };
console.log(unique([first, first, { id: "A-42" }]).length);
```

依次输出 `[ 1, NaN ]` 和 `2`。若业务要求按订单编号去重，要先定义重复项保留哪条、缺失编号如何处理，再用 `Map` 或其他明确键策略；不能把对象转 JSON 后直接当通用相等规则。

参考：[MDN：Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)。

## 八、数组扁平化如何处理层级与空槽？

**递归遍历遇到数组时按剩余深度展开，遇到普通值时加入结果。** 下面实现跳过空槽，但仅接受无循环引用的数组，不处理任意类数组对象。

在空目录创建 `flatten.mjs`，运行 `node flatten.mjs`：

::: details 查看数组扁平化完整实现

```javascript
// flatten.mjs
/**
 * 展开指定层数的嵌套数组。
 * @param values 数组，不能包含循环引用。
 * @param depth 非负整数或 Infinity，默认全部展开。
 * @returns 跳过空槽的新数组，不修改输入。
 */
function flatten(values, depth = Infinity) {
  const result = [];
  /**
   * 遍历当前层并记录元素。
   * @param items 当前数组。
   * @param remaining 剩余可展开层数。
   * @returns 无返回值；结果写入外层 result。
   */
  function visit(items, remaining) {
    for (let index = 0; index < items.length; index += 1) {
      if (!(index in items)) continue;
      const item = items[index];
      if (Array.isArray(item) && remaining > 0) visit(item, remaining - 1);
      else result.push(item);
    }
  }
  visit(values, depth);
  return result;
}
console.log(flatten([1, , [2, [3]]], 1));
```

:::

输出 `[ 1, 2, [ 3 ] ]`。输入中有空槽时，本实现和 `flat` 一样跳过被访问层级的空槽；`Infinity` 深度遇到循环数组会无限递归，真实工具需检测并约定如何处理。

## 九、深拷贝为什么必须先限定数据类型？

**“深拷贝”不等于对任何 JavaScript 值都复制出等价对象。** 函数、DOM 节点、访问器、原型、循环引用和资源所有权需要分别定义。下面只复制普通对象与数组的可枚举字符串键，使用 `WeakMap` 保留循环结构。

在空目录创建 `clone-plain.mjs`，运行 `node clone-plain.mjs`：

::: details 查看普通数据对象的循环安全拷贝

```javascript
// clone-plain.mjs
/**
 * 克隆由普通对象、数组和原始值组成的数据。
 * @param value 不包含 Date、Map、函数、DOM 节点及访问器的输入。
 * @param seen 已克隆对象的映射；首次调用无需传入。
 * @returns 独立的普通数据结构，并保留输入中的循环关系。
 */
function clonePlain(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const key of Object.keys(value)) copy[key] = clonePlain(value[key], seen);
  return copy;
}
const order = { id: "A-42", address: { city: "杭州" } };
order.self = order;
const copied = clonePlain(order);
copied.address.city = "上海";
console.log(order.address.city, copied.address.city, copied.self === copied);
```

:::

输出 `杭州 上海 true`，说明嵌套地址与自引用已分别处理。

::: warning 深拷贝的成立范围取决于数据契约
上例没有复制 Symbol 键、属性描述符和特殊对象原型。复制 `Date`、`Map` 等受支持结构可评估 `structuredClone`，但它也不是任意值的万能克隆器；对不满足约束的数据应拒绝或选择专门方案。
:::

参考：[MDN：structuredClone()](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)。

## 十、防抖与节流为什么不能用同一段计时器逻辑？

**防抖等输入停止一段时间才执行；节流限制一段时间内的执行频率。** 连续输入搜索词适合防抖，滚动时定期更新位置可考虑节流。

在空目录创建 `timing.mjs`，运行 `node timing.mjs`。这里的防抖只在末次调用后执行，节流只在窗口首次调用时执行；均不提供取消和尾随调用。

::: details 查看防抖与节流的完整示例

```javascript
// timing.mjs
/**
 * 创建尾随执行的防抖函数。
 * @param action 等待结束后执行的函数。
 * @param wait 非负等待毫秒数。
 * @returns 每次调用都会重置计时器的新函数。
 */
function debounce(action, wait) {
  let timer;
  /** 保存最新参数并重置计时器；无返回值。 */
  return function debounced(...args) {
    clearTimeout(timer);
    /** 等待期结束后以原调用上下文执行动作；无返回值。 */
    const run = () => action.apply(this, args);
    timer = setTimeout(run, wait);
  };
}

/**
 * 创建领先执行的节流函数。
 * @param action 满足时间间隔时执行的函数。
 * @param wait 非负间隔毫秒数。
 * @returns 忽略间隔内后续调用的新函数。
 */
function throttle(action, wait) {
  let lastRun = -Infinity;
  /** 只在距离上次执行足够久时运行动作；返回动作结果或 undefined。 */
  return function throttled(...args) {
    const now = Date.now();
    if (now - lastRun < wait) return;
    lastRun = now;
    return action.apply(this, args);
  };
}

/** 输出搜索词；无返回值。 */
function reportSearch(query) { console.log("搜索", query); }
/** 输出滚动位置；无返回值。 */
function reportScroll(position) { console.log("滚动", position); }
const search = debounce(reportSearch, 20);
const scroll = throttle(reportScroll, 20);
search("A"); search("AB");
scroll(1); scroll(2);
/** 计时结束时使示例继续执行；无返回值。 */
const finish = resolve => setTimeout(resolve, 30);
await new Promise(finish);
scroll(3);
```

:::

预期输出依次为 `滚动 1`、`搜索 AB`、`滚动 3`。重复清除并重新启动计时器的是防抖，不是节流。组件卸载时还应清理待执行任务；生产使用要进一步约定领先/尾随、最大等待、取消和返回值行为。

参考：[MDN：setTimeout()](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout)。

## 十一、手写 `new` 时，返回对象与构造函数返回值如何取舍？

**普通构造函数经 `new` 调用时，会创建关联原型的对象并把它作为 `this`。** 若构造函数显式返回对象或函数，则使用该返回值；返回原始值时仍使用新对象。

在空目录创建 `construct.mjs`，运行 `node construct.mjs`：

::: details 查看普通构造函数的 new 模拟实现

```javascript
// construct.mjs
/**
 * 模拟普通函数的 new 调用。
 * @param Constructor 可由 Function.prototype.apply 调用的普通构造函数，不支持 class。
 * @param args 传给构造函数的剩余参数，可以为空。
 * @returns 构造函数显式返回的对象，或新建且连接原型的对象。
 */
function construct(Constructor, ...args) {
  if (typeof Constructor !== "function") throw new TypeError("需要构造函数");
  const instance = Object.create(Constructor.prototype);
  const returned = Constructor.apply(instance, args);
  return returned !== null &&
    (typeof returned === "object" || typeof returned === "function")
    ? returned : instance;
}

/**
 * 初始化订单对象。
 * @param id 非空订单编号。
 * @param amount 非负订单金额。
 * @returns 无返回值；在新对象上写入字段。
 */
function Order(id, amount) { this.id = id; this.amount = amount; }
const order = construct(Order, "A-42", 30);
console.log(order.id, order.amount, order instanceof Order);
```

:::

预期输出 `A-42 30 true`。这段实现只演示普通构造函数的核心规则；`class` 构造器不能通过 `apply` 调用，`new.target`、内建构造器与特殊原型行为也未模拟。生产代码应直接使用 `new` 或有明确目标的 `Reflect.construct`。

参考：[MDN：new 运算符](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new)、[MDN：Reflect.construct](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/construct)。

## 十二、手写 `instanceof` 为什么要沿原型链查找？

**默认的 `instanceof` 判断对象原型链上是否能找到构造函数的 `prototype`，不是比较 `constructor` 字段。** `constructor` 可以修改，原型链也可以在对象创建后改变。

在空目录创建 `instance-check.mjs`，运行 `node instance-check.mjs`：

::: details 查看默认原型链判断的简化实现

```javascript
// instance-check.mjs
/**
 * 演示默认 instanceof 的原型链查找。
 * @param value 待判断的值；原始值直接返回 false。
 * @param Constructor 具有对象类型 prototype 的普通构造函数。
 * @returns 原型链是否包含 Constructor.prototype。
 */
function isInstance(value, Constructor) {
  if (typeof Constructor !== "function") throw new TypeError("需要构造函数");
  const target = Constructor.prototype;
  if (target === null || typeof target !== "object")
    throw new TypeError("需要对象类型 prototype");
  if (value === null || (typeof value !== "object" && typeof value !== "function"))
    return false;
  let current = Object.getPrototypeOf(value);
  while (current !== null) {
    if (current === target) return true;
    current = Object.getPrototypeOf(current);
  }
  return false;
}

/** 初始化订单对象；无返回值。 */
function Order() {}
console.log(isInstance(new Order(), Order));
console.log(isInstance({}, Order));
```

:::

预期依次输出 `true`、`false`。原生 `instanceof` 还允许构造函数通过 `Symbol.hasInstance` 自定义判断，且有跨 Realm 和特殊内建类型等边界；这段简化实现不声称完全等价。

参考：[MDN：instanceof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)。

## 十三、手写并发限制器如何保证顺序与最大并发数？

**把任务定义为“调用时才启动的函数”，再用固定数量的工作者领取任务。** 如果传入的已经是执行中的 Promise，限制器无法让它们重新排队。

在空目录创建 `limit.mjs`，运行 `node limit.mjs`：

::: details 查看异步任务并发限制完整实现

```javascript
// limit.mjs
/**
 * 并发执行任务并按输入顺序返回结果。
 * @param tasks 延迟启动的无参函数数组，每个函数返回值或 Promise。
 * @param limit 大于零的整数，表示最多同时运行的任务数。
 * @returns 按输入顺序排列的 Promise 结果；任一任务失败则拒绝。
 */
async function runLimited(tasks, limit) {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError("limit 必须大于零");
  const results = new Array(tasks.length);
  let next = 0;
  /** 领取下一个任务，直到队列耗尽；无入参，返回工作者 Promise。 */
  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

/** 返回订单编号；无入参，返回已完成的 Promise。 */
const first = async () => "A-42";
/** 返回另一订单编号；无入参，返回已完成的 Promise。 */
const second = async () => "B-17";
console.log(await runLimited([first, second], 1));
```

:::

预期输出 `[ 'A-42', 'B-17' ]`。索引在首次 `await` 前同步领取，因此不会有两个工作者领取同一任务；结果写入原索引，完成顺序不影响返回顺序。任一任务拒绝时，返回的 Promise 拒绝，**已开始的任务仍会继续执行**；生产场景需另行设计取消、错误收集与速率限制。

参考：[MDN：Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)、[MDN：async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)。

