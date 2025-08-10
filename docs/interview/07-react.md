# React 面试题

## 一、Hooks

### 1、useState
::: tip
- 状态管理，可在函数组件中存储状态，并返回一个数组。
- 数组的第一个元素是当前状态，第二个元素是更新状态的函数。
:::
::: details useState 示例
```jsx
import React, { useState } from'react';

function Example() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```
:::

### 2、useEffect
::: tip
- 可在函数组件中执行副作用。包括获取数据、设置订阅和手动修改 DOM。
- 接收两个参数：
  - 第一个参数是一个函数，函数会在组件渲染后执行。
  - 第二个参数是一个数组，依赖项数组，数组中的值发生变化时，useEffect 会重新执行。
- 返回一个函数，函数会在 useEffect 组件卸载时执行。
- 第二个参数依赖项数组：
    - 如果不传，useEffect 等价于 componentDidMount 和 componentDidUpdate。
    - 如果传空数组，useEffect 等价于 componentDidMount，仅在组件挂载（首次渲染）后执行一次。
    - 如果传空数组和函数，首次渲染后执行，当依赖项 a或 b的值变化时重新执行。useEffect 等价于 componentDidMount 和 componentDidUpdate。

:::
示例：
::: details useEffect 示例
```jsx
import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `You clicked ${count} times`;
  }, [count]);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```
:::

### 3、useContext
:::tip useContext
- 作用：获取上下文，可在函数组件中获取上下文。
- 语法：const value = useContext(MyContext);
- 唯一参数：上下文对象。
- 返回值：当前上下文的 value。
- useContext 常用场景：
    - 跨组件通信
    - 共享状态
    - 自定义 hooks
:::
::: details useContext 示例
```jsx
import React, { createContext, useState, useEffect } from "react";
const MyContext = createContext();

function Example() {
  const [count, setCount] = useState(0);

  const value = { count, setCount };

  return (
    <MyContext.Provider value={value}>
      <div>
        <p>You clicked {count} times</p>
        <button onClick={() => setCount(count + 1)}>Click me</button>
      </div>
    </MyContext.Provider>
  );
}

function App() {
  const { count, setCount } = useContext(MyContext);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
```
:::

### 4、useReducer
:::tip useReducer
- 作用：管理状态，可在函数组件中管理状态。
- 语法：const [state, dispatch] = useReducer(reducer, initialArg, init);
- 第一个参数：reducer 函数，接收两个参数，第一个参数是 state，第二个参数是 action，返回新的 state。
- 第二个参数：初始状态，如果没有提供，则默认为 reducer 函数的第一个参数。
- 第三个参数：初始化函数，可选，返回初始状态。
- 返回值：一个包含 state 和 dispatch 函数的数组。
- useReducer 常用场景：
    - 复杂的状态逻辑
    - 异步操作
:::
::: details useReducer 示例
```jsx
import React, { useReducer } from "react";

function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    default:
      throw new Error();
  }
}

function Example() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
    </div>
  );
}
```
:::

### 5、useCallback
:::tip useCallback
- 作用：创建可变回调函数，可在函数组件中创建可变回调函数。
- 语法：const memoizedCallback = useCallback(callback, dependencies);
- 第一个参数：回调函数。
- 第二个参数：依赖项数组，只在数组中的值发生变化时，useCallback 才会重新创建回调函数。
- 返回值：一个 memoized 回调函数。
- useCallback 常用场景：
    - 优化性能
    - 避免闭包陷阱
:::
::: details useCallback 示例
```jsx
import React, { useState, useCallback } from "react";

function Example() {
  const [count, setCount] = useState(0);

  const handleIncrement = useCallback(() => {
    setCount(count + 1);
  }, [count]);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={handleIncrement}>Click me</button>
    </div>
  );
}
```
:::

### 6、useMemo
:::tip useMemo
- 作用：创建 memoized 值，可在函数组件中创建 memoized 值。
- 语法：const memoizedValue = useMemo(createMemoizedValue, dependencies);
- 第一个参数：创建 memoized 值的函数。
- 第二个参数：依赖项数组，只在数组中的值发生变化时，useMemo 才会重新计算 memoized 值。
- 返回值：一个 memoized 值。
- useMemo 常用场景：
    - 优化性能
    - 避免重复渲染
:::
::: details useMemo 示例
```jsx
import React, { useState, useMemo } from "react";

function Example() {
  const [count, setCount] = useState(0);

  const expensiveValue = useMemo(() => {
    console.log("Calculating expensive value...");
    return count * 2;
  }, [count]);

  return (
    <div>
      <p>You clicked {count} times</p>
      <p>Expensive value: {expensiveValue}</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
```
:::

### 7、useRef
:::tip useRef
- 作用：获取 DOM 节点或自定义类的实例，可在函数组件中获取 DOM 节点或自定义类的实例。
- 语法：const refContainer = useRef(initialValue);
- 唯一参数：可选，初始值。
- 返回值：一个包含 current 属性的对象。
- useRef 常用场景：
    - 获取 DOM 节点
    - 存储数据
    - 触发动画
