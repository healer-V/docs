---
title: "useTransition"
category: "前端 · React 18"
tags:
  - React
  - TypeScript
excerpt: "在组件内标记低优先级更新，并使用 isPending 提供克制的等待反馈。"
date: 2026-07-13
---

# useTransition

## 一、学习目标

在组件内标记低优先级更新，并使用 isPending 提供克制的等待反馈。

完成本节后，应当能够判断这一能力的适用边界，并在 TypeScript 项目中解释相关代码为什么正确。

## 二、核心知识

| 序号 | 必须掌握的结论 |
|------|----------------|
| 1 | useTransition 返回 pending 状态和启动 Transition 的函数。 |
| 2 | startTransition 回调中的同步状态更新会被标记为 Transition。 |
| 3 | pending 反馈应保持布局稳定，避免用全屏遮罩阻断紧急交互。 |
| 4 | 只有真实渲染压力存在时才使用，不能替代组件拆分和数据结构优化。 |

## 三、理解与应用

学习本节时，应把知识放回“输入、渲染、提交、用户交互”这条主线中理解。先确认数据由谁拥有，再判断组件在渲染阶段读取什么、在事件阶段修改什么，以及是否需要在提交后与外部系统同步。

::: tip 学习方法
不要只记忆 API 形式。请尝试画出数据来源、组件边界和更新触发点，再说明 React 为什么需要当前约束。
:::

## 四、TypeScript 示例

输入值保持紧急更新，昂贵结果使用 Transition 更新：

```tsx
// src/components/ProductSearch.tsx
import { ChangeEvent, useState, useTransition } from 'react';

/** 将输入反馈与耗时搜索结果拆分为不同优先级。 */
export function ProductSearch() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  /**
   * 立即同步输入框，再以 Transition 更新结果查询词。
   * @param event 输入框变更事件，`currentTarget.value` 为最新文本。
   * @returns 无返回值；副作用是更新本地组件状态。
   */
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextValue = event.currentTarget.value;
    setInput(nextValue);
    startTransition(() => setQuery(nextValue));
  };

  return (
    <section aria-busy={isPending}>
      <input value={input} onChange={handleChange} />
      <p>当前查询：{query}</p>
    </section>
  );
}
```

## 五、实践任务

1. 在独立分支或练习目录中创建一个最小示例，只验证“useTransition”这一项能力。
2. 为示例补充正常路径、空值或空列表、重复操作三个场景。
3. 开启 TypeScript 严格检查，消除非必要的类型断言和非空断言。
4. 使用 React Developer Tools 观察组件输入、状态和渲染变化。

## 六、验收标准

- [ ] 能用自己的语言说明：useTransition 返回 pending 状态和启动 Transition 的函数。
- [ ] 能用自己的语言说明：startTransition 回调中的同步状态更新会被标记为 Transition。
- [ ] 能用自己的语言说明：pending 反馈应保持布局稳定，避免用全屏遮罩阻断紧急交互。
- [ ] 能用自己的语言说明：只有真实渲染压力存在时才使用，不能替代组件拆分和数据结构优化。
- [ ] 示例在刷新、重复交互和边界输入下行为一致。
- [ ] 能指出至少一个不适合使用本节能力的场景。
