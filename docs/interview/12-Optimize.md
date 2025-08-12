## 项目面试题

## 1. 前端性能优化的方法
>[!tip] 加载性能优化
> 1. 资源压缩与最小化
>   - Terser 压缩 JS 文件
>   - CSSNano 压缩 CSS 文件
>   - Gzip 压缩 HTML、JS、CSS 文件
> 2. 图片优化
>   - 压缩图片
>   - 使用 WebP 格式
>   - 图片懒加载
>   - 图片延迟加载
> 3. 资源加载策略
>   - 关键资源预加载（Preload）
>   - 非关键资源懒加载（ntersection Observer）
>   - 异步加载（async、defer）
>   - 多路复用（HTTP2/3）
> 4. 缓存
>   - 强缓存
>   - 协商缓存
>   - 合理利用浏览器缓存
> 5. CDN加速
>   - 静态资源部署到 CDN
>   - 多区域 CDN 节点
>   - 动态内容加速

>[!tip] 渲染性能优化
> 1. 关键渲染路径优化
> 2. 减少重绘重排
>   - 使用`transform`、`opacity`、`filter`等属性触发合成层
>   - 避免频繁读取布局属性
>   - 批量操作 DOM
> 3. GPU加速
>   - 合理使用will-change属性
>   - 3D变换触发硬件加速


>[!tip] JS性能优化
> 1. 代码执行效率
>   - 避免长任务（超过 50 毫秒）
>   - 使用`Web Worker` 处理耗时任务
>   - 合理使用`requestIdleCallback`
> 2. 内存管理
>   - 避免内存泄漏
>   - 使用弱引用
> 3. 代码拆分
>   - 基于路由的动态导入
>   - 按功能模块拆分代码
>   - 将代码拆分成多个`chunk`

>[!tip] 网络优化
> 1. DNS预解析
> 
> 

>[!tip] 体验优化
> 1. 首屏体验优化
>   - 骨架屏
>   - 渐进式图片加载(模糊→清晰的加载过程	)
>   - 关键内容优先渲染
>   - 优化字体
> 2. 交互优化
>   - 防抖/节流处理高频事件
>   - 交互动画（加载状态，过渡动画）


>[!tip] 安全优化
> 1. `XSS`攻击防护
>   - 输入内容转义
>   - 使用模板引擎
> 2. `CSRF`攻击防护
>   - 验证请求来源
>   - 使用CSRF Token
> 3. 其他安全防护
>   - 限制请求头
>   - 限制请求方法

## 2. 登录鉴权怎么实现？
>[!tip] 核心方案
> 1. `Session Cookie`: 服务端存储`Session`，客户端存`SessionID`，但有CSRF风险。
> 2. `JWT` : 服务端生成`Token`，客户端存储`Token`，但`Token`无法主动失效。
> 3. `OAuth2.0`: 授权框架，第三方登录（如Github、Google登录），用户无需注册，但实现复杂。
> 4. `SSO`单点登录：中央认证服务，适用企业级多系统，一次登录多处访问，但架构复杂。

### 2-1. 登录认证流程

1. 用户提交用户名、密码
2. 前端发送`POST`登录请求，携带用户名、密码
3. 服务端验证用户名、密码，生成`Token`。
4. 前端接收`Token`，并存储在`Storage`中。
5. 前端后续每次请求携带`Token`，服务端验证`Token`有效性，并返回相应数据。

### 2-2. 前端认证管理

