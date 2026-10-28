---
title: "测试、调试与构建部署"
category: "前端 · React 16.8"
tags:
  - React
  - Jest
  - Testing Library
  - 部署
excerpt: "使用 Jest 与 React Testing Library 验证 React 16.8 组件行为，说明 act、异步测试、调试方法、生产构建、静态部署和回退检查。"
date: 2026-07-31
---

# 测试、调试与构建部署

## 一、测试的观察边界

组件测试应从用户能够观察的行为出发：页面显示什么、用户能执行什么操作、操作后界面如何变化。组件内部 State、私有方法和子组件实例属于实现细节，重构后可能变化，但用户行为不应无故改变。

| 测试层次 | 观察范围 | 适合验证 |
|----------|----------|----------|
| 纯函数单元测试 | 输入与返回值 | Reducer、校验、格式转换 |
| 组件测试 | DOM、事件与可访问语义 | 表单、列表、加载、错误、交互 |
| 集成测试 | 多组件与数据边界协作 | 路由、Context、请求后的页面变化 |
| 端到端测试 | 真实浏览器和部署系统 | 登录、核心流程、跨页面导航 |

测试数量不能代替风险覆盖。一个任务编辑组件至少需要考虑：

- 初始内容是否正确；
- 用户能否修改并提交；
- 无效输入是否被阻止；
- 请求进行中是否防止重复提交；
- 请求失败后草稿是否保留；
- 成功后界面是否呈现新状态。

## 二、React 16.8 的测试依赖

React Testing Library 通过 DOM 查询和用户事件测试组件。12.1.5 的 peer dependency 要求 React 与 ReactDOM 小于 18，适用于 React 16.8。测试依赖可以固定为：

```bash
npm install --save-dev jest@27.5.1 babel-jest@27.5.1 @babel/core@7 @babel/preset-env@7 @babel/preset-react@7 @testing-library/react@12.1.5 @testing-library/jest-dom@5.16.5
```

项目已经使用 Create React App 时，`react-scripts test` 已包含 Jest 与 Babel 配置，不应再建立第二套 Jest 配置。独立 Babel 项目可以使用以下最小配置：

```js
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'classic' }]
  ]
};
```

Jest 配置指定浏览器 DOM 环境和断言扩展：

```js
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleFileExtensions: ['js', 'jsx']
};
```

```js
// src/setupTests.js
import '@testing-library/jest-dom';
```

`package.json` 中提供统一执行入口：

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "build": "webpack --mode production"
  }
}
```

构建命令应使用项目已有工具。上面的 `webpack` 脚本只适用于已经配置 Webpack 的项目；Create React App 对应 `react-scripts build`。

## 三、查询页面元素

Testing Library 推荐按照用户和辅助技术识别页面的方式查询元素。优先级大致如下：

1. `getByRole` 配合可访问名称；
2. `getByLabelText` 查询表单字段；
3. `getByText` 查询非交互文本；
4. `getByTestId` 处理缺少合适语义的最后情况。

查询前缀表达不同预期：

| 前缀 | 找不到时 | 多个结果 | 适用时机 |
|------|----------|----------|----------|
| `getBy` | 立即抛错 | 抛错 | 元素当前必须存在 |
| `queryBy` | 返回 `null` | 抛错 | 断言元素当前不存在 |
| `findBy` | 等待后拒绝 | 拒绝 | 元素会在异步更新后出现 |
| `getAllBy` | 立即抛错 | 返回数组 | 当前必须存在多个元素 |

使用 `getByRole('button', { name: '保存任务' })` 能同时验证元素是按钮且拥有正确名称。若测试只能通过 CSS 类名或 DOM 层级找到按钮，往往也说明组件语义需要改进。

## 四、测试同步交互

下面的组件接收初始标题和保存函数。测试不需要读取组件 State，只通过输入框、按钮和保存调用判断行为：

```jsx
// src/features/tasks/TaskTitleForm.js
import React from 'react';

/**
 * 编辑任务标题，并把规范化后的值交给保存函数。
 * @param {{ initialTitle: string, onSave: (title: string) => void }} props 初始标题与保存回调。
 * @returns {React.ReactElement} 可校验和提交的任务标题表单。
 */
