---
title: "vitepress建站教程"
category: "博客相关"
tags:
  - Vite
excerpt: "欢迎来到vitepress建站教程！ vitepress是一个基于vitepress和vuepress的静态网站生成器，它使用Vue组件来开发文档，并使用markdown文件来编写文档内容。它可以让你专注于内容创作，而不用担心网站的构建和部..."
---

# vitepress建站教程

::: tip 提示 :bulb:
欢迎来到vitepress建站教程！
vitepress是一个基于vitepress和vuepress的静态网站生成器，它使用Vue组件来开发文档，并使用markdown文件来编写文档内容。它可以让你专注于内容创作，而不用担心网站的构建和部署。
:::


## 一、快速开始

### 在线尝试
::: tip 提示
在线体验以及调试[stackblitz](https://stackblitz.com/edit/vite-kowtz8?file=docs%2Findex.md)。
:::

### vitepress相关文档
- [vitepress中文网](https://vitejs.cn/vitepress/)
- [vuepress站点配置](https://vitepress.qzxdp.cn/reference/site-config.html)

### 前期准备
::: tip 提示
1. 必须安装`Node.js` ： [Node.js下载地址](https://nodejs.org/zh-cn/)
2. 安装`vscode`编辑器 ： [vscode下载地址](https://code.visualstudio.com/)
3. 安装`git` ：[git下载地址](https://git-scm.com/downloads)
4. 安装`pnpm` ：[pnpm下载地址](https://pnpm.io/installation) ， node终端运行：`npm install -g pnpm`
:::

```sh [npm]
# 使用 npm 安装
npm install -g pnpm
```

## 二、安装
### 2.1 创建一个目录
```sh
mkdir Docs  # 创建一个目录Docs
cd ./Docs  # 进入目录
```
### 2.2 安装 vitepress 依赖
::: code-group

```sh [npm]
# 使用 npm 安装
npm install -D vitepress
```
```sh [pnpm]
# 使用 pnpm 安装
pnpm install -D vitepress
```

```sh [yarn]
# 使用 yarn 安装
yarn add -D vitepress
```
:::

### 2.3 初始化向导
::: code-group
```sh [npm]
# 使用 npm 安装
npx vitepress init
```
```sh [pnpm]
# 使用 pnpm 安装
pnpm run vitepress init
```
```sh [yarn]
# 使用 yarn 安装
yarn vitepress init
```
:::

>[!danger] 注意
>- 如果你直接回车，则是放在了根目录 ./，那你的脚本命令 也要修改一下    

```bash
T   Welcome to VitePress!
|
o  Where should VitePress initialize the config?
|  ./docs
|
o  Site title:
|  My Awesome Project
|
o  Site description:
|  A VitePress Site
|
o  Theme:
│  ○ Default Theme (Out of the box, good-looking docs)
│  ● Default Theme + Customization
│  ○ Custom Theme
|
o  Use TypeScript for config and theme files?
|  Yes
|
o  Add VitePress npm scripts to package.json?
|  Yes
|
—  Done! Now run npm run docs:dev and start writing.
```

### 2.4 脚本命令

:::danger 注意
- 默认不用改，在 package.json 中可以查看
- 如果你在初始化的时候选择了 `./` ，而不是 `./doc`，这里就需要修改
:::

```js
{
  "devDependencies": {
    "vitepress": "^1.3.4"
  },
  "packageManager": "pnpm@8.6.10+sha1.98fe2755061026799bfa30e7dc8d6d48e9c3edf0",
  "scripts": { 
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  }
}
```

### 2.5 gitignore文件
>[!tip] 忽略文件
> 添加 `.gitignore` 文件，主要用于上传到gitee/github时，忽略这些文件不上传
```bash
node_modules
dist
.vitepress/dist
```
## 三、启动项目
>[!tip]
> 1. 本地启动项目，命令行运行 `pnpm run docs:dev`
> 2. 发布项目，命令行运行 `pnpm run docs:build`
> 3. 预览项目，命令行运行 `pnpm run docs:preview`
> 4. 访问项目，浏览器输入 `http://localhost:5173/`
> 5. 退出项目运行，终端中 按`ctrl+c`
::: code-group
```sh [npm]
# 使用 npm
npm run docs:dev
```
```sh [pnpm]
# 使用 pnpm
pnpm run docs:dev
```
```sh [yarn]
# 使用 yarn
yarn run docs:dev
```
:::


```
D:\vitepress>pnpm run docs:dev

> @ docs:dev D:\vitepress
> vitepress dev docs


  vitepress v1.3.4

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```


## 四、目录结构
::: tip 提示
- 生成的目录结构如下，其中 `docs` 目录是默认的，你可以根据自己的需求进行调整。
:::

```md
.
├─ .github                       
│  └─ workflows                  
│       └─ deploy.yml            --> 这个文件自建，用于部署脚本
├─ docs
│  ├─ .vitepress
│  │    ├─ components            --> 这个目录自建，用于存放组件
│  │    │    └─ gitalk.vue       --> 这个文件自建，用于引入gitalk
│  │    ├─ theme                 --> 这个目录自建，用于存放主题相关文件
│  │    │    ├─ custom.css       --> 这个文件自建，用于存放自定义样式
│  │    │    └─ index.ts         --> 这个文件自建，用于引入主题和组件
│  │    └─ config.mts
│  ├─ blog                       --> 这个目录自建，用于存放博客内容
│  ├─ public                     --> 这个目录自建，用来存放公共资源等，引用的时候路径不需要包含public
│  │    ├─ logo.ico              --> 浏览器图标，自己找图
│  │    └─ logo.png              --> 首页右侧图片和logo，自己找图
│  ├─ api-examples.md
│  ├─ markdown-examples.md
│  └─ index.md
└─ package.json

```


生成的 HTML 页面会是这样：
```
api-examples.md         -->    /api-examples.html
markdown-examples.md    -->    /markdown-examples.html
index.md                -->    /index.html (可以通过 / 访问)
guide/index.md          -->    /guide/index.html (可以通过 /guide/ 访问)

```
## 五、页面
### 元数据
```js
import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN', //语言，可选 en-US
  title: "VitePress", //站点名
  description: "我的vitpress文档教程",  //站点描述
})
```
### 首页

```md 
<!-- ./docs/index.md -->
layout: Home

hero:
  name: "献苓"
  text: "学习笔记，经验心得"
  tagline: /斜杠青年/人间清醒/工具控/
  image:
    src: /developer.gif
    # src: /avatar.png
    alt: 头像
  actions:
    - theme: brand
      text: 进入主页
      link: /articles/

    - theme: alt
      text: 个人成长
      link: /api-examples

features:
  - title: web前端
    icon: 🤹
    #   src: /title1.svg
    details: 某互联网厂搬砖。
  - title: 喜欢美学
    icon: 🎨
    #   src: /develop.svg
    details: 热爱美学，喜欢用自定义各类主题，更加个性化。
  - title: 斜杠青年
    icon: 🧩
    #   src: /title2.svg
    details: 平平无奇但却热爱学习的斜杠青年。

```
### 主题配置
::: tip 说明
1. 编辑`./docs/.vitepress/theme/index.ts`
2. 引入默认主题
3. 引入自定义css文件
4. 参考链接 :  [VitePress官方github 链接](https://github.com/vuejs/vitepress/blob/main/src/client/theme-default/styles/vars.css)
:::
```ts
// ./docs/.vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme';
import './custom.css';

export default {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp(ctx)
  },
};
```

```css
/* ./docs/.vitepress/theme/custom.css */
/* 自定义样式 */
/* 整体配色改成绿色 */
:root {
    --vp-c-green-1: #52b788;
    --vp-c-green-2: #52b788;
    --vp-c-green-3: #52b788;
    --vp-c-green-soft: rgba(16, 185, 129, 0.16);
}
/* 整体配色改成绿色（暗黑模式） */
.dark {
    --vp-c-green-1: #52b788;
    --vp-c-green-2: #52b788;
    --vp-c-green-3: #52b788;
    --vp-c-green-soft: rgba(16, 185, 129, 0.16);
}
/* 整体配色改成绿色 */
:root {
    --vp-c-brand-1: var(--vp-c-green-1);
    --vp-c-brand-2: var(--vp-c-green-2);
    --vp-c-brand-3: var(--vp-c-green-3);
    --vp-c-brand-soft: var(--vp-c-green-soft);
}
:root {
  /* 设置主题字体颜色 */
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe, #41d1ff);

  /* 设置右图像渐变 */
  --vp-home-hero-image-background-image: linear-gradient( -45deg, #6a00f4 30%, #ffffff 70% );
  --vp-home-hero-image-filter: blur(130px);
}

/* 引用块配色 */
.vp-doc blockquote {
  background-color: #ecf8f3;
  border-left: solid #42b983 !important;;
}
/* 引用块配色（暗黑模式） */
.dark .vp-doc blockquote {
  background-color: #4a5f53;
  border-left: solid #b9eed6 !important;;
}
/* 引用块配色（暗黑模式字体） */
.dark .vp-doc blockquote > p {
  color: #92cab2;
}
```



### 网页标题
```js
export default defineConfig({
  lang: 'zh-CN',
  title: "VitePress",
  description: "我的vitpress文档教程", //我的文字有下划线，请后期再查看 `组件 - 首页文字下划线`
  titleTemplate: '另起标题会覆盖title', 
  // titleTemplate: ':title - 快速上手', //完全自定义标题，:title 不要动，改后面的
  // titleTemplate: false, //关闭标题
})
```
### Fav图标
>[!tip]
>- 路径默认public目录，在 `docs`目录下新建 `public`目录即可
```js
import { defineConfig } from 'vitepress'
export default defineConfig({
  //fav图标
  head: [
    ['link',{ rel: 'icon', href: '/logo.png'}],
  ],

})
```
::: danger 注意
1. 如果你使用路径 /logo.png 无反应，可尝试先用相对路径 `../public/logo.png`
2. 如果你的 `Base` 设置非根目录，fav 图标路径也要做出改变。
:::


::: details Head的其他配置
::: code-group
```sh [添加谷歌字体]
export default defineConfig({
  head: [
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' }
    ],
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
    ],
    [
      'link',
      { href: 'https://fonts.googleapis.com/css2?family=Roboto&display=swap', rel: 'stylesheet' }
    ]
  ]
})
```
```sh [添加谷歌分析]
export default defineConfig({
  head: [
    [
      'script',
      { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=TAG_ID' }
    ],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'TAG_ID');`
    ]
  ]
})
```
:::
### 忽略死链
::: warning 
- 不建议配置，当你的链接指向路径错误，自动忽略会导致问题无法排查
:::

```js
export default defineConfig({
  ignoreDeadLinks: false //关闭忽略死链，不配置即可，非常不建议设置为true
})
```
### Logo
>[!tip]
> 路径默认public目录，在 `docs`目录下新建 `public`目录即可

```md
.
├─ docs
│  ├─ .vitepress
│  │  └─ config.mts
│  └─ public             <--静态资源目录
│  │  └─ logo.png        <--logo
│  └─ index.md
└─ package.json
```
```js
// config.mts文件中配置logo
import { defineConfig } from 'vitepress'
export default defineConfig({
  //logo
  logo: '/logo.png',
})
```
### 导航栏
::: tip 说明
- `text`是导航中显示的文本
- `link`为链接或者实际文件的路径，不带 .md 前缀，并始终以 / 开头
:::

```js
export default defineConfig({

  themeConfig: {
    //导航栏
    nav: [
      { text: '首页', link: '/' }, 
      {
        text: '指南',
        items: [
          { text: '前言', link: '/preface' },
          { text: '快速上手', link: '/getting-started' },
          { text: '配置', link: '/configuration' }
        ]
      },
      { text: 'VitePress', link: 'https://vitepress.dev/' },
    ], 
  },

})
```
给下拉菜单赋予分组标题，就要再次嵌套 `iteams`
```js
export default defineConfig({

  themeConfig: {
    //导航栏
    nav: [
      { text: '首页', link: '/' },
      {
        text: '指南',
        items: [
          {
            // 分组标题1
            text: '介绍',
            items: [
              { text: '前言', link: '/preface' },
            ],
          },
          {
            // 分组标题2
            text: '基础设置',
            items: [
              { text: '快速上手', link: '/getting-started' },
              { text: '配置', link: '/configuration' },
              { text: '页面', link: '/page' },
              { text: 'Frontmatter', link: '/frontmatter' },
            ],
          },
          {
            // 分组标题3
            text: '进阶玩法',
            items: [
              { text: 'Markdown', link: '/Markdown' },
              { text: '静态部署', link: '/assets' },
            ],
          },
        ],
      },
      { text: 'VitePress', link: 'https://vitepress.dev/' },
    ],
  },

})
```
如果不喜欢外部链接，有个箭头↗ 图标，可以选择关闭
```js
export default defineConfig({

  themeConfig: {
    //导航栏
    nav: [
      { text: '首页', link: '/' },
      
      { text: 'VitePress', link: 'https://vitepress.dev/zh/' , noIcon: true },
    ],
  },

})
```
### 版本号
::: details 方式有两种，按需配置即可
::: code-group

```ts [安装@types/node]
// 需要先安装 pnpm add -D @types/node
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pkg = require('vitepress/package.json')

export default defineConfig({

  themeConfig: {
    //导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: `VitePress ${pkg.version}`, link: 'https://vitepress.dev/zh/', noIcon: true },
    ],
  },

})
```
```ts [不安装@types/node]
import { devDependencies } from '../../package.json'

export default defineConfig({

  themeConfig: {
    //导航栏
    nav: [
      { text: '首页', link: '/' },
      // 其中的 `replace` 是将版本前的 `^` ，替换成了空白字符
      { text: `VitePress ${ devDependencies.vitepress.replace('^','') }`, link: 'https://vitepress.dev/zh/', noIcon: true },
    ],
  },

})
```
:::


### 社交链接
>[!tip]
> 可以自行添加，支持SVG
```js
export default defineConfig({

  themeConfig: {
    //社交链接
    socialLinks: [ 
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }, 
      { icon: 'twitter', link: 'https://twitter.com/' }, 
      { icon: 'discord', link: 'https://chat.vitejs.dev/' },  
    ], 
  },

})
```
自带的社交图标有以下这些:
```js
/* node_modules\vitepress\types\default-theme.d.ts */
export type SocialLinkIcon =
    | 'discord'
    | 'facebook'
    | 'github'
    | 'instagram'
    | 'linkedin'
    | 'mastodon'
    | 'slack'
    | 'twitter'
    | 'x'
    | 'youtube'
    | { svg: string }
```
```js
// 自定义图标
export default defineConfig({

  themeConfig: {
    //自定义社交链接 
    socialLinks: [
      {
        icon: {
          svg: '<svg t="1703483542872" class="icon" viewBox="0 0 1309 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6274" width="200" height="200"><path d="M1147.26896 912.681417l34.90165 111.318583-127.165111-66.823891a604.787313 604.787313 0 0 1-139.082747 22.263717c-220.607239 0-394.296969-144.615936-394.296969-322.758409s173.526026-322.889372 394.296969-322.889372C1124.219465 333.661082 1309.630388 478.669907 1309.630388 656.550454c0 100.284947-69.344929 189.143369-162.361428 256.130963zM788.070086 511.869037a49.11114 49.11114 0 0 0-46.360916 44.494692 48.783732 48.783732 0 0 0 46.360916 44.494693 52.090549 52.090549 0 0 0 57.983885-44.494693 52.385216 52.385216 0 0 0-57.983885-44.494692z m254.985036 0a48.881954 48.881954 0 0 0-46.09899 44.494692 48.620028 48.620028 0 0 0 46.09899 44.494693 52.385216 52.385216 0 0 0 57.983886-44.494693 52.58166 52.58166 0 0 0-57.951145-44.494692z m-550.568615 150.018161a318.567592 318.567592 0 0 0 14.307712 93.212943c-14.307712 1.080445-28.746387 1.768001-43.283284 1.768001a827.293516 827.293516 0 0 1-162.394168-22.296458l-162.001279 77.955749 46.328175-133.811485C69.410411 600.858422 0 500.507993 0 378.38496 0 166.683208 208.689602 0 463.510935 0c227.908428 0 427.594322 133.18941 467.701752 312.379588a427.463358 427.463358 0 0 0-44.625655-2.619261c-220.24709 0-394.100524 157.74498-394.100525 352.126871zM312.90344 189.143369a64.270111 64.270111 0 0 0-69.803299 55.659291 64.532037 64.532037 0 0 0 69.803299 55.659292 53.694846 53.694846 0 0 0 57.852923-55.659292 53.465661 53.465661 0 0 0-57.852923-55.659291z m324.428188 0a64.040926 64.040926 0 0 0-69.574114 55.659291 64.302852 64.302852 0 0 0 69.574114 55.659292 53.694846 53.694846 0 0 0 57.951145-55.659292 53.465661 53.465661 0 0 0-57.951145-55.659291z" p-id="6275"></path></svg>'
        },
        link: 'https://weixin.qq.com/',
        // You can include a custom label for accessibility too (optional but recommended):
        ariaLabel: 'wechat'
      }
    ], 
  },

})
```
### 深浅模式文字
>[!tip]
> 手机端默认显示 Appearance ，你也可以自定义显示文字
```js
export default defineConfig({

  themeConfig: {
    //手机端深浅模式文字修改
    darkModeSwitchLabel: '深浅模式', 
  },

})
```

### 搜索框
>[!tip]
> 本地的 minisearch 和 Algolia DocSearch 都是全局搜索都好用

#### 本地搜索
>[!tip]
>  得益于 minisearch，VitePress 支持使用浏览器内索引进行模糊全文搜索
```js
export default defineConfig({

  themeConfig: {
    //本地搜索
    search: { 
      provider: 'local'
    }, 
  },

})
```
如果你搭建了多语言站点，可以更细致的配置搜索
```js
export default defineConfig({

  themeConfig: {
    //本地搜索
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换'
                },
              },
            },
          },
        },
      },
    },
  },

})
```


### 侧边栏
```js
export default defineConfig({

  themeConfig: {
    //侧边栏
    sidebar: [
      {
        //分组标题1
        text: '介绍',
        items: [
          { text: '前言', link: '/preface' },
        ],
      },
      {
        //分组标题2
        text: '基础配置',
        items: [
          { text: '快速上手', link: '/getting-started' },
          { text: '配置', link: '/configuration' },
          { text: '页面', link: '/page' },
          { text: 'Frontmatter', link: '/frontmatter' },
        ],
      },
      {
        //分组标题3
        text: '进阶玩法',
        items: [
          { text: 'Markdown', link: '/markdown' },
          { text: '静态部署', link: '/assets' },
        ],
      },
    ],
  },

})
```
#### 多个侧边栏
目录结构如下：
```js
.
├─ guide/
│  ├─ index.md
│  ├─ one.md
│  └─ two.md
└─ config/
   ├─ index.md
   ├─ three.md
   └─ four.md
