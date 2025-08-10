# React
## 一、 React 简介
:::tip 简介
- `React` 是一个用于构建用户界面的 JavaScript 库。它被设计用于构建大型、复杂的 Web 应用。
- `React` 的核心思想：
  - 将 UI 层与数据层分离。
  - React 利用 JSX 语法来描述 UI 层，并将数据层作为 props 传入组件。
  - React 通过 JSX 语法将 UI 层和数据层连接起来，并将 UI 层渲染成可交互的组件。
:::

## 二、 React 历史版本

### 2.1、经典版本：React 16 
:::tip React 16 （2017年9月）
 1. 核心特性
    - **异步渲染**：React 16最大的变革之一是引入了异步渲染机制，在此之前，React的渲染过程是同步的，一旦开始渲染，主线程将被完全占用，直到渲染完成。异步渲染允许React在渲染过程中暂停和恢复，从而提高了应用的响应性和性能。
    - **Fiber架构**：为了实现异步渲染，React 16引入了Fiber架构。Fiber是一种新的调度算法，它将渲染过程分解为多个小任务，这些任务可以在不同的帧之间进行调度，避免了长时间占用主线程。Fiber架构的引入不仅提高了性能，还为未来的并发特性奠定了基础
    - **错误处理**：改进了错误处理机制，引入了Error Boundaries。通过定义错误边界组件，开发者可以捕获子组件中的错误，避免整个应用的崩溃，从而提高了应用的稳定性。
    - **新的生命周期方法**：React 16.3对生命周期API进行了重大调整，引入了getDerivedStateFromProps和getSnapshotBeforeUpdate等新的生命周期方法。这些方法提供了更安全和更可控的方式来管理组件状态和副作用。
    - **Context API的改进**：React 16.3 改进了Context API，使其更加易于使用和性能更优。新的Context API允许开发者更方便地在组件树中传递数据，避免了通过层层传递props的繁琐。
    - **Hooks的引入**：React 16.8 引入了Hooks，彻底改变了函数组件的编写方式。通过useState、useEffect等Hooks，开发者可以在函数组件中轻松管理状态和副作用，极大地简化了组件逻辑。
    - **自定义Hooks**：React 16.8 支持自定义Hooks，开发者可以根据需要创建自己的Hooks，进一步提高代码的可复用性和可维护性。
 2. 优点
    - 成熟稳定：经过多年的发展和广泛应用，React 16.x在稳定性方面表现优异。
    - 社区支持：拥有庞大的社区和丰富的第三方库，如Redux、React Router等，生态系统非常完善。
    - 学习资源丰富：大量的教程、文档和案例，使得新手上手相对容易。
3. 缺点
    - 生命周期复杂：生命周期方法较多，容易混淆，特别是在组件更新时。
    - 状态管理繁琐：在复杂应用中，状态管理较为繁琐，需要借助额外的库如Redux。
    - 性能瓶颈：在某些场景下，虚拟DOM的更新机制可能导致性能瓶颈。
:::

### 2.2、革新版本：React 18
:::tip React 18（2022年）

1. 核心特性
    - 并发渲染：React 18.x引入了并发渲染机制，允许同时进行多个更新任务，极大地提升了应用的响应性和性能。
    - 自动批处理：自动批处理多个状态更新，减少了渲染次数，进一步优化性能。
    - 过渡和startTransition API：startTransition API允许开发者区分紧急和非紧急更新，避免阻塞用户交互。通过将非紧急更新标记为过渡，React可以在必要时暂停这些更新，优先处理用户交互。
    - Suspense和流式SSR：支持Server Components，可以在服务器端渲染组件，减少客户端的负担。
2. 优点
    - 性能提升：并发渲染和自动批处理显著提升了应用的性能和响应性。
    - 开发体验优化：新的Hooks和API简化了开发流程，提高了开发效率。
    - 更强大的生态系统：与新的React生态系统（如Next.js 12）无缝集成，提供了更全面的解决方案。
3. 缺点
    - 学习曲线陡峭：新的特性和API需要开发者投入更多时间学习和适应。
    - 兼容性问题：部分旧的项目和库可能需要调整才能完全兼容React 18.x。
    - 社区资源相对较少：相较于React 16.x，React 18.x的社区资源和教程相对较少。
:::


## 三、 React 组件分类
:::tip 组件
- 组件是 React 应用的基本构建模块。
- 组件可以定义自己的属性和状态，并通过 JSX 语法描述 UI 层。
- 组件可以嵌套在一起，形成一个组件树。
- 组件可以接收来自父组件的 props，并通过 props 传递数据。
- 组件可以定义生命周期方法，用于在组件挂载、更新和卸载时执行特定操作。
:::

