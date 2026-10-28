---
title: "Java 第7章异常、I/O 与网络编程交付记录"
tags:
  - Java
  - 文档交付
excerpt: "记录 Java 第7章10篇正文、20项知识与独立示例的交付，核对异常传播、资源、文件、编码、NIO、序列化和本地网络故障，追踪旧路径、生产锚点及站点工程结果。"
date: 2026-09-08
---

# Java 第7章异常、I/O 与网络编程交付记录

第7章10篇正文、20项知识、10份完整源码及10篇旧文迁移已完成，工程验收通过。正文沿用已确认的语言/API样板，正式导航现覆盖前七章59篇。技术知识以个人长期维护和公开分享为目标，示例结论与未验证的生产边界明确区分。

## 一、正文与知识覆盖

路径以仓库根为基准，登记源码位置，不作为跨单元站点页面链接。

| 顺序 | 文章与知识ID | 正文路径 |
| --- | --- | --- |
| 7.1 | Java 异常体系；J07-01.a/b | `content/backend/04-java/07-exceptions-io-network/01-exception-hierarchy.md` |
| 7.2 | 异常捕获、传播与处理策略；J07-02.a/b | `content/backend/04-java/07-exceptions-io-network/02-catching-propagation.md` |
| 7.3 | 自定义异常与错误设计；J07-03.a/b | `content/backend/04-java/07-exceptions-io-network/03-custom-error-design.md` |
| 7.4 | 资源生命周期与 try-with-resources；J07-04.a/b | `content/backend/04-java/07-exceptions-io-network/04-resource-lifecycle.md` |
| 7.5 | Path 与 Files；J07-05.a/b | `content/backend/04-java/07-exceptions-io-network/05-path-files.md` |
| 7.6 | 字节流、字符流与字符编码；J07-06.a/b | `content/backend/04-java/07-exceptions-io-network/06-byte-character-streams.md` |
| 7.7 | NIO Buffer 与 Channel；J07-07.a/b | `content/backend/04-java/07-exceptions-io-network/07-nio-buffers-channels.md` |
| 7.8 | 序列化与数据交换边界；J07-08.a/b | `content/backend/04-java/07-exceptions-io-network/08-serialization-boundaries.md` |
| 7.9 | Socket 与应用消息边界；J07-09.a/b | `content/backend/04-java/07-exceptions-io-network/09-socket-programming.md` |
| 7.10 | HttpClient 请求与响应处理；J07-10.a/b | `content/backend/04-java/07-exceptions-io-network/10-http-client.md` |

| 主讲职责 | 实际证据 |
| --- | --- |
| J07-01 | ExceptionHierarchyDemo分类与调用方责任；3个运行错误及2处编译错误 |
| J07-02 | ExceptionPropagationDemo捕获顺序、cause与finally覆盖；2个运行错误及2处编译错误 |
| J07-03 | CustomErrorDesignDemo错误码、安全响应与逐行失败；3个异常入口 |
| J07-04 | ResourceLifecycleDemo逆序关闭、初始化失败及主异常/suppressed；3个异常入口 |
| J07-05 | PathFilesDemo创建、复制、移动、属性及清理；缺失、覆盖、越界3个异常入口 |
| J07-06 | ByteCharacterStreamsDemo两字节分块、UTF-8、flush和关闭传播；2个异常入口 |
| J07-07 | NioBuffersChannelsDemo状态切换、短写和临时文件；3个缓冲区异常入口 |
| J07-08 | SerializationBoundariesDemo共享引用、transient、过滤和业务校验；4个异常入口 |
| J07-09 | SocketProgrammingDemo两字节块读取、两帧、半关闭和线程回收；超长、截断、超时3个入口 |
| J07-10 | HttpClientDemo客户端复用、200/404、正文关闭和服务回收；状态、请求超时、超限3个入口 |

全模块仍为14章123篇、247项知识。本批只将J07的20项改为已覆盖，不把后续规划标为已验收。

