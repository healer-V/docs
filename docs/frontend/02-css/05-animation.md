---
title: "CSS动画"
category: "前端 · CSS"
tags:
  - CSS
excerpt: "CSS动画是一种使用CSS属性来创建元素从一种样式逐渐过渡到另一种样式的视觉效果。通过CSS动画，我们可以在不使用JavaScript的情况下，实现各种动态效果，如元素的移动、旋转、缩放、颜色变化等。 动画的主要作用： 增强用户体验：通过动..."
---

# CSS动画

## 一、动画概述

::: tip 动画定义
CSS动画是一种使用CSS属性来创建元素从一种样式逐渐过渡到另一种样式的视觉效果。通过CSS动画，我们可以在不使用JavaScript的情况下，实现各种动态效果，如元素的移动、旋转、缩放、颜色变化等。
:::

动画的主要作用：

1. **增强用户体验**：通过动态效果吸引用户注意力，提高用户体验
2. **突出重点内容**：使用动画突出页面中的重要信息或操作按钮
3. **提供视觉反馈**：为用户的操作提供即时的视觉反馈
4. **创造生动的页面效果**：使页面更加生动有趣，增加用户的停留时间
5. **引导用户行为**：通过动画引导用户完成特定的操作流程

## 二、CSS过渡（Transitions）

### 2.1 过渡的基本概念

::: info 过渡的定义
CSS过渡（Transitions）是一种简单的动画效果，它允许元素的样式在一定时间内平滑地从一种状态过渡到另一种状态。过渡通常用于响应用户的交互，如鼠标悬停（hover）、点击（active）等。

**过渡的主要属性：**
- `transition-property`：定义要应用过渡效果的CSS属性
- `transition-duration`：定义过渡效果的持续时间
- `transition-timing-function`：定义过渡效果的时间曲线
- `transition-delay`：定义过渡效果的延迟时间
- `transition`：以上四个属性的简写形式

**transition-property的常用值：**
- `all`：对所有可过渡的CSS属性应用过渡效果
- `none`：不应用过渡效果
- 具体的CSS属性名：如`color`、`background-color`、`transform`等

**transition-duration的单位：**
- `s`：秒，如`0.5s`
- `ms`：毫秒，如`500ms`

**transition-timing-function的常用值：**
- `ease`：默认值，先慢后快再慢
- `linear`：匀速
- `ease-in`：慢入
- `ease-out`：慢出
- `ease-in-out`：慢入慢出
- `cubic-bezier(n,n,n,n)`：自定义贝塞尔曲线

**特点：**
- 语法简单，易于实现
- 性能较好，浏览器会进行优化
- 适合简单的状态变化动画
- 只能定义开始和结束两种状态
:::

**示例：**

```html
<div class="transition-example">
  <h2>CSS过渡示例</h2>
  <div class="transition-container">
    <!-- 颜色过渡 -->
    <div class="transition-box color-transition">颜色过渡</div>
    
    <!-- 大小过渡 -->
    <div class="transition-box size-transition">大小过渡</div>
    
    <!-- 位置过渡 -->
    <div class="transition-box position-transition">位置过渡</div>
    
    <!-- 旋转过渡 -->
    <div class="transition-box rotate-transition">旋转过渡</div>
    
    <!-- 多属性过渡 -->
    <div class="transition-box multiple-transition">多属性过渡</div>
    
    <!-- 自定义时间曲线 -->
    <div class="transition-box custom-curve">自定义曲线</div>
  </div>
</div>
```

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.transition-example {
  font-family: Arial, sans-serif;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f8f9fa;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #007bff;
}

.transition-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.transition-box {
  width: 200px;
  height: 200px;
  background-color: #28a745;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  cursor: pointer;
  margin: 0 auto;
}

/* 颜色过渡 */
.color-transition {
  transition-property: background-color;
  transition-duration: 0.5s;
  transition-timing-function: ease;
}

.color-transition:hover {
  background-color: #dc3545;
}

/* 大小过渡 */
.size-transition {
  transition: width 0.5s ease, height 0.5s ease;
}

.size-transition:hover {
  width: 250px;
  height: 250px;
  line-height: 250px;
}

/* 位置过渡 */
.position-transition {
  transition: transform 0.5s ease;
}

.position-transition:hover {
  transform: translateX(50px);
}

/* 旋转过渡 */
.rotate-transition {
  transition: transform 0.5s ease;
}

.rotate-transition:hover {
  transform: rotate(180deg);
}

/* 多属性过渡 */
.multiple-transition {
  transition: all 0.5s ease;
}

.multiple-transition:hover {
  background-color: #ffc107;
  color: #212529;
  transform: scale(1.2) rotate(10deg);
  border-radius: 50%;
}