:::
::: details useRef 示例
```jsx
import React, { useRef } from "react";

function Example() {
  const inputRef = useRef();

  const handleClick = () => {
    inputRef.current.focus();
  };

  return (
    <div>
      <input type="text" ref={inputRef} />
      <button onClick={handleClick}>Focus input</button>
    </div>
  );
}
```
:::

### 8、useImperativeHandle
:::tip useImperativeHandle
- 作用：给父组件设置 ref，可在函数组件中给父组件设置 ref。
- 语法：useImperativeHandle(ref, createHandle, [deps]);
- 第一个参数：ref 对象。
- 第二个参数：回调函数，接收组件实例作为参数，返回一个用于暴露给父组件的实例。
- 第三个参数：依赖项数组，只在数组中的值发生变化时，useImperativeHandle 才会重新创建回调函数。
- useImperativeHandle 常用场景：
    - 自定义组件的 ref
    - 跨组件通信
:::
::: details useImperativeHandle 示例
```jsx
import React, { forwardRef, useState, useImperativeHandle } from "react";

function Example(props, ref) {
  const [count, setCount] = useState(0);

  useImperativeHandle(ref, () => ({
    increment: () => setCount(count + 1),
    decrement: () => setCount(count - 1),
  }));

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}

const FancyButton = forwardRef(Example);

function App() {
  const fancyButtonRef = useRef();

  return (
    <div>
      <FancyButton ref={fancyButtonRef} />
      <button onClick={() => fancyButtonRef.current.increment()}>+</button>
      <button onClick={() => fancyButtonRef.current.decrement()}>-</button>
    </div>
  );
}
```
:::

### 9、useLayoutEffect
:::tip useLayoutEffect
- 作用：与 useEffect 类似，但它会在所有的 DOM 变更之后同步执行。
- 语法：useLayoutEffect(create, [deps]);
- 第一个参数：回调函数，接收组件实例作为参数，返回一个用于执行副作用的函数。
- 第二个参数：依赖项数组，只在数组中的值发生变化时，useLayoutEffect 才会重新执行。
- useLayoutEffect 常用场景：
    - 读取 DOM 布局并同步触发动画
    - 同步修改状态
:::
::: details useLayoutEffect 示例
```jsx
import React, { useState, useLayoutEffect } from "react";

function Example() {
  const [count, setCount] = useState(0);

  useLayoutEffect(() => {
    document.title = `You clicked ${count} times`;
  }, [count]);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
```
:::

### 10、useDebugValue
:::tip useDebugValue
- 作用：在 React 开发者工具中显示自定义 hook 的标签。
- 语法：useDebugValue(value);
- 唯一参数：自定义 hook 的标签。
- useDebugValue 常用场景：
    - 自定义 hooks 调试
:::
::: details useDebugValue 示例
```jsx
import React, { useState, useDebugValue } from "react";

function useCounter(initialCount) {
  const [count, setCount] = useState(initialCount);

  useDebugValue(count);

  const increment = () => {
    setCount(count + 1);
  };

  const decrement = () => {
    setCount(count - 1);
  };

  return { count, increment, decrement };
}   

function App() {
  const { count, increment, decrement } = useCounter(0);

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```
:::

## 二、生命周期


:::tip 生命周期
1. **挂载阶段** :
    - constructor()： 构造函数，在组件实例化时调用一次,唯一可直接修改 this.state 的地方。
    - static getDerivedStateFromProps(props, state)：从 props 更新 state。
    - render()：渲染组件，返回 JSX 元素。
    - componentDidMount()：组件挂载后执行（DOM 已生成）可发起网络请求、绑定事件等。

2. **更新阶段** :
    - static getDerivedStateFromProps(props, state)：props/state 变化时触发，返回新的 state。
    - shouldComponentUpdate(nextProps, nextState)：判断组件是否需要更新，返回 true 或 false。（性能优化关键）
    - render()：重新渲染组件。
    - getSnapshotBeforeUpdate(prevProps, prevState)：在组件更新之前调用，可以获取 DOM 快照。
    - componentDidUpdate(prevProps, prevState)：在组件更新之后调用，可以进行 DOM 操作。

3. **卸载阶段** :
    - componentWillUnmount()：在组件卸载之前调用，可清理事件监听、取消定时器等。
4. **错误边界** :
    - static getDerivedStateFromError(error)：后代组件抛出错误后触发，返回 state 更新用于渲染降级 UI。
    - componentDidCatch(error, info)：在渲染期间、生命周期方法中发生错误时触发，不会捕获事件处理器、异步代码中的错误。
:::

## 三、数据通信


