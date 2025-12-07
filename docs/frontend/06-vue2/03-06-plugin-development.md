# 3.6 插件开发

Vue 插件用于添加全局功能，可以是一个对象或函数。

## 插件结构

```javascript
const MyPlugin = {
  install(Vue, options) {
    // 添加全局方法或属性
    Vue.myGlobalMethod = function() {
      // 逻辑
    }
    
    // 添加全局资源
    Vue.directive('my-directive', {
      bind(el, binding) {
        // 逻辑
      }
    })
    
    // 注入组件选项
    Vue.mixin({
      created() {
        // 逻辑
      }
    })
    
    // 添加实例方法
    Vue.prototype.$myMethod = function() {
      // 逻辑
    }
  }
}
```

## 使用插件

```javascript
// main.js
import Vue from 'vue'
import MyPlugin from './plugins/MyPlugin'

Vue.use(MyPlugin, { someOption: true })
```

## 插件示例

### 示例1：HTTP 请求插件

```javascript
// plugins/http.js
export default {
  install(Vue, options) {
    Vue.prototype.$http = {
      get(url) {
        return fetch(url).then(res => res.json())
      },
      post(url, data) {
        return fetch(url, {
          method: 'POST',
          body: JSON.stringify(data)
        }).then(res => res.json())
      }
    }
  }
}
```

```vue
<script>
export default {
  async mounted() {
    const data = await this.$http.get('/api/users')
    console.log(data)
  }
}
</script>
```

### 示例2：工具函数插件

```javascript
// plugins/utils.js
export default {
  install(Vue) {
    Vue.prototype.$formatDate = function(date) {
      return new Date(date).toLocaleDateString()
    }
    
    Vue.prototype.$formatCurrency = function(amount) {
      return '¥' + amount.toFixed(2)
    }
  }
}
```

## 总结

- 插件用于添加全局功能
- 通过 `install` 方法定义插件
- 使用 `Vue.use()` 安装插件
- 可以添加全局方法、指令、混入等
