# React18 + Umi3 + Ant Design PC端后台管理系统

## 一、项目概述

::: tip 项目介绍
本教程将带你从零开始搭建一个完整的 React18 + Umi3 + Ant Design PC端后台管理系统，涵盖项目初始化、路由配置、状态管理、权限控制等核心功能。
:::

### 1、技术栈

::: info 技术选型
- **React 18**：最新版本的 React，支持并发渲染
- **Umi 3**：企业级前端应用框架
- **Ant Design 5**：企业级 UI 设计语言和组件库
- **TypeScript**：类型安全的 JavaScript 超集
- **Umi Request**：基于 fetch 的网络请求库
- **@umijs/max**：Umi 的完整功能集
:::

### 2、项目功能

::: details 点击查看功能列表

- ✅ 用户登录/登出
- ✅ 权限管理（路由权限、按钮权限）
- ✅ 菜单管理（动态菜单）
- ✅ 用户管理（CRUD）
- ✅ 角色管理（CRUD）
- ✅ 系统设置
- ✅ 数据表格（分页、搜索、排序）
- ✅ 表单验证
- ✅ 文件上传
- ✅ 图表展示

:::

## 二、环境准备

### 1、Node.js 版本要求

::: warning 版本要求
- Node.js >= 14.x
- npm >= 6.x 或 yarn >= 1.22.x
:::

```bash
# 检查 Node.js 版本
node -v

# 检查 npm 版本
npm -v
```

### 2、安装 Umi CLI

```bash
# 使用 npm
npm install -g @umijs/max

# 或使用 yarn
yarn global add @umijs/max

# 验证安装
umi -v
```

### 3、创建项目目录

```bash
# 创建项目文件夹
mkdir react18-admin
cd react18-admin
```

## 三、项目初始化

### 1、使用 Umi 创建项目

```bash
# 使用 Umi 脚手架创建项目
yarn create @umijs/max-app

# 或使用 npm
npx @umijs/max

# 按照提示选择配置：
# - 项目名称：react18-admin
# - 选择模板：Ant Design Pro
# - TypeScript：是
# - 权限插件：是
```

### 2、手动初始化（推荐）

如果自动创建失败，可以手动初始化：

```bash
# 初始化 package.json
npm init -y

# 安装依赖
npm install @umijs/max antd @ant-design/icons
npm install -D @types/react @types/react-dom typescript
```

### 3、创建基础配置文件

#### 3.1、创建 `.umirc.ts` 配置文件

```typescript
import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'React18 后台管理系统',
  },
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/login',
      component: './Login',
      layout: false,
    },
    {
      path: '/home',
      component: './Home',
    },
  ],
  npmClient: 'npm',
});
```

#### 3.2、创建 `tsconfig.json`

```json
{
  "extends": "./src/.umi/tsconfig.json"
}
```

#### 3.3、创建 `.umirc.ts` 或 `config/config.ts`

```typescript
import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'React18 后台管理系统',
  },
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/login',
      component: './Login',
      layout: false,
    },
    {
      path: '/home',
      component: './Home',
    },
  ],
  npmClient: 'npm',
});
```

## 四、项目目录结构

### 1、标准目录结构

```
react18-admin/
├── config/                 # Umi 配置目录
│   └── config.ts          # 配置文件
├── public/                # 静态资源目录
│   └── favicon.ico       # 网站图标
├── src/
│   ├── assets/           # 静态资源（图片、字体等）
│   ├── components/        # 公共组件
│   │   ├── Header/       # 头部组件
│   │   ├── Footer/       # 底部组件
│   │   └── Table/        # 表格组件
│   ├── layouts/          # 布局组件
│   │   └── index.tsx     # 主布局
│   ├── pages/            # 页面目录
│   │   ├── Login/        # 登录页
│   │   ├── Home/         # 首页
│   │   ├── User/         # 用户管理
│   │   └── Role/         # 角色管理
│   ├── services/         # API 服务
│   │   ├── api.ts        # API 定义
│   │   └── request.ts    # 请求封装
│   ├── utils/            # 工具函数
│   │   ├── request.ts    # 请求工具
│   │   └── auth.ts       # 权限工具
│   ├── models/           # 数据模型
│   │   ├── user.ts       # 用户模型
│   │   └── global.ts     # 全局模型
│   ├── access.ts         # 权限定义
│   ├── app.tsx           # 应用入口
│   └── global.less       # 全局样式
├── .umirc.ts             # Umi 配置文件
├── package.json           # 项目依赖
└── tsconfig.json          # TypeScript 配置
```

