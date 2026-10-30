---
title: "数据请求与缓存"
category: "前端 · React 16.8"
tags:
  - React
  - Fetch
  - React Query
excerpt: "说明 React 16.8 中请求状态、Effect 清理和竞态控制的实现方式，并使用 React Query 3 建立查询键、缓存、新鲜度与失效模型。"
date: 2026-07-31
---

# 数据请求与缓存

## 一、服务端状态与请求状态

服务端状态由远程系统保存，前端拿到的是某个时间点的副本。除了业务数据本身，界面还需要知道请求是否进行中、是否失败、缓存是否过期以及旧数据能否继续显示。

一次读取请求至少包含以下状态：

| 状态 | 含义 | 界面处理 |
|------|------|----------|
| `idle` | 请求尚未触发或缺少请求条件 | 不展示加载动画 |
| `loading` | 首次请求进行中，当前没有可展示数据 | 展示加载状态 |
| `success` | 已成功得到响应 | 展示数据或空状态 |
| `error` | 请求失败且没有可用结果 | 展示错误与重试入口 |

“请求成功但数组为空”属于 `success`，不能当作请求失败。“已有旧数据并在后台刷新”也不同于首次 `loading`，继续展示旧数据通常比清空页面更稳定。

请求函数应在网络边界完成状态码判断与响应解析，并在失败时抛出可供界面处理的 Error：

::: details 查看 src/features/tasks/taskApi.js 完整代码
```js
// src/features/tasks/taskApi.js

/**
 * 读取指定状态的任务列表。
 * @param {string} status 任务状态筛选值，例如 all、open 或 completed。
 * @param {AbortSignal} signal 用于在查询失效时取消请求的信号。
 * @returns {Promise<Array<{ id: number, title: string, completed: boolean }>>} 任务列表。
 */
export async function fetchTasks(status, signal) {
  const query = new URLSearchParams();

  if (status !== 'all') {
    query.set('status', status);
  }

  const response = await fetch(`/api/tasks?${query.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`任务加载失败，状态码：${response.status}`);
  }

  const payload = await response.json();
  return payload.items;
}
```
:::

`fetch()` 只有网络连接失败、请求被取消等情况才会拒绝 Promise。HTTP 404 和 500 仍会正常得到 Response，因此必须检查 `response.ok`。

## 二、在 Effect 中读取数据

请求由组件是否挂载和筛选条件决定时，可以在 `useEffect` 中发起。Effect 内需要同时处理开始、成功、失败和清理，依赖数组必须包含会改变请求结果的参数。

::: details 查看 src/features/tasks/TaskList.js 完整代码
```jsx
// src/features/tasks/TaskList.js
import React from 'react';
import { fetchTasks } from './taskApi';

// 根据状态筛选值读取并展示任务列表。
function TaskList({ status }) {
  const [request, setRequest] = React.useState({
    status: 'idle',
    data: [],
    error: null
  });

  React.useEffect(() => {
    const controller = new AbortController();

    setRequest({
      status: 'loading',
      data: [],
      error: null
    });

    // 将本次请求结果写入组件状态。
    async function loadTasks() {
      try {
        const tasks = await fetchTasks(status, controller.signal);
        setRequest({
          status: 'success',
          data: tasks,
          error: null
        });
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        setRequest({
          status: 'error',
          data: [],
          error
        });
      }
    }

    loadTasks();

    // 筛选条件变化或组件卸载时终止仍在进行的请求。
    return () => {
      controller.abort();
    };
  }, [status]);

  if (request.status === 'loading') {
    return <p>正在加载任务…</p>;
  }

  if (request.status === 'error') {
    return <p role="alert">{request.error.message}</p>;
  }

  if (request.status === 'success' && request.data.length === 0) {
    return <p>当前条件下没有任务。</p>;
  }

  return (
    <ul>
      {request.data.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```
:::

`AbortController` 需要目标浏览器支持。面向旧浏览器时，应根据项目浏览器范围提供 polyfill，或改用“忽略过期结果”的方式保护状态更新。

## 三、请求竞态

用户从“未完成”快速切换到“已完成”时，会产生两个并发请求。响应到达顺序不受发起顺序保证：旧请求若最后返回，就可能覆盖新筛选条件的结果。

竞态可以通过两种方式控制：

1. 取消旧请求，使其不能继续产生有效响应。
2. 为每次 Effect 建立有效标记，只接收当前 Effect 的结果。

某些请求库或旧环境不能真正中断网络连接时，可以忽略过期结果：

::: details 查看请求竞态的示例代码
```jsx
import React from 'react';
import { fetchTasksWithoutAbort } from './taskApi';

// 只接收当前筛选条件对应的最后有效请求结果。
function TaskList({ status }) {
  const [tasks, setTasks] = React.useState([]);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let active = true;

    // 读取任务，并在 Effect 仍有效时提交结果。
    async function loadTasks() {
      try {
        const nextTasks = await fetchTasksWithoutAbort(status);

        if (active) {
          setTasks(nextTasks);
          setError(null);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError);
        }
      }
    }

    loadTasks();

    // 旧 Effect 清理后，它所对应的 Promise 结果将被忽略。
    return () => {
      active = false;
    };
  }, [status]);

  if (error) {
    return <p role="alert">{error.message}</p>;
  }

  return <TaskItems tasks={tasks} />;
}
```
:::

有效标记只阻止旧结果进入 React State，不会减少服务器计算或网络流量。能够取消时优先取消，不能取消时至少要忽略过期结果。

## 四、重试与错误恢复

重试不是简单地再次调用请求函数，还要明确谁可以重试、何时停止以及提交操作是否具备幂等性。

| 错误类型 | 是否适合自动重试 | 原因 |
|----------|------------------|------|
| 短暂网络错误 | 可以有限重试 | 下一次连接可能恢复 |
| HTTP 429 | 按服务端提示延迟重试 | 立即重试会继续触发限流 |
| HTTP 500/503 | 可以有限重试 | 服务可能暂时不可用 |
| HTTP 400/401/403 | 通常不自动重试 | 请求内容或身份不变时结果不会改变 |
| 创建、支付等写操作 | 必须确认幂等策略 | 重试可能产生重复数据 |

手动重试需要让 Effect 的依赖发生变化，而不是在渲染期间直接发请求：

::: details 查看重试与错误恢复的示例代码
```jsx
import React from 'react';