::: details 认证管理模块
```js
// src/utils/auth.js
const TOKEN_KEY = 'app_auth_token';
const REFRESH_KEY = 'app_refresh_token';

// 存储Token
export const setAuthTokens = (token, refreshToken) => {
  // 安全存储方案：优先使用HttpOnly Cookie
  // 次选方案：localStorage（需配合XSS防护）
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_KEY, refreshToken);
};

// 获取Token
export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// 请求拦截器 - 添加认证头
export const authInterceptor = (config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// 处理Token过期
export const handleTokenExpiration = async (error) => {
  const originalRequest = error.config;
  
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    
    try {
      const newToken = await refreshToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axios(originalRequest);
    } catch (refreshError) {
      // 刷新失败，跳转登录页
      logout();
      return Promise.reject(refreshError);
    }
  }
  
  return Promise.reject(error);
};

// 刷新Token
const refreshToken = async () => {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  const response = await axios.post('/api/auth/refresh', { refreshToken });
  const { token } = response.data;
  localStorage.setItem(TOKEN_KEY, token);
  return token;
};

// 退出登录
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  // 清除用户数据
  store.dispatch(clearUserData());
  // 跳转登录页
  window.location.href = '/login';
};
```
:::
### 2-2. 前端路由守卫
::: details 路由守卫模块
```js
// src/router/index.js
import { getAccessToken } from '@/utils/auth';

router.beforeEach((to, from, next) => {
  const isAuthenticated = getAccessToken();
  
  // 需要认证的页面
  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      // 重定向到登录页，携带原目标路径
      return next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    }
    
    // 已登录但需要特定权限
    if (to.meta.roles) {
      const userRoles = store.getters.roles;
      if (!to.meta.roles.some(role => userRoles.includes(role))) {
        return next('/403'); // 无权限页面
      }
    }
  }
  
  // 已登录用户访问登录页
  if (to.path === '/login' && isAuthenticated) {
    return next(from.path || '/');
  }
  
  next();
});
```
:::
### 2-2. 前端登录页面
::: details 登录页面模块
```vue
<template>
  <div class="login-container">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>用户名</label>
        <input 
          v-model="username" 
          type="text" 
          autocomplete="username"
          required
        />
      </div>
      
      <div class="form-group">
        <label>密码</label>
        <input 
          v-model="password" 
          type="password" 
          autocomplete="current-password"
          required
        />
      </div>
      
      <div class="form-group">
        <button type="submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </div>
      
      <!-- 第三方登录 -->
      <div class="social-login">
        <button @click="oauthLogin('github')">GitHub登录</button>
        <button @click="oauthLogin('google')">Google登录</button>
      </div>
    </form>
  </div>
</template>

<script>
import { login } from '@/api/auth';
import { setAuthTokens } from '@/utils/auth';

export default {
  data() {
    return {
      username: '',
      password: '',
      loading: false
    };
  },
  methods: {
    async handleSubmit() {
      try {
        this.loading = true;
        const { token, refreshToken } = await login({
          username: this.username,
          password: this.password
        });
        
        setAuthTokens(token, refreshToken);
        
        // 跳转到原目标页面或首页
        const redirect = this.$route.query.redirect || '/';
        this.$router.push(redirect);
      } catch (error) {
        console.error('登录失败:', error);
        this.$message.error('用户名或密码错误');
      } finally {
        this.loading = false;
      }
    },
    
    oauthLogin(provider) {
      // 重定向到OAuth认证端点
      window.location.href = `${
        process.env.VUE_APP_API_URL
      }/oauth/${provider}?redirect_uri=${
        encodeURIComponent(window.location.origin + '/oauth/callback')
      }`;
    }
  }
};
</script>
```

:::

## 3. 双Token认证
>[!tip] 概念
> - 双Token认证是一种增强安全性和用户体验的认证策略。
> - 双Token认证的基本思路是，在用户登录成功后，服务端同时返回两个Token，一个用于认证，另一个用于刷新。
>   - Access Token（访问令牌）：短期有效的令牌，用于访问受保护资源。
>   - Refresh Token（刷新令牌）：长期有效的令牌，用于获取新的Access Token。

### 3-1. 双Token工作机制
::: tip 双Token工作机制
1. 用户登录成功，服务端返回 **两个Token**：Access Token 和 fresh Token。
2. `Access Token`用于访问受保护资源，有效期一般为几分钟到几小时。
3. `Refresh Token`用于获取新的Access Token，有效期一般为30天到365天。
4. 当Access Token过期时，前端使用Refresh Token，向服务器请求刷新Access Token，服务端验证Refresh Token有效性，并返回新的Access Token。
5. 前端收到新的Access Token后，将其存储在本地，并在后续请求中携带。

### 3-2. 双Token优点
- 增强用户体验：用户无需每次登录都输入用户名和密码，只需一次登录，即可获取Access Token。
- 减少认证次数：Access Token有效期短，可以减少认证次数，提升用户体验。
- 防止Token泄露：Access Token泄露会导致用户数据泄露，Refresh Token有效期长，可以防止Token泄露。

### 3-3. 前端Token管理
::: details Token管理模块
```js
// src/utils/auth.js
let accessToken = null;
let refreshPromise = null; // 防止并发刷新

// 获取Access Token
export const getAccessToken = () => accessToken;

// 设置Access Token
export const setAccessToken = (token) => {
  accessToken = token;
};

// 刷新Token函数
export const refreshTokens = async () => {
  // 防止并发刷新
  if (refreshPromise) return refreshPromise;
  
  try {
    refreshPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post('/api/refresh', {}, {
          withCredentials: true // 自动发送cookie
        });
        
        setAccessToken(response.data.accessToken);
        resolve(response.data.accessToken);
      } catch (error) {
        // 刷新失败，清除令牌
        clearTokens();
        window.location.href = '/login';
        reject(error);
      } finally {
        refreshPromise = null;
      }
    });
    
    return refreshPromise;
  } catch (error) {
    console.error('刷新令牌失败:', error);
    throw error;
  }
};

// 清除令牌
export const clearTokens = () => {
  accessToken = null;
  // 清除Refresh Token Cookie
  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
};
```
:::
::: details 前端请求拦截器
```js
// src/utils/request.js
import axios from 'axios';
import { getAccessToken, refreshTokens } from './auth';

// 创建axios实例
const api = axios.create({
    baseURL: process.env.API_BASE_URL
});

// 请求拦截器
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 响应拦截器 - 处理Token过期
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 处理401错误且不是刷新请求
        if (error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/api/refresh')) {

            originalRequest._retry = true;

            try {
                // 刷新Access Token
                const newAccessToken = await refreshTokens();

                // 更新Authorization头
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // 重新发送原始请求
                return api(originalRequest);
            } catch (refreshError) {
                // 刷新失败，跳转到登录页
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
```
:::

