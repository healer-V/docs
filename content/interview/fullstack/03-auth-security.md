---
title: "认证与Web安全面试题"
category: "面试题"
tags:
  - 认证授权
  - JWT
  - OAuth 2.0
  - Web 安全
excerpt: "围绕 Session 与 JWT、令牌存储与刷新、OAuth 2.0 授权码与 PKCE、单点登录、密码存储，以及 XSS、CSRF、SQL 注入、CORS 和越权漏洞等面试题，说明攻击条件、防御机制和各自不能防御的范围。"
---

# 认证与Web安全面试题

认证回答“你是谁”，授权回答“你能做什么”。安全题的回答要具体到攻击者需要满足什么条件、防御措施阻断了哪一步，以及它不能防御什么；只说“用 JWT 更安全”“加 HTTPS 就安全了”都会被追问。

## 一、认证与会话

### 1. Session 与 JWT 有什么区别，如何选择？

**Session 方案把会话状态保存在服务端，客户端只持有随机的会话 ID；JWT 把用户信息和过期时间签名后交给客户端保存，服务端验证签名即可，无需查询会话存储。**

| 维度 | Session | JWT |
|------|---------|-----|
| 状态位置 | 服务端存储（内存、Redis） | 令牌自身携带 |
| 主动失效 | 删除服务端会话即可 | 过期前一直有效，需要黑名单或短有效期 |
| 横向扩展 | 需要共享会话存储 | 任何持有密钥的服务都能验证 |
| 令牌大小 | 短随机字符串 | 包含载荷，通常数百字节 |
| 适用场景 | 传统 Web 应用、需要即时踢下线 | 服务间调用、跨域 API、移动端 |

JWT 的载荷只是 Base64URL 编码，任何人都能解码读取，不能放密码、手机号等敏感信息；签名只保证内容未被篡改。验证时必须固定允许的算法，拒绝 `alg: none`，并校验 `exp`、`iss`、`aud` 等声明。

