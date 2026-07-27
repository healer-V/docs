---
title: "Java 平台体系章节重设计"
tags:
  - Java
  - 文档设计
excerpt: "重新设计 Java 概述中的平台体系内容，通过一张关系图和一张对比表区分 Java SE、Jakarta EE、Spring Boot 与 Java ME，并明确当前学习边界。"
date: 2026-07-27
---

# Java 平台体系章节重设计

## 一、设计目标

本次修改只重构 `docs/backend/04-java/01-language-foundation/01-overview.md` 的第三章，不调整其他章节、sidebar 或文档路径。重构后的内容应让初学者快速理解基础平台、企业规范和应用框架的区别，并得出当前阶段应优先学习 Java SE 的结论。

## 二、现有问题

现有第三章分别使用独立小节介绍 Java SE、Jakarta EE 和 Java ME，但缺少它们之间的层级关系，也没有清晰区分规范与框架。读者容易把 Jakarta EE 和 Spring Boot 理解为同类技术，或者误认为 Jakarta EE 是对 Java EE 的错误写法。

此外，三个小节都只有简短定义，随后又用表格重复相同信息，内容结构较为松散，不符合概述文章应先建立整体模型再解释学习边界的目标。

## 三、内容结构

第三章标题调整为“Java 平台与开发体系”，正文只保留以下四个部分：

1. 一段引导语，说明基础平台、企业规范和应用框架属于不同层次；
2. 一张文本关系图，展示 Java SE、Jakarta EE、Spring Boot 与 Java ME 的关系；
3. 一张对比表，说明各概念的类型、作用和当前学习要求；
4. 一段学习结论，明确当前先学习 Java SE，其他内容按后续模块和实际场景学习。

不展开 J2EE、Java EE 和 Jakarta EE 的历史时间线，只在首次出现时使用“Jakarta EE（原 Java EE）”消除名称歧义。

## 四、关系模型

关系图采用以下模型：

```text
Java 平台
├── Java SE：语言、JVM 规范与核心 API
│   ├── 普通 Java 应用
│   ├── Spring Boot：Java 应用开发框架
│   │   └── 使用部分 Jakarta EE 规范
│   └── Jakarta EE（原 Java EE）：企业应用规范集合
└── Java ME：面向资源受限设备的平台
```

该图只表达学习所需的概念依赖，不把 Spring Boot 归入 Jakarta EE，也不把 Java ME 纳入当前后端学习路线。

## 五、对比维度

对比表固定使用以下列，避免继续堆叠概念定义：

| 名称 | 类型 | 主要作用 | 当前学习要求 |
|------|------|----------|--------------|
| Java SE | 基础平台 | 提供 Java 语言、JVM 规范和集合、I/O、并发等核心 API | Java 核心教程的主要内容 |
| Jakarta EE（原 Java EE） | 企业应用规范集合 | 定义 Servlet、Validation、Persistence 等标准接口和行为 | 记住名称及其与 Java SE 的关系 |
| Spring Boot | 应用开发框架 | 简化 Java 后端应用的创建、配置和运行，并使用部分 Jakarta EE API | 在独立的 Spring Boot 模块学习 |
| Java ME | 受限设备平台 | 面向资源和硬件能力受限的设备 | 当前路线不展开 |

## 六、验收标准

- 第三章只包含一张关系图和一张对比表；
- 不新增 Java 平台历史时间线；
- 首次出现时写作“Jakarta EE（原 Java EE）”；
- 明确 Java SE 是当前 Java 核心教程的学习重点；
- 明确 Spring Boot 是框架，不等同于 Jakarta EE；
- 不修改目标文件第三章之外的内容；
- Markdown 标题、代码块和表格语法可以通过 VitePress 构建。
