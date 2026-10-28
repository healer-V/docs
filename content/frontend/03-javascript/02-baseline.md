---
title: "现代 JavaScript 编码基线"
tags:
  - JavaScript
  - Node.js
  - ESLint
  - 工程规范
excerpt: "定义现代 JavaScript 项目的运行时、模块、语法、兼容性和质量门禁基线，并提供一套可安装、可测试、可验证失败场景的 ESM 最小工程。"
date: 2026-07-29
---

# 现代 JavaScript 编码基线

编码基线不是一组偏好的语法写法，而是团队对运行环境、模块格式、兼容范围、错误处理和交付检查的共同契约。没有可执行的版本和验证命令，“使用现代 JavaScript”无法转化为稳定的工程结论。

本文基线适用于 2026-07-29 新建或持续维护的 JavaScript 项目。文中的完整示例支持当时仍受维护的 Node.js 22 和 Node.js 24 LTS，浏览器项目则必须根据产品用户和构建工具单独声明目标范围。

## 一、先声明可验证的项目基线

### 1. 基线由五类契约组成

一个可执行的 JavaScript 基线至少包含以下五层：

| 基线层 | 必须回答的问题 | 可验证产物 |
|--------|----------------|------------|
| 运行时 | 代码在哪些 Node.js 或浏览器版本运行 | `engines`、CI 版本矩阵、浏览器目标 |
| 模块 | 使用 ESM 还是 CommonJS，入口如何解析 | `"type"`、`"exports"`、明确扩展名 |
| 语言与 API | 允许使用哪些语法和宿主能力 | 构建 target、功能检测、兼容性测试 |
| 代码质量 | 哪些问题必须在合并前阻断 | ESLint、格式检查、单元测试 |
| 发布验证 | 用什么命令证明产物可交付 | `npm run verify`、构建和目标环境测试 |

团队可以按项目调整具体值，但不能省略这些问题。基线需要进入仓库并由自动化命令执行，不能只存在于口头约定中。

### 2. 2026-07-29 的版本选择

根据 Node.js 官方发布状态，当时 Node.js 24 为 LTS，Node.js 26 为 Current，Node.js 22 仍处于受支持的 LTS 周期。生产项目应使用 Active LTS 或 Maintenance LTS，不应把已经 EOL 的奇数版本纳入长期支持范围。

本文示例采用以下版本合同：

| 组件 | 示例版本或范围 | 选择理由 |
|------|----------------|----------|
| Node.js | `^22.13.0 || ^24.0.0` | 覆盖示例依赖支持的两条 LTS 主版本线，排除已 EOL 的 Node.js 23 |
| 模块格式 | ESM | 使用标准 `import`、`export` 和模块级严格模式 |
| ESLint | `10.8.0` | 通过 Flat Config 执行静态检查 |
| `@eslint/js` | `10.0.1` | 提供 ESLint 官方推荐规则集 |
| Prettier | `3.9.6` | 固定格式化器版本，避免不同机器产生格式差异 |
| 测试 | Node.js 内置 `node:test` | 不增加测试运行器依赖即可形成闭环 |

::: warning 版本范围需要持续维护
版本表是 2026-07-29 的基线，不是永久结论。Node.js 主版本进入 EOL、工具依赖升级或目标浏览器变化时，必须同步更新版本声明、锁文件、CI 矩阵和验证结果。
:::

### 3. 浏览器目标必须来自产品约束

浏览器项目不能只写“支持现代浏览器”。应根据用户数据、设备范围、企业管控策略和关键 Web API 选择目标。

| 项目类型 | 建议起点 | 仍需补充的验证 |
|----------|----------|----------------|
| 面向公众的网站 | Baseline Widely available，再结合真实访问数据调整 | 真机或云端浏览器矩阵、无障碍和弱网测试 |
| 企业内部系统 | 企业实际部署的 Chrome、Edge 或 WebView 版本 | 受管设备版本、升级节奏和插件约束 |
| SDK 或组件库 | 明确列出最低浏览器和 Node.js 版本 | 包导出、不同模块入口和消费者构建测试 |
| 新 API 密集应用 | 固定 Baseline 年份或明确浏览器版本 | 功能检测、降级路径和不支持提示 |

