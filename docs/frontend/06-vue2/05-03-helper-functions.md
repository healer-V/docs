---
title: "5.3 Vuex辅助函数"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "Vuex 提供了辅助函数，简化在组件中使用 store 的代码。 mapState、mapGetters、mapMutations、mapActions 简化代码 支持数组和对象两种形式 使用 createNamespacedHelpers..."
---

# 5.3 Vuex辅助函数

Vuex 提供了辅助函数，简化在组件中使用 store 的代码。

## 5.3.1 mapState

```vue
<script>
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState(['count', 'user']),
    // 或使用对象形式
    ...mapState({
      count: 'count',
      userName: state => state.user.name
    })
  }
}
</script>
```

## 5.3.2 mapGetters

```vue
<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters(['doubleCount', 'getUserName']),
    // 或使用对象形式
    ...mapGetters({
      double: 'doubleCount'
    })
  }
}
</script>
```

## 5.3.3 mapMutations

```vue
<script>
import { mapMutations } from 'vuex'

export default {
  methods: {
    ...mapMutations(['increment', 'setUser']),
    // 或使用对象形式
    ...mapMutations({
      add: 'increment'
    })
  }
}
</script>
```

## 5.3.4 mapActions

```vue
<script>
import { mapActions } from 'vuex'

export default {
  methods: {
    ...mapActions(['incrementAsync', 'fetchUser']),
    // 或使用对象形式
    ...mapActions({
      addAsync: 'incrementAsync'
    })
  }
}
</script>
```

## 5.3.5 命名空间模块

```vue
<script>
import { createNamespacedHelpers } from 'vuex'

const { mapState, mapGetters, mapMutations, mapActions } = 
  createNamespacedHelpers('user')

export default {
  computed: {
    ...mapState(['name', 'age']),
    ...mapGetters(['isAdult'])
  },
  methods: {
    ...mapMutations(['SET_NAME']),
    ...mapActions(['fetchUser'])
  }
}
</script>
```

## 5.3.6 总结

- `mapState`、`mapGetters`、`mapMutations`、`mapActions` 简化代码
- 支持数组和对象两种形式
- 使用 `createNamespacedHelpers` 处理命名空间模块
