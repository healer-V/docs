# 内存

## 一、内存分配区别：栈与堆
>[!note]
> JavaScript中的数据类型不仅在语法上有区别，在内存分配机制上也有显著差异。了解这些差异对于编写高效代码和避免内存问题至关重要。

### 1.1 栈内存（Stack）

#### 1.1.1 栈内存的特点
::: tip 特点
- **存储基本数据类型**：Number、String、Boolean、Null、Undefined、Symbol、BigInt
- **固定大小**：每个基本类型占用的内存大小是固定的
- **自动分配和释放**：由JavaScript引擎自动管理，函数执行完毕后自动释放
- **访问速度快**：栈内存的读写速度非常快
- **后进先出（LIFO）结构**：遵循后进先出的原则进行内存管理
:::

#### 1.1.2 栈内存的工作原理
::: tip 原理
当一个函数被调用时，JavaScript引擎会在栈上为该函数创建一个执行环境（执行上下文），包括：
- 函数的参数
- 局部变量
- 返回地址
:::

函数执行完毕后，这个执行环境会被自动弹出栈并释放内存。

```javascript
function example(a, b) {
  const sum = a + b; // sum存储在栈中
  return sum;
}

const result = example(5, 10); // example函数的执行环境在调用时被推入栈，执行完毕后弹出
```

#### 1.1.3 基本数据类型的复制
::: info 解释
基本数据类型在赋值时会创建完整的副本，修改一个变量不会影响另一个变量。
:::

```javascript
let a = 5;
let b = a; // 在栈上创建a的值的副本

b = 10;
console.log(a); // 5，a的值不受b的影响
```

### 1.2 堆内存（Heap）

#### 1.2.1 堆内存的特点
::: tip 特点
- **存储引用数据类型**：Object、Array、Function等
- **动态大小**：引用类型的大小不固定，可动态增长
- **手动分配和垃圾回收**：由JavaScript引擎的垃圾回收机制管理
- **访问速度较慢**：相比于栈内存，访问堆内存需要额外的寻址操作
- **无序存储**：没有固定的存储顺序
:::

#### 1.2.2 堆内存的工作原理
::: info 原理
当创建引用类型时，JavaScript引擎会在堆上分配内存来存储实际的数据，然后在栈上存储指向该堆内存地址的引用。
:::

```javascript
const obj = { name: 'John', age: 30 }; // 栈上存储引用，堆上存储对象实际数据
const arr = [1, 2, 3, 4, 5]; // 栈上存储引用，堆上存储数组元素
```

#### 1.2.3 引用数据类型的复制
::: info 解释
引用数据类型在赋值时只复制引用（地址），不会复制实际的数据。这意味着多个变量可以指向同一个堆内存地址。
:::

```javascript
const original = { count: 1 };
const copy = original; // 只复制引用，两个变量指向同一个对象

copy.count = 10;
console.log(original.count); // 10，original的值也被修改了
```

### 1.3 栈与堆的主要区别

| 特性 | 栈内存 | 堆内存 |
|------|--------|--------|
| 存储内容 | 基本数据类型和引用（地址） | 引用数据类型的实际内容 |
| 大小 | 固定 | 动态 |
| 分配机制 | 自动 | 手动 |
| 释放机制 | 函数执行完毕自动释放 | 垃圾回收机制 |
| 访问速度 | 快 | 较慢 |
| 结构 | LIFO（后进先出） | 无序 |
| 内存限制 | 有限 | 较大 |

### 1.4 JavaScript中的垃圾回收

#### 1.4.1 垃圾回收的概念
::: tip 解释
垃圾回收是JavaScript引擎自动释放不再被引用的内存的过程。当堆中的对象不再被任何变量引用时，它就会被标记为垃圾，然后由垃圾回收器回收。
:::

#### 1.4.2 主要垃圾回收算法
1. **标记清除算法**：
   - 标记阶段：从根对象开始，标记所有可达的对象
   - 清除阶段：删除所有未被标记的对象

2. **引用计数算法**：
   - 跟踪每个对象被引用的次数
   - 当引用计数为0时，回收对象内存
   - 缺点：无法处理循环引用问题

```javascript
// 循环引用示例
function createCircularReference() {
  const obj1 = {};
  const obj2 = {};
  obj1.ref = obj2;
  obj2.ref = obj1;
  // 即使函数执行完毕，obj1和obj2仍相互引用，引用计数不为0
  // 但现代JavaScript引擎的标记清除算法可以处理这种情况
}
```

### 1.5 内存管理的最佳实践

#### 1.5.1 避免内存泄漏的技巧
1. **及时清除不必要的引用**：
   ```javascript
   let bigObject = createBigObject();
   // 使用bigObject...
   bigObject = null; // 清除引用，允许垃圾回收
   ```

2. **避免闭包中的内存泄漏**：
   ```javascript
   function createHandler() {
     const largeData = new Array(1000000).fill(0);
     
     return function() {
       console.log('Handler called');
       // 避免在返回的函数中引用largeData
     };
   }
   ```

3. **小心事件监听器**：
   ```javascript
   function setupEventListeners() {
     const element = document.getElementById('myElement');
     const handler = function() {
       console.log('Clicked');
     };
     
     element.addEventListener('click', handler);
     
     // 提供清理函数
     return function cleanup() {
       element.removeEventListener('click', handler);
     };
   }
   ```

#### 1.5.2 性能优化建议
::: tip
1. **合理使用基本数据类型**：对于简单数据，优先使用基本类型
2. **避免不必要的大对象创建**：特别是在循环中
3. **注意对象的浅拷贝和深拷贝**：根据需要选择合适的拷贝方式
4. **使用WeakMap和WeakSet处理弱引用**：允许垃圾回收器自动回收不再需要的对象
:::

```javascript
// 使用WeakMap避免内存泄漏
const cache = new WeakMap();

function processObject(obj) {
  if (!cache.has(obj)) {
    const result = expensiveOperation(obj);
    cache.set(obj, result); // 弱引用，当obj不再被其他地方引用时，可以被回收
  }
  return cache.get(obj);
}
```

### 1.6 实际应用场景

#### 1.6.1 内存分析和调试
::: tip
现代浏览器提供了内存分析工具，可以帮助开发者识别内存泄漏和优化内存使用：
- Chrome DevTools的Memory面板
- Firefox的Memory工具
:::

#### 1.6.2 大应用性能优化
::: tip 建议
在大型JavaScript应用中，良好的内存管理尤为重要：
- 使用虚拟列表或窗口化技术处理大数据集
- 实现组件的懒加载和按需渲染
- 合理使用缓存策略
- 实现有效的状态管理，避免不必要的数据复制
:::
