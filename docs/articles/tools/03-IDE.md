---
title: "IDE 配置指南"
category: "开发工具"
excerpt: "IDE（Integrated Development Environment，集成开发环境）是一种用于软件开发的应用软件，集成了代码编辑器、编译器、调试器等多种工具，提供一站式的开发体验。 | IDE | 特点 | 适用场景 | |----..."
---

# IDE 配置指南

## 一、IDE 概述

::: tip 什么是 IDE
IDE（Integrated Development Environment，集成开发环境）是一种用于软件开发的应用软件，集成了代码编辑器、编译器、调试器等多种工具，提供一站式的开发体验。
:::

### 1、主流 IDE 对比

::: info 主流 IDE 特点

| IDE | 特点 | 适用场景 |
|------|------|----------|
| **VS Code** | 轻量、免费、插件丰富 | 前端开发、全栈开发 |
| **WebStorm** | 功能强大、智能提示 | JavaScript/TypeScript 开发 |
| **HBuilderX** | 国产、支持多端 | 小程序、uni-app 开发 |
| **IntelliJ IDEA** | Java 开发首选 | Java、Spring 开发 |
| **PyCharm** | Python 专业 IDE | Python 开发 |

:::

### 2、选择建议

::: details 选择建议
- **前端开发**：推荐 VS Code 或 WebStorm
- **Java 开发**：推荐 IntelliJ IDEA
- **Python 开发**：推荐 PyCharm
- **小程序开发**：推荐 HBuilderX
- **多语言开发**：推荐 VS Code
:::

## 二、VS Code 配置

### 1、基础配置

#### 1.1、推荐主题

::: tip 主题选择
好的主题可以减轻视觉疲劳，提高编码体验。以下是一些广受欢迎的主题。
:::

::: details 常用主题推荐

1. **One Dark Pro** - 最受欢迎的暗色主题
2. **Night Owl** - 专为夜间编程设计
3. **Dracula Official** - 经典的紫色主题
4. **GitHub Theme** - GitHub 官方主题
5. **Material Icon Theme** - Material Design 图标主题
6. **Bearded Theme** - 简洁优雅的主题
7. **Monokai Pro** - 经典 Monokai 主题的升级版
8. **Tokyo Night** - 现代暗色主题

:::

**安装方式：**
1. 打开扩展面板（`Ctrl+Shift+X`）
2. 搜索主题名称
3. 点击安装
4. 按 `Ctrl+K Ctrl+T` 打开主题选择器

#### 1.2、推荐插件

::: info 插件分类
按功能分类的推荐插件，可以根据需要选择性安装。
:::

**AI 编程助手：**
- **Fitten Code** - 国产 AI 编程助手
- **GitHub Copilot** - GitHub 官方 AI 助手
- **Codeium** - 免费 AI 代码补全

**代码质量：**
- **ESLint** - JavaScript/TypeScript 代码检查
- **Prettier** - 代码格式化工具
- **SonarLint** - 代码质量分析

**开发效率：**
- **indent-rainbow** - 缩进高亮显示
- **Path Autocomplete** - 路径自动补全
- **Auto Rename Tag** - 自动重命名配对的 HTML/XML 标签
- **Bracket Pair Colorizer** - 括号配对着色（VS Code 已内置）

**Git 工具：**
- **GitLens** - 强大的 Git 可视化工具
- **Git Graph** - Git 提交历史图形化

**文档工具：**
- **Markdown All in One** - Markdown 增强工具
- **Markdown Preview Enhanced** - Markdown 预览增强

**其他工具：**
- **TODO Highlight** - TODO 标注高亮
- **Chinese (Simplified)** - 中文语言包
- **Remote Repositories** - GitHub 远程仓库预览
- **Thunder Client** - API 测试工具（Postman 替代）
- **REST Client** - REST API 测试

#### 1.3、快捷键配置

::: tip 快捷键
熟练掌握快捷键可以大幅提升开发效率。以下是一些常用快捷键。
:::

