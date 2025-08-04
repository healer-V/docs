# React 面试题

## React 常用Hook
::: tip 
1. useState
2. useEffect
3. useContext
4. useReducer
5. useCallback
6. useMemo
7. useRef
8. useImperativeHandle
9. useLayoutEffect
10. useDebugValue
:::
### useState
::: tip
- useState 可以在函数组件中保存一个状态，并返回一个数组，数组的第一个元素是当前状态，第二个元素是更新状态的函数。
- useState 可以接收一个初始状态，如果没有提供初始状态，则默认为 undefined。
- useState 可以在函数组件中保存多个状态，返回的数组会包含多个状态和更新状态的函数。
- useState 可以接收一个函数作为参数，函数会在状态更新时执行。
:::
示例：
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

### useEffect
::: tip
- useEffect 可以在函数组件中执行副作用操作，包括获取数据、设置订阅和手动修改 DOM。
- useEffect 可以接收两个参数，第一个参数是一个函数，函数会在组件渲染后执行，第二个参数是一个数组，数组中的值发生变化时，useEffect 会重新执行。
- useEffect 可以接收一个对象作为参数，对象中可以包含 componentDidMount、componentDidUpdate 和 componentWillUnmount 三个函数，分别在组件挂载、更新和卸载时执行。
- useEffect 可以返回一个函数，函数会在 useEffect 组件卸载时执行。
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

### useContext
::: tip
- useContext 可以在函数组件中获取 context 对象。
- useContext 需要一个 context 对象作为参数，该对象必须是 React.createContext 的返回值。
- useContext 返回的数组的第一个元素是当前 context 的值，第二个元素是 context 对象。
:::
示例：
::: details useContext 示例
```jsx
import React, { createContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
});

function Example() {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div>
        <p>Current theme: {theme}</p>
        <button onClick={toggleTheme}>Toggle theme</button>
      </div>
    </ThemeContext.Provider>
  );
}

function App() {
  return (
    <div>
      <Example />
      <ThemeContext.Consumer>
        {({ theme, toggleTheme }) => (
          <div>
            <p>Current theme: {theme}</p>
            <button onClick={toggleTheme}>Toggle theme</button>
          </div>
        )}
      </ThemeContext.Consumer>
    </div>
  );
}
```
:::

### useReducer
::: tip
- useReducer 可以在函数组件中管理状态，它接收一个 reducer 函数和初始状态作为参数，返回一个数组，数组的第一个元素是当前状态，第二个元素是更新状态的函数。
- useReducer 可以接收一个初始状态，如果没有提供初始状态，则默认为 undefined。
- useReducer 可以接收一个函数作为参数，函数会在状态更新时执行。
:::
示例：
::: details useReducer 示例
```jsx
import React, { useReducer } from 'react';

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
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
      <button onClick={() => dispatch({ type: 'increment' })}>
        +
      </button>
      <button onClick={() => dispatch({ type: 'decrement' })}>
        -
      </button>
    </div>
  );
}
```
:::

### useCallback
::: tip
- useCallback 可以在函数组件中创建一个 memoized 回调函数。
- useCallback 接收一个函数和依赖数组作为参数，返回一个 memoized 回调函数。
- useCallback 可以避免在每渲染时都创建一个新的回调函数，可以提高组件的性能。
:::
示例：
::: details useCallback 示例
```jsx
import React, { useState, useCallback } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    setCount(count + 1);
  }, [count]);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={handleClick}>
        Click me
      </button>
    </div>
  );
}
```
:::

### useMemo
::: tip
- useMemo 可以在函数组件中缓存计算结果，避免重复计算。
- useMemo 接收一个函数和依赖数组作为参数，返回一个 memoized 值。
- useMemo 可以避免在每渲染时都重新计算值，可以提高组件的性能。
:::
示例：
::: details useMemo 示例
```jsx
import React, { useState, useMemo } from 'react';

function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function Example() {
  const [n, setN] = useState(0);
  const [result, setResult] = useState(0);

  const fib = useMemo(() => fibonacci(n), [n]);

  useEffect(() => {
    setResult(fib);
  }, [fib]);

  return (
    <div>
      <p>Fibonacci of {n}: {result}</p>
      <input type="number" value={n} onChange={(e) => setN(Number(e.target.value))} />
    </div>
  );
}
```
:::

### useRef
::: tip
- useRef 可以在函数组件中保存一个可变的 ref 对象。
- useRef 返回的数组的第一个元素是 ref 对象，第二个元素是 ref 对象当前的值。
- useRef 可以保存任何可变值，包括函数、对象等。
:::
示例：
::: details useRef 示例
```jsx
import React, { useRef, useState } from 'react';

function Example() {
  const [count, setCount] = useState(0);
  const inputRef = useRef(null);

  const handleClick = () => {
    setCount(count + 1);
    inputRef.current.focus();
  };

  return (
    <div>
      <p>You clicked {count} times</p>
      <input type="text" ref={inputRef} />
      <button onClick={handleClick}>
        Click me
      </button>
    </div>
  );
}
```
:::