Baseline Widely available 表示某项 Web 平台能力达到广泛可用门槛，不代表该能力满足项目的性能、安全、无障碍或业务要求。移动目标还会随时间变化；需要长期复现构建时，应记录固定日期、构建工具版本或明确浏览器版本。

## 二、语言和语法约束

### 1. 默认使用 ESM 和严格模式

新项目默认使用 ESM。ES Module 自动运行在严格模式下，可以提供模块作用域、静态依赖关系和统一的 `import`、`export` 语法。

基础规则如下：

| 规则 | 基线要求 | 例外 |
|------|----------|------|
| 变量声明 | 默认 `const`，确需重新赋值时使用 `let` | 维护无法立即迁移的旧脚本时可以暂留 `var` |
| 模块格式 | 新代码使用 ESM | 对接 CommonJS 包时建立明确兼容边界 |
| 相对导入 | 写出文件扩展名 | 构建工具别名必须在配置中明确 |
| 相等判断 | 默认使用 `===` 和 `!==` | 只有经过说明的 `value == null` 等特定语义才允许例外 |
| 字符串组合 | 使用模板字符串表达插值 | 固定短字符串无需机械改写 |
| 对象和数组更新 | 避免无意共享可变状态 | 性能敏感代码经过测量后可以局部原地更新 |

ESM 不会自动让模块跨浏览器和 Node.js 通用。模块解析、宿主 API 和产物兼容性仍需分别验证。

### 2. 不依赖隐式类型转换表达业务规则

JavaScript 允许隐式转换，但业务边界应先校验输入，再执行计算。以下写法容易掩盖空字符串、缺失字段或错误类型：

```javascript
// 错误示例：空字符串、null 和 undefined 会被折叠为同一个默认值。
const quantity = Number(input.quantity || 1);
```

应根据业务规则分别处理缺失值、空字符串和非法数字。下面是局部示例，省略了表单读取和错误展示：

```javascript
// src/order/parse-quantity.js

/**
 * 把订单数量输入转换为正整数。
 * @param {unknown} rawValue 外部输入；允许数字或只包含十进制整数的字符串。
 * @returns {number} 大于 0 的安全整数数量。
 * @throws {TypeError} 输入类型或格式不符合约束时抛出。
 * @throws {RangeError} 数量不在安全正整数范围内时抛出。
 */
export function parseQuantity(rawValue) {
  if (
    typeof rawValue !== "number" &&
    (typeof rawValue !== "string" || !/^\d+$/.test(rawValue))
  ) {
    throw new TypeError("订单数量必须是十进制整数");
  }

  const quantity = Number(rawValue);

  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new RangeError("订单数量必须是安全正整数");
  }

  return quantity;
}
```

这个示例明确区分类型错误和范围错误。`Number(" ")` 会得到 `0`，因此不能把 `Number()` 转换成功当作业务输入合法的证据。

### 3. 正确选择空值和默认值运算符

`||` 根据真假值选择默认值，会把 `0`、`false` 和空字符串也当作缺失。`??` 只在值为 `null` 或 `undefined` 时选择默认值。

| 业务语义 | 推荐表达式 | 说明 |
|----------|------------|------|
| `0` 是有效折扣 | `discount ?? 0` | 保留显式传入的 `0` |
| 空字符串表示用户清空 | `remark ?? defaultRemark` | 不覆盖空字符串 |
| 任意假值都应回退 | `value || fallback` | 仅在业务确实这样定义时使用 |
| 属性可能缺失 | `order.customer?.name` | 只解决安全访问，不负责校验必填项 |

可选链不应被用来掩盖必填数据缺失。关键业务字段仍需在系统边界处校验并返回明确错误。

## 三、模块和依赖边界

### 1. package.json 明确模块类型

