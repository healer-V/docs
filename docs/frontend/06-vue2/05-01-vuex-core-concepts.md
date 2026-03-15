---
title: "5.1 Vuex核心概念"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "Vuex 是 Vue 的状态管理库，用于集中管理应用的状态。 存储应用的状态： 从 state 派生的状态： 同步修改 state： 异步操作，提交 mutations： State：存储状态 Getters：派生状态 Mutations：..."
---

# 5.1 Vuex核心概念

Vuex 是 Vue 的状态管理库，用于集中管理应用的状态。

## 5.1.1 安装

```bash
npm install vuex@3
```

## 5.1.2 基本结构

```javascript
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    count: 0
  },
  getters: {
    doubleCount: state => state.count * 2
  },
  mutations: {
    increment(state) {
      state.count++
    }
  },
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment')
      }, 1000)
    }
  }
})
```

## 5.1.3 State

存储应用的状态：

```javascript
state: {
  count: 0,
  user: null
}
```

```vue
<script>
export default {
  computed: {
    count() {
      return this.$store.state.count
    }
  }
}
</script>
```

## 5.1.4 Getters

从 state 派生的状态：

```javascript
getters: {
  doubleCount: state => state.count * 2,
  getUserName: state => state.user?.name
}
```

```vue
<script>
export default {
  computed: {
    doubleCount() {
      return this.$store.getters.doubleCount
    }
  }
}
</script>
```

## 5.1.5 Mutations

同步修改 state：

```javascript
mutations: {
  increment(state) {
    state.count++
  },
  setUser(state, user) {
    state.user = user
  }
}
```

```vue
<script>
export default {
  methods: {
    increment() {
      this.$store.commit('increment')
    },
    setUser() {
      this.$store.commit('setUser', { name: '张三' })
    }
  }
}
</script>
```

## 5.1.6 Actions

异步操作，提交 mutations：

```javascript
actions: {
  incrementAsync({ commit }) {
    setTimeout(() => {
      commit('increment')
    }, 1000)
  },
  async fetchUser({ commit }) {
    const user = await api.getUser()
    commit('setUser', user)
  }
}
```

```vue
<script>
export default {
  methods: {
    increment() {
      this.$store.dispatch('incrementAsync')
    },
    fetchUser() {
      this.$store.dispatch('fetchUser')
    }
  }
}
</script>
```

## 5.1.7 总结

- **State**：存储状态
- **Getters**：派生状态
- **Mutations**：同步修改状态
- **Actions**：异步操作
- 使用 `commit` 提交 mutations，使用 `dispatch` 触发 actions
