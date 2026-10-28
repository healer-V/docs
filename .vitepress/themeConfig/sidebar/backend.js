export const backendSidebar = {
  "/backend/01-nodejs/": [
    {
      "text": "Node.js 核心",
      "items": [
        {
          "text": "第1章：Node.js 基础与运行时",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Node.js 概述",
              "link": "/backend/01-nodejs/01-nodejs.md"
            },
            {
              "text": "1.2 安装与版本管理",
              "link": "/backend/01-nodejs/11-install-version.md"
            },
            {
              "text": "1.3 运行时架构",
              "link": "/backend/01-nodejs/12-runtime-architecture.md"
            },
            {
              "text": "1.4 REPL 与脚本执行",
              "link": "/backend/01-nodejs/13-repl-script.md"
            },
            {
              "text": "1.5 Node.js 与浏览器 JS 差异",
              "link": "/backend/01-nodejs/14-node-browser-difference.md"
            }
          ]
        },
        {
          "text": "第2章：模块系统与包管理",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 CommonJS 与模块概述",
              "link": "/backend/01-nodejs/02-module-system.md"
            },
            {
              "text": "2.2 ES Module",
              "link": "/backend/01-nodejs/15-esm.md"
            },
            {
              "text": "2.3 模块解析机制",
              "link": "/backend/01-nodejs/16-module-resolution.md"
            },
            {
              "text": "2.4 npm / pnpm / yarn",
              "link": "/backend/01-nodejs/17-package-managers.md"
            },
            {
              "text": "2.5 package.json 与依赖管理",
              "link": "/backend/01-nodejs/18-package-json-dependency.md"
            }
          ]
        },
        {
          "text": "第3章：核心内置模块",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 File System",
              "link": "/backend/01-nodejs/03-file-system.md"
            },
            {
              "text": "3.2 Path 与 URL",
              "link": "/backend/01-nodejs/19-path-url.md"
            },
            {
              "text": "3.3 Events",
              "link": "/backend/01-nodejs/20-events.md"
            },
            {
              "text": "3.4 Buffer",
              "link": "/backend/01-nodejs/21-buffer.md"
            },
            {
              "text": "3.5 Stream",
              "link": "/backend/01-nodejs/06-streams.md"
            },
            {
              "text": "3.6 HTTP / HTTPS",
              "link": "/backend/01-nodejs/07-network.md"
            }
          ]
        },
        {
          "text": "第4章：异步模型与事件循环",
          "collapsed": true,
          "items": [
            {
              "text": "4.1 异步编程模型",
              "link": "/backend/01-nodejs/05-async.md"
            },
            {
              "text": "4.2 Event Loop",
              "link": "/backend/01-nodejs/04-network.md"
            },
            {
              "text": "4.3 Promise 与 async/await",
              "link": "/backend/01-nodejs/22-promise-async-await.md"
            },
            {
              "text": "4.4 Timer 与任务队列",
              "link": "/backend/01-nodejs/23-timer-task-queue.md"
            },
            {
              "text": "4.5 Worker Threads",
              "link": "/backend/01-nodejs/24-worker-threads.md"
            }
          ]
        },
        {
          "text": "第5章：服务端应用开发",
          "collapsed": true,
          "items": [
            {
              "text": "5.1 HTTP 服务",
              "link": "/backend/01-nodejs/25-http-server.md"
            },
            {
              "text": "5.2 REST API",
              "link": "/backend/01-nodejs/26-rest-api.md"
            },
            {
              "text": "5.3 中间件模型",
              "link": "/backend/01-nodejs/27-middleware-model.md"
            },
            {
              "text": "5.4 文件上传",
              "link": "/backend/01-nodejs/28-file-upload.md"
            },
            {
              "text": "5.5 身份认证",
              "link": "/backend/01-nodejs/29-authentication.md"
            },
            {
              "text": "5.6 数据库访问",
              "link": "/backend/01-nodejs/08-database.md"
            }
          ]
        },
        {
          "text": "第6章：工程化与质量",
          "collapsed": true,
          "items": [
            {
              "text": "6.1 TypeScript 集成",
              "link": "/backend/01-nodejs/30-typescript.md"
            },
            {
              "text": "6.2 配置管理",
              "link": "/backend/01-nodejs/31-configuration.md"
            },
            {
              "text": "6.3 日志系统",
              "link": "/backend/01-nodejs/32-logging.md"
            },
            {
              "text": "6.4 错误处理",
              "link": "/backend/01-nodejs/33-error-handling.md"
            },
            {
              "text": "6.5 单元测试",
              "link": "/backend/01-nodejs/34-testing.md"
            },
            {
              "text": "6.6 调试与诊断",
              "link": "/backend/01-nodejs/35-debugging-diagnostics.md"
            }
          ]
        },
        {
          "text": "第7章：性能、安全与部署",
          "collapsed": true,
          "items": [
            {
              "text": "7.1 性能优化",
              "link": "/backend/01-nodejs/09-performance.md"
            },
            {
              "text": "7.2 内存分析",
              "link": "/backend/01-nodejs/36-memory-profiling.md"
            },
            {
              "text": "7.3 安全实践",
              "link": "/backend/01-nodejs/37-security.md"
            },
            {
              "text": "7.4 进程管理",
              "link": "/backend/01-nodejs/38-process-management.md"
            },
            {
              "text": "7.5 Docker 部署",
              "link": "/backend/01-nodejs/39-docker-deployment.md"
            },
            {
              "text": "7.6 项目实战与生产运维",
              "link": "/backend/01-nodejs/10-project.md"
            }
          ]
        }
      ]
    }
  ],
  "/backend/02-express/": [
    {
      "text": "Express 核心",
      "items": [
        {
          "text": "第1章：Express 基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Express 概述",
              "link": "/backend/02-express/01-express.md"
            },
            {
              "text": "1.2 路由系统",
              "link": "/backend/02-express/02-routing.md"
            },
            {
              "text": "1.3 中间件机制",
              "link": "/backend/02-express/03-middleware.md"
            }
          ]
        },
        {
          "text": "第2章：请求与响应",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 请求处理",
              "link": "/backend/02-express/04-request.md"
            },
            {
              "text": "2.2 响应处理",
              "link": "/backend/02-express/05-response.md"
            },
            {
              "text": "2.3 模板引擎",
              "link": "/backend/02-express/06-template.md"
            },
            {
              "text": "2.4 错误处理",
              "link": "/backend/02-express/09-error-handling.md"
            }
          ]
        },
        {
          "text": "第3章：数据与安全",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 数据库集成",
              "link": "/backend/02-express/07-database.md"
            },
            {
              "text": "3.2 身份认证",
              "link": "/backend/02-express/08-authentication.md"
            },
            {
              "text": "3.3 RESTful API 开发",
              "link": "/backend/02-express/10-api-development.md"
            }
          ]
        }
      ]
    }
  ],
  "/backend/03-nestjs/": [
    {
      "text": "NestJS 核心",
      "items": [
        {
          "text": "第1章：NestJS 基础与项目创建",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 NestJS 概述",
              "link": "/backend/03-nestjs/01-nestjs.md"
            },
            {
              "text": "1.2 CLI 与项目创建",
              "link": "/backend/03-nestjs/14-cli-project.md"
            },
            {
              "text": "1.3 项目结构",
              "link": "/backend/03-nestjs/15-project-structure.md"
            },
            {
              "text": "1.4 启动流程",
              "link": "/backend/03-nestjs/16-bootstrap-lifecycle.md"
            },
            {
              "text": "1.5 配置管理",
              "link": "/backend/03-nestjs/17-configuration.md"
            }
          ]
        },
        {
          "text": "第2章：模块化与依赖注入",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 模块系统",
              "link": "/backend/03-nestjs/02-modules.md"
            },
            {
              "text": "2.2 控制器",
              "link": "/backend/03-nestjs/03-controllers.md"
            },
            {
              "text": "2.3 提供者与依赖注入",
              "link": "/backend/03-nestjs/04-providers.md"
            },
            {
              "text": "2.4 自定义 Provider",
              "link": "/backend/03-nestjs/18-custom-provider.md"
            },
            {
              "text": "2.5 动态模块",
              "link": "/backend/03-nestjs/19-dynamic-module.md"
            }
          ]
        },
        {
          "text": "第3章：请求生命周期与管道机制",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 中间件",
              "link": "/backend/03-nestjs/05-middleware.md"
            },
            {
              "text": "3.2 Pipes 管道",
              "link": "/backend/03-nestjs/07-pipes.md"
            },
            {
              "text": "3.3 Guards 守卫",
              "link": "/backend/03-nestjs/08-guards.md"
            },
            {
              "text": "3.4 Interceptors 拦截器",
              "link": "/backend/03-nestjs/09-interceptors.md"
            },
            {
              "text": "3.5 异常过滤器",
              "link": "/backend/03-nestjs/06-exception-filters.md"
            },
            {
              "text": "3.6 请求生命周期",
              "link": "/backend/03-nestjs/20-request-lifecycle.md"
            }
          ]
        },
        {
          "text": "第4章：接口开发与 API 设计",
          "collapsed": true,
          "items": [
            {
              "text": "4.1 REST API",
              "link": "/backend/03-nestjs/21-rest-api.md"
            },
            {
              "text": "4.2 DTO 与参数校验",
              "link": "/backend/03-nestjs/22-dto-validation.md"
            },
            {
              "text": "4.3 响应结构设计",
              "link": "/backend/03-nestjs/23-response-design.md"
            },
            {
              "text": "4.4 文件上传",
              "link": "/backend/03-nestjs/24-file-upload.md"
            },
            {
              "text": "4.5 API 文档 Swagger",
              "link": "/backend/03-nestjs/12-api-docs.md"
            }
          ]
        },
        {
          "text": "第5章：数据访问与事务",
          "collapsed": true,
          "items": [
            {
              "text": "5.1 数据库集成",
              "link": "/backend/03-nestjs/10-database.md"
            },
            {
              "text": "5.2 TypeORM",
              "link": "/backend/03-nestjs/25-typeorm.md"
            },
            {
              "text": "5.3 Prisma",
              "link": "/backend/03-nestjs/26-prisma.md"
            },
            {
              "text": "5.4 Repository 与 Service 分层",
              "link": "/backend/03-nestjs/27-repository-service.md"
            },
            {
              "text": "5.5 事务处理",
              "link": "/backend/03-nestjs/28-transaction.md"
            },
            {
              "text": "5.6 数据迁移",
              "link": "/backend/03-nestjs/29-migration.md"
            }
          ]
        },
        {
          "text": "第6章：认证、授权与安全",
          "collapsed": true,
          "items": [
            {
              "text": "6.1 身份认证",
              "link": "/backend/03-nestjs/11-authentication.md"
            },
            {
              "text": "6.2 JWT",
              "link": "/backend/03-nestjs/30-jwt.md"
            },
            {
              "text": "6.3 Passport",
              "link": "/backend/03-nestjs/31-passport.md"
            },
            {
              "text": "6.4 RBAC 权限模型",
              "link": "/backend/03-nestjs/32-rbac.md"
            },
            {
              "text": "6.5 安全实践",
              "link": "/backend/03-nestjs/33-security.md"
            }
          ]
        },
        {
          "text": "第7章：集成能力与微服务接入",
          "collapsed": true,
          "items": [
            {
              "text": "7.1 任务调度",
              "link": "/backend/03-nestjs/34-schedule.md"
            },
            {
              "text": "7.2 缓存集成",
              "link": "/backend/03-nestjs/35-cache.md"
            },
            {
              "text": "7.3 消息队列",
              "link": "/backend/03-nestjs/36-message-queue.md"
            },
            {
              "text": "7.4 WebSocket",
              "link": "/backend/03-nestjs/37-websocket.md"
            },
            {
              "text": "7.5 NestJS 微服务模式",
              "link": "/backend/03-nestjs/13-microservices.md"
            }
          ]
        },
        {
          "text": "第8章：工程化、测试与部署",
          "collapsed": true,
          "items": [
            {
              "text": "8.1 环境配置",
              "link": "/backend/03-nestjs/38-environment.md"
            },
            {
              "text": "8.2 日志系统",
              "link": "/backend/03-nestjs/39-logging.md"
            },
            {
              "text": "8.3 单元测试",
              "link": "/backend/03-nestjs/40-unit-testing.md"
            },
            {
              "text": "8.4 E2E 测试",
              "link": "/backend/03-nestjs/41-e2e-testing.md"
            },
            {
              "text": "8.5 性能优化",
              "link": "/backend/03-nestjs/42-performance.md"
            },
            {
              "text": "8.6 Docker 部署",
              "link": "/backend/03-nestjs/43-docker-deployment.md"
            },
            {
              "text": "8.7 生产运维",
              "link": "/backend/03-nestjs/44-production-ops.md"
            }
          ]
        }
      ]
    }
  ],
  "/backend/04-java/": [
    {
      "text": "Java 核心",
      "items": [
        {
          "text": "第1章：基础与环境",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Java 概述",
              "link": "/backend/04-java/01-language-foundation/01-overview.md"
            },
            {
              "text": "1.2 Java 平台",
              "link": "/backend/04-java/01-language-foundation/02-java-platform.md"
            },
            {
              "text": "1.3 JDK、JRE 与 JVM",
              "link": "/backend/04-java/01-language-foundation/03-jdk-jre-jvm.md"
            },
            {
              "text": "1.4 JDK 21 环境配置",
              "link": "/backend/04-java/01-language-foundation/04-install-jdk21.md"
            },
            {
              "text": "1.5 第一个 Java 程序",
              "link": "/backend/04-java/01-language-foundation/05-first-program.md"
            },
            {
              "text": "1.6 编译、运行与调试",
              "link": "/backend/04-java/01-language-foundation/06-compile-run-debug.md"
            }
          ]
        },
        {
          "text": "第2章：语言语法",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 Java 基础语法",
              "link": "/backend/04-java/02-language-syntax/01-basic-syntax.md"
            },
            {
              "text": "2.2 变量、常量与作用域",
              "link": "/backend/04-java/02-language-syntax/02-variables-constants-scope.md"
            },
            {
              "text": "2.3 基本数据类型",
              "link": "/backend/04-java/02-language-syntax/03-data-types.md"
            },
            {
              "text": "2.4 引用类型、数组与 null",
              "link": "/backend/04-java/02-language-syntax/04-reference-arrays-null.md"
            },
            {
              "text": "2.5 运算符与类型转换",
              "link": "/backend/04-java/02-language-syntax/05-operators-conversions.md"
            },
            {
              "text": "2.6 条件分支",
              "link": "/backend/04-java/02-language-syntax/06-conditionals.md"
            },
            {
              "text": "2.7 循环控制",
              "link": "/backend/04-java/02-language-syntax/07-loops.md"
            },
            {
              "text": "2.8 方法、参数与返回值",
              "link": "/backend/04-java/02-language-syntax/08-methods-parameters-return.md"
            },
            {
              "text": "2.9 方法重载、可变参数与递归",
              "link": "/backend/04-java/02-language-syntax/09-overload-varargs-recursion.md"
            }
          ]
        },
        {
          "text": "第3章：面向对象",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 类与对象",
              "link": "/backend/04-java/03-object-oriented-design/01-classes-objects.md"
            },
            {
              "text": "3.2 构造器与对象初始化",
              "link": "/backend/04-java/03-object-oriented-design/02-constructors-initialization.md"
            },
            {
              "text": "3.3 包、访问控制与封装",
              "link": "/backend/04-java/03-object-oriented-design/03-packages-access-encapsulation.md"
            },
            {
              "text": "3.4 继承与组合",
              "link": "/backend/04-java/03-object-oriented-design/04-inheritance-composition.md"
            },
            {
              "text": "3.5 多态与动态绑定",
              "link": "/backend/04-java/03-object-oriented-design/05-polymorphism-dynamic-binding.md"
            },
            {
              "text": "3.6 抽象类与接口",
              "link": "/backend/04-java/03-object-oriented-design/06-abstract-classes-interfaces.md"
            },
            {
              "text": "3.7 Object 通用契约",
              "link": "/backend/04-java/03-object-oriented-design/07-object-contract.md"
            },
            {
              "text": "3.8 嵌套类与匿名类",
              "link": "/backend/04-java/03-object-oriented-design/08-nested-anonymous-classes.md"
            },
            {
              "text": "3.9 枚举",
              "link": "/backend/04-java/03-object-oriented-design/09-enums.md"
            },
            {
              "text": "3.10 Record 与不可变对象",
              "link": "/backend/04-java/03-object-oriented-design/10-records-immutability.md"
            },
            {
              "text": "3.11 密封类型与模式匹配",
              "link": "/backend/04-java/03-object-oriented-design/11-sealed-pattern-matching.md"
            },
            {
              "text": "3.12 SOLID 与设计模式",
              "link": "/backend/04-java/03-object-oriented-design/12-solid-design-patterns.md"
            }
          ]
        },
        {
          "text": "第4章：常用 API",
          "collapsed": true,
          "items": [
            {
              "text": "4.1 字符串与文本块",
              "link": "/backend/04-java/04-core-apis/01-string-text-blocks.md"
            },
            {
              "text": "4.2 包装类型与自动装箱",
              "link": "/backend/04-java/04-core-apis/02-wrapper-autoboxing.md"
            },
            {
              "text": "4.3 Math、随机数与 UUID",
              "link": "/backend/04-java/04-core-apis/03-math-random-uuid.md"
            },
            {
              "text": "4.4 BigInteger 与 BigDecimal",
              "link": "/backend/04-java/04-core-apis/04-big-numbers.md"
            },
            {
              "text": "4.5 日期时间 API",
              "link": "/backend/04-java/04-core-apis/05-date-time.md"
            },
            {
              "text": "4.6 正则表达式与文本处理",
              "link": "/backend/04-java/04-core-apis/06-regular-expressions.md"
            }
          ]
        },
        {
          "text": "第5章：泛型与集合",
          "collapsed": true,
          "items": [
            {
              "text": "5.1 泛型类、接口与方法",
              "link": "/backend/04-java/05-generics-collections/01-generic-types-methods.md"
            },
            {
              "text": "5.2 泛型边界与类型擦除",
              "link": "/backend/04-java/05-generics-collections/02-bounds-wildcards-erasure.md"
            },
            {
              "text": "5.3 集合框架",
              "link": "/backend/04-java/05-generics-collections/03-collection-framework.md"
            },
            {
              "text": "5.4 迭代、比较与排序",
              "link": "/backend/04-java/05-generics-collections/04-iteration-comparison-sorting.md"
            },
            {
              "text": "5.5 List",
              "link": "/backend/04-java/05-generics-collections/05-list.md"
            },
            {
              "text": "5.6 Set",
              "link": "/backend/04-java/05-generics-collections/06-set.md"
            },
            {
              "text": "5.7 Map",
              "link": "/backend/04-java/05-generics-collections/07-map.md"
            },
            {
              "text": "5.8 Queue 与 Deque",
              "link": "/backend/04-java/05-generics-collections/08-queue-deque.md"
            },
            {
              "text": "5.9 集合可变性与顺序",
              "link": "/backend/04-java/05-generics-collections/09-immutable-sequenced.md"
            }
          ]
        },
        {
          "text": "第6章：函数式处理",
          "collapsed": true,
          "items": [
            {
              "text": "6.1 Lambda 表达式",
              "link": "/backend/04-java/06-functional-processing/01-lambda.md"
            },
            {
              "text": "6.2 函数式接口与方法引用",
              "link": "/backend/04-java/06-functional-processing/02-functional-interfaces-method-references.md"
            },
            {
              "text": "6.3 Lambda 变量捕获",
              "link": "/backend/04-java/06-functional-processing/03-variable-capture.md"
            },
            {
              "text": "6.4 Optional",
              "link": "/backend/04-java/06-functional-processing/04-optional.md"
            },
            {
              "text": "6.5 Stream 流水线",
              "link": "/backend/04-java/06-functional-processing/05-stream-pipelines.md"
            },
            {
              "text": "6.6 Collector 与归约",
              "link": "/backend/04-java/06-functional-processing/06-collectors-reduction.md"
            },
            {
              "text": "6.7 并行流",
              "link": "/backend/04-java/06-functional-processing/07-parallel-streams.md"
            }
          ]
        },
        {
          "text": "第7章：异常、I/O 与网络",
          "collapsed": true,
          "items": [
            {
              "text": "7.1 Java 异常体系",
              "link": "/backend/04-java/07-exceptions-io-network/01-exception-hierarchy.md"
            },
            {
              "text": "7.2 异常捕获与传播",
              "link": "/backend/04-java/07-exceptions-io-network/02-catching-propagation.md"
            },
            {
              "text": "7.3 自定义异常与错误设计",
              "link": "/backend/04-java/07-exceptions-io-network/03-custom-error-design.md"
            },
            {
              "text": "7.4 资源管理与自动关闭",
              "link": "/backend/04-java/07-exceptions-io-network/04-resource-lifecycle.md"
            },
            {
              "text": "7.5 Path 与 Files",
              "link": "/backend/04-java/07-exceptions-io-network/05-path-files.md"
            },
            {
              "text": "7.6 字节流、字符流与字符编码",
              "link": "/backend/04-java/07-exceptions-io-network/06-byte-character-streams.md"
            },
            {
              "text": "7.7 NIO 缓冲区与通道",
              "link": "/backend/04-java/07-exceptions-io-network/07-nio-buffers-channels.md"
            },
            {
              "text": "7.8 序列化与数据交换边界",
              "link": "/backend/04-java/07-exceptions-io-network/08-serialization-boundaries.md"
            },
            {
              "text": "7.9 Socket 与应用消息边界",
              "link": "/backend/04-java/07-exceptions-io-network/09-socket-programming.md"
            },
            {
              "text": "7.10 HttpClient",
              "link": "/backend/04-java/07-exceptions-io-network/10-http-client.md"
            }
          ]
        },
        {
          "text": "第8章：注解与反射",
          "collapsed": true,
          "items": [
            {
              "text": "8.1 注解与元注解",
              "link": "/backend/04-java/08-annotations-reflection/01-annotations-meta.md"
            },
            {
              "text": "8.2 自定义注解",
              "link": "/backend/04-java/08-annotations-reflection/02-custom-annotations.md"
            },
            {
              "text": "8.3 Class 与反射 API",
              "link": "/backend/04-java/08-annotations-reflection/03-class-reflection.md"
            },
            {
              "text": "8.4 泛型类型信息",
              "link": "/backend/04-java/08-annotations-reflection/04-generic-type-information.md"
            },
            {
              "text": "8.5 JDK 动态代理",
              "link": "/backend/04-java/08-annotations-reflection/05-dynamic-proxies.md"
            },
            {
              "text": "8.6 Method Handle",
              "link": "/backend/04-java/08-annotations-reflection/06-method-handles.md"
            }
          ]
        },
        {
          "text": "第9章：工程与质量",
          "collapsed": true,
          "items": [
            {
              "text": "9.1 Java 工程结构",
              "link": "/backend/04-java/09-engineering-quality/01-project-packages.md"
            },
            {
              "text": "9.2 Maven 构建生命周期",
              "link": "/backend/04-java/09-engineering-quality/02-maven-pom-lifecycle.md"
            },
            {
              "text": "9.3 Maven 依赖管理",
              "link": "/backend/04-java/09-engineering-quality/03-maven-dependencies.md"
            },
            {
              "text": "9.4 Maven 构建配置",
              "link": "/backend/04-java/09-engineering-quality/04-maven-plugins-profiles-toolchains.md"
            },
            {
              "text": "9.5 Maven 多模块",
              "link": "/backend/04-java/09-engineering-quality/05-maven-multi-module.md"
            },
            {
              "text": "9.6 JAR 与模块系统",
              "link": "/backend/04-java/09-engineering-quality/06-jar-classpath-jpms.md"
            },
            {
              "text": "9.7 SLF4J 日志",
              "link": "/backend/04-java/09-engineering-quality/07-slf4j-logging.md"
            },
            {
              "text": "9.8 JUnit 单元测试",
              "link": "/backend/04-java/09-engineering-quality/08-junit.md"
            },
            {
              "text": "9.9 Mockito 测试替身",
              "link": "/backend/04-java/09-engineering-quality/09-mockito-test-doubles.md"
            },
            {
              "text": "9.10 调试与构建检查",
              "link": "/backend/04-java/09-engineering-quality/10-debug-quality-build.md"
            },
            {
              "text": "9.11 Gradle 构建基础",
              "link": "/backend/04-java/09-engineering-quality/11-gradle-reading-migration.md"
            }
          ]
        },
        {
          "text": "第10章：JDBC 与事务",
          "collapsed": true,
          "items": [
            {
              "text": "10.1 JDBC 与数据库驱动",
              "link": "/backend/04-java/10-data-access/01-jdbc-drivers.md"
            },
            {
              "text": "10.2 DataSource 与连接生命周期",
              "link": "/backend/04-java/10-data-access/02-datasource-connections.md"
            },
            {
              "text": "10.3 PreparedStatement 参数绑定",
              "link": "/backend/04-java/10-data-access/03-prepared-statements.md"
            },
            {
              "text": "10.4 ResultSet 类型映射",
              "link": "/backend/04-java/10-data-access/04-resultset-mapping.md"
            },
            {
              "text": "10.5 JDBC 事务与隔离",
              "link": "/backend/04-java/10-data-access/05-transactions-isolation.md"
            },
            {
              "text": "10.6 JDBC 批处理与生成键",
              "link": "/backend/04-java/10-data-access/06-batch-generated-keys.md"
            },
            {
              "text": "10.7 连接池与超时预算",
              "link": "/backend/04-java/10-data-access/07-pools-timeouts-capacity.md"
            },
            {
              "text": "10.8 Repository 与异常转换",
              "link": "/backend/04-java/10-data-access/08-dao-repository-errors.md"
            },
            {
              "text": "10.9 数据访问测试",
              "link": "/backend/04-java/10-data-access/09-data-access-testing.md"
            },
            {
              "text": "10.10 数据访问安全与性能",
              "link": "/backend/04-java/10-data-access/10-security-performance.md"
            }
          ]
        },
        {
          "text": "第11章：并发编程",
          "collapsed": true,
          "items": [
            {
              "text": "11.1 线程与生命周期",
              "link": "/backend/04-java/11-concurrency/01-threads-lifecycle.md"
            },
            {
              "text": "11.2 线程安全与共享状态",
              "link": "/backend/04-java/11-concurrency/02-thread-safety-shared-state.md"
            },
            {
              "text": "11.3 Java 内存模型与 volatile",
              "link": "/backend/04-java/11-concurrency/03-jmm-volatile.md"
            },
            {
              "text": "11.4 synchronized 与监视器",
              "link": "/backend/04-java/11-concurrency/04-synchronized-monitors.md"
            },
            {
              "text": "11.5 Lock 与 Condition",
              "link": "/backend/04-java/11-concurrency/05-lock-condition.md"
            },
            {
              "text": "11.6 原子类与 CAS",
              "link": "/backend/04-java/11-concurrency/06-atomics-cas.md"
            },
            {
              "text": "11.7 并发协调工具",
              "link": "/backend/04-java/11-concurrency/07-coordination-utilities.md"
            },
            {
              "text": "11.8 并发集合",
              "link": "/backend/04-java/11-concurrency/08-concurrent-collections.md"
            },
            {
              "text": "11.9 执行器与线程池",
              "link": "/backend/04-java/11-concurrency/09-executors-thread-pools.md"
            },
            {
              "text": "11.10 ThreadLocal 与上下文",
              "link": "/backend/04-java/11-concurrency/10-thread-local.md"
            },
            {
              "text": "11.11 CompletableFuture 异步组合",
              "link": "/backend/04-java/11-concurrency/11-completable-future.md"
            },
            {
              "text": "11.12 虚拟线程",
              "link": "/backend/04-java/11-concurrency/12-virtual-threads.md"
            }
          ]
        },
        {
          "text": "第12章：JVM 运行机制",
          "collapsed": true,
          "items": [
            {
              "text": "12.1 JVM 执行模型",
              "link": "/backend/04-java/12-jvm-runtime/01-jvm-execution.md"
            },
            {
              "text": "12.2 运行时数据区",
              "link": "/backend/04-java/12-jvm-runtime/02-runtime-data-areas.md"
            },
            {
              "text": "12.3 对象分配与引用",
              "link": "/backend/04-java/12-jvm-runtime/03-object-allocation-references.md"
            },
            {
              "text": "12.4 Class 文件与字节码",
              "link": "/backend/04-java/12-jvm-runtime/04-class-bytecode.md"
            },
            {
              "text": "12.5 类加载与初始化",
              "link": "/backend/04-java/12-jvm-runtime/05-class-loading.md"
            },
            {
              "text": "12.6 解释执行与 JIT",
              "link": "/backend/04-java/12-jvm-runtime/06-interpreter-jit.md"
            },
            {
              "text": "12.7 垃圾收集基础",
              "link": "/backend/04-java/12-jvm-runtime/07-gc-foundations.md"
            },
            {
              "text": "12.8 垃圾收集器选型",
              "link": "/backend/04-java/12-jvm-runtime/08-gc-collectors.md"
            },
            {
              "text": "12.9 JVM 参数与运行观测",
              "link": "/backend/04-java/12-jvm-runtime/09-jvm-options-gc-jfr.md"
            }
          ]
        },
        {
          "text": "第13章：生产诊断",
          "collapsed": true,
          "items": [
            {
              "text": "13.1 生产诊断方法",
              "link": "/backend/04-java/13-production-diagnostics/01-diagnostic-method.md"
            },
            {
              "text": "13.2 进程与 jcmd",
              "link": "/backend/04-java/13-production-diagnostics/02-process-jcmd.md"
            },
            {
              "text": "13.3 高 CPU 诊断",
              "link": "/backend/04-java/13-production-diagnostics/03-high-cpu.md"
            },
            {
              "text": "13.4 线程转储与死锁",
              "link": "/backend/04-java/13-production-diagnostics/04-thread-dumps.md"
            },
            {
              "text": "13.5 堆内存泄漏诊断",
              "link": "/backend/04-java/13-production-diagnostics/05-heap-memory-leaks.md"
            },
            {
              "text": "13.6 GC 暂停诊断",
              "link": "/backend/04-java/13-production-diagnostics/06-gc-pauses.md"
            },
            {
              "text": "13.7 本地内存与类加载诊断",
              "link": "/backend/04-java/13-production-diagnostics/07-native-metaspace-classloading.md"
            },
            {
              "text": "13.8 I/O 与连接池延迟",
              "link": "/backend/04-java/13-production-diagnostics/08-io-pools-latency.md"
            },
            {
              "text": "13.9 在线诊断与复盘",
              "link": "/backend/04-java/13-production-diagnostics/09-live-diagnostics-review.md"
            }
          ]
        },
        {
          "text": "第14章：Java 8 维护与迁移",
          "collapsed": true,
          "items": [
            {
              "text": "14.1 Java 版本与支持基线",
              "link": "/backend/04-java/14-java8-maintenance/01-release-lts-baselines.md"
            },
            {
              "text": "14.2 Java 8 与 21 语法差异",
              "link": "/backend/04-java/14-java8-maintenance/02-language-differences.md"
            },
            {
              "text": "14.3 Java 8 与 21 API 差异",
              "link": "/backend/04-java/14-java8-maintenance/03-api-collection-differences.md"
            },
            {
              "text": "14.4 Java 8 与 21 运行差异",
              "link": "/backend/04-java/14-java8-maintenance/04-concurrency-jvm-differences.md"
            },
            {
              "text": "14.5 Java 8 旧代码重构",
              "link": "/backend/04-java/14-java8-maintenance/05-reading-legacy-code.md"
            },
            {
              "text": "14.6 多 JDK 与 Toolchains",
              "link": "/backend/04-java/14-java8-maintenance/06-multi-jdk-toolchains.md"
            },
            {
              "text": "14.7 Java 8 升级 Java 21",
              "link": "/backend/04-java/14-java8-maintenance/07-java8-to-21-migration.md"
            }
          ]
        }
      ]
    }
  ],
  "/backend/05-python/": [
    {
      "text": "Python 核心",
      "items": [
        {
          "text": "第1章：Python 基础与运行环境",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Python 概述",
              "link": "/backend/05-python/01-python.md"
            },
            {
              "text": "1.2 安装与版本管理",
              "link": "/backend/05-python/06-install-version.md"
            },
            {
              "text": "1.3 解释器与运行方式",
              "link": "/backend/05-python/07-interpreter-runtime.md"
            },
            {
              "text": "1.4 pip 与虚拟环境",
              "link": "/backend/05-python/08-pip-venv.md"
            },
            {
              "text": "1.5 项目结构",
              "link": "/backend/05-python/09-project-structure.md"
            }
          ]
        },
        {
          "text": "第2章：基础语法与数据模型",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 基础语法",
              "link": "/backend/05-python/02-basic-syntax.md"
            },
            {
              "text": "2.2 数据类型",
              "link": "/backend/05-python/10-data-types.md"
            },
            {
              "text": "2.3 流程控制",
              "link": "/backend/05-python/11-control-flow.md"
            },
            {
              "text": "2.4 函数",
              "link": "/backend/05-python/12-function.md"
            },
            {
              "text": "2.5 模块与包",
              "link": "/backend/05-python/13-module-package.md"
            }
          ]
        },
        {
          "text": "第3章：面向对象与类型系统",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 面向对象",
              "link": "/backend/05-python/03-oop.md"
            },
            {
              "text": "3.2 类与实例",
              "link": "/backend/05-python/14-class-instance.md"
            },
            {
              "text": "3.3 继承与多态",
              "link": "/backend/05-python/15-inheritance-polymorphism.md"
            },
            {
              "text": "3.4 dataclass",
              "link": "/backend/05-python/16-dataclass.md"
            },
            {
              "text": "3.5 类型注解",
              "link": "/backend/05-python/17-type-hints.md"
            },
            {
              "text": "3.6 协议与鸭子类型",
              "link": "/backend/05-python/18-protocol-duck-typing.md"
            }
          ]
        },
        {
          "text": "第4章：内置数据结构与标准库",
          "collapsed": true,
          "items": [
            {
              "text": "4.1 list / tuple",
              "link": "/backend/05-python/19-list-tuple.md"
            },
            {
              "text": "4.2 dict / set",
              "link": "/backend/05-python/20-dict-set.md"
            },
            {
              "text": "4.3 字符串处理",
              "link": "/backend/05-python/21-string.md"
            },
            {
              "text": "4.4 pathlib 与文件操作",
              "link": "/backend/05-python/22-pathlib-file.md"
            },
            {
              "text": "4.5 json 与序列化",
              "link": "/backend/05-python/23-json-serialization.md"
            },
            {
              "text": "4.6 collections / itertools",
              "link": "/backend/05-python/24-collections-itertools.md"
            }
          ]
        },
        {
          "text": "第5章：异常、I/O 与并发",
          "collapsed": true,
          "items": [
            {
              "text": "5.1 异常处理",
              "link": "/backend/05-python/25-exception-handling.md"
            },
            {
              "text": "5.2 文件 I/O",
              "link": "/backend/05-python/26-file-io.md"
            },
            {
              "text": "5.3 上下文管理器",
              "link": "/backend/05-python/27-context-manager.md"
            },
            {
              "text": "5.4 多线程",
              "link": "/backend/05-python/28-threading.md"
            },
            {
              "text": "5.5 多进程",
              "link": "/backend/05-python/29-multiprocessing.md"
            },
            {
              "text": "5.6 asyncio",
              "link": "/backend/05-python/30-asyncio.md"
            }
          ]
        },
        {
          "text": "第6章：Web 后端与数据访问",
          "collapsed": true,
          "items": [
            {
              "text": "6.1 Flask",
              "link": "/backend/05-python/05-web-framework.md"
            },
            {
              "text": "6.2 FastAPI",
              "link": "/backend/05-python/31-fastapi.md"
            },
            {
              "text": "6.3 REST API",
              "link": "/backend/05-python/32-rest-api.md"
            },
            {
              "text": "6.4 请求与响应",
              "link": "/backend/05-python/33-request-response.md"
            },
            {
              "text": "6.5 ORM 与数据库访问",
              "link": "/backend/05-python/34-orm-database.md"
            },
            {
              "text": "6.6 身份认证",
              "link": "/backend/05-python/35-authentication.md"
            }
          ]
        },
        {
          "text": "第7章：工程化、测试与部署",
          "collapsed": true,
          "items": [
            {
              "text": "7.1 配置管理",
              "link": "/backend/05-python/36-configuration.md"
            },
            {
              "text": "7.2 日志系统",
              "link": "/backend/05-python/37-logging.md"
            },
            {
              "text": "7.3 单元测试",
              "link": "/backend/05-python/38-testing.md"
            },
            {
              "text": "7.4 包管理与发布",
              "link": "/backend/05-python/39-package-release.md"
            },
            {
              "text": "7.5 性能优化",
              "link": "/backend/05-python/40-performance.md"
            },
            {
              "text": "7.6 Docker 部署",
              "link": "/backend/05-python/41-docker-deployment.md"
            }
          ]
        }
      ]
    }
  ],
  "/backend/06-microservices/": [
    {
      "text": "微服务架构核心",
      "items": [
        {
          "text": "第1章：微服务架构基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 微服务架构概述",
              "link": "/backend/06-microservices/01-foundation/01-overview.md"
            },
            {
              "text": "1.2 单体、模块化单体与微服务",
              "link": "/backend/06-microservices/01-foundation/02-monolith-modular-monolith-and-microservices.md"
            },
            {
              "text": "1.3 分布式系统基本约束",
              "link": "/backend/06-microservices/01-foundation/03-distributed-system-constraints.md"
            },
            {
              "text": "1.4 服务边界与拆分方法",
              "link": "/backend/06-microservices/01-foundation/04-service-boundaries-and-decomposition.md"
            },
            {
              "text": "1.5 数据所有权与服务依赖",
              "link": "/backend/06-microservices/01-foundation/05-data-ownership-and-dependencies.md"
            },
            {
              "text": "1.6 团队边界与独立交付",
              "link": "/backend/06-microservices/01-foundation/06-team-boundaries-and-independent-delivery.md"
            },
            {
              "text": "1.7 微服务适用条件与成本",
              "link": "/backend/06-microservices/01-foundation/07-applicability-and-cost.md"
            },
            {
              "text": "1.8 单体到微服务的演进策略",
              "link": "/backend/06-microservices/01-foundation/08-monolith-to-microservices-evolution.md"
            }
          ]
        },
        {
          "text": "第2章：服务治理",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 服务治理概述",
              "link": "/backend/06-microservices/02-governance/01-service-governance-overview.md"
            },
            {
              "text": "2.2 Eureka 架构与运行机制",
              "link": "/backend/06-microservices/02-governance/02-eureka-architecture.md"
            },
            {
              "text": "2.3 Spring Cloud 服务注册与发现",
              "link": "/backend/06-microservices/02-governance/03-service-registration-and-discovery.md"
            },
            {
              "text": "2.4 健康检查与实例生命周期",
              "link": "/backend/06-microservices/02-governance/04-health-checks-and-instance-lifecycle.md"
            },
            {
              "text": "2.5 客户端负载均衡与服务路由",
              "link": "/backend/06-microservices/02-governance/05-load-balancing-and-service-routing.md"
            },
            {
              "text": "2.6 Apollo 架构与配置模型",
              "link": "/backend/06-microservices/02-governance/06-apollo-architecture-and-config-model.md"
            },
            {
              "text": "2.7 Apollo 与 Spring Boot 集成",
              "link": "/backend/06-microservices/02-governance/07-apollo-spring-boot-integration.md"
            },
            {
              "text": "2.8 服务版本与兼容性治理",
              "link": "/backend/06-microservices/02-governance/08-service-versioning-and-compatibility.md"
            },
            {
              "text": "2.9 灰度发布与流量路由",
              "link": "/backend/06-microservices/02-governance/09-gray-release-and-routing.md"
            },
            {
              "text": "2.10 服务治理测试与检查清单",
              "link": "/backend/06-microservices/02-governance/10-governance-testing-and-checklist.md"
            }
          ]
        },
        {
          "text": "第3章：服务通信与声明式 RPC",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 微服务通信模型",
              "link": "/backend/06-microservices/03-communication/01-service-communication-models.md"
            },
            {
              "text": "3.2 HTTP RPC 与 Feign 架构",
              "link": "/backend/06-microservices/03-communication/02-http-rpc-and-feign-architecture.md"
            },
            {
              "text": "3.3 服务契约与 API 模块",
              "link": "/backend/06-microservices/03-communication/03-service-contracts-and-api-modules.md"
            },
            {
              "text": "3.4 OpenFeign Provider 与 Consumer",
              "link": "/backend/06-microservices/03-communication/04-openfeign-provider-and-consumer.md"
            },
            {
              "text": "3.5 Eureka、LoadBalancer 与 Feign 调用链",
              "link": "/backend/06-microservices/03-communication/05-eureka-loadbalancer-and-feign.md"
            },
            {
              "text": "3.6 序列化与错误契约",
              "link": "/backend/06-microservices/03-communication/06-serialization-and-error-contracts.md"
            },
            {
              "text": "3.7 超时、重试与幂等",
              "link": "/backend/06-microservices/03-communication/07-timeouts-retries-and-idempotency.md"
            },
            {
              "text": "3.8 RPC 测试与基础可观测性",
              "link": "/backend/06-microservices/03-communication/08-rpc-testing-and-observability.md"
            },
            {
              "text": "3.9 Catfish RPC 与 Feign 概念映射",
              "link": "/backend/06-microservices/03-communication/09-catfish-rpc-mapping.md"
            },
            {
              "text": "3.10 声明式客户端演进与通信选型",
              "link": "/backend/06-microservices/03-communication/10-client-evolution-and-protocol-selection.md"
            }
          ]
        },
        {
          "text": "第4章：API 网关",
          "collapsed": true,
          "items": [
            {
              "text": "4.1 API 网关的职责、边界与请求生命周期",
              "link": "/backend/06-microservices/04-api-gateway/01-gateway-responsibilities-and-boundaries.md"
            },
            {
              "text": "4.2 Spring Cloud Gateway 路由、过滤器与服务发现实践",
              "link": "/backend/06-microservices/04-api-gateway/02-spring-cloud-gateway-routing.md"
            },
            {
              "text": "4.3 OAuth 2.0、OIDC 与 JWT 实践",
              "link": "/backend/06-microservices/04-api-gateway/03-oauth2-oidc-and-jwt.md"
            },
            {
              "text": "4.4 分层授权、对象权限与可信身份上下文",
              "link": "/backend/06-microservices/04-api-gateway/04-authorization-and-trusted-context.md"
            },
            {
              "text": "4.5 网关限流、安全响应头与审计实践",
              "link": "/backend/06-microservices/04-api-gateway/05-rate-limit-security-headers-and-audit.md"
            }
          ]
        },
        {
          "text": "第5章：消息队列与异步架构",
          "collapsed": true,
          "items": [
            {
              "text": "5.1 消息队列概述",
              "link": "/backend/06-microservices/05-message-queue/01-overview.md"
            },
            {
              "text": "5.2 RabbitMQ",
              "link": "/backend/06-microservices/05-message-queue/02-rabbitmq.md"
            },
            {
              "text": "5.3 Kafka",
              "link": "/backend/06-microservices/05-message-queue/03-kafka.md"
            },
            {
              "text": "5.4 事件驱动架构",
              "link": "/backend/06-microservices/05-message-queue/04-event-driven.md"
            },
            {
              "text": "5.5 消息可靠性",
              "link": "/backend/06-microservices/05-message-queue/05-message-reliability.md"
            }
          ]
        },
        {
          "text": "第6章：分布式数据一致性",
          "collapsed": true,
          "items": [
            {
              "text": "6.1 分布式事务",
              "link": "/backend/06-microservices/06-consistency/01-distributed-transaction.md"
            },
            {
              "text": "6.2 Saga 模式",
              "link": "/backend/06-microservices/06-consistency/02-saga.md"
            },
            {
              "text": "6.3 TCC 模式",
              "link": "/backend/06-microservices/06-consistency/03-tcc.md"
            },
            {
              "text": "6.4 最终一致性",
              "link": "/backend/06-microservices/06-consistency/04-eventual-consistency.md"
            },
            {
              "text": "6.5 幂等与去重",
              "link": "/backend/06-microservices/06-consistency/05-idempotency-deduplication.md"
            }
          ]
        },
        {
          "text": "第7章：可观测性与稳定性",
          "collapsed": true,
          "items": [
            {
              "text": "7.1 日志体系",
              "link": "/backend/06-microservices/07-observability/01-logging.md"
            },
            {
              "text": "7.2 指标监控",
              "link": "/backend/06-microservices/07-observability/02-metrics.md"
            },
            {
              "text": "7.3 链路追踪",
              "link": "/backend/06-microservices/07-observability/03-tracing.md"
            },
            {
              "text": "7.4 熔断降级",
              "link": "/backend/06-microservices/07-observability/04-circuit-breaker-degrade.md"
            },
            {
              "text": "7.5 故障隔离与容灾",
              "link": "/backend/06-microservices/07-observability/05-fault-isolation.md"
            }
          ]
        },
        {
          "text": "第8章：部署与平台化",
          "collapsed": true,
          "items": [
            {
              "text": "8.1 Docker 化部署",
              "link": "/backend/06-microservices/08-platform/01-docker.md"
            },
            {
              "text": "8.2 Kubernetes 基础",
              "link": "/backend/06-microservices/08-platform/02-kubernetes.md"
            },
            {
              "text": "8.3 服务编排",
              "link": "/backend/06-microservices/08-platform/03-orchestration.md"
            },
            {
              "text": "8.4 CI/CD",
              "link": "/backend/06-microservices/08-platform/04-cicd.md"
            },
            {
              "text": "8.5 微服务平台化",
              "link": "/backend/06-microservices/08-platform/05-platform-engineering.md"
            }
          ]
        },
        {
          "text": "第9章：架构实践与演进",
          "collapsed": true,
          "items": [
            {
              "text": "9.1 业务域建模",
              "link": "/backend/06-microservices/09-evolution/01-domain-modeling.md"
            },
            {
              "text": "9.2 DDD 与微服务",
              "link": "/backend/06-microservices/09-evolution/02-ddd.md"
            },
            {
              "text": "9.3 从单体到微服务",
              "link": "/backend/06-microservices/09-evolution/03-monolith-to-microservices.md"
            },
            {
              "text": "9.4 微服务反模式",
              "link": "/backend/06-microservices/09-evolution/04-anti-patterns.md"
            },
            {
              "text": "9.5 架构决策案例",
              "link": "/backend/06-microservices/09-evolution/05-architecture-decisions.md"
            }
          ]
        }
      ]
    }
  ],
  "/backend/07-springboot/": [
    {
      "text": "Spring Boot 核心",
      "items": [
        {
          "text": "第1章：Spring Boot 基础与项目创建",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Spring Boot 概述",
              "link": "/backend/07-springboot/01-spring-boot.md"
            },
            {
              "text": "1.2 Spring Initializr 与项目创建",
              "link": "/backend/07-springboot/07-initializr-project.md"
            },
            {
              "text": "1.3 项目结构",
              "link": "/backend/07-springboot/08-project-structure.md"
            },
            {
              "text": "1.4 启动类与启动流程",
              "link": "/backend/07-springboot/09-bootstrap-lifecycle.md"
            },
            {
              "text": "1.5 自动配置概览",
              "link": "/backend/07-springboot/10-auto-configuration.md"
            }
          ]
        },
        {
          "text": "第2章：Spring 核心机制",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 IoC 与依赖注入",
              "link": "/backend/07-springboot/02-ioc-di.md"
            },
            {
              "text": "2.2 Bean 生命周期",
              "link": "/backend/07-springboot/11-bean-lifecycle.md"
            },
            {
              "text": "2.3 配置属性绑定",
              "link": "/backend/07-springboot/12-configuration-properties.md"
            },
            {
              "text": "2.4 Profile 多环境配置",
              "link": "/backend/07-springboot/13-profile-environment.md"
            },
            {
              "text": "2.5 AOP 面向切面编程",
              "link": "/backend/07-springboot/14-aop.md"
            }
          ]
        },
        {
          "text": "第3章：Web 开发与 REST API",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 Spring MVC 与 RESTful API",
              "link": "/backend/07-springboot/03-mvc-rest.md"
            },
            {
              "text": "3.2 Controller 与请求映射",
              "link": "/backend/07-springboot/15-controller-request-mapping.md"
            },
            {
              "text": "3.3 参数接收与校验",
              "link": "/backend/07-springboot/16-request-params-validation.md"
            },
            {
              "text": "3.4 统一响应结构",
              "link": "/backend/07-springboot/17-response-design.md"
            },
            {
              "text": "3.5 全局异常处理",
              "link": "/backend/07-springboot/18-global-exception.md"
            },
            {
              "text": "3.6 文件上传与下载",
              "link": "/backend/07-springboot/19-file-upload-download.md"
            }
          ]
        },
        {
          "text": "第4章：数据访问与事务",
          "collapsed": true,
          "items": [
            {
              "text": "4.1 数据访问层",
              "link": "/backend/07-springboot/04-jpa-mybatis.md"
            },
            {
              "text": "4.2 Spring JDBC",
              "link": "/backend/07-springboot/20-spring-jdbc.md"
            },
            {
              "text": "4.3 MyBatis 集成",
              "link": "/backend/07-springboot/21-mybatis-integration.md"
            },
            {
              "text": "4.4 JPA 集成",
              "link": "/backend/07-springboot/22-jpa-integration.md"
            },
            {
              "text": "4.5 事务管理",
              "link": "/backend/07-springboot/23-transaction-management.md"
            },
            {
              "text": "4.6 数据库连接池",
              "link": "/backend/07-springboot/24-datasource-pool.md"
            }
          ]
        },
        {
          "text": "第5章：认证、授权与接口安全",
          "collapsed": true,
          "items": [
            {
              "text": "5.1 Spring Security 与 JWT",
              "link": "/backend/07-springboot/05-security-jwt.md"
            },
            {
              "text": "5.2 登录认证流程",
              "link": "/backend/07-springboot/25-authentication-flow.md"
            },
            {
              "text": "5.3 RBAC 权限模型",
              "link": "/backend/07-springboot/26-rbac.md"
            },
            {
              "text": "5.4 接口鉴权",
              "link": "/backend/07-springboot/27-api-authorization.md"
            },
            {
              "text": "5.5 CORS 与 CSRF",
              "link": "/backend/07-springboot/28-cors-csrf.md"
            },
            {
              "text": "5.6 安全实践",
              "link": "/backend/07-springboot/29-security-practices.md"
            }
          ]
        },
        {
          "text": "第6章：缓存、任务与消息集成",
          "collapsed": true,
          "items": [
            {
              "text": "6.1 缓存抽象",
              "link": "/backend/07-springboot/30-cache-abstraction.md"
            },
            {
              "text": "6.2 Redis 集成",
              "link": "/backend/07-springboot/31-redis-integration.md"
            },
            {
              "text": "6.3 定时任务",
              "link": "/backend/07-springboot/32-scheduled-task.md"
            },
            {
              "text": "6.4 异步任务",
              "link": "/backend/07-springboot/33-async-task.md"
            },
            {
              "text": "6.5 消息队列集成",
              "link": "/backend/07-springboot/34-message-queue.md"
            },
            {
              "text": "6.6 事件发布与监听",
              "link": "/backend/07-springboot/35-application-event.md"
            }
          ]
        },
        {
          "text": "第7章：工程化、测试与可观测性",
          "collapsed": true,
          "items": [
            {
              "text": "7.1 配置与部署",
              "link": "/backend/07-springboot/06-config-deploy.md"
            },
            {
              "text": "7.2 日志系统",
              "link": "/backend/07-springboot/36-logging.md"
            },
            {
              "text": "7.3 Actuator 监控",
              "link": "/backend/07-springboot/37-actuator.md"
            },
            {
              "text": "7.4 单元测试",
              "link": "/backend/07-springboot/38-unit-testing.md"
            },
            {
              "text": "7.5 集成测试",
              "link": "/backend/07-springboot/39-integration-testing.md"
            },
            {
              "text": "7.6 API 文档",
              "link": "/backend/07-springboot/40-api-docs.md"
            }
          ]
        },
        {
          "text": "第8章：性能优化与生产部署",
          "collapsed": true,
          "items": [
            {
              "text": "8.1 启动性能优化",
              "link": "/backend/07-springboot/41-startup-performance.md"
            },
            {
              "text": "8.2 接口性能优化",
              "link": "/backend/07-springboot/42-api-performance.md"
            },
            {
              "text": "8.3 JVM 参数与运行配置",
              "link": "/backend/07-springboot/43-jvm-runtime-config.md"
            },
            {
              "text": "8.4 Docker 部署",
              "link": "/backend/07-springboot/44-docker-deployment.md"
            },
            {
              "text": "8.5 生产问题排查",
              "link": "/backend/07-springboot/45-production-troubleshooting.md"
            },
            {
              "text": "8.6 最佳实践",
              "link": "/backend/07-springboot/46-best-practices.md"
            }
          ]
        }
      ]
    }
  ],
  "/backend/08-django/": [
    {
      "text": "Django 核心",
      "items": [
        {
          "text": "第1章：Django 基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Django 概述",
              "link": "/backend/08-django/01-django.md"
            },
            {
              "text": "1.2 模型与数据库",
              "link": "/backend/08-django/02-models.md"
            },
            {
              "text": "1.3 视图与路由",
              "link": "/backend/08-django/03-views-urls.md"
            }
          ]
        },
        {
          "text": "第2章：进阶与部署",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 Django REST Framework",
              "link": "/backend/08-django/04-drf.md"
            },
            {
              "text": "2.2 项目部署",
              "link": "/backend/08-django/05-deployment.md"
            }
          ]
        }
      ]
    }
  ],
  "/backend/09-mysql/": [
    {
      "text": "MySQL 核心",
      "items": [
        {
          "text": "第1章：MySQL 基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 MySQL 概述",
              "link": "/backend/09-mysql/01-mysql.md"
            },
            {
              "text": "1.2 DDL 与 DML",
              "link": "/backend/09-mysql/02-ddl-dml.md"
            },
            {
              "text": "1.3 索引原理与优化",
              "link": "/backend/09-mysql/03-indexes.md"
            }
          ]
        },
        {
          "text": "第2章：进阶调优",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 事务与锁机制",
              "link": "/backend/09-mysql/04-transactions.md"
            },
            {
              "text": "2.2 性能调优",
              "link": "/backend/09-mysql/05-optimization.md"
            }
          ]
        }
      ]
    }
  ],
  "/backend/10-redis/": [
    {
      "text": "Redis 核心",
      "items": [
        {
          "text": "第1章：Redis 基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Redis 概述",
              "link": "/backend/10-redis/01-redis.md"
            },
            {
              "text": "1.2 数据结构与命令",
              "link": "/backend/10-redis/02-data-structures.md"
            }
          ]
        },
        {
          "text": "第2章：Redis 进阶",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 持久化与高可用",
              "link": "/backend/10-redis/03-persistence.md"
            },
            {
              "text": "2.2 进阶应用场景",
              "link": "/backend/10-redis/04-advanced-use.md"
            }
          ]
        }
      ]
    }
  ],
  "/backend/11-postgresql/": [
    {
      "text": "PostgreSQL 核心",
      "items": [
        {
          "text": "第1章：PostgreSQL 基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 PostgreSQL 概述",
              "link": "/backend/11-postgresql/01-postgresql.md"
            },
            {
              "text": "1.2 进阶 SQL 特性",
              "link": "/backend/11-postgresql/02-advanced-sql.md"
            }
          ]
        },
        {
          "text": "第2章：特性与调优",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 JSON 与数组支持",
              "link": "/backend/11-postgresql/03-json-array.md"
            },
            {
              "text": "2.2 性能调优",
              "link": "/backend/11-postgresql/04-optimization.md"
            }
          ]
        }
      ]
    }
  ]
};