```
配置如下：
```js
export default defineConfig({

  themeConfig: {
    //侧边栏
    sidebar: {
      // 目录1
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Index', link: '/guide/' },
            { text: 'One', link: '/guide/one' },
            { text: 'Two', link: '/guide/two' }
          ],
        },
      ],

      // 目录2
      '/config/': [
        {
          text: 'Config',
          items: [
            { text: 'Index', link: '/config/' },
            { text: 'Three', link: '/config/three' },
            { text: 'Four', link: '/config/four' }
          ],
        },
      ],
    },
  },

})
```
::: tip 提示
添加 collapsed选项，它会显示一个切换按钮来隐藏/显示
如果你不想开启，将它设为 true ，或者直接不配置
:::

### 上次更新
>[!tip]
> 添加页面的更新时间

::: details 报错：spawn git EAGAIN
- 原因：没有 安装git ，配置 lastUpdated 必须安装
- 相关：打开项目时，也会提示 未找到 Git。请安装 Git，或在 "git.path" 设置中配置
- 解决：安装好git后，打开VScode - 文件 - 首选项 - 设置 - 搜索 git.path - 点击 在 settings.json 中编辑，添加正确的 git.path 安装路径
:::


### 代码 Diff 展示
>[!tip]
>- 代码行`-` ：// [!code --]
>- 代码行`+` ：// [!code ++]


```json
{
    "[vue]": {
        "editor.defaultFormatter": "Vue.volar" 
    },
    "git.path": "D:\Program Files\Git\bin\git.exe", // Windows默认反斜杠是错的 // [!code --]
    "git.path": "D:/Program Files/Git/bin/git.exe", // 请使用正确Linux的斜杠 // [!code ++]
}
```

### 上下页
```js
export default defineConfig({

  themeConfig: {
    //自定义上下页名
    docFooter: { 
      prev: '上一页', 
      next: '下一页', 
    }, 
  },

})
```

### 广告
>[!tip]
> VitePress 内置了对 Carbon 广告 的原生支持

```js
export default defineConfig({

  themeConfig: {
    carbonAds: { 
      code: 'your-carbon-code', 
      placement: 'your-carbon-placement', 
    }， 
  }, 

})
```
### 页脚
```js
export default defineConfig({

  themeConfig: {
    //页脚
    footer: { 
      message: 'Released under the MIT License.', 
      copyright: 'Copyright © 2019-2023 present Evan You', 
      // 自动更新时间
      //copyright: `Copyright © 2019-${new Date().getFullYear()} present Evan You`, 
    }, 
  },

})
```
### 核心配置
>[!tip]
> 在`./docs/.vitepress/config.mts`文件中配置，具体如下:

```js
import { defineConfig } from 'vitepress'