**编辑相关：**

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl + D` | 选中相同的文本 | 可连续按多次选中多个 |
| `Ctrl + Shift + L` | 选择所有相同的字符 | 选中所有匹配项 |
| `Ctrl + Shift + D` | 复制行 | 复制当前行到下一行 |
| `Ctrl + X` | 剪切行 | 未选中时剪切整行 |
| `Ctrl + Shift + K` | 删除行 | 删除当前行 |
| `Alt + ↑/↓` | 移动行 | 上下移动当前行 |
| `Shift + Alt + ↑/↓` | 复制行 | 向上/下复制当前行 |
| `Ctrl + ]` | 向右缩进 | 增加缩进 |
| `Ctrl + [` | 向左缩进 | 减少缩进 |
| `Ctrl + Shift + U` | 全部大写 | 转换选中文本为大写 |
| `Ctrl + Shift + I` | 全部小写 | 转换选中文本为小写 |

**查找替换：**

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + F` | 查找 |
| `Ctrl + H` | 替换 |
| `Ctrl + Shift + F` | 全局查找 |
| `F3` | 查找下一个 |
| `Shift + F3` | 查找上一个 |

**文件操作：**

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + N` | 新建文件 |
| `Ctrl + O` | 打开文件 |
| `Ctrl + S` | 保存 |
| `Ctrl + Shift + S` | 另存为 |
| `Ctrl + K S` | 保存所有文件 |
| `Ctrl + W` | 关闭当前标签 |
| `Ctrl + K W` | 关闭所有标签 |

**视图操作：**

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + B` | 切换侧边栏 |
| `Ctrl + J` | 切换面板 |
| `Ctrl + \` | 拆分编辑器 |
| `Ctrl + 1/2/3` | 切换到编辑器组 |

**自定义快捷键：**

```json
// keybindings.json
[
  {
    "key": "ctrl+shift+d",
    "command": "editor.action.copyLinesDownAction"
  },
  {
    "key": "ctrl+shift+u",
    "command": "editor.action.transformToUppercase"
  }
]
```

#### 1.4、代码片段

::: tip 代码片段
代码片段可以快速生成常用代码模板，大幅提升开发效率。
:::

**创建代码片段：**
1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 "Configure User Snippets"
3. 选择语言或 "New Global Snippets file"
4. 编辑 JSON 文件

**代码片段生成工具：**
- [Snippet Generator](https://snippet-generator.app/) - 在线代码片段生成器

**常用代码片段：**

```json
{
  "Vue 3 组件模板": {
    "prefix": "vue3",
    "body": [
      "<template>",
      "  <div class=\"${1:container}\">",
      "    $0",
      "  </div>",
      "</template>",
      "",
      "<script setup lang=\"ts\">",
      "import { ref } from 'vue'",
      "",
      "$2",
      "</script>",
      "",
      "<style lang=\"scss\" scoped>",
      "$3",
      "</style>"
    ],
    "description": "Vue 3 组件模板"
  },
  "Vue 2 组件模板": {
    "prefix": "vue2",
    "body": [
      "<template>",
      "  <div class=\"${1:container}\">",
      "    $0",
      "  </div>",
      "</template>",
      "",
      "<script>",
      "export default {",
      "  name: '${2:ComponentName}',",
      "  data() {",
      "    return {",
      "      $3",
      "    }",
      "  }",
      "}",
      "</script>",
      "",
      "<style scoped>",
      "$4",
      "</style>"
    ],
    "description": "Vue 2 组件模板"
  },
  "React 函数组件": {
    "prefix": "rfc",
    "body": [
      "import React from 'react';",
      "",
      "interface ${1:ComponentName}Props {",
      "  $2",
      "}",
      "",
      "const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = (props) => {",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  );",
      "};",
      "",
      "export default ${1:ComponentName};"
    ],
    "description": "React 函数组件"
  },
  "React Hooks 组件": {
    "prefix": "rhooks",
    "body": [
      "import React, { useState, useEffect } from 'react';",
      "",
      "const ${1:ComponentName} = () => {",
      "  const [${2:state}, set${2/(.*)/${1:/capitalize}/}] = useState(${3:initialState});",
      "",
      "  useEffect(() => {",
      "    $4",
      "  }, []);",
      "",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  );",
      "};",
      "",
      "export default ${1:ComponentName};"
    ],
    "description": "React Hooks 组件"
  },
  "TypeScript 接口": {
    "prefix": "tsinterface",
    "body": [
      "interface ${1:InterfaceName} {",
      "  ${2:property}: ${3:type};",
      "}"
    ],
    "description": "TypeScript 接口"
  },
  "TypeScript 类": {
    "prefix": "tsclass",
    "body": [
      "class ${1:ClassName} {",
      "  ${2:property}: ${3:type};",
      "",
      "  constructor(${4:props}: ${5:Type}) {",
      "    this.${2:property} = ${4:props}.${2:property};",
      "  }",
      "",
      "  ${6:method}(): ${7:ReturnType} {",
      "    $0",
      "  }",
      "}"
    ],
    "description": "TypeScript 类"
  },
  "console.log": {
    "prefix": "clg",
    "body": [
      "console.log('${1:label}:', ${2:value});"
    ],
    "description": "console.log"
  },
  "箭头函数": {
    "prefix": "af",
    "body": [
      "const ${1:functionName} = (${2:params}) => {",
      "  $0",
      "};"
    ],
    "description": "箭头函数"
  }
}
```

**代码片段变量：**
- `${1:name}` - 第一个占位符，可编辑
- `${2:name}` - 第二个占位符
- `$0` - 最终光标位置
- `$TM_FILENAME` - 当前文件名
- `$TM_DIRECTORY` - 当前目录

### 2、高级配置

#### 2.1、settings.json 配置

```json
{
  // 编辑器设置
  "editor.fontSize": 14,
  "editor.fontFamily": "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  "editor.fontLigatures": true,
  "editor.lineHeight": 1.6,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  
  // 文件设置
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "files.encoding": "utf8",
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  
  // 搜索设置
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.git": true
  },
  
  // 终端设置
  "terminal.integrated.fontSize": 14,
  "terminal.integrated.fontFamily": "'JetBrains Mono'",
  
  // 扩展设置
  "eslint.enable": true,
  "prettier.enable": true,
  "git.enableSmartCommit": true,
  "git.confirmSync": false
}
```

#### 2.2、工作区配置

```json
{
  "folders": [
    {
      "path": "."
    }
  ],
  "settings": {
    "editor.tabSize": 2,
    "files.exclude": {
      "**/.git": true,
      "**/node_modules": true
    }
  },
  "extensions": {
    "recommendations": [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode"
    ]
  }
}
```

## 三、WebStorm 配置

### 1、基础配置

#### 1.1、推荐主题

::: details WebStorm 主题推荐

1. **One Dark Theme** - 暗色主题
2. **Atom Material Icons** - Material Design 图标
3. **Material Theme UI** - Material 主题
4. **Dracula Theme** - Dracula 主题

:::

#### 1.2、推荐插件

::: details WebStorm 推荐插件

1. **Fitten Code** - AI 编程助手
2. **One Dark Theme** - 暗色主题
3. **Atom Material Icons** - 图标主题
4. **Rainbow Brackets** - 括号配对着色
5. **String Manipulation** - 字符串处理工具

:::

### 2、快捷键配置

::: tip WebStorm 快捷键
WebStorm 的快捷键与 VS Code 有所不同，以下是一些常用快捷键。
:::

**编辑相关：**

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl + D` | 复制行 | 复制当前行 |
| `Ctrl + X` | 删除行 | 删除当前行（未选中时） |
| `Alt + J` | 选中相同的文本 | 可连续按多次 |
| `Alt + F3` | 选中所有相同的文本 | 选中所有匹配项 |
| `Ctrl + Alt + L` | 格式化代码 | 格式化当前文件 |
| `Ctrl + Shift + ↓` | 移动行下 | 向下移动当前行 |
| `Ctrl + Shift + ↑` | 移动行上 | 向上移动当前行 |
| `Ctrl + Y` | 删除行 | 删除当前行 |
| `Ctrl + Shift + J` | 合并行 | 合并下一行到当前行 |

