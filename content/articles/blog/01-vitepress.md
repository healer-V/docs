---
title: "VitePress 建站教程"
category: "博客相关"
tags:
  - VitePress
  - Markdown
  - Vue
  - GitHub Pages
excerpt: "从空目录创建 VitePress 文档站，讲解页面与配置的关系、导航搜索、资源路径和主题扩展，并完成本地构建预览及 GitHub Pages 发布准备，提供常见错误的定位和处理方法。"
date: 2026-09-29
---

# VitePress 建站教程

VitePress 是基于 Vite 和 Vue 的静态网站生成器。Vite 提供开发服务器和构建能力，Vue 负责页面组件与浏览器中的交互；作者主要编写 Markdown 文件，构建时把这些文件转换为 HTML 页面和静态资源。

例如，团队可以把开发约定和发布记录写成 Markdown，再通过导航、侧边栏和搜索组织成一个文档站。发布后的站点可以由 GitHub Pages 等静态托管服务提供，不需要运行专门的内容服务器；登录、数据写入和业务接口则需要另外接入相应服务。

## 一、运行环境

### 1. 版本与工具

示例使用 VitePress 1.x 的默认主题，固定依赖版本以便复现。Node.js 是运行 JavaScript 工具的环境，pnpm 是安装项目依赖和执行脚本的包管理器；编辑器只需能够编辑文本文件，不要求先掌握 Vue 或 TypeScript。

| 工具 | 示例版本 | 用途 |
|------|----------|------|
| Node.js | 22.19.0 | 执行 VitePress 与 pnpm |
| pnpm | 10.21.0 | 安装依赖、生成锁文件、运行脚本 |
| VitePress | 1.6.4 | 生成文档站，版本在项目中固定 |
| Git | 支持 `git init -b main` 的版本 | 保存变更记录、为远端发布准备源码 |
| 编辑器 | VS Code 或其他文本编辑器 | 编辑 Markdown、JSON 和配置文件 |

