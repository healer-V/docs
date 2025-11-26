# Transitions

## 一、什么是 Transitions？

::: tip Transitions 定义
Transitions 是 React 18 的新特性，它允许你标记某些更新为"非紧急"的，让 React 保持 UI 的响应性，同时处理这些非紧急更新。
:::

## 二、为什么需要 Transitions？

### 1、问题场景

```jsx
function SearchResults({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    // 搜索会阻塞 UI
    const filtered = expensiveSearch(query);
    setResults(filtered);
  }, [query]);

  return <ResultsList results={results} />;
}
```

**问题**：
- 搜索时 UI 无响应
- 用户输入卡顿
- 体验差

### 使用 Transitions 解决

```jsx
import { useTransition } from 'react';

function SearchResults({ query }) {
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState([]);

  useEffect(() => {
    // 标记为非紧急更新
    startTransition(() => {
      const filtered = expensiveSearch(query);
      setResults(filtered);
    });
  }, [query]);

  return (
    <>
      {isPending && <div>搜索中...</div>}
      <ResultsList results={results} />
    </>
  );
}
```

**优势**：
- UI 保持响应
- 用户体验好
- 性能提升

## useTransition Hook

### 基本使用

```jsx
import { useTransition } from 'react';

function App() {
  const [isPending, startTransition] = useTransition();
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // 紧急更新：立即执行
    setCount(c => c + 1);
    
    // 非紧急更新：可以中断
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

### 2、参数说明

- `isPending`：布尔值，表示是否有待处理的 transition
- `startTransition`：函数，用于标记非紧急更新

## 四、实际应用示例

### 1、搜索功能

```jsx
import { useState, useTransition } from 'react';

function SearchBox() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    
    // 紧急更新：用户输入
    setQuery(value);
    
    // 非紧急更新：搜索结果
    startTransition(() => {
      const filtered = searchItems(value);
      setResults(filtered);
    });
  };

  return (
    <div>
      <input
        value={query}
        onChange={handleChange}
        placeholder="搜索..."
      />
      {isPending && <div>搜索中...</div>}
      <ResultsList results={results} />
    </div>
  );
}
```

### 2、标签切换

```jsx
import { useState, useTransition } from 'react';

function Tabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleTabChange = (index) => {
    // 紧急更新：立即切换标签
    setActiveTab(index);
    
    // 非紧急更新：加载内容
    startTransition(() => {
      loadTabContent(tabs[index]);
    });
  };

  return (
    <div>
      <div className="tabs">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleTabChange(index)}
            className={activeTab === index ? 'active' : ''}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {isPending && <div>加载中...</div>}
      <div className="tab-content">
        {tabs[activeTab].content}
      </div>
    </div>
  );
}
```

### 3、列表过滤

```jsx
import { useState, useTransition, useMemo } from 'react';

function ProductList({ products }) {
  const [filter, setFilter] = useState('');
  const [isPending, startTransition] = useTransition();
  const [filteredProducts, setFilteredProducts] = useState(products);

  const handleFilterChange = (e) => {
    const value = e.target.value;
    
    // 紧急更新：输入框
    setFilter(value);
    
    // 非紧急更新：过滤列表
    startTransition(() => {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(filtered);
    });
  };

  return (
    <div>
      <input
        value={filter}
        onChange={handleFilterChange}
        placeholder="过滤产品..."
      />
      {isPending && <div>过滤中...</div>}
      <ul>
        {filteredProducts.map(product => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 五、startTransition API

### 1、独立使用

```jsx
import { startTransition } from 'react';

function Component() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);

  const handleClick = () => {
    // 紧急更新
    setCount(c => c + 1);
    
    // 非紧急更新
    startTransition(() => {
      setItems(generateLargeList());
    });
  };

  return (
    <div>
      <button onClick={handleClick}>Click</button>
      <p>Count: {count}</p>
      <List items={items} />
    </div>
  );
}
```

## 六、与 useDeferredValue 的区别

### 1、useTransition

```jsx
// 用于标记更新为 transition
const [isPending, startTransition] = useTransition();

startTransition(() => {
  setState(newValue);
});
```

**适用场景**：
- 需要控制何时开始 transition
- 需要显示加载状态

### 2、useDeferredValue

```jsx
// 用于延迟值
const deferredValue = useDeferredValue(value);
```

**适用场景**：
- 基于某个值进行延迟更新
- 不需要手动控制

## 七、最佳实践

### 1、区分紧急和非紧急更新

```jsx
// ✅ 好的做法
function Component() {
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    setInput(e.target.value); // 紧急
    startTransition(() => {
      setResults(search(e.target.value)); // 非紧急
    });
  };
}

// ❌ 不好的做法
function Component() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    setInput(e.target.value);
    setResults(search(e.target.value)); // 阻塞 UI
  };
}
```

### 2、显示加载状态

```jsx
function Component() {
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      {isPending && <div>处理中...</div>}
      {/* 内容 */}
    </div>
  );
}
```

### 3、合理使用

```jsx
// ✅ 适合使用 transition
- 搜索过滤
- 标签切换
- 列表排序
- 数据加载

// ❌ 不适合使用 transition
- 用户输入（紧急）
- 按钮点击（紧急）
- 表单提交（紧急）
```

## 八、性能优化

### 1、减少不必要的 transition

```jsx
// ✅ 只在真正需要时使用
if (items.length > 1000) {
  startTransition(() => {
    setFilteredItems(filter(items));
  });
} else {
  setFilteredItems(filter(items));
}
```

### 2、结合 Suspense

```jsx
import { Suspense, useTransition } from 'react';

function Component() {
  const [isPending, startTransition] = useTransition();

  return (
    <Suspense fallback={<div>加载中...</div>}>
      {isPending && <div>处理中...</div>}
      <AsyncContent />
    </Suspense>
  );
}
```

## 总结

Transitions 是 React 18 的重要特性，它通过标记非紧急更新，让 React 保持 UI 的响应性。合理使用 useTransition 可以显著提升用户体验，特别是在处理大量数据或复杂计算时。
