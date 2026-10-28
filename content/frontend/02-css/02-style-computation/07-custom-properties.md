---
title: "CSS 自定义属性"
tags:
  - CSS
  - 自定义属性
excerpt: "解释自定义属性的声明、层叠、继承和 var 替换规则，区分缺失回退与计算时无效，通过循环引用和属性注册说明类型、初始值及继承控制的边界。"
---

# CSS 自定义属性

**自定义属性**是以 `--` 开头、由作者命名的 CSS 属性，用来保存并复用值。它参与层叠与继承，因此同一个名称在不同元素上可以得到不同取值。

`var()` 将自定义属性的值替换到另一条声明中。它不是字符串拼接，也不是在构建时把所有变量提前替换的预处理器语法。

## 一、声明与取值范围

### 1. 使用 var

以下是局部 CSS，假设页面包含 `.panel` 和其内部的 `.label`：

```css
:root { --accent: #166534; --space: 12px; }
.panel {
  color: var(--accent);
  padding: var(--space);
}
.panel.warning { --accent: #b42318; }
```

普通 `.panel` 的文字为绿色；加上 `warning` 类后变为红色。未注册的自定义属性默认继承，因此 `.label` 也能读取相同的 `--accent`。

`:root` 匹配文档根元素，常用于提供全局起点，但变量并不要求必须声明在这里。组件根元素上的声明能让其后代继承一组局部值。

::: info 名称区分大小写
`--accent` 与 `--Accent` 是两个不同属性。声明在 `.panel` 上的值不会自动传给兄弟元素；范围取决于匹配、层叠和继承关系。
:::

### 2. 值按使用位置解释

未注册的自定义属性通常保存一段词法值，而不是预先确定“这就是宽度”。同一个 `--size` 用到 `width` 与 `color` 时，仍分别受两个属性的语法约束。

也不能用 `var()` 替换属性名、选择器或通常的媒体查询条件，例如 `@media (width > var(--breakpoint))` 不是可用的断点写法。

## 二、回退与无效替换

### 1. 缺少值时的回退

`var(--name, fallback)` 的第二个参数在变量不存在或具有保证无效值等情况时使用。下面是局部声明：

```css
.panel {
  color: var(--accent, green);
  padding: var(--space, 12px);
}
```

若相应变量没有可用值，文字为绿色，内边距为 `12px`。回退也可以嵌套，例如 `var(--local, var(--global, green))`，依次寻找可用来源。

### 2. 存在不等于类型正确

下面是局部错误声明，用来观察替换后无效的情况：

```css
.panel {
  --size: green;
  width: 200px;
  width: var(--size, 100px);
}
```

`--size` 已存在，所以不会使用 `100px`。替换后得到 `width: green`，在计算值时发现不符合宽度语法。浏览器不会回到前一条 `width: 200px`；这个非继承属性按默认处理回到初始行为 `auto`。

::: warning 回退值不是所有错误的保险
`var()` 的回退处理变量不可用，不负责检查替换结果是否适合当前属性。遇到这种错误时，先在开发者工具中查变量的实际取值和来源。
:::

### 3. 循环引用

下面两项构成循环，不能产生可用的替换值：

```css
.panel {
  --a: var(--b);
  --b: var(--a);
  padding: var(--a, 12px);
}
```

循环使相关变量无效，因此这里可使用 `12px` 回退。应移除循环，让一个值依赖独立的基础值；不能靠声明顺序解除这种依赖。

## 三、用 @property 注册属性

`@property` 可声明自定义属性的类型、初始值及是否继承。下面是局部注册与使用样式：

```css
@property --space {
  syntax: "<length>";
  inherits: false;
  initial-value: 12px;
}
.panel { --space: 20px; padding: var(--space); }
.label { padding: var(--space); }
```

`.panel` 使用 `20px`；其 `.label` 后代因不继承而使用注册的 `12px` 初始值。注册后 `--space: green` 不符合类型，不能作为合法长度使用。

| 字段 | 作用 | 约束 |
|------|------|------|
| `syntax` | 允许的值类型 | 如 `<length>`、`<color>`；`*` 表示任意值 |
| `inherits` | 是否默认继承 | 必须明确指定 |
| `initial-value` | 注册属性的初始值 | 非通配语法通常必须提供，且不能依赖其他动态计算条件 |

例如 `<length>` 的初始值写 `12px` 可以独立确定，写 `1em` 则依赖字号，不满足同样的注册条件。注册也使浏览器能按已知类型进行相应动画插值，而未注册变量通常采用离散变化。

::: warning 注册是增强能力，需要验证目标浏览器
不支持注册的浏览器可能忽略 `@property`，按未注册变量的继承规则处理。若布局依赖“不继承”或类型校验，必须准备显式值并测试回退，不能只依赖 `var()` 的第二参数。
:::

变量的层叠与计算时无效定义见 [CSS 自定义属性规范](https://www.w3.org/TR/css-variables-1/)，注册规则见 [CSS Properties and Values API](https://www.w3.org/TR/css-properties-values-api-1/)。