### useImperativeHandle
::: tip
- useImperativeHandle 可以在函数组件中暴露给父组件的函数。
- useImperativeHandle 接收两个参数，第一个参数是一个函数，第二个参数是一个对象，对象中可以包含将暴露给父组件的函数。
- useImperativeHandle 可以在函数组件中暴露给父组件的函数，父组件可以通过 ref 获取到该函数，并调用该函数。
:::
示例：
::: details useImperativeHandle 示例
```jsx
import React, { useRef, useState, useImperativeHandle } from 'react';

function Example(props, ref) {
  const [count, setCount] = useState(0);

  useImperativeHandle(ref, () => ({
    increase: () => {
      setCount(count + 1);
    }
  }));

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}

const ExampleWithRef = React.forwardRef(Example);

function App() {
  const exampleRef = useRef(null);

  return (
    <div>
      <ExampleWithRef ref={exampleRef} />
      <button onClick={() => exampleRef.current.increase()}>
        Increase count
      </button>
    </div>
  );
}
```
:::

### useLayoutEffect
::: tip
- useLayoutEffect 和 useEffect 类似，但是它会在所有的 DOM 变更之后同步执行，而 useEffect 则在 DOM 更新后才执行。
- useLayoutEffect 可以读取 DOM 节点的布局并同步执行副作用，可以避免闪烁。
- useLayoutEffect 接收一个函数和依赖数组作为参数，返回一个函数，该函数会在组件卸载时执行。
:::
示例：
::: details useLayoutEffect 示例
```jsx
import React, { useState, useLayoutEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  useLayoutEffect(() => {
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

### useDebugValue
::: tip
- useDebugValue 可以在 React DevTools 中显示自定义 hook 的标签。
- useDebugValue 接收一个字符串作为参数，该字符串会显示在 React DevTools 中。
- useDebugValue 可以帮助开发者更好地理解自定义 hook。
:::
示例：
::: details useDebugValue 示例
```jsx
import React, { useState, useDebugValue } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  useDebugValue(`Count: ${count}`);

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

## React 生命周期
::: tip
1. componentDidMount
2. componentDidUpdate
3. componentWillUnmount
4. shouldComponentUpdate
5. getDerivedStateFromProps
6. getSnapshotBeforeUpdate
:::

### componentDidMount
::: tip
- componentDidMount 在组件挂载后执行，在该函数中可以进行一些初始化操作，如设置定时器、添加事件监听器等。
- componentDidMount 不会在服务端渲染中被调用。
:::

### componentDidUpdate
::: tip
- componentDidUpdate 在组件更新后执行，在该函数中可以进行一些更新操作，如重新设置定时器、更新事件监听器等。
- componentDidUpdate 不会在首次渲染时被调用。
- componentDidUpdate 会在 shouldComponentUpdate 返回 false 时不执行。
:::

### componentWillUnmount
::: tip
- componentWillUnmount 在组件卸载前执行，在该函数中可以进行一些清理操作，如清除定时器、移除事件监听器等。
- componentWillUnmount 不会在服务端渲染中被调用。
:::

### shouldComponentUpdate
::: tip
- shouldComponentUpdate 是一个函数，在组件更新前被调用，可以返回 false 来阻止组件的更新。
- shouldComponentUpdate 会在 componentDidUpdate 之前执行。
- shouldComponentUpdate 默认返回 true，组件总会被更新。
:::

### getDerivedStateFromProps
::: tip
- getDerivedStateFromProps 是一个静态函数，在组件初始化和更新时被调用，可以返回一个对象来更新 state。
- getDerivedStateFromProps 不会在首次渲染时被调用。
- getDerivedStateFromProps 不会在 shouldComponentUpdate 返回 false 时被调用。
:::

### getSnapshotBeforeUpdate
::: tip
- getSnapshotBeforeUpdate 是一个函数，在组件更新前被调用，可以返回一个值，该值会作为参数传递给 componentDidUpdate。
- getSnapshotBeforeUpdate 会在 componentDidUpdate 之前执行。
- getSnapshotBeforeUpdate 不会在 shouldComponentUpdate 返回 false 时被调用。
:::

## React 数据通信
::: tip
1. props
2. context
3. ref
4. state
5. reducer
6. event
7. callback
8. effect
9. hook
10. contextType
11. forwardRef
12. memo
13. useCallback
14. useMemo
15. useReducer
16. useRef
17. useState
18. custom hook
:::

### props
::: tip
- props 是父组件向子组件传递数据的方式之一，子组件通过 props 接收父组件的数据。
- props 是只读的，不能被修改。
- 通过 JSX 的形式传递，也可以通过 this.props 访问。
- 通过 children 接收子组件。
:::

### context
::: tip
- context 是一种全局变量，可以跨越组件层级进行数据共享。
- 通过 React.createContext 创建，可以包含多个值。
- 通过 useContext 进行消费。
- 通过 Provider 进行提供。
:::


## React 状态管理库
::: tip
- Redux
- MobX
:::

### Redux使用
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
