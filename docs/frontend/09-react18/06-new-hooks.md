# 新 Hooks

## 一、React 18 新增 Hooks

::: tip 新 Hooks 介绍
React 18 引入了多个新的 Hooks，用于支持并发渲染、性能优化和新的功能。
:::

## 二、useId

### 1、基本使用

```jsx
import { useId } from 'react';

function Form() {
  const id = useId();
  
  return (
    <form>
      <label htmlFor={id}>Name</label>
      <input id={id} type="text" />
    </form>
  );
}
```

### 2、生成唯一 ID

```jsx
function Checkbox() {
  const id = useId();
  
  return (
    <>
      <input id={id} type="checkbox" />
      <label htmlFor={id}>Accept terms</label>
    </>
  );
}
```

### 3、多个 ID

```jsx
function Form() {
  const nameId = useId();
  const emailId = useId();
  
  return (
    <form>
      <label htmlFor={nameId}>Name</label>
      <input id={nameId} type="text" />
      
      <label htmlFor={emailId}>Email</label>
      <input id={emailId} type="email" />
    </form>
  );
}
```

**注意**：`useId` 生成的 ID 包含 `:`，不适用于 HTML 属性，需要处理：

```jsx
function Form() {
  const id = useId();
  const htmlId = id.replace(/:/g, '-');
  
  return (
    <form>
      <label htmlFor={htmlId}>Name</label>
      <input id={htmlId} type="text" />
    </form>
  );
}
```

## 三、useTransition

### 1、基本使用

```jsx
import { useTransition } from 'react';

function App() {
  const [isPending, startTransition] = useTransition();
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // 紧急更新
    setCount(c => c + 1);
    
    // 非紧急更新
    startTransition(() => {
      setFilteredItems(expensiveFilter(items));
    });
  };

  return (
    <div>
      {isPending && <div>处理中...</div>}
      <button onClick={handleClick}>Click</button>
    </div>
  );
}
```

### 2、独立使用

```jsx
import { startTransition } from 'react';

function Component() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(c => c + 1);
    startTransition(() => {
      // 非紧急更新
      updateLargeList();
    });
  };
}
```

## 四、useDeferredValue

### 1、基本使用

```jsx
import { useDeferredValue } from 'react';

function SearchResults({ query }) {
  // 延迟更新 query
  const deferredQuery = useDeferredValue(query);
  
  // 基于延迟的 query 进行搜索
  const results = useMemo(() => {
    return search(deferredQuery);
  }, [deferredQuery]);

  return <ResultsList results={results} />;
}
```

### 2、与 useTransition 的区别

```jsx
// useTransition：手动控制
const [isPending, startTransition] = useTransition();
startTransition(() => {
  setResults(search(query));
});

// useDeferredValue：自动延迟
const deferredQuery = useDeferredValue(query);
const results = search(deferredQuery);
```

## 五、useSyncExternalStore

### 1、基本使用

```jsx
import { useSyncExternalStore } from 'react';

// 外部存储
let count = 0;
const listeners = new Set();

const store = {
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => count,
  getServerSnapshot: () => 0,
};

function increment() {
  count++;
  listeners.forEach(listener => listener());
}

function Counter() {
  const count = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

### 2、与 Redux 集成

```jsx
import { useSyncExternalStore } from 'react';
import { createStore } from 'redux';

const store = createStore(reducer);

function useReduxStore() {
  return useSyncExternalStore(
    store.subscribe,
    () => store.getState(),
    () => store.getState()
  );
}
```

## 六、useInsertionEffect

### 1、基本使用

```jsx
import { useInsertionEffect } from 'react';

function Component() {
  useInsertionEffect(() => {
    // 在 DOM 更新前插入样式
    const style = document.createElement('style');
    style.textContent = `
      .my-class {
        color: red;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  });

  return <div className="my-class">Content</div>;
}
```

**使用场景**：
- 动态插入样式
- CSS-in-JS 库
- 在 DOM 更新前执行

## 七、use (实验性)

### 1、基本使用

```jsx
import { use } from 'react';

function UserProfile({ userPromise }) {
  // use Hook 会等待 Promise 解决
  const user = use(userPromise);
  return <div>{user.name}</div>;
}

function App() {
  const userPromise = fetch('/api/user').then(r => r.json());
  
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

### 2、处理 Context

```jsx
import { createContext, use } from 'react';

const ThemeContext = createContext();

function ThemedButton() {
  const theme = use(ThemeContext);
  return <button className={theme}>Button</button>;
}
```

## 八、实际应用示例

### 1、表单 ID 管理

```jsx
function Form() {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();

  return (
    <form>
      <div>
        <label htmlFor={nameId}>Name</label>
        <input id={nameId} type="text" />
      </div>
      <div>
        <label htmlFor={emailId}>Email</label>
        <input id={emailId} type="email" />
      </div>
      <div>
        <label htmlFor={passwordId}>Password</label>
        <input id={passwordId} type="password" />
      </div>
    </form>
  );
}
```

### 2、搜索优化

```jsx
function SearchBox() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [isPending, startTransition] = useTransition();

  const results = useMemo(() => {
    return search(deferredQuery);
  }, [deferredQuery]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          startTransition(() => {
            // 搜索会在后台进行
          });
        }}
      />
      {isPending && <div>搜索中...</div>}
      <ResultsList results={results} />
    </div>
  );
}
```

### 3、外部状态同步

```jsx
import { useSyncExternalStore } from 'react';

// 简单的状态管理
function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
    setState: (newState) => {
      state = newState;
      listeners.forEach(listener => listener());
    },
  };
}

const store = createStore({ count: 0 });

function Counter() {
  const count = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot
  );

  return (
    <div>
      <p>Count: {count.count}</p>
      <button onClick={() => store.setState({ count: count.count + 1 })}>
        Increment
      </button>
    </div>
  );
}
```

## 九、Hooks 对比

| Hook | 用途 | 使用场景 |
|------|------|----------|
| `useId` | 生成唯一 ID | 表单标签、ARIA 属性 |
| `useTransition` | 标记非紧急更新 | 搜索、过滤、列表更新 |
| `useDeferredValue` | 延迟值更新 | 基于值的延迟计算 |
| `useSyncExternalStore` | 同步外部存储 | Redux、Zustand 等状态库 |
| `useInsertionEffect` | DOM 更新前执行 | CSS-in-JS、动态样式 |
| `use` | 读取 Promise/Context | 数据获取、Context 读取 |

## 十、最佳实践

### 1、合理使用 useId

```jsx
// ✅ 好的做法
const id = useId();

// ❌ 不好的做法：使用随机数
const id = Math.random().toString();
```

### 2、区分紧急和非紧急更新

```jsx
// ✅ 好的做法
setInput(value); // 紧急
startTransition(() => {
  setResults(search(value)); // 非紧急
});
```

### 3、使用 useDeferredValue 优化性能

```jsx
// ✅ 好的做法
const deferredQuery = useDeferredValue(query);
const results = search(deferredQuery);
```

## 十一、总结

React 18 的新 Hooks 为应用开发提供了更多工具和优化选项。合理使用这些 Hooks 可以显著提升应用性能和用户体验。
