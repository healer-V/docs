---
title: "2.3 插槽（Slot）的使用"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "插槽（Slot）是 Vue 实现内容分发的一种机制，允许父组件向子组件传递模板内容。 渲染结果： 插槽可以设置默认内容，当父组件没有提供内容时显示。 当需要多个插槽时，使用具名插槽： v-slot:header 可以简写为 #header。..."
---

# 2.3 插槽（Slot）的使用

插槽（Slot）是 Vue 实现内容分发的一种机制，允许父组件向子组件传递模板内容。

## 一、默认插槽

### 1.1、具体shi

```vue
<!-- 子组件 ChildComponent.vue -->
<template>
  <div class="child">
    <h2>子组件标题</h2>
    <slot></slot>
    <p>子组件底部</p>
  </div>
</template>
```

```vue
<!-- 父组件 -->
<template>
  <div>
    <ChildComponent>
      <p>这是插入到插槽中的内容</p>
    </ChildComponent>
  </div>
</template>
```

**渲染结果**：
```html
<div class="child">
  <h2>子组件标题</h2>
  <p>这是插入到插槽中的内容</p>
  <p>子组件底部</p>
</div>
```

### 1.2、后备内容

::: tip 后备内容
插槽可以设置默认内容，当父组件没有提供内容时显示。
:::

```vue
<!-- 子组件 -->
<template>
  <button>
    <slot>提交</slot>
  </button>
</template>
```

```vue
<!-- 父组件 -->
<template>
  <div>
    <!-- 使用默认内容 -->
    <SubmitButton />
    
    <!-- 自定义内容 -->
    <SubmitButton>保存</SubmitButton>
  </div>
</template>
```

## 二、具名插槽

### 2.1、基本用法

当需要多个插槽时，使用具名插槽：

```vue
<!-- 子组件 Layout.vue -->
<template>
  <div class="layout">
    <header>
      <slot name="header"></slot>
    </header>
    <main>
      <slot></slot>
    </main>
    <footer>
      <slot name="footer"></slot>
    </footer>
  </div>
</template>
```

```vue
<!-- 父组件 -->
<template>
  <Layout>
    <template v-slot:header>
      <h1>页面标题</h1>
    </template>
    
    <p>主要内容</p>
    
    <template v-slot:footer>
      <p>页脚信息</p>
    </template>
  </Layout>
</template>
```

### 2.2、v-slot 简写

::: tip 简写语法
`v-slot:header` 可以简写为 `#header`。
:::

```vue
<template>
  <Layout>
    <template #header>
      <h1>页面标题</h1>
    </template>
    
    <template #footer>
      <p>页脚信息</p>
    </template>
  </Layout>
</template>
```

## 三、作用域插槽

### 3.1、基本用法

作用域插槽允许子组件向插槽传递数据：

```vue
<!-- 子组件 UserList.vue -->
<template>
  <ul>
    <li v-for="user in users" :key="user.id">
      <slot :user="user"></slot>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    users: Array
  }
}
</script>
```

```vue
<!-- 父组件 -->
<template>
  <UserList :users="users">
    <template v-slot:default="slotProps">
      <span>{{ slotProps.user.name }}</span>
      <span>{{ slotProps.user.email }}</span>
    </template>
  </UserList>
</template>

<script>
export default {
  data() {
    return {
      users: [
        { id: 1, name: '张三', email: 'zhang@example.com' },
        { id: 2, name: '李四', email: 'li@example.com' }
      ]
    }
  }
}
</script>
```

### 3.2 解构插槽 Props

```vue
<template>
  <UserList :users="users">
    <template v-slot:default="{ user }">
      <span>{{ user.name }}</span>
    </template>
  </UserList>
</template>
```

### 3.3 具名作用域插槽

```vue
<!-- 子组件 -->
<template>
  <div>
    <slot name="item" :item="item" :index="index"></slot>
  </div>
</template>
```

```vue
<!-- 父组件 -->
<template>
  <ChildComponent>
    <template #item="{ item, index }">
      <p>{{ index }}: {{ item.name }}</p>
    </template>
  </ChildComponent>
</template>
```

## 四、实际应用示例

### 4.1、示例1：卡片组件

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <div class="card-header" v-if="$slots.header">
      <slot name="header"></slot>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
    <div class="card-footer" v-if="$slots.footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.card-header {
  padding: 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.card-body {
  padding: 16px;
}

.card-footer {
  padding: 16px;
  background: #f5f5f5;
  border-top: 1px solid #ddd;
}
</style>
```

```vue
<!-- 使用卡片组件 -->
<template>
  <Card>
    <template #header>
      <h3>卡片标题</h3>
    </template>
    
    <p>卡片内容</p>
    
    <template #footer>
      <button>操作</button>
    </template>
  </Card>
</template>
```

### 4.2、示例2：表格组件

```vue
<!-- DataTable.vue -->
<template>
  <table>
    <thead>
      <tr>
        <th v-for="column in columns" :key="column.key">
          {{ column.title }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, index) in data" :key="index">
        <td v-for="column in columns" :key="column.key">
          <slot 
            :name="column.key" 
            :row="row" 
            :value="row[column.key]"
            :index="index"
          >
            {{ row[column.key] }}
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  props: {
    data: Array,
    columns: Array
  }
}
</script>
```

```vue
<!-- 使用表格组件 -->
<template>
  <DataTable :data="users" :columns="columns">
    <template #status="{ value }">
      <span :class="value === 'active' ? 'active' : 'inactive'">
        {{ value }}
      </span>
    </template>
    
    <template #actions="{ row }">
      <button @click="edit(row)">编辑</button>
      <button @click="delete(row)">删除</button>
    </template>
  </DataTable>
</template>

<script>
export default {
  data() {
    return {
      users: [
        { id: 1, name: '张三', status: 'active' },
        { id: 2, name: '李四', status: 'inactive' }
      ],
      columns: [
        { key: 'name', title: '姓名' },
        { key: 'status', title: '状态' },
        { key: 'actions', title: '操作' }
      ]
    }
  },
  methods: {
    edit(row) {
      console.log('编辑', row)
    },
    delete(row) {
      console.log('删除', row)
    }
  }
}
</script>
```

## 五、插槽的高级用法

### 5.1、检查插槽是否存在

```vue
<template>
  <div>
    <div v-if="$slots.header">
      <slot name="header"></slot>
    </div>
  </div>
</template>
```

### 5.2、动态插槽名

```vue
<template>
  <ChildComponent>
    <template v-slot:[dynamicSlotName]>
      动态插槽内容
    </template>
  </ChildComponent>
</template>

<script>
export default {
  data() {
    return {
      dynamicSlotName: 'header'
    }
  }
}
</script>
```

