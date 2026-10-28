---
title: "VitePress 扩展语法"
category: "博客相关"
tags:
  - VitePress
  - Markdown
  - Vue
excerpt: "讲解 VitePress 的原生容器、代码组、行高亮和代码标记，说明代码与 Markdown 文件导入、页面元数据、锚点及内置组件的使用方式，并提供独立预览示例和常见错误的检查方法。"
date: 2026-09-29
---

# VitePress 扩展语法

VitePress 会把 Markdown 编译成 Vue 页面，并在基础排版之外提供容器、代码增强、内容导入和默认主题组件。普通 Markdown 渲染器不一定能解释这些写法；有些语法也被其他工具采用，但其配置、构建过程和显示行为由 VitePress 决定。

例如，说明一个配置变更时，可以用提示容器表达适用条件，用代码高亮定位关键行，再通过代码组并列展示不同命令。标题、列表、链接、图片、GFM 表格和通用平台扩展由 [Markdown 语法指南](../tools/02-markdown-guide.md) 主讲，这里只展开 VitePress 的处理方式。

## 一、扩展的生效环境

### 1. 独立预览环境

这些扩展在 VitePress 开发服务和生产构建中处理，不是把文件后缀改成 `.md` 就能在任意工具里获得相同效果。独立示例使用 Node.js 22.19.0、pnpm 10.21.0 和 VitePress 1.6.4；本站仍使用 1.3.4，本文展示的核心写法在两种版本中验证。

