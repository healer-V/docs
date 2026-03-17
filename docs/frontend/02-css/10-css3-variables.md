---
title: "CSS 自定义属性（变量）"
category: "前端 · CSS"
tags:
  - CSS3
  - CSS变量
  - 自定义属性
  - 主题切换
date: 2026-03-17
---

# CSS 自定义属性（变量）

CSS 自定义属性（Custom Properties），也称 CSS 变量，允许你在样式表中定义可复用的值，并通过 `var()` 函数引用。与 Sass/Less 变量不同，CSS 变量是运行时特性，支持继承、响应式修改和 JavaScript 交互。

## 一、基本语法

### 1. 声明变量

自定义属性必须以 `--` 开头，区分大小写：

```css
:root {
  --primary-color: #4a90e2;
  --font-size-base: 16px;
  --border-radius: 8px;
  --spacing-unit: 4px;
}
```

### 2. 使用 var() 函数

```
var(--variable-name, fallback-value)
```

::: details 基本使用示例

```css{2,3,4,10,11}
/* 声明变量 */
:root {
  --brand-color: #4a90e2;
  --card-padding: 24px;
  --card-radius: 12px;
}

/* 使用变量 */
.card {
  padding: var(--card-padding);
  border-radius: var(--card-radius);
  border: 1px solid var(--brand-color);
  color: var(--brand-color);
}

/* 变量用于计算 */
.card-header {
  padding: calc(var(--card-padding) / 2) var(--card-padding);
}
```

:::

### 3. 回退值

`var()` 的第二个参数是回退值，当变量未定义时使用：

::: details 回退值示例

```css{3,8,13}
/* 单层回退 */
.text {
  color: var(--text-color, #333);
}

/* 嵌套回退（变量引用另一个变量，再回退到固定值） */
.button {
  background: var(--btn-bg, var(--primary-color, #4a90e2));
}

/* 回退值也可以是复杂值 */
.shadow-box {
  box-shadow: var(--card-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}
```

:::

::: tip 回退值不作为默认值
回退值只在变量**未定义**或**无效**时生效。若变量已定义但值为空字符串，回退值不会触发。
:::

## 二、作用域与继承

### 1. :root 全局变量

将变量定义在 `:root`（等同于 `html` 元素）中，可以在整个文档范围内访问：

```css
:root {
  --color-primary: #4a90e2;
  --color-secondary: #764ba2;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}
```

### 2. 局部变量

变量遵循 CSS 的继承规则，只在声明它的元素及其后代中有效：

::: details 局部变量作用域示例

```css{2-4,8-10,15-17}
/* 全局变量 */
:root {
  --color: #333;
}

/* 组件级局部变量，仅影响 .card 及其子元素 */
.card {
  --color: #fff;
  --bg: #4a90e2;
  background: var(--bg);
  color: var(--color);
}

/* 元素级覆盖 */
.card .special-text {
  --color: #ffd93d;
  color: var(--color);
}
```

:::

### 3. 变量继承的特点

CSS 变量会沿着 DOM 树向下继承，子元素可以自动获取父元素定义的变量，也可以在自身作用域内覆盖。

::: details 继承与覆盖示例

```html
<!-- HTML 结构 -->
<div class="parent">
  <div class="child">
    <span class="grandchild">文本</span>
  </div>
</div>
```

```css
.parent {
  --text-color: #333;
}

.child {
  --text-color: #4a90e2; /* 覆盖父级 */
}

/* grandchild 继承 .child 的 --text-color，即 #4a90e2 */
.grandchild {
  color: var(--text-color);
}
```

:::

## 三、与 JavaScript 交互

### 1. 读取 CSS 变量

使用 `getComputedStyle` 获取元素的 CSS 变量值：

::: details JavaScript 读取 CSS 变量

```js{3,9}
// 读取 :root 上的全局变量
const rootStyles = getComputedStyle(document.documentElement);
const primaryColor = rootStyles.getPropertyValue('--primary-color').trim();
console.log(primaryColor); // "#4a90e2"

// 读取特定元素的局部变量
const card = document.querySelector('.card');
const cardStyles = getComputedStyle(card);
const cardBg = cardStyles.getPropertyValue('--bg').trim();
```