**组件的分类**
:::tip 
1. 类组件：使用 ES6 语法定义的组件，使用 `React.createClass()` 方法创建。
2. 函数组件：使用 ES6 语法定义的组件，使用 `React.functionalComponent()` 方法创建。
3. 无状态组件：使用函数定义的组件，没有生命周期方法，没有 state 和 props。
4. 受控组件：使用受控组件时，表单元素的值由 React 组件管理，并通过 props 传递给表单元素。
5. 高阶组件：使用高阶组件时，可以将组件作为参数传入，并返回一个新的组件。
:::

## 四、组件通信
::: tip 组件通信
- 父传子：通过 `props` 向子组件传递数据，子组件通过回调函数向父组件传递数据。
- 子传父：通过 **回调函数** 向父组件传递数据。
- 兄弟组件通信：通过 **状态提升**（共享父组件状态）。
- 跨越组件通信：`context` 进行通信。
- 状态管理库：可使用 ``Redux``、``MobX`` 等进行跨越组件边界通信。
:::
- 父传子 组件通信
::: details 父传子 组件通信 示例
```jsx
// ========== 类组件 ==========
// 父组件
class ParentClass extends React.Component {
    render() {
        return <ChildClass message="From Class Parent" />;
    }
}
// 子组件
class ChildClass extends React.Component {
    render() {
        return <div>{this.props.message}</div>; // 输出: From Class Parent
    }
}

// ========== 函数式组件 ==========
// 父组件
function ParentFunc() {
    const [data] = useState("From Function Parent");
    return <ChildFunc message={data} />;
}
// 子组件
function ChildFunc({ message }) {
    return <div>{message}</div>; // 输出: From Function Parent
}

```
:::
- 子传父 组件通信
::: details 子传父 组件通信 示例
```jsx
// ========== 类组件 ==========
// 父组件
class ParentClass extends React.Component {
    handleData = (childData) => {
        console.log(`子组件数据 : ${childData}`);
    };

    render() {
        return <ChildClass onSendData={this.handleData} />;
    }
}

// 子组件
class ChildClass extends React.Component {
    sendData = () => {
        this.props.onSendData("Data from Class Child");
    };

    render() {
        return <button onClick={this.sendData}>Send to Class Parent</button>;
    }
}

// ========== 函数式组件 ==========

//父组件
function ParentFunc() {
    const handleData = (childData) => {
        alert(`Function Parent received: ${childData}`);
    };

    return <ChildFunc onSendData={handleData} />;
}

// 子组件
function ChildFunc({ onSendData }) {
    const sendData = () => {
        onSendData("Data from Function Child");
    };

    return <button onClick={sendData}>Send to Function Parent</button>;
}

```
:::

- 兄弟组件通信
::: details 兄弟组件通信 示例
```jsx
// 兄弟组件通信
// ========== 类组件 ==========
// 父组件
class ParentClass extends React.Component {
    state = { sharedData: "" };
    
    updateData = (data) => {
        this.setState({ sharedData: data });
    };

    render() {
        return (
            <>
                <SiblingAClass onUpdate={this.updateData} />
                <SiblingBClass data={this.state.sharedData} />
            </>
        );
    }
}

// 兄弟A（发送数据）
class SiblingAClass extends React.Component {
    handleChange = (e) => {
        this.props.onUpdate(e.target.value);
    };

    render() {
        return <input onChange={this.handleChange} placeholder="Type here" />;
    }
}

// 兄弟B（接收数据）
class SiblingBClass extends React.Component {
    render() {
        return <p>Received: {this.props.data || "Nothing yet"}</p>;
    }
}
// ========== 函数式组件 ==========
import React, { useState } from 'react';

// 父组件
function ParentFunc() {
    const [sharedData, setSharedData] = useState("");

    return (
        <>
            <SiblingAFunc onUpdate={setSharedData} />
            <SiblingBFunc data={sharedData} />
        </>
    );
}

// 兄弟A（发送数据）
function SiblingAFunc({ onUpdate }) {
    return <input onChange={(e) => onUpdate(e.target.value)} placeholder="Type here" />;
}

// 兄弟B（接收数据）
function SiblingBFunc({ data }) {
    return <p>Received: {data || "Nothing yet"}</p>;
}

// 使用: <ParentFunc />

```
:::
- 跨级组件通信
::: details 跨级组件通信 示例
```jsx
// ========== 类组件 ==========
const MyContext = React.createContext();

// 父组件 (提供数据)
class Parent extends React.Component {
    state = { value: "Context Data" };

    render() {
        return (
            <MyContext.Provider value={this.state.value}>
                <Child />
            </MyContext.Provider>
        );
    }
}

// 孙子组件 (消费数据)
class GrandChild extends React.Component {
    static contextType = MyContext; // 类组件绑定Context

    render() {
        return <div>{this.context}</div>; // 输出: Context Data
    }
}
// ========== 函数式组件 ==========
const MyContext = React.createContext();

// 父组件
function Parent() {
    return (
        <MyContext.Provider value="Context Data">
            <Child />
        </MyContext.Provider>
    );
}

// 孙子组件
function GrandChild() {
    const value = useContext(MyContext); // Hook获取Context
    return <div>{value}</div>; // 输出: Context Data
}
```
:::
- 状态管理库 Redux
::: details 状态管理库 Redux 示例
```jsx
// ========== 类组件 ==========
class UserDisplay extends React.Component {
    render() {
        return <div>{this.props.username}</div>; // 从Redux获取
    }
}

// 连接Redux
export default connect(
    (state) => ({ username: state.user.name })
)(UserDisplay);

// ========== 函数式组件 ==========
import { useSelector } from "react-redux";

function UserDisplay() {
    const username = useSelector((state) => state.user.name);
    return <div>{username}</div>;
}

```
:::

