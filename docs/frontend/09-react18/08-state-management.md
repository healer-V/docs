---
title: "状态管理"
category: "前端 · React 18"
tags:
  - React
  - Zustand
  - Redux
excerpt: "React 18 生态下主流状态管理方案对比：Zustand 以简洁 API 适合中小项目，Jotai 的原子化模型适合细粒度订阅，Redux Toolkit Query 是大型项目的全功能选择。结合 React 18 并发特性可进一步优化性能。"
date: 2026-03-17
---

# 状态管理

## 一、React 18 状态管理方案概览

React 18 的并发模式对状态管理库提出了新的要求：库必须通过 `useSyncExternalStore` 订阅外部状态，才能避免并发渲染下的"状态撕裂"问题。主流库均已完成适配。

| 方案 | 包大小 | 学习成本 | 适用场景 |
|------|--------|----------|----------|
| Context + useReducer | 0（内置） | 低 | 小型应用、局部状态共享 |
| Zustand | ~1KB | 低 | 中小型应用、简单全局状态 |
| Jotai | ~3KB | 中 | 原子化细粒度订阅、避免整体重渲染 |
| Redux Toolkit | ~30KB | 高 | 大型应用、需要 DevTools 调试 |
| RTK Query | ~30KB | 高 | 服务端状态管理、自动缓存 |

## 二、Zustand

Zustand 是目前最流行的轻量状态管理库，API 极为简洁，无需 Provider 包裹。

### 1. 安装

```bash
npm install zustand
```

### 2. 基本使用

::: details Zustand 购物车 Store

```jsx{3-20}
// src/store/cartStore.js
import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  total: 0,

  addItem: (product) => {
    const { items } = get();
    const existing = items.find(i => i.id === product.id);

    if (existing) {
      set(state => ({
        items: state.items.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
        total: state.total + product.price,
      }));
    } else {
      set(state => ({
        items: [...state.items, { ...product, quantity: 1 }],
        total: state.total + product.price,
      }));
    }
  },

  removeItem: (productId) => {
    const { items } = get();
    const item = items.find(i => i.id === productId);
    if (!item) return;

    set(state => ({
      items: state.items.filter(i => i.id !== productId),
      total: state.total - item.price * item.quantity,
    }));
  },

  clearCart: () => set({ items: [], total: 0 }),
}));
```

:::

::: details 在组件中使用 Zustand Store

```jsx{2,5,6}
// src/components/CartIcon.jsx
import { useCartStore } from '../store/cartStore';

function CartIcon() {
  // 精确订阅需要的字段，避免无关更新触发重渲染
  const itemCount = useCartStore(state => state.items.length);
  const total = useCartStore(state => state.total);

  return (
    <button>
      购物车 ({itemCount}) — ¥{total.toFixed(2)}
    </button>
  );
}

function AddToCartButton({ product }) {
  const addItem = useCartStore(state => state.addItem);

  return (
    <button onClick={() => addItem(product)}>
      加入购物车
    </button>
  );
}
```

:::

### 3. 持久化存储

::: details Zustand persist 中间件

```jsx{2,4-10}
// src/store/userPreferencesStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const usePreferencesStore = create(
  persist(
    (set) => ({
      theme: 'light',
      language: 'zh-CN',
      fontSize: 'medium',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'user-preferences', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

:::

## 三、Jotai

Jotai 采用**原子化（Atomic）**状态模型，每个状态是一个独立的"atom"，组件只订阅它实际使用的 atom，实现真正细粒度的更新。

### 1. 安装

```bash
npm install jotai
```

### 2. 基本用法

::: details Jotai atom 基础示例

```jsx{2,4-9}
// src/atoms/filterAtoms.js
import { atom } from 'jotai';

// 原始 atom
export const searchQueryAtom = atom('');
export const categoryAtom = atom('all');
export const sortOrderAtom = atom('newest');

// 派生 atom（只读，基于其他 atom 计算）
export const activeFiltersCountAtom = atom((get) => {
  const query = get(searchQueryAtom);
  const category = get(categoryAtom);
  const sort = get(sortOrderAtom);
  return [query, category !== 'all', sort !== 'newest'].filter(Boolean).length;
});
```

```jsx
// src/components/ProductFilter.jsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { searchQueryAtom, categoryAtom, activeFiltersCountAtom } from '../atoms/filterAtoms';

function SearchInput() {
  const [query, setQuery] = useAtom(searchQueryAtom);
  return (
    <input
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="搜索商品..."
    />
  );
}

