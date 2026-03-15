---
title: "Vue组件封装"
category: "实践技巧"
tags:
  - Vue
---

# Vue组件封装

## 命令式弹窗组件

::: details Vue3 命令式弹窗组件 定义 Vue
```vue
<!--  MessageBox.vue -->
<template>
  <div class="modal" >
    <div class="box" >
      <div class="text" >{{ msg }}</div>
      <Button @click="emit('click')"></Button>
    </div>
  </div>
</template>

<script setup>
import Button from './Button.vue'
const msg = ref('')
const emit = defineEmits(['click'])
</script>
```
:::



::: details Vue3 命令式弹窗组件 封装 JS


```js
//  ShowMsg.js
import MessageBox from '../components/MessageBox.vue'
import { createApp } from 'vue'


export default fucntion (msg,handler){
  const app = createApp(MessageBox,{
    msg,
    onclick: handler,
  })
  const div = document.createElement('div')
  app.mount(div)
  document.body.appendChild(div)
  return ()=>{
    app.unmount()
    div.remove()
  }
}

```
:::



::: details Vue3 命令式弹窗组件 使用 Vue

```vue
<template>
  <button @click="clickHandler">点击弹窗</button>
</template>
<script setup>
import { ShowMsg } from './utils/ShowMsg.js'

const clickHandler = () => {
  const close = ShowMsg('你点击了弹窗按钮',()=>{
    console.log('弹窗关闭了')
    close()
  })
}

</script>

```

:::


## vue中无缝轮播组件