Node.js 根据扩展名和最近的 `package.json` 判断 `.js` 文件采用 ESM 还是 CommonJS。新项目应显式声明 `"type": "module"`，不要依赖运行时猜测源代码格式。

同一项目中的扩展名约定如下：

| 文件类型 | 建议用途 |
|----------|----------|
| `.js` | 在 `"type": "module"` 项目中承载 ESM |
| `.mjs` | 在 CommonJS 包中显式建立 ESM 文件 |
| `.cjs` | 在 ESM 包中保留必要的 CommonJS 文件 |

需要同时发布 ESM 和 CommonJS 的库应通过条件 `"exports"` 建立独立入口并执行消费者测试。普通应用不应为了“兼容”而同时维护两套模块系统。

### 2. 核心模块不直接依赖宿主

项目目录按职责拆分，而不是按 API 名称堆放文件：

```text
src/
├── core/          # 只依赖 ECMAScript 的业务规则
├── browser/       # DOM、Storage、页面事件等适配器
├── node/          # 文件、进程和服务端网络适配器
└── entry/         # 各运行环境的组合入口
```

核心模块接收普通数据并返回普通数据。时间、网络、随机数和持久化等外部能力通过参数或适配器进入，便于测试成功、超时、拒绝和重试等分支。

### 3. 依赖必须可复现

工程依赖应满足以下要求：

- 使用锁文件并在 CI 中执行 `npm ci`、`pnpm install --frozen-lockfile` 等冻结安装；
- 格式化器使用精确版本，避免不同版本改变同一文件；
- 生产依赖和开发依赖按运行阶段区分；
- 升级依赖时检查变更日志、Node.js 引擎范围和构建产物；
- 不通过全局安装的 CLI 执行项目门禁；
- 定期检查已知漏洞，但不在未验证的情况下自动升级主版本。

## 四、错误和异步处理基线

### 1. 在系统边界校验，在内部保持不变量

HTTP 响应、表单、环境变量、消息队列和文件内容都是不可信输入。输入进入核心业务前，应完成类型、范围、枚举和必填字段校验。

| 边界 | 最少校验内容 | 失败处理 |
|------|--------------|----------|
| 用户输入 | 类型、长度、格式、范围 | 返回可操作的字段错误 |
| HTTP 响应 | 状态码、内容类型、响应结构 | 保留请求上下文并进入失败分支 |
| 环境变量 | 是否存在、格式、允许值 | 启动阶段快速失败 |
| 文件或消息 | 编码、结构、版本、大小 | 隔离坏数据并记录诊断信息 |

校验完成后，内部函数可以依赖已建立的不变量，避免每一层重复猜测数据状态。

### 2. 不吞掉异常

捕获异常必须有明确目的，例如补充上下文、转换为领域错误、执行资源清理或在边界层生成响应。只记录一句“失败了”后继续执行，会丢失堆栈和业务上下文。

推荐保留原始错误作为 `cause`。下面是局部示例，省略了具体 HTTP 客户端实现：

```javascript
// src/order/load-order.js

/**
 * 读取并校验订单数据。
 * @param {(orderId: string) => Promise<unknown>} requestOrder 由适配层提供的订单请求函数。
 * @param {string} orderId 非空订单标识。
 * @returns {Promise<unknown>} 请求成功后的订单数据，结构校验由后续领域层完成。
 * @throws {TypeError} 订单标识为空时抛出。
 * @throws {Error} 请求失败时抛出带订单上下文的新错误，并保留原始错误。
 */
export async function loadOrder(requestOrder, orderId) {
  if (typeof orderId !== "string" || orderId.trim() === "") {
    throw new TypeError("订单标识不能为空");
  }

  try {
    return await requestOrder(orderId);
  } catch (error) {
    throw new Error(`读取订单 ${orderId} 失败`, { cause: error });
  }
}
```

调用层必须处理这个 Promise：通过 `await` 进入 `try...catch`、返回给上层统一错误边界，或显式附加拒绝处理。不能让 Promise 在没有约定的情况下悬空执行。

### 3. 超时、取消和重试属于调用策略

