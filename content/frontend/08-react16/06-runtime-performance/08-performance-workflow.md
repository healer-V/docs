---
title: "性能检查与组件优化"
tags:
  - React
  - Profiler
  - 性能优化
excerpt: "提供从确定交互基线、记录 Profiler、定位渲染原因、选择优化手段到复测收益的 React 16.8 性能分析流程。"
date: 2026-07-31
---

# 性能检查与组件优化

## 一、定义性能问题

性能优化从具体用户交互开始，而不是从“减少所有渲染”开始。

有效问题描述应包含：

| 信息 | 示例 |
|------|------|
| 操作 | 在 1000 条任务中输入筛选词 |
| 环境 | Chrome、4 倍 CPU 降速 |
| 指标 | 输入到列表更新超过 200ms |
| 数据规模 | 1000 条任务、每条 6 个字段 |
| 基线 | 优化前中位数 240ms |

“组件渲染了很多次”只是线索。渲染很轻时，多次执行不一定造成用户可感知问题。

## 二、React DevTools Profiler

### 1. 记录交互

Profiler 的基本操作：

1. 打开 React DevTools 的 Profiler；
2. 开始记录；
3. 只执行一次目标交互；
4. 停止记录；
5. 选择对应 Commit；
6. 查看 Flamegraph 或 Ranked 视图；
7. 检查耗时组件和渲染原因。

一次记录中混入多个无关操作，会难以判断哪次提交对应目标问题。

### 2. 主要指标

| 指标 | 含义 |
|------|------|
| Commit | 一次已经提交的 React 更新 |
| Actual duration | 当前更新实际渲染子树所用时间 |
| Base duration | 不使用记忆化时估算的完整子树成本 |
| Render count | 组件在记录中的渲染次数 |
| Why did this render | Props、State、Context 等变化原因，取决于 DevTools 支持 |

Actual duration 较高的组件是候选热点，但还要确认它是否位于用户卡顿的那次 Commit。

## 三、Profiler API

### 1. React.Profiler

React 16.8 可以在组件树中使用 `<React.Profiler>` 收集渲染测量：

```jsx
<React.Profiler id="TaskList" onRender={handleProfilerRender}>
  <TaskList tasks={tasks} />
</React.Profiler>
```

`onRender` 在被测子树提交时调用：

```jsx
/**
 * 记录任务列表渲染指标。
 * @param {string} id Profiler 标识。
 * @param {"mount" | "update"} phase 挂载或更新阶段。
 * @param {number} actualDuration 本次实际渲染耗时。
 * @param {number} baseDuration 最近一次估算的完整渲染成本。
 * @param {number} startTime React 开始本次渲染的时间。
 * @param {number} commitTime React 提交本次更新的时间。
 * @param {Set<any>} interactions 与本次更新关联的交互集合。
 * @returns {void}
 */
function handleProfilerRender(
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
  interactions
) {
  console.table({
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactionCount: interactions.size
  });
}
```

Profiler 本身有测量开销，不应无条件把详细日志发送到生产控制台。生产分析需要使用 React 提供的 profiling 构建，并控制采样和数据量。

## 四、定位渲染原因

### 1. State 位置

输入框 State 放在页面顶层时，每次按键会让整个页面参与渲染：

```text
TaskPage（保存 query）
├─ Header
├─ HeavyDashboard
├─ TaskSearch
└─ TaskList
```

如果只有搜索区域和列表需要 `query`，可以把 State 下沉到它们的最近共同父级：

```text
TaskPage
├─ Header
├─ HeavyDashboard
└─ SearchableTaskList（保存 query）
   ├─ TaskSearch
   └─ TaskList
```

状态位置优化通常比大面积添加 `memo` 更稳定。

### 2. Props 引用

检查记忆化子组件收到的对象、数组、函数和 JSX 是否每次创建新引用。只有这些引用变化确实导致昂贵渲染时，再稳定它们。

可以把静态对象移到组件外，或使用 `useMemo`、`useCallback` 保持必要引用。若子组件没有记忆化，单独稳定 Props 通常不会阻止它重新渲染。

### 3. Context

大型 Context value 任一字段变化，读取该 Context 的消费者都会获得新值。可以按变化频率拆分 Context，或缩小 Provider 范围。

拆分前应先在 Profiler 中确认哪些消费者被无关字段带动。Context 本身不是性能问题，过宽的 value 和订阅范围才是需要处理的部分。

### 4. Key 和组件类型

随机 Key、索引 Key 或组件内部定义类型会导致卸载与挂载，而不只是普通重新渲染。Profiler 中反复出现 mount 时应优先检查身份。

卸载会丢失局部 State、DOM 焦点和已有订阅，再挂载还会重新执行初始化。修复身份通常比给组件添加 Memo 更直接。

## 五、优化手段

### 1. 减少参与更新的范围

- 状态下沉到最小共同所有者；
- 把频繁变化区域与稳定区域拆成组件；
- 用 `children` 让包装组件更新时复用不依赖其 State 的子树；
- 拆分变化频率不同的 Context；
- 避免把瞬时输入放入全局状态。

### 2. 降低单次渲染成本

- 避免重复昂贵计算；
- 对大型派生数据使用 `useMemo`；
- 把不依赖渲染的数据移出组件；
- 使用索引表避免重复线性查找；
- 避免在 render 中深拷贝大对象。

### 3. 跳过相同输入渲染

- 对已确认昂贵且 Props 稳定的组件使用 `React.memo`；
- 用 `useCallback` 稳定影响 memo 子组件的回调；
- 用 `useMemo` 稳定影响 memo 子组件的对象或数组；
- 自定义比较前先估算比较成本。

### 4. 控制数据规模

渲染数千行时，记忆化不能消除初次创建 DOM 的成本。应考虑：

- 分页；
- 窗口化或虚拟列表；
- 折叠不可见区域；
- 服务端筛选和聚合；
- 限制一次加载的数据量。

### 5. 浏览器与网络

React Profiler 不解释所有问题。还要检查：

- DOM 节点数量；
- 强制同步布局；
- 复杂 CSS 和阴影；
- 大图片和字体；
- JavaScript 包体积；
- 网络瀑布和缓存；
- 第三方脚本。

## 六、复测

优化后使用相同环境、数据和操作重新记录：

| 对比项 | 优化前 | 优化后 |
|--------|--------|--------|
| 目标交互耗时 | 240ms | 90ms |
| 目标 Commit actual duration | 180ms | 45ms |
| TaskRow 参与渲染数量 | 1000 | 20 |
| DOM 节点数量 | 6000 | 240 |

同时验证：

- 页面结果一致；
- 输入、焦点和滚动正常；
- 空状态和错误状态正常；
- 记忆化没有保留旧 Props；
- 内存没有持续增长；
- 慢设备上的收益仍成立。

## 七、优化顺序

```text
明确卡顿交互
→ 建立可重复基线
→ Profiler 找到慢 Commit
→ 确认渲染原因
→ 选择最小优化
→ 复测耗时和行为
→ 记录结论
```

| 反模式 | 问题 |
|--------|------|
| 所有组件默认 `React.memo` | 比较和维护成本增加 |
| 所有函数默认 `useCallback` | 依赖复杂，未必减少工作 |
| 只看渲染次数 | 忽略每次成本和 DOM 提交 |
| 在开发模式比较绝对耗时 | 开发检查和警告增加开销 |
| 优化后不复测 | 无法证明收益 |
| 用错误 Key 减少警告 | 导致挂载、状态和焦点问题 |

性能优化的交付结果应是一组可重复证据，而不是“感觉更快”或“组件不再渲染”。