## 二、源码与运行验证

环境为Windows PowerShell、Corretto 21.0.11、javac 21.0.11。正文程序使用JDK正式API，HTTP夹具额外启用JDK自带的jdk.httpserver模块，无第三方依赖。

| 检查项 | 实际结果 | 证明范围 |
| --- | --- | --- |
| 正文提取与源码比对 | 10份完整源码一致，另提取4份静态错误程序 | 统一剥离文件位置注释后比较实现 |
| 正常编译 | 10份源码通过Xlint、doclint、Werror检查，无警告 | Java 21类型与JavaDoc语法 |
| 正常运行 | 10个入口断言通过并退出0 | 正文结果逐行对应，动态回环端口单独校验 |
| 运行故障 | 29个入口按预期退出1 | 异常类型与正文处理说明一致 |
| 编译故障 | 4个程序各退出1、各1处错误 | 受检异常、非法throw、catch顺序、父子类型multi-catch |
| 网络与资源 | 回环动态端口；客户端、监听器和工作线程退出 | 临时服务只在进程运行期间存在，不留常驻服务 |
| 临时文件 | 仅本程序拥有的固定文件和临时目录，结束时清理 | 不递归删除业务目录，不访问外部订单文件 |

逐篇记录位于 `.build/java-chapter07/checks-*.json`，最终正文代码复核位于 `.build/java-chapter07/final-verification.json`。10个正常、29个运行失败、4个编译失败，加一次全部源码编译，共44项最终检查。

Socket读取故障使用受控端点和200毫秒读取超时；HTTP请求故障使用200毫秒请求超时。超时不是吞吐测量或服务等级建议。HttpClient正文上限为夹具的128字节，正文读取总截止策略未实现，正文已明确该限制。

## 三、内容、结构与职责边界

| 检查项 | 结果 |
| --- | --- |
| 技术来源 | Java 21 JLS、序列化规范及具体JDK API，正文直接给出官方链接 |
| 知识职责 | 异常cause与suppressed分开；资源所有权先于文件和网络操作 |
| 完整闭环 | 每篇均有完整程序、执行命令、正常结果、必要错误与处理说明 |
| 内容结构 | 10篇Frontmatter与H1一致；53个H2连续编号，无H3/H4空节或骨架小节 |
| 代码围栏 | 46个围栏均有语言标识并闭合；没有只提供示例工程链接 |
| 注释 | 类、构造器、方法和回调均有职责说明；多参数方法明确参数约束与返回或副作用 |
| 文本与NIO | 两字节部分读取、显式UTF-8、严格解码；clear不清零，短写需要累计 |
| 序列化 | 只消费本地可信夹具；类型、图规模与字段校验分层，不接入不可信对象流 |
| 网络职责 | Socket帧与同步HttpClient分别闭合；异步HTTP业务组合保留给J11-09 |
| 未验证能力 | 未执行真实权限拒绝、符号链接竞态、跨版本快照、TLS、HTTP/2、性能或生产负载测试 |

## 四、迁移、引用与历史锚点

10篇旧文在完整读取后按职责重写，目标全部存在并通过代码验证后才切换sidebar。旧目录为 `04-exceptions-io-network/`，新目录为 `07-exceptions-io-network/`，均位于Java模块下。

| 旧文件 | 新文件 |
| --- | --- |
| 01-exception-hierarchy.md | 01-exception-hierarchy.md |
| 02-exception-handling-and-propagation.md | 02-catching-propagation.md |
| 03-custom-exceptions-and-error-design.md | 03-custom-error-design.md |
| 04-path-and-files.md | 05-path-files.md |
| 05-byte-and-character-streams.md | 06-byte-character-streams.md |
| 06-resource-management.md | 04-resource-lifecycle.md |
| 07-nio-buffers-and-channels.md | 07-nio-buffers-channels.md |
| 08-serialization-and-data-exchange.md | 08-serialization-boundaries.md |
| 09-socket-network-programming.md | 09-socket-programming.md |
| 10-http-client.md | 10-http-client.md |