::: details Vue3 无缝轮播组件
```html 
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue3 无缝轮播图组件</title>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .container {
      max-width: 1000px;
      width: 100%;
      padding: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 40px;
    }
    
    .header {
      text-align: center;
      color: white;
    }
    
    .header h1 {
      font-size: 2.8rem;
      margin-bottom: 15px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    
    .header p {
      font-size: 1.2rem;
      max-width: 700px;
      margin: 0 auto;
      line-height: 1.6;
      opacity: 0.9;
    }
    
    .carousel-container {
      position: relative;
      width: 100%;
      height: 500px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      margin: 20px 0;
    }
    
    .carousel-list {
      display: flex;
      height: 100%;
      transition: transform 0.5s ease;
    }
    
    .carousel-item {
      flex: 0 0 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
    }
    
    .carousel-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .item-info {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
      color: white;
      padding: 30px 20px 20px;
      text-align: center;
    }
    
    .item-info h3 {
      font-size: 1.8rem;
      margin-bottom: 8px;
    }
    
    .item-info p {
      font-size: 1.1rem;
      opacity: 0.9;
    }
    
    .carousel-control {
      position: absolute;
      top: 50%;
      width: 60px;
      height: 60px;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      color: white;
      border: none;
      font-size: 1.8rem;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(5px);
      transition: all 0.3s ease;
      z-index: 10;
    }
    
    .carousel-control:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-50%) scale(1.1);
    }
    
    .carousel-control.prev {
      left: 20px;
    }
    
    .carousel-control.next {
      right: 20px;
    }
    
    .indicator {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      z-index: 10;
    }
    
    .indicator span {
      display: block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
    
    .indicator span.active {
      background: #ffcc00;
      transform: scale(1.2);
      box-shadow: 0 0 10px rgba(255, 204, 0, 0.7);
    }
    
    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      background: rgba(255, 204, 0, 0.7);
      z-index: 10;
      transition: width 0.1s linear;
    }
    
    .keyboard-hint {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      padding: 8px 15px;
      border-radius: 20px;
      font-size: 0.9rem;
      z-index: 20;
      display: flex;
      gap: 8px;
    }
    
    .key {
      background: rgba(255, 255, 255, 0.2);
      padding: 3px 8px;
      border-radius: 5px;
      font-weight: bold;
    }
    
    .footer {
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
      margin-top: 20px;
      font-size: 1rem;
    }
    
    .code-block {
      background: rgba(0, 0, 0, 0.7);
      border-radius: 10px;
      padding: 20px;
      width: 100%;
      margin-top: 30px;
      color: #f8f8f2;
      font-family: 'Fira Code', monospace;
      overflow-x: auto;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    
    .code-header {
      color: #ff79c6;
      margin-bottom: 10px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .code-header::before {
      content: "";
      width: 12px;
      height: 12px;
      background: #ff5555;
      border-radius: 50%;
    }
    
    .code-comment {
      color: #6272a4;
    }
    
    .code-keyword {
      color: #ff79c6;
    }
    
    .code-function {
      color: #50fa7b;
    }
    
    .code-var {
      color: #bd93f9;
    }
    
    @media (max-width: 768px) {
      .carousel-container {
        height: 400px;
      }
      
      .header h1 {
        font-size: 2.2rem;
      }
      
      .header p {
        font-size: 1rem;
      }
      
      .carousel-control {
        width: 50px;
        height: 50px;
        font-size: 1.5rem;
      }
      
      .code-block {
        font-size: 0.8rem;
      }
    }
    
    @media (max-width: 480px) {
      .carousel-container {
        height: 300px;
      }
      
      .item-info h3 {
        font-size: 1.4rem;
      }
      
      .item-info p {
        font-size: 0.9rem;
      }
      
      .indicator span {
        width: 12px;
        height: 12px;
      }
      
      .keyboard-hint {
        top: 10px;
        right: 10px;
        font-size: 0.8rem;
      }
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="container">
      <div class="header">
        <h1>Vue3 无缝轮播图组件</h1>
        <p>基于Vue3 Composition API实现的无缝轮播组件，移除直接DOM操作，使用纯响应式方式实现无限循环效果</p>
      </div>
      
      <div class="carousel-container">
        <div class="keyboard-hint">
          <span>键盘导航:</span>
          <span class="key">←</span>
          <span class="key">→</span>
          <span class="key">空格</span>
        </div>
        
        <!-- 进度条 -->
        <div class="progress-bar" :style="{ width: progressWidth }"></div>
        
        <!-- 轮播图列表 -->
        <div 
          class="carousel-list" 
          :style="{ transform: `translateX(-${currentPosition * 100}%)`, transition: transitionEnabled ? 'transform 0.5s ease' : 'none' }"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        >
          <!-- 最后一项的克隆（用于无缝衔接） -->
          <div class="carousel-item" v-if="displayItems.length > 0">
            <img :src="displayItems[displayItems.length - 1].image" :alt="displayItems[displayItems.length - 1].title" />
            <div class="item-info">
              <h3>{{ displayItems[displayItems.length - 1].title }}</h3>
              <p>{{ displayItems[displayItems.length - 1].description }}</p>
            </div>
          </div>
          
          <!-- 原始项目 -->
          <div v-for="(item, index) in displayItems" :key="index" class="carousel-item">
            <img :src="item.image" :alt="item.title" />
            <div class="item-info">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </div>
          
          <!-- 第一项的克隆（用于无缝衔接） -->
          <div class="carousel-item" v-if="displayItems.length > 0">
            <img :src="displayItems[0].image" :alt="displayItems[0].title" />
            <div class="item-info">
              <h3>{{ displayItems[0].title }}</h3>
              <p>{{ displayItems[0].description }}</p>
            </div>
          </div>
        </div>
        
        <!-- 控制按钮 -->
        <div class="carousel-control prev" @click="prevSlide">&lt;</div>
        <div class="carousel-control next" @click="nextSlide">&gt;</div>
        
        <!-- 指示器 -->
        <div class="indicator">
          <span
            v-for="(item, index) in displayItems"
            :key="index"
            :class="{ active: currentIndex === index }"
            @click="goToSlide(index)"
          ></span>
        </div>
      </div>
      
      <div class="footer">
        Vue3无缝轮播图组件 | 优化版本 | 支持触摸、键盘和自动播放
      </div>
      
      <div class="code-block">
        <div class="code-header">无缝轮播实现原理</div>
        <pre>
&lt;script setup&gt;
<span class="code-keyword">import</span> { ref, computed, onMounted, onUnmounted, watch } <span class="code-keyword">from</span> <span class="code-var">'vue'</span>

<span class="code-comment">// 响应式数据</span>
<span class="code-keyword">const</span> currentIndex = ref(0)
<span class="code-keyword">const</span> currentPosition = ref(1) <span class="code-comment">// 初始位置在第一个原始项（跳过克隆项）</span>
<span class="code-keyword">const</span> transitionEnabled = ref(true)

<span class="code-comment">// 计算显示项目（添加首尾克隆项）</span>
<span class="code-keyword">const</span> displayItems = computed(() => {
  <span class="code-keyword">return</span> props.items
})

<span class="code-comment">// 处理无缝轮播边界</span>
watch(currentPosition, (newVal) => {
  <span class="code-comment">// 当滑动到最后一个克隆项时，无缝跳转到第一个原始项</span>
  <span class="code-keyword">if</span> (newVal === displayItems.value.length + 1) {
    setTimeout(() => {
      transitionEnabled.value = false
      currentPosition.value = 1
      currentIndex.value = 0
      setTimeout(() => transitionEnabled.value = true, 50)
    }, 500)
  }
  
  <span class="code-comment">// 当滑动到第一个克隆项时，无缝跳转到最后一个原始项</span>
  <span class="code-keyword">if</span> (newVal === 0) {
    setTimeout(() => {
      transitionEnabled.value = false
      currentPosition.value = displayItems.value.length
      currentIndex.value = displayItems.value.length - 1
      setTimeout(() => transitionEnabled.value = true, 50)
    }, 500)
  }
})
&lt;/script&gt;
        </pre>
      </div>
    </div>
  </div>

  <script>
    const { createApp, ref, computed, onMounted, onUnmounted, watch } = Vue;
    
    const app = createApp({
      setup() {
        // 轮播图数据
        const items = ref([
          {
            id: 1,
            title: "山间日出",
            description: "清晨的第一缕阳光洒在山间，唤醒沉睡的大地",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
          },
          {
            id: 2,
            title: "森林小径",
            description: "漫步在静谧的林间小路，感受大自然的呼吸",
            image: "https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
          },
          {
            id: 3,
            title: "湖畔风光",
            description: "湖面如镜，倒映着天空与远山的倩影",
            image: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
          },
          {
            id: 4,
            title: "雪山之巅",
            description: "巍峨的雪山在蓝天下闪耀着圣洁的光芒",
            image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
          }
        ]);
        
        // 当前激活的索引（原始项目）
        const currentIndex = ref(0);
        // 当前位置（包含克隆项）
        const currentPosition = ref(1);
        // 是否启用过渡效果
        const transitionEnabled = ref(true);
        // 自动播放间隔
        const autoplayInterval = ref(5000);
        // 自动播放定时器
        let autoplayTimer = null;
        // 是否自动播放
        const isAutoplay = ref(true);
        // 触摸开始位置
        const touchStartX = ref(0);
        // 当前触摸位置
        const touchCurrentX = ref(0);
        // 是否正在拖动
        const isDragging = ref(false);
        // 进度条宽度
        const progressWidth = ref('0%');
        // 进度条更新时间
        let progressUpdateTime = Date.now();
        
        // 计算显示项目（添加首尾克隆项）
        const displayItems = computed(() => {
          return items.value;
        });
        
        // 处理触摸开始事件
        const handleTouchStart = (e) => {
          touchStartX.value = e.touches[0].clientX;
          touchCurrentX.value = touchStartX.value;
          isDragging.value = true;
          pauseAutoplay();
        };
        
        // 处理触摸移动事件
        const handleTouchMove = (e) => {
          if (!isDragging.value) return;
          touchCurrentX.value = e.touches[0].clientX;
        };
        
        // 处理触摸结束事件
        const handleTouchEnd = () => {
          if (!isDragging.value) return;
          
          const diff = touchStartX.value - touchCurrentX.value;
          
          // 如果滑动距离超过100px，则切换幻灯片
          if (Math.abs(diff) > 100) {
            if (diff > 0) {
              nextSlide();
            } else {
              prevSlide();
            }
          }
          
          isDragging.value = false;
          resetProgress();
          startAutoplay();
        };
        
        // 处理鼠标按下事件（用于桌面端拖动）
        const handleMouseDown = (e) => {
          touchStartX.value = e.clientX;
          touchCurrentX.value = touchStartX.value;
          isDragging.value = true;
          pauseAutoplay();
          e.preventDefault();
        };
        
        // 处理鼠标移动事件
        const handleMouseMove = (e) => {
          if (!isDragging.value) return;
          touchCurrentX.value = e.clientX;
        };
        
        // 处理鼠标释放事件
        const handleMouseUp = () => {
          if (!isDragging.value) return;
          
          const diff = touchStartX.value - touchCurrentX.value;
          
          // 如果拖动距离超过100px，则切换幻灯片
          if (Math.abs(diff) > 100) {
            if (diff > 0) {
              nextSlide();
            } else {
              prevSlide();
            }
          }
          
          isDragging.value = false;
          resetProgress();
          startAutoplay();
        };
        
        // 开始自动播放
        const startAutoplay = () => {
          if (isAutoplay.value) {
            clearInterval(autoplayTimer);
            autoplayTimer = setInterval(() => {
              nextSlide();
            }, autoplayInterval.value);
          }
        };
        
        // 暂停自动播放
        const pauseAutoplay = () => {
          clearInterval(autoplayTimer);
        };
        
        // 重置进度条
        const resetProgress = () => {
          progressWidth.value = '0%';
          progressUpdateTime = Date.now();
        };
        
        // 更新进度条
        const updateProgress = () => {
          const elapsed = Date.now() - progressUpdateTime;
          const percentage = Math.min(100, (elapsed / autoplayInterval.value) * 100);
          progressWidth.value = `${percentage}%`;
          
          if (percentage < 100) {
            requestAnimationFrame(updateProgress);
          }
        };
        
        // 切换到上一张幻灯片
        const prevSlide = () => {
          if (currentPosition.value === 0) {
            // 已经到达克隆项，但watch会处理跳转
            currentPosition.value = displayItems.value.length;
          } else {
            currentPosition.value -= 1;
          }
          
          // 更新当前索引（原始项目）
          if (currentIndex.value === 0) {
            currentIndex.value = displayItems.value.length - 1;
          } else {
            currentIndex.value -= 1;
          }
          
          resetProgress();
        };
        
        // 切换到下一张幻灯片
        const nextSlide = () => {
          if (currentPosition.value === displayItems.value.length + 1) {
            // 已经到达克隆项，但watch会处理跳转
            currentPosition.value = 1;
          } else {
            currentPosition.value += 1;
          }
          
          // 更新当前索引（原始项目）
          if (currentIndex.value === displayItems.value.length - 1) {
            currentIndex.value = 0;
          } else {
            currentIndex.value += 1;
          }
          
          resetProgress();
        };
        
        // 跳转到指定幻灯片
        const goToSlide = (index) => {
          currentIndex.value = index;
          currentPosition.value = index + 1; // 加1因为前面有一个克隆项
          resetProgress();
        };
        
        // 处理键盘事件
        const handleKeyDown = (e) => {
          switch(e.key) {
            case 'ArrowLeft':
              prevSlide();
              break;
            case 'ArrowRight':
              nextSlide();
              break;
            case ' ':
              isAutoplay.value = !isAutoplay.value;
              if (isAutoplay.value) {
                startAutoplay();
                resetProgress();
              } else {
                pauseAutoplay();
              }
              break;
          }
        };
        
        // 监听位置变化，处理无缝轮播边界
        watch(currentPosition, (newVal) => {
          // 当滑动到最后一个克隆项时，无缝跳转到第一个原始项
          if (newVal === displayItems.value.length + 1) {
            setTimeout(() => {
              transitionEnabled.value = false;
              currentPosition.value = 1;
              currentIndex.value = 0;
              setTimeout(() => transitionEnabled.value = true, 50);
            }, 500);
          }
          
          // 当滑动到第一个克隆项时，无缝跳转到最后一个原始项
          if (newVal === 0) {
            setTimeout(() => {
              transitionEnabled.value = false;
              currentPosition.value = displayItems.value.length;
              currentIndex.value = displayItems.value.length - 1;
              setTimeout(() => transitionEnabled.value = true, 50);
            }, 500);
          }
        });
        
        // 组件挂载时设置事件监听
        onMounted(() => {
          startAutoplay();
          resetProgress();
          updateProgress();
          window.addEventListener('keydown', handleKeyDown);
        });
        
        // 组件卸载时清除定时器和事件监听
        onUnmounted(() => {
          clearInterval(autoplayTimer);
          window.removeEventListener('keydown', handleKeyDown);
        });
        
        return {
          items,
          displayItems,
          currentIndex,
          currentPosition,
          progressWidth,
          transitionEnabled,
          handleTouchStart,
          handleTouchMove,
          handleTouchEnd,
          handleMouseDown,
          handleMouseMove,
          handleMouseUp,
          prevSlide,
          nextSlide,
          goToSlide
        };
      }
    });
    
    app.mount('#app');
  </script>
</body>
</html>

```
:::