网络请求和长任务应接收 `AbortSignal` 或等价取消信号。重试只适用于可重试错误和满足幂等约束的操作，并且需要限制次数、退避时间和总时长。

| 操作 | 是否默认重试 | 原因 |
|------|--------------|------|
| 查询类 GET 请求 | 可以按状态和网络错误有限重试 | 通常幂等，但仍需总超时 |
| 创建订单 POST | 不默认重试 | 可能重复创建，需要幂等键或服务端保证 |
| 参数校验失败 | 不重试 | 相同输入不会因等待而恢复 |
| 服务端限流 | 按响应策略重试 | 应尊重 `Retry-After` 等信息 |

不要在通用工具函数中隐藏无限重试，否则上层无法控制延迟和资源消耗。

## 五、兼容性和构建基线

### 1. 区分语法转换、API 补齐和功能降级

兼容性问题需要按类型处理：

| 问题 | 例子 | 处理方式 |
|------|------|----------|
| 目标环境不识别语法 | 可选链、类字段 | 配置构建 target 并检查最终产物 |
| 目标环境缺少内置 API | 某些 `Array` 方法 | 按需引入并验证 polyfill |
| 目标环境缺少 Web API | 新的浏览器接口 | 功能检测、替代实现或关闭功能 |
| API 存在但行为受权限限制 | Clipboard、摄像头、存储 | 处理权限拒绝和安全上下文要求 |
| 服务端和浏览器能力不同 | `node:fs`、DOM | 拆分宿主适配器和入口 |

语法转换不会自动提供 DOM、网络权限或所有运行时 API。polyfill 也可能增加体积、修改全局对象或无法完整模拟原生行为，需要按功能评估。

### 2. 构建目标进入版本控制

使用 Vite 等构建工具时，应显式理解 `build.target` 的含义。Vite 当前文档把默认目标定义为 `baseline-widely-available`，并对应一个固定日期的浏览器集合；升级 Vite 可能改变这个默认快照。

下面是配置片段，适用于确认采用 Vite 当前 Baseline 默认策略的项目：

```javascript
// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "baseline-widely-available",
  },
});
```

如果产品必须支持更旧的浏览器，应根据真实版本设置明确 target，并验证生成产物。不要直接使用 `"esnext"` 追求更小产物，除非部署环境完全受控且支持范围已经验证。

### 3. 用功能检测处理可选能力

浏览器行为分支优先检测具体功能，不解析 User-Agent 判断浏览器名称。UA 字符串可能变化、伪装或无法准确表达 WebView 能力。

```javascript
// src/browser/share-order.js

/**
 * 尝试调用浏览器原生分享能力。
 * @param {{ title: string, text: string, url: string }} shareData 已校验的分享内容。
 * @returns {Promise<"shared" | "unsupported">} 分享成功或当前环境不支持。
 */
export async function shareOrder(shareData) {
  if (typeof globalThis.navigator?.share !== "function") {
    return "unsupported";
  }

  await globalThis.navigator.share(shareData);
  return "shared";
}
```

调用方仍需处理用户取消、权限拒绝和宿主抛出的其他异常。`"unsupported"` 只表示入口不存在，不代表异常都可以转换为“不支持”。

## 六、静态检查、格式化和测试门禁

### 1. 三类工具各自负责不同问题

| 工具 | 负责发现的问题 | 不负责的问题 |
|------|----------------|--------------|
| ESLint | 未定义变量、危险模式、团队规则违规 | 不能证明业务结果正确 |
| Prettier | 统一可自动决定的代码格式 | 不判断命名和业务设计 |
| 单元测试 | 输入输出、异常和边界行为 | 不能替代兼容性与端到端测试 |

三者应组合为一个本地和 CI 都能执行的 `verify` 命令。格式化与静态检查职责分离，避免在 ESLint 中重复维护纯格式规则。

### 2. Flat Config 明确检查范围

ESLint 当前配置格式是 Flat Config。配置应显式列出源代码、测试文件和忽略目录，并启用未使用禁用指令检查。

