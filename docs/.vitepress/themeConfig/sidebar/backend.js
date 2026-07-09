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
          "text": "第1章：NestJS 核心",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 NestJS 概述",
              "link": "/backend/03-nestjs/01-nestjs.md"
            },
            {
              "text": "1.2 模块系统",
              "link": "/backend/03-nestjs/02-modules.md"
            },
            {
              "text": "1.3 控制器",
              "link": "/backend/03-nestjs/03-controllers.md"
            },
            {
              "text": "1.4 提供者与依赖注入",
              "link": "/backend/03-nestjs/04-providers.md"
            }
          ]
        },
        {
          "text": "第2章：请求管道",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 中间件",
              "link": "/backend/03-nestjs/05-middleware.md"
            },
            {
              "text": "2.2 异常过滤器",
              "link": "/backend/03-nestjs/06-exception-filters.md"
            },
            {
              "text": "2.3 Pipes 管道",
              "link": "/backend/03-nestjs/07-pipes.md"
            },
            {
              "text": "2.4 Guards 守卫",
              "link": "/backend/03-nestjs/08-guards.md"
            },
            {
              "text": "2.5 拦截器",
              "link": "/backend/03-nestjs/09-interceptors.md"
            }
          ]
        },
        {
          "text": "第3章：数据与生态",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 数据库集成",
              "link": "/backend/03-nestjs/10-database.md"
            },
            {
              "text": "3.2 身份认证",
              "link": "/backend/03-nestjs/11-authentication.md"
            },
            {
              "text": "3.3 API 文档（Swagger）",
              "link": "/backend/03-nestjs/12-api-docs.md"
            },
            {
              "text": "3.4 微服务",
              "link": "/backend/03-nestjs/13-microservices.md"
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
          "text": "第1章：Java 基础与语言模型",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Java 概述",
              "link": "/backend/04-java/01-java.md"
            },
            {
              "text": "1.2 JDK / JRE / JVM",
              "link": "/backend/04-java/07-jdk-jre-jvm.md"
            },
            {
              "text": "1.3 基础语法",
              "link": "/backend/04-java/08-basic-syntax.md"
            },
            {
              "text": "1.4 数据类型",
              "link": "/backend/04-java/09-data-types.md"
            },
            {
              "text": "1.5 流程控制",
              "link": "/backend/04-java/10-control-flow.md"
            },
            {
              "text": "1.6 编码规范",
              "link": "/backend/04-java/11-coding-style.md"
            }
          ]
        },
        {
          "text": "第2章：面向对象编程",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 类与对象",
              "link": "/backend/04-java/02-oop.md"
            },
            {
              "text": "2.2 封装、继承与多态",
              "link": "/backend/04-java/12-encapsulation-inheritance-polymorphism.md"
            },
            {
              "text": "2.3 抽象类与接口",
              "link": "/backend/04-java/13-abstract-interface.md"
            },
            {
              "text": "2.4 内部类",
              "link": "/backend/04-java/14-inner-class.md"
            },
            {
              "text": "2.5 枚举与注解",
              "link": "/backend/04-java/15-enum-annotation.md"
            }
          ]
        },
        {
          "text": "第3章：集合、泛型与常用类库",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 集合框架",
              "link": "/backend/04-java/03-collections.md"
            },
            {
              "text": "3.2 List / Set / Map",
              "link": "/backend/04-java/16-list-set-map.md"
            },
            {
              "text": "3.3 泛型机制",
              "link": "/backend/04-java/17-generics.md"
            },
            {
              "text": "3.4 Optional",
              "link": "/backend/04-java/18-optional.md"
            },
            {
              "text": "3.5 日期时间 API",
              "link": "/backend/04-java/19-date-time-api.md"
            },
            {
              "text": "3.6 常用工具类",
              "link": "/backend/04-java/20-common-utils.md"
            }
          ]
        },
        {
          "text": "第4章：异常、I/O 与序列化",
          "collapsed": true,
          "items": [
            {
              "text": "4.1 异常体系",
              "link": "/backend/04-java/21-exception-system.md"
            },
            {
              "text": "4.2 文件 I/O",
              "link": "/backend/04-java/04-io-streams.md"
            },
            {
              "text": "4.3 NIO",
              "link": "/backend/04-java/22-nio.md"
            },
            {
              "text": "4.4 序列化",
              "link": "/backend/04-java/23-serialization.md"
            },
            {
              "text": "4.5 网络编程基础",
              "link": "/backend/04-java/24-network-programming.md"
            }
          ]
        },
        {
          "text": "第5章：并发编程",
          "collapsed": true,
          "items": [
            {
              "text": "5.1 线程基础",
              "link": "/backend/04-java/05-concurrency.md"
            },
            {
              "text": "5.2 线程池",
              "link": "/backend/04-java/25-thread-pool.md"
            },
            {
              "text": "5.3 synchronized 与 Lock",
              "link": "/backend/04-java/26-synchronized-lock.md"
            },
            {
              "text": "5.4 并发集合",
              "link": "/backend/04-java/27-concurrent-collections.md"
            },
            {
              "text": "5.5 CompletableFuture",
              "link": "/backend/04-java/28-completablefuture.md"
            },
            {
              "text": "5.6 虚拟线程",
              "link": "/backend/04-java/29-virtual-thread.md"
            }
          ]
        },
        {
          "text": "第6章：JVM 与性能调优",
          "collapsed": true,
          "items": [
            {
              "text": "6.1 JVM 内存模型",
              "link": "/backend/04-java/30-jvm-memory.md"
            },
            {
              "text": "6.2 类加载机制",
              "link": "/backend/04-java/31-class-loading.md"
            },
            {
              "text": "6.3 垃圾回收",
              "link": "/backend/04-java/32-garbage-collection.md"
            },
            {
              "text": "6.4 JVM 参数",
              "link": "/backend/04-java/33-jvm-options.md"
            },
            {
              "text": "6.5 性能分析",
              "link": "/backend/04-java/34-performance-analysis.md"
            },
            {
              "text": "6.6 OOM 与线上排查",
              "link": "/backend/04-java/35-oom-troubleshooting.md"
            }
          ]
        },
        {
          "text": "第7章：数据库与企业开发",
          "collapsed": true,
          "items": [
            {
              "text": "7.1 JDBC",
              "link": "/backend/04-java/06-jdbc-mybatis.md"
            },
            {
              "text": "7.2 MyBatis",
              "link": "/backend/04-java/36-mybatis.md"
            },
            {
              "text": "7.3 事务基础",
              "link": "/backend/04-java/37-transaction.md"
            },
            {
              "text": "7.4 Maven / Gradle",
              "link": "/backend/04-java/38-maven-gradle.md"
            },
            {
              "text": "7.5 日志框架",
              "link": "/backend/04-java/39-logging.md"
            },
            {
              "text": "7.6 单元测试",
              "link": "/backend/04-java/40-testing.md"
            }
          ]
        },
        {
          "text": "第8章：现代 Java 与工程实践",
          "collapsed": true,
          "items": [
            {
              "text": "8.1 Lambda",
              "link": "/backend/04-java/41-lambda.md"
            },
            {
              "text": "8.2 Stream API",
              "link": "/backend/04-java/42-stream-api.md"
            },
            {
              "text": "8.3 Record",
              "link": "/backend/04-java/43-record.md"
            },
            {
              "text": "8.4 sealed class",
              "link": "/backend/04-java/44-sealed-class.md"
            },
            {
              "text": "8.5 Java 版本演进",
              "link": "/backend/04-java/45-version-evolution.md"
            },
            {
              "text": "8.6 项目结构与分层实践",
              "link": "/backend/04-java/46-project-structure.md"
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
          "text": "第1章：Python 基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Python 概述",
              "link": "/backend/05-python/01-python.md"
            },
            {
              "text": "1.2 基础语法",
              "link": "/backend/05-python/02-basic-syntax.md"
            },
            {
              "text": "1.3 面向对象",
              "link": "/backend/05-python/03-oop.md"
            }
          ]
        },
        {
          "text": "第2章：Python 进阶",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 进阶特性",
              "link": "/backend/05-python/04-advanced.md"
            },
            {
              "text": "2.2 Flask 与 FastAPI",
              "link": "/backend/05-python/05-web-framework.md"
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
              "text": "1.2 单体架构与微服务",
              "link": "/backend/06-microservices/01-foundation/02-monolith-vs-microservices.md"
            },
            {
              "text": "1.3 服务拆分原则",
              "link": "/backend/06-microservices/01-foundation/03-service-decomposition.md"
            },
            {
              "text": "1.4 微服务适用边界",
              "link": "/backend/06-microservices/01-foundation/04-boundary.md"
            },
            {
              "text": "1.5 企业落地路径",
              "link": "/backend/06-microservices/01-foundation/05-enterprise-adoption.md"
            }
          ]
        },
        {
          "text": "第2章：服务治理",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 服务注册与发现",
              "link": "/backend/06-microservices/02-governance/01-service-discovery.md"
            },
            {
              "text": "2.2 配置中心",
              "link": "/backend/06-microservices/02-governance/02-config-center.md"
            },
            {
              "text": "2.3 服务健康检查",
              "link": "/backend/06-microservices/02-governance/03-health-check.md"
            },
            {
              "text": "2.4 灰度发布",
              "link": "/backend/06-microservices/02-governance/04-gray-release.md"
            },
            {
              "text": "2.5 服务版本管理",
              "link": "/backend/06-microservices/02-governance/05-version-management.md"
            }
          ]
        },
        {
          "text": "第3章：服务通信",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 REST 通信",
              "link": "/backend/06-microservices/03-communication/01-rest.md"
            },
            {
              "text": "3.2 RPC 通信",
              "link": "/backend/06-microservices/03-communication/02-rpc.md"
            },
            {
              "text": "3.3 gRPC",
              "link": "/backend/06-microservices/03-communication/03-grpc.md"
            },
            {
              "text": "3.4 OpenFeign",
              "link": "/backend/06-microservices/03-communication/04-openfeign.md"
            },
            {
              "text": "3.5 通信协议选型",
              "link": "/backend/06-microservices/03-communication/05-protocol-selection.md"
            }
          ]
        },
        {
          "text": "第4章：API 网关",
          "collapsed": true,
          "items": [
            {
              "text": "4.1 API 网关概述",
              "link": "/backend/06-microservices/04-api-gateway/01-overview.md"
            },
            {
              "text": "4.2 路由转发",
              "link": "/backend/06-microservices/04-api-gateway/02-routing.md"
            },
            {
              "text": "4.3 认证鉴权",
              "link": "/backend/06-microservices/04-api-gateway/03-auth.md"
            },
            {
              "text": "4.4 限流熔断",
              "link": "/backend/06-microservices/04-api-gateway/04-rate-limit-circuit-breaker.md"
            },
            {
              "text": "4.5 网关日志与审计",
              "link": "/backend/06-microservices/04-api-gateway/05-logging-audit.md"
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
          "text": "第1章：Spring Boot 基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Spring Boot 概述",
              "link": "/backend/07-springboot/01-spring-boot.md"
            },
            {
              "text": "1.2 IoC 与依赖注入",
              "link": "/backend/07-springboot/02-ioc-di.md"
            },
            {
              "text": "1.3 Spring MVC 与 RESTful API",
              "link": "/backend/07-springboot/03-mvc-rest.md"
            }
          ]
        },
        {
          "text": "第2章：数据与安全",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 数据访问层",
              "link": "/backend/07-springboot/04-jpa-mybatis.md"
            },
            {
              "text": "2.2 Security 与 JWT",
              "link": "/backend/07-springboot/05-security-jwt.md"
            },
            {
              "text": "2.3 配置与部署",
              "link": "/backend/07-springboot/06-config-deploy.md"
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
