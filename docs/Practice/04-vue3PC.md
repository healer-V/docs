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


### 3.2 代码风格检查
```bash
# 安装 eslint 插件
pnpm install -D eslint
```

### 3.3 代码格式化
>[!tip]
> Prettier 是一个代码格式化工具，它可以自动化地将代码格式化为符合预设规则的风格。
#### 3.3.1、 安装 Prettier 插件
```bash
# 安装 prettier 插件
pnpm install -D prettier
```
#### 3.3.2、 配置 Prettier
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

#### 3.3.3、 创建.prettierignore 忽略文件
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
#### 3.3.4、 安装 VSCode 插件 Prettier - Code formatter
>[!tip]
> - vsocde 首选项-->设置-->formatter on save 选中--> 搜索 editor: Default Formatter 选择 prettier - code formatter

### 3.4、 代码提交规范
```bash
# 安装 commitlint 插件
pnpm install -D @commitlint/cli @commitlint/config-conventional
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