### 1、props 父传子
::: tip
- 通过 `props` 向子组件传递数据，子组件通过回调函数向父组件传递数据。
- props 是只读的，不能被修改。
- 通过 JSX 的形式传递，也可以通过 this.props 访问。
- 通过 children 接收子组件。
:::
### 2、子传父
::: tip
1. 通过 **回调函数** 向父组件传递数据。
2. 类组件中：
   - 通过 `ref` 获取子组件实例，通过 `ref` 向父组件传递数据。
   - 通过 `this.props.callback` 调用父组件的方法。
   - 通过 `this.props.children` 接收子组件。
   :::
### 3、兄弟组件通信
::: tip
- 通过状态提升，将共享状态提升到最近共同的祖先组件，使得各个子组件可以直接访问共享状态。
:::
### 4、跨级组件通信 
::: tip context
- `context` 是一种全局变量，可以跨越组件层级进行数据共享。
- 通过 `React.createContext` 创建，可以包含多个值。
- 通过 `useContext` 进行消费。
- 通过 `Provider` 进行提供。
:::
## 四、状态管理库
::: tip
- Redux-toolkit
- MobX
:::

### Redux 使用
::: tip
- Redux 是一个状态管理库，它提供一个全局的 store，可以保存应用的状态。
- Redux 中有三种数据流：actions、reducers、store。
- actions 是描述数据变化的对象，可以包含多个字段，如 type、payload。
- reducers 是纯函数，接收旧的 state 和 action，返回新的 state。
- store 是 Redux 的核心，它保存应用的 state，并提供 getState 方法获取 state。
- 要修改 state，需要发出 action，然后使用 reducer 函数更新 state。
- 组件通过 mapStateToProps 函数获取 state，通过 mapDispatchToProps 函数获取 action。
:::
示例：
::: details Redux 示例
```jsx
import React from "react";
import ReactDOM from "react-dom";
import { createStore } from "redux";
import { Provider, connect } from "react-redux";

// actions
const INCREMENT = "INCREMENT";
const DECREMENT = "DECREMENT";

// reducers
function counterReducer(state = 0, action) {
  switch (action.type) {
    case INCREMENT:
      return state + 1;
    case DECREMENT:
      return state - 1;
    default:
      return state;
  }
}

// store
const store = createStore(counterReducer);

// components
function Counter({ count, increment, decrement }) {
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}

// actions
function increment() {
  return { type: INCREMENT };
}

function decrement() {
  return { type: DECREMENT };
}

// connect
const mapStateToProps = (state) => ({ count: state });
const mapDispatchToProps = {
  increment,
  decrement,
};

const ConnectedCounter = connect(
  mapStateToProps,
  mapDispatchToProps
)(Counter);

ReactDOM.render(<App />, document.getElementById("root"));
```
:::

### MobX使用
::: tip
- MobX 是一个状态管理库，它提供 observable 对象，可以观察和修改状态。
- observable 对象可以自动追踪依赖，并通知组件更新。
- observable 对象可以和普通对象一样使用，也可以通过装饰器 @observable 进行装饰。
- 组件通过 @observer 装饰器进行装饰，并使用 observable 对象作为 props。
- 要修改状态，需要使用 action 装饰器进行装饰，并调用 action。
- 组件会自动重新渲染。
:::
示例：
::: details MobX 示例
```jsx
import React from "react";
import ReactDOM from "react-dom";
import { observable, action } from "mobx";
import { Provider, observer } from "mobx-react";

// observable
class Counter {
  count = 0;

  @action
  increment() {
    this.count++;
  }

  @action
  decrement() {
    this.count--;
  }
}

// components
@observer
class CounterView extends React.Component {
  render() {
    const { count, increment, decrement } = this.props;
    return (
      <div>
        <p>Count: {count}</p>
        <button onClick={increment}>+</button>
        <button onClick={decrement}>-</button>
      </div>
    );
  }
}

// store
const counter = new Counter();

// components
function App() {
  return (
    <Provider counter={counter}>
      <CounterView />
    </Provider>
  );
}

// render
ReactDOM.render(<App />, document.getElementById("root"));
```
:::

## 五、性能优化
::: tip
1. 代码层面：
    - 避免不必要的渲染：使用 shouldComponentUpdate 优化，减少不必要的渲染。
    - 避免过多的渲染：使用 useMemo 优化，缓存计算结果。
    - 避免过多的组件：使用 React.memo 优化，只渲染变化的组件。
    - 避免不必要的更新：使用 React.PureComponent 优化，只渲染 props 变化的组件。
    - useMemo 缓存计算结果。
    - useCallback 缓存回调函数
2. 工具层面：
    - 代码分割：使用 webpack 按需加载，减少 bundle 大小。
    - 异步加载：使用 Suspense 组件，实现异步加载。
    - 按需加载：使用 React.lazy 实现按需加载。
    - 缓存：使用缓存库，如 Redux-persist 实现缓存。
    - 服务器端渲染：使用服务端渲染框架，如 Next.js 实现 SSR。
3. 网络层面：
    - 减少请求数量：使用缓存，减少请求数量。
    - 压缩传输：使用 gzip 压缩传输。
    - 减少请求延迟：使用 CDN 缓存，减少请求延迟。
:::