`scripts/baselines/route-redirects.json`新增10条页面映射；已有生产入口 `/docs/backend/04-java/04-io-streams.html` 改为直达新06文章，避免二次跳转。资源关闭顺序提前至第4篇，文件与流依次为第5、6篇。

这10篇旧页在生产基线中均为local-only，没有生产锚点；只承诺页面兼容和片段传递，不声称本地旧标题逐一保留。已发布的I/O总入口另有20个生产锚点，全部在新06文章设置语义落点；文件、NIO和序列化落点包含对应主讲文章链接。路由基线检查对重定向页会跳过锚点，因此本批额外验证这20个锚点确实存在于目标HTML，不能仅凭基线通过判断锚点兼容。

两处存量正文仅更新必要链接：数据源资源文指向新04，I/O诊断文指向新10。旧蓝图、生产基线及历史交付记录保留作为历史证据；nav不改。

## 五、站点工程与修改范围

以下结果来自本地真实产物。构建依次执行，避免共享临时目录互相覆盖；装配采用本轮backend、ecosystem及其余5个既有单元产物。

| 检查项 | 实际结果 | 证据位置，相对仓库根 |
| --- | --- | --- |
| VitePress全站构建 | 退出0，180.29秒；670个HTML页面 | `.build/java-chapter07/full-build.log` |
| 全站引用检查 | 83,742处引用；断链0、缺失锚点0、问题0 | `.build/java-chapter07/full-site-validation.json` |
| backend串行重建 | 退出0，255页，44.475秒 | `.build/java-chapter07/backend-build.log` |
| ecosystem串行重建 | 退出0，127页，72.895秒 | `.build/java-chapter07/ecosystem-build.log` |
| 整站装配 | 669条正式路由、60条兼容路由，无归属或摘要冲突 | `.build/java-chapter07/assembly-report.json` |
| 装配后引用检查 | 730个HTML、83,862处引用；断链0、缺失锚点0、问题0 | `.build/java-chapter07/assembled-site-validation.json` |
| 生产路由基线 | 398条全部保留；374条直接页面、24条兼容入口 | `.build/java-chapter07/route-baseline-report.json` |
| 本批兼容入口 | 10个新映射与1个修订入口的跳转、canonical及查询参数/片段传递通过，无跳转链 | `.build/java-chapter07/compatibility-pages.json` |
| 生产锚点专项 | 20个锚点均在新06目标HTML中恰好出现一次，相关主讲链接存在 | `.build/java-chapter07/compatibility-pages.json` |
| 最终结构与渲染 | 53个H2、46个代码围栏；16份受影响Markdown无模板错误 | `.build/java-chapter07/final-structure.json`、`.build/java-chapter07/render-check.json` |
| 修改范围 | 38个文件变化；范围外786个现存文件摘要未变，暂存区未变 | `.build/java-chapter07/change-audit.json` |
| 临时服务 | 无本批Java示例进程遗留；未启动站点预览服务 | `.build/java-chapter07/service-cleanup.json` |
| 空白与冲突 | 目标git差异、尾空白和冲突标记检查通过 | `.build/java-chapter07/whitespace-check.json` |

构建结束后只回填本节与阶段状态，再定点渲染最终记录。前六章正文、源码和历史交付记录未修改；另两处存量正文只修订必要引用。上述检查不代表已发布到生产。

## 六、后续范围

下一批为第8章“注解、反射与动态能力”的6篇职责。后续工程、数据库、并发、诊断和双JDK维护样板仍按各自门禁执行，本章的辅助工作线程不视为并发样板完成。

本批不重跑前六章示例，不执行搜索索引重建、浏览器发布回归、提交、推送或部署。保留用户原有未提交改动，交付范围以本轮开始时的文件摘要和暂存区快照核验。
