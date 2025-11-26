# 项目实战-vue3PC

## 一、项目背景
>[!tip]
>- 本项目基于`vue3.0+typescript+element-plus`开发。
>- 主要功能为PC端后台管理系统，主要实现网站的前后端分离，实现等功能。

## 二、创建项目
>[!tip]
>[vite官网示例](https://vitejs.cn/vite3-cn/guide/#scaffolding-your-first-vite-project)
```bash
# 创建项目文件夹
mkdir vue3_cms
cd vue3_cms
```

::: code-group
```sh [pnpm]
# 初始化项目 
pnpm create vite
```
```sh [npm]
# 初始化项目 集成
npm create vite@latest
```

```sh [yarn]
# 初始化项目
yarn create vite

```
:::

## 三、 搭建规范
### 3.1 集成 editorconfig
>[!tip] 
> EditorConfig 是一个跨平台的文本编辑器配置定义文件，它帮助开发者在不同的编辑器和 IDE 之间定义和维护一致的编码风格。
::: details 点击查看配置
```
# 根目录下创建.editorconfig 文件
root = true

[*] # 表示所有文件
charset = utf-8 # 设置文字编码字符集为 UTF-8
indent_style = space # 缩进风格(space|tab)
indent_size = 2 # 缩进大小
end_of_line = lf # 换行类型(lf|cr|crlf)
trim_trailing_whitespace = true # 去除行尾空白
insert_final_newline = true # 始终在文件末尾插入一个空行

[*.md] # 表示所有 md 文件适用以下配置
max_line_length = off # 最大行长度
trim_trailing_whitespace = false # 保留 md 文件末尾的空白

```
:::
 
>[!warning]注
>vscode需要安装插件 `EditorConfig for VS Code`

### 3.2、 代码格式化
>[!tip]
> Prettier 是一个代码格式化工具，它可以自动化地将代码格式化为符合预设规则的风格。
#### 3.2.1、 安装 Prettier 依赖
```bash
# 安装 prettier 插件
pnpm install -D prettier
```
#### 3.2.2、 配置 .prettierrc 文件
>[!tip]
> - useTabs: 是否使用 tab 进行缩进，默认为 false
> - tabWidth: tab 缩进的宽度，默认为 2
> - printWidth: 代码超过多少行自动换行，默认为 80
> - semi: 是否使用分号结尾，默认为 true
> - singleQuote: 是否使用单引号，默认为 false
> - trailingComma: 是否使用尾逗号，默认为 es5
> - bracketSpacing: 是否在对象字面量中加上空格，默认为 true
> - arrowParens: 箭头函数参数括号，默认为 always
::: details 点击查看配置
```json
// 根目录下创建.prettierrc 文件
{
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "trailingComma": 'es5',
  "bracketSpacing": true,
  "arrowParens": 'always',
  "singleQuote": true,
}
```
:::
#### 3.2.3、 创建.prettierignore 忽略文件
::: details 点击查看配置
```
# 根目录下创建.prettierignore 文件
/dist/*
.local
.output.js
/node_modules/**

**/*.svg
**/*.sh
/public/*
```
:::
#### 3.2.4、 安装 VSCode扩展 `Prettier - Code formatter`
>[!tip]
> - vsocde 首选项-->设置-->formatter on save 选中--> 搜索 editor: Default Formatter 选择 prettier - code formatter
#### 3.2.5、 VSCode中的配置
>[!tip]
> 1. 打开设置面板，搜索 `prettier` 并找到 `Format on Save` 选项，选择 `true` 即可。
> 2. 打开设置面板，搜索 `prettier` 并找到 `Editor: Default Formatter` 选项，选择 `prettier` 即可。


### 3.3 代码规范检查
#### 3.3.1、 安装 eslint 依赖
```bash
# 安装 eslint 插件
pnpm install -D eslint
pnpm install -D eslint-plugin-prettier eslint-config-prettier # 保证 eslint 与 prettier 格式化规则一致
```
#### 3.2.1、 配置 .eslintrc.js 文件
::: details 点击查看配置
```js
// 根目录下创建.eslintrc.js 文件
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/typescript/recommended',
    '@vue/prettier',
    '@vue/prettier/@typescript-eslint',
    'plugin:prettier/recommended', // 关键配置， 启用 prettier 插件

  ],
  parserOptions: {
    ecmaVersion: 2021,
    parser: '@typescript-eslint/parser',
    sourceType:'module'
  },
  plugins: [
    'vue'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production'? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production'? 'warn' : 'off'
  }
}
```
:::
#### 3.2.2、 安装 eslint 扩展
>[!tip]
> - vscode 扩展插件：eslint




### 3.4、 代码提交规范
>[!tip]
> - commitizen/commitlint/husky 三者配合使用，可以有效地规范 git commit 信息。
> - `commitizen` 是一个用来规范 git commit message 的工具，它会根据指定的格式，提示用户输入符合格式的 commit message。
> - `commitlint` 是一个用来 lint git commit message 的工具，它会检查提交信息是否符合指定的格式。
> - `husky` 是一个 git hook 工具，它可以帮助我们在 git commit 之前，对提交信息进行校验。
#### 3.4.1、 安装依赖
```bash
pnpm install @commitlint/config-conventional @commitlint/cli -D
```
##### 3.4.2、配置 commitlint.config.js 文件
```js
// 根目录下创建 commitlint.config.js 文件
module.exports = {
  extends: ['@commitlint/config-conventional']
}
```
#### 3.4.3、 使用husky生成commit-msg文件，验证commit信息
```bash
npx husky add .husky/commit-msg "npx --no-install commitlint --edit $1"
```


## 四、 项目配置
### 4.1、 配置全局样式
```bash
# 新建 styles 文件夹
mkdir src/styles
```

### 4.2、 配置路由
```bash
# 新建 router 文件夹
mkdir src/router
mkdir src/router/index.ts
```
::: details 路由配置
```typescript
// main.ts
import router from './router'
const app = createApp(App)
app.use(router)
app.mount('#app')
```

```typescript
// src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
// import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    // component: Home
    component: () => import('../views/Home.vue') //懒加载
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
```
:::
### 4.3、 配置 store