本文完整示例中的配置如下：

```javascript
// eslint.config.js
import js from "@eslint/js";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["coverage/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js", "test/**/*.js"],
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
    },
  },
]);
```

规则集只是起点。浏览器全局变量、Node.js 全局变量、框架插件和测试环境应按文件范围配置，不能通过关闭 `no-undef` 掩盖环境边界。

## 七、可复现的 ESM 最小工程

### 1. 前置条件和目录

示例适用以下环境：

- Node.js `^22.13.0 || ^24.0.0`；
- npm 10 或与对应 Node.js 版本配套的 npm；
- 可以访问 npm registry 以安装开发依赖；
- PowerShell、bash 或其他可以执行 npm scripts 的终端。

创建以下目录。示例使用整数“分”保存金额，并用基点表示税率，避免把二进制浮点误差带入金额模型：

```text
modern-js-baseline/
├── package.json
├── eslint.config.js
├── src/
│   └── order-total.js
└── test/
    └── order-total.test.js
```

### 2. 依赖和脚本

项目根目录 `package.json` 同时声明 Node.js 范围、ESM 和统一验证入口：

```json
{
  "name": "modern-js-baseline-example",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": "^22.13.0 || ^24.0.0"
  },
  "scripts": {
    "lint": "eslint .",
    "format:check": "prettier . --check",
    "test": "node --test",
    "verify": "npm run lint && npm run format:check && npm test"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "eslint": "10.8.0",
    "prettier": "3.9.6"
  }
}
```

安装依赖并生成 `package-lock.json`：

```powershell
npm install
```

仓库应提交 `package-lock.json`。CI 使用 `npm ci`，确保安装结果与锁文件一致。

### 3. 核心实现

`src/order-total.js` 校验所有外部输入，并在整数安全范围内计算含税总额：

```javascript
// src/order-total.js

/**
 * 校验单条订单明细。
 * @param {unknown} line 待校验数据，必须包含正整数数量和非负整数单价（分）。
 * @returns {void} 校验成功时无返回值。
 * @throws {TypeError} 明细结构或字段类型不正确时抛出。
 * @throws {RangeError} 数量或单价超出业务范围时抛出。
 */
function validateOrderLine(line) {
  if (line === null || typeof line !== "object") {
    throw new TypeError("订单明细必须是对象");
  }

  if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
    throw new RangeError("订单数量必须是安全正整数");
  }

  if (!Number.isSafeInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
    throw new RangeError("订单单价必须是非负安全整数");
  }
}

/**
 * 计算订单含税总额，金额单位为分，税率单位为基点（10000 基点等于 100%）。
 * @param {Array<{ quantity: number, unitPriceCents: number }>} lines 至少包含一项的订单明细。
 * @param {number} taxRateBasisPoints 0 到 10000 之间的整数税率。
 * @returns {number} 四舍五入后的含税总额，单位为分。
 * @throws {TypeError} 明细集合不是非空数组时抛出。
 * @throws {RangeError} 税率或计算结果超出安全整数范围时抛出。
 */
export function calculateOrderTotalCents(lines, taxRateBasisPoints) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new TypeError("订单明细必须是非空数组");
  }

  if (
    !Number.isInteger(taxRateBasisPoints) ||
    taxRateBasisPoints < 0 ||
    taxRateBasisPoints > 10000
  ) {
    throw new RangeError("税率基点必须是 0 到 10000 之间的整数");
  }

  let subtotalCents = 0;

  for (const line of lines) {
    validateOrderLine(line);

    const lineTotalCents = line.unitPriceCents * line.quantity;
    if (!Number.isSafeInteger(lineTotalCents)) {
      throw new RangeError("订单明细金额超出安全整数范围");
    }

    subtotalCents += lineTotalCents;
    if (!Number.isSafeInteger(subtotalCents)) {
      throw new RangeError("订单小计超出安全整数范围");
    }
  }

  const taxMultiplier = 10000 + taxRateBasisPoints;
  if (subtotalCents > Number.MAX_SAFE_INTEGER / taxMultiplier) {
    throw new RangeError("订单含税金额超出安全整数范围");
  }

  return Math.round((subtotalCents * taxMultiplier) / 10000);
}
```

