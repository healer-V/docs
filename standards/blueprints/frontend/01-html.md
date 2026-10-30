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

## 八、样板文章职责

第 1 章前两篇作为 HTML 模块样板。1.2 是正式样板：它同时包含从空目录创建页面、浏览器观察、检查器验证和多种失败分支，能校准后续文章的证据密度；1.1 是概念文章样板，校准“用可观察行为解释概念”的写法。其余文章在对应章节动笔前补充职责卡。

两篇共同约定：示例在读者新建的空目录中完成，直接用浏览器打开 HTML 文件；控制台结果在 Chromium 151 实测，检查器结果来自 W3C Nu HTML Checker 在线服务；文中不使用“关键词：一句断言”式清单、收益口号和版本年表，判定规则见[正文组织与表达规范](../../writing/content-organization.md)“信息密度与空话判定”。

### 1. A01-01 HTML 概述

| 字段 | 内容 |
|------|------|
| 文件 | `content/frontend/01-html/01-foundation/01-overview.md` |
| 唯一问题 | HTML 在网页中负责什么，浏览器怎样根据 HTML 得到页面？ |
| 类型与深度 | 基础概念；认识 |
| 必须覆盖 | 标记的含义与超文本链接；HTML、CSS、JavaScript 的职责边界；元素语义带来的默认行为（标题层级、按钮可聚焦与键盘触发、链接）；源码解析为 DOM；容错解析与检查器；WHATWG Living Standard 与“HTML5”一词的边界 |
| 不覆盖与重复边界 | 文档骨架交 A01-02；标签语法、空元素与嵌套规则交 A01-03；ARIA 与可访问名称交 A07-01；完整排错流程交 A07-02；CSS 呈现机制只链接 CSS 模块 |
| 证据与触发 | 未标记文字的显示结果；`h1`、加粗 `div`、`button`、`div`、`a` 的无障碍树与 Tab 顺序对照；缺少 `</strong>` 的解析结果与检查器输出 |
| 结果与失败边界 | 读者能判断一个需求属于 HTML、CSS 还是 JavaScript；反例说明 `div` 模拟按钮无法用键盘操作、页面能显示不代表标记正确 |
| 来源与核验 | WHATWG HTML、W3C/WHATWG 2019 谅解备忘录；已在 Chromium 151 与 Nu 检查器实测 |

### 2. A01-02 HTML 文档结构

| 字段 | 内容 |
|------|------|
| 文件 | `content/frontend/01-html/01-foundation/02-document-structure.md` |
| 唯一问题 | 一个合格的 HTML 文件由哪些部分组成，每部分缺失或写错时浏览器会怎样？ |
| 类型与深度 | 接入教程，辅以测试与排障；使用 |
| 必须覆盖 | 新建 `.html` 文件并以 UTF-8 保存；DOCTYPE 与标准模式、怪异模式；`html` 与 `lang`；`head` 与 `body` 的分界；`meta charset` 与文件编码一致；`title`；viewport 的最小作用；可省略标签；用检查器验证 |
| 不覆盖与重复边界 | 字符引用和完整编码判定交 A01-05；viewport 取值、description 等元数据交 A05-01；`link`、`script` 交 A05-02、A05-03；元素嵌套规则交 A01-03 |
| 证据与触发 | 空目录 `html-start` 中的 `index.html`、`mode.html`；控制台读取 `document.compatMode`、`document.characterSet`、`document.title`；设备模拟读取视口宽度；Nu 检查器在线校验 |
| 结果与失败边界 | 正确页面得到 `CSS1Compat`、`UTF-8`、非空标题且检查通过；失败分支覆盖缺少 DOCTYPE、文件以 GBK 保存、缺少 title、正文写进 head、扩展名为 `.txt` |
| 来源与核验 | WHATWG HTML 语法、元数据与解析章节；已在 Chromium 151 与 Nu 检查器实测 |

## 九、正文编写与目录调整

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
| 写作参考 | 沿用[已确认的 CSS 样板](../../../content/frontend/02-css/02-style-computation/06-property-value-processing.md)的阅读组织方式；以第八节两篇 HTML 样板校准证据密度 |
| 标准基线 | 使用 [WHATWG HTML Living Standard](https://html.spec.whatwg.org/multipage/)，具体规则在正文相邻位置附必要来源 |

第 1 章已按第八节完成 1.1、1.2 两篇样板。sidebar 已按本目录列出 7 章 33 篇，只链接这两篇，其余保留无链接标题；顶部与首页入口已指向新的 HTML 概述。其余章节在样板确认后逐章编写，旧稿在用户授权后归档。
