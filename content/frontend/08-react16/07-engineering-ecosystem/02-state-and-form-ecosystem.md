---
title: "状态管理与表单生态"
category: "前端 · React 16.8"
tags:
  - React
  - Redux
  - Zustand
  - 表单
excerpt: "区分局部状态、跨组件客户端状态与服务端状态，说明 Context、Redux、Zustand、Formik 和 React Hook Form 的职责与 React 16.8 兼容用法。"
date: 2026-07-31
---

# 状态管理与表单生态

## 一、按状态归属选择存放位置

状态管理的首要问题不是选择库，而是确定谁读取状态、谁修改状态以及状态需要存活多久。状态应放在能够覆盖所有使用者的最近共同所有者中，超出这个范围才需要继续提升。

| 状态类型 | 典型内容 | 合适位置 |
|----------|----------|----------|
| 组件局部状态 | 输入草稿、展开状态、当前选项 | `useState` 或 `useReducer` |
| 子树共享状态 | 主题、语言、当前账户、权限能力 | Context |
| 跨页面客户端状态 | 多模块共同编辑的草稿、复杂业务流程 | Redux 或 Zustand |
| 服务端状态 | 任务列表、详情、分页结果、缓存 | 请求缓存库 |
| URL 状态 | 页面 ID、筛选、排序、分页 | 路由路径或查询参数 |
| 派生状态 | 已完成数量、过滤后的列表、总价 | 渲染时计算或选择器 |

同一份数据不应同时由多个位置独立维护。例如任务筛选条件已经写入 URL，就不应再建立一份需要双向同步的全局 State。服务端返回的列表也不等于客户端全局状态，它还包含新鲜度、请求失败、重试和缓存失效等生命周期。

下面的判断顺序可以缩小选择范围：

1. 只有一个组件使用时，保留为局部 State。
2. 父子组件共同使用时，提升到最近共同父组件。
3. 一棵稳定子树需要读取时，使用 Context。
4. 多个远距离页面共同修改复杂客户端状态时，再引入状态库。
5. 数据以服务端为权威来源时，交给请求缓存层。

## 二、Context 的适用范围

Context 负责把值提供给一棵组件子树，避免逐层透传 Props。它适合低频变化、语义稳定的横切信息，例如主题、语言、当前账户和权限方法。

Context 本身不提供业务状态建模、异步流程、调试记录或细粒度订阅。Provider 的 `value` 引用变化时，读取该 Context 的消费者会重新渲染。因此，把整个应用的高频变化对象放入单个 Context，容易扩大更新范围。

::: details 查看 src/auth/AuthContext.js 完整代码
```jsx
// src/auth/AuthContext.js
import React from 'react';

const AuthContext = React.createContext(null);

/**
 * 向子树提供当前账户和退出能力。
 * @param {{ children: React.ReactNode, currentUser: object|null, onSignOut: () => void }} props Provider 属性。
 * @returns {React.ReactElement} 认证上下文 Provider。
 */
export function AuthProvider({ children, currentUser, onSignOut }) {
  const value = React.useMemo(
    () => ({ currentUser, onSignOut }),
    [currentUser, onSignOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 读取认证上下文，并在缺少 Provider 时尽早暴露配置错误。
export function useAuth() {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内使用。');
  }

  return context;
}
```
:::

`useMemo` 在这里用于保持 Provider 值的引用稳定，前提是 `currentUser` 与 `onSignOut` 没有变化。若 `onSignOut` 在父组件每次渲染时重新创建，仍然需要由父组件使用 `useCallback` 保持引用。

需要不同更新频率的数据可以拆成多个 Context。例如账户信息和实时通知数量的变化频率不同，拆分后账户消费者不会因通知数量变化而重新渲染。

## 三、Redux 的数据流

Redux 用一个 Store 保存客户端状态，通过 Action 描述发生了什么，通过 Reducer 计算下一状态。React Redux 负责订阅 Store 并把状态和 `dispatch` 接入组件。

