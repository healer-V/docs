# 手写类 面试题
## 1. 发布订阅模式实现
::: details 发布订阅模式
```javascript
class PubSub {
  constructor() {
    this.topics = {};
  }

  subscribe(topic, listener) {
    if (!this.topics[topic]) {
      this.topics[topic] = [];
    }
    this.topics[topic].push(listener);
  }

  unsubscribe(topic, listener) {
    if (this.topics[topic]) {
      const index = this.topics[topic].indexOf(listener);
      if (index > -1) {
        this.topics[topic].splice(index, 1);
      }
    }
  }

  publish(topic, data) {
    if (this.topics[topic]) {
      this.topics[topic].forEach(listener => {
        listener(data);
      });
    }
  }
}
```
:::
使用：
::: details 发布订阅模式使用
```javascript
const pubsub = new PubSub();

pubsub.subscribe('topic1', data => {
    console.log('topic1', data);
});

pubsub.subscribe('topic2', data => {
    console.log('topic2', data);
});

pubsub.publish('topic1', 'hello'); // 输出：topic1 hello
pubsub.publish('topic2', 'world'); // 输出：topic2 world

pubsub.unsubscribe('topic1', data => {
    console.log('unsubscribe topic1', data);
});

pubsub.publish('topic1', 'hello'); // 不会输出
```
:::


## 2. Promise实现
::: details Promise实现
```javascript
const PENDING = "pending"
const FULFILLED = "fulfilled"
const REJECTED = "rejected"

class MyPromise {
    #state = PENDING; // # state 表示内部私有属性，外部无法访问
    #value; // # value 表示内部私有属性，外部无法访问
    constructor(executor) {
        const resolve = (value) => {
            this.#setState(FULFILLED, value)
        }
        const reject = (reason) => {
            this.#setState(REJECTED, reason)
        }
        try {
            executor(resolve, reject)
        } catch (err) {
            reject(err)
        }

    }
    #setState(state, value) {
        if (state !== PENDING) return
        this.#state = state
        this.#value = value
        console.log("Promise setState...", state, value)
    }
}

const p = new MyPromise((resolve, reject) => {
    // throw new Error("error")
    resolve(1) //  结果为成功，状态一旦确定，就不可更改
    reject(2)
})

```
:::

## 3. promise.then() 实现



## 4. Promise.all() 实现
::: details Promise.all() 实现
```javascript
  Promise.myall = function(promises) {
    return new Promise((resolve, reject) => {
      const result = [];
      let count = 0;
      for (let i = 0; i < promises.length; i++) {
        promises[i].then(res => {
          result[i] = res;
          count++;
          if (count === promises.length) {
            resolve(result);
          }
        }, err => {
          reject(err);
        });
      }
    });
  };
```
:::

## 5. Promise.race() 实现

## 6. bind函数实现
::: details bind函数实现
```javascript
Function.prototype.myBind = function(context, ...args) {
    // 保存原函数
    const originalFunc = this;
    // 返回一个新函数
    return function(...innerArgs) {
        // 合并外部和内部参数
        const combinedArgs = args.concat(innerArgs);
        // 调用原函数，并绑定 this 和参数
        return originalFunc.apply(context, combinedArgs);
    };
};
```
:::

## 7. 数组去重实现
::: details 数组去重
```javascript
function unique(arr) {
  return Array.from(new Set(arr));
}
```
::: 

## 8. 数组扁平化实现
::: details 数组扁平化
```javascript
function flatten(arr) {
  return arr.reduce((acc, val) => {
    return acc.concat(Array.isArray(val)? flatten(val) : val);
  }, []);
}
```
::: 

## 9. 深拷贝实现
::: details 深拷贝
```javascript
function deepCopy(obj) {
  if (typeof obj!== 'object' || obj === null) {
    return obj;
  }
  const result = Array.isArray(obj)? [] : {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = deepCopy(obj[key]);
    }
  }
  return result;
}
```
::: 

## 10. 防抖和节流函数实现
::: details 防抖和节流函数
```javascript
// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, arguments);
    }, wait);
  };
}

// 节流函数
function throttle(func, wait) {
  let timeout;
  return function() {
    if (!timeout) {
      timeout = setTimeout(() => {
        func.apply(this, arguments);
        timeout = null;
      }, wait);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(this, arguments);
        timeout = null;
      }, wait);
    }
  };
}
```
:::