// 通过 retryCount 显式触发新一轮读取请求。
function RetryableTaskList({ status }) {
  const [retryCount, setRetryCount] = React.useState(0);

  // 用户点击后递增重试版本，使请求 Effect 重新执行。
  function handleRetry() {
    setRetryCount((count) => count + 1);
  }

  React.useEffect(() => {
    // 此处执行带清理的请求，status 或 retryCount 变化都会重新读取。
  }, [status, retryCount]);

  return <button onClick={handleRetry}>重新加载</button>;
}
```
:::

重试按钮需要避免在请求进行中重复触发；自动重试应设置次数上限和退避间隔，并保留最终错误供用户处理。

## 五、为什么需要请求缓存

多个组件读取同一任务列表时，纯 Effect 实现会分别保存加载、错误和数据状态，也可能重复发起相同请求。请求缓存层把查询标识、数据副本和请求生命周期集中管理。

请求缓存通常负责：

- 根据查询键识别同一份服务端数据；
- 复用缓存并对并发请求去重；
- 判断数据是新鲜还是过期；
- 在窗口聚焦、网络恢复或手动失效时重新读取；
- 管理加载、错误、重试和后台刷新状态；
- 在写操作成功后更新或失效相关查询。

请求缓存不是永久存储。缓存中的数据可能过期，刷新页面后通常也会丢失，最终权威数据仍在服务端。

## 六、React Query 3 的基础配置

React Query 3 支持 React 16.8 及以上。React 16.8 项目应固定使用 `react-query` 3.x 包名；当前新版本使用 `@tanstack/react-query`，API 和 React 版本要求均不同。

```bash
npm install react-query@3.39.3
```

`QueryClient` 保存查询缓存和默认配置。它应在组件外创建一次，再通过 `QueryClientProvider` 提供给应用：

::: details 查看 src/index.js 完整代码
```jsx
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
});

// 为应用提供唯一的 React Query 客户端。
ReactDOM.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
  document.getElementById('root')
);
```
:::

这些默认值的含义是：成功数据在 30 秒内视为新鲜，请求失败最多重试两次，窗口重新聚焦时不自动请求。是否采用这些值取决于数据变化频率和业务容忍度，不应把示例配置当成所有接口的统一答案。

## 七、查询键与 useQuery

查询键唯一标识一份数据。所有会改变响应内容的输入都必须进入查询键，例如筛选条件、页码和用户 ID：

```text
['tasks', { status: 'open', page: 1 }]
['tasks', { status: 'completed', page: 1 }]
['task', 42]
```

查询函数返回 Promise；Promise 成功解析为数据，失败必须抛出 Error。React Query 3 会把状态和数据通过 `useQuery` 返回：

::: details 查看 src/features/tasks/TaskList.js 完整代码
```jsx
// src/features/tasks/TaskList.js
import React from 'react';
import { useQuery } from 'react-query';
import { fetchTasks } from './taskApi';

/**
 * 根据 React Query 传入的查询键读取任务。
 * @param {{ queryKey: [string, { status: string }] }} context 查询函数上下文。
 * @returns {Promise<Array<{ id: number, title: string }>>} 任务列表。
 */
function queryTasks({ queryKey }) {
  const [, filters] = queryKey;
  return fetchTasks(filters.status);
}