React 16.8 项目可以固定使用 React Redux 7.2.9。该版本要求 React 至少为 16.8.3，并提供 `useSelector`、`useDispatch` 等 Hooks API：

```bash
npm install redux@4.2.1 react-redux@7.2.9
```

Redux 的核心数据流是单向的：

```text
用户操作
  -> dispatch(action)
  -> reducer(previousState, action)
  -> nextState
  -> 订阅该状态的组件重新渲染
```

下面的 Reducer 管理任务筛选条件。Action 使用明确的 `type` 和载荷，Reducer 保持纯函数并返回新对象：

::: details 查看 src/store/filterReducer.js 完整代码
```js
// src/store/filterReducer.js
const initialState = {
  status: 'all',
  keyword: ''
};

/**
 * 根据筛选动作计算下一状态。
 * @param {{ status: string, keyword: string }} state 当前筛选状态。
 * @param {{ type: string, payload?: string }} action 已发生的筛选动作。
 * @returns {{ status: string, keyword: string }} 更新后的筛选状态。
 */
export function filterReducer(state = initialState, action) {
  switch (action.type) {
    case 'filter/statusChanged':
      return { ...state, status: action.payload };
    case 'filter/keywordChanged':
      return { ...state, keyword: action.payload };
    case 'filter/reset':
      return initialState;
    default:
      return state;
  }
}
```
:::

Store 在应用外创建一次，再通过 `Provider` 注入组件树：

::: details 查看 src/index.js 完整代码
```jsx
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { filterReducer } from './store/filterReducer';
import App from './App';

const store = createStore(filterReducer);

// 将唯一 Store 提供给所有页面组件。
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
```
:::

`useSelector` 订阅选中的状态，`useDispatch` 返回 Store 的派发函数：

::: details 查看 src/features/tasks/TaskFilters.js 完整代码
```jsx
// src/features/tasks/TaskFilters.js
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

// 读取筛选状态，并派发用户选择产生的动作。
function TaskFilters() {
  const status = useSelector((state) => state.status);
  const dispatch = useDispatch();

  // 将选择框中的新值写入 Redux Store。
  function handleStatusChange(event) {
    dispatch({
      type: 'filter/statusChanged',
      payload: event.target.value
    });
  }

  return (
    <label>
      任务状态
      <select value={status} onChange={handleStatusChange}>
        <option value="all">全部</option>
        <option value="open">未完成</option>
        <option value="completed">已完成</option>
      </select>
    </label>
  );
}
```
:::

`useSelector` 默认使用严格相等 `===` 比较前后结果。下面的选择器每次都创建新对象，即使字段没变也会触发渲染：

```jsx
// 不推荐：每次选择都会返回新对象引用。
const filter = useSelector((state) => ({
  status: state.status,
  keyword: state.keyword
}));
```

可以分别选择基本值，或使用 `shallowEqual` 比较对象字段：

```jsx
import { shallowEqual, useSelector } from 'react-redux';

// shallowEqual 只在对象的一层字段发生变化时认为结果不同。
const filter = useSelector(
  (state) => ({
    status: state.status,
    keyword: state.keyword
  }),
  shallowEqual
);
```

## 四、Zustand 的 Store

Zustand 以 Hook 形式暴露 Store，样板代码少，适合状态规模有限、希望按选择器订阅且不需要完整 Redux 约束的应用。React 16.8 项目可以固定使用 Zustand 3.7.2，其 `peerDependencies` 支持 React 16.8 及以上：

```bash
npm install zustand@3.7.2
```

Store 同时定义状态和修改状态的动作：

::: details 查看 src/store/useTaskDraftStore.js 完整代码
```js
// src/store/useTaskDraftStore.js
import create from 'zustand';

// 保存跨页面复用的任务草稿及其修改动作。
export const useTaskDraftStore = create((set) => ({
  draft: {
    title: '',
    description: ''
  },

  /**
   * 只替换发生变化的草稿字段。
   * @param {string} field 要更新的草稿字段名。
   * @param {string} value 字段的新值。
   * @returns {void} Zustand 会把更新结果写回 Store。
   */
  updateDraft: (field, value) =>
    set((state) => ({
      draft: {
        ...state.draft,
        [field]: value
      }
    })),

  // 提交成功或用户主动取消后清空草稿。
  resetDraft: () =>
    set({
      draft: {
        title: '',
        description: ''
      }
    })
}));
```
:::

