# Sass 语法

## 一、变量
>[!tip] 
> 1. **概念**: 变量可以用来存储值，并在整个样式表中使用。
> 2. **定义**: 变量名以 `$` 开头，后面跟着变量名。变量名只能包含字母、数字和下划线。
> 3. **取值**: 变量值可以是任何 CSS 值，包括颜色、字体、尺寸、数字、百分比等。

>[!important] 注意事项
> 1. 变量名区分大小写。
> 2. 变量值可以包含运算符，如加减乘除、逻辑运算符、函数等。
> 3. 变量值可以是另一个变量，如 `$font-size: $base-size + 10px;`。
> 4. 变量是动态的，可以随着时间的推移而变化。


::: details Sass 变量示例
```scss
$font-size: 16px;
$font-color: #333;

body {
  font-size: $font-size;
  color: $font-color;
}
```
:::

## 二、嵌套规则
>[!tip] Nesting
> 1. **概念**: Sass允许将一套CSS规则嵌套在另一套规则中，使代码更具层次感和可读性。
> 2. **优点**: 减少重复编写父选择器，使结构更清晰。
> 3. **注意**: 过度嵌套会导致CSS选择器过于具体，影响性能。

>[!important] 注意事项
> 1. 嵌套层级不宜过深，建议不超过3层。
> 2. 使用`&`符号引用父选择器。
> 3. 属性也可以嵌套，如`font: {size: 16px; weight: bold;}`。

::: details Sass嵌套示例
```scss
nav {
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    
    li {
      display: inline-block;
      
      a {
        display: block;
        padding: 6px 12px;
        text-decoration: none;
        
        &:hover {
          color: #fff;
          background: #333;
        }
      }
    }
  }
}
```
:::

## 三、混合
>[!tip] Mixin
> 1. **概念**: Mixin是可以重用的代码块，可以包含任意CSS规则。
> 2. **定义**: 使用`@mixin`定义，`@include`调用。
> 3. **参数**: 支持参数和默认值，使代码更灵活。

>[!important] 注意事项
> 1. 合理命名Mixin，使其功能明确。
> 2. 参数较多时考虑使用参数Map。
> 3. 避免过度使用Mixin导致代码难以维护。

::: details Sass Mixin示例
```scss
@mixin border-radius($radius: 5px) {
  -webkit-border-radius: $radius;
     -moz-border-radius: $radius;
      -ms-border-radius: $radius;
          border-radius: $radius;
}

.button {
  @include border-radius(10px);
  background: #4CAF50;
  color: white;
}
```
:::

## 四、继承
>[!tip] Extend
> 1. **概念**: 允许一个选择器继承另一个选择器的样式。
> 2. **语法**: 使用`@extend`指令。
> 3. **优点**: 减少重复代码，保持样式一致性。

>[!important] 注意事项
> 1. 继承会合并选择器，可能生成复杂的选择器。
> 2. 适合继承基础样式，不适合频繁变化的样式。
> 3. 使用占位符选择器`%`可以避免生成不必要的CSS。

::: details Sass继承示例
```scss
.message {
  border: 1px solid #ccc;
  padding: 10px;
  color: #333;
}

.success {
  @extend .message;
  border-color: green;
}

.error {
  @extend .message;
  border-color: red;
}
```
:::

## 五、运算
>[!tip] Operations
> 1. **概念**: Sass支持基本的数学运算。
> 2. **类型**: 包括数字、颜色、字符串等运算。
> 3. **单位**: 注意单位兼容性，如px与em不能直接运算。

>[!important] 注意事项
> 1. 除法需要使用括号或变量，如`($width/2)`。
> 2. 颜色运算是对RGB通道分别计算。
> 3. 字符串运算使用`+`连接。

::: details Sass运算示例
```scss
.container {
  width: 100% - 20px;
  height: (600px / 2);
  margin-left: 10px + 5px;
  color: #010203 + #040506; // #050709
}
```
:::
## 六、函数
>[!tip] Functions
> 1. **概念**: Sass提供内置函数，也允许自定义函数。
> 2. **类型**: 包括颜色、字符串、数字、列表、Map等操作函数。
> 3. **自定义**: 使用`@function`定义，`@return`返回值。

>[!important] 注意事项
> 1. 熟悉常用内置函数，如`lighten()`, `darken()`等。
> 2. 自定义函数名应明确表达功能。
> 3. 函数可以有多个参数，支持默认值。

::: details Sass函数示例
```scss
// 内置函数
$light-color: lighten(#336699, 20%);

// 自定义函数
@function em($px, $base: 16px) {
  @return ($px / $base) * 1em;
}

body {
  font-size: em(32px); // 2em
  color: $light-color;
}
```
:::

## 七、控制指令
>[!tip] Control Directives
> 1. **概念**: 提供流程控制功能，包括条件判断和循环。
> 2. **指令**: `@if`, `@else`, `@for`, `@each`, `@while`。
> 3. **应用**: 动态生成样式，减少重复代码。

>[!important] 注意事项
> 1. 合理使用控制指令，避免过度复杂。
> 2. `@each`适合遍历列表或Map。
> 3. `@for`适合生成序列样式。

::: details Sass控制指令示例
```scss
// 条件判断
@mixin text-style($size, $bold: false) {
  font-size: $size;
  @if $bold {
    font-weight: bold;
  }
}

// 循环
$sizes: 40px, 50px, 80px;
@each $size in $sizes {
  .icon-#{$size} {
    width: $size;
    height: $size;
  }
}

// 生成网格系统
@for $i from 1 through 12 {
  .col-#{$i} {
    width: 100% / 12 * $i;
  }
}
```
:::

## 八、导入与模块化
>[!tip] Import/Module
> 1. **概念**: 将样式分割为多个文件，提高可维护性。
> 2. **导入**: 使用`@use`或`@import`(已废弃)。
> 3. **模块**: 使用`@forward`转发模块内容。

>[!important] 注意事项
> 1. 优先使用`@use`替代`@import`。
> 2. 使用命名空间避免冲突。
> 3. 合理组织文件结构。

::: details Sass模块化示例
```scss
// _variables.scss
$primary-color: #336699;

// main.scss
@use 'variables' as vars;

body {
  color: vars.$primary-color;
}
```
:::

## 九、插值
>[!tip] Interpolation
> 1. **概念**: 使用`#{}`将变量插入到选择器或属性名中。
> 2. **应用**: 动态生成选择器或属性名。
> 3. **注意**: 插值内的变量会转换为字符串。

>[!important] 注意事项
> 1. 插值适合生成动态类名。
> 2. 可以在选择器、属性名和字符串中使用。
> 3. 避免过度使用导致代码难以理解。

::: details Sass插值示例
```scss
$side: top;
$radius: 10px;

.border-#{$side} {
  border-#{$side}-radius: $radius;
}

// 生成: .border-top { border-top-radius: 10px; }
```
:::