## 4. 权限管理
1. 页面级权限：路由权限，控制用户是否可以访问某些页面。
2. 按钮级权限：控制用户是否可以执行某些操作。
3. 数据级权限：控制用户是否可以查看某些数据。



### 4-1. 页面级权限
- 目标：控制用户是否可以访问某些页面（路由）。
- 实现：
  1. 在路由配置中标记每个路由需要的权限，添加 **元信息**`requiresAuth`和`permissions`字段。
  2. 在路由守卫中，根据当前用户的权限，判断是否有访问该路由的权限。
  3. 若无权限，则重定向到无权限页面或者错误页面。
- 
::: details 路由配置实现
```js
// 路由配置
const routes = [
    {
        path: '/dashboard',
        component: Dashboard,
        meta: { requiresAuth: true, permissions: ['DASHBOARD_VIEW'] }
    },
    {
        path: '/admin',
        component: AdminPanel,
        meta: { requiresAuth: true, permissions: ['ADMIN_ACCESS'] }
    }
];

// 路由守卫
router.beforeEach((to, from, next) => {
    const userPermissions = store.getters.userPermissions;

    // 需要登录
    if (to.meta.requiresAuth && !store.getters.isAuthenticated) {
        return next('/login');
    }

    // 权限校验
    if (to.meta.permissions) {
        const hasPermission = to.meta.permissions.some(perm =>
            userPermissions.includes(perm)
        );

        if (!hasPermission) {
            return next('/403'); // 无权限页面
        }
    }

    next();
});

// 动态添加路由
function generateRoutes(permissions) {
    const dynamicRoutes = [];

    if (permissions.includes('REPORT_VIEW')) {
        dynamicRoutes.push({
            path: '/reports',
            component: Reports,
            meta: { permissions: ['REPORT_VIEW'] }
        });
    }

    router.addRoutes(dynamicRoutes);
}
```
:::


### 4-2. 按钮级权限
- 目标：控制用户是否可以看到或操作某些按钮（或者组件）。
- 实现：
  1. 获取当前用户的权限列表。
  2. 在组件中根据权限列表，控制按钮（组件）是否显示或禁用。
  3. 可以通过自定义指令（`v-permission`）或封装权限判断组件来实现。
::: details 权限指令实现
```ts
// 全局权限指令 v-permission
app.directive('permission', {
    mounted(el, binding) {
        const { value } = binding;
        const authStore = useAuthStore();

        if (value && !authStore.hasPermission(value)) {
            // 无权限时移除元素
            el.parentNode?.removeChild(el);
        }
    }
});

```
:::
::: details 权限指令使用
```vue
<!--使用示例-->
<template>
    <button v-permission="'user:delete'">删除用户</button>
</template>
```
:::

::: details 权限组件实现
```vue
<template>
  <div>
    <!-- 自定义权限指令 -->
    <button v-permission="'USER_DELETE'">删除用户</button>

    <!-- 权限组件封装 -->
    <Permission :value="'USER_EDIT'">
      <button>编辑用户</button>
    </Permission>

    <!-- 函数式判断 -->
    <button v-if="checkPermission('USER_CREATE')">创建用户</button>
  </div>
</template>

<script>
  // 权限指令
  Vue.directive('permission', {
    inserted(el, binding) {
      const permissions = store.getters.userPermissions;
      if (!permissions.includes(binding.value)) {
        el.parentNode.removeChild(el);
      }
    }
  });

  // 权限组件
  const Permission = {
    functional: true,
    props: ['value'],
    render(createElement, context) {
      const permissions = store.getters.userPermissions;
      return permissions.includes(context.props.value)
          ? context.children
          : null;
    }
  };

  // 权限检查函数
  export function checkPermission(permission) {
    return store.getters.userPermissions.includes(permission);
  }
</script>
```
:::

### 4-3. 数据级权限
- 目标：控制用户可以查看的数据范围或者字段。
- 实现：
  1. 在请求数据时，将当前用户的权限列表通过请求头`X-User-Permissions`或者**参数**传递给后端。
  2. 后端根据权限列表返回响应的数据。
  3. 前端也可以根据权限对已收获的数据过滤（推荐后端过滤）。