组件应选择自己需要的最小状态，避免订阅整个 Store：

::: details 查看Zustand 的 Store的示例代码
```jsx
import React from 'react';
import { useTaskDraftStore } from '../../store/useTaskDraftStore';

// 编辑 Store 中的任务标题草稿。
function TaskTitleField() {
  const title = useTaskDraftStore((state) => state.draft.title);
  const updateDraft = useTaskDraftStore((state) => state.updateDraft);

  // 将标题输入同步到跨页面草稿。
  function handleChange(event) {
    updateDraft('title', event.target.value);
  }

  return (
    <label>
      任务标题
      <input value={title} onChange={handleChange} />
    </label>
  );
}
```
:::

Redux 与 Zustand 都不应自动承担请求缓存职责。把接口响应直接塞进 Store，还需要自行实现请求去重、新鲜度、重试、失效和竞态控制；这些需求更适合专门的服务端状态工具。

## 五、表单状态的组成

表单不只是多个输入值，还包括字段是否访问、校验错误、提交状态和服务端错误。简单表单使用受控组件即可，字段多、校验复杂或存在动态数组时才需要表单库。

| 需求 | 受控组件 | Formik | React Hook Form |
|------|----------|--------|-----------------|
| 少量字段和简单校验 | 最直接 | 引入成本偏高 | 引入成本偏高 |
| 表单级状态与错误对象 | 需要自行组织 | 内置完整模型 | 内置完整模型 |
| 大量字段的渲染性能 | 每次输入更新 React State | 以受控状态为主 | 默认更偏向非受控注册 |
| 动态字段数组 | 需要自行实现 | `FieldArray` | `useFieldArray` |
| 既有组件库集成 | 直接传 `value/onChange` | `Field` 或手动接入 | `Controller` |

表单值只表示用户当前草稿。提交成功得到的服务端实体应写入请求缓存或业务状态，不能继续把表单对象当作已经保存的数据。

## 六、Formik 的表单模型

Formik 2.4.6 支持 React 16.8 及以上。`useFormik` 接收初始值、校验函数和提交函数，并返回输入绑定、错误与提交状态：

```bash
npm install formik@2.4.6
```

::: details 查看Formik 的表单模型的示例代码
```jsx
import React from 'react';
import { useFormik } from 'formik';
import { createTask } from './taskApi';

/**
 * 校验任务表单。
 * @param {{ title: string, priority: string }} values 当前表单值。
 * @returns {{ title?: string, priority?: string }} 按字段组织的错误信息。
 */
function validateTask(values) {
  const errors = {};

  if (!values.title.trim()) {
    errors.title = '请输入任务标题。';
  } else if (values.title.trim().length > 80) {
    errors.title = '任务标题不能超过 80 个字符。';
  }

  if (!['low', 'normal', 'high'].includes(values.priority)) {
    errors.priority = '请选择有效优先级。';
  }

  return errors;
}

// 使用 Formik 管理字段、校验和提交状态。
function TaskForm() {
  const formik = useFormik({
    initialValues: {
      title: '',
      priority: 'normal'
    },
    validate: validateTask,

    /**
     * 校验通过后创建任务，并由 Formik 管理 submitting 状态。
     * @param {{ title: string, priority: string }} values 已通过客户端校验的表单值。
     * @param {import('formik').FormikHelpers<object>} helpers Formik 提供的表单控制方法。
     * @returns {Promise<void>} 创建完成后重置表单，失败时写入表单级错误。
     */
    onSubmit: async (values, helpers) => {
      try {
        await createTask({
          title: values.title.trim(),
          priority: values.priority
        });
        helpers.resetForm();
      } catch (error) {
        helpers.setStatus(error.message || '任务创建失败，请重试。');
      }
    }
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      <label htmlFor="task-title">任务标题</label>
      <input
        id="task-title"
        name="title"
        value={formik.values.title}
        onBlur={formik.handleBlur}
        onChange={formik.handleChange}
        aria-invalid={Boolean(formik.touched.title && formik.errors.title)}
        aria-describedby="task-title-error"
      />
      <p id="task-title-error" role="alert">
        {formik.touched.title ? formik.errors.title : ''}
      </p>

      <button type="submit" disabled={formik.isSubmitting}>
        {formik.isSubmitting ? '正在保存…' : '保存任务'}
      </button>

      {formik.status && <p role="alert">{formik.status}</p>}
    </form>
  );
}
```
:::