## 类封装分页器

::: details Vue3 类 分页器
```js
import { ref, computed, onMounted, onUnmounted } from 'vue';

type EventCallback<T = any> = (result?: T) => void;
type DataPath<T> = string; // 可以使用更严格的路径类型工具，这里保持简单

interface PageServeOptions<RequestParams extends any[] = any[]> {
  before?: RequestParams[0];
  after?: RequestParams[1];
}

interface EventItem {
  type: symbol;
  callback: EventCallback;
}

export class PageServe<T = any, RequestParams extends any[] = any[]> {
  pageNum: number = 0;
  pageSize: number = 10;
  loading: boolean = false;
  count: number = 0;
  total: number = 0;
  dataList: T[] = [];
  dataSourcesField: DataPath<T> = 'data';
  otherData: Record<string, any> = {};
  private events: EventItem[] = [];
  
  readonly eventType = {
    resultBack: Symbol('resultBack'),
  };

  params: PageServeOptions<RequestParams> = {
    before: undefined,
    after: undefined
  };

  private request?: (...args: RequestParams) => Promise<any>;
  private dataCallBack?: (data: T[]) => void;

  constructor(
    request?: (...args: RequestParams) => Promise<any>,
    params: PageServeOptions<RequestParams> = { before: undefined, after: undefined }
  ) {
    this.request = request;
    this.params = params;
  }

  addEvent(type: symbol, callback: EventCallback): void {
    this.events.push({ type, callback });
  }

  setParams(params: PageServeOptions<RequestParams>): void {
    this.params = params;
  }

  initPageInfo(pageNum: number, pageSize: number): void {
    this.pageNum = pageNum;
    this.pageSize = pageSize;
  }

  setPageInfo(pageNum: number, pageSize: number, clear: boolean = false): void {
    this.pageNum = pageNum;
    this.pageSize = pageSize;
    if (clear && !this.loading) {
      this.dataList = [];
    }
  }

  dataBack(callback: (data: T[]) => void): void {
    this.dataCallBack = callback;
  }

  setDataField(pathField: DataPath<T>): void {
    this.dataSourcesField = pathField;
  }

  private getObjectPath<R = any>(path: string, obj: any): R | undefined {
    return path.split('.').reduce((prev, curr) => prev?.[curr], obj);
  }

  async nextData(): Promise<T[]> {
    if (this.loading || !this.request) return this.dataList;

    try {
      this.loading = true;
      const requestArgs = this.buildRequestArgs();
      const response = await this.request(...requestArgs);

      this.handleResponse(response);
      return this.dataList;
    } catch (error) {
      this.handleError(error);
      return [];
    } finally {
      this.loading = false;
    }
  }

  private buildRequestArgs(): RequestParams {
    if (this.params.before !== undefined && this.params.after !== undefined) {
      return [this.params.before, this.params.after, this.pageNum, this.pageSize] as RequestParams;
    }
    return [this.pageNum, this.pageSize] as RequestParams;
  }

  private handleResponse(response: any): void {
    const data = this.getObjectPath<T[]>(this.dataSourcesField, response) || [];
    
    if (data.length) this.pageNum++;
    this.dataList.push(...data);
    
    if (response.data?.total) {
      this.total = response.data.total;
    }

    this.emitEvent(this.eventType.resultBack, response);
    this.dataCallBack?.(this.dataList);
  }

  private handleError(error: any): void {
    if (error.errMsg !== "request:fail abort") {
      console.error('PageServe request failed:', error);
    }
  }

  private emitEvent(type: symbol, result?: any): void {
    this.events
      .filter(event => event.type === type)
      .forEach(event => event.callback(result));
  }
}


```
:::



