---
title: "6.5 单元测试与E2E测试"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "测试覆盖率 > 80% 测试应该独立、可重复 测试应该快速执行 测试应该易于维护 完善的测试可以保证代码质量，减少 bug，提高开发效率。"
---

# 6.5 单元测试与E2E测试

## 6.5.1 单元测试

### 6.5.1.1 安装测试工具

```bash
npm install --save-dev @vue/test-utils jest
```

### 6.5.1.2 编写测试用例

```javascript
// tests/unit/HelloWorld.spec.js
import { shallowMount } from '@vue/test-utils'
import HelloWorld from '@/components/HelloWorld.vue'

describe('HelloWorld.vue', () => {
  it('renders props.msg when passed', () => {
    const msg = 'new message'
    const wrapper = shallowMount(HelloWorld, {
      propsData: { msg }
    })
    expect(wrapper.text()).toMatch(msg)
  })
})
```

## 6.5.2 E2E 测试

### 6.5.2.1 安装 Cypress

```bash
npm install --save-dev cypress
```

### 6.5.2.2 编写 E2E 测试

```javascript
// cypress/integration/login.spec.js
describe('登录功能', () => {
  it('应该能够成功登录', () => {
    cy.visit('/login')
    cy.get('[data-cy=username]').type('admin')
    cy.get('[data-cy=password]').type('password')
    cy.get('[data-cy=submit]').click()
    cy.url().should('include', '/dashboard')
  })
})
```

## 6.5.3 测试最佳实践

::: tip 测试最佳实践
1. 测试覆盖率 > 80%
2. 测试应该独立、可重复
3. 测试应该快速执行
4. 测试应该易于维护
:::

## 6.5.4 总结

::: tip 总结
完善的测试可以保证代码质量，减少 bug，提高开发效率。
:::