字段校验错误放在 `errors`，是否已经交互放在 `touched`，服务端提交错误可以放在 `status`。这样用户首次打开表单时不会立刻看到所有字段报错，提交失败也不会被误认为某个字段格式错误。

## 七、React Hook Form 的字段注册

React Hook Form 默认通过 Ref 注册原生字段，输入变化不需要把每个值都同步到组件 State。React Hook Form 7.43.9 的 peer dependency 包含 React 16.8：

```bash
npm install react-hook-form@7.43.9
```

`useForm` 返回 `register`、`handleSubmit`、`formState` 和其他表单控制能力：

::: details 查看React Hook Form 的字段注册的示例代码
```jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { createTask } from './taskApi';

// 使用字段注册和规则对象管理任务创建表单。
function TaskForm() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      title: '',
      priority: 'normal'
    }
  });

  // 创建任务；服务端错误归入 root.server，字段规则错误由库生成。
  async function submitTask(values) {
    try {
      await createTask({
        title: values.title.trim(),
        priority: values.priority
      });
      reset();
    } catch (error) {
      setError('root.server', {
        type: 'server',
        message: error.message || '任务创建失败，请重试。'
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(submitTask)} noValidate>
      <label htmlFor="task-title">任务标题</label>
      <input
        id="task-title"
        aria-invalid={Boolean(errors.title)}
        aria-describedby="task-title-error"
        {...register('title', {
          required: '请输入任务标题。',
          maxLength: {
            value: 80,
            message: '任务标题不能超过 80 个字符。'
          }
        })}
      />
      <p id="task-title-error" role="alert">
        {errors.title ? errors.title.message : ''}
      </p>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '正在保存…' : '保存任务'}
      </button>

      {errors.root && errors.root.server && (
        <p role="alert">{errors.root.server.message}</p>
      )}
    </form>
  );
}
```
:::

自定义受控组件无法直接暴露原生输入 Ref 时，可以使用 `Controller` 适配其 `value`、`onChange` 和 `onBlur`。不要同时对同一字段使用 `register` 与 `Controller`，否则会形成重复注册。

## 八、状态与表单库的选择边界

库的选择应由状态生命周期和协作需求决定，而不是由组件数量决定：

| 情况 | 选择 |
|------|------|
| 单个表单、字段少、校验直接 | 受控组件与局部 State |
| 表单字段多，需要统一错误、访问和提交状态 | Formik 或 React Hook Form |
| 主题、账户等低频子树共享值 | Context |
| 复杂动作需要严格的 Action、Reducer 和调试约束 | Redux |
| 跨页面客户端状态较少，希望使用轻量选择器 | Zustand |
| 接口数据需要缓存、失效、重试和后台刷新 | React Query 等请求缓存库 |

引入生态库之前，应检查实际版本而不是只看库名：

```bash
npm ls react react-dom
npm view react-redux@7.2.9 peerDependencies
npm view zustand@3.7.2 peerDependencies
npm view formik@2.4.6 peerDependencies
npm view react-hook-form@7.43.9 peerDependencies
```

依赖树中 React 与 ReactDOM 应保持相同版本，并避免出现意外的多份 React。生态库升级时要同时核对 `peerDependencies` 和该主版本文档，不能把最新版文档中的 API 套用到已固定的旧版本依赖。