:::

### 2. 修改 CSS 变量

使用 `setProperty` 动态修改变量，实时影响所有引用该变量的样式：

::: details JavaScript 修改 CSS 变量

```js{5,10,16-22}
// 修改全局变量
document.documentElement.style.setProperty('--primary-color', '#ff6b6b');

// 修改特定元素的变量
const card = document.querySelector('.card');
card.style.setProperty('--bg', '#ffd93d');

// 删除变量（恢复到继承值或回退值）
document.documentElement.style.removeProperty('--primary-color');

// 实际应用：颜色选择器实时更新主题
const colorPicker = document.getElementById('color-picker');
colorPicker.addEventListener('input', (e) => {
  document.documentElement.style.setProperty(
    '--primary-color',
    e.target.value
  );
});
```

:::

## 四、响应式设计中的变量

在媒体查询内重新定义变量，可以集中管理所有断点下的差异：

::: details 响应式变量示例

```css{2-6,10-13,17-20}
/* 默认（移动端）值 */
:root {
  --font-size-body: 14px;
  --spacing-section: 24px;
  --grid-columns: 1;
  --nav-height: 56px;
}

/* 平板断点 */
@media (min-width: 768px) {
  :root {
    --font-size-body: 15px;
    --spacing-section: 40px;
    --grid-columns: 2;
    --nav-height: 64px;
  }
}

/* 桌面断点 */
@media (min-width: 1200px) {
  :root {
    --font-size-body: 16px;
    --spacing-section: 60px;
    --grid-columns: 3;
    --nav-height: 72px;
  }
}

/* 使用变量的组件，自动适配各断点 */
body {
  font-size: var(--font-size-body);
}

.section {
  padding: var(--spacing-section) 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
}
```

:::

## 五、实现主题切换

### 1. data-theme 属性方案

::: details 深色/浅色主题切换完整示例

```css
/* 浅色主题（默认） */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --text-primary: #2c3e50;
  --text-secondary: #606266;
  --border-color: #e4e7ed;
  --shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 深色主题 */
[data-theme="dark"] {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --text-primary: #e8eaed;
  --text-secondary: #9aa0a6;
  --border-color: #3c4043;
  --shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

/* 组件使用变量，自动响应主题切换 */
body {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow);
}
```

```js
// 切换主题
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  localStorage.setItem('theme', html.getAttribute('data-theme'));
}

// 初始化主题（读取用户偏好）
const savedTheme = localStorage.getItem('theme')
  || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);
```

:::

### 2. prefers-color-scheme 自动适配

::: details 系统级深色模式自动适配

```css
/* 默认浅色 */
:root {
  --bg: #ffffff;
  --text: #333333;
}

/* 自动响应系统深色模式 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a2e;
    --text: #e8eaed;
  }
}
```

:::

## 六、CSS 变量 vs Sass/Less 变量

| 特性 | CSS 变量 | Sass 变量 | Less 变量 |
|------|----------|-----------|-----------|
| 运行时 | 是（浏览器解析） | 否（编译时替换） | 否（编译时替换） |
| 动态修改 | 支持（JS 可改） | 不支持 | 不支持 |
| 作用域 | DOM 继承作用域 | 词法作用域（块作用域） | 懒加载作用域 |
| 响应式（媒体查询内修改） | 支持 | 不支持 | 不支持 |
| 回退值 | 支持 `var(--x, fallback)` | 支持 `!default` | 支持变量保护 |
| 浏览器支持 | IE 不支持 | 需编译（兼容性好） | 需编译（兼容性好） |
| 性能 | 运行时计算，轻微开销 | 无运行时开销 | 无运行时开销 |
| 调试 | DevTools 可见 | 编译后不可见 | 编译后不可见 |

::: tip 最佳实践建议
- 现代项目优先使用 CSS 变量，尤其是需要主题切换、运行时动态修改的场景
- 若需兼容 IE 11，使用 Sass/Less 变量或配合 PostCSS `postcss-custom-properties` 插件转换
- CSS 变量和 Sass 变量可以共存：用 Sass 做编译时逻辑处理，用 CSS 变量做运行时主题切换
:::