安装 [Node.js](https://nodejs.org/zh-cn/download) 后，在 PowerShell 中检查运行环境。若尚未安装本文版本的 pnpm，再执行第三条命令；已经具备相同版本时不需要重复安装。

```powershell
node --version
npm --version
npm install -g pnpm@10.21.0
pnpm --version
```

`node --version` 应显示所安装的 Node.js 版本，`pnpm --version` 在本示例中显示 `10.21.0`。如果命令未被识别，先重新打开终端，再检查工具是否已加入系统的 `PATH` 环境变量；`PATH` 决定终端到哪些目录寻找可执行程序。

::: info 本文固定 VitePress 1.x
示例固定为 VitePress 1.6.4，不安装预发布的 `@next`。查阅资料时使用 [VitePress 1.x 官方文档](https://vuejs.github.io/vitepress/v1/zh/guide/getting-started)，避免把不同主版本的环境要求和配置混在一起。
:::

### 2. 新建空目录

在准备存放项目的位置执行以下命令，创建独立的 `team-handbook` 目录。后续未特别说明的命令都在这个目录中执行，示例文件路径也相对于该目录。

```powershell
mkdir team-handbook
cd team-handbook
```

`team-handbook` 是项目目录，`docs` 是稍后创建的 VitePress 根目录。二者用途不同：项目根目录存放依赖、Git 配置和发布工作流，`docs` 存放站点配置与文章；改变本地目录名不会自动改变网站的部署路径。

## 二、创建文档站

### 1. 依赖与脚本

在空目录中创建 `package.json`，使用下面的完整内容。`devDependencies` 声明构建工具依赖，`scripts` 给启动和构建命令命名，`packageManager` 让本地与发布工作流使用同一个 pnpm 版本。

::: details 查看 package.json 完整内容

```json [package.json]
{
  "name": "team-handbook",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.21.0",
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
  "devDependencies": {
    "vitepress": "1.6.4"
  },
  "pnpm": {
    "onlyBuiltDependencies": [
      "esbuild"
    ]
  }
}
```

:::

pnpm 10 对依赖的安装脚本有执行限制。这里通过 `onlyBuiltDependencies` 允许 esbuild 的安装脚本，为构建工具准备平台对应的二进制程序；这一设置不表示允许所有依赖任意执行安装脚本。相关行为见 [pnpm 安装脚本设置](https://pnpm.io/10.x/settings#onlybuiltdependencies)。

在项目根目录安装依赖，并确认 VitePress 的实际版本：

```powershell
pnpm install
pnpm list vitepress --depth 0
```

依赖列表中应显示 `vitepress 1.6.4`。安装后生成 `node_modules` 和 `pnpm-lock.yaml`：前者存放依赖，后者记录具体依赖解析结果。锁文件需要随源码提交，后续自动构建才能安装相同的依赖组合。

::: warning exec 与 run 的职责不同
`pnpm exec vitepress` 执行已安装的 VitePress 程序，`pnpm run docs:dev` 执行 `package.json` 中名为 `docs:dev` 的脚本。

如果采用交互式初始化向导，正确命令是 `pnpm exec vitepress init`；`pnpm run vitepress init` 会寻找名为 `vitepress` 的脚本并报错。本示例直接创建完整文件，不需要再运行向导覆盖这些文件。
:::

在项目根目录创建 `.gitignore`，让依赖、缓存和构建产物不进入版本管理：

```text [.gitignore]
node_modules/
docs/.vitepress/cache/
docs/.vitepress/dist/
```

### 2. 站点配置

先创建 `docs/.vitepress` 和 `docs/guide` 目录：

```powershell
mkdir docs/.vitepress
mkdir docs/guide
```

在 `docs/.vitepress` 中新建 `config.mts`。`.mts` 表示使用 ES Module 形式的 TypeScript 文件，VitePress 可以直接加载它；`defineConfig` 用于提供配置类型提示，本示例只使用普通对象配置。

下面是完整配置。示例计划发布到名为 `team-handbook` 的 GitHub 项目仓库，因此从一开始就使用 `/team-handbook/` 作为部署前缀，本地访问也包含这个前缀。

::: details 查看 docs/.vitepress/config.mts 完整内容

```ts [docs/.vitepress/config.mts]
import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '团队手册',
  description: '开发约定与文档维护记录',
  base: '/team-handbook/',
  cleanUrls: false,
  ignoreDeadLinks: false,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/writing' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '开发指南',
          collapsed: false,
          items: [
            { text: '文档约定', link: '/guide/writing' }
          ]
        }
      ]
    },
    outline: {
      level: [2, 3],
      label: '本页目录'
    },
    search: {
      provider: 'local'
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  }
})
```

:::

`base`、`title` 和 `lang` 属于整个站点；`nav`、`sidebar` 和 `search` 属于默认主题，必须放在 `themeConfig` 中。这一区别也适用于 Logo：`themeConfig.logo` 能被默认主题读取，顶层的 `logo` 不能代替它。

`nav` 是顶部入口，`sidebar` 是文章左侧导航，`outline` 是从当前文章标题生成的右侧目录。它们解决不同的定位问题，不需要把同一份完整目录重复配置三次。

### 3. 首页

在 `docs` 下新建 `index.md`。默认主题通过文件开头的 YAML Frontmatter 识别页面配置；Frontmatter 必须位于第一行，并由前后两个 `---` 包围，文件路径说明不能放在它前面。

首页使用小写的 `layout: home`。`hero` 配置页面的主要名称和入口，`features` 配置并列的内容介绍。

::: details 查看 docs/index.md 完整内容

```markdown [docs/index.md]
---
layout: home
title: 团队手册
hero:
  name: 团队手册
  text: 开发约定与维护记录
  tagline: 让文档与项目一起持续更新
  actions:
    - theme: brand
      text: 查看文档约定
      link: /guide/writing
features:
  - title: 开发约定
    details: 统一文档命名、变更说明与评审要求。
  - title: 维护记录
    details: 保存配置变更的原因与检查结果。
---
```

:::

如果省略 `---`，这些配置会被当成普通 Markdown 内容；如果写成 `layout: Home`，默认主题不会把它识别为首页布局。完整规则见 [默认主题首页配置](https://vuejs.github.io/vitepress/v1/zh/reference/default-theme-home-page)。

### 4. 普通文章

在 `docs/guide` 下新建 `writing.md`，提供导航和首页按钮对应的实际内容。普通文章使用 Markdown 正文，不设置 `layout: home`；下面同时展示页面元数据、标题和表格。

::: details 查看 docs/guide/writing.md 完整内容

```markdown [docs/guide/writing.md]
---
title: 文档约定
description: 统一团队文档的命名和维护方式
---

# 文档约定

文档约定用于让同一团队的说明具有一致的结构，并让修改原因能够被其他维护者理解。

## 一、文件命名

文件名使用小写英文和连字符，页面标题使用准确的中文技术名称。文件名决定页面路径，标题帮助读者识别内容，两者不必使用相同语言。

| 内容 | 文件名 |
|------|--------|
| 文档约定 | writing.md |
| 发布记录 | release-notes.md |

## 二、变更说明

修改配置时，记录修改对象、原因和实际检查结果。例如调整部署路径后，需要检查首页、文章和静态资源是否仍能直接访问。

### 1. 评审记录

评审者检查说明是否包含必要条件和结果，避免只有操作命令而没有判断依据。配置变更应同时说明影响的页面或资源，便于维护者复查。

例如，修改部署路径后，评审记录可以写明首页和文章的直接访问地址，以及图片请求是否返回成功状态。这类记录能帮助维护者区分源码已修改和发布结果已确认。
```

:::

到这里，核心示例的文件已经完整。目录结构如下，`pnpm-lock.yaml` 和 `node_modules` 由安装命令生成：

::: details 查看最小文档站目录结构

```text
team-handbook/
├─ docs/
│  ├─ .vitepress/
│  │  └─ config.mts
│  ├─ guide/
│  │  └─ writing.md
│  └─ index.md
├─ .gitignore
├─ package.json
├─ pnpm-lock.yaml
└─ node_modules/
```

:::

## 三、本地运行

### 1. 启动开发服务

先确认当前项目是否已经有开发服务运行。若已有服务能够访问，应直接复用；否则在项目根目录执行：

```powershell
pnpm run docs:dev
```

默认开发端口为 `5173`。使用本示例的 `base` 时，终端地址通常显示为下面的形式，实际以终端输出为准：

```text
Local: http://localhost:5173/team-handbook/
```

打开首页后应看到“团队手册”和“查看文档约定”按钮。点击按钮应进入 `/team-handbook/guide/writing.html`，页面左侧显示“开发指南”，右侧目录包含“文件命名”和“变更说明”。

修改 `writing.md` 的正文并保存，页面应自动更新，这称为热更新。终端需要保持运行；结束服务时在该终端按 `Ctrl+C`。

::: tip 端口与部署前缀一起决定访问地址
端口已被占用时，开发服务可以选择其他端口。若需要固定端口并让冲突立即报错，使用 `pnpm run docs:dev --port 5175 --strictPort`。

无论使用哪个端口，`base: '/team-handbook/'` 都要求保留 `/team-handbook/` 前缀；不要只修改端口后直接访问网站根路径。
:::

### 2. 配置层级

VitePress 同时读取站点配置和页面 Frontmatter。前者在构建和开发服务加载配置时生效，后者只描述当前 Markdown 页面。

| 层级 | 文件或位置 | 典型配置 |
|------|------------|----------|
| 站点 | `docs/.vitepress/config.mts` 顶层 | `title`、`description`、`lang`、`base`、`head` |
| 默认主题 | 同一文件的 `themeConfig` | `logo`、`nav`、`sidebar`、`search`、`footer` |
| 当前页面 | Markdown 文件开头的 Frontmatter | `title`、`description`、`layout`、`outline` |

`title` 会参与浏览器标签页标题，`description` 用于页面描述信息。如果需要调整标签页标题格式，可以在站点配置顶层添加 `titleTemplate: ':title | 团队手册'`，其中 `:title` 表示当前页面标题；`titleTemplate: false` 则取消站点标题后缀。

::: warning 同一个配置文件只保留一个默认导出
后面的配置片段用于修改已有对象，不能把每个片段都粘贴成新的 `export default defineConfig(...)`。合并时保留原有 `nav`、`sidebar` 等字段，避免后添加的同名字段覆盖已完成的配置。
:::

## 四、文章与资源路径

### 1. 文件路由与部署路径

VitePress 使用文件路由：Markdown 的相对路径决定生成页面的相对路径，`index.md` 对应目录首页。在本示例中，内容位于 `docs` 下，默认生成带 `.html` 的页面。

| 源文件 | 不含部署前缀的页面路径 | 本示例实际路径 |
|--------|------------------------|----------------|
| `docs/index.md` | `/` | `/team-handbook/` |
| `docs/guide/writing.md` | `/guide/writing.html` | `/team-handbook/guide/writing.html` |
| `docs/guide/index.md`，如另行创建 | `/guide/` | `/team-handbook/guide/` |

文章之间优先使用相对 Markdown 链接，例如在 `docs/index.md` 的 Frontmatter 结束后添加 `[文档约定](./guide/writing.md)`。VitePress 会把该链接转换为页面地址；`nav` 和首页按钮则使用示例中的 `/guide/writing`，由默认主题处理部署前缀。

`base` 表示网站在域名下的公开前缀，不是磁盘目录。GitHub 项目站点 `https://<用户名>.github.io/team-handbook/` 需要 `base: '/team-handbook/'`；域名根路径的站点使用 `'/'`，这是默认值。

::: warning cleanUrls 需要托管服务支持
`cleanUrls: true` 会生成不含 `.html` 的站内链接，但不会把静态文件变成后端路由。服务器必须能把 `/guide/writing` 映射到对应的 HTML 文件，否则直接打开或刷新页面会出现 404。

GitHub Pages 支持这类映射，本示例仍保留 `false`，便于直接核对文件和地址。其他托管方式应先验证服务器规则，再启用该选项，见 [VitePress 路由说明](https://vuejs.github.io/vitepress/v1/zh/guide/routing)。
:::

### 2. Frontmatter 与 Markdown

Frontmatter 是页面元数据，不代替正文标题。普通文章需要明确标题和描述，并通过正文标题组织内容；例如 `writing.md` 的 `title` 和唯一一级标题都为“文档约定”。

`tags`、`excerpt` 和 `category` 可以作为自定义 Frontmatter 字段，但默认主题不会自动生成标签页、摘要列表或分类目录。要展示这些字段，需要主题或内容加载逻辑读取它们；不能因为写入字段就认定对应页面已经存在。

正文中的标题会生成锚点，右侧目录按 `outline` 指定的层级展示。修改标题后应检查引用该锚点的链接；仅修改标题文字而保留原链接会导致读者无法跳到目标小节。

基本写法可查阅 [Markdown 语法指南](../tools/02-markdown-guide.md)，代码组、提示容器和行高亮可查阅 [VitePress 扩展语法](./02-vitepress-markdown.md)。实际写作时还应保持代码语言标识、图片说明和长代码折叠一致。

### 3. 文章图片与公共资源

文章专用图片可以放在该文章同级的 `images` 目录。例如，为 `docs/guide/writing.md` 准备 `docs/guide/images/review-record.png` 后，在该文章中使用下面的相对引用；图片应由作者提供，核心示例不依赖这个可选文件。

```markdown
![文档评审记录中的修改对象与检查结果](./images/review-record.png)
```

站点 Logo、favicon 等共享资源放在 `docs/public`。构建时其中的文件按原文件名复制到输出根目录，公开 URL 不包含 `public` 这一层。比如 `docs/public/logo.png` 对应本示例的 `/team-handbook/logo.png`。

若需要 Logo 和 favicon，先创建 `docs/public` 并放入自己的 `logo.png`，然后把以下两项合并到 `config.mts` 已有对象中。`head` 位于站点顶层，`logo` 位于 `themeConfig`；该片段省略了核心示例的其他配置。

```ts
// docs/.vitepress/config.mts：合并到已有配置，不新增第二个默认导出。
head: [
  ['link', { rel: 'icon', href: '/team-handbook/logo.png' }]
],
themeConfig: {
  // 默认主题会为 Logo 路径补上 base。
  logo: '/logo.png'
}
```

默认主题的 Logo 路径、Markdown 资源引用和手写的 `head` 链接处理方式不同。favicon 的 `href` 需要包含正确的公开前缀；把它写成 `../public/logo.png` 会把磁盘目录误当作网页目录，并且随当前页面路径变化。

若进一步编写 Vue 主题组件，并在运行时生成图片地址，可使用 VitePress 的 `withBase` 为地址添加 `base`。普通 Markdown 图片无需手动重复部署前缀，具体规则见 [资源处理](https://vuejs.github.io/vitepress/v1/zh/guide/asset-handling)。

### 4. 根目录与内容目录分离

对于较大的站点，可以让 `.vitepress` 留在项目根目录，并通过 `srcDir` 指定单独的内容目录。下面是另一种目录布局的最小配置说明，不与 `team-handbook` 的 `docs` 布局混用。

把配置放在根目录的 `.vitepress/config.mts`，页面放入 `content`，在已有站点配置顶层设置：

```ts
// .vitepress/config.mts：该布局从项目根目录启动。
srcDir: 'content',
base: '/docs/'
```

此时脚本中的命令使用 `vitepress dev`、`vitepress build` 和 `vitepress preview`，不再追加 `docs`。默认构建目录相应位于根目录的 `.vitepress/dist`；`content` 不出现在页面 URL 中，`base` 仍独立决定公开访问前缀。

这种分离适合把网站文章与维护脚本、编写规范隔开。调整布局时必须一起核对配置位置、命令根目录、公共资源位置和发布产物目录，不能只改其中一处。

## 五、导航、搜索与主题

### 1. 导航与侧边栏

核心配置已经创建顶部导航和按路径匹配的侧边栏。新增文章时，先创建文件，再在相应 `items` 中增加条目；导航条目的文字不会自动创建页面。

如果需要顶部下拉菜单，可把 `themeConfig.nav` 中的“指南”条目替换为以下对象。该对象引用已经创建的文章，省略了 `nav` 数组的其他条目：

```ts
// docs/.vitepress/config.mts：替换 themeConfig.nav 中的指南条目。
{
  text: '指南',
  items: [
    { text: '文档约定', link: '/guide/writing' }
  ]
}
```

`items` 还可以包含带 `text` 和 `items` 的分组。外部链接使用完整的 `https://` 地址，设置 `noIcon: true` 可隐藏外部链接图标；站内链接无需把 `base` 再手动拼接一次。

侧边栏有两种常用形式：数组表示所有文章共用一份目录，对象表示按路径前缀选择不同目录。本示例的 `'/guide/'` 只匹配指南页面；如果创建第二个内容目录，应在 `sidebar` 对象中增加它自己的路径键。

| collapsed 设置 | 页面表现 |
|----------------|----------|
| 不配置 | 分组不可折叠 |
| `false` | 可以折叠，默认展开 |
| `true` | 可以折叠，默认收起 |

右侧目录来自当前页面标题，底部上一篇、下一篇来自侧边栏顺序。`docFooter` 只修改底部按钮文案，不会自动建立文章的知识顺序。完整选项见 [默认主题配置](https://vuejs.github.io/vitepress/v1/zh/reference/default-theme-config)。

### 2. 本地搜索

核心配置中的 `search.provider: 'local'` 使用浏览器内的 MiniSearch 索引查找文档，不需要申请远端搜索账号。打开搜索框，输入“评审记录”，应能找到 `writing.md` 中对应的标题或正文。

如果单语言中文站点希望搜索按钮也显示中文，把核心配置中的 `search` 替换为以下对象。翻译对象位于 `options.translations`；只有多语言站点才需要按语言键配置 `options.locales`。

::: details 查看中文搜索的局部配置

```ts
// docs/.vitepress/config.mts：替换 themeConfig.search。
search: {
  provider: 'local',
  options: {
    translations: {
      button: {
        buttonText: '搜索文档',
        buttonAriaLabel: '搜索文档'
      },
      modal: {
        noResultsText: '未找到相关结果',
        resetButtonTitle: '清除查询条件',
        footer: {
          selectText: '选择',
          navigateText: '切换',
          closeText: '关闭'
        }
      }
    }
  }
}
```

:::

搜索是否可用需要同时检查结果和跳转：能搜到标题还不足以证明链接正确，点击后应进入 `/team-handbook/guide/writing.html` 并定位对应内容。

::: tip 搜索方式按内容规模选择
小型站点可以直接使用本地搜索。内容规模扩大后，需要评估索引体积和浏览器加载成本；Algolia DocSearch 是远端索引方案，需要另行配置账号、索引和抓取条件，不能只把 `provider` 改成 `'algolia'` 就认为完成接入。见 [搜索配置](https://vuejs.github.io/vitepress/v1/zh/reference/default-theme-search)。
:::

### 3. 扩展默认主题

只调整颜色和字体时，保留默认主题即可。创建 `docs/.vitepress/theme` 目录，在其中新建 `index.ts`，继承默认主题并加载自定义 CSS：

```ts [docs/.vitepress/theme/index.ts]
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme
}
```

在同一目录新建 `custom.css`，通过主题变量改变品牌色。下面同时定义浅色与深色模式，避免只在其中一种模式下保持可读性：

::: details 查看 docs/.vitepress/theme/custom.css 完整内容

```css [docs/.vitepress/theme/custom.css]
:root {
  --vp-c-brand-1: #087f5b;
  --vp-c-brand-2: #0c956b;
  --vp-c-brand-3: #12b886;
  --vp-c-brand-soft: rgba(18, 184, 134, 0.14);
}

.dark {
  --vp-c-brand-1: #63e6be;
  --vp-c-brand-2: #38d9a9;
  --vp-c-brand-3: #20c997;
  --vp-c-brand-soft: rgba(56, 217, 169, 0.16);
}
```

:::

重新检查首页按钮、文章链接和两种外观模式，确认颜色变化后文字仍然可读。优先覆盖公开的 CSS 变量，减少对默认主题内部 DOM 层级的依赖。

如果要注册 Vue 组件或使用 Vue API，应按 [扩展默认主题](https://vuejs.github.io/vitepress/v1/zh/guide/extending-default-theme) 的要求显式安装 Vue，并处理组件在构建时的服务端渲染兼容性。本示例只加载 CSS，不增加组件注册回调。

### 4. 更新时间与其他选项

`lastUpdated: true` 是站点顶层配置，开启后 VitePress 根据文章的 Git 提交记录生成更新时间。`themeConfig.lastUpdated` 可配置文字和日期格式；仅存在 Git 程序但文章尚未提交，不能提供可靠的文件提交时间。

把以下设置合并到 `config.mts`，其中 `themeConfig` 内的对象只展示要新增的字段：

::: details 查看更新时间的局部配置

```ts
// docs/.vitepress/config.mts：合并到已有配置。
lastUpdated: true,
themeConfig: {
  lastUpdated: {
    text: '最后更新于',
    formatOptions: {
      dateStyle: 'medium'
    }
  }
}
```

:::

构建进程需要能够通过 `PATH` 找到 Git，并能访问文章的提交历史。CI 使用 `fetch-depth: 0` 获取完整历史；修改 VS Code 的 `git.path` 只影响编辑器的 Git 集成，不能替代构建进程的环境配置。

其他配置可以按实际需求加入，不需要在首次建站时全部开启：

| 选项 | 用途与条件 | 官方入口 |
|------|------------|----------|
| `themeConfig.socialLinks` | 展示真实的项目或社交链接；自定义图标应提供可访问名称 | [社交链接](https://vuejs.github.io/vitepress/v1/zh/reference/default-theme-config#sociallinks) |
| `themeConfig.footer` | 首页或无侧边栏页面的页脚；有侧边栏的文章页不默认显示该页脚 | [页脚](https://vuejs.github.io/vitepress/v1/zh/reference/default-theme-footer) |
| `head` | 添加 favicon、字体或统计脚本；统计接入需要自己的有效配置 | [站点 head](https://vuejs.github.io/vitepress/v1/zh/reference/site-config#head) |
| `themeConfig.carbonAds` | 接入 Carbon Ads，需要其提供的有效参数 | [Carbon Ads](https://vuejs.github.io/vitepress/v1/zh/reference/default-theme-carbon-ads) |

## 六、构建与预览

### 1. 生成静态文件

开发服务器用于编辑时的热更新，构建命令用于生成待发布的静态文件。在项目根目录执行：

```powershell
pnpm run docs:build
```

成功后输出位于 `docs/.vitepress/dist`。下面列出应能观察到的主要产物，不列出名称包含构建哈希的全部资源：

```text
docs/.vitepress/dist/
├─ index.html
├─ guide/
│  └─ writing.html
└─ assets/
```

`base: '/team-handbook/'` 不会在产物目录中额外创建 `team-handbook` 文件夹。它影响生成页面里的公开 URL，托管服务负责把整个产物放到对应访问前缀。

::: warning 构建成功不等于已发布
`docs:build` 只生成本地文件，不上传到 GitHub，也不启动线上服务。发布前仍需预览生成产物，并确认导航、搜索和资源地址；浏览器能打开开发页面不能证明发布配置正确。
:::

### 2. 预览生产产物

构建完成后，在项目根目录检查是否已有指向同一产物目录的预览服务。没有可复用服务时执行：

```powershell
pnpm run docs:preview
```

默认预览端口为 `4173`，本示例访问 `http://localhost:4173/team-handbook/`。若指定其他端口，使用 `pnpm run docs:preview --port 4175 --strictPort` 并按终端地址访问。

按顺序检查下面的行为，确认构建后的页面链路完整：

1. 打开首页，确认“团队手册”和文章入口显示正常。
2. 点击“文档约定”，确认导航、侧边栏和当前文章内容一致。
3. 直接打开 `/team-handbook/guide/writing.html` 并刷新，确认无需先访问首页也能读取文章。
4. 搜索“评审记录”，点击结果，确认能定位对应内容。
5. 切换深浅模式并缩窄浏览器宽度，确认菜单和文章仍可阅读。

::: tip 预览不会自动重建 Markdown
`docs:preview` 读取的是已经生成的静态文件。修改正文后，先重新执行 `docs:build` 再检查预览；否则看到的仍是旧产物。检查完成后在对应终端按 `Ctrl+C` 关闭临时服务。
:::

## 七、GitHub Pages 发布

### 1. 源码与仓库

GitHub Pages 托管生成后的静态文件，GitHub Actions 工作流负责检出源码、安装依赖、构建并上传产物。示例采用 GitHub 官方 Pages Artifact 流程，Artifact 是一次工作流生成并保存的文件集合，无需把产物提交到 `gh-pages` 分支。

先安装并检查 Git。在 `team-handbook` 项目根目录运行以下本地命令，创建 `main` 分支并提交源码；`git add .` 中的空格不可省略。

```powershell
git --version
git init -b main
git add .
git commit -m "docs: create team handbook"
```

首次提交若提示缺少身份，使用 `git config user.name "你的提交署名"` 和 `git config user.email "你的提交邮箱"` 设置当前仓库的身份，再重试提交。署名和邮箱由维护者填写，不应复制他人的真实账号资料。

::: warning 以下流程以新建空仓库为前提
在 GitHub 创建名为 `team-handbook` 的空仓库，不预先生成 README、许可证或 `.gitignore`。如果远端已经有提交，先克隆远端仓库并在其中整理文件，或者检查双方历史后再合并；不要用强制推送跳过历史冲突。
:::

需要关联远端时，在当前项目中执行下面的命令。把 `<你的 GitHub 仓库 URL>` 整段替换为你新建仓库的 HTTPS 或 SSH 地址，不能保留尖括号：

```powershell
git remote add origin "<你的 GitHub 仓库 URL>"
```

这一操作只登记远端地址，尚未上传代码。身份认证使用 GitHub 支持的 HTTPS 凭据或 SSH 配置；Pages 工作流的授权与本地 Git 推送认证是两个不同问题。

### 2. Pages 工作流

在 GitHub 仓库设置中进入 `Settings → Pages`，把 `Build and deployment → Source` 设为 `GitHub Actions`。如果仓库或组织限制了 Actions 权限，还需要由有权限的维护者开放相应设置。

在项目根目录创建 `.github/workflows/deploy.yml`，使用下面的完整内容。Node.js 与 pnpm 版本来自同一个示例基线，`pnpm/action-setup` 从 `package.json` 读取 pnpm 版本，产物路径与 `vitepress build docs` 保持一致。

::: details 查看 .github/workflows/deploy.yml 完整内容

```yaml [.github/workflows/deploy.yml]
name: Deploy team handbook

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - name: Install pnpm
        uses: pnpm/action-setup@v6
      - name: Setup Node.js
        uses: actions/setup-node@v7
        with:
          node-version: '22.19.0'
          cache: pnpm
          cache-dependency-path: pnpm-lock.yaml
      - name: Configure Pages
        uses: actions/configure-pages@v5
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Build
        run: pnpm run docs:build
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

:::

工作流的权限含义如下，`deploy` 必须等待 `build` 成功并上传 Pages Artifact 后才能运行：

| 配置 | 含义 |
|------|------|
| `contents: read` | 允许检出本仓库源码 |
| `pages: write` | 允许向 GitHub Pages 创建部署 |
| `id-token: write` | 允许申请部署来源验证所需的身份令牌 |
| `fetch-depth: 0` | 获取完整 Git 历史，支持文章更新时间计算 |
| `--frozen-lockfile` | 检查依赖与已提交锁文件一致，不在 CI 中重新解析版本 |
| `path: docs/.vitepress/dist` | 上传当前示例实际生成的产物目录 |

GitHub 为工作流提供当前仓库的 `GITHUB_TOKEN`，官方 Pages 部署 Action 默认使用该令牌，不需要另外创建 `ACCESS_TOKEN`。示例面向 GitHub.com 的托管 Runner；企业自托管 Runner 和 GitHub Enterprise Server 应单独核对 Action 的兼容要求。流程依据见 [VitePress 部署指南](https://vuejs.github.io/vitepress/v1/zh/guide/deploy) 与 [deploy-pages 官方说明](https://github.com/actions/deploy-pages)。

### 3. 上传与检查

先在本地执行 `pnpm install --frozen-lockfile` 和 `pnpm run docs:build`，确认锁文件与构建都通过。然后检查要上传的文件，并提交工作流：

```powershell
git status --short
git add .github/workflows/deploy.yml
git commit -m "ci: deploy team handbook to pages"
```

首次源码提交应已包含 `pnpm-lock.yaml`。如果后来调整依赖或页面，需要另外把实际修改的源码和锁文件加入提交，不能只提交工作流。

::: danger 推送会上传源码并触发部署
确认仓库地址、公开范围和待提交文件不包含账号、密钥或客户资料后，再执行下面的推送。工作流监听 `main`，推送后会自动构建并尝试发布站点。
:::

在完成检查并准备发布时，执行普通推送：

```powershell
git push -u origin main
```

在 GitHub 的 `Actions` 页面查看 `build` 和 `deploy` 是否成功，以部署任务返回的 URL 为准。项目仓库名为 `team-handbook` 时，默认形式为 `https://<用户名>.github.io/team-handbook/`。

随后直接访问一篇文章、刷新页面、检查搜索跳转，并在浏览器网络面板确认 JavaScript、CSS 和自定义图片未返回 404。若后来发现内容错误，应提交修正或还原有问题的变更，再由工作流生成新部署，不以强制推送作为常规恢复步骤。

## 八、常见错误

### 1. 命令与依赖错误

命令失败时先区分“程序没有被找到”和“程序已启动但依赖或配置错误”。在项目根目录检查以下信息，避免先反复重装全部工具：

```powershell
node --version
pnpm --version
pnpm list vitepress --depth 0
Get-Content package.json
```

| 现象 | 定位依据 | 处理与复测 |
|------|----------|------------|
| `ERR_PNPM_NO_SCRIPT` | 检查实际执行的脚本名是否出现在 `scripts` 中 | 执行已存在的 `docs:dev`；调用 VitePress 程序使用 `pnpm exec` |
| `vitepress` 无法找到 | 当前目录是否有 `package.json`，是否完成安装 | 回到项目根目录执行 `pnpm install`，再查询 VitePress 版本 |
| 读取配置时报语法错误 | 终端指出配置文件和行号 | 检查中文逗号、括号和重复默认导出，修复后重新构建 |
| esbuild 安装脚本被跳过且构建报错 | 核对 pnpm 版本、安装输出与 `onlyBuiltDependencies` | 保留本文允许项，执行 `pnpm rebuild esbuild` 后重新构建 |
| CI 提示锁文件过期 | 比较 `package.json` 与 `pnpm-lock.yaml` 是否来自同一次变更 | 本地用相同 pnpm 执行安装并提交锁文件，再使用 `--frozen-lockfile` 验证 |

如果 Git 调用报错，先执行 `git --version`，再检查 `PATH` 和仓库历史。`ENOENT` 表示程序或目标路径未找到；`EAGAIN` 不能直接认定为“没有安装 Git”，还需检查进程资源及系统的启动限制。

### 2. 页面与资源 404

404 表示请求地址没有找到对应资源。先记录浏览器网络面板里的完整请求 URL，再分别核对源文件、构建产物和部署前缀；不要只凭页面空白修改 CSS。

| 现象 | 常见原因 | 判断与处理 |
|------|----------|------------|
| 开发服务能打开，部署后 CSS 或 JavaScript 404 | `base` 与实际托管前缀不一致 | 对照失败请求和站点 URL，修改 `base` 后重新构建并部署 |
| 文章导航打开不存在的页面 | 链接路径与真实文件不一致 | 核对 `writing.md` 的位置、大小写和导航配置，重新构建 |
| 点击可进入，直接访问或刷新无后缀路径却 404 | 启用了 `cleanUrls`，服务器未提供 HTML 映射 | 关闭该选项重新构建，或配置托管服务的映射并复测直达地址 |
| Logo 或 favicon 404 | 文件没有放入 `public`，或 `href` 包含了错误的 `public` 路径 | 检查产物中是否有文件，再对照公开 URL 修正 |
| 首页显示配置文字，或没有首页布局 | Frontmatter 分隔符缺失或 `home` 大小写错误 | 对照首页完整文件修正，检查首行和结束分隔符 |

::: warning 保留死链检查
`ignoreDeadLinks: false` 保留 Markdown 内容链接的构建检查，发现错误应修正链接或创建缺少的目标页面。这个检查不能代替浏览器验证导航、远端地址和图片请求；不要设为 `true` 后把构建通过当作问题已解决。
:::

### 3. 工作流与发布错误

Actions 的 `build` 和 `deploy` 有明确先后关系。安装或构建失败时还没有可发布产物，应该先修复构建；上传失败时核对产物目录；部署失败时再检查 Pages 设置和权限。

| 失败位置 | 核对对象 | 恢复方式 |
|----------|----------|----------|
| 安装依赖 | 是否提交锁文件，pnpm 版本是否一致 | 本地复现安装、提交正确锁文件后重新运行 |
| 构建 | 是否使用正确根目录，配置与链接是否有效 | 执行同一 `docs:build` 命令，修复错误后提交 |
| 上传 Artifact | `docs/.vitepress/dist` 是否实际存在 | 对照脚本的 VitePress 根目录修正上传路径 |
| 部署 Pages | Source 是否为 Actions，权限与环境规则是否允许部署 | 修正仓库设置或权限，再重新运行工作流 |
| 部署成功但页面异常 | 是否上传新产物，`base` 是否正确 | 本地预览同一产物，通过后重新发布并检查直达链接 |

已完成部署的结果，应通过页面和网络请求复测确认。仅看到工作流绿色状态，不能证明所有文章与资源都能访问。

## 九、验证结果与边界

本文示例已在 Windows、Node.js 22.19.0、pnpm 10.21.0 和 VitePress 1.6.4 环境中从空目录复现，使用正文展示的文件，包含默认主题的 CSS 扩展。实际检查结果如下：

| 检查对象 | 执行与结果 |
|----------|------------|
| 依赖与锁文件 | `pnpm install` 安装 VitePress 1.6.4，随后执行 `pnpm install --frozen-lockfile` 通过 |
| 静态构建 | `pnpm run docs:build` 通过，生成首页、`guide/writing.html` 和静态资源 |
| 页面访问 | 生产预览中，首页按钮、文章导航、文章直接访问和刷新均正常 |
| 本地搜索 | 查询“评审记录”后能够找到并跳转到文章对应标题 |
| 默认主题扩展 | 在 1365 × 900 和 390 × 844 视口检查页面，完成外观切换及手机菜单操作，手机整页没有横向溢出 |
| 页面运行 | 浏览器未出现页面脚本异常或本地资源 HTTP 错误 |
| 发布配置 | 工作流 YAML 解析通过，安装版本、任务依赖、授权字段和产物目录已核对；未执行远端推送与线上部署 |

::: info 本地验证与线上验证的范围不同
GitHub Pages 的线上结果依赖自己的仓库、权限、网络和工作流执行，仍需按发布小节检查真实站点。可选图片、基于 Git 历史的更新时间，以及第三方统计或广告接入，不在上述完整执行范围内。
:::

这条流程覆盖静态文档站的创建与发布准备。自定义 Vue 组件、业务接口、权限控制和远端搜索仍有各自的接入与验证要求，应在确有需求时按官方资料实施。