**导航相关：**

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + G` | 跳转到指定行 |
| `Ctrl + E` | 最近打开的文件 |
| `Ctrl + Tab` | 调出切换器 | 切换标签页和工具窗口 |
| `Alt + →` | 切换下一个标签页 |
| `Alt + ←` | 切换上一个标签页 |
| `Ctrl + B` | 跳转到声明 |
| `Ctrl + Click` | 跳转到定义 |

**代码相关：**

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + Space` | 代码补全 |
| `Ctrl + Shift + Space` | 智能补全 |
| `Ctrl + P` | 参数提示 |
| `Ctrl + Q` | 快速文档 |
| `Ctrl + /` | 行注释 |
| `Ctrl + Shift + /` | 块注释 |
| `Ctrl + Alt + T` | 环绕代码 |
| `Ctrl + Alt + L` | 格式化代码 |

**重构相关：**

| 快捷键 | 功能 |
|--------|------|
| `Shift + F6` | 重命名 |
| `Ctrl + Alt + M` | 提取方法 |
| `Ctrl + Alt + V` | 提取变量 |
| `Ctrl + Alt + C` | 提取常量 |

### 3、代码模板配置

**文件模板：**

```javascript
// Vue 组件模板
<template>
  <div class="$COMPONENT_NAME$">
    $END$
  </div>
</template>

<script>
export default {
  name: '$COMPONENT_NAME$',
  data() {
    return {
      $END$
    }
  }
}
</script>

<style scoped>
.$COMPONENT_NAME$ {
  $END$
}
</style>
```

