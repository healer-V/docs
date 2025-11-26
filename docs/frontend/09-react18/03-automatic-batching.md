# Automatic Batching

## 一、什么是自动批处理？

::: tip 自动批处理定义
自动批处理是 React 18 的新特性，它会自动将多个状态更新合并为一次重新渲染，从而减少不必要的渲染次数，提升性能。
:::

## 二、React 17 的批处理

### 1、React 17 的限制

```jsx
// React 17：在事件处理器中会批处理
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 只触发一次重新渲染 ✅
}

// React 17：在异步操作中不会批处理
function handleClick() {
  setTimeout(() => {
    setCount(c => c + 1);
    setFlag(f => !f);
    // 触发两次重新渲染 ❌
  }, 1000);
}

// React 17：在 Promise 中不会批处理
function handleClick() {
  fetch('/api/data').then(() => {
    setCount(c => c + 1);
    setFlag(f => !f);
    // 触发两次重新渲染 ❌
  });
}
```

## 三、React 18 的自动批处理

### 1、全面批处理

```jsx
// React 18：所有场景都会自动批处理
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 只触发一次重新渲染 ✅
}

// React 18：异步操作中也会批处理
function handleClick() {
  setTimeout(() => {
    setCount(c => c + 1);
    setFlag(f => !f);
    // 只触发一次重新渲染 ✅
  }, 1000);
}

// React 18：Promise 中也会批处理
function handleClick() {
  fetch('/api/data').then(() => {
    setCount(c => c + 1);
    setFlag(f => !f);
    // 只触发一次重新渲染 ✅
  });
}
```

## 四、批处理的好处

### 1、减少重新渲染

```jsx
// 没有批处理：3 次重新渲染
function Component() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleUpdate = () => {
    setCount(1);    // 渲染 1
    setName('John'); // 渲染 2
    setEmail('...'); // 渲染 3
  };
}

// 有批处理：1 次重新渲染
function Component() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleUpdate = () => {
    setCount(1);    // 
    setName('John'); // 合并为一次渲染
    setEmail('...'); // 
  };
}
```

### 2、提升性能

- 减少 DOM 操作
- 减少计算开销
- 提升用户体验

## 五、何时需要退出批处理

### 1、使用 flushSync

```jsx
import { flushSync } from 'react-dom';

function handleClick() {
  // 立即更新并渲染
  flushSync(() => {
    setCount(c => c + 1);
  });
  
  // DOM 已经更新
  console.log(document.getElementById('count').textContent);
  
  // 这个更新会单独批处理
  flushSync(() => {
    setFlag(f => !f);
  });
}
```

**使用场景**：
- 需要立即读取 DOM
- 需要同步更新
- 特殊情况下的性能优化

## 六、实际应用示例

### 1、表单提交

```jsx
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // React 18 会自动批处理这些更新
    setSubmitting(true);
    setName('');
    setEmail('');
    
    try {
      await submitForm({ name, email });
      // 这些也会被批处理
      setSubmitting(false);
      showSuccess();
    } catch (error) {
      setSubmitting(false);
      showError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <button disabled={submitting}>Submit</button>
    </form>
  );
}
```

### 2、数据获取

```jsx
function DataComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    // 这些更新会被批处理
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await fetch('/api/data').then(r => r.json());
      // 这些更新也会被批处理
      setData(result);
      setLoading(false);
    } catch (err) {
      // 这些更新也会被批处理
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {data && <div>{JSON.stringify(data)}</div>}
    </div>
  );
}
```

### 3、复杂状态更新

```jsx
function ShoppingCart() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [discount, setDiscount] = useState(0);

  const addItem = (item) => {
    // 所有更新会被批处理为一次渲染
    setItems(prev => [...prev, item]);
    setTotal(prev => prev + item.price);
    setDiscount(prev => {
      const newTotal = prev + item.price;
      return newTotal > 100 ? newTotal * 0.1 : 0;
    });
  };

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      <div>Total: {total}</div>
      <div>Discount: {discount}</div>
    </div>
  );
}
```

## 七、性能对比

### 1、React 17

```jsx
// 3 次状态更新 = 3 次重新渲染（在异步中）
setTimeout(() => {
  setCount(1);    // 渲染 1
  setName('John'); // 渲染 2
  setEmail('...'); // 渲染 3
}, 1000);
```

### 2、React 18

```jsx
// 3 次状态更新 = 1 次重新渲染（自动批处理）
setTimeout(() => {
  setCount(1);    // 
  setName('John'); // 合并为
  setEmail('...'); // 一次渲染
}, 1000);
```

## 八、最佳实践

### 1、信任自动批处理

```jsx
// ✅ 好的做法：让 React 自动批处理
function handleClick() {
  setCount(c => c + 1);
  setName('John');
  setEmail('...');
}

// ❌ 不好的做法：手动合并更新
function handleClick() {
  setState(prev => ({
    ...prev,
    count: prev.count + 1,
    name: 'John',
    email: '...'
  }));
}
```

### 2、只在必要时使用 flushSync

```jsx
// ✅ 只在真正需要时使用
import { flushSync } from 'react-dom';

function handleClick() {
  flushSync(() => {
    setCount(c => c + 1);
  });
  // 需要立即读取 DOM
  const element = document.getElementById('count');
}
```

## 总结

自动批处理是 React 18 的重要优化，它自动将多个状态更新合并为一次重新渲染，减少了不必要的渲染，提升了应用性能。在大多数情况下，你不需要做任何额外的工作，React 会自动处理批处理。