// 使用筛选条件组成查询键，并渲染完整查询状态。
function TaskList({ status }) {
  const query = useQuery(['tasks', { status }], queryTasks, {
    keepPreviousData: true
  });

  if (query.isLoading) {
    return <p>正在加载任务…</p>;
  }

  if (query.isError) {
    return (
      <div role="alert">
        <p>{query.error.message}</p>
        <button onClick={query.refetch}>重新加载</button>
      </div>
    );
  }

  if (query.data.length === 0) {
    return <p>当前条件下没有任务。</p>;
  }

  return (
    <>
      {query.isFetching && <p aria-live="polite">正在刷新…</p>}
      <ul>
        {query.data.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </>
  );
}
```
:::

`isLoading` 表示当前没有数据且首次请求进行中，`isFetching` 表示任何后台请求正在进行。使用 `keepPreviousData` 后，条件变化期间可以保留上一份成功数据，同时通过 `isFetching` 告知用户正在刷新。

::: warning 查询函数的 AbortSignal
React Query 3 的查询函数上下文不保证提供与当前新版本相同的 `signal` API。使用 3.x 时应遵循 3.x 文档实现取消，不要直接复制当前 `@tanstack/react-query` 文档中的写法。
:::

## 八、新鲜度与缓存时间

`staleTime` 和 `cacheTime` 控制不同阶段：

| 配置 | 计时起点 | 到期后的含义 |
|------|----------|--------------|
| `staleTime` | 数据成功写入缓存 | 数据变为陈旧，允许在特定时机重新请求 |
| `cacheTime` | 最后一个观察者卸载 | 无组件使用的缓存可以被回收 |

数据变为 stale 不等于立刻从界面消失。React Query 可以继续返回旧数据，并在后台刷新。缓存超过 `cacheTime` 被回收后，再次进入页面通常需要重新经历首次加载。

稳定的配置需要结合数据性质：

- 权限、库存等要求较新数据的查询使用较短 `staleTime`；
- 字典、地区列表等低频变化数据可以使用较长 `staleTime`；
- 内存占用较大的分页数据不宜无限延长 `cacheTime`；
- 用户明确要求刷新时，可以直接调用 `refetch` 或使查询失效。

## 九、写操作与缓存失效

创建、修改和删除属于 Mutation。写操作成功后，已有列表缓存可能已经过期，需要更新缓存或标记相关查询失效。

::: details 查看 src/features/tasks/CreateTaskButton.js 完整代码
```jsx
// src/features/tasks/CreateTaskButton.js
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { createTask } from './taskApi';

// 创建任务，并在成功后使所有任务列表查询重新获取数据。
function CreateTaskButton({ title }) {
  const queryClient = useQueryClient();
  const mutation = useMutation(createTask, {
    // 创建成功后，将 tasks 前缀下的列表缓存标记为失效。
    onSuccess: () => {
      queryClient.invalidateQueries('tasks');
    }
  });

  // 用户确认后发起创建请求。
  function handleCreate() {
    mutation.mutate({ title });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCreate}
        disabled={mutation.isLoading || !title.trim()}
      >
        {mutation.isLoading ? '正在创建…' : '创建任务'}
      </button>
      {mutation.isError && (
        <p role="alert">{mutation.error.message}</p>
      )}
    </div>
  );
}
```
:::

`invalidateQueries('tasks')` 会匹配以 `tasks` 开头的查询键，使不同筛选条件下的任务列表都变为 stale。若写操作只影响某条详情，可以使用更具体的键，例如 `['task', taskId]`。

直接调用 `setQueryData` 可以立即写入已知结果，减少一次请求，但必须确保新缓存结构与服务端响应一致。无法可靠推导列表排序、权限过滤或服务端计算字段时，失效后重新获取更稳妥。

## 十、数据边界与错误边界

接口响应进入组件前，应完成必要的结构判断和领域转换。不要让页面深处才因为缺少字段而抛出难以定位的错误：

::: details 查看数据边界与错误边界的示例代码
```js
/**
 * 将接口任务转换为页面使用的领域对象。
 * @param {unknown} payload 未经信任的接口响应项。
 * @returns {{ id: number, title: string, completed: boolean }} 可供页面使用的任务。
 */
export function toTask(payload) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.id !== 'number' ||
    typeof payload.title !== 'string'
  ) {
    throw new Error('任务响应结构无效。');
  }

  return {
    id: payload.id,
    title: payload.title.trim(),
    completed: Boolean(payload.completed)
  };
}
```
:::

请求失败属于可预期异步错误，应由查询状态展示重试入口。组件渲染期间出现的未知异常才交给 Error Boundary。把所有请求错误都抛给错误边界，会让局部网络问题变成整块界面降级，也会丢失针对当前请求的恢复操作。