### 2、创建目录

```bash
# 在项目根目录执行
mkdir -p src/{assets,components,layouts,pages,services,utils,models}
mkdir -p src/components/{Header,Footer,Table}
mkdir -p src/pages/{Login,Home,User,Role}
```

## 五、基础配置

### 1、配置 Ant Design

在 `.umirc.ts` 中已经启用了 `antd: {}`，会自动引入 Ant Design。

#### 1.1、自定义主题

创建 `config/theme.ts`：

```typescript
export default {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 4,
  },
};
```

在 `.umirc.ts` 中引入：

```typescript
import { defineConfig } from '@umijs/max';
import theme from './config/theme';

export default defineConfig({
  antd: {
    configProvider: {
      theme,
    },
  },
  // ... 其他配置
});
```

### 2、配置请求拦截器

#### 2.1、创建请求工具

创建 `src/utils/request.ts`：

```typescript
import { request } from '@umijs/max';
import { message } from 'antd';

// 请求拦截器
request.use(
  {
    requestInterceptors: [
      (url, options) => {
        // 添加 token
        const token = localStorage.getItem('token');
        if (token) {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          };
        }
        return { url, options };
      },
    ],
    responseInterceptors: [
      (response) => {
        const { data } = response;
        
        // 处理业务错误
        if (data.code !== 200) {
          message.error(data.message || '请求失败');
          return Promise.reject(new Error(data.message || '请求失败'));
        }
        
        return response;
      },
    ],
  }
);

export default request;
```

#### 2.2、配置 API 服务

创建 `src/services/api.ts`：

```typescript
import request from '@/utils/request';

// 用户相关 API
export const userApi = {
  // 登录
  login: (data: { username: string; password: string }) =>
    request('/api/user/login', {
      method: 'POST',
      data,
    }),
  
  // 获取用户信息
  getUserInfo: () => request('/api/user/info'),
  
  // 获取用户列表
  getUserList: (params: any) =>
    request('/api/user/list', {
      method: 'GET',
      params,
    }),
  
  // 创建用户
  createUser: (data: any) =>
    request('/api/user/create', {
      method: 'POST',
      data,
    }),
  
  // 更新用户
  updateUser: (id: string, data: any) =>
    request(`/api/user/${id}`, {
      method: 'PUT',
      data,
    }),
  
  // 删除用户
  deleteUser: (id: string) =>
    request(`/api/user/${id}`, {
      method: 'DELETE',
    }),
};

// 角色相关 API
export const roleApi = {
  getRoleList: (params: any) =>
    request('/api/role/list', {
      method: 'GET',
      params,
    }),
  
  createRole: (data: any) =>
    request('/api/role/create', {
      method: 'POST',
      data,
    }),
  
  updateRole: (id: string, data: any) =>
    request(`/api/role/${id}`, {
      method: 'PUT',
      data,
    }),
  
  deleteRole: (id: string) =>
    request(`/api/role/${id}`, {
      method: 'DELETE',
    }),
};
```

## 六、路由配置

### 1、基础路由配置

在 `.umirc.ts` 中配置路由：

```typescript
export default defineConfig({
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/login',
      component: './Login',
      layout: false,
    },
    {
      path: '/home',
      component: './Home',
      name: '首页',
      icon: 'HomeOutlined',
    },
    {
      path: '/system',
      name: '系统管理',
      icon: 'SettingOutlined',
      routes: [
        {
          path: '/system/user',
          component: './User',
          name: '用户管理',
          access: 'canAccessUser',
        },
        {
          path: '/system/role',
          component: './Role',
          name: '角色管理',
          access: 'canAccessRole',
        },
      ],
    },
  ],
});
```

### 2、权限路由配置

#### 2.1、创建权限定义文件

创建 `src/access.ts`：

```typescript
export default function access(initialState: { currentUser?: API.CurrentUser | undefined }) {
  const { currentUser } = initialState || {};
  
  return {
    canAccessUser: currentUser && currentUser.role === 'admin',
    canAccessRole: currentUser && currentUser.role === 'admin',
    canAccessDashboard: currentUser,
  };
}
```