示例用基点表达税率，例如 `600` 表示 `6%`。真实结算系统还要明确币种、舍入模式、折扣顺序和税务规则，不能直接把示例当作完整财务模型。

### 4. 成功和失败测试

`test/order-total.test.js` 同时验证正常结果、非法税率和空明细：

```javascript
// test/order-total.test.js
import assert from "node:assert/strict";
import test from "node:test";

import { calculateOrderTotalCents } from "../src/order-total.js";

/**
 * 验证多个订单明细按整数金额和基点税率计算。
 * @returns {void} 断言通过时无返回值。
 */
function shouldCalculateTaxedTotal() {
  const lines = [
    { quantity: 2, unitPriceCents: 1299 },
    { quantity: 3, unitPriceCents: 500 },
  ];

  assert.equal(calculateOrderTotalCents(lines, 600), 4344);
}

/**
 * 验证超出 100% 的税率会被拒绝。
 * @returns {void} 断言通过时无返回值。
 */
function shouldRejectInvalidTaxRate() {
  assert.throws(
    /**
     * 使用非法税率触发范围校验。
     * @returns {number} 正常情况下会返回金额，但本场景必须抛出异常。
     */
    function calculateWithInvalidTaxRate() {
      return calculateOrderTotalCents(
        [{ quantity: 1, unitPriceCents: 1000 }],
        10001,
      );
    },
    {
      name: "RangeError",
      message: "税率基点必须是 0 到 10000 之间的整数",
    },
  );
}

/**
 * 验证空订单不会被当作零金额订单继续处理。
 * @returns {void} 断言通过时无返回值。
 */
function shouldRejectEmptyOrder() {
  assert.throws(
    /**
     * 使用空明细触发集合校验。
     * @returns {number} 正常情况下会返回金额，但本场景必须抛出异常。
     */
    function calculateEmptyOrder() {
      return calculateOrderTotalCents([], 600);
    },
    {
      name: "TypeError",
      message: "订单明细必须是非空数组",
    },
  );
}

test("计算订单含税总额", shouldCalculateTaxedTotal);
test("拒绝非法税率", shouldRejectInvalidTaxRate);
test("拒绝空订单", shouldRejectEmptyOrder);
```

### 5. 执行和预期结果

在项目根目录执行统一验证命令：

```powershell
npm run verify
```

关键输出如下，耗时和 npm 前缀行因环境而异：

```text
Checking formatting...
All matched files use Prettier code style!
TAP version 13
# Subtest: 计算订单含税总额
ok 1 - 计算订单含税总额
# Subtest: 拒绝非法税率
ok 2 - 拒绝非法税率
# Subtest: 拒绝空订单
ok 3 - 拒绝空订单
1..3
# pass 3
# fail 0
```

命令退出码为 `0` 才表示静态检查、格式检查和单元测试全部通过。任一阶段失败时，后续阶段不会继续执行。

### 6. 故障注入和恢复

把测试中的预期总额从 `4344` 临时改为 `4343`，再次执行：

```powershell
npm test
```

预期出现 `AssertionError`，测试进程以非零状态退出：

```text
not ok 1 - 计算订单含税总额
error: |-
  Expected values to be strictly equal:

  4344 !== 4343
# pass 2
# fail 1
```

该错误证明测试门禁能够阻断错误结果。完成故障注入后，应恢复预期值 `4344` 并重新执行 `npm run verify`，确认退出码恢复为 `0`。

::: tip 示例验证结论
这条最小链路证明了 ESM 解析、固定工具版本、静态检查、格式检查、成功分支和输入失败分支可以由一个命令重复验证。它没有覆盖浏览器兼容性、真实税务规则、端到端交互和生产发布流程，这些能力需要在具体项目中继续补充。
:::

## 八、团队落地与迁移策略