export default defineConfig({
  // 标题（浏览器后缀）
  title: "Goalonez",
  // 描述
  description: "Goalonez Blog",
  // 语言
  lang: 'zh-CN',
  // 根目录，如果需要部署成htpps://github.com/blog/的形式，则设置/blog/
  base: '/',
  // 文档最后更新时间展示
  lastUpdated: true,
  // 去除浏览器链接中的.html后缀
  cleanUrls: true,
  // markdown显示行数
  markdown: {
    lineNumbers: true,
  },
  // head设置
  head: [
    // 浏览器中图标
    ["link", {rel: "icon", href: "/logo.ico"}],
    // 添加百度统计代码
    ['script', {},
    `
      var _hmt = _hmt || [];
      (function() {
        var hm = document.createElement("script");
        hm.src = "https://hm.baidu.com/hm.js?自己申请";
        var s = document.getElementsByTagName("script")[0]; 
        s.parentNode.insertBefore(hm, s);
      })();
    `
    ]
  ],
  // 主题设置
  themeConfig: {
    // 左上角logo
    logo: '/logo.png',
    // 首页右上角导航栏
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Blog', link: '/aboutme' }
    ],
    // 文章左侧导航栏
    sidebar: [
      {
        text: '博客',
        items: [
          { text: 'About Me', link: '/aboutme' }
        ]
      }
    ],
    // 文章底部导航栏的自定义配置，默认是英语
    docFooter: {
			prev: '上一篇',
			next: '下一篇',
		},
    // 文章右侧目录展示级别和标题
    outline: {
      level: [2, 6],
      label: '文章目录'
    },
    // 文章更新时间的前缀文本
    lastUpdatedText: '最后更新时间',
    // 开启本地搜索（左上角）
    search: {
      provider: 'local',
    },
    // 右上角Github链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Goalonez/goalonez.github.io' }
    ],
    // 页脚
    footer: {
			copyright: 'Copyright © 2023-present Goalonez',
		}
  }
})
```


## 六、静态部署到 GitHub Pages
### 1、Base配置
::: warning 
1. **base必须配置**，否则打包会丢失css样式！！
2. 根目录配置`/`，那么对应 `https://yiov.github.io/`
3. 仓库 `vitepress` 配置 `/vitepress/` ，那么对应 `https://yiov.github.io/vitepress`
4. 部署到非根目录，`Fav`图标路径 也要变动一下
:::