#### 2.2、在路由中使用权限

```typescript
{
  path: '/system/user',
  component: './User',
  name: '用户管理',
  access: 'canAccessUser', // 使用权限控制
}
```

## 七、布局组件

### 1、创建主布局

创建 `src/layouts/index.tsx`：

```typescript
import { Outlet, useNavigate } from '@umijs/max';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Content, Sider } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: '/home',
    icon: <HomeOutlined />,
    label: '首页',
  },
  {
    key: '/system',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      {
        key: '/system/user',
        label: '用户管理',
      },
      {
        key: '/system/role',
        label: '角色管理',
      },
    ],
  },
];

export default function LayoutComponent() {
  const navigate = useNavigate();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.3)' }} />
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>React18 后台管理系统</div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar style={{ cursor: 'pointer' }} icon={<UserOutlined />} />
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
```

## 八、页面开发

### 1、登录页面

创建 `src/pages/Login/index.tsx`：

```typescript
import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from '@umijs/max';
import { userApi } from '@/services/api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await userApi.login(values);
      if (response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userInfo', JSON.stringify(response.data.user));
        message.success('登录成功');
        navigate('/home');
      }
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>React18 后台管理系统</h2>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
```

### 2、首页

创建 `src/pages/Home/index.tsx`：

```typescript
import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, TeamOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons';

export default function Home() {
  return (
    <div>
      <h1>欢迎使用 React18 后台管理系统</h1>
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={1128}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="角色数量"
              value={12}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="文档数量"
              value={3456}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="系统设置"
              value={8}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
```

### 3、用户管理页面

创建 `src/pages/User/index.tsx`：

```typescript
import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { userApi } from '@/services/api';
import type { ColumnsType } from 'antd/es/table';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createTime: string;
}

export default function User() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userApi.getUserList({});
      if (response.data) {
        setUsers(response.data.list || []);
      }
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 创建/更新用户
  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await userApi.updateUser(editingUser.id, values);
        message.success('更新成功');
      } else {
        await userApi.createUser(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      message.error(editingUser ? '更新失败' : '创建失败');
    }
  };

  // 删除用户
  const handleDelete = async (id: string) => {
    try {
      await userApi.deleteUser(id);
      message.success('删除成功');
      fetchUsers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 编辑用户
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  // 新增用户
  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新增用户
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{
          total: users.length,
          pageSize: 10,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingUser(null);
        }}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={editingUser ? [] : [{ required: true, message: '请输入密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
```

### 4、角色管理页面

创建 `src/pages/Role/index.tsx`：

```typescript
import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { roleApi } from '@/services/api';
import type { ColumnsType } from 'antd/es/table';

interface Role {
  id: string;
  name: string;
  description: string;
  createTime: string;
}

export default function Role() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await roleApi.getRoleList({});
      if (response.data) {
        setRoles(response.data.list || []);
      }
    } catch (error) {
      message.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      if (editingRole) {
        await roleApi.updateRole(editingRole.id, values);
        message.success('更新成功');
      } else {
        await roleApi.createRole(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingRole(null);
      fetchRoles();
    } catch (error) {
      message.error(editingRole ? '更新失败' : '创建失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await roleApi.deleteRole(id);
      message.success('删除成功');
      fetchRoles();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue(role);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const columns: ColumnsType<Role> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个角色吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新增角色
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={roles}
        loading={loading}
        rowKey="id"
        pagination={{
          total: roles.length,
          pageSize: 10,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingRole(null);
        }}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
```

## 九、状态管理

### 1、创建全局模型

创建 `src/models/global.ts`：

```typescript
import { useState, useCallback } from 'react';

export default function useGlobalModel() {
  const [userInfo, setUserInfo] = useState<any>(null);

  const setUser = useCallback((user: any) => {
    setUserInfo(user);
    localStorage.setItem('userInfo', JSON.stringify(user));
  }, []);

  const getUser = useCallback(() => {
    const userStr = localStorage.getItem('userInfo');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }, []);

  return {
    userInfo,
    setUser,
    getUser,
  };
}
```

### 2、创建用户模型

创建 `src/models/user.ts`：