### 1. 新项目直接建立门禁

新项目建议按以下顺序落地：

1. 声明 Node.js 和浏览器支持范围；
2. 确定 ESM、目录边界和包入口；
3. 固定 ESLint、Prettier 和测试工具版本；
4. 建立 `lint`、`format:check`、`test` 和 `verify` 命令；
5. 在 CI 中冻结安装并执行统一验证；
6. 在目标浏览器或 Node.js 版本矩阵中运行产物；
7. 记录不支持能力的降级或阻断策略。

先建立可执行门禁，再扩展规则。一次启用大量未经评估的规则，容易造成团队集中关闭规则或产生无意义修改。

### 2. 旧项目采用增量迁移

旧项目不应把模块迁移、格式化、依赖升级和业务修改混在一个变更中。推荐顺序如下：

| 顺序 | 迁移内容 | 验证重点 |
|------|----------|----------|
| 1 | 固定现有运行时和依赖 | 现有构建与测试可以复现 |
| 2 | 引入只报告问题的静态检查 | 记录存量问题，不改变运行行为 |
| 3 | 建立新代码基线 | 新增文件不继续制造存量问题 |
| 4 | 按模块迁移 ESM 和严格规则 | 每个模块迁移后执行回归测试 |
| 5 | 单独执行格式化 | 避免格式噪声掩盖逻辑变更 |
| 6 | 收紧 CI 门禁 | 确认团队本地命令和 CI 一致 |

无法一次修复的存量问题应有明确基线文件或迁移清单，并持续减少数量。永久关闭规则不属于迁移方案。

## 九、交付检查与官方资料

### 1. 基线检查清单

- [ ] `package.json` 明确 Node.js 版本和模块类型；
- [ ] 浏览器支持范围可以解析为具体版本或固定 Baseline 目标；
- [ ] 相对 ESM 导入包含明确扩展名；
- [ ] 外部输入在系统边界完成类型和范围校验；
- [ ] Promise 拒绝、取消、超时和重试策略有明确归属；
- [ ] ESLint、Prettier 和测试工具使用项目本地固定版本；
- [ ] 锁文件进入版本控制，CI 使用冻结安装；
- [ ] `npm run verify` 在本地和 CI 使用同一入口；
- [ ] 成功、边界和失败场景都有自动化测试；
- [ ] 构建产物在声明的运行时或浏览器中完成验证；
- [ ] 版本升级会同步更新基线日期和验证结果。

### 2. 官方参考资料

| 资料 | 用途 |
|------|------|
| [Node.js Releases](https://nodejs.org/en/about/previous-releases) | 核对 Node.js 主版本支持状态和生产版本建议 |
| [Node.js Packages](https://nodejs.org/api/packages.html) | 查询 ESM、CommonJS、`"type"` 和包入口规则 |
| [Node.js Test Runner](https://nodejs.org/api/test.html) | 查询 `node:test` 和 `node --test` 的稳定能力 |
| [ECMAScript 最新语言规范](https://tc39.es/ecma262/) | 查询语言语法、严格模式和模块语义 |
| [MDN JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) | 查询浏览器 ESM、模块作用域和加载问题 |
| [Web Platform Baseline](https://web.dev/baseline) | 理解 Newly available 与 Widely available 的兼容性含义 |
| [Vite Build Options](https://vite.dev/config/build-options) | 查询 `build.target` 与 Baseline 目标 |
| [ESLint Configuration Files](https://eslint.org/docs/latest/use/configure/configuration-files) | 查询 Flat Config 文件和配置范围 |
| [Prettier Installation](https://prettier.io/docs/install.html) | 查询固定版本安装和 CI 格式检查 |
| [MDN Browser Detection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Browser_detection_using_the_user_agent) | 理解 UA 判断风险和功能检测方案 |

::: tip 基线结论
有效的现代 JavaScript 基线必须能回答“在哪运行、如何加载、支持什么、失败怎么办、用什么命令证明”。只要其中一项无法验证，基线仍然只是建议，而不是工程合同。
:::