::: details 查看Base配置

```js
// 在`./docs/.vitepress/config.ts`文件中配置
import { defineConfig } from 'vitepress'
export default defineConfig({
    base: '/docs/', //网站部署到github的这个仓库名字
    //fav图标
    head: [
      ['link',{ rel: 'icon', href: '/docs/logo.png'}], //部署到vitepress仓库
    ],
})
```
:::


### 2、部署

#### 2.1、手动打包部署
::: details 手动打包命令
::: code-group
```bash [npm]
npm run docs:build
```
```bash [pnpm]
pnpm run docs:build
```
```bash [yarn]
yarn docs:build
```
:::
>[!tip] 提示
>1. 构建完成后，将 dist 文件夹里的文件全部上传到 GitHub Pages 仓库的 gh-pages 分支下;tt
>2. 访问 https://yiov.github.io/vitepress/ 即可访问部署好的网站。
>
#### github actions 自动化部署

> 配置文件 `.github/workflows/deploy.yml`

::: details deploy.yml文件
```yaml
name: docs

on:
  # 每当 push 到 main 分支时触发部署
  push:
    branches: [main]
  # 手动触发部署
  workflow_dispatch:

jobs:
  docs:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          # “最近更新时间” 等 git 日志相关信息，需要拉取全部提交记录
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          # 选择要使用的 pnpm 版本
          version: 9.8.0
          # 使用 pnpm 安装依赖
          run_install: true

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          # 选择要使用的 node 版本
          node-version: 20.17.0
          # 缓存 pnpm 依赖
          cache: pnpm

      # 运行构建脚本
      - name: Build VuePress site
        run: pnpm docs:build

      # 查看 workflow 的文档来获取更多信息
      - name: Deploy to GitHub Pages
        uses: crazy-max/ghaction-github-pages@v4
        with:
          # 部署到 gh-pages 分支
          target_branch: gh-pages
          # 部署目录为 VitePress 的默认输出目录
          build_dir: docs/.vitepress/dist
        env:
          GITHUB_TOKEN: ${{ secrets.ACCESS_TOKEN }}

```
:::