::: details 数据权限实现
```vue
<template>
    <div>
        <table>
            <tr v-for="user in filteredUsers" :key="user.id">
    <td>{{ user.name }}</td>
<!-- 敏感数据权限控制 -->
<td v-if="hasDataPermission('VIEW_SALARY')">
    {{ user.salary }}
</td>
<td v-if="hasDataPermission('VIEW_CONTACT')">
    {{ user.phone }}
</td>
</tr>
</table>
</div>
</template>

<script>
export default {
    data() {
        return {
            users: [],
            dataPermissions: ['VIEW_SALARY', 'VIEW_CONTACT'] // 从后端获取
        }
    },

    computed: {
        // 前端数据过滤
        filteredUsers() {
            return this.users.map(user => {
                // 根据权限移除敏感字段
                if (!this.hasDataPermission('VIEW_SALARY')) {
                    delete user.salary;
                }
                if (!this.hasDataPermission('VIEW_CONTACT')) {
                    delete user.phone;
                }
                return user;
            });
        }
    },

    methods: {
        hasDataPermission(permission) {
            return this.dataPermissions.includes(permission);
        },

        async fetchData() {
            // 请求时携带权限信息
            const response = await axios.get('/api/users', {
                headers: {
                    'X-User-Permissions': store.getters.userPermissions.join(',')
                }
            });

            // 后端返回已过滤的数据
            this.users = response.data;
        }
    },

    mounted() {
        this.fetchData();
    }
}
</script>
```
:::

## 5. 前端实现手机号注册账号
1. 用户输入手机号，点击注册按钮。
2. 短信服务商发送验证码到用户手机。
3. 用户输入短信验证码，点击注册按钮。
4. 前端发送注册请求到后端。
5. 后端验证手机号和验证码，创建用户。
6. 后端返回注册结果，前端根据注册结果进行相应提示。

::: details 前端实现
```js
// 发送验证码方法
const sendVerificationCode = async () => {
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
        showError('请输入有效的手机号码');
        return;
    }

    try {
        codeSending.value = true;

        // 调用发送验证码API
        const response = await api.post('/auth/send-verification-code', {
            phone: formData.phone,
            type: 'register' // 区分注册场景
        });

        if (response.data.success) {
            // 开始倒计时
            countdown.value = 60;
            const timer = setInterval(() => {
                countdown.value--;
                if (countdown.value <= 0) {
                    clearInterval(timer);
                }
            }, 1000);

            showSuccess('验证码已发送，请注意查收');
        } else {
            showError(response.data.message || '发送验证码失败');
        }
    } catch (error) {
        console.error('发送验证码出错:', error);
        showError('发送验证码失败，请稍后重试');
    } finally {
        codeSending.value = false;
    }
};

```
:::

### 5-1.防机器人验证
::: tip 防机器人验证
```js
// 集成Google reCAPTCHA
const initRecaptcha = () => {
  window.grecaptcha.ready(() => {
    window.grecaptcha.execute('YOUR_SITE_KEY', { action: 'register' })
      .then(token => {
        formData.recaptchaToken = token;
      });
  });
};

// 在发送验证码时带上token
const sendVerificationCode = async () => {
  if (!formData.recaptchaToken) {
    await initRecaptcha();
    // 等待token生成
    setTimeout(sendVerificationCode, 500);
    return;
  }
  
  // 发送验证码请求时带上recaptchaToken
  const response = await api.post('/auth/send-verification-code', {
    phone: formData.phone,
    recaptchaToken: formData.recaptchaToken
  });
};
```
:::

### 5-2. 密码安全处理
::: tip 密码安全处理
```js
// 使用bcryptjs在前端对密码进行预哈希
import bcrypt from 'bcryptjs';

const handleSubmit = async () => {
  // 生成盐并哈希密码
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(formData.password, salt);
  
  // 发送到后端的密码是加盐哈希后的
  await api.post('/auth/register-by-phone', {
    phone: formData.phone,
    code: formData.code,
    password: hashedPassword,
    salt // 将盐也发送到后端存储
  });
};
```
:::
### 5-3. 频率限制与防刷策略
:::tip 频率限制与防刷策略
```js
// 前端防刷策略
const sendVerificationCode = async () => {
  // 检查发送频率
  const lastSendTime = localStorage.getItem('lastSendCodeTime');
  if (lastSendTime && Date.now() - parseInt(lastSendTime) < 60000) {
    showError('操作过于频繁，请稍后再试');
    return;
  }
  
  // 记录发送时间
  localStorage.setItem('lastSendCodeTime', Date.now().toString());
  
  // 发送验证码...
};

```
:::

## 