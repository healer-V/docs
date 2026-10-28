---
title: "模型接入第 1 章交付记录"
tags:
  - AI 应用开发
  - 模型接入
  - 交付验证
excerpt: "记录请求与响应三篇正文的知识覆盖、在线调用、兼容性差异、文档门禁、导航开放和页面验证结果。"
date: 2026-09-28
---

# 模型接入第 1 章交付记录

“请求与响应”三篇正文已按确认样板生成并开放导航。本章完成 `MI-001`～`MI-006`，建立输入对象、请求选项、响应状态、输出项和 Token 用量的基础契约。

## 一、交付范围

| 顺序 | 文章 | 负责知识项 | 状态 |
|-----:|------|------------|------|
| 1 | [输入项与内容类型](../../content/ai/02-model-integration/01-request-response/01-input-items-content-types.md) | `MI-001`、`MI-002` | 已生成、验证并开放导航 |
| 2 | [请求选项与兼容性](../../content/ai/02-model-integration/01-request-response/02-request-options-compatibility.md) | `MI-003`、`MI-004` | 已生成、验证并开放导航 |
| 3 | [响应对象与用量](../../content/ai/02-model-integration/01-request-response/03-response-object-usage.md) | `MI-005`、`MI-006` | 已生成、验证并开放导航 |

临时模块首页已经删除，AI 顶部导航和模块侧栏均直接进入“输入项与内容类型”。其他模块指向旧首页的前置链接已迁移到正式正文。

## 二、接口证据

### 1. 输入对象

Python 3.12.14、OpenAI Python SDK 3.19.2 和 `gpt-6-luna` 下，字符串、消息项和多文本部件三种请求均返回 `completed`，输出项类型均为 `message`。

把 `output_text` 用作输入内容部件时，当前端点返回 `400 invalid_value`，错误参数定位到 `input[0].content[0]`。该错误不具备原样重试资格。

### 2. 请求选项

包含 `model`、`instructions`、`input`、`max_output_tokens`、`store` 和 `metadata` 的保守请求返回 `completed`。

Chat Completions 的 `n` 参数在 SDK 参数检查阶段返回 `TypeError`，证明迁移不能只替换调用端点。

### 3. 兼容性差异

当前兼容端点接受 `max_output_tokens=16`，但实际仍返回 `429` 个输出 Token 和 `completed`。正文将该结果明确标记为端点语义差异，没有写成官方 API 的通用行为。

未完成响应分支使用 SDK 3.19.2 的类型化固定响应验证，状态为 `incomplete`、原因为 `max_output_tokens`；正文明确说明这不是当前端点的在线成功证据。

### 4. 响应对象

正常在线响应包含 `reasoning` 和 `message` 两类输出项，用量为：

| 用量字段 | 实际值 |
|----------|-------:|
| `input_tokens` | 60 |
| `cached_tokens` | 0 |
| `output_tokens` | 404 |
| `reasoning_tokens` | 65 |
| `total_tokens` | 464 |

分项满足 `input_tokens + output_tokens = total_tokens`；`reasoning_tokens` 是输出明细，不重复计入总量。

## 三、内容门禁

| 检查项 | 结果 |
|--------|------|
| Frontmatter 与 H1 | 三篇一致，每篇仅一个 H1 |
| 标题层级 | H2 中文数字连续，H3 在每个 H2 内重新编号 |
| 标题表达 | 使用“输入对象”“兼容性证据”“判断顺序”等技术短语 |
| 课程式话术 | 未发现“上一篇”“下一篇”“学习目标”“本文将” |
| 小节完整性 | 每个小节包含机制、表格、示例、边界或判断依据 |
| 长代码折叠 | 超过 10 行的代码块全部位于具体标题的 `details` 中 |
| 示例独立性 | 三个示例均从空目录开始，依赖、环境、入口和结果完整 |
| 运行结果 | 只记录真实在线结果或明确标识的固定响应测试 |

## 四、工程验证

| 顺序 | 检查 | 结果 |
|-----:|------|------|
| 1 | 三个验证脚本 `py_compile` | 通过 |
| 2 | 请求选项应用边界测试 | `self_test=passed cases=2` |
| 3 | `pnpm docs:test` | 42 项全部通过 |
| 4 | `pnpm docs:build:unit ai` | 通过；24 页、90 个产物文件 |
| 5 | 桌面页面检查 | 1280×720 无横向溢出，大纲与侧栏链接正确 |
| 6 | 移动页面检查 | 390×844 三篇均无横向溢出，标题完整 |
| 7 | 折叠状态 | 5 个长代码或长结果区块默认关闭 |

## 五、状态更新

| 项目 | 结论 |
|------|------|
| AI02 样板确认 | 已确认，允许按章节继续生成 |
| AI02 第 1 章 | 已完成 |
| AI02 剩余正文 | 11 篇，继续按“一次一章”执行 |
| AI03 内容样式 | 已确认 |
| AI03 技术门禁 | 未通过；`previous_response_id` 与 `conversation` 仍受当前环境阻断 |

本记录不授权提交、推送、发布或部署。后续章节仍需独立完成运行证据、内容检查、导航同步和页面验证。