## 封装唯一时间倒计时Hooks

::: details Vue3 Hooks倒计时
```js
import { reactive } from 'vue';

const servecData = reactive<any>({
    ms: 0, // 倒计时秒
    maxMs: 0,
    isBuy: false,
    taskId: null,
    dateTime: '00:00:00'
});

// 格式化时间
function formatTime(seconds:number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function startLoop() {
    if (servecData.ms > 0) {
        servecData.ms--;
        servecData.dateTime = formatTime(servecData.ms);
    } else {
        servecData.ms = servecData.maxMs;
        servecData.dateTime = formatTime(servecData.ms);
    }
    servecData.taskId = setTimeout(startLoop, 1000) as unknown as number;
}

export const NewBieServeic = {
    startTime(maxMs: number) {
        servecData.maxMs = maxMs;
        servecData.ms = maxMs;
        servecData.dateTime = formatTime(servecData.ms);
        if (!servecData.taskId) {
            startLoop();
        }
    },
    endTime() {
        clearTimeout(servecData.taskId as any);
        servecData.taskId = null;
    }
};

export const useNewBieData = () => {
    return servecData;
};
```


```js
//  使用

// 显示时间
import { useNewBieData } from "@/hooks/newBieBox.ts"
{/* <div >{{ newBieData.dateTime }}</div>  */}
const newBieData = useNewBieData()


// 设置倒计时
import { NewBieServeic, useNewBieData } from "@/hooks/newBieBox.ts"
const newBieData = useNewBieData()
NewBieServeic.startTime(60) // 60秒倒计时

```
:::



