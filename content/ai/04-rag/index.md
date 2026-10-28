---
title: "RAG 应用"
tags:
  - AI 应用开发
  - RAG
  - 向量检索
excerpt: "构建从文档处理、嵌入索引和检索排序，到证据回答、质量评测与知识库维护的完整 RAG 链路。"
date: 2026-09-28
prev: false
next: false
---

# RAG 应用

检索增强生成（Retrieval-Augmented Generation，RAG）在生成前检索外部资料，使回答能够使用可更新、可追溯的证据。有效的 RAG 不只需要向量检索，还要覆盖数据权限、引用、评测和知识更新。

::: info 正文状态
本页展示当前章节安排，内容按知识依赖、可靠资料和示例验证持续核对。未提供链接的标题尚未生成正文，通过内容与示例验收后才开放阅读。
:::

## 一、模块边界

| 项目 | 内容 |
|------|------|
| 主讲 | 知识处理、索引、检索、证据回答、评测和维护 |
| 前置 | [Prompt 与上下文](../03-prompt-context/index.md) |
| 不展开 | 向量数据库完整运维、通用数据平台和模型训练 |
| 学习结果 | 能构建可追溯、可评测、可增量维护的 RAG 应用 |

## 二、章节目录

### 1. 知识边界 {#01-knowledge-boundary}

判断 RAG 的适用条件，并确定数据来源和访问边界。

| 序号 | 文章 |
|-----:|------|
| 1.1 | [RAG 适用条件与链路](./01-knowledge-boundary/01-rag-fit-pipeline.md) |
| 1.2 | [数据来源与权限](./01-knowledge-boundary/02-data-sources-permissions.md) |

### 2. 文档处理 {#02-document-processing}

把原始资料转换为可追溯、可增量维护的知识片段。

| 序号 | 文章 |
|-----:|------|
| 2.1 | [解析与清洗](./02-document-processing/01-parsing-cleaning.md) |
| 2.2 | [切分与元数据](./02-document-processing/02-chunking-metadata.md) |
| 2.3 | [增量采集](./02-document-processing/03-incremental-ingestion.md) |

### 3. 嵌入与索引 {#03-embeddings-indexes}

理解向量表示和索引存储对检索效果与成本的影响。

| 序号 | 文章 |
|-----:|------|
| 3.1 | [嵌入与相似度](./03-embeddings-indexes/01-embeddings-similarity.md) |
| 3.2 | [向量索引与存储](./03-embeddings-indexes/02-vector-index-storage.md) |

### 4. 检索与排序 {#04-retrieval-ranking}

组合过滤、关键词、向量、重排和查询改写以改善证据召回。

| 序号 | 文章 |
|-----:|------|
| 4.1 | [向量检索与过滤](./04-retrieval-ranking/01-vector-search-filtering.md) |
| 4.2 | [关键词与混合检索](./04-retrieval-ranking/02-keyword-hybrid-search.md) |
| 4.3 | [重排与查询改写](./04-retrieval-ranking/03-reranking-query-rewriting.md) |

### 5. 证据回答 {#05-evidence-answers}

让回答基于可追踪证据，并正确处理证据不足或冲突。

| 序号 | 文章 |
|-----:|------|
| 5.1 | [证据组织与生成](./05-evidence-answers/01-evidence-grounded-generation.md) |
| 5.2 | 引用与来源追踪 |
| 5.3 | 证据不足与冲突 |

### 6. RAG 评测 {#06-rag-evaluation}

分别评测检索、回答和引用，定位质量损失所在环节。

| 序号 | 文章 |
|-----:|------|
| 6.1 | 检索评测 |
| 6.2 | 回答与引用评测 |
| 6.3 | 质量归因 |

### 7. 知识库维护 {#07-knowledge-maintenance}

管理增量更新、索引迁移、权限变化和内容撤回。

| 序号 | 文章 |
|-----:|------|
| 7.1 | 增量更新与索引迁移 |
| 7.2 | 权限变更与内容撤回 |

## 三、衔接关系

RAG 可以作为独立知识应用，也可以成为[Agent 开发](../05-agent-development/index.md)中的受控工具；通用评测方法在[评测与可观测性](../08-evaluation-observability/index.md)集中展开。
