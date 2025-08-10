# IDE 配置

## 1、VSCode
### 1.1、推荐主题
::: details 📌常用主题
1. One Dark Pro
2. Night Owl
3. Dracula Official
4. GitHub Theme
5. Material Icon Theme
6. Brarded Theme
:::

### 1.2、推荐插件
::: details VSCode 推荐插件
1. AI编程助手: Fitten Code
2. 缩进高亮:indent-rainbow
3. 代码检查: ESLint
4. 格式化: Prettier
5. 路径自动补全: Path Autocomplete
6. 标注: TODO Highlight
7. Gitk可视化: GitLens 
8. 汉化语言包: Chinese 
9. Markdown预览:  Markdown All in One
10. github远程预览: remote repositories
:::
### 1.3、快捷键配置
::: details VSCode 快捷键
- `Ctrl + d` : 选中相同的文本
- `Ctrl + Shift + H` 替换
- `Ctrl + Shift + D` 复制行
- `Ctrl + Shift + L` 选择所有相同的字符
- `Ctrl + Shift + U` 全部大写
- `Ctrl + Shift + I` 全部小写
- `Ctrl + Shift + ]` 向右缩进
- `Ctrl + Shift + [` 向左缩进
- `Ctrl + Shift + K` 删除行
:::

### 1.4、代码片段
- [代码片段在线生成](https://snippet-generator.app/?description=&tabtrigger=&snippet=&mode=vscode)

::: details VSCode 代码片段
```json
{
	"vue3": {
        "prefix": "vue3",
        "body": [
            "<template>",
            "  <div class=\"\">",
            "",
            "",
            "",
            "",
            "  </div>",
            "</template>",
            "<script setup>",
			"import {ref} from \"vue\"",
            "",
            "",
            "",
            "",            
            "</script>",
            "<style lang=\"scss\" scoped>",
            "",
            "",
            "",
            "",
            "</style>",
            ""
        ],
        "description": "快速创建vue3模板"
    },
    "vue2": {
        "prefix": "vue2",
        "body": [
            "<template>",
            "  <div class=\"\">",
            "",
            "",
            "",
            "",
            "  </div>",
            "</template>",
            "<script>",
			"import {ref} from \"vue\"",
            "",
            "",
            "",
            "",            
            "</script>",
            "<style scoped>",
            "",
            "",
            "",
            "",
            "</style>",
            ""
        ],
        "description": "快速创建vue2模板"
    },
    "react": {
        "prefix": "react",
        "body": [
            "import React, { useState } from \"react\";",
            "",
            "function ${1:ComponentName}(${2:props}) {",
            "  const [${3:state}, set${4:State}] = useState(${5:initialState});",
            "",
            "  return (",
            "    <div>",
            "      ${6:<div>content</div>}",
            "    </div>",
            "  );",
            "}",
            "",
            "export default ${1:ComponentName};",
            ""
        ],
        "description": "快速创建react组件"
    },
    "typescript": {
        "prefix": "typescript",
        "body": [
            "interface ${1:InterfaceName} {",
            "  ${2:property}: ${3:type};",
            "}",
            "",
            "class ${4:ClassName} {",
            "  ${5:property}: ${6:type};",
            "",
            "  constructor(${7:props}: ${8:ClassName}) {",
            "    this.${5:property} = ${9:props}.${5:property};",
            "  }",
            "}",
            "",
            "const ${10:variable}: ${11:Type} = ${12:value};",
            "",
            "function ${13:functionName}(${14:params}: ${15:Type}): ${16:Type} {",
            "  ${17:code}",
            "}",
            "",
            "type ${18:AliasName} = ${19:Type};",
            "",
            "enum ${20:EnumName} {",
            "  ${21:EnumValue} = ${22:value},",
            "}",
            ""
        ],
        "description": "typescript代码片段"
    },
}
```
:::

## 2、WebStorm 
### 2-1、快捷键
::: details 📌 WebStorm 快捷键
- `Ctrl + d` : **复制行**
- `Ctrl + x` : **删除行**
- `Alt + J` : **选中相同的文本**
- `Ctrl + Alt + l` : **格式化代码**
- `Ctrl + Shift + ↓` : **移动行下**
- `Ctrl + Shift + ↑` : 移动行上
- `Alt + →` ：切换下一个标签页
- `Alt + ←` ：切换上一个标签页
- `Alt + F3`: 选中所有相同的文本
- `Ctrl + Tab` ：调出切换器
- `Ctrl + j` : 选择标签内容
- `Ctrl + g` : 跳转到指定行
- `Ctrl + Shift + /` : 当前位置插入注释
:::

### 2-2、推荐插件
::: details WebStorm 推荐插件
1. AI编程助手: Fitten Code
2. 页面主题: One Dark Theme
3. 图标主题: Atom Material Icons
:::

## 3、HBuilderX
### 3-1、基本配置
::: details 📌 基本配置
1. 使用 vscode 版快捷键
2. 自动保存配置
3. 格式化代码配置
:::
### 3-2、主题配置
- 自定义主题（雅蓝主题&仿vscode主题）
::: details HBuilderX 主题配置
```json
  {
  "editor.colorScheme": "Atom One Dark",
  "editor.contentAssistSelectionMode": "Alt+数字模式",
  "editor.fontFmyCHS": "YouYuan",
  "editor.formatOnSave": true,
  "editor.saveOnFocusLost": true,
  "explorer.iconTheme": "vs-seti",
  // "weApp.devTools.path": "D:/Chorme/weChatDevtool/微信web开发者工具",
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
  },
  "[Default]": {},
  "[Monokai]": {}
  },
  }
```
:::

## 4、等宽字体
::: details 推荐等宽字体
- [Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono)
- [Hack](https://sourcefoundry.org/hack/)
- [FiraCode](https://github.com/tonsky/FiraCode)
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/)
- [Consolas](https://docs.microsoft.com/zh-cn/typography/fonts/consolas)

:::