## 封装手势滑动组件


::: details Vue3 手势滑动组件
```html
<template>
  <div  class="gesture_container" @touchend="onTouchend" @touchstart="onTouchStart" @touchmove="onTouchMove">

    <div class="gesture_box" :style="{'--distanceX':`${distanceX/10}px`}">
      <slot></slot>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const emits  = defineEmits(['gesture']);
const startX = ref(0);
const startY = ref(0);
const distanceX = ref(0);
const distanceY = ref(0);

const onTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0];
  startX.value = touch.clientX;
  startY.value = touch.clientY;
};

const onTouchMove = (event: TouchEvent) => {
  if (sessionStorage.getItem('startDrag')) {
    return;
  }
  const touch = event.touches[0];
  distanceX.value = touch.clientX - startX.value;
  distanceY.value = touch.clientY - startY.value;
};
const onTouchend = (event: TouchEvent) => {
  if (Math.abs(distanceX.value)>50){
    if (distanceX.value>0){
      emits('gesture',0);
    }else {
      emits('gesture',1);
    }
  }

  distanceX.value = 0
  distanceY.value = 0

}
</script>

<style scoped lang="less">
.gesture_container {
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  .gesture_box{
    transition: .1s ease;
    transform: translateX(var(--distanceX));
  }
}
</style>

```