**代码片段：**

```javascript
// Live Template: rfc
import React from 'react';

const $COMPONENT_NAME$ = () => {
  return (
    <div>
      $END$
    </div>
  );
};

export default $COMPONENT_NAME$;
```

## 四、HBuilderX 配置

### 1、基础配置

#### 1.1、基本设置

::: tip HBuilderX 配置
HBuilderX 是 DCloud 推出的前端开发工具，特别适合小程序和 uni-app 开发。
:::

**推荐配置：**
1. 使用 VS Code 版快捷键（更通用）
2. 启用自动保存
3. 配置代码格式化
4. 设置文件编码为 UTF-8

#### 1.2、主题配置

::: details HBuilderX 主题配置

```json
{
  "editor.colorScheme": "Atom One Dark",
  "editor.contentAssistSelectionMode": "Alt+数字模式",
  "editor.fontFmyCHS": "YouYuan",
  "editor.formatOnSave": true,
  "editor.saveOnFocusLost": true,
  "explorer.iconTheme": "vs-seti",
  "workbench.colorCustomizations": {
    "[Atom One Dark]": {
      "console.background": "#1E1E1E",
      "debug.background": "#1E1E1E",
      "editor.background": "#1E1E1E",
      "editorGroupHeader.tabsBackground": "#2D2D2D",
      "list.activeSelectionBackground": "#3B4040",
      "list.activeSelectionForeground": "#4690F0",
      "list.hoverBackground": "#3B4040",
      "panelTitle.activeForeground": "#ffffff",
      "sideBar.background": "#252526",
      "sideBarSectionHeader.background": "#263238",
      "statusBar.background": "#007ACC",
      "statusBar.button.hoverbackground": "#005c99",
      "statusBar.foreground": "#ffffff",
      "tab.activeBackground": "#1E1E1E",
      "tab.activeBorder": "#252526",
      "tab.activeForeground": "#FFF",
      "tab.border": "#252526",
      "tab.hoverBackground": "#3E3E3E",
      "tab.inactiveBackground": "#2D2D2D",
      "tab.inactiveForeground": "#969690",
      "terminal.background": "#1E1E1E",
      "terminal.foreground": "#ffffff",
      "toolBar.border": "#474747",
      "toolBar.hoverBackground": "#F3f3f3"
    }
  }
}
```