export function TaskTitleForm({ initialTitle, onSave }) {
  const [title, setTitle] = React.useState(initialTitle);
  const [error, setError] = React.useState('');

  // 同步标题草稿，并清除旧校验结果。
  function handleChange(event) {
    setTitle(event.target.value);
    setError('');
  }

  // 校验用户输入，并在有效时通知调用方保存。
  function handleSubmit(event) {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setError('请输入任务标题。');
      return;
    }

    onSave(normalizedTitle);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="task-title">任务标题</label>
      <input
        id="task-title"
        value={title}
        onChange={handleChange}
        aria-describedby="task-title-error"
      />
      <p id="task-title-error" role="alert">
        {error}
      </p>
      <button type="submit">保存任务</button>
    </form>
  );
}
```

组件测试模拟清空标题、提交和再次输入：

```jsx
// src/features/tasks/TaskTitleForm.test.js
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TaskTitleForm } from './TaskTitleForm';

// 验证无效标题被阻止，有效标题会去除首尾空格后提交。
test('校验并提交任务标题', () => {
  const handleSave = jest.fn();

  render(
    <TaskTitleForm
      initialTitle="整理会议记录"
      onSave={handleSave}
    />
  );

  const titleInput = screen.getByLabelText('任务标题');
  const submitButton = screen.getByRole('button', {
    name: '保存任务'
  });

  fireEvent.change(titleInput, { target: { value: '   ' } });
  fireEvent.click(submitButton);

  expect(screen.getByRole('alert')).toHaveTextContent('请输入任务标题。');
  expect(handleSave).not.toHaveBeenCalled();

  fireEvent.change(titleInput, {
    target: { value: '  更新发布说明  ' }
  });
  fireEvent.click(submitButton);

  expect(handleSave).toHaveBeenCalledWith('更新发布说明');
});
```

该测试证明了用户可见校验与保存参数，不依赖 `useState` 的实现。以后将 State 改为 Reducer 或表单库，只要行为不变，测试无需跟着内部结构重写。

## 五、测试异步请求

异步测试需要控制请求结果，并等待 React 提交对应 DOM。`findBy` 适合等待某个元素出现，`waitFor` 适合等待断言最终成立。

```jsx
// src/features/tasks/TaskList.js
import React from 'react';
import { fetchTasks } from './taskApi';