## 五、生命周期
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

## 六、Hooks
:::tip Hooks
- useState()：用于在函数组件中存储状态。
- useEffect()：用于在函数组件中执行副作用。
- useContext()：用于在函数组件中获取上下文。
- useReducer()：用于在函数组件中管理状态。
- useCallback()：用于创建可变回调函数。
- useMemo()：用于创建 memoized 值。
- useRef()：用于获取 DOM 节点或自定义类的实例。
- useImperativeHandle()：用于给父组件设置 ref。
- useLayoutEffect()：与 useEffect 类似，但它会在所有的 DOM 变更之后同步执行。
- useDebugValue()：用于在 React 开发者工具中显示自定义 hook 的标签。
:::


### 6.0、自定义 Hooks
:::tip 自定义 Hooks
1. 声明一个以`use`开头的函数。
2. 函数内部封装可复用的逻辑。
3. 返回一个包含可变数据和函数的对象。
4. 调用自定义 Hooks 时，需要在函数组件的最外层调用。
:::

::: details 自定义 Hooks 示例

```jsx
// 自定义 Hooks
import React, { useState } from "react";

function useCounter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  const decrement = () => {
    setCount(count - 1);
  };

  return { count, increment, decrement };
}
// 调用自定义 Hooks
function App() {
  const { count, increment, decrement } = useCounter();

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
### 6.1、useState
- useState()：状态管理，可在函数组件中存储状态。
::: details useState 示例
```jsx
import React, { useState } from "react";

function Example() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
```
:::

### 6.2、useEffect
:::tip useEffect
- 作用：可在函数组件中执行副作用。
1. 第一个参数：函数，副作用函数，可以是同步或异步函数。
2. 第二个参数：依赖项数组，只在数组中的值发生变化时，useEffect 才会执行。
3. useEffect 第二个参数依赖项数组：
   - 如果不传，useEffect 等价于 componentDidMount 和 componentDidUpdate。
   - 如果传空数组，useEffect 等价于 componentDidMount，仅在组件挂载（首次渲染）后执行一次。
   - 如果传空数组和函数，首次渲染后执行，当依赖项 a或 b的值变化时重新执行。useEffect 等价于 componentDidMount 和 componentDidUpdate。

- useEffect 常用场景：
  - 订阅和取消订阅事件
  - 处理 DOM 节点
  - 发送请求
  - 手动修改状态
:::
::: details useEffect 示例
```jsx
import React, { useState, useEffect } from "react";

function Example() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `You clicked ${count} times`;
  },);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
```
:::

### 6.3、useContext
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

### 6.4、useReducer
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

### 6.5、useCallback
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

### 6.6、useMemo
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

### 6.7、useRef
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

### 6.8、useImperativeHandle
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

### 6.9、useLayoutEffect
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

### 6.10、useDebugValue
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
## 七、父组件操作子组件的方法
1. 使用 Refs + forwardRef ：直接调用子组件暴露的方法（函数与类组件）
2. 通过 Props 传递回调函数 ： 父组件通过 props 传递函数控制子组件。
3. 类组件的实例方法 ：父组件通过 ref 获取子组件的实例，调用实例方法。


