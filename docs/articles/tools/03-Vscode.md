# Vscode使用指南

## 1、VSCode主题
### 1.1、推荐主题
::: tip 📌常用
- [One Dark Pro](https://marketplace.visualstudio.com/items?itemName=zhuangtongfa.Material-theme)
- [Night Owl](https://marketplace.visualstudio.com/items?itemName=sdras.night-owl)
- [Dracula Official](https://marketplace.visualstudio.com/items?itemName=dracula-theme.theme-dracula)
- [GitHub Theme](https://marketplace.visualstudio.com/items?itemName=GitHub.github-vscode-theme)
- [Material Icon Theme](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme)
- [Brarded Theme](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-icontheme-branded)
:::
### 1.2、自定义主题
:::warning 📌网址
- [自定义主题](https://code.visualstudio.com/docs/getstarted/themes#_customizing-a-color-theme)
- [Color Theme Generator](https://marketplace.visualstudio.com/items?itemName=Tyriar.theme-generator)
- [Color Highlight](https://marketplace.visualstudio.com/items?itemName=naumovs.color-highlight)
:::
- 
## 2、 VSCode 推荐插件
::: details 点击查看
- [Fitten Code-AI编程助手](https://marketplace.visualstudio.com/items?itemName=fitnesse.fitnesse-code)
- [indent-rainbow-缩进高亮](https://marketplace.visualstudio.com/items?itemName=oderwat.indent-rainbow)
- [代码检查 ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [格式化 Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [路径自动补全 Path Autocomplete](https://marketplace.visualstudio.com/items?itemName=ionutvmi.path-autocomplete)
- [标注 TODO Highlight](https://marketplace.visualstudio.com/items?itemName=wayou.vscode-todo-highlight)
- [Gitk可视化 GitLens — Git supercharged](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)
- [汉化语言包 Chinese (Simplified) Language Pack for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=MS-CEINTL.vscode-language-pack-zh-hans)
- [Markdown预览 Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)
- [github远程预览](https://marketplace.visualstudio.com/items?itemName=GitHub.remotehub)
:::
## 3、VSCode 快捷键
::: tip VSCode 快捷键
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
- 
## 4、WebStorm 快捷键
::: tip 📌 WebStorm 快捷键
- `Alt + J` : 选中相同的文本
- `Alt + →` ：切换下一个标签页
- `Alt + ←` ：切换上一个标签页
- `Alt + F3`: 选中所有相同的文本
- `Ctrl + Tab` ：调出切换器
- `Ctrl + Shift + ↑` : 移动行上
- `Ctrl + Shift + ↓` : 移动行下
- `Ctrl + x` : 删除行
- `Ctrl + d` : 复制行
- `Ctrl + j` : 选择标签内容
- `Ctrl + g` : 跳转到指定行
- `Ctrl + Shift + /` : 当前位置插入注释
:::


## 5、常用编程字体
**等宽字体**
- [Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono)
- [Hack](https://sourcefoundry.org/hack/)
- [FiraCode](https://github.com/tonsky/FiraCode)
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/)
- [Consolas](https://docs.microsoft.com/zh-cn/typography/fonts/consolas)
::: details 点击查看更多字体
- [Fira Mono](https://github.com/mozilla/Fira)
- [Dank Mono](https://dank.sh/)
- [Input](https://input.fontbureau.com/)
- [Iosevka](https://github.com/be5invis/Iosevka)
- [Monoid](https://larsenwork.com/monoid/)
- [Cascadia Code](https://github.com/microsoft/cascadia-code)
- [Fantasque Sans Mono](https://github.com/belluzj/fantasque-sans)
- [Meslo LG](https://github.com/andreberg/Meslo-Font)
- [Operator Mono](https://www.typography.com/fonts/operator/overview)
- [Source Code Pro](https://github.com/adobe-fonts/source-code-pro)
- [Ubuntu Mono](https://design.ubuntu.com/font/)
- [IBM Plex Mono](https://github.com/IBM/plex)
- [CamingoCode](https://github.com/janniks/CamingoCode)
- [Cousine](https://github.com/google/fonts/tree/main/ofl/cousine)
- [DejaVu Sans Mono](https://dejavu-fonts.github.io/DejaVuSansMono/)
- [D2Coding](https://github.com/naver/d2codingfont)
- [ProggyClean](https://github.com/jenskutilek/proggyfonts)
- [FiraGO](https://github.com/bBoxType/FiraGO)
:::

## 6、VSCode 代码片段
::: tip 看这里
[VSCode 代码片段在线生成网站](https://snippet-generator.app/?description=&tabtrigger=&snippet=&mode=vscode)
:::

::: details 代码片段
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

:::