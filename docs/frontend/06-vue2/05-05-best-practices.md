---
title: "5.5 Vuex最佳实践"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "使用常量作为 mutation 类型： 使用模块化：大型应用使用模块组织状态 使用命名空间：避免命名冲突 异步操作使用 Actions：不要在 Mutations 中执行异步操作 使用辅助函数：简化组件代码 合理使用 Getters：缓存派..."
---

# 5.5 Vuex最佳实践

## 5.5.1 命名规范

### 5.5.1.1 Mutations

使用常量作为 mutation 类型：

```javascript
// store/mutation-types.js
export const SET_USER = 'SET_USER'
export const INCREMENT = 'INCREMENT'
```

```javascript
// store/index.js
import { SET_USER, INCREMENT } from './mutation-types'

mutations: {
  [SET_USER](state, user) {
    state.user = user
  },
  [INCREMENT](state) {
    state.count++
  }
}
```

### 5.5.1.2 Actions

```javascript
actions: {
  async fetchUser({ commit }) {
    try {
      const user = await api.getUser()
      commit('SET_USER', user)
    } catch (error) {
      console.error(error)
    }
  }
}
```

## 5.5.2 项目结构

```
store/
├── index.js          # 组装模块并导出 store
├── mutation-types.js # mutation 类型常量
├── modules/
│   ├── user.js      # 用户模块
│   ├── product.js   # 产品模块
│   └── cart.js      # 购物车模块
└── plugins/         # 插件
    └── logger.js
```

## 5.5.3 最佳实践

1. **使用模块化**：大型应用使用模块组织状态
2. **使用命名空间**：避免命名冲突
3. **异步操作使用 Actions**：不要在 Mutations 中执行异步操作
4. **使用辅助函数**：简化组件代码
5. **合理使用 Getters**：缓存派生状态
6. **避免直接修改 State**：通过 Mutations 修改

## 5.5.4 总结

- 遵循命名规范，使用常量
- 合理组织项目结构
- 异步操作使用 Actions
- 使用模块化和命名空间
- 遵循最佳实践，提高代码质量