参考：[RFC 7519：JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519)、[RFC 8725：JWT 最佳实践](https://www.rfc-editor.org/rfc/rfc8725)。

### 2. 令牌应该存在 localStorage 还是 Cookie，如何实现刷新？

**存在 `localStorage` 的令牌可以被页面上任何 JavaScript 读取，一旦出现 XSS 就会被窃取；设置了 `HttpOnly` 的 Cookie 无法被脚本读取，但浏览器会自动携带，需要防范 CSRF。**

浏览器端常见的做法是：访问令牌有效期较短（如 15 分钟），刷新令牌放在 `HttpOnly; Secure; SameSite=Strict` 的 Cookie 中，并把 Cookie 的 `Path` 限制为刷新接口。访问令牌过期后，前端调用刷新接口换取新令牌。

| 措施 | 作用 |
|------|------|
| 刷新令牌轮换 | 每次刷新都签发新的刷新令牌，旧令牌立即作废 |
| 重用检测 | 已作废的刷新令牌再次出现，说明可能被窃取，撤销该用户的整个令牌族 |
| 服务端记录 | 刷新令牌在服务端可撤销，用于修改密码后强制下线 |

`HttpOnly` 只能防止令牌被读取，不能阻止 XSS 脚本在当前页面以用户身份直接发起请求，所以它是降低损失而不是替代 XSS 防御。

参考：[OAuth 2.0 安全最佳实践 RFC 9700：刷新令牌保护](https://www.rfc-editor.org/rfc/rfc9700#name-refresh-token-protection)、[MDN：Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)。

### 3. OAuth 2.0 授权码模式和 PKCE 的流程是什么？

**OAuth 2.0 让用户授权第三方应用访问自己在资源服务器上的数据，而不必把密码交给第三方。** 授权码模式先在浏览器中获得一次性授权码，再由应用用授权码换取访问令牌。

1. 应用生成随机的 `code_verifier`，计算 `code_challenge = BASE64URL(SHA256(code_verifier))`。
2. 浏览器跳转到授权服务器，携带 `client_id`、`redirect_uri`、`scope`、`state` 和 `code_challenge`。
3. 用户登录并同意授权后，授权服务器重定向回 `redirect_uri` 并附带 `code` 和原样的 `state`。
4. 应用校验 `state` 与发起时一致（防 CSRF），再用 `code` 和 `code_verifier` 请求令牌接口。
5. 授权服务器验证 `code_verifier` 的哈希与之前的 `code_challenge` 一致后，签发访问令牌。

PKCE 防止授权码被截获后滥用：攻击者即使拿到 `code`，没有只保存在应用中的 `code_verifier` 也无法换取令牌。单页应用和移动应用无法安全保存 `client_secret`，必须使用 PKCE；当前的安全最佳实践要求所有客户端都使用 PKCE，隐式模式和密码模式已不再推荐。

::: info OAuth 2.0 不是认证协议
OAuth 2.0 本身只负责授权访问资源。“用第三方账号登录”应使用建立在 OAuth 2.0 之上的 OpenID Connect，通过 ID Token 获取经过签名的用户身份信息。
:::

参考：[RFC 7636：PKCE](https://www.rfc-editor.org/rfc/rfc7636)、[RFC 9700：OAuth 2.0 安全最佳实践](https://www.rfc-editor.org/rfc/rfc9700)、[OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)。

### 4. 用户密码应该如何存储？

**密码必须使用专门的慢哈希算法加盐存储，例如 Argon2id、scrypt 或 bcrypt；不能明文保存，也不能使用 MD5、SHA-256 等快速哈希。**

快速哈希在 GPU 上每秒可以计算数十亿次，数据库泄露后，常见密码能被字典和暴力破解迅速还原。慢哈希通过可调的计算成本和内存成本让每次尝试都变贵；每个用户随机生成的盐让相同密码得到不同哈希，使预先计算的彩虹表失效。

OWASP 推荐优先使用 Argon2id，bcrypt 适用于遗留系统，但 bcrypt 只处理密码的前 72 个字节。成本参数应随硬件提升定期调高，用户下次登录成功时用新参数重新哈希。登录接口还应配合失败次数限制和多因素认证，防止在线撞库。

参考：[OWASP：密码存储备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)。

## 二、常见 Web 攻击

### 1. XSS 有哪些类型，如何防御？

**XSS（跨站脚本）是攻击者让自己的脚本在受害者浏览器中以目标网站的身份执行。** 按注入方式分为存储型、反射型和 DOM 型。

| 类型 | 注入路径 | 例子 |
|------|----------|------|
| 存储型 | 恶意内容存入数据库，展示给其他用户 | 评论中包含 `<script>` |
| 反射型 | 恶意内容在请求参数中，服务端直接拼接到响应 | 搜索页回显关键词 |
| DOM 型 | 前端脚本把 URL 片段等不可信数据写入危险 API | `el.innerHTML = location.hash` |

防御的核心是按输出位置转义：HTML 文本用 HTML 实体转义，属性值加引号并转义，URL 校验协议只允许 `http:`/`https:`，避免 `javascript:` 链接。Vue 的 `{{ }}` 和 React 的 JSX 默认转义文本，风险集中在 `v-html`、`dangerouslySetInnerHTML` 等绕过转义的接口，必须使用 DOMPurify 等库净化后再插入。

CSP（内容安全策略）是纵深防御：`Content-Security-Policy: script-src 'self' 'nonce-随机值'` 只允许本站脚本和带正确 nonce 的内联脚本执行，即使注入了 `<script>` 也无法运行。

参考：[OWASP：XSS 防御备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)、[MDN：CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)。

### 2. CSRF 的原理是什么，SameSite Cookie 能完全防御吗？

**CSRF（跨站请求伪造）利用浏览器会自动携带 Cookie 的特性：用户登录 A 网站后访问恶意网站，恶意网站提交一个指向 A 的表单，请求会带上 A 的 Cookie，以用户身份执行操作。** 攻击者无法读取响应，但能触发转账、改密码等写操作。

| 防御方式 | 原理 |
|----------|------|
| `SameSite=Lax` 或 `Strict` | 跨站请求不携带 Cookie；`Lax` 仍允许顶层导航的 GET 携带 |
| CSRF Token | 页面中嵌入随机令牌，提交时校验，恶意网站无法获得 |
| 校验 `Origin` / `Referer` | 拒绝来源不是本站的写请求 |
| 自定义请求头 | 跨源请求携带自定义头会触发 CORS 预检，未授权的来源无法发送 |

现代浏览器对未设置 `SameSite` 的 Cookie 默认按 `Lax` 处理，这大幅降低了 CSRF 风险，但仍不能完全依赖：GET 接口若有副作用仍可被利用；“同站”按注册域判断，`evil.example.com` 与 `app.example.com` 属于同站，子域名被攻破后可以发起同站请求。敏感操作应同时使用 CSRF Token 或校验 `Origin`。

参考：[OWASP：CSRF 防御备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)、[MDN：SameSite Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#samesitesamesite-value)。

### 3. SQL 注入如何防御？

**SQL 注入是把用户输入拼接进 SQL 语句，让输入被当作 SQL 代码执行。** 输入 `' OR '1'='1` 可能让登录条件恒为真，输入 `'; DROP TABLE users; --` 可能执行额外语句。

根本防御是参数化查询（预编译语句）：SQL 结构和参数分开发送给数据库，参数始终被当作数据处理。以 Node.js 的 `mysql2` 为例，`db.execute('SELECT * FROM users WHERE email = ?', [email])` 无论 `email` 包含什么字符都不会改变语句结构。

参数化只能用于值，不能用于表名、列名和排序方向。动态排序时，应把用户传入的字段名与白名单比对后再拼接，例如只允许 `created_at` 和 `amount`。ORM 通常默认参数化，但其提供的原生 SQL 接口（如 MyBatis 的 `${}`、Prisma 的 `$queryRawUnsafe`）仍会拼接字符串。数据库账号也应遵循最小权限，应用账号不应拥有删除表的权限。

参考：[OWASP：SQL 注入防御备忘单](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)。

### 4. CORS 是安全机制吗，为什么配置了 CORS 还会被攻击？

**CORS 是浏览器放宽同源策略的机制，决定其他源的页面脚本能否读取响应；它不是服务端的访问控制，也不能阻止非浏览器客户端调用接口。**

浏览器发起跨源请求时，服务端通过 `Access-Control-Allow-Origin` 声明允许哪些源读取响应。`curl`、服务端程序和攻击者自己的脚本不受 CORS 限制，所以接口仍然必须做认证和授权。

| 错误配置 | 风险 |
|----------|------|
| 把请求的 `Origin` 原样回显到 `Allow-Origin`，并允许凭据 | 任意网站都能以用户身份读取接口数据 |
| 白名单用后缀匹配，如以 `example.com` 结尾 | `attackerexample.com` 也能通过 |
| 允许 `null` 源 | 沙箱 iframe 和本地文件可以利用 |

`Access-Control-Allow-Origin: *` 不能与 `Access-Control-Allow-Credentials: true` 同时生效，浏览器会拒绝。需要携带凭据时，必须返回具体的源，并配合 `Vary: Origin` 防止缓存把一个源的响应发给另一个源。

参考：[MDN：CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)、[PortSwigger：CORS 漏洞](https://portswigger.net/web-security/cors)。

### 5. 什么是越权漏洞，如何防御？

**越权指用户访问或操作了不属于自己的资源（水平越权）或超出自身角色的功能（垂直越权）。** OWASP Top 10 的 2021 版和 2025 版都把它列为第一位（A01 Broken Access Control）。

用户 A 访问 `GET /orders/1001` 查看自己的订单，把 ID 改为 1002 就能看到用户 B 的订单，这是最常见的水平越权：接口只校验了“已登录”，没有校验“订单属于当前用户”。前端隐藏按钮不能代替授权，攻击者可以直接构造请求。

防御方式是在服务端每次访问资源时校验归属和权限：查询时带上用户条件 `WHERE id = ? AND user_id = ?`，或者先查出资源再比对所有者；管理接口在服务端检查角色；把授权逻辑集中在中间件或策略层，避免每个接口各写一遍而遗漏。使用不可猜测的 ID 只能增加枚举难度，不能替代授权校验。

参考：[OWASP Top 10:2025：A01 Broken Access Control](https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/)、[OWASP：授权备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)。