:::

### 2、uni-app 配置

#### 2.1、小程序配置

```json
{
  "weApp.devTools.path": "D:/微信web开发者工具/微信web开发者工具.exe"
}
```

#### 2.2、代码模板

```vue
<template>
  <view class="container">
    $END$
  </view>
</template>

<script>
export default {
  data() {
    return {
      $1
    }
  },
  onLoad() {
    $2
  }
}
</script>

<style lang="scss" scoped>
.container {
  $3
}
</style>
```

## 五、字体配置

### 1、等宽字体推荐

::: tip 等宽字体
等宽字体（Monospace Font）每个字符占用相同的宽度，特别适合代码编写。
:::

::: details 推荐等宽字体

1. **[Fira Code](https://github.com/tonsky/FiraCode)** - 最流行的编程字体，支持连字
2. **[JetBrains Mono](https://www.jetbrains.com/lp/mono/)** - JetBrains 官方字体，专为开发者设计
3. **[Hack](https://sourcefoundry.org/hack/)** - 开源等宽字体
4. **[Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono)** - Google 设计的等宽字体
5. **[Consolas](https://docs.microsoft.com/zh-cn/typography/fonts/consolas)** - Windows 系统自带字体
6. **[Source Code Pro](https://fonts.google.com/specimen/Source+Code+Pro)** - Adobe 开源字体
7. **[Cascadia Code](https://github.com/microsoft/cascadia-code)** - Microsoft 开源字体

:::

### 2、字体连字（Ligatures）

::: info 字体连字
字体连字可以将多个字符组合显示为一个符号，让代码更易读。例如：`!=` 显示为 `≠`，`->` 显示为 `→`。
:::

**启用字体连字：**

```json
{
  "editor.fontFamily": "'Fira Code', 'JetBrains Mono', monospace",
  "editor.fontLigatures": true
}
```

**支持连字的字体：**
- Fira Code
- JetBrains Mono
- Cascadia Code
- Hasklig

### 3、字体安装

**Windows：**
1. 下载字体文件（.ttf 或 .otf）
2. 右键字体文件，选择"安装"
3. 重启 IDE

**macOS：**
1. 下载字体文件
2. 双击字体文件
3. 点击"安装字体"
4. 重启 IDE

**Linux：**
```bash
# 复制字体到系统目录
sudo cp font.ttf /usr/share/fonts/
# 刷新字体缓存
fc-cache -fv
```

## 六、配置文件同步

### 1、VS Code 设置同步

::: tip 设置同步
使用 VS Code 的设置同步功能，可以在多台设备间同步配置、插件、快捷键等。
:::

**启用设置同步：**
1. 点击左下角齿轮图标
2. 选择"打开设置同步"
3. 登录 GitHub 或 Microsoft 账户
4. 选择要同步的内容

**同步内容：**
- 设置
- 键盘快捷键
- 用户代码片段
- 扩展
- UI 状态

### 2、配置文件导出

**导出 VS Code 配置：**

```bash
# 导出扩展列表
code --list-extensions > extensions.txt

# 安装扩展
cat extensions.txt | xargs -L 1 code --install-extension
```

**导出设置：**
- Windows: `%APPDATA%\Code\User\settings.json`
- macOS: `~/Library/Application Support/Code/User/settings.json`
- Linux: `~/.config/Code/User/settings.json`



## 2、学习资源

::: details 推荐资源
- 📚 **VS Code 官方文档**：https://code.visualstudio.com/docs
- 📚 **WebStorm 官方文档**：https://www.jetbrains.com/help/webstorm/
- 🎓 **VS Code 快捷键参考**：https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf
:::

---