```html
<!-- 使用 -->
  <Gesture @gesture="handleGesture"><View></View></Gesture>

```

:::


## 封装拖动进度条

::: details Vue3 拖动进度条

```html
<template>
    <div class="progress-container">
        <div class="time-display" v-if="showTime">
            <span style="color: #fff;">{{ currentTime }}</span> / {{ totalDuration }}
        </div>
        <div ref="trackRef" class="progress-track" @mousedown.prevent="startDrag" @touchstart.prevent="startDrag">
            <div class="progress-fill" :style="fillStyle" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
    progress: number
    videoRef: any
}>()
const emit = defineEmits(['update:modelValue', 'dragging','onDragStart', 'onDragEnd'])

const { videoRef } = toRefs(props)
const switch_ = ref(false)
const duration = ref(0)
const progress2 = ref(0)
const currentTime = ref('00:00');
const totalDuration = ref('00:00');
const showTime = ref(false);
const height = ref('0.04883rem')
const activeColor = ref('#d9d9d9')
const padding = ref<string>('0')
const borderRadius = ref<string>('2px')

const trackRef = ref<HTMLDivElement>()
const isDragging = ref(false)

// 样式计算
const fillStyle = computed(() => ({
    width: `${progress2.value}%`,
    backgroundColor: isDragging.value ? '#E60012' : '#FFF',
    transition: isDragging.value ? 'none' : 'width 0.2s ease, background-color 0.2s ease'
}))

let moveHandler: ((e: Event) => void) | null = null
let preventScrollHandler: ((e: Event) => void) | null = null
// 新增 iOS 专用处理
const bodyScrollHandler = (e: TouchEvent) => {
  if (isDragging.value) e.preventDefault()
}
onMounted(() => {
  document.body.addEventListener('touchmove', bodyScrollHandler, { passive: false })
})

onBeforeUnmount(() => {
  document.body.removeEventListener('touchmove', bodyScrollHandler)
})


// 获取进度值
const getProgress = (clientX: number) => {
    if (!trackRef.value) return 0
    const rect = trackRef.value.getBoundingClientRect()
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width))
    return Number(((offsetX / rect.width) * 100).toFixed(2))
}

// 统一处理输入事件
const handleInput = (event: MouseEvent | TouchEvent) => {
    const clientX = event instanceof TouchEvent
        ? event.touches[0].clientX
        : event.clientX
    const newValue = getProgress(clientX)

    if (Math.abs(newValue - progress2.value) > 0.5) {
        progress2.value = newValue
        if (!isDragging.value) {
            emit('update:modelValue', newValue)
        }
    }
}

// 开始拖拽
const startDrag = (event: MouseEvent | TouchEvent) => {
    event.stopPropagation()
    emit('onDragStart')
    isDragging.value = true
    switch_.value = true
    height.value = `${32 / 102.4}rem`
    activeColor.value = '#E60012'
    padding.value = `0 ${61 / 102.4}rem`
    borderRadius.value = '4px'
    showTime.value = true; // 显示时间
    sessionStorage.setItem('startDrag', '1')
    handleInput(event)

    // 添加事件监听
    const moveEvent = event instanceof TouchEvent ? 'touchmove' : 'mousemove'
    const endEvent = event instanceof TouchEvent ? 'touchend' : 'mouseup'

    moveHandler = (e: Event) => {
      e.preventDefault()
      handleDrag(e as MouseEvent | TouchEvent)
    }
    // 阻止页面滚动
    preventScrollHandler = (e: Event) => {
      e.preventDefault()
    }

    document.addEventListener(moveEvent, moveHandler, { passive: true })
    document.addEventListener(endEvent, stopDrag)
}

// 拖拽处理
const handleDrag = (event: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return
    handleInput(event)
    emit('dragging', progress2.value)
}

// 停止拖拽
const stopDrag = (event: MouseEvent | TouchEvent) => {
  sessionStorage.removeItem('startDrag')

    const isTouch = event instanceof TouchEvent
    isDragging.value = false
    switch_.value = false
    height.value = `${5 / 102.4}rem`
    activeColor.value = '#d9d9d9'
    padding.value = '0'
    borderRadius.value = '2px'
    showTime.value = false; // 隐藏时间

    emit('update:modelValue', progress2.value)
    emit('onDragEnd')

    // 移除事件监听
    // const moveEvent = event instanceof TouchEvent ? 'touchmove' : 'mousemove'
    // const endEvent = event instanceof TouchEvent ? 'touchend' : 'mouseup'
    const moveEvent = isTouch ? 'touchmove' : 'mousemove'
    const endEvent = isTouch ? 'touchend' : 'mouseup'
    // document.removeEventListener(moveEvent, handleDrag)
    if (moveHandler) {
        document.removeEventListener(moveEvent, moveHandler)
    }
    document.removeEventListener(endEvent, stopDrag)
    if (preventScrollHandler) {
        document.removeEventListener('touchmove', preventScrollHandler)
        document.removeEventListener('wheel', preventScrollHandler)
    }
}
// props.progress
watch(
  () => props.progress,
  (newValue: number) => {
    if (!switch_.value) {
      progress2.value = newValue
      if (!duration.value) duration.value = videoRef.value.duration
      updateDisplayTime(progress2.value);
    }
  }
)
// progress2.value
watch(
  () => progress2.value,
  (newValue: number) => {
    if (switch_.value) videoRef.value.currentTime = (duration.value / 100) * newValue
    updateDisplayTime(newValue);
  }
)
// 显示时间
const updateDisplayTime = (progress: number) =>{
  const currentSeconds = (duration.value / 100) * progress;
  currentTime.value = formatTime(currentSeconds);
  totalDuration.value = formatTime(duration.value);
}
// 格式化时间
const formatTime = (seconds: number): string =>{
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}



</script>

<style scoped>
.progress-container {
    position: absolute;
    width: 100%;
    padding: 0 16px;
    /* height: 3px; */
    height: v-bind(height);
    border-radius: v-bind(borderRadius);
    cursor: pointer;
    user-select: none;
    touch-action: none;
    bottom: 0px;
    z-index: 8;
}
.time-display{
    position: absolute;
    top: -1rem;
    left: 0;
    width: 100%;
    text-align: center;
    color: #FFFFFF99;
    z-index: 10;
    font-size: 18px;
    font-weight: 600;
    font-family: Figtree-Semibold;
    touch-action: none;
}
.progress-track {
    position: absolute;
    width: calc(100% - 32px);
    /* height: 100%; */
    background-color: rgba(255, 255, 255, 0.2);
    /* border-radius: 1.5px; */
    border-radius: v-bind(borderRadius);
    overflow: hidden;
    height: v-bind(height);
}

.progress-fill {
    position: absolute;
    height: 100%;
    height: v-bind(height);
    /* border-radius: 1.5px; */
    border-radius: v-bind(borderRadius);
    will-change: width;
    z-index: 9;
}

/* 触摸优化 */
@media (hover: hover) {
    .progress-track:hover .progress-fill {
        background-color: #E60012 !important;
    }
}
</style>
```
```html
 <!-- 使用 -->
 <DraggableProgress :progress="record.progress" :video-ref="record.videoRef"
    @onDragStart="handleDragStart" @onDragEnd="handleDragEnd" />

```
:::


