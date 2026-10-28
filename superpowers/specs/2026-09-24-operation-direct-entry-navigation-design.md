---
title: "DevOps 专题首篇直达导航设计"
tags:
  - VitePress
  - DevOps
  - 导航
excerpt: "取消 DevOps 各专题的独立目录页，让顶部导航保留全部专题并直接进入对应第一章第一篇；未完成正文使用明确标注状态的占位页。"
date: 2026-09-24
---

# DevOps 专题首篇直达导航设计

DevOps 顶部导航当前统一进入各专题的 `index.md` 目录页，读者需要再次点击才能进入正文。专题目录已经通过顶部导航和侧栏表达学习结构，不再使用独立目录页作为中间入口；专题名称应直接打开第一章第一篇正文。

## 一、目标与范围

### 1. 调整目标

| 目标 | 验收结果 |
|------|----------|
| 取消专题目录页 | `content/operation/<专题>/index.md` 不再作为文档页面存在 |
| 首篇直达 | 点击顶部导航中的专题名称，直接打开该专题第一章第一篇正文 |
| 保留全部专题 | 14 个专题始终显示，完整正文未完成时由明确标注的占位页承接入口 |
| 保持目录结构 | 专题目录、章节目录和正文文件继续保留原有层级 |

### 2. 修改边界

本次调整适用于 `operationCatalog` 管理的 Linux、Bash 与 Shell、网络基础、Nginx、Docker、Kubernetes、CI/CD、Jenkins、监控与可观测性、SRE、运维安全、Ansible、Terraform 和平台工程。

以下内容不在本次范围内：

- 不删除 `content/operation/index.md`；
- 不创建占位页之外的其他未完成正文；
- 不使用其他章节的已发布文章代替第一章第一篇；
- 不迁移 `01-shell` 等其他历史目录；Linux 旧目录由后续治理任务退役；
- 不提交、推送或部署变更。

## 二、导航规则

### 1. 首篇路径

每个专题的入口由目录数据确定，路径组成如下：

```text
模块 path / 第一章 directory / 第一篇 file
```

Linux 的目标入口为：

```text
/operation/01-linux/01-system-foundation/01-linux-distribution.md
```

`/operation/01-linux/` 和 `/operation/01-linux/index.md` 不再承载目录页面。

### 2. 入口门禁

导航生成器只读取第一章第一篇的 `publishedLink`。14 个专题的首篇都必须登记该字段并对应真实文件，不回退到专题目录页、其他已发布文章或尚不存在的规划路径。

Linux 入口指向已经完成的正式正文；其余 13 个专题先指向首篇占位页。占位页必须明确显示“正文建设中”和“不作为正式学习材料”，后续在同一路径补充完整正文，无需再次调整导航。

::: warning 不生成临时死链接

目录规划中的文件名不能单独证明页面存在。每条首篇入口都必须同时具备 `publishedLink` 和对应文件，测试需验证两者一致，避免产生 404。

:::

## 三、配置职责

| 组件 | 调整后的职责 |
|------|--------------|
| `catalogs/operation.js` | 保存专题、章节、文章顺序及已发布正文链接，并从第一章第一篇生成专题导航 |
| `sidebar/topic-catalog.js` | 继续根据 `publishedLink` 生成章节侧栏，不承担专题入口回退 |
| `nav.js` | 继续消费 `operationNavigation`，不手写重复的专题链接 |
| `components/OperationCatalog.vue` | 根级 DevOps 总览复用首篇入口规则，全部专题均可直接进入首篇页面 |
| `content/operation/<专题>/` | 只保存章节目录和正文，不再保存专题 `index.md` |

导航规则保留在目录数据层，避免顶部导航、侧栏和正文路径分别维护后产生顺序或链接偏差。

## 四、文件调整

| 文件或范围 | 调整内容 |
|------------|----------|
| `.vitepress/themeConfig/catalogs/operation.js` | 将专题导航入口从 `index.md` 改为第一章第一篇的 `publishedLink`，保留全部 14 个专题 |
| `.vitepress/components/OperationCatalog.vue` | 根级模块卡片统一改用首篇页面链接 |
| `content/operation/index.md` | 更新目录开放说明，保留 DevOps 领域总览 |
| `content/operation/01-linux/index.md` 至 `content/operation/14-platform-engineering/index.md` | 删除新版 DevOps 专题目录页 |
| 13 个专题的第一章第一篇 | 创建明确标注“正文建设中”的占位页，保持导航路径稳定 |
| `scripts/docs/__tests__/topic-navigation.test.mjs` | 增加 14 个专题全部保留、首篇直达和禁止专题首页入口的断言 |
| 相关目录与导航测试 | 更新依赖专题 `index.md` 的既有断言 |

删除范围只包括 `operationCatalog` 对应的新版专题首页，不使用通配删除，也不删除专题内章节正文。

## 五、异常与兼容处理

| 场景 | 处理方式 |
|------|----------|
| 模块没有章节或章节没有文章 | 目录测试失败，阻止生成导航 |
| 第一章第一篇没有 `publishedLink` | 目录测试失败，避免专题从导航中静默消失 |
| `publishedLink` 指向不存在文件 | 由现有导航有效性检查抛错并阻止构建 |
| 其他章节已有正文但首篇未发布 | 不以其他文章替代首篇，保持学习入口稳定 |
| 历史专题首页 URL | 新版专题首页尚未进入已提交生产基线，不新增兼容跳转 |

## 六、验证方案

| 顺序 | 验证项 | 通过条件 |
|----:|--------|----------|
| 1 | 文件检查 | 新版 14 个专题目录均不存在 `index.md`，章节正文保持不变 |
| 2 | 导航数据测试 | 14 个专题全部指向各自第一章第一篇，链接与真实文件一致 |
| 3 | 无效入口检查 | `operationNavigation` 不包含任何 `/operation/<专题>/index.md` |
| 4 | 自动化测试 | `pnpm docs:test` 全部通过 |
| 5 | 运维单元构建 | `pnpm docs:build:unit operation` 通过且无死链接 |
| 6 | 浏览器检查 | 点击任一 DevOps 专题都进入对应首篇；未完成专题显示“正文建设中” |

## 七、实施顺序

| 顺序 | 操作 |
|----:|------|
| 1 | 创建 13 个首篇占位页并登记 `publishedLink` |
| 2 | 补充全部专题首篇直达导航测试，固定已确认行为 |
| 3 | 修改 `operationNavigation` 生成逻辑 |
| 4 | 定点删除新版 DevOps 专题的 `index.md` |
| 5 | 更新受影响测试与引用 |
| 6 | 执行单元测试、运维构建和浏览器验证 |
