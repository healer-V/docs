# 2.5 组件生命周期深入理解

组件生命周期是 Vue 组件从创建到销毁的完整过程，理解生命周期有助于在合适的时机执行相应的操作。

## 组件生命周期钩子

### 生命周期图示

```
创建阶段：
beforeCreate → created → beforeMount → mounted

更新阶段：
beforeUpdate → updated

销毁阶段：
beforeDestroy → destroyed
```

## 创建阶段

### beforeCreate

在实例初始化之后，数据观测和事件配置之前被调用：

```vue
<script>
export default {
  beforeCreate() {
    console.log('beforeCreate')
    // ❌ 无法访问 data、methods、computed
    console.log(this.message) // undefined
  },
  data() {
    return {
      message: 'Hello'
    }
  }
}
</script>
```

**使用场景**：很少使用，可以用于插件初始化。

### created

实例创建完成，数据观测完成，但 DOM 还未挂载：

```vue
<script>
export default {
  created() {
    console.log('created')
    // ✅ 可以访问 data、methods、computed
    console.log(this.message) // 'Hello'
    // ✅ 适合进行数据请求
    this.fetchData()
  },
  methods: {
    fetchData() {
      // 发起 API 请求
    }
  }
}
</script>
```

**使用场景**：
- 发起数据请求
- 初始化非 DOM 相关的数据
- 订阅事件

### beforeMount

挂载开始之前，模板编译完成，但还未挂载到 DOM：

```vue
<script>
export default {
  beforeMount() {
    console.log('beforeMount')
    // ❌ 无法访问 $el
    console.log(this.$el) // undefined
  }
}
</script>
```

**使用场景**：很少使用。

### mounted

实例挂载完成，DOM 已渲染：

```vue
<script>
export default {
  mounted() {
    console.log('mounted')
    // ✅ 可以访问 DOM 元素
    console.log(this.$el) // 挂载的 DOM 元素
    // ✅ 适合进行 DOM 操作、第三方库初始化
    this.initChart()
    this.bindEvent()
  },
  methods: {
    initChart() {
      // 初始化图表库
    },
    bindEvent() {
      // 绑定事件
    }
  }
}
</script>
```

**使用场景**：
- DOM 操作
- 初始化第三方库（图表、地图等）
- 绑定事件监听器
- 获取 DOM 元素尺寸

## 更新阶段

### beforeUpdate

数据更新时，虚拟 DOM 重新渲染之前：

```vue
<template>
  <div>
    <p>{{ count }}</p>
    <button @click="count++">增加</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0
    }
  },
  beforeUpdate() {
    console.log('beforeUpdate', this.count)
    // 可以访问更新前的 DOM
    console.log(this.$el.textContent)
  }
}
</script>
```

**使用场景**：
- 在更新前访问现有的 DOM
- 移除事件监听器

### updated

数据更新后，DOM 已更新：

```vue
<script>
export default {
  updated() {
    console.log('updated')
    // ✅ 可以访问更新后的 DOM
    // ⚠️ 注意：避免在此钩子中修改数据，可能导致无限循环
  }
}
</script>
```

**使用场景**：
- 数据更新后的 DOM 操作
- 重新计算布局

**注意**：避免在 `updated` 中修改数据，可能导致无限循环。

## 销毁阶段

### beforeDestroy

实例销毁之前：

```vue
<script>
export default {
  beforeDestroy() {
    console.log('beforeDestroy')
    // ✅ 清理工作
    clearInterval(this.timer)
    clearTimeout(this.timeout)
    window.removeEventListener('resize', this.handleResize)
    // 取消订阅
    this.eventBus.$off('event')
  }
}
</script>
```

**使用场景**：
- 清理定时器
- 取消事件监听
- 取消订阅
- 销毁插件实例

### destroyed

实例销毁后：

```vue
<script>
export default {
  destroyed() {
    console.log('destroyed')
    // 所有子实例也被销毁
  }
}
</script>
```

**使用场景**：最终清理工作。

## 父子组件生命周期执行顺序

```
父组件 beforeCreate
父组件 created
父组件 beforeMount
  子组件 beforeCreate
  子组件 created
  子组件 beforeMount
  子组件 mounted
父组件 mounted
```

**更新时**：
```
父组件 beforeUpdate
  子组件 beforeUpdate
  子组件 updated
父组件 updated
```

**销毁时**：
```
父组件 beforeDestroy
  子组件 beforeDestroy
  子组件 destroyed
父组件 destroyed
```

## 实际应用示例

### 示例1：数据请求

```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else>
      <ul>
        <li v-for="item in list" :key="item.id">
          {{ item.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: true,
      list: []
    }
  },
  async created() {
    // 在 created 中发起请求
    try {
      this.list = await this.fetchList()
    } finally {
      this.loading = false
    }
  },
  methods: {
    async fetchList() {
      // 模拟 API 请求
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([
            { id: 1, name: '项目1' },
            { id: 2, name: '项目2' }
          ])
        }, 1000)
      })
    }
  }
}
</script>
```

### 示例2：第三方库初始化

```vue
<template>
  <div ref="chartContainer"></div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  data() {
    return {
      chart: null,
      chartData: []
    }
  },
  mounted() {
    // 在 mounted 中初始化图表
    this.initChart()
  },
  beforeDestroy() {
    // 销毁图表实例
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chartContainer)
      this.updateChart()
    },
    updateChart() {
      if (this.chart) {
        this.chart.setOption({
          // 图表配置
        })
      }
    }
  },
  watch: {
    chartData() {
      this.updateChart()
    }
  }
}
</script>
```

### 示例3：事件监听

```vue
<template>
  <div>{{ windowWidth }}px</div>
</template>

<script>
export default {
  data() {
    return {
      windowWidth: 0
    }
  },
  mounted() {
    // 绑定事件
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  },
  beforeDestroy() {
    // 移除事件
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize() {
      this.windowWidth = window.innerWidth
    }
  }
}
</script>
```

### 示例4：定时器清理

```vue
<template>
  <div>
    <p>倒计时: {{ countdown }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      countdown: 60,
      timer: null
    }
  },
  mounted() {
    this.startCountdown()
  },
  beforeDestroy() {
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },
  methods: {
    startCountdown() {
      this.timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          clearInterval(this.timer)
          this.timer = null
        }
      }, 1000)
    }
  }
}
</script>
```

## 生命周期最佳实践

1. **created**：用于数据请求和初始化
2. **mounted**：用于 DOM 操作和第三方库初始化
3. **beforeDestroy**：用于清理工作（定时器、事件、订阅等）
4. **避免在 updated 中修改数据**：可能导致无限循环
5. **合理使用 keep-alive**：缓存组件状态

## 总结

- **创建阶段**：beforeCreate → created → beforeMount → mounted
- **更新阶段**：beforeUpdate → updated
- **销毁阶段**：beforeDestroy → destroyed
- **created**：数据请求、初始化
- **mounted**：DOM 操作、第三方库初始化
- **beforeDestroy**：清理工作

理解生命周期有助于在合适的时机执行相应的操作，提高应用性能和稳定性。