## 封装动画效果弹窗组件

::: details Vue3 动画效果弹窗组件

```html
<script setup lang="ts">
import { useLanguageStore } from '@/stores/languageStore'
import { useUserStore } from '@/stores/userStore'
import { profileApi } from '@/api/profile'
import { LanguageMap } from '@/utils/language'
import { useI18n } from 'vue-i18n'
import { CdnBaseUrl } from '@/utils/getImage'



const { locale, t } = useI18n()
const { modelValue, isdetails } = defineProps<{
  modelValue: boolean
  isdetails: boolean
}>()
const emit = defineEmits(['update:modelValue', 'ToggleLanguage', 'sendData'])


const languageStore = useLanguageStore()
const userStore = useUserStore()
const handleClose = () => {
  emit('update:modelValue', false)
}

const languageResCode = ref(0)
const languageList = [
  { name: 'en', text: 'English' },
  { name: 'ru', text: 'Русский' }, // 俄语
  { name: 'zh', text: '繁體中文' }, // 繁体中文
  { name: 'id', text: 'Bahasa Indonesia' }, // 印尼语
  { name: 'ja', text: '日本語' }, // 日语
  { name: 'de', text: 'Deutsch' }, // 德语
  { name: 'fr', text: 'Français' }, // 法语
  { name: 'ko', text: '한국어' }, // 韩语
  { name: 'vi', text: 'Tiếng Việt' }, // 越南语
  { name: 'es', text: 'Español' }, // 西班牙语
  { name: 'pt', text: 'Português' }, // 葡萄牙语
  { name: 'fil', text: 'Filipino' }, // 菲律宾语
  { name: 'th', text: 'ภาษาไทย' }, // 泰语
];

// 发送切换语言请求
const sendLanguage = async (lan_code: number) => {
  const res = await profileApi.setLanguage(lan_code);
  // console.log('----发送切换语言请求----',res.lan_code);
  languageResCode.value = res.lan_code;
  userStore.lan_code = res.lan_code;

}

const getTextByName = (name: string): string | undefined => {
  return languageList.find(lang => lang.name === name)?.text;
};
const getKeyByValue = (value: string): number => {
  return Number(Object.entries(LanguageMap).find(([key, val]) => val === value)?.[0]);
};



// 触发自定义事件并传递数据
const sendDataToParent = () => {
  const data = '这是从子组件传递过来的数据';
  emit('sendData', data);
};
const selectedLanguage = ref(getTextByName(LanguageMap[languageStore.lan_code]) || 'English');
const ToggleLanguage = (item: any) => {
  // 对应项的active状态
  selectedLanguage.value = item.text; // 文本

  sendLanguage(getKeyByValue(item.name)); // 发送请求
  languageStore.setLanguage(getKeyByValue(item.name)); // 切换语言
  // userStore.lan_code = getKeyByValue(item.name); // 切换用户语言
  locale.value = item.name;
  handleClose()
}



onMounted(() => {
})
</script>

<template>
  <Teleport to="body">
    <Transition name="mask-fade">
      <div class="languagePop_msk" @touchmove.prevent v-if="modelValue" @click="handleClose"></div>
    </Transition>
    <Transition name="sheet-slide">
      <div class="sheet_content" @touchmove.prevent v-if="modelValue">
        <div class="language-popup">
          <img :src="CdnBaseUrl(`close_icon`)" alt="" class="close_icon" @click="handleClose" />
          <!-- 语言 -->
          <div class="lang_title" >{{ t(`Selecting your preferred language can enhance the accuracy of the content displayed on the homepage`) }}</div>
          <div class="language_box">
            <div :class="['lang_item', selectedLanguage === item.text ? 'active' : '']"
              v-for="(item, index) in languageList" :key="index" @click="ToggleLanguage(item)">
              <img v-if="selectedLanguage === item.text" class="check_icon" :src="CdnBaseUrl(`select_icon`)">
              {{ item.text }}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="less">
.languagePop_msk {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  background: rgba(15, 15, 15, 0.8);
  overflow: hidden;
  z-index: 99;
}

.sheet_content {
  width: 100%;
  border-radius: 12px 12px 0 0;
  background: #1E1F23;
  position: fixed;
  z-index: 100;
  bottom: 0;
  left: 0;
  // padding: 16px;

}

.language-popup {
  padding: 16px;
  position: relative;
  height: 538px;

  .lang_title {
    font-family: Figtree;
    font-weight: 400;
    font-size: 14px;
    line-height: 150%;
    letter-spacing: 2%;
    text-align: center;
    color: @third-text-color;
    text-align: center;
    margin-top: 38px;

  }

  .close_icon {
    position: absolute;
    top: 24px;
    right: 16px;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
  .language_box {
    padding-top: 28px;
    padding-bottom: 8px;
    height: 410px;
    overflow-y: scroll;

    .lang_item {
      font-size: 14px;
      font-weight: 400;
      line-height: 21px;
      margin-bottom: 16px;
      height: 37px;
      padding-left: 32px;
      position: relative;

      &::after {
        position: absolute;
        bottom: 0;
        left: 0;
        content: "";
        width: 100%;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
      }

      .check_icon {
        position: absolute;
        top: 0px;
        left: 0px;
        width: 24px;
        height: 24px;

      }
    }

    .avtive {
      color: #E6E6E6;
      font-weight: 600;

      &::after {
        background: #E6E6E6;
      }
    }
  }
}

/* 动画 */
.mask-fade-enter-active,
.mask-fade-leave-active {
  transition: opacity 0.3s ease;
}

.mask-fade-enter-from,
.mask-fade-leave-to {
  opacity: 0;
}

.sheet-slide-enter-active,
.sheet-slide-leave-active {
  transition: transform 0.3s ease-out;
}

.sheet-slide-enter-from,
.sheet-slide-leave-to {
  transform: translateY(100%);
}
</style>


```
:::



## 发布订阅类

::: details Vue3 发布订阅类

```ts
// 定义消息订阅器类
class EventEmitter {
  private events: { [eventName: string]: Array<(...args: any[]) => void> } = {};

  // 订阅事件，一个消息只能绑定一个回调
  on(eventName: string, callback: (...args: any[]) => void): void {
    // 先清除该事件已有的回调
    if (this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName] = [callback];
  }

  // 发布事件
  emit(eventName: string, ...args: any[]): void {
    console.log('xxxxs - ',this.events)
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => {
        callback(...args);
      });
    }
  }

  // 取消订阅事件
  off(eventName: string, callback: (...args: any[]) => void): void {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb!== callback);
    }
  }

  // 只绑定一次事件
  once(eventName: string, callback: (...args: any[]) => void): void {
    const onceCallback = (...args: any[]) => {
      callback(...args);
      this.off(eventName, onceCallback);
    };
    this.on(eventName, onceCallback);
  }
}

// 创建一个全局的消息订阅器实例
const eventEmitter = new EventEmitter();

export default eventEmitter;

```
:::