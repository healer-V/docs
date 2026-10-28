---
title: "HTML 目录设计"
tags:
  - HTML
  - 文档目录
excerpt: "按基础写法、文本与页面结构、链接与多媒体、表格与表单、头部与资源、原生交互及可访问性组织 HTML 知识文档，列出各章文章、内容范围和文件位置。"
date: 2026-09-29
---

# HTML 目录设计

HTML 部分按照知识学习的自然顺序组织：先认识文档、元素和属性，再学习常用内容与表单，随后展开资源加载和原生交互，最后整理可访问性与常见问题。

正文目录为 `content/frontend/01-html/`。每章一个文件夹，章内文章从 `01` 开始编号。以下是拟采用的目录，共 **7 章、33 篇**。

## 一、HTML 基础

建立 HTML 的基本概念，能够独立创建文档、理解元素写法，并正确引用资源。目录：`01-foundation/`。

| 编号 | 文档 | 主要内容 | 文件 |
|------|------|----------|------|
| 1.1 | HTML 概述 | HTML 的用途，标记语言与超文本，HTML、CSS、JavaScript 的分工，浏览器如何理解文档 | `01-overview.md` |
| 1.2 | HTML 文档结构 | 第一个 HTML 文件，DOCTYPE，html、head、body，语言与编码声明，页面标题与标准模式 | `02-document-structure.md` |
| 1.3 | HTML 元素与标签 | 元素与标签的区别，开始和结束标签，空元素，注释，内容模型，嵌套规则与浏览器解析 | `03-elements-tags.md` |
| 1.4 | HTML 属性 | 属性写法，布尔与枚举属性，id、class、data-*，lang、dir、hidden、inert、tabindex、contenteditable | `04-attributes.md` |
| 1.5 | 字符编码与字符引用 | UTF-8，文件编码与声明，特殊字符，命名和数字字符引用，空白处理与乱码 | `05-encoding-characters.md` |
| 1.6 | URL 与资源路径 | 绝对与相对路径，根路径，片段标识，base，同源的基本概念，文件与 HTTP 访问的差别 | `06-urls-paths.md` |

## 二、文本与页面结构

学习如何根据内容含义组织文字和页面区域。元素的用途、正确结构及常见误用放在对应文章中说明。目录：`02-text-structure/`。

| 编号 | 文档 | 主要内容 | 文件 |
|------|------|----------|------|
| 2.1 | 标题与段落 | h1—h6，标题层级，p、br、hr，段落与换行，标题和字号的区别 | `01-headings-paragraphs.md` |
| 2.2 | 文本语义与引用 | em、strong、b、i、mark、small，blockquote、q、cite，code、pre、abbr、time，双向文本 | `02-text-semantics.md` |
| 2.3 | 列表 | ul、ol、li，dl、dt、dd，嵌套列表，顺序和起始编号，列表类型的选择 | `03-lists.md` |
| 2.4 | 语义化页面结构 | header、footer、main、nav、aside、article、section，div 与 span，页面区域和分节的选择 | `04-semantic-structure.md` |

## 三、链接与多媒体

学习页面导航、图像、音视频和外部文档的声明方式，解释资源、替代内容与浏览器行为。目录：`03-links-media/`。

| 编号 | 文档 | 主要内容 | 文件 |
|------|------|----------|------|
| 3.1 | 超链接 | a、href，页内跳转，target、rel、download，链接文字，键盘导航，链接与按钮的区别 | `01-links.md` |
| 3.2 | 图像与替代文本 | img、src、alt，width、height，figure、figcaption，loading、decoding，装饰图与信息图，图片加载失败 | `02-images.md` |
| 3.3 | 响应式图片 | srcset、sizes，像素密度和宽度描述符，picture、source，格式回退、不同裁切与候选选择 | `03-responsive-images.md` |
| 3.4 | 音频、视频与字幕 | audio、video，原生控制，source，多种来源，播放和预加载属性，track、WebVTT，播放限制与失败处理 | `04-audio-video.md` |
| 3.5 | iframe 嵌入页面 | iframe、src、srcdoc，独立文档，title、loading，sandbox、allow、referrerpolicy，同源与嵌入限制 | `05-iframe.md` |

## 四、表格与表单

先学习二维数据的表达，再学习输入控件、校验与提交。表单内容按照“结构 → 控件 → 校验 → 提交”的顺序展开。目录：`04-tables-forms/`。

| 编号 | 文档 | 主要内容 | 文件 |
|------|------|----------|------|
| 4.1 | 数据表格 | table、caption，thead、tbody、tfoot，tr、th、td，rowspan、colspan，scope、headers 与表头关联 | `01-tables.md` |
| 4.2 | 表单基础 | form，label、fieldset、legend，button，name 与 id，控件归属，默认值与当前值，重置、disabled 与 readonly | `02-form-basics.md` |
| 4.3 | input 输入控件 | 常用输入类型，文本、密码、邮箱、电话、数字、日期、范围和颜色，值格式，autocomplete、inputmode 与输入提示 | `03-input.md` |
| 4.4 | 选择控件与文本域 | checkbox、radio，select、option、optgroup，textarea、datalist，output、progress、meter，选择与状态表达 | `04-selection-textarea.md` |
| 4.5 | 表单校验 | required、pattern，长度、范围与步长约束，原生校验时机，ValidityState，校验 API，自定义错误与服务端校验边界 | `05-validation.md` |
| 4.6 | 表单提交与数据编码 | action、method、enctype，GET 与 POST，字段参与条件，提交按钮，URL 与请求体，编码和请求观察 | `06-submission.md` |
| 4.7 | 文件选择与上传 | file，accept、multiple，文件选择与取消，multipart/form-data，文件字段，上传结果与校验边界 | `07-file-upload.md` |

