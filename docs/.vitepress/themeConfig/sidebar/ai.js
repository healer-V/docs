export const aiSidebar = {
  "/ai/01-engineering/": [
    {
      "text": "AI 工程体系",
      "items": [
        {
          "text": "第1章：企业 AI 应用全景",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 AI 工程体系概述",
              "link": "/ai/01-engineering/01-scheme/01-overview.md"
            },
            {
              "text": "1.2 企业 AI 应用类型",
              "link": "/ai/01-engineering/01-scheme/02-application.md"
            },
            {
              "text": "1.3 AI 应用架构分层",
              "link": "/ai/01-engineering/01-scheme/03-layers.md"
            },
            {
              "text": "1.4 LLM 应用生命周期",
              "link": "/ai/01-engineering/01-scheme/04-lifecycle.md"
            }
          ]
        },
        {
          "text": "第2章：大模型基础能力",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 Token 与上下文窗口",
              "link": "/ai/01-engineering/02-basics/01-context.md"
            },
            {
              "text": "2.2 Embedding 与语义表示",
              "link": "/ai/01-engineering/02-basics/02-embedding.md"
            },
            {
              "text": "2.3 Transformer 与推理机制",
              "link": "/ai/01-engineering/02-basics/03-transformer.md"
            },
            {
              "text": "2.4 多模态模型能力",
              "link": "/ai/01-engineering/02-basics/04-multimodal.md"
            }
          ]
        },
        {
          "text": "第3章：工程落地基线",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 开发环境与项目结构",
              "link": "/ai/01-engineering/03-landing/01-environment.md"
            },
            {
              "text": "3.2 SDK 封装与密钥管理",
              "link": "/ai/01-engineering/03-landing/02-secret.md"
            },
            {
              "text": "3.3 异常处理与重试策略",
              "link": "/ai/01-engineering/03-landing/03-strategy.md"
            },
            {
              "text": "3.4 限流、超时与熔断",
              "link": "/ai/01-engineering/03-landing/04-circuit-breaker.md"
            }
          ]
        }
      ]
    }
  ],
  "/ai/02-model-gateway/": [
    {
      "text": "模型网关",
      "items": [
        {
          "text": "第1章：模型接入基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 模型网关概述",
              "link": "/ai/02-model-gateway/01-gateway/01-overview.md"
            },
            {
              "text": "1.2 OpenAI 兼容接口",
              "link": "/ai/02-model-gateway/01-gateway/02-openai.md"
            },
            {
              "text": "1.3 Claude 与多供应商接入",
              "link": "/ai/02-model-gateway/01-gateway/03-multi-provider.md"
            },
            {
              "text": "1.4 本地模型接入",
              "link": "/ai/02-model-gateway/01-gateway/04-local-model.md"
            },
            {
              "text": "1.5 模型选型策略",
              "link": "/ai/02-model-gateway/01-gateway/05-model-selection.md"
            }
          ]
        },
        {
          "text": "第2章：推理能力封装",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 Chat API 与 Responses API",
              "link": "/ai/02-model-gateway/02-reasoning/01-responses-api.md"
            },
            {
              "text": "2.2 流式输出",
              "link": "/ai/02-model-gateway/02-reasoning/02-streaming.md"
            },
            {
              "text": "2.3 Function Calling 与 Tool Calling",
              "link": "/ai/02-model-gateway/02-reasoning/03-function-calling.md"
            },
            {
              "text": "2.4 结构化输出",
              "link": "/ai/02-model-gateway/02-reasoning/04-structured-output.md"
            }
          ]
        },
        {
          "text": "第3章：企业模型网关",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 多模型路由",
              "link": "/ai/02-model-gateway/03-enterprise-gateway/01-multi-routing.md"
            },
            {
              "text": "3.2 限流与配额",
              "link": "/ai/02-model-gateway/03-enterprise-gateway/10-limit-quota.md"
            },
            {
              "text": "3.3 降级与容灾",
              "link": "/ai/02-model-gateway/03-enterprise-gateway/11-disaster-recovery.md"
            },
            {
              "text": "3.4 请求审计与日志",
              "link": "/ai/02-model-gateway/03-enterprise-gateway/12-request-audit.md"
            },
            {
              "text": "3.5 缓存与复用",
              "link": "/ai/02-model-gateway/03-enterprise-gateway/13-cache-reuse.md"
            }
          ]
        }
      ]
    }
  ],
  "/ai/03-knowledge-platform/": [
    {
      "text": "知识平台",
      "items": [
        {
          "text": "第1章：知识平台基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 知识平台概述",
              "link": "/ai/03-knowledge-platform/01-platform/01-overview.md"
            },
            {
              "text": "1.2 企业知识来源",
              "link": "/ai/03-knowledge-platform/01-platform/02-sources.md"
            },
            {
              "text": "1.3 文档解析与清洗",
              "link": "/ai/03-knowledge-platform/01-platform/03-document-parsing.md"
            },
            {
              "text": "1.4 元数据设计",
              "link": "/ai/03-knowledge-platform/01-platform/04-metadata.md"
            }
          ]
        },
        {
          "text": "第2章：知识索引构建",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 文档切分策略",
              "link": "/ai/03-knowledge-platform/02-indexing/01-chunking.md"
            },
            {
              "text": "2.2 Embedding 模型选择",
              "link": "/ai/03-knowledge-platform/02-indexing/02-embedding.md"
            },
            {
              "text": "2.3 向量库选型",
              "link": "/ai/03-knowledge-platform/02-indexing/03-vector-database.md"
            },
            {
              "text": "2.4 索引构建与更新",
              "link": "/ai/03-knowledge-platform/02-indexing/04-index-update.md"
            }
          ]
        },
        {
          "text": "第3章：企业知识治理",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 权限隔离",
              "link": "/ai/03-knowledge-platform/03-governance/01-permission.md"
            },
            {
              "text": "3.2 知识版本与过期策略",
              "link": "/ai/03-knowledge-platform/03-governance/02-version-expiration.md"
            },
            {
              "text": "3.3 多知识库管理",
              "link": "/ai/03-knowledge-platform/03-governance/03-multi-knowledge-base.md"
            },
            {
              "text": "3.4 数据质量评估",
              "link": "/ai/03-knowledge-platform/03-governance/04-quality-evaluation.md"
            }
          ]
        }
      ]
    }
  ],
  "/ai/04-context-engineering/": [
    {
      "text": "上下文工程",
      "items": [
        {
          "text": "第1章：Prompt 工程基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 上下文工程概述",
              "link": "/ai/04-context-engineering/01-prompt/01-overview.md"
            },
            {
              "text": "1.2 Prompt 结构",
              "link": "/ai/04-context-engineering/01-prompt/02-structure.md"
            },
            {
              "text": "1.3 示例与反例",
              "link": "/ai/04-context-engineering/01-prompt/03-examples.md"
            },
            {
              "text": "1.4 输出格式约束",
              "link": "/ai/04-context-engineering/01-prompt/04-output-format.md"
            }
          ]
        },
        {
          "text": "第2章：上下文组织",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 Message 结构",
              "link": "/ai/04-context-engineering/02-context/01-message.md"
            },
            {
              "text": "2.2 上下文拼装策略",
              "link": "/ai/04-context-engineering/02-context/02-assembly.md"
            },
            {
              "text": "2.3 历史压缩",
              "link": "/ai/04-context-engineering/02-context/03-compression.md"
            },
            {
              "text": "2.4 短期记忆与长期记忆",
              "link": "/ai/04-context-engineering/02-context/04-memory.md"
            }
          ]
        },
        {
          "text": "第3章：可维护 Prompt",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 Prompt 模板",
              "link": "/ai/04-context-engineering/03-maintainable-prompt/01-template.md"
            },
            {
              "text": "3.2 版本管理",
              "link": "/ai/04-context-engineering/03-maintainable-prompt/02-version.md"
            },
            {
              "text": "3.3 变量注入与上下文污染防护",
              "link": "/ai/04-context-engineering/03-maintainable-prompt/03-context-safety.md"
            },
            {
              "text": "3.4 结构化输出与解析",
              "link": "/ai/04-context-engineering/03-maintainable-prompt/04-structured-output.md"
            },
            {
              "text": "3.5 Guardrails 基础",
              "link": "/ai/04-context-engineering/03-maintainable-prompt/05-guardrails.md"
            }
          ]
        }
      ]
    }
  ],
  "/ai/05-rag-engineering/": [
    {
      "text": "RAG 应用工程",
      "items": [
        {
          "text": "第1章：RAG 基础架构",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 RAG 应用工程概述",
              "link": "/ai/05-rag-engineering/01-basics/01-overview.md"
            },
            {
              "text": "1.2 RAG 工作流",
              "link": "/ai/05-rag-engineering/01-basics/02-workflow.md"
            },
            {
              "text": "1.3 检索增强的边界",
              "link": "/ai/05-rag-engineering/01-basics/03-boundary.md"
            },
            {
              "text": "1.4 典型业务场景",
              "link": "/ai/05-rag-engineering/01-basics/04-scenarios.md"
            }
          ]
        },
        {
          "text": "第2章：检索与召回",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 向量检索",
              "link": "/ai/05-rag-engineering/02-retrieval/01-vector-search.md"
            },
            {
              "text": "2.2 关键词检索",
              "link": "/ai/05-rag-engineering/02-retrieval/02-keyword-search.md"
            },
            {
              "text": "2.3 混合检索",
              "link": "/ai/05-rag-engineering/02-retrieval/03-hybrid-search.md"
            },
            {
              "text": "2.4 Query 改写与扩展",
              "link": "/ai/05-rag-engineering/02-retrieval/04-query-rewrite.md"
            }
          ]
        },
        {
          "text": "第3章：重排与答案生成",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 Rerank 重排",
              "link": "/ai/05-rag-engineering/03-generation/01-rerank.md"
            },
            {
              "text": "3.2 上下文压缩",
              "link": "/ai/05-rag-engineering/03-generation/02-context-compression.md"
            },
            {
              "text": "3.3 答案合成",
              "link": "/ai/05-rag-engineering/03-generation/03-answer-synthesis.md"
            },
            {
              "text": "3.4 引用溯源",
              "link": "/ai/05-rag-engineering/03-generation/04-citation.md"
            },
            {
              "text": "3.5 幻觉控制",
              "link": "/ai/05-rag-engineering/03-generation/05-hallucination.md"
            }
          ]
        },
        {
          "text": "第4章：LangChain RAG 实战",
          "collapsed": true,
          "items": [
            {
              "text": "4.1 LangChain 基础",
              "link": "/ai/05-rag-engineering/04-langchain/01-basics.md"
            },
            {
              "text": "4.2 Document Loader",
              "link": "/ai/05-rag-engineering/04-langchain/02-document-loader.md"
            },
            {
              "text": "4.3 Text Splitter",
              "link": "/ai/05-rag-engineering/04-langchain/03-text-splitter.md"
            },
            {
              "text": "4.4 Retriever",
              "link": "/ai/05-rag-engineering/04-langchain/04-retriever.md"
            },
            {
              "text": "4.5 Chain 与 LCEL",
              "link": "/ai/05-rag-engineering/04-langchain/05-lcel.md"
            },
            {
              "text": "4.6 RAG 项目封装",
              "link": "/ai/05-rag-engineering/04-langchain/06-rag-project.md"
            }
          ]
        },
        {
          "text": "第5章：高级 RAG",
          "collapsed": true,
          "items": [
            {
              "text": "5.1 GraphRAG",
              "link": "/ai/05-rag-engineering/05-advanced/01-graph-rag.md"
            },
            {
              "text": "5.2 多模态 RAG",
              "link": "/ai/05-rag-engineering/05-advanced/02-multimodal-rag.md"
            },
            {
              "text": "5.3 Agentic RAG",
              "link": "/ai/05-rag-engineering/05-advanced/03-agentic-rag.md"
            },
            {
              "text": "5.4 检索缓存与性能优化",
              "link": "/ai/05-rag-engineering/05-advanced/04-cache-performance.md"
            }
          ]
        }
      ]
    }
  ],
  "/ai/06-agent-workflow/": [
    {
      "text": "Agent 工作流",
      "items": [
        {
          "text": "第1章：Agent 基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Agent 工作流概述",
              "link": "/ai/06-agent-workflow/01-agent/01-overview.md"
            },
            {
              "text": "1.2 Agent 循环",
              "link": "/ai/06-agent-workflow/01-agent/02-loop.md"
            },
            {
              "text": "1.3 规划与执行",
              "link": "/ai/06-agent-workflow/01-agent/03-planning.md"
            },
            {
              "text": "1.4 工具调用边界",
              "link": "/ai/06-agent-workflow/01-agent/04-tool-boundary.md"
            }
          ]
        },
        {
          "text": "第2章：工具与 MCP",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 Tool Schema 设计",
              "link": "/ai/06-agent-workflow/02-tools-mcp/01-tool-schema.md"
            },
            {
              "text": "2.2 工具权限控制",
              "link": "/ai/06-agent-workflow/02-tools-mcp/02-permission.md"
            },
            {
              "text": "2.3 MCP Server 开发",
              "link": "/ai/06-agent-workflow/02-tools-mcp/03-mcp-server.md"
            },
            {
              "text": "2.4 MCP Client 集成",
              "link": "/ai/06-agent-workflow/02-tools-mcp/04-mcp-client.md"
            },
            {
              "text": "2.5 沙箱执行",
              "link": "/ai/06-agent-workflow/02-tools-mcp/05-sandbox.md"
            }
          ]
        },
        {
          "text": "第3章：LangGraph 工作流编排",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 LangGraph 基础",
              "link": "/ai/06-agent-workflow/03-langgraph/01-basics.md"
            },
            {
              "text": "3.2 StateGraph 状态建模",
              "link": "/ai/06-agent-workflow/03-langgraph/02-stategraph.md"
            },
            {
              "text": "3.3 节点、边与条件路由",
              "link": "/ai/06-agent-workflow/03-langgraph/03-routing.md"
            },
            {
              "text": "3.4 Checkpoint 与状态恢复",
              "link": "/ai/06-agent-workflow/03-langgraph/04-checkpoint.md"
            },
            {
              "text": "3.5 Human-in-the-loop",
              "link": "/ai/06-agent-workflow/03-langgraph/05-human-in-loop.md"
            }
          ]
        },
        {
          "text": "第4章：多 Agent 协作",
          "collapsed": true,
          "items": [
            {
              "text": "4.1 Supervisor 模式",
              "link": "/ai/06-agent-workflow/04-multi-agent/01-supervisor.md"
            },
            {
              "text": "4.2 Planner-Executor 模式",
              "link": "/ai/06-agent-workflow/04-multi-agent/02-planner-executor.md"
            },
            {
              "text": "4.3 多 Agent 任务分派",
              "link": "/ai/06-agent-workflow/04-multi-agent/03-dispatch.md"
            },
            {
              "text": "4.4 失败恢复与协作治理",
              "link": "/ai/06-agent-workflow/04-multi-agent/04-governance.md"
            }
          ]
        },
        {
          "text": "第5章：生产级工作流",
          "collapsed": true,
          "items": [
            {
              "text": "5.1 长任务执行",
              "link": "/ai/06-agent-workflow/05-production/01-long-task.md"
            },
            {
              "text": "5.2 重试与幂等",
              "link": "/ai/06-agent-workflow/05-production/02-idempotency.md"
            },
            {
              "text": "5.3 人工审批",
              "link": "/ai/06-agent-workflow/05-production/03-human-approval.md"
            },
            {
              "text": "5.4 状态追踪与审计",
              "link": "/ai/06-agent-workflow/05-production/04-state-audit.md"
            }
          ]
        }
      ]
    }
  ],
  "/ai/07-application-architecture/": [
    {
      "text": "AI 应用架构",
      "items": [
        {
          "text": "第1章：AI 应用形态",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 AI 应用架构概述",
              "link": "/ai/07-application-architecture/01-application/01-overview.md"
            },
            {
              "text": "1.2 Chatbot",
              "link": "/ai/07-application-architecture/01-application/02-chatbot.md"
            },
            {
              "text": "1.3 Copilot",
              "link": "/ai/07-application-architecture/01-application/03-copilot.md"
            },
            {
              "text": "1.4 智能搜索",
              "link": "/ai/07-application-architecture/01-application/04-search.md"
            },
            {
              "text": "1.5 文档自动化",
              "link": "/ai/07-application-architecture/01-application/05-document-automation.md"
            }
          ]
        },
        {
          "text": "第2章：前端交互架构",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 流式渲染",
              "link": "/ai/07-application-architecture/02-frontend/01-streaming-ui.md"
            },
            {
              "text": "2.2 会话状态",
              "link": "/ai/07-application-architecture/02-frontend/02-session-state.md"
            },
            {
              "text": "2.3 文件上传与解析反馈",
              "link": "/ai/07-application-architecture/02-frontend/03-file-upload.md"
            },
            {
              "text": "2.4 中断、重试与重新生成",
              "link": "/ai/07-application-architecture/02-frontend/04-retry-regenerate.md"
            }
          ]
        },
        {
          "text": "第3章：后端服务架构",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 会话管理",
              "link": "/ai/07-application-architecture/03-backend/01-session.md"
            },
            {
              "text": "3.2 任务队列",
              "link": "/ai/07-application-architecture/03-backend/02-task-queue.md"
            },
            {
              "text": "3.3 文件存储",
              "link": "/ai/07-application-architecture/03-backend/03-file-storage.md"
            },
            {
              "text": "3.4 权限认证",
              "link": "/ai/07-application-architecture/03-backend/04-auth.md"
            },
            {
              "text": "3.5 API 设计",
              "link": "/ai/07-application-architecture/03-backend/05-api-design.md"
            }
          ]
        },
        {
          "text": "第4章：企业系统集成",
          "collapsed": true,
          "items": [
            {
              "text": "4.1 OA 与 IM 集成",
              "link": "/ai/07-application-architecture/04-integration/01-oa-im.md"
            },
            {
              "text": "4.2 CRM 与业务系统集成",
              "link": "/ai/07-application-architecture/04-integration/02-crm-business.md"
            },
            {
              "text": "4.3 插件体系",
              "link": "/ai/07-application-architecture/04-integration/03-plugin-system.md"
            },
            {
              "text": "4.4 审计日志与数据同步",
              "link": "/ai/07-application-architecture/04-integration/04-audit-sync.md"
            }
          ]
        },
        {
          "text": "第5章：框架选型与集成",
          "collapsed": true,
          "items": [
            {
              "text": "5.1 LangChain 与 LangGraph 选型",
              "link": "/ai/07-application-architecture/05-selection/01-langchain-langgraph.md"
            },
            {
              "text": "5.2 LlamaIndex 选型",
              "link": "/ai/07-application-architecture/05-selection/02-llamaindex.md"
            },
            {
              "text": "5.3 Dify 与 Coze 选型",
              "link": "/ai/07-application-architecture/05-selection/03-dify-coze.md"
            },
            {
              "text": "5.4 自研框架边界",
              "link": "/ai/07-application-architecture/05-selection/04-self-built-boundary.md"
            }
          ]
        }
      ]
    }
  ],
  "/ai/08-llmops-quality/": [
    {
      "text": "LLMOps 质量工程",
      "items": [
        {
          "text": "第1章：评测体系",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 LLMOps 质量工程概述",
              "link": "/ai/08-llmops-quality/01-evaluation/01-overview.md"
            },
            {
              "text": "1.2 评测集设计",
              "link": "/ai/08-llmops-quality/01-evaluation/02-dataset.md"
            },
            {
              "text": "1.3 Golden Answer",
              "link": "/ai/08-llmops-quality/01-evaluation/03-golden-answer.md"
            },
            {
              "text": "1.4 自动评分",
              "link": "/ai/08-llmops-quality/01-evaluation/04-auto-evaluation.md"
            },
            {
              "text": "1.5 人工评审",
              "link": "/ai/08-llmops-quality/01-evaluation/05-human-review.md"
            }
          ]
        },
        {
          "text": "第2章：可观测性",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 Trace 链路",
              "link": "/ai/08-llmops-quality/02-observability/01-tracing.md"
            },
            {
              "text": "2.2 Prompt 日志",
              "link": "/ai/08-llmops-quality/02-observability/02-prompt-log.md"
            },
            {
              "text": "2.3 Token 与成本指标",
              "link": "/ai/08-llmops-quality/02-observability/03-token-cost.md"
            },
            {
              "text": "2.4 延迟与失败分析",
              "link": "/ai/08-llmops-quality/02-observability/04-latency-failure.md"
            }
          ]
        },
        {
          "text": "第3章：质量优化",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 幻觉治理",
              "link": "/ai/08-llmops-quality/03-quality/01-hallucination.md"
            },
            {
              "text": "3.2 检索相关性",
              "link": "/ai/08-llmops-quality/03-quality/02-retrieval-relevance.md"
            },
            {
              "text": "3.3 可引用性",
              "link": "/ai/08-llmops-quality/03-quality/03-citability.md"
            },
            {
              "text": "3.4 用户反馈闭环",
              "link": "/ai/08-llmops-quality/03-quality/04-feedback-loop.md"
            }
          ]
        },
        {
          "text": "第4章：发布管理",
          "collapsed": true,
          "items": [
            {
              "text": "4.1 Prompt 灰度",
              "link": "/ai/08-llmops-quality/04-release/01-prompt-gray.md"
            },
            {
              "text": "4.2 A/B 测试",
              "link": "/ai/08-llmops-quality/04-release/02-ab-testing.md"
            },
            {
              "text": "4.3 版本回滚",
              "link": "/ai/08-llmops-quality/04-release/03-rollback.md"
            },
            {
              "text": "4.4 线上事故复盘",
              "link": "/ai/08-llmops-quality/04-release/04-incident-review.md"
            }
          ]
        }
      ]
    }
  ],
  "/ai/09-security-governance/": [
    {
      "text": "安全与合规治理",
      "items": [
        {
          "text": "第1章：AI 安全基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 安全与合规治理概述",
              "link": "/ai/09-security-governance/01-security/01-overview.md"
            },
            {
              "text": "1.2 Prompt 注入",
              "link": "/ai/09-security-governance/01-security/02-prompt-injection.md"
            },
            {
              "text": "1.3 越权访问",
              "link": "/ai/09-security-governance/01-security/03-unauthorized-access.md"
            },
            {
              "text": "1.4 数据泄露",
              "link": "/ai/09-security-governance/01-security/04-data-leakage.md"
            },
            {
              "text": "1.5 敏感信息处理",
              "link": "/ai/09-security-governance/01-security/05-sensitive-data.md"
            }
          ]
        },
        {
          "text": "第2章：内容与输出治理",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 输出审核",
              "link": "/ai/09-security-governance/02-content-governance/01-output-moderation.md"
            },
            {
              "text": "2.2 敏感内容拦截",
              "link": "/ai/09-security-governance/02-content-governance/02-content-blocking.md"
            },
            {
              "text": "2.3 工具调用审批",
              "link": "/ai/09-security-governance/02-content-governance/03-tool-approval.md"
            },
            {
              "text": "2.4 风险响应策略",
              "link": "/ai/09-security-governance/02-content-governance/04-risk-response.md"
            }
          ]
        },
        {
          "text": "第3章：企业合规治理",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 数据合规",
              "link": "/ai/09-security-governance/03-compliance/01-data-compliance.md"
            },
            {
              "text": "3.2 模型准入",
              "link": "/ai/09-security-governance/03-compliance/02-model-admission.md"
            },
            {
              "text": "3.3 权限策略",
              "link": "/ai/09-security-governance/03-compliance/03-permission-policy.md"
            },
            {
              "text": "3.4 审计留痕",
              "link": "/ai/09-security-governance/03-compliance/04-audit-trail.md"
            },
            {
              "text": "3.5 数据保留周期",
              "link": "/ai/09-security-governance/03-compliance/05-data-retention.md"
            }
          ]
        }
      ]
    }
  ],
  "/ai/10-cost-deployment/": [
    {
      "text": "成本与部署运营",
      "items": [
        {
          "text": "第1章：成本运营",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 成本与部署运营概述",
              "link": "/ai/10-cost-deployment/01-cost/01-overview.md"
            },
            {
              "text": "1.2 Token 成本模型",
              "link": "/ai/10-cost-deployment/01-cost/02-token-cost.md"
            },
            {
              "text": "1.3 配额与预算",
              "link": "/ai/10-cost-deployment/01-cost/03-quota-budget.md"
            },
            {
              "text": "1.4 成本看板",
              "link": "/ai/10-cost-deployment/01-cost/04-cost-dashboard.md"
            }
          ]
        },
        {
          "text": "第2章：性能与成本优化",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 模型路由",
              "link": "/ai/10-cost-deployment/02-optimization/01-model-routing.md"
            },
            {
              "text": "2.2 缓存策略",
              "link": "/ai/10-cost-deployment/02-optimization/02-cache.md"
            },
            {
              "text": "2.3 批处理",
              "link": "/ai/10-cost-deployment/02-optimization/03-batch-processing.md"
            },
            {
              "text": "2.4 Prompt 压缩",
              "link": "/ai/10-cost-deployment/02-optimization/04-prompt-compression.md"
            },
            {
              "text": "2.5 模型蒸馏与小模型替代",
              "link": "/ai/10-cost-deployment/02-optimization/05-small-model.md"
            }
          ]
        },
        {
          "text": "第3章：本地与私有化部署",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 Ollama",
              "link": "/ai/10-cost-deployment/03-deployment/01-ollama.md"
            },
            {
              "text": "3.2 vLLM",
              "link": "/ai/10-cost-deployment/03-deployment/02-vllm.md"
            },
            {
              "text": "3.3 GPU 资源规划",
              "link": "/ai/10-cost-deployment/03-deployment/03-gpu-planning.md"
            },
            {
              "text": "3.4 高可用部署",
              "link": "/ai/10-cost-deployment/03-deployment/04-high-availability.md"
            },
            {
              "text": "3.5 灾备与容量评估",
              "link": "/ai/10-cost-deployment/03-deployment/05-capacity.md"
            }
          ]
        }
      ]
    }
  ]
};
