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
- 必须安装Node.js [Node.js下载地址](https://nodejs.org/zh-cn/)
- 建议安装vscode编辑器 [vscode下载地址](https://code.visualstudio.com/)
- 安装git [git下载地址](https://git-scm.com/downloads)


::: details 
```sh [npm]
# 使用 npm 安装
npm install -g pnpm
```
:::

## 二、安装

### 安装vitepress
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
### 初始化向导
```bash        
# 使用 pnpm 安装
pnpm vitepress init
```
::: details 

如果你直接回车，则是放在了根目录 ./，那你的 脚本命令 也要修改一下    
:::

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
### 脚本命令
> 默认不用改，在 package.json 中可以查看

::: warning 注意
如果你在初始化的时候选择了 ./ ，而不是 ./doc，这里就需要修改
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

### gitignore文件
> 添加 `.gitignore` 文件，主要用于上传到gitee/github时，忽略这些文件不上传
```bash
node_modules
dist
.vitepress/dist
```
## 三、启动项目
> 本地启动开发环境，来开发你的网站
```bash
pnpm run docs:dev
```
生成了一个本地 5173 端口的链接，复制到浏览器打开进行预览
```
D:\vitepress>pnpm run docs:dev

> @ docs:dev D:\vitepress
> vitepress dev docs


  vitepress v1.3.4

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```
> 按 `Ctrl+C`键 即可退出开发模式




## 四、配置
### 目录结构
```
.
├─ docs
│  ├─ .vitepress
│  │  └─ config.mts          <-- 配置文件已由ts变成mts
│  ├─ api-examples.md        <-- 文章1
│  ├─ markdown-examples.md   <-- 文章2
│  ├─ guide                  <-- 新增目录
│  │   └─ index.md           <-- 新增目录的首页
│  └─ index.md               <-- 首页
└─ package.json
```
生成的 HTML 页面会是这样：
```
api-examples.md         -->    /api-examples.html
markdown-examples.md    -->    /markdown-examples.html
index.md                -->    /index.html (可以通过 / 访问)
guide/index.md          -->    /guide/index.html (可以通过 /guide/ 访问)

```

> 展开右侧目录，找到 config.mts

```
.
├─ docs
│  ├─ .vitepress
│  │  └─ config.mts           <--  配置文件，支持js、ts、mjs、mts
│  ├─ api-examples.md
│  ├─ markdown-examples.md
│  └─ index.md
└─ package.json
```
配置config.mts文件，修改其中的配置项。
```js
import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "My Awesome Project",
  description: "A VitePress Site",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
```

## 五、目录结构

```
.
├── docs
│   ├── .vitepress
│   │   ├── config.js
│   │   ├── styles
│   │   │   ├── index.styl
│   │   ├── components
│   │   │   ├── MyComponent.vue
│   ├── index.md
│   ├── about.md
│   ├── guide
│   │   ├── index.md
│   │   ├── getting-started.md
│   ├── config.md
│   ├── cli.md
│   ├── api.md
├── package.json
├── vite.config.js
```

1. `docs` 目录是你的文档目录，里面包含了所有的markdown文件。
2. `.vitepress` 目录是vitepress的配置文件目录。
3. `config.js` 是vitepress的配置文件。
4. `styles` 目录是vitepress的样式文件目录。
5. `components` 目录是vitepress的组件目录。
6. `index.md` 是首页的markdown文件。
7. `about.md` 是关于页面的markdown文件。
8. `guide` 目录是指南页面的目录。
9. `getting-started.md` 是指南页面的markdown文件。
10. `config.md` 是配置页面的markdown文件。
11. `cli.md` 是命令行页面的markdown文件。
12. `api.md` 是API页面的markdown文件。
13. `package.json` 是npm的配置文件。
14. `vite.config.js` 是vite的配置文件。

## 六、配置

vitepress的配置文件是`.vitepress/config.js`，它包含了vitepress的所有配置项。

```js
module.exports = {
  title: 'My Blog',
  description: 'My personal blog',
  base: '/', // 部署到github pages，需要设置'/++yourGithubRepoName++'
  head: [
    ['link', { rel: 'icon', href: '/logo.png' }]
  ],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Config', link: '/config/' },
      { text: 'CLI', link: '/cli/' },
      { text: 'API', link: '/api/' }
    ],
    sidebar: [
      '/',
      '/guide/',
      '/config/',
      '/cli/',
      '/api/'
    ]
  }
}
```

## 七、页面

### 站点配置
#### 元数据
> 包含了 `lang` `title` `description` 信息
```js
import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN', //语言，可选 en-US
  title: "VitePress", //站点名
  description: "我的vitpress文档教程",  //站点描述
})
```
#### 网页标题
> 包含了 `title` `description` 信息
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
#### Fav图标
> 路径默认public目录，在 `docs`目录下新建 `public`目录即可
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
如果你使用路径 /logo.png 无反应，可尝试先用相对路径 ../public/logo.png

另：如果你的 Base 设置非根目录，fav图标路径也要做出改变
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
#### 忽略死链
::: warning 
不建议配置，当你的链接指向路径错误，自动忽略会导致问题无法排查

```js
export default defineConfig({
  ignoreDeadLinks: false //关闭忽略死链，不配置即可，非常不建议设置为true
})
```
:::
#### Logo
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
config.mts文件中配置logo
```js
import { defineConfig } from 'vitepress'
export default defineConfig({
  //logo
  logo: '/logo.png',
})
```
### 导航栏
::: tip 说明
text是导航中显示的文本

link为链接或者实际文件的路径，不带 .md 前缀，并始终以 / 开头
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
> 自带的社交图标有以下这些
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
> 自定义图标
```js
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
> 本地的 minisearch 和 Algolia DocSearch 都是全局搜索都好用

#### 本地搜索
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

### 首页
>  Frontmatter ，在 index.md 中进行配置和修改
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

### 编辑本页
### 上次更新
> 添加页面的更新时间
::: details 报错：spawn git EAGAIN
原因：没有 安装git ，配置 lastUpdated 必须安装

相关：打开项目时，也会提示 未找到 Git。请安装 Git，或在 "git.path" 设置中配置

解决：安装好git后，打开VScode - 文件 - 首选项 - 设置 - 搜索 git.path - 点击 在 settings.json 中编辑，添加正确的 git.path 安装路径
```json
{
    "[vue]": {
        "editor.defaultFormatter": "Vue.volar"
    },
    "git.path": "D:\Program Files\Git\bin\git.exe", // Windows默认反斜杠是错的 // [!code --]
    "git.path": "D:/Program Files/Git/bin/git.exe", // 请使用正确Linux的斜杠 // [!code ++]
}
```
:::

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

## 八、静态部署到 GitHub Pages
### Base
::: warning 
base必须配置，否则打包会丢失css样式！！

根目录配置 /，那么对应 https://yiov.github.io/

仓库 vitepress 配置 /vitepress/ ，那么对应 https://yiov.github.io/vitepress
:::

```js
export default defineConfig({
    base: '/', //网站部署的路径，默认根目录
    // base: '/vitepress/', //网站部署到github的vitepress这个仓库里
})
```
::: wanring 
另一个要注意的点，部署到非根目录，你的 Fav图标路径 也要变动一下
:::

```js
export default defineConfig({

  //fav图标
  head: [
    ['link',{ rel: 'icon', href: '/vitepress/logo.png'}], //部署到vitepress仓库
  ],

})
```

### 部署
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
> 构建完成后，将 dist 文件夹里的文件全部上传到 GitHub Pages 仓库的 gh-pages 分支下，然后访问 https://yiov.github.io/vitepress/ 即可访问部署好的网站。
>
::: details 如果你需要本地预览，可以使用 `vitepress preview` 命令，它会启动一个本地服务器，并打开浏览器访问 http://localhost:3000/vitepress/ 。