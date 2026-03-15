---
title: "5.2 模块化状态管理"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "当应用变得复杂时，可以将 store 分割成模块。 使用 namespaced: true 启用命名空间 模块化可以更好地组织大型应用的状态 通过命名空间访问模块的 state、getters、mutations、actions"
---

# 5.2 模块化状态管理

当应用变得复杂时，可以将 store 分割成模块。

## 5.2.1 模块定义

```javascript
// store/modules/user.js
const userModule = {
  namespaced: true,
  state: {
    name: '',
    age: 0
  },
  getters: {
    isAdult: state => state.age >= 18
  },
  mutations: {
    SET_NAME(state, name) {
      state.name = name
    }
  },
  actions: {
    fetchUser({ commit }) {
      // 获取用户信息
    }
  }
}

export default userModule
```

## 5.2.2 注册模块

```javascript
// store/index.js
import userModule from './modules/user'
import productModule from './modules/product'

export default new Vuex.Store({
  modules: {
    user: userModule,
    product: productModule
  }
})
```

## 5.2.3 访问模块

```vue
<script>
export default {
  computed: {
    userName() {
      return this.$store.state.user.name
    },
    isAdult() {
      return this.$store.getters['user/isAdult']
    }
  },
  methods: {
    setName() {
      this.$store.commit('user/SET_NAME', '张三')
    },
    fetchUser() {
      this.$store.dispatch('user/fetchUser')
    }
  }
}
</script>
```

## 5.2.4 总结

- 使用 `namespaced: true` 启用命名空间
- 模块化可以更好地组织大型应用的状态
- 通过命名空间访问模块的 state、getters、mutations、actions