```typescript
import { useState } from 'react';
import { userApi } from '@/services/api';

export default function useUserModel() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const response = await userApi.getUserInfo();
      if (response.data) {
        setCurrentUser(response.data);
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    currentUser,
    loading,
    fetchUserInfo,
    setCurrentUser,
  };
}
```

## 十、权限管理

### 1、路由权限

在 `src/access.ts` 中定义权限：

```typescript
export default function access(initialState: { currentUser?: API.CurrentUser | undefined }) {
  const { currentUser } = initialState || {};
  
  return {
    canAccessUser: currentUser && (currentUser.role === 'admin' || currentUser.role === 'user'),
    canAccessRole: currentUser && currentUser.role === 'admin',
    canAccessDashboard: currentUser,
  };
}
```

### 2、按钮权限

创建 `src/components/AuthButton/index.tsx`：

```typescript
import { Button, ButtonProps } from 'antd';
import { useAccess } from '@umijs/max';

interface AuthButtonProps extends ButtonProps {
  auth?: string;
}

export default function AuthButton({ auth, children, ...props }: AuthButtonProps) {
  const access = useAccess();
  
  if (auth && !access[auth]) {
    return null;
  }
  
  return <Button {...props}>{children}</Button>;
}
```

使用示例：

```typescript
import AuthButton from '@/components/AuthButton';

<AuthButton auth="canAccessUser" type="primary">
  新增用户
</AuthButton>
```

## 十一、构建和部署

### 1、开发环境运行

```bash
# 启动开发服务器
npm start

# 或使用 yarn
yarn start
```

访问 `http://localhost:8000`

### 2、生产环境构建

```bash
# 构建生产版本
npm run build

# 或使用 yarn
yarn build
```

构建产物在 `dist` 目录。

### 3、部署到服务器

#### 3.1、使用 Nginx 部署

创建 Nginx 配置 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://your-api-server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 3.2、使用 Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:16-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

构建和运行：

```bash
docker build -t react18-admin .
docker run -d -p 80:80 react18-admin
```

## 十二、常见问题

### 1、路由跳转问题

::: warning 注意事项
- 使用 `useNavigate` 进行路由跳转
- 确保路由配置正确
- 检查权限配置
:::

### 2、请求拦截器不生效

::: tip 解决方案
- 确保在 `app.tsx` 中正确引入请求工具
- 检查请求拦截器配置
- 查看浏览器控制台错误信息
:::

### 3、样式不生效

::: tip 解决方案
- 检查 `global.less` 是否正确引入
- 确认 Ant Design 主题配置
- 查看样式文件路径
:::

## 十三、项目优化

### 1、代码分割

Umi 3 自动支持代码分割，可以通过路由懒加载优化：

```typescript
{
  path: '/user',
  component: './User',
  // 自动代码分割
}
```

### 2、性能优化

#### 2.1、使用 React.memo

```typescript
import { memo } from 'react';

export default memo(function UserComponent({ user }) {
  // 组件代码
});
```

#### 2.2、使用 useMemo 和 useCallback

```typescript
import { useMemo, useCallback } from 'react';

const filteredUsers = useMemo(() => {
  return users.filter(user => user.active);
}, [users]);

const handleClick = useCallback((id: string) => {
  // 处理点击
}, []);
```

### 3、TypeScript 类型定义

创建 `src/types/index.ts`：

```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createTime: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  createTime: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
```

## 十四、总结

::: tip 学习建议
通过本教程，你已经学会了：
1. ✅ 使用 Umi 3 创建 React18 项目
2. ✅ 配置路由和权限
3. ✅ 开发完整的 CRUD 功能
4. ✅ 实现权限管理
5. ✅ 构建和部署项目

接下来可以：
- 添加更多业务功能
- 优化用户体验
- 集成更多第三方库
- 完善错误处理
:::

### 1、项目特点

- 🚀 基于 React18 和 Umi3
- 🎨 使用 Ant Design 5
- 📦 完整的项目结构
- 🔐 权限管理系统
- 📱 响应式布局
- 🛠️ TypeScript 支持

### 2、扩展功能

可以继续添加：
- 数据可视化（ECharts）
- 文件上传功能
- 消息通知系统
- 日志管理
- 系统监控

---

**祝你开发顺利！** 🎉

