---
title: "createRoot 与 hydrateRoot"
category: "前端 · React 18"
tags:
  - React
  - TypeScript
excerpt: "迁移客户端渲染和服务端 Hydration 入口，理解根 API 对新行为的影响。"
date: 2026-07-13
---

# createRoot 与 hydrateRoot

## 一、学习目标

迁移客户端渲染和服务端 Hydration 入口，理解根 API 对新行为的影响。

完成本节后，应当能够判断这一能力的适用边界，并在 TypeScript 项目中解释相关代码为什么正确。

## 二、核心知识

| 序号 | 必须掌握的结论 |
|------|----------------|
| 1 | createRoot 用于客户端挂载，hydrateRoot 用于复用服务端生成的 HTML。 |
| 2 | 根容器不存在时应立即失败，不能用非空断言掩盖真实配置错误。 |
| 3 | ReactDOM.render 的回调和返回值不能原样迁移，需要重新设计调用点。 |
| 4 | 多个根彼此独立，共享状态时需要外部存储或上层协议。 |

## 三、理解与应用

学习本节时，应把知识放回“输入、渲染、提交、用户交互”这条主线中理解。先确认数据由谁拥有，再判断组件在渲染阶段读取什么、在事件阶段修改什么，以及是否需要在提交后与外部系统同步。

::: tip 学习方法
不要只记忆 API 形式。请尝试画出数据来源、组件边界和更新触发点，再说明 React 为什么需要当前约束。
:::

## 四、TypeScript 示例

客户端入口应显式验证宿主容器，避免用非空断言隐藏 HTML 配置错误：

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('缺少应用挂载容器 #root');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

## 五、实践任务

1. 在独立分支或练习目录中创建一个最小示例，只验证“createRoot 与 hydrateRoot”这一项能力。
2. 为示例补充正常路径、空值或空列表、重复操作三个场景。
3. 开启 TypeScript 严格检查，消除非必要的类型断言和非空断言。
4. 使用 React Developer Tools 观察组件输入、状态和渲染变化。

## 六、验收标准

- [ ] 能用自己的语言说明：createRoot 用于客户端挂载，hydrateRoot 用于复用服务端生成的 HTML。
- [ ] 能用自己的语言说明：根容器不存在时应立即失败，不能用非空断言掩盖真实配置错误。
- [ ] 能用自己的语言说明：ReactDOM.render 的回调和返回值不能原样迁移，需要重新设计调用点。
- [ ] 能用自己的语言说明：多个根彼此独立，共享状态时需要外部存储或上层协议。
- [ ] 示例在刷新、重复交互和边界输入下行为一致。
- [ ] 能指出至少一个不适合使用本节能力的场景。