::: tip 提示
1. 首先，我们需要在项目根目录下创建一个 `.github/workflows/deploy.yml` 文件，并在其中添加以下内容：
2. `name: docs` ： 定义工作流程的名称，可以自定义。
3. `on`: 定义触发工作流程的事件，这里我们选择 push 到 main 分支时触发部署，也可以选择手动触发。
4. `jobs`: 定义工作流程的步骤，这里我们只定义一个 docs 步骤。
5. `runs-on`: 定义运行工作流程的机器，这里我们选择 ubuntu-latest。
6. `steps`: 定义工作流程的步骤，这里我们分为以下几步：
7. `uses: actions/checkout@v4 `： 克隆仓库，并拉取全部提交记录。
8. `name: Setup pnpm` ： 安装 pnpm 并缓存依赖。
9. `name: Setup Node.js` ： 安装 Node.js 并缓存依赖。
10. `name: Build VuePress site` ： 运行构建脚本。
11. `name: Deploy to GitHub Pages` ： 部署到 GitHub Pages。
12. `env`: 定义环境变量，这里我们只定义 GITHUB_TOKEN。
13. `GITHUB_TOKEN`: 我们需要在 GitHub 项目设置中添加一个 Access Token，并将其添加到 Secrets 中，以便于 GitHub Actions 部署。
:::