若只需了解语法，可直接查看各节的输入与结果。需要独立复现时，先安装 [Node.js](https://nodejs.org/zh-cn/download)，在 PowerShell 中检查版本，并在没有本文版本 pnpm 时执行安装命令：

```powershell
node --version
npm install -g pnpm@10.21.0
pnpm --version
mkdir vitepress-syntax
cd vitepress-syntax
```

在这个空目录中创建 `package.json`，使用下面的完整内容。后续文件路径都相对于 `vitepress-syntax`，命令也在该目录中执行：

::: details 查看 package.json 完整内容

```json [package.json]
{
  "name": "vitepress-syntax",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.21.0",
  "scripts": {
    "docs:dev": "vitepress dev",
    "docs:build": "vitepress build",
    "docs:preview": "vitepress preview"
  },
  "devDependencies": {
    "vitepress": "1.6.4"
  },
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild"]
  }
}
```

:::

安装依赖并创建 VitePress 配置目录：

```powershell
pnpm install
mkdir .vitepress
```

新建 `.vitepress/config.mts`，使用下面的完整配置。VitePress 根目录就是当前项目目录，默认部署前缀为 `/`；`srcExclude` 排除稍后用于包含内容的片段文件，避免它们单独生成页面：

```ts [.vitepress/config.mts]
import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '语法演示',
  cleanUrls: false,
  ignoreDeadLinks: false,
  srcExclude: ['parts/**'],
  themeConfig: { outline: [2, 3] }
})
```

接着新建 `index.md`，用以下完整内容建立第一个页面：

:::: details 查看 index.md 完整内容

````markdown [index.md]
---
title: 扩展演示
description: 核对 VitePress 扩展的显示行为
---

# 扩展演示

## 一、请求限制

::: tip 数量上限使用正整数
示例只展示配置内容，maxEntries 表示一次处理的最大条数。
:::

```ts {2}
const limits = {
  maxEntries: 100,
  retryCount: 3
}
```

当前状态：<Badge type="tip" text="已核对" />
````

::::

先检查是否已有属于这个独立项目的开发服务。没有可复用服务时启动：

```powershell
pnpm run docs:dev
```

按终端给出的地址打开页面，默认是 `http://localhost:5173/`。应看到“扩展演示”、一个带标题的提示容器、第 2 行高亮的代码和“已核对”徽章；右侧目录包含“请求限制”。如果端口被占用，可使用 `pnpm run docs:dev --port 5175 --strictPort` 指定空闲端口。

::: info 命令根目录与建站布局保持一致
这个示例把 `.vitepress` 和 `index.md` 放在项目根目录，所以命令不追加 `docs`。如果采用 `docs/.vitepress` 布局，命令也要从相应 VitePress 根目录启动。完整建站、导航与部署规则见 [VitePress 建站教程](./01-vitepress.md)。
:::

### 2. 编译能力与主题能力

原生容器和代码标记由 Markdown 编译过程生成结构，最终外观还依赖主题 CSS。代码组和 Badge 还涉及默认主题的组件；自己完全替换主题后，需要另外确认这些能力是否仍然可用。

后面的 Markdown 输入可以按需追加到本篇创建的 `index.md` 正文中。配置片段明确指出要修改的对象，不应重复粘贴新的默认导出；文件导入示例则会先给出需要新建的文件。

Mermaid、脚注、数学公式、GitHub Alerts 和 Emoji 简码有自己的平台或插件条件，不归为 VitePress 特有语法。本站的 `marker-text` 等 CSS 类也属于项目自定义样式，不能假定一个新的 VitePress 站点自带这些类。

## 二、容器与折叠

### 1. 原生提示容器

容器以 `::: 类型 具体标题` 开始，以单独的 `:::` 结束。类型决定语义和默认外观，标题帮助读者理解适用条件；内部仍可使用 Markdown 正文、列表和代码。

| 类型 | 适用内容 |
|------|----------|
| `info` | 环境前提、版本与中性说明 |
| `tip` | 操作建议、正确实践与关键判断 |
| `warning` | 限制、易错边界与兼容问题 |
| `danger` | 数据损坏、安全或不可逆后果 |
| `details` | 默认折叠的长代码和补充材料 |

下面的源码创建一个有具体标题的提示容器：

```markdown
::: tip 保留死链检查
构建发现链接错误时，修正目标路径或创建对应页面，再重新构建。
:::
```

显示结果如下。正文给出处理方法，容器承担提醒用途：

::: tip 保留死链检查
构建发现链接错误时，修正目标路径或创建对应页面，再重新构建。
:::

`::: tip` 本身可以使用默认标题，但本文与本站文章统一填写具体标题。警告应紧邻受影响的操作，不能把整节原理都装进容器，也不能只靠容器颜色表达结论。

### 2. details 默认折叠

`details` 会生成可以展开和收起的原生折叠结构。正文中的必要前提与结论保留在外面，较长的完整实现、日志或次要证据放在里面。

下面演示折叠一段配置说明，开始与结束处的空行让内容边界更清楚：

```markdown
::: details 查看字段含义

maxEntries 是一次处理的最大条数。
retryCount 是失败后最多重试的次数。

:::
```

实际显示为默认关闭的折叠，点击标题可以查看内容：

::: details 查看字段含义

maxEntries 是一次处理的最大条数。
retryCount 是失败后最多重试的次数。

:::

::: warning 长代码需要折叠，details 名称不能写错
本站约定代码块内容超过 10 行时使用默认折叠的 `details`，注释与空行也计入行数。正确名称是 `details`，不是 `detail`；折叠外仍应写明用途、条件和结果判断。
:::

### 3. 容器嵌套与源码展示

嵌套不同容器时，外层使用更多冒号，内层使用三个冒号，并分别闭合。展示一个包含 `:::` 的长 Markdown 模板时，外层折叠同样使用四个冒号，避免与演示内容混淆。

下面是“一个折叠里放一个提示容器”的写法说明；平时不必为普通提示增加外层折叠：

```markdown
:::: details 查看配置限制
::: info 数量上限范围
maxEntries 需要为正整数。
:::
::::
```

展示代码围栏自身则加长外层反引号，如本篇完整 `index.md` 使用四反引号包裹内部三反引号。冒号控制容器边界，反引号控制代码边界，两者不能互相替代。

## 三、代码显示增强

### 1. 行高亮与行号

代码块语言后面的 `{2}` 表示高亮第 2 行，`{2-3}` 表示连续两行，`{2,4-6}` 表示组合范围。行号从代码内容第一行开始计算，空行和注释也占用行号。

以下输入同时开启行号并高亮第 2 行：

````markdown
```ts:line-numbers {2}
const limits = {
  maxEntries: 100,
  retryCount: 3
}
```
````

显示结果如下，观察行号与带背景的 `maxEntries` 行：

```ts:line-numbers {2}
const limits = {
  maxEntries: 100,
  retryCount: 3
}
```

`:line-numbers` 对当前块开启行号，`:no-line-numbers` 可以覆盖全局开启的设置。`:line-numbers=5` 可以让显示编号从 5 开始；高亮范围仍按块内行的位置选择，不改成显示编号。

也可在行末添加 `// [!code highlight]` 注释指定高亮，适合代码修改时不希望维护数字范围的场景。以下展示处理后的代码：

```ts
const maxEntries = 100 // [!code highlight]
const retryCount = 3
```

显示时该注释标记会被高亮器处理，关键行带背景。这个标记控制文档展示，不负责检查配置值是否正确。

### 2. 聚焦与增删标记

`// [!code focus]` 让读者聚焦该行，并弱化其他行。在前面的 `limits` 代码块中，把这个注释追加到 `maxEntries` 行末，即可得到下面的显示结果；鼠标进入代码块时可继续查看其他代码：

```ts
const limits = {
  maxEntries: 100, // [!code focus]
  retryCount: 3
}
```

`// [!code --]` 和 `// [!code ++]` 分别标记删除与新增，保留原代码语言的高亮。下面只用于展示同一声明的两个版本，不是可以同时执行的程序：

```ts
const maxEntries = 50 // [!code --]
const maxEntries = 100 // [!code ++]
```

预期第一行呈现删除样式，第二行呈现新增样式。高亮器会处理这些注释，使它们不再作为代码正文显示，因此展示模板源码时需要在相邻说明中给出准确标记。普通 `diff` 围栏由 Markdown 指南主讲，不能把所有带 `+`、`-` 的代码都认为使用了 VitePress 注释标记。

### 3. 错误与警告标记

`// [!code error]` 和 `// [!code warning]` 分别使用错误、警告的行样式。它们由作者主动标注，不是编译器或测试工具自动检测出来的错误。

下面用配置值说明标记位置：数量上限应为正数，而重试 100 次需要重新评估是否符合处理策略。代码块只展示待检查的内容：

```ts
const limits = {
  maxEntries: -1, // [!code error]
  retryCount: 100 // [!code warning]
}
```

预期这两行分别显示错误与警告背景。显示结果只证明注释标记被识别；真实项目仍需实现输入校验、测试与错误处理。

### 4. 代码组

`::: code-group` 把多个代码块放入可切换的标签页。`[npm]`、`[pnpm]` 是当前块的标签，不是代码的一部分；标签应说明对应工具、语言或文件。

下面对同一个构建目标提供两个包管理器命令。需要执行时，按项目采用的包管理器选择一个，不需要连续执行两次：

:::: details 查看构建命令代码组的 Markdown 写法

````markdown
::: code-group

```powershell [npm]
npm run docs:build
```

```powershell [pnpm]
pnpm run docs:build
```

:::
````

::::

实际代码组如下，切换标签后只显示对应命令：

::: code-group

```powershell [npm]
npm run docs:build
```

```powershell [pnpm]
pnpm run docs:build
```

:::

任一代码块超过 10 行时，按本站约定折叠整个代码组，外层使用四冒号的 `details`。折叠改变显示状态，不改变代码内容和执行条件。

## 四、构建期内容导入

### 1. 导入代码片段

`<<<` 从一个真实文件读取内容并显示为代码块。这是构建时的文件读取，不会执行代码，也不是普通 Markdown 的引用式链接。

在独立项目根目录新建 `limits.ts`，使用下面的完整内容：

```ts [limits.ts]
export const limits = {
  maxEntries: 100,
  retryCount: 3
}
```

然后在 `index.md` 正文追加下面一行，导入该文件并高亮第 2 行：

```markdown
<<< ./limits.ts{2} [limits.ts]
```

重新预览后应看到来自文件的四行代码，标签为 `limits.ts`。相对路径以当前 Markdown 文件为基准；`@/` 以 VitePress 内容源目录为基准，如果配置了 `srcDir`，它指向新的源目录。

需要只展示一个区域时，可在代码文件中使用 `// #region 名称` 与 `// #endregion 名称` 包围区域，再按 `<<< ./limits.ts#名称` 导入。区域裁剪和高亮针对展示内容，完整文件仍由作者维护，具体规则见 [官方代码导入说明](https://vuejs.github.io/vitepress/v1/zh/guide/markdown#导入代码片段)。

::: warning 导入依赖真实文件和正确路径
路径错误时，检查当前 Markdown 所在目录、目标文件大小写和构建输出；不要用缺少文件的导入语句代替完整示例。导入结果超过 10 行时也应放入 `details`，不会因为源码在外部文件就免除折叠。
:::

### 2. 包含 Markdown 内容

`<!--@include: 路径-->` 在构建时把另一个 Markdown 文件的内容放入当前位置。它不是跳转链接，也不是浏览器在运行时加载远端文件。

在独立项目中创建 `parts` 目录，新建 `parts/notice.md`，使用下面的完整内容：

```markdown [parts/notice.md]
配置说明用于文档展示，不会自动限制真实请求。

修改数量上限后，还需要检查实际处理逻辑和测试结果。
```

在 `index.md` 中追加包含指令：

```markdown
<!--@include: ./parts/notice.md-->
```

预览应出现文件中的两个段落，而不是一条新导航链接。前面的 `srcExclude: ['parts/**']` 仅阻止片段生成独立页面，不阻止包含指令读取它。

包含内容还会参与当前页面的 Markdown 与 Vue 编译，因此标题层级、内部相对资源和引用应按最终组合结果检查。不要互相递归包含同一组文件，也不要依赖未展示的公共片段；行范围与命名区域的进阶写法见 [官方包含说明](https://vuejs.github.io/vitepress/v1/zh/guide/markdown#包含-markdown-文件)。

## 五、页面配置与定位

### 1. Frontmatter 页面选项

Frontmatter 是文件开头两个 `---` 之间的 YAML 元数据。这个格式也被其他工具采用，但其中字段如何影响 VitePress 页面，要按 VitePress 的页面配置解释。

独立示例已经给出 `index.md` 的完整 Frontmatter。若需要修改当前页的描述和右侧目录，可调整现有元数据为下面的形式，而不是在文件中间再新增一份：

```yaml
---
title: 扩展演示
description: 核对 VitePress 扩展的显示行为
outline: [2, 3]
aside: true
---
```

| 字段 | 对当前页面的作用 |
|------|------------------|
| `title` | 页面标题数据，并参与浏览器标签页标题 |
| `description` | 页面描述数据 |
| `outline` | 当前页目录的标题层级，也可设为 `false` |
| `aside` | 是否显示文章的右侧区域 |
| `lastUpdated` | 可以用 `false` 对当前页关闭更新时间显示 |

`tags`、`excerpt` 等可以作为自定义字段保存，但默认主题不会因此自动生成分类页或标签页。文件的唯一正文一级标题仍由作者编写；不要把页面元数据当成 Markdown 正文标题。

::: warning Frontmatter 必须位于文件开头
文件路径注释和正文不能放在首个 `---` 前面。元数据不被识别时，先检查分隔符、YAML 缩进与字段值；页面规则和主题规则分别见 [Frontmatter](https://vuejs.github.io/vitepress/v1/zh/guide/frontmatter) 与 [页面配置参考](https://vuejs.github.io/vitepress/v1/zh/reference/frontmatter-config)。
:::

### 2. 标题锚点与目录

VitePress 为标题自动生成 HTML ID，并据此提供标题链接和页面目录。需要明确指定 ID 时，在标题末尾写 `{#标识}`；这比把生成规则理解为“中文统一转拼音”更可靠。

下面是可以追加到独立示例中的完整片段。预览中的链接应跳到“配置字段”标题：

```markdown
[查看配置字段](#limit-fields)

## 二、配置字段 {#limit-fields}

maxEntries 表示一次处理的最大条数。
```

生成的 ID 为 `limit-fields`，不包含 `#`。同页不要重复使用同一个自定义 ID；修改或删除 ID 后同步检查链接。普通链接与锚点的基础概念仍由 Markdown 指南主讲。

`[[toc]]` 可以在文档正文中生成目录。下面只在独立示例中展示，本站普通文章不再插入一份正文目录：

```markdown
[[toc]]
```

这个正文目录由 `markdown.toc` 配置控制，右侧目录由 `themeConfig.outline` 或页面 `outline` 控制，二者不是同一个选项。实际使用时避免让顶部、左侧、正文和右侧重复展示同一份目录。

## 六、Vue 组件与字面量

### 1. 内置 Badge

默认主题提供全局 `Badge` 组件，用来表达某个功能的状态或适用条件。它需要 VitePress 默认主题的组件支持，与 Markdown 图片徽章的加载方式不同。

下面是四种类型的完整用法，可以直接放入 Markdown 正文：

```html
<Badge type="info" text="默认配置" />
<Badge type="tip" text="已核对" />
<Badge type="warning" text="需要条件" />
<Badge type="danger" text="存在风险" />
```

实际显示为：<Badge type="info" text="默认配置" /> <Badge type="tip" text="已核对" /> <Badge type="warning" text="需要条件" /> <Badge type="danger" text="存在风险" />。

`text` 指定文字，`type` 指定类型；默认类型是 `tip`，也可以使用组件子内容代替 `text`。徽章只表达状态，不能替代解释成立条件的正文，官方说明见 [Badge 用法](https://vuejs.github.io/vitepress/v1/zh/reference/default-theme-badge)。

### 2. 页面数据与插值转义

Markdown 会被编译为 Vue 页面，因此正文中的双大括号可以计算表达式，也可以读取 VitePress 提供的页面数据。使用独立示例已有的 Frontmatter，在正文追加：

```markdown
当前页面：{{ $frontmatter.title }}。
```

预览应显示“当前页面：扩展演示。”，而不是双大括号和变量名。这里的数据来自当前页面，不是自动读取另一个文件的标题；相关用法见 [在 Markdown 中使用 Vue](https://vuejs.github.io/vitepress/v1/zh/guide/using-vue)。

讲解模板源码时，不应让 Vue 把占位符当成变量执行。行内可使用 `<span v-pre>`，整段可使用 `v-pre` 容器：

```markdown
::: v-pre
{{ status }} 是要原样展示的模板表达式。
:::
```

显示结果如下，`status` 不需要在页面中定义：

::: v-pre
{{ status }} 是要原样展示的模板表达式。
:::

普通代码块默认已受 `v-pre` 保护，不会执行其中的 Vue 表达式。语言后附加 `-vue` 可以改变这种行为，但只在确实需要代码内插值时使用；显示源码时不要启用它。

### 3. raw 容器的边界

`raw` 容器会给内部内容包上 `vp-raw` 类，用于配合组件样式与路由隔离策略。它与 `v-pre` 的职责不同，不能用来阻止 Vue 解析插值，也不能当成安全沙箱。

下面只演示容器结构：

```markdown
::: raw
<div>组件展示区域</div>
:::
```

是否能避开全局样式还取决于样式隔离配置；不是加一个 `raw` 就获得独立 CSS 环境。需要这项能力时按 [官方 raw 说明](https://vuejs.github.io/vitepress/v1/zh/guide/markdown#raw) 配置 PostCSS 隔离并检查实际组件，不以这个结构示例代替完整接入。

## 七、图片编译选项

Markdown 图片的基础写法不因 VitePress 而改变。图片懒加载则通过 VitePress 的编译配置启用，不在图片地址后添加 `=lazysizes`。

如果要让自己的站点给 Markdown 图片生成原生懒加载属性，在 `.vitepress/config.mts` 已有配置顶层增加以下局部选项。其他配置保持在同一个默认导出中：

```ts
// .vitepress/config.mts：新增到现有 defineConfig 对象中。
markdown: {
  image: {
    lazyLoading: true
  }
}
```

该配置默认未开启；开启后应在浏览器中检查 Markdown 生成的图片是否带 `loading="lazy"`。实际何时发起图片请求由浏览器决定，不需要根据语法就推断一定使用了某个 `IntersectionObserver` 实现。

可选图片仍应由作者准备并放入文档同级 `images` 目录。路径与 `base` 的处理见建站教程，选项来源见 [官方图片懒加载说明](https://vuejs.github.io/vitepress/v1/zh/guide/markdown#图片懒加载)；不要用配置掩盖不存在的文件或错误地址。

## 八、构建与排错

源码在编辑器中显示为普通文字，不足以证明扩展没有生效；应在 VitePress 页面里检查。确认独立示例的基础页面与新增片段正常后，在项目根目录构建：

```powershell
pnpm run docs:build
```

应在 `.vitepress/dist` 中生成 `index.html` 与静态资源，`parts/notice.md` 不单独生成页面，其文字出现在首页中。若需要检查生产产物，先确认没有同目录的预览服务，再执行：

```powershell
pnpm run docs:preview
```

默认预览地址为 `http://localhost:4173/`，以终端为准；改变 Markdown 后先重新构建。完成验证后，在临时开发或预览服务的终端按 `Ctrl+C` 关闭。

| 现象 | 定位依据 | 处理方式 |
|------|----------|----------|
| 容器显示为冒号文本 | 是否在 VitePress 渲染，容器类型和结束行是否正确 | 检查类型、空行及冒号层级，再重新预览 |
| 折叠后的内容跑出边界 | 外层与内层结束符是否混淆 | 加长外层容器或围栏，并分别闭合 |
| 代码没有预期行背景 | 行号是否按块内位置计算，注释标记是否完整 | 修正范围或 `[!code ...]` 标记 |
| 代码组没有标签 | 代码块是否位于 `code-group` 内，标签是否写在语言后 | 检查分组结构与 `[标签]` |
| 导入内容不正确 | 文件路径、区域名、内容源目录及构建产物 | 核对已创建的文件，重新构建并观察内容 |
| 插值报未定义变量 | 普通正文是否误用了模板表达式 | 定义所需数据，展示字面量时使用 `v-pre` |
| Badge 变成未知标签 | 是否使用默认主题及其全局组件 | 按主题组件注册要求检查，不只复制 CSS |
| 预览仍显示旧内容 | 是否只运行预览而没有重新构建 | 重新执行构建后再访问产物 |

输入示例、代码标记和文件导入只证明 VitePress 的展示与编译行为，不会自动完成真实业务中的限流、校验或发布。需要站点搜索、导航和部署时，按建站教程处理；需要通用 Markdown 扩展时，按语法指南核对目标平台。