// 加载任务列表，并区分加载、失败、空数据和成功状态。
export function TaskList() {
  const [request, setRequest] = React.useState({
    status: 'loading',
    tasks: [],
    error: null
  });

  React.useEffect(() => {
    let active = true;

    // 请求任务，并阻止卸载后的 Promise 更新组件。
    async function loadTasks() {
      try {
        const tasks = await fetchTasks();

        if (active) {
          setRequest({ status: 'success', tasks, error: null });
        }
      } catch (error) {
        if (active) {
          setRequest({ status: 'error', tasks: [], error });
        }
      }
    }

    loadTasks();

    // 组件卸载后忽略尚未结束的请求结果。
    return () => {
      active = false;
    };
  }, []);

  if (request.status === 'loading') {
    return <p>正在加载任务…</p>;
  }

  if (request.status === 'error') {
    return <p role="alert">{request.error.message}</p>;
  }

  if (request.tasks.length === 0) {
    return <p>还没有任务。</p>;
  }

  return (
    <ul aria-label="任务列表">
      {request.tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

测试通过模块 Mock 控制成功和失败，不访问真实接口：

```jsx
// src/features/tasks/TaskList.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { fetchTasks } from './taskApi';
import { TaskList } from './TaskList';

jest.mock('./taskApi');

beforeEach(() => {
  // 防止不同测试之间共享 Mock 调用和返回结果。
  fetchTasks.mockReset();
});

// 验证加载完成后渲染服务端任务。
test('请求成功后显示任务列表', async () => {
  fetchTasks.mockResolvedValue([
    { id: 1, title: '检查发布配置' },
    { id: 2, title: '补充回退说明' }
  ]);

  render(<TaskList />);

  expect(screen.getByText('正在加载任务…')).toBeInTheDocument();
  expect(await screen.findByText('检查发布配置')).toBeInTheDocument();
  expect(screen.getByRole('list', { name: '任务列表' })).toBeInTheDocument();
});

// 验证请求失败后显示可被辅助技术识别的错误。
test('请求失败后显示错误信息', async () => {
  fetchTasks.mockRejectedValue(new Error('服务暂时不可用'));

  render(<TaskList />);

  expect(await screen.findByRole('alert')).toHaveTextContent(
    '服务暂时不可用'
  );
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
});
```

Mock 应停留在网络或数据访问边界。把子组件全部 Mock 掉会削弱组件协作验证，也容易得到“测试通过但页面不能工作”的结果。

## 六、act() 与更新提交

`act()` 用于把会触发 React 更新的操作包起来，使渲染、Effect 和状态更新在断言前完成。React Testing Library 的 `render`、`fireEvent` 和异步查询已经在常见路径中处理 `act()`，一般不需要再次手动包裹。

直接控制定时器、调用外部订阅回调或使用底层 ReactDOM 测试工具时，可能需要显式 `act()`：

```jsx
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { AutoSaveMessage } from './AutoSaveMessage';

beforeEach(() => {
  // 使用虚拟时间精确控制自动保存延迟。
  jest.useFakeTimers();
});

afterEach(() => {
  // 恢复真实时间，避免影响其他测试文件。
  jest.useRealTimers();
});

// 验证计时结束后自动保存状态进入界面。
test('延迟结束后显示已保存', () => {
  render(<AutoSaveMessage />);

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(screen.getByText('已保存')).toBeInTheDocument();
});
```

出现 “not wrapped in act” 警告时，不应直接屏蔽控制台。它通常表示测试在 React 更新完成前结束，或者某个异步状态没有被等待。应找到触发更新的操作，使用 `findBy`、`waitFor` 或必要的 `act()` 等待真实结果。

## 七、路由与 Provider 测试

依赖 Router、Context、Redux 或 React Query 的组件，需要在测试中提供与运行时相同的上下文。测试路由通常使用 `MemoryRouter`，它在内存中管理历史记录，不依赖浏览器地址栏。

```jsx
import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import TaskDetailPage from './TaskDetailPage';

// 验证详情页能够读取动态路由参数。
test('从路由中读取任务编号', () => {
  render(
    <MemoryRouter initialEntries={['/tasks/42']}>
      <Route path="/tasks/:taskId">
        <TaskDetailPage />
      </Route>
    </MemoryRouter>
  );

  expect(screen.getByText('任务编号：42')).toBeInTheDocument();
});
```

可以建立 `renderWithProviders` 统一测试包装器，但它仍是一个新增多入参函数，需要清楚说明每个选项，并允许测试只启用真正依赖的 Provider：

```jsx
/**
 * 使用内存路由渲染组件。
 * @param {React.ReactElement} ui 要测试的 React 元素。
 * @param {{ route?: string }} options 测试路由选项，route 默认为根路径。
 * @returns {import('@testing-library/react').RenderResult} Testing Library 渲染结果。
 */
function renderWithRouter(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
}
```

不要让一个全能包装器默认挂载所有 Provider。上下文越多，测试初始化越慢，也越难看出组件真正依赖什么。

## 八、调试组件行为

调试从确定“哪一层事实不符合预期”开始，而不是直接在所有组件中添加日志。

| 现象 | 首先检查 | 可用工具 |
|------|----------|----------|
| 组件没有出现 | 条件渲染、路由是否匹配、父组件是否报错 | React DevTools Components |
| State 没有更新 | 事件是否触发、是否直接修改对象、闭包是否过期 | 浏览器断点、React DevTools |
| Effect 重复执行 | 依赖引用是否每次变化、是否存在多个挂载点 | Effect 断点、依赖逐项比较 |
| 请求结果被覆盖 | 请求发起和响应顺序、清理是否生效 | Network 面板、请求 ID 日志 |
| 页面更新很慢 | 哪个交互慢、哪些组件重复渲染 | React Profiler |
| 生产环境白屏 | 静态资源路径、运行时错误、路由回退 | Console、Network、错误监控 |

调试日志应记录可关联信息，例如请求 ID、任务 ID、筛选条件和状态转换。只输出“进入了”“执行了”无法判断多个并发流程属于哪一次操作。

React DevTools 可以查看组件 Props、State、Hooks 和 Context。Profiler 用于记录一次交互中的提交，不应仅凭组件数量判断性能。生产问题还需要浏览器 Console、Network、Source Map 和应用错误监控共同定位。

## 九、生产构建

开发构建包含警告、调试信息和热更新能力，不能直接作为生产产物。生产构建会设置生产环境、压缩代码、拆分资源并生成带内容哈希的静态文件。

构建前至少执行：

```bash
npm ci
npm test -- --runInBand
npm run build
```

`npm ci` 按锁文件安装依赖，适合持续集成；锁文件与 `package.json` 不一致时会直接失败。测试与构建命令必须返回退出码 0，不能只根据最后一行输出判断成功。

典型静态产物包含：

```text
build/
├─ index.html
├─ asset-manifest.json
└─ static/
   ├─ css/
   └─ js/
```

目录名由构建工具决定，可能是 `build` 或 `dist`。部署系统应发布构建输出目录，而不是包含源码和开发依赖的整个仓库。

## 十、环境变量与客户端配置

环境变量在前端构建时被替换进 JavaScript 产物。不同环境需要不同 API 地址时，应由构建工具规定的前缀读取。例如 Create React App 只向客户端暴露 `REACT_APP_` 开头的变量：

```dotenv
# .env.production
REACT_APP_API_BASE_URL=https://api.example.com
```

```js
// src/config.js
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('缺少 REACT_APP_API_BASE_URL。');
}

export const config = {
  apiBaseUrl
};
```

构建后的用户可以下载并阅读这些值，因此客户端环境变量只能保存公开配置。数据库密码、签名私钥和长期访问令牌必须留在服务端。

同一份静态产物要在多个环境复用时，可以在应用启动前读取独立的运行时配置文件。无论采用哪种方式，都要校验配置缺失，而不是请求发出后才通过模糊的网络错误发现地址为空。

## 十一、静态部署与路由回退

使用 `BrowserRouter` 时，Web 服务器需要把非静态文件路径回退到 `index.html`：

```text
请求 /static/js/main.abc123.js
  -> 返回真实 JavaScript 文件

请求 /tasks/42
  -> 文件不存在
  -> 返回 index.html
  -> React Router 匹配 /tasks/:taskId
```

回退规则不能把真实静态文件的 404 也改成 `index.html`，否则浏览器会把 HTML 当作 JavaScript 或 CSS 解析，并产生 MIME 类型错误。

缓存策略应区分入口 HTML 和带哈希资源：

| 资源 | 推荐策略 | 原因 |
|------|----------|------|
| `index.html` | 短缓存或协商缓存 | 需要及时引用新版本资源 |
| 带内容哈希的 JS/CSS | 长缓存并标记 immutable | 内容变化会生成新文件名 |
| 不带哈希的配置文件 | 短缓存 | 部署后需要及时生效 |
| Source Map | 按安全策略上传监控平台或限制访问 | 用于还原生产错误位置 |

部署后只验证首页不够，还要直接访问深层路由、刷新页面、加载懒加载 chunk，并确认 API 地址和静态资源基路径正确。

## 十二、发布验证与回退

一次可回退发布需要保留上一份可用产物，并使流量切换操作独立于重新构建。构建结果无法复现时，即使源码能够回退，也可能无法快速恢复线上版本。

发布前后的核心检查如下：

| 阶段 | 检查内容 | 失败处理 |
|------|----------|----------|
| 构建前 | 锁文件、Node.js 版本、测试、环境配置 | 阻止生成产物 |
| 构建后 | 资源引用、包体积、Source Map 策略 | 修复后重新构建 |
| 部署后 | 首页、深层路由、核心请求、登录和写操作 | 停止放量或切回旧产物 |
| 监控期 | JavaScript 错误率、接口失败率、核心操作成功率 | 根据阈值回退 |

本地可以用静态服务器验证生产产物和路由回退：

```bash
npx serve -s build
```

`-s` 表示单页应用回退。验证时至少直接打开一个深层地址，例如 `/tasks/42`，再执行刷新；只从首页点击进入不能证明服务器回退配置正确。

可交付的验证结果应包括：

- 测试命令与通过的测试数量；
- 构建命令、退出码和产物目录；
- 直接访问深层路由的结果；
- 关键接口与错误恢复结果；
- 当前版本标识和上一版本回退入口；
- 部署后的错误率与核心流程观察结果。

只有能够重复执行、看到明确结果并在失败时恢复，测试和构建流程才真正保护了 React 应用。