::: warning 注意
如果需要部署到其他分支，比如 `gh-pages`，则需要修改 `target_branch` 字段。
:::

#### 上传代码到远程仓库

>[!note]提示
> - 如果没有配置远程仓库，则需要先配置远程仓库，然后再上传代码。
> - 新建GitHub仓库名为`docs`
> - 将本地代码上传到这个仓库的main分支



```bash
git init
git add.
git commit -m "first commit"
git remote add origin git地址
git pull origin main
git push -u  -f origin main
```
::: tip 配置GitHub token
 - 打开GitHub仓库，点击头像
 - 点击Settings
 - 点击Developer settings
 - 点击Personal access tokens
 - 点击Generate new token
 - 勾选repo，点击Generate token
 - 复制token，点击Done
 - 回到项目根目录，打开`.github/workflows/deploy.yml`文件
 - 点击Secrets
 - 点击New repository secret
 - 输入Name，Value，点击Add secret
 - 输入Name为`ACCESS_TOKEN`，Value为GitHub token，点击Add secret
 - 点击Actions
 - 点击docs
 - 点击Run workflow
 - 点击Actions
 - 点击deploy-docs
 - 点击Details
 - 点击View more actions
 - 点击deploy-docs
 - 点击Run workflow
 - 等待部署完成
:::