/* 自定义时间曲线 */
.custom-curve {
  transition: transform 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.custom-curve:hover {
  transform: translateX(100px) scale(1.3);
}
```

### 2.2 过渡的高级用法

::: tip 过渡的高级技巧
除了基本的过渡效果，我们还可以使用一些高级技巧来创建更加复杂和有趣的过渡效果。

**1. 链式过渡**
通过设置不同的过渡延迟，可以创建链式过渡效果，使多个属性按照一定的顺序依次发生变化。

**2. 嵌套元素的过渡**
在嵌套元素上应用过渡效果，可以创建更加复杂的动画序列。

**3. 伪元素的过渡**
使用伪元素（如::before、::after）创建过渡效果，可以实现一些特殊的动画效果，如边框动画、加载动画等。

**4. 3D过渡效果**
使用3D变换（如rotateX、rotateY、perspective）创建立体的过渡效果。

**5. 结合其他CSS特性**
将过渡效果与其他CSS特性（如flexbox、grid、clip-path等）结合使用，可以创建更加丰富的动画效果。
:::

**示例：高级过渡效果**

```html
<div class="advanced-transitions">
  <h2>高级过渡效果示例</h2>
  
  <!-- 链式过渡 -->
  <div class="example">
    <h3>链式过渡</h3>
    <div class="chain-transition">链式过渡效果</div>
  </div>
  
  <!-- 嵌套元素的过渡 -->
  <div class="example">
    <h3>嵌套元素的过渡</h3>
    <div class="nested-container">
      <div class="nested-inner">嵌套元素</div>
    </div>
  </div>
  
  <!-- 伪元素的过渡 -->
  <div class="example">
    <h3>伪元素的过渡</h3>
    <div class="pseudo-transition">伪元素边框动画</div>
  </div>
  
  <!-- 3D过渡效果 -->
  <div class="example">
    <h3>3D过渡效果</h3>
    <div class="perspective-container">
      <div class="perspective-box">3D翻转</div>
    </div>
  </div>
  
  <!-- 结合clip-path的过渡 -->
  <div class="example">
    <h3>Clip-path过渡</h3>
    <div class="clip-path-transition">形状变化</div>
  </div>
</div>
```

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.advanced-transitions {
  font-family: Arial, sans-serif;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f8f9fa;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #007bff;
}

.example {
  background-color: white;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h3 {
  margin-bottom: 20px;
  color: #28a745;
}

.note {
  margin-top: 10px;
  color: #666;
  font-style: italic;
}

/* 尊重用户的动画偏好设置 */
@keyframes prefersReducedMotion {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.2);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

.prefers-reduced-motion-example {
  width: 200px;
  height: 200px;
  background-color: #007bff;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 auto;
  animation: prefersReducedMotion 2s ease-in-out infinite;
}

/* 当用户设置了减少动画的偏好时，禁用非必要的动画 */
@media (prefers-reduced-motion: reduce) {
  .prefers-reduced-motion-example {
    animation: none;
    transform: none;
  }
}

/* 动画控制选项 */
.animation-controls {
  margin-bottom: 20px;
}

.animation-controls button {
  padding: 8px 16px;
  margin: 0 5px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.animation-controls button:hover {
  background-color: #0056b3;
}

.animation-controls button:active {
  background-color: #004085;
}

.controllable-animation {
  width: 200px;
  height: 200px;
  background-color: #28a745;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 auto;
  animation: controllableAnimation 2s ease-in-out infinite;
}

@keyframes controllableAnimation {
  0% {
    transform: translateX(-50px) rotate(0deg);
  }
  50% {
    transform: translateX(50px) rotate(180deg);
  }
  100% {
    transform: translateX(-50px) rotate(360deg);
  }
}

/* 安全的动画（避免闪烁） */
.safe-animation {
  width: 200px;
  height: 200px;
  background-color: #6f42c1;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 auto;
  animation: safeAnimation 3s ease-in-out infinite;
}

@keyframes safeAnimation {
  0% {
    background-color: #6f42c1;
    transform: scale(1);
  }
  50% {
    background-color: #e83e8c;
    transform: scale(1.1);
  }
  100% {
    background-color: #6f42c1;
    transform: scale(1);
  }
}

/* JavaScript for animation controls */
<script>
  document.getElementById('playBtn').addEventListener('click', function() {
    document.getElementById('controllableAnimation').style.animationPlayState = 'running';
  });
  
  document.getElementById('pauseBtn').addEventListener('click', function() {
    document.getElementById('controllableAnimation').style.animationPlayState = 'paused';
  });
  
  document.getElementById('resetBtn').addEventListener('click', function() {
    const animation = document.getElementById('controllableAnimation');
    animation.style.animation = 'none';
    animation.offsetHeight; /* 触发重排 */
    animation.style.animation = 'controllableAnimation 2s ease-in-out infinite';
  });
</script>

## 七、总结

CSS动画是现代Web开发中创建动态效果的强大工具，它包括过渡（Transitions）、动画（Animations）和变换（Transforms）三个主要部分。通过合理使用这些技术，我们可以创建丰富、流畅的用户体验，同时保持良好的性能和可访问性。

### 7.1 关键要点回顾

1. **CSS过渡（Transitions）**：
   - 适合简单的状态变化动画
   - 可以定义过渡的属性、持续时间、时间曲线和延迟
   - 通常用于响应用户交互（如hover、active等）

2. **CSS动画（Animations）**：
   - 可以定义多个关键帧，实现复杂的动画效果
   - 提供更多的控制选项（如播放次数、方向、填充模式等）
   - 可以自动播放，不需要用户交互

3. **CSS变换（Transforms）**：
   - 允许对元素进行旋转、缩放、移动、倾斜等操作
   - 不会影响页面的布局（不会触发重排）
   - 支持2D和3D变换
   - 与过渡和动画结合使用，创建丰富的动态效果

4. **性能优化**：
   - 使用GPU加速（transform和opacity属性）
   - 减少重排（Reflow）和重绘（Repaint）
   - 使用will-change属性提前通知浏览器
   - 优化CSS选择器
   - 合理使用动画，避免过度使用

5. **可访问性考虑**：
   - 尊重用户的动画偏好设置（prefers-reduced-motion）
   - 提供动画控制选项
   - 避免可能触发癫痫发作的动画
   - 优化动画的可读性
   - 使用适当的颜色对比度
   - 提供替代内容

### 7.2 最佳实践建议

1. **选择合适的动画技术**：
   - 简单的状态变化使用过渡（Transitions）
   - 复杂的动画效果使用动画（Animations）
   - 位置和形状变化使用变换（Transforms）

2. **保持动画的简洁性**：
   - 避免过度使用动画，只在必要时使用
   - 保持动画的简洁性和相关性，避免分散用户的注意力
   - 确保动画与网站的整体设计风格一致

3. **优化性能**：
   - 优先使用transform和opacity属性进行动画
   - 避免在动画中使用会触发重排的属性
   - 使用will-change属性提前通知浏览器
   - 减少同时运行的动画数量

4. **确保可访问性**：
   - 尊重用户的动画偏好设置
   - 提供动画控制选项
   - 避免可能触发癫痫发作的动画
   - 确保动画不会影响内容的可读性

5. **测试和调试**：
   - 在不同的浏览器和设备上测试动画效果
   - 使用浏览器的开发者工具分析和优化动画性能
   - 获取用户反馈，不断改进动画效果

### 7.3 未来发展趋势

随着Web技术的不断发展，CSS动画也在不断演进。未来的CSS动画可能会包含以下趋势：

1. **更强大的动画API**：
   - Web Animations API的进一步发展，提供更强大的动画控制能力
   - 更丰富的动画属性和函数，支持更复杂的动画效果

2. **更好的性能优化**：
   - 浏览器对CSS动画的性能优化进一步提升
   - 新的硬件加速技术，使动画更加流畅

3. **增强的可访问性支持**：
   - 更多的可访问性特性，如更好的动画控制选项
   - 更完善的标准和指南，确保动画的可访问性

4. **与其他技术的融合**：
   - 与SVG、Canvas、WebGL等技术的深度融合
   - 与JavaScript框架的更好集成，提供更丰富的动画效果

5. **新的动画类型**：
   - 更多新的动画类型和效果，如流体动画、粒子动画等
   - 更真实的物理模拟，使动画更加自然和逼真

通过不断学习和实践CSS动画技术，我们可以创建出更加丰富、流畅、可访问的Web体验，提升用户满意度和网站的竞争力。
  width: 200px;
  height: 200px;
  background-color: #007bff;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  cursor: pointer;
  margin: 0 auto;
  /* 链式过渡：不同属性有不同的延迟 */
  transition-property: background-color, transform, border-radius;
  transition-duration: 0.5s;
  transition-timing-function: ease;
}

.chain-transition:hover {
  background-color: #dc3545; /* 立即开始 */
  transform: translateX(50px) scale(1.2); /* 0.2s后开始 */
  border-radius: 50%; /* 0.4s后开始 */
}

/* 嵌套元素的过渡 */
.nested-container {
  width: 200px;
  height: 200px;
  background-color: #ffc107;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  cursor: pointer;
  transition: transform 0.5s ease;
}

.nested-inner {
  width: 100px;
  height: 100px;
  background-color: #dc3545;
  color: white;
  text-align: center;
  line-height: 100px;
  font-weight: bold;
  border-radius: 5px;
  transition: all 0.5s ease 0.2s; /* 延迟0.2s开始 */
}

.nested-container:hover {
  transform: rotate(180deg);
}

.nested-container:hover .nested-inner {
  background-color: #28a745;
  transform: rotate(-180deg) scale(1.2);
  border-radius: 50%;
}

/* 伪元素的过渡 */
.pseudo-transition {
  position: relative;
  width: 200px;
  height: 200px;
  background-color: #6f42c1;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  cursor: pointer;
  margin: 0 auto;
  border-radius: 5px;
  transition: background-color 0.5s ease;
}

.pseudo-transition::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid transparent;
  border-radius: 5px;
  transition: all 0.5s ease;
}

.pseudo-transition:hover {
  background-color: #e83e8c;
}

.pseudo-transition:hover::before {
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border-color: #007bff;
  border-radius: 10px;
}

/* 3D过渡效果 */
.perspective-container {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  perspective: 1000px; /* 设置透视效果 */
}

.perspective-box {
  width: 100%;
  height: 100%;
  background-color: #28a745;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  cursor: pointer;
  transition: transform 1s ease;
  transform-style: preserve-3d; /* 保持3D效果 */
}

.perspective-box:hover {
  transform: rotateY(180deg); /* Y轴旋转180度 */
}

/* Clip-path过渡 */
.clip-path-transition {
  width: 200px;
  height: 200px;
  background-color: #fd7e14;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  cursor: pointer;
  margin: 0 auto;
  transition: clip-path 1s ease;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); /* 菱形 */
}

.clip-path-transition:hover {
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%); /* 矩形 */
}
```

## 三、CSS动画（Animations）

### 3.1 动画的基本概念

::: tip 动画的定义
CSS动画（Animations）是一种更强大的动画效果，它允许我们定义多个关键帧（keyframes），从而实现更加复杂和精确的动画控制。与过渡（transitions）不同，动画可以自动播放，不需要用户交互触发。

**动画的主要属性：**
- `animation-name`：定义要应用的动画名称（与@keyframes对应）
- `animation-duration`：定义动画的持续时间
- `animation-timing-function`：定义动画的时间曲线
- `animation-delay`：定义动画的延迟时间
- `animation-iteration-count`：定义动画的播放次数（1、infinite等）
- `animation-direction`：定义动画的播放方向（normal、reverse、alternate、alternate-reverse）
- `animation-fill-mode`：定义动画结束后元素的样式（none、forwards、backwards、both）
- `animation-play-state`：定义动画的播放状态（running、paused）
- `animation`：以上八个属性的简写形式

**@keyframes规则：**
使用@keyframes规则定义动画的关键帧，每个关键帧指定动画在特定时间点的样式。

**animation-iteration-count的常用值：**
- 数字：如`1`、`2`、`3`等
- `infinite`：无限循环

**animation-direction的常用值：**
- `normal`：默认值，正常播放
- `reverse`：反向播放
- `alternate`：交替播放（正向-反向）
- `alternate-reverse`：反向交替播放（反向-正向）

**animation-fill-mode的常用值：**
- `none`：默认值，动画结束后回到初始状态
- `forwards`：动画结束后保持最后一帧的样式
- `backwards`：动画开始前应用第一帧的样式
- `both`：同时应用forwards和backwards的效果

**特点：**
- 可以定义多个关键帧，实现复杂的动画效果
- 可以自动播放，不需要用户交互
- 提供更多的控制选项（如播放次数、方向、填充模式等）
- 可以暂停和恢复动画播放
:::

**示例：**

```html
<div class="animation-examples">
  <h2>CSS动画示例</h2>
  
  <!-- 基本动画 -->
  <div class="example">
    <h3>基本动画</h3>
    <div class="basic-animation">基本动画效果</div>
  </div>
  
  <!-- 多关键帧动画 -->
  <div class="example">
    <h3>多关键帧动画</h3>
    <div class="multi-keyframes">多关键帧动画</div>
  </div>
  
  <!-- 无限循环动画 -->
  <div class="example">
    <h3>无限循环动画</h3>
    <div class="infinite-animation">无限循环</div>
  </div>
  
  <!-- 交替播放动画 -->
  <div class="example">
    <h3>交替播放动画</h3>
    <div class="alternate-animation">交替播放</div>
  </div>
  
  <!-- 暂停/播放动画 -->
  <div class="example">
    <h3>暂停/播放动画</h3>
    <div class="play-pause-animation">悬停暂停</div>
  </div>
</div>
```

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.animation-examples {
  font-family: Arial, sans-serif;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f8f9fa;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #007bff;
}

.example {
  background-color: white;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h3 {
  margin-bottom: 20px;
  color: #28a745;
}

/* 基本动画 */
@keyframes basicAnimation {
  from {
    background-color: #28a745;
    transform: translateX(0);
  }
  to {
    background-color: #dc3545;
    transform: translateX(100px);
  }
}

.basic-animation {
  width: 200px;
  height: 200px;
  background-color: #28a745;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 auto;
  animation-name: basicAnimation;
  animation-duration: 2s;
  animation-timing-function: ease;
  animation-fill-mode: forwards;
}

/* 多关键帧动画 */
@keyframes multiKeyframes {
  0% {
    background-color: #007bff;
    transform: scale(1) rotate(0deg);
  }
  25% {
    background-color: #28a745;
    transform: scale(1.2) rotate(90deg);
  }
  50% {
    background-color: #ffc107;
    color: #212529;
    transform: scale(1) rotate(180deg);
  }
  75% {
    background-color: #dc3545;
    transform: scale(0.8) rotate(270deg);
  }
  100% {
    background-color: #007bff;
    transform: scale(1) rotate(360deg);
  }
}

.multi-keyframes {
  width: 200px;
  height: 200px;
  background-color: #007bff;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 auto;
  animation: multiKeyframes 4s ease infinite;
}

/* 无限循环动画 */
@keyframes infiniteAnimation {
  0% {
    transform: translateX(-50px);
    opacity: 0;
  }
  50% {
    transform: translateX(50px);
    opacity: 1;
  }
  100% {
    transform: translateX(-50px);
    opacity: 0;
  }
}

.infinite-animation {
  width: 200px;
  height: 200px;
  background-color: #6f42c1;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 auto;
  animation: infiniteAnimation 3s ease-in-out infinite;
}

/* 交替播放动画 */
@keyframes alternateAnimation {
  from {
    background-color: #e83e8c;
    transform: translateX(-50px);
  }
  to {
    background-color: #fd7e14;
    transform: translateX(50px);
  }
}

.alternate-animation {
  width: 200px;
  height: 200px;
  background-color: #e83e8c;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 auto;
  animation: alternateAnimation 2s ease-in-out infinite alternate;
}

/* 暂停/播放动画 */
@keyframes playPauseAnimation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.play-pause-animation {
  width: 200px;
  height: 200px;
  background-color: #28a745;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 50%;
  margin: 0 auto;
  animation: playPauseAnimation 2s linear infinite;
  cursor: pointer;
}

.play-pause-animation:hover {
  animation-play-state: paused;
  background-color: #dc3545;
}
```

### 3.2 动画的高级用法

::: info 动画的高级技巧
CSS动画提供了丰富的高级特性，可以创建更加复杂和精美的动画效果。

**1. 多动画组合**
可以在同一个元素上应用多个动画，通过设置不同的延迟和持续时间，创建复杂的动画序列。

**2. 动画控制**
使用JavaScript控制动画的播放、暂停、重置等操作。

**3. 性能优化**
- 使用transform和opacity属性进行动画，它们不会触发重排（reflow）
- 使用will-change属性提前通知浏览器元素将要发生变化
- 避免在动画中修改会触发重排的属性（如width、height、margin等）

**4. 动画缓动函数**
- 使用cubic-bezier()创建自定义的缓动函数
- 利用steps()函数创建步进动画（如打字机效果）

**5. SVG动画**
将CSS动画与SVG结合使用，创建更加复杂和精确的图形动画。

**6. 滚动触发的动画**
使用JavaScript监听滚动事件，当元素进入视口时触发动画。

**7. 视差滚动效果**
通过控制不同元素的滚动速度，创建视差滚动效果。
:::

**示例：高级动画效果**

```html
<div class="advanced-animations">
  <h2>高级动画效果示例</h2>
  
  <!-- 多动画组合 -->
  <div class="example">
    <h3>多动画组合</h3>
    <div class="multiple-animations">多动画组合</div>
  </div>
  
  <!-- 步进动画（打字机效果） -->
  <div class="example">
    <h3>步进动画</h3>
    <div class="typewriter">CSS动画很有趣！</div>
  </div>
  
  <!-- 脉冲动画 -->
  <div class="example">
    <h3>脉冲动画</h3>
    <div class="pulse-animation">脉冲效果</div>
  </div>
  
  <!-- 加载动画 -->
  <div class="example">
    <h3>加载动画</h3>
    <div class="loading-container">
      <div class="loading-spinner"></div>
    </div>
  </div>
  
  <!-- 弹跳动画 -->
  <div class="example">
    <h3>弹跳动画</h3>
    <div class="bounce-animation">弹跳效果</div>
  </div>
</div>
```

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.advanced-animations {
  font-family: Arial, sans-serif;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f8f9fa;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #007bff;
}

.example {
  background-color: white;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h3 {
  margin-bottom: 20px;
  color: #28a745;
}

/* 多动画组合 */
@keyframes colorChange {
  0% {
    background-color: #007bff;
  }
  50% {
    background-color: #dc3545;
  }
  100% {
    background-color: #28a745;
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.multiple-animations {
  width: 200px;
  height: 200px;
  background-color: #007bff;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 auto;
  animation: 
    colorChange 3s ease infinite alternate,
    rotate 4s linear infinite,
    pulse 2s ease-in-out infinite;
  will-change: transform, background-color; /* 性能优化 */
}

/* 步进动画（打字机效果） */
@keyframes typewriter {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

@keyframes blinkCursor {
  from, to {
    border-color: transparent;
  }
  50% {
    border-color: #007bff;
  }
}

.typewriter {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  border-right: 3px solid #007bff;
  white-space: nowrap;
  overflow: hidden;
  margin: 0 auto;
  animation: 
    typewriter 3s steps(15, end),
    blinkCursor 0.75s step-end infinite;
  max-width: fit-content;
}

/* 脉冲动画 */
@keyframes pulseEffect {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(0, 123, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
  }
}

.pulse-animation {
  width: 200px;
  height: 200px;
  background-color: #007bff;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 50%;
  margin: 0 auto;
  animation: pulseEffect 2s infinite;
}

/* 加载动画 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 弹跳动画 */
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -30px, 0);
  }
  70% {
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0, -4px, 0);
  }
}

.bounce-animation {
  width: 200px;
  height: 200px;
  background-color: #28a745;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 auto;
  animation: bounce 2s infinite;
  transform-origin: center bottom;
}
```

## 四、CSS变换（Transforms）

### 4.1 变换的基本概念

::: info 变换的定义
CSS变换（Transforms）是一种CSS属性，它允许我们对元素进行旋转、缩放、移动、倾斜等操作，而不影响页面的布局。变换通常与过渡（transitions）或动画（animations）结合使用，创建各种动态效果。

**transform的主要属性：**
- `translate()`：移动元素的位置
- `scale()`：缩放元素的大小
- `rotate()`：旋转元素
- `skew()`：倾斜元素
- `matrix()`：使用矩阵变换组合多个变换效果
- `perspective()`：设置透视效果
- `transform-origin`：定义变换的原点

**translate的常用函数：**
- `translateX(x)`：沿X轴移动
- `translateY(y)`：沿Y轴移动
- `translate(x, y)`：同时沿X轴和Y轴移动
- `translateZ(z)`：沿Z轴移动（3D变换）
- `translate3d(x, y, z)`：同时沿X轴、Y轴和Z轴移动

**scale的常用函数：**
- `scaleX(x)`：沿X轴缩放
- `scaleY(y)`：沿Y轴缩放
- `scale(sx, sy)`：同时沿X轴和Y轴缩放
- `scaleZ(z)`：沿Z轴缩放（3D变换）
- `scale3d(sx, sy, sz)`：同时沿X轴、Y轴和Z轴缩放

**rotate的常用函数：**
- `rotate(angle)`：绕Z轴旋转
- `rotateX(angle)`：绕X轴旋转（3D变换）
- `rotateY(angle)`：绕Y轴旋转（3D变换）
- `rotateZ(angle)`：绕Z轴旋转（3D变换）
- `rotate3d(x, y, z, angle)`：绕自定义轴旋转

**skew的常用函数：**
- `skewX(angle)`：沿X轴倾斜
- `skewY(angle)`：沿Y轴倾斜
- `skew(ax, ay)`：同时沿X轴和Y轴倾斜

**transform-origin的常用值：**
- 关键字：`top`、`bottom`、`left`、`right`、`center`
- 百分比：`50% 50%`（默认值，元素中心）
- 长度值：`10px 20px`

**特点：**
- 不会影响页面的布局（不会触发重排）
- 可以组合多个变换效果
- 支持2D和3D变换
- 与过渡和动画结合使用，创建丰富的动态效果
:::

**示例：**

```html
<div class="transform-examples">
  <h2>CSS变换示例</h2>
  
  <!-- 平移变换 -->
  <div class="example">
    <h3>平移变换</h3>
    <div class="transform-container">
      <div class="transform-box translate">平移</div>
    </div>
  </div>
  
  <!-- 缩放变换 -->
  <div class="example">
    <h3>缩放变换</h3>
    <div class="transform-container">
      <div class="transform-box scale">缩放</div>
    </div>
  </div>
  
  <!-- 旋转变换 -->
  <div class="example">
    <h3>旋转变换</h3>
    <div class="transform-container">
      <div class="transform-box rotate">旋转</div>
    </div>
  </div>
  
  <!-- 倾斜变换 -->
  <div class="example">
    <h3>倾斜变换</h3>
    <div class="transform-container">
      <div class="transform-box skew">倾斜</div>
    </div>
  </div>
  
  <!-- 组合变换 -->
  <div class="example">
    <h3>组合变换</h3>
    <div class="transform-container">
      <div class="transform-box combine">组合变换</div>
    </div>
  </div>
  
  <!-- 3D变换 -->
  <div class="example">
    <h3>3D变换</h3>
    <div class="perspective">
      <div class="transform-box rotate-3d">3D旋转</div>
    </div>
  </div>
</div>
```

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.transform-examples {
  font-family: Arial, sans-serif;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f8f9fa;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #007bff;
}

.example {
  background-color: white;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h3 {
  margin-bottom: 20px;
  color: #28a745;
}

.transform-container {
  width: 300px;
  height: 300px;
  margin: 0 auto;
  border: 2px dashed #ddd;
  border-radius: 5px;
  position: relative;
}

.transform-box {
  width: 100px;
  height: 100px;
  background-color: #007bff;
  color: white;
  text-align: center;
  line-height: 100px;
  font-weight: bold;
  border-radius: 5px;
  position: absolute;
  top: 100px;
  left: 100px;
  transition: transform 0.5s ease;
  cursor: pointer;
}

/* 平移变换 */
.translate:hover {
  transform: translate(50px, -50px);
}

/* 缩放变换 */
.scale:hover {
  transform: scale(1.5);
}

/* 旋转变换 */
.rotate:hover {
  transform: rotate(45deg);
}

/* 倾斜变换 */
.skew:hover {
  transform: skew(20deg, 10deg);
}

/* 组合变换 */
.combine:hover {
  transform: translate(30px, -30px) rotate(15deg) scale(1.2);
}

/* 3D变换 */
.perspective {
  width: 300px;
  height: 300px;
  margin: 0 auto;
  border: 2px dashed #ddd;
  border-radius: 5px;
  perspective: 1000px; /* 设置透视效果 */
}

.rotate-3d {
  width: 100px;
  height: 100px;
  background-color: #007bff;
  color: white;
  text-align: center;
  line-height: 100px;
  font-weight: bold;
  border-radius: 5px;
  margin: 100px;
  transition: transform 1s ease;
  cursor: pointer;
  transform-style: preserve-3d; /* 保持3D效果 */
}

.rotate-3d:hover {
  transform: rotateY(180deg); /* Y轴旋转180度 */
}
```

### 4.2 变换的高级用法

::: tip 变换的高级技巧
CSS变换提供了丰富的高级特性，可以创建更加复杂和精美的效果。

**1. 3D变换效果**
使用3D变换（如rotateX、rotateY、perspective）创建立体的视觉效果，如翻牌、立方体、旋转木马等。

**2. 变换原点的控制**
通过设置transform-origin属性，控制变换的中心点，可以创建更加精确和有趣的变换效果。

**3. 矩阵变换**
使用matrix()或matrix3d()函数，通过矩阵运算组合多个变换效果，实现更加复杂的变换。

**4. 背面可见性**
使用backface-visibility属性控制元素旋转时背面是否可见，这在创建翻牌效果时非常有用。

**5. 组合多个变换**
可以在同一个元素上应用多个变换，通过合理的顺序组合，创建复杂的效果。

**6. 性能优化**
- 使用transform属性进行动画，它不会触发重排（reflow）
- 避免在变换中使用会触发重排的属性
- 使用will-change属性提前通知浏览器元素将要发生变换
:::

**示例：高级变换效果**

```html
<div class="advanced-transforms">
  <h2>高级变换效果示例</h2>
  
  <!-- 3D翻牌效果 -->
  <div class="example">
    <h3>3D翻牌效果</h3>
    <div class="flip-card">
      <div class="flip-card-inner">
        <div class="flip-card-front">
          <h4>正面</h4>
          <p>点击翻转</p>
        </div>
        <div class="flip-card-back">
          <h4>背面</h4>
          <p>翻转效果</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 自定义变换原点 -->
  <div class="example">
    <h3>自定义变换原点</h3>
    <div class="origin-container">
      <div class="origin-box top-left">左上角</div>
      <div class="origin-box top-right">右上角</div>
      <div class="origin-box bottom-left">左下角</div>
      <div class="origin-box bottom-right">右下角</div>
    </div>
  </div>
  
  <!-- 3D立方体 -->
  <div class="example">
    <h3>3D立方体</h3>
    <div class="cube-container">
      <div class="cube">
        <div class="cube-face front">前</div>
        <div class="cube-face back">后</div>
        <div class="cube-face right">右</div>
        <div class="cube-face left">左</div>
        <div class="cube-face top">上</div>
        <div class="cube-face bottom">下</div>
      </div>
    </div>
  </div>
  
  <!-- 旋转木马效果 -->
  <div class="example">
    <h3>旋转木马效果</h3>
    <div class="carousel-container">
      <div class="carousel">
        <div class="carousel-item item-1">1</div>
        <div class="carousel-item item-2">2</div>
        <div class="carousel-item item-3">3</div>
        <div class="carousel-item item-4">4</div>
        <div class="carousel-item item-5">5</div>
        <div class="carousel-item item-6">6</div>
      </div>
    </div>
  </div>
</div>
```

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.advanced-transforms {
  font-family: Arial, sans-serif;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f8f9fa;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #007bff;
}

.example {
  background-color: white;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h3 {
  margin-bottom: 20px;
  color: #28a745;
}

/* 3D翻牌效果 */
.flip-card {
  perspective: 1000px;
  width: 200px;
  height: 200px;
  margin: 0 auto;
  cursor: pointer;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card:hover .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.flip-card-front {
  background-color: #007bff;
  color: white;
}

.flip-card-back {
  background-color: #28a745;
  color: white;
  transform: rotateY(180deg);
}

.flip-card h4 {
  margin-bottom: 10px;
  font-size: 20px;
}

/* 自定义变换原点 */
.origin-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  width: 400px;
  margin: 0 auto;
}

.origin-box {
  width: 150px;
  height: 150px;
  background-color: #6f42c1;
  color: white;
  text-align: center;
  line-height: 150px;
  font-weight: bold;
  border-radius: 5px;
  cursor: pointer;
  transition: transform 0.5s ease;
  margin: 0 auto;
}

.top-left {
  transform-origin: top left;
}

.top-right {
  transform-origin: top right;
}

.bottom-left {
  transform-origin: bottom left;
}

.bottom-right {
  transform-origin: bottom right;
}

.origin-box:hover {
  transform: rotate(45deg);
}

/* 3D立方体 */
.cube-container {
  width: 200px;
  height: 200px;
  margin: 50px auto;
  perspective: 1000px;
  perspective-origin: center;
}

.cube {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: rotateCube 10s infinite linear;
}

.cube-face {
  position: absolute;
  width: 200px;
  height: 200px;
  background-color: rgba(0, 123, 255, 0.8);
  border: 2px solid #fff;
  color: white;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
}

.front { transform: translateZ(100px); }
.back { transform: rotateY(180deg) translateZ(100px); }
.right { transform: rotateY(90deg) translateZ(100px); }
.left { transform: rotateY(-90deg) translateZ(100px); }
.top { transform: rotateX(90deg) translateZ(100px); }
.bottom { transform: rotateX(-90deg) translateZ(100px); }

@keyframes rotateCube {
  0% { transform: rotateX(0deg) rotateY(0deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}

/* 旋转木马效果 */
.carousel-container {
  width: 300px;
  height: 300px;
  margin: 0 auto;
  perspective: 1000px;
  perspective-origin: center;
}

.carousel {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: rotateCarousel 20s infinite linear;
}

.carousel-item {
  position: absolute;
  width: 100px;
  height: 100px;
  background-color: rgba(40, 167, 69, 0.8);
  border: 2px solid #fff;
  color: white;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  left: 100px;
  top: 100px;
}

.item-1 { transform: rotateY(0deg) translateZ(150px); }
.item-2 { transform: rotateY(60deg) translateZ(150px); }
.item-3 { transform: rotateY(120deg) translateZ(150px); }
.item-4 { transform: rotateY(180deg) translateZ(150px); }
.item-5 { transform: rotateY(240deg) translateZ(150px); }
.item-6 { transform: rotateY(300deg) translateZ(150px); }

@keyframes rotateCarousel {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}
```

## 五、动画性能优化

### 5.1 性能优化的重要性

::: tip 性能优化的重要性
在创建CSS动画时，性能优化是一个非常重要的考虑因素。性能良好的动画可以提供流畅的用户体验，而性能不佳的动画可能会导致页面卡顿、掉帧，影响用户体验。

**性能优化的好处：**
1. **流畅的动画效果**：避免动画卡顿和掉帧，提供流畅的视觉体验
2. **节省设备资源**：减少CPU和GPU的使用，降低设备的能耗
3. **改善用户体验**：流畅的动画效果可以提升用户体验和满意度
4. **提高页面性能**：减少动画对页面其他部分性能的影响
5. **更好的可访问性**：避免过度的动画效果影响有视觉障碍的用户
:::

### 5.2 性能优化的技巧

::: info 性能优化的技巧
以下是一些常用的CSS动画性能优化技巧：

**1. 使用GPU加速**
- 使用`transform`和`opacity`属性进行动画，它们可以触发GPU加速
- 通过设置`transform: translateZ(0)`或`transform: translate3d(0, 0, 0)`手动触发GPU加速
- 避免在动画中使用会触发重排（reflow）的属性（如width、height、margin、padding等）

**2. 减少重排（Reflow）和重绘（Repaint）**
- 重排（Reflow）：当元素的几何属性（如位置、大小）发生变化时，浏览器需要重新计算元素的位置和大小，这称为重排。重排的成本很高，会导致动画卡顿。
- 重绘（Repaint）：当元素的外观属性（如颜色、背景）发生变化时，浏览器需要重新绘制元素，这称为重绘。重绘的成本比重排低，但频繁的重绘也会影响性能。
- **优化方法**：
  - 使用`transform`和`opacity`属性进行动画，它们不会触发重排
  - 避免频繁操作DOM
  - 避免使用table布局
  - 减少CSS选择器的复杂性

**3. 使用will-change属性**
- `will-change`属性可以提前通知浏览器元素将要发生变化，让浏览器做好准备
- **常用值**：`transform`、`opacity`、`left`、`top`等
- **注意事项**：不要过度使用，否则可能会导致内存问题

**4. 优化CSS选择器**
- 避免使用通用选择器（*）
- 避免使用ID选择器过多
- 避免使用属性选择器作为关键选择器
- 保持选择器简单，避免过度嵌套

**5. 合理使用动画**
- 避免在页面上同时运行过多的动画
- 为非关键动画设置`animation-play-state: paused`，在需要时再播放
- 使用`prefers-reduced-motion`媒体查询，尊重用户的动画偏好设置

**6. 优化动画持续时间和缓动函数**
- 合理设置动画持续时间，避免过长或过短
- 选择合适的缓动函数，使动画更加自然
- 避免使用过于复杂的缓动函数，它们可能会增加计算成本

**7. 延迟加载非关键动画**
- 对于不在首屏的内容，可以延迟加载其动画
- 使用Intersection Observer API监测元素是否进入视口，然后再触发动画

**8. 避免使用JavaScript动画**
- CSS动画通常比JavaScript动画性能更好
- CSS动画可以利用GPU加速，而JavaScript动画通常运行在CPU上
- 对于复杂的动画，可以考虑使用Web Animations API，它提供了更好的性能和控制能力
:::

**示例：性能优化的动画**

```html
<div class="performance-optimization">
  <h2>动画性能优化示例</h2>
  
  <!-- GPU加速的动画 -->
  <div class="example">
    <h3>GPU加速的动画</h3>
    <div class="gpu-animation">GPU加速</div>
  </div>
  
  <!-- will-change属性 -->
  <div class="example">
    <h3>will-change属性</h3>
    <div class="will-change-animation">Will Change</div>
  </div>
  
  <!-- 避免重排的动画 -->
  <div class="example">
    <h3>避免重排的动画</h3>
    <div class="bad-animation">不好的做法（会触发重排）</div>
    <div class="good-animation">好的做法（使用transform）</div>
  </div>
  
  <!-- 减少动画数量 -->
  <div class="example">
    <h3>减少动画数量</h3>
    <div class="animation-grid">
      <div class="grid-item">动画项1</div>
      <div class="grid-item">动画项2</div>
      <div class="grid-item">动画项3</div>
      <div class="grid-item">动画项4</div>
    </div>
  </div>
  
  <!-- 尊重用户偏好 -->
  <div class="example">
    <h3>尊重用户偏好</h3>
    <div class="reduced-motion">减少动画</div>
  </div>
</div>
```

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.performance-optimization {
  font-family: Arial, sans-serif;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f8f9fa;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #007bff;
}

.example {
  background-color: white;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h3 {
  margin-bottom: 20px;
  color: #28a745;
}

/* GPU加速的动画 */
.gpu-animation {
  width: 200px;
  height: 200px;
  background-color: #007bff;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 auto;
  animation: gpuMove 2s ease-in-out infinite alternate;
  transform: translateZ(0); /* 手动触发GPU加速 */
}

@keyframes gpuMove {
  from {
    transform: translateX(-100px);
  }
  to {
    transform: translateX(100px);
  }
}

/* will-change属性 */
.will-change-animation {
  width: 200px;
  height: 200px;
  background-color: #28a745;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 auto;
  animation: willChangeMove 3s ease-in-out infinite;
  will-change: transform; /* 提前通知浏览器元素将要发生变换 */
}

@keyframes willChangeMove {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.2);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

/* 避免重排的动画 */
.bad-animation,
.good-animation {
  width: 200px;
  height: 200px;
  color: white;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  margin: 10px;
  display: inline-block;
  cursor: pointer;
  transition: all 0.5s ease;
}

.bad-animation {
  background-color: #dc3545;
}

/* 不好的做法：会触发重排 */
.bad-animation:hover {
  width: 250px;
  height: 250px;
  line-height: 250px;
}

.good-animation {
  background-color: #28a745;
}

/* 好的做法：使用transform，不会触发重排 */
.good-animation:hover {
  transform: scale(1.25);
}

/* 减少动画数量 */
.animation-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  width: 400px;
  margin: 0 auto;
}

.grid-item {
  width: 150px;
  height: 150px;
  background-color: #6f42c1;
  color: white;
  text-align: center;
  line-height: 150px;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 auto;
  cursor: pointer;
  transition: transform 0.3s ease;
  will-change: transform;
}

.grid-item:hover {
  transform: scale(1.1);
}

/* 尊重用户偏好 */
.reduced-motion {
  width: 200px;
  height: 200px;
  background-color: #ffc107;
  color: #212529;
  text-align: center;
  line-height: 200px;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 auto;
  animation: reducedMotion 2s ease-in-out infinite;
}

@keyframes reducedMotion {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 尊重用户的动画偏好设置 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 六、动画的可访问性考虑

### 6.1 可访问性的重要性

::: tip 可访问性的重要性
在创建CSS动画时，我们需要考虑动画对所有用户（包括有特殊需求的用户）的影响。过度或不恰当的动画可能会对有视觉障碍、认知障碍或癫痫等疾病的用户造成困扰或伤害。

**可访问性的好处：**
1. **包容所有用户**：确保所有用户（包括有特殊需求的用户）都能访问和使用网站
2. **符合法律法规**：许多国家和地区都有关于网站可访问性的法律法规
3. **扩大用户群体**：提高网站的可访问性，可以扩大潜在的用户群体
4. **提升品牌形象**：展示企业的社会责任感，提升品牌形象
5. **更好的用户体验**：良好的可访问性设计可以提升所有用户的体验
:::

### 6.2 可访问性的实践

::: info 可访问性的实践
以下是一些创建可访问的CSS动画的实践建议：

**1. 尊重用户的动画偏好设置**
- 使用`prefers-reduced-motion`媒体查询，检测用户是否设置了减少动画的系统偏好
- 当用户设置了减少动画的偏好时，减少或禁用非必要的动画效果

**2. 提供动画控制选项**
- 为用户提供控制动画的选项，如暂停、播放、调整速度等
- 允许用户完全禁用动画效果

**3. 避免可能触发癫痫发作的动画**
- 避免使用闪烁的动画，特别是频率在3-5Hz之间的闪烁
- 避免使用强烈的对比色和快速变化的动画
- 如果必须使用闪烁效果，确保闪烁频率低于3Hz或高于5Hz，并且持续时间不超过5秒

**4. 优化动画的可读性**
- 确保动画不会影响文本的可读性
- 避免在重要内容上使用过度的动画效果
- 确保动画效果不会使内容难以辨认或理解

**5. 使用适当的颜色对比度**
- 确保动画中使用的颜色具有足够的对比度，符合WCAG（Web内容无障碍指南）的标准
- 避免使用可能导致色觉障碍用户难以辨认的颜色组合

**6. 提供替代内容**
- 为依赖动画的信息提供静态替代内容
- 确保即使禁用动画，用户也能获取所有重要信息
:::

**示例：可访问的动画**

```html
<div class="accessible-animations">
  <h2>可访问的动画示例</h2>
  
  <!-- 尊重用户的动画偏好设置 -->
  <div class="example">
    <h3>尊重用户的动画偏好设置</h3>
    <div class="prefers-reduced-motion-example">减少动画偏好</div>
    <p class="note">如果您的系统设置了减少动画，这个动画将不会播放。</p>
  </div>
  
  <!-- 动画控制选项 -->
  <div class="example">
    <h3>动画控制选项</h3>
    <div class="animation-controls">
      <button id="playBtn">播放</button>
      <button id="pauseBtn">暂停</button>
      <button id="resetBtn">重置</button>
    </div>
    <div id="controllableAnimation" class="controllable-animation">可控动画</div>
  </div>
  
  <!-- 避免闪烁的动画 -->
  <div class="example">
    <h3>避免闪烁的动画</h3>
    <div class="safe-animation">安全的动画</div>
    <p class="note">这个动画避免了可能触发癫痫发作的闪烁效果。</p>
  </div>
</div>
```

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.accessible-animations {
  font-family: Arial, sans-serif;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f8f9fa;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #007bff;
}

.example {
  background-color: white;
  padding: 20px;