function FilterBadge() {
  // useAtomValue：只读订阅，不需要 setter
  const count = useAtomValue(activeFiltersCountAtom);
  if (count === 0) return null;
  return <span className="filter-badge">{count} 个筛选条件</span>;
}
```

:::

### 3. Jotai 的核心优势

::: details Jotai 避免无效重渲染示例

```jsx
// 场景：用户列表中，只修改一个用户的名字
// Zustand 方案：如果整个 users 数组存在一个 store 中，修改任意用户都会让所有订阅了 users 的组件重渲染
// Jotai 方案：每个用户是独立的 atom，修改某用户的 atom 只影响订阅该 atom 的组件

import { atom, useAtom } from 'jotai';
import { splitAtom } from 'jotai/utils';

const usersAtom = atom([
  { id: 1, name: '张三', email: 'zhang@example.com' },
  { id: 2, name: '李四', email: 'li@example.com' },
]);

// splitAtom 将数组 atom 拆分为每个元素的独立 atom
const userAtomsAtom = splitAtom(usersAtom);

function UserItem({ userAtom }) {
  const [user, setUser] = useAtom(userAtom);
  return (
    <div>
      <input
        value={user.name}
        onChange={e => setUser(prev => ({ ...prev, name: e.target.value }))}
      />
      <span>{user.email}</span>
    </div>
  );
}

function UserList() {
  const [userAtoms] = useAtom(userAtomsAtom);
  // 每个 UserItem 只订阅自己的 atom，互不影响
  return userAtoms.map(ua => <UserItem key={`${ua}`} userAtom={ua} />);
}
```

:::

## 四、Redux Toolkit + RTK Query

Redux Toolkit（RTK）是 Redux 官方推荐的现代化写法，RTK Query 是其内置的数据获取与缓存解决方案。

### 1. 安装

```bash
npm install @reduxjs/toolkit react-redux
```

### 2. Redux Toolkit 基本配置

::: details RTK createSlice + configureStore

```jsx{3,5-20}
// src/store/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 异步 Action
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('登录失败');
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

:::

### 3. RTK Query 服务端状态管理

::: details RTK Query API 定义与使用

```jsx{4-22}
// src/services/productsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: ({ page = 1, category = 'all', search = '' }) =>
        `/products?page=${page}&category=${category}&search=${search}`,
      providesTags: ['Product'],
    }),
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Product'], // 创建后自动刷新列表缓存
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
} = productsApi;
```

```jsx
// src/components/ProductList.jsx
import { useGetProductsQuery } from '../services/productsApi';

function ProductList({ page, category, search }) {
  // RTK Query 自动处理加载、缓存、重新获取
  const { data, isLoading, isFetching, error } = useGetProductsQuery({
    page,
    category,
    search,
  });

  if (isLoading) return <ProductListSkeleton />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div>
      {isFetching && <div className="refetch-indicator">更新中...</div>}
      <ul>
        {data.products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
      <Pagination total={data.total} page={page} />
    </div>
  );
}
```

:::

## 五、方案选型建议

### 1. 选型决策矩阵

| 场景 | 推荐方案 | 理由 |
|------|----------|------|
| 个人项目、小型应用 | Zustand | 极简 API，上手快 |
| 中型应用，关注性能 | Jotai | 原子化，避免无效重渲染 |
| 大型团队协作 | Redux Toolkit | 严格的单向数据流，利于维护 |
| 复杂的服务端数据 | RTK Query / React Query | 自动缓存、乐观更新 |
| 仅需局部共享 | Context + useReducer | 无需额外依赖 |

### 2. 结合 React 18 并发特性

::: details Zustand + useTransition 优化搜索

```jsx{6,12-16}
// src/components/ProductSearch.jsx
import { useState, useTransition, useDeferredValue, useMemo } from 'react';
import { useProductStore } from '../store/productStore';

function ProductSearch() {
  const allProducts = useProductStore(state => state.products);
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const handleChange = (e) => {
    setQuery(e.target.value); // 紧急：输入框立即响应

    startTransition(() => {
      // 非紧急：过滤结果延迟更新（若过滤逻辑在 store 中）
      useProductStore.getState().setFilter(e.target.value);
    });
  };

  // 本地计算时，用 deferredQuery 延迟过滤
  const filtered = useMemo(() =>
    allProducts.filter(p =>
      p.name.toLowerCase().includes(deferredQuery.toLowerCase())
    ),
    [allProducts, deferredQuery]
  );

  return (
    <div>
      <input value={query} onChange={handleChange} placeholder="搜索商品..." />
      {isPending && <span>筛选中...</span>}
      <ProductGrid products={filtered} />
    </div>
  );
}
```

:::
