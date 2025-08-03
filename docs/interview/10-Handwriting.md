# 手写类 面试题

## 1. 手写 Promise.all() 实现
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

## 2. 手写防抖和节流函数
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

## 3. 手写发布订阅模式
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

## 4. 手写call、apply、bind函数
::: details call、apply、bind函数
```javascript

Function.prototype.mycall = function(context) {
  context = context || window;
  context.fn = this;
  const args = [...arguments].slice(1);
  const result = context.fn(...args);
  delete context.fn;
  return result;
};

Function.prototype.myapply = function(context) {
  context = context || window;
  context.fn = this;
  const result = context.fn(...arguments[1]);
  delete context.fn;
  return result;
};

Fuction.prototype.mybind = function(context) {
  const self = this;
  return function() {
    return self.apply(context, arguments);
  };
};

```
::: 

## 5. 手写数组去重
::: details 数组去重
```javascript
function unique(arr) {
  return Array.from(new Set(arr));
}
```
::: 

## 6. 手写数组扁平化
::: details 数组扁平化
```javascript
function flatten(arr) {
  return arr.reduce((acc, val) => {
    return acc.concat(Array.isArray(val)? flatten(val) : val);
  }, []);
}
```
::: 

## 7. 手写深拷贝
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