## 五、文档头部与资源加载

集中讲解页面元数据和外部资源声明。文档结构中的最小 head 写法在基础章解释，具体属性与加载行为在这里展开。目录：`05-head-resources/`。

| 编号 | 文档 | 主要内容 | 文件 |
|------|------|----------|------|
| 5.1 | head 与元数据 | title、meta，description、viewport，页面语言，图标，canonical 与 robots 的基本用途和边界 | `01-head-metadata.md` |
| 5.2 | 样式表与资源声明 | link、style，rel、media，外部与内嵌样式，preload、modulepreload、preconnect，加载提示与实际请求 | `02-styles-resources.md` |
| 5.3 | script 与脚本加载 | 内联与外部脚本，普通脚本、async、defer、type="module"，加载和执行顺序，noscript 与脚本禁用 | `03-script-loading.md` |

## 六、原生交互与扩展元素

学习浏览器提供的交互元素，再认识模板和图形元素。需要 JavaScript 的部分就地解释必要操作。目录：`06-interaction-extensions/`。

| 编号 | 文档 | 主要内容 | 文件 |
|------|------|----------|------|
| 6.1 | details 与 summary | 原生折叠，summary，open，键盘操作，toggle，name 分组及适用场景 | `01-details-summary.md` |
| 6.2 | dialog 对话框 | 模态与非模态，show、showModal，close，表单关闭，Escape，焦点与返回值 | `02-dialog.md` |
| 6.3 | popover 弹出层 | popover，popovertarget，开合动作，auto 与 manual，轻关闭，与对话框的区别 | `03-popover.md` |
| 6.4 | template 与 Web Components 基础 | template 的惰性内容与实例化，自定义元素，Shadow DOM，slot，各部分如何配合 | `04-template-components.md` |
| 6.5 | SVG 与 Canvas 基础 | 内联 SVG 与外部图像，Canvas 元素与最小绘图，位图尺寸与显示尺寸，替代内容，两种图形的基本差别 | `05-svg-canvas.md` |

## 七、可访问性与排错

结合已经学习的元素与规则，检查实际页面并修复常见问题。目录：`07-accessibility-debugging/`。

| 编号 | 文档 | 主要内容 | 文件 |
|------|------|----------|------|
| 7.1 | HTML 可访问性 | 原生语义，可访问名称、角色与状态，标签与替代文本，键盘操作，ARIA 的用途与边界，开发者工具检查 | `01-accessibility.md` |
| 7.2 | HTML 校验与结构问题 | HTML 检查器，源码与 DOM 对照，嵌套错误，重复 ID，缺失属性，废弃写法的替换与修复复测 | `02-validation-debugging.md` |
| 7.3 | 资源加载问题 | 路径错误、404、响应类型、加载条件、脚本执行失败，Network 与 Console 取证，修复与验证 | `03-resource-debugging.md` |

## 八、正文编写与目录调整

### 1. 正文写法

1. **先解释概念，再说明规则，最后举例。** 开头直接介绍当前知识，例子使用最小且有实际含义的内容。
2. **用编号体现层次。** 多个规则分项说明，操作按执行顺序排列，标题围绕具体技术主题组织。
3. **用 VitePress 容器突出重点。** 前提、关键结论、常见误区分别放在合适的 info、tip、warning 中，正文保留原因和机制的解释。
4. **代码与说明相邻。** 超过 10 行的完整代码使用具名 details 折叠，必要条件、关键解释和预期结果在外可读。
5. **按知识范围安排示例。** 表单、资源加载和排错提供可独立复现的示例；概念文章使用简短对照或反例。
6. **避免重复讲解。** 语义化集中在页面结构，完整表单提交集中在提交文章，综合排错引用已经解释的基础规则。

### 2. 实施范围

| 项目 | 处理方式 |
|------|----------|
| 现有 12 篇旧文 | 保留原文件与资源，按本目录重新编写新正文 |
| 新目录与正文 | 使用上面的 7 个章节文件夹，每章从 `01` 编号 |
| 侧栏 | 按章节和文章编号展示，链接接入已经生成并检查通过的文件 |
| 顶部和首页入口 | 首篇完成后同步指向新的 HTML 概述 |
| 站内引用 | 同步当前引用，尤其是 CSS 蓝图中的 HTML 元素与属性入口 |
| 写作参考 | 沿用[已确认的 CSS 样板](../../content/frontend/02-css/02-style-computation/06-property-value-processing.md)的阅读组织方式 |
| 标准基线 | 使用 [WHATWG HTML Living Standard](https://html.spec.whatwg.org/multipage/)，具体规则在正文相邻位置附必要来源 |

本次修订的是目录设计，目标章节正文与站点导航尚未变更。
