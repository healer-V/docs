# Vue组件封装


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
<div >{{ newBieData.dateTime }}</div>
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

```js
// 使用
  <Gesture @gesture="handleGesture"><View></View></Gesture>

```

:::


## 封装拖动进度条

::: details Vue3 拖动进度条

```vue
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
```vue
 <!-- 使用 -->
 <DraggableProgress :progress="record.progress" :video-ref="record.videoRef"
    @onDragStart="handleDragStart" @onDragEnd="handleDragEnd" />

```
:::