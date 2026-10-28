// AI 应用开发目录的单一事实源；正文通过验收后才为文章登记 publishedLink。
const aiModuleDefinitions = [
  {
    id: 'AI01',
    title: 'AI 应用基础',
    path: '/ai/01-application-foundation',
    navigationGroup: '基础与接入',
    hasIndex: false,
    description: '建立 AI 应用、模型、生成机制和首个调用的基础认知，并完成最小可验证应用。',
    chapters: [
      { title: '应用构成与模型边界', directory: '01-application-model-boundaries', responsibility: '区分模型能力与应用责任，并依据任务约束选择模型。', articles: [['AI 应用组成', '01-application-components.md', '/ai/01-application-foundation/01-application-model-boundaries/01-application-components.md'], ['模型能力与限制', '02-model-capabilities-limitations.md', '/ai/01-application-foundation/01-application-model-boundaries/02-model-capabilities-limitations.md'], ['任务与模型选择', '03-task-model-selection.md', '/ai/01-application-foundation/01-application-model-boundaries/03-task-model-selection.md']] },
      { title: '模型生成机制', directory: '02-generation-mechanics', responsibility: '理解 Token、上下文窗口、生成参数和非确定性结果的边界。', articles: [['Token 与上下文窗口', '01-token-context-window.md', '/ai/01-application-foundation/02-generation-mechanics/01-token-context-window.md'], ['生成过程与参数', '02-generation-process-parameters.md', '/ai/01-application-foundation/02-generation-mechanics/02-generation-process-parameters.md'], ['非确定性与事实校验', '03-nondeterminism-factuality.md', '/ai/01-application-foundation/02-generation-mechanics/03-nondeterminism-factuality.md']] },
      { title: '最小应用', directory: '03-minimal-application', responsibility: '从空目录完成环境准备、首次调用和最小应用验证。', articles: [['Python 环境与 API Key', '01-python-environment-api-key.md', '/ai/01-application-foundation/03-minimal-application/01-python-environment-api-key.md'], ['Responses API 调用', '02-responses-api-call.md', '/ai/01-application-foundation/03-minimal-application/02-responses-api-call.md'], ['CLI 摘要应用', '03-cli-summarization-application.md', '/ai/01-application-foundation/03-minimal-application/03-cli-summarization-application.md']] },
    ],
  },
  {
    id: 'AI02',
    title: '模型接入',
    path: '/ai/02-model-integration',
    navigationGroup: '基础与接入',
    hasIndex: false,
    description: '掌握模型 API 的请求、流式事件、结构化输出、工具、多模态和可靠性边界。',
    chapters: [
      { title: '请求与响应', directory: '01-request-response', responsibility: '建立输入项、请求选项、响应对象和用量的稳定接口模型。', articles: [['输入项与内容类型', '01-input-items-content-types.md', '/ai/02-model-integration/01-request-response/01-input-items-content-types.md'], ['请求选项与兼容性', '02-request-options-compatibility.md', '/ai/02-model-integration/01-request-response/02-request-options-compatibility.md'], ['响应对象与用量', '03-response-object-usage.md', '/ai/02-model-integration/01-request-response/03-response-object-usage.md']] },
      { title: '响应生命周期', directory: '02-response-lifecycle', responsibility: '管理流式事件、取消、超时、后台响应和 Webhook 生命周期。', articles: [['流式事件', '01-streaming-events.md', '/ai/02-model-integration/02-response-lifecycle/01-streaming-events.md'], ['取消与超时', '02-cancellation-timeouts.md', '/ai/02-model-integration/02-response-lifecycle/02-cancellation-timeouts.md'], ['后台响应与 Webhook', '03-background-responses-webhooks.md', '/ai/02-model-integration/02-response-lifecycle/03-background-responses-webhooks.md']] },
      { title: '结构化输出', directory: '03-structured-output', responsibility: '使用 JSON Schema 约束输出，并区分解析、拒绝和未完成响应。', articles: [['JSON Schema 输出', '01-json-schema-output.md', '/ai/02-model-integration/03-structured-output/01-json-schema-output.md'], ['解析、拒绝与未完成响应', '02-parsing-refusals-incomplete.md', '/ai/02-model-integration/03-structured-output/02-parsing-refusals-incomplete.md']] },
      { title: '工具调用', directory: '04-tool-calling', responsibility: '区分模型提出调用与应用执行动作，形成可校验的结果回传链路。', articles: [['函数定义与选择', '01-function-schema-selection.md', '/ai/02-model-integration/04-tool-calling/01-function-schema-selection.md'], ['调用执行与结果回传', '02-call-execution-return.md', '/ai/02-model-integration/04-tool-calling/02-call-execution-return.md'], ['并行调用与失败处理', '03-parallel-calls-failures.md', '/ai/02-model-integration/04-tool-calling/03-parallel-calls-failures.md']] },
      { title: '多模态接口', directory: '05-multimodal', responsibility: '按任务和格式约束接入图像、文档与音频能力。', articles: [['图像与文档输入', '01-image-document-input.md', '/ai/02-model-integration/05-multimodal/01-image-document-input.md'], ['音频输入与输出', '02-audio-input-output.md', '/ai/02-model-integration/05-multimodal/02-audio-input-output.md']] },
      { title: '接入可靠性', directory: '06-integration-reliability', responsibility: '依据错误类型、重试语义和契约测试建立稳定客户端边界。', articles: [['API 错误分类', '01-api-errors.md', '/ai/02-model-integration/06-integration-reliability/01-api-errors.md'], ['重试与幂等', '02-retry-idempotency.md', '/ai/02-model-integration/06-integration-reliability/02-retry-idempotency.md'], ['客户端封装与契约测试', '03-client-contract-tests.md', '/ai/02-model-integration/06-integration-reliability/03-client-contract-tests.md']] },
    ],
  },
  {
    id: 'AI03',
    title: 'Prompt 与上下文',
    path: '/ai/03-prompt-context',
    navigationGroup: '基础与接入',
    description: '将 Prompt 作为输入契约，管理上下文来源、预算、对话状态和版本迭代。',
    chapters: [
      { title: '指令契约', directory: '01-instruction-contract', responsibility: '定义任务、成功标准、指令权威和语义输出边界。', articles: [['任务与成功标准', '01-task-success-criteria.md'], ['指令层级', '02-instruction-hierarchy.md'], ['输出边界', '03-output-boundaries.md']] },
      { title: 'Prompt 构造', directory: '02-prompt-construction', responsibility: '分离指令与数据，安全渲染变量并设计少样本示例。', articles: [['指令与数据边界', '01-instructions-data-boundary.md', '/ai/03-prompt-context/02-prompt-construction/01-instructions-data-boundary.md'], ['动态变量与模板', '02-dynamic-variables-templates.md'], ['少样本示例', '03-few-shot-examples.md']] },
      { title: '上下文组装', directory: '03-context-assembly', responsibility: '依据来源、可信度、相关性、顺序和预算选择上下文。', articles: [['上下文来源与可信度', '01-context-sources-trust.md'], ['相关性与顺序', '02-relevance-ordering.md'], ['Token 预算与截断', '03-token-budget-truncation.md']] },
      { title: '会话状态', directory: '04-conversation-state', responsibility: '选择状态续接模式，分离应用状态并控制压缩损失。', articles: [['会话状态模式', '01-state-management-modes.md', '/ai/03-prompt-context/04-conversation-state/01-state-management-modes.md'], ['应用状态与模型上下文', '02-application-state-context.md'], ['压缩与连续性', '03-compaction-continuity.md']] },
      { title: 'Prompt 生命周期', directory: '05-prompt-lifecycle', responsibility: '以代码、样本、发布和诊断管理 Prompt 变更。', articles: [['Prompt 代码化', '01-code-managed-prompts.md'], ['样本与回归测试', '02-fixtures-regression.md'], ['发布与失效诊断', '03-rollout-failure-diagnosis.md']] },
    ],
  },
  {
    id: 'AI04',
    title: 'RAG 应用',
    path: '/ai/04-rag',
    navigationGroup: '知识与智能体',
    description: '构建从数据处理、检索和证据回答到评测与知识维护的 RAG 闭环。',
    chapters: [
      { title: '知识边界', directory: '01-knowledge-boundary', responsibility: '判断 RAG 的适用条件，并确定数据来源和访问边界。', articles: [['RAG 适用条件与链路', '01-rag-fit-pipeline.md', '/ai/04-rag/01-knowledge-boundary/01-rag-fit-pipeline.md'], ['数据来源与权限', '02-data-sources-permissions.md', '/ai/04-rag/01-knowledge-boundary/02-data-sources-permissions.md']] },
      { title: '文档处理', directory: '02-document-processing', responsibility: '把原始资料转换为可追溯、可增量维护的知识片段。', articles: [['解析与清洗', '01-parsing-cleaning.md', '/ai/04-rag/02-document-processing/01-parsing-cleaning.md'], ['切分与元数据', '02-chunking-metadata.md', '/ai/04-rag/02-document-processing/02-chunking-metadata.md'], ['增量采集', '03-incremental-ingestion.md', '/ai/04-rag/02-document-processing/03-incremental-ingestion.md']] },
      { title: '嵌入与索引', directory: '03-embeddings-indexes', responsibility: '理解向量表示和索引存储对检索效果与成本的影响。', articles: [['嵌入与相似度', '01-embeddings-similarity.md', '/ai/04-rag/03-embeddings-indexes/01-embeddings-similarity.md'], ['向量索引与存储', '02-vector-index-storage.md', '/ai/04-rag/03-embeddings-indexes/02-vector-index-storage.md']] },
      { title: '检索与排序', directory: '04-retrieval-ranking', responsibility: '组合过滤、关键词、向量、重排和查询改写以改善证据召回。', articles: [['向量检索与过滤', '01-vector-search-filtering.md', '/ai/04-rag/04-retrieval-ranking/01-vector-search-filtering.md'], ['关键词与混合检索', '02-keyword-hybrid-search.md', '/ai/04-rag/04-retrieval-ranking/02-keyword-hybrid-search.md'], ['重排与查询改写', '03-reranking-query-rewriting.md', '/ai/04-rag/04-retrieval-ranking/03-reranking-query-rewriting.md']] },
      { title: '证据回答', directory: '05-evidence-answers', responsibility: '让回答基于可追踪证据，并正确处理证据不足或冲突。', articles: [['证据组织与生成', '01-evidence-grounded-generation.md', '/ai/04-rag/05-evidence-answers/01-evidence-grounded-generation.md'], ['引用与来源追踪', '02-citations-provenance.md'], ['证据不足与冲突', '03-insufficient-conflicting-evidence.md']] },
      { title: 'RAG 评测', directory: '06-rag-evaluation', responsibility: '分别评测检索、回答和引用，定位质量损失所在环节。', articles: [['检索评测', '01-retrieval-evaluation.md'], ['回答与引用评测', '02-answer-citation-evaluation.md'], ['质量归因', '03-quality-attribution.md']] },
      { title: '知识库维护', directory: '07-knowledge-maintenance', responsibility: '管理增量更新、索引迁移、权限变化和内容撤回。', articles: [['增量更新与索引迁移', '01-incremental-updates-index-migration.md'], ['权限变更与内容撤回', '02-permission-changes-content-removal.md']] },
    ],
  },
  {
    id: 'AI05',
    title: 'Agent 开发',
    path: '/ai/05-agent-development',
    navigationGroup: '知识与智能体',
    description: '构建受权限、状态、预算和终止条件约束的工具型 Agent 与协作流程。',
    chapters: [
      { title: 'Agent 模型', directory: '01-agent-model', responsibility: '区分 Agent 与确定性工作流，理解受控的观察与行动循环。', articles: [['Agent 与工作流', '01-agent-workflows.md', '/ai/05-agent-development/01-agent-model/01-agent-workflows.md'], ['控制循环', '02-control-loop.md', '/ai/05-agent-development/01-agent-model/02-control-loop.md'], ['首个 Agent 与结果验证', '03-first-agent-validation.md', '/ai/05-agent-development/01-agent-model/03-first-agent-validation.md']] },
      { title: '工具执行', directory: '02-tool-execution', responsibility: '以明确契约执行工具，并处理失败、幂等和结果核对。', articles: [['工具契约', '01-tool-contracts.md', '/ai/05-agent-development/02-tool-execution/01-tool-contracts.md'], ['执行器与错误', '02-executors-errors.md', '/ai/05-agent-development/02-tool-execution/02-executors-errors.md'], ['幂等与结果核对', '03-idempotency-result-verification.md', '/ai/05-agent-development/02-tool-execution/03-idempotency-result-verification.md']] },
      { title: '权限与隔离', directory: '03-permissions-isolation', responsibility: '限制工具权限、凭据暴露和高风险动作，提供人工确认。', articles: [['工具权限与人工确认', '01-tool-permissions-human-approval.md', '/ai/05-agent-development/03-permissions-isolation/01-tool-permissions-human-approval.md'], ['沙箱与凭据边界', '02-sandbox-credential-boundaries.md', '/ai/05-agent-development/03-permissions-isolation/02-sandbox-credential-boundaries.md']] },
      { title: '状态与记忆', directory: '04-state-memory', responsibility: '管理任务状态、检查点、记忆和可恢复执行。', articles: [['任务状态与检查点', '01-task-state-checkpoints.md', '/ai/05-agent-development/04-state-memory/01-task-state-checkpoints.md'], ['Agent 记忆', '02-agent-memory.md', '/ai/05-agent-development/04-state-memory/02-agent-memory.md'], ['失败恢复', '03-failure-recovery.md', '/ai/05-agent-development/04-state-memory/03-failure-recovery.md']] },
      { title: '流程与协作', directory: '05-workflows-collaboration', responsibility: '组合工作流、委派和多 Agent 协作，并处理结果冲突。', articles: [['工作流编排', '01-workflow-orchestration.md', '/ai/05-agent-development/05-workflows-collaboration/01-workflow-orchestration.md'], ['委派与多 Agent', '02-delegation-multi-agent.md', '/ai/05-agent-development/05-workflows-collaboration/02-delegation-multi-agent.md'], ['结果合并与冲突', '03-result-merging-conflicts.md', '/ai/05-agent-development/05-workflows-collaboration/03-result-merging-conflicts.md']] },
      { title: 'MCP', directory: '06-mcp', responsibility: '理解 MCP 原语、连接方式、授权和版本兼容边界。', articles: [['MCP 架构与原语', '01-mcp-architecture-primitives.md'], ['本地 MCP 集成', '02-local-mcp-integration.md'], ['远程授权与版本兼容', '03-remote-auth-version-compatibility.md']] },
      { title: '生产控制', directory: '07-production-control', responsibility: '限制步骤和预算，并管理 Agent 版本、发布和恢复。', articles: [['步数、预算与终止', '01-steps-budget-termination.md'], ['Agent 版本与发布恢复', '02-agent-version-release-recovery.md']] },
    ],
  },
  {
    id: 'AI06',
    title: '框架与编排',
    path: '/ai/06-framework-orchestration',
    navigationGroup: '知识与智能体',
    description: '在理解通用机制后，使用 LangChain 与 LangGraph 实现状态化、可恢复工作流。',
    chapters: [
      { title: '框架边界', directory: '01-framework-boundary', responsibility: '依据复杂度选择原生 SDK、LangChain 或 LangGraph，并控制版本。', articles: [['原生 SDK 与框架', '01-native-sdk-frameworks.md'], ['LangChain 与 LangGraph', '02-langchain-langgraph.md'], ['依赖与版本', '03-dependencies-versions.md']] },
      { title: 'LangChain 基础', directory: '02-langchain-foundation', responsibility: '使用 LangChain 统一模型、消息、工具、结构化结果和 Agent。', articles: [['模型与消息', '01-models-messages.md'], ['工具与结构化结果', '02-tools-structured-results.md'], ['Agent 构建', '03-agent-construction.md']] },
      { title: 'LangChain 运行时', directory: '03-langchain-runtime', responsibility: '在运行时传递上下文、状态并通过 Middleware 控制行为。', articles: [['上下文与状态', '01-context-state.md'], ['Middleware 与动态控制', '02-middleware-dynamic-control.md']] },
      { title: 'LangGraph 基础', directory: '04-langgraph-foundation', responsibility: '使用 State、节点、Reducer、路由和循环表达工作流。', articles: [['State 与 Schema', '01-state-schema.md'], ['节点与 Reducer', '02-nodes-reducers.md'], ['路由与循环', '03-routing-loops.md']] },
      { title: '持久执行', directory: '05-durable-execution', responsibility: '使用 Thread 和 Checkpoint 支持中断恢复，并控制重放副作用。', articles: [['Thread 与 Checkpoint', '01-threads-checkpoints.md'], ['人工中断与恢复', '02-human-interrupt-resume.md'], ['副作用、重放与重试', '03-side-effects-replay-retries.md']] },
      { title: '图组合', directory: '06-graph-composition', responsibility: '组合并行、动态路由和子图，并选择合适的图 API。', articles: [['并行与动态路由', '01-parallel-dynamic-routing.md'], ['子图与 API 选择', '02-subgraphs-api-selection.md']] },
      { title: '测试与交付', directory: '07-testing-delivery', responsibility: '测试和诊断图执行，并处理服务部署中的状态兼容。', articles: [['图测试与诊断', '01-graph-testing-diagnostics.md'], ['服务部署与状态兼容', '02-service-deployment-state-compatibility.md']] },
    ],
  },
  {
    id: 'AI07',
    title: '应用架构',
    path: '/ai/07-application-architecture',
    navigationGroup: '工程与治理',
    description: '设计 AI 应用的服务、网关、会话、任务、业务记录和能力组合边界。',
    chapters: [
      { title: '服务边界', directory: '01-service-boundary', responsibility: '划分客户端、业务服务和模型服务责任，并选择同步或异步链路。', articles: [['客户端与服务端边界', '01-client-server-boundary.md'], ['同步与异步链路', '02-sync-async-flows.md']] },
      { title: '模型网关', directory: '02-model-gateway', responsibility: '集中管理提供商路由、配置和租户边界，不承载业务状态。', articles: [['网关与提供商路由', '01-gateway-provider-routing.md'], ['配置与租户边界', '02-configuration-tenant-boundary.md']] },
      { title: '会话与状态', directory: '03-session-state', responsibility: '持久化会话，区分业务状态与模型上下文，并处理一致性和恢复。', articles: [['会话持久化', '01-session-persistence.md'], ['业务状态与模型上下文', '02-business-state-model-context.md'], ['状态一致性与恢复', '03-state-consistency-recovery.md']] },
      { title: '交互与任务', directory: '04-interaction-tasks', responsibility: '管理流式交互、重复提交、文件任务和结果恢复。', articles: [['流式交互与重复提交', '01-streaming-interaction-deduplication.md'], ['文件与后台任务', '02-files-background-tasks.md'], ['任务结果恢复', '03-task-result-recovery.md']] },
      { title: '业务集成', directory: '05-business-integration', responsibility: '将模型结果转为可校验业务记录，并保留人工复核和审计链。', articles: [['结构化结果与业务记录', '01-structured-results-business-records.md'], ['人工复核与审计', '02-human-review-audit.md']] },
      { title: '能力组合', directory: '06-capability-composition', responsibility: '比较直接调用、RAG 和 Agent 架构，并依据约束选择。', articles: [['直接调用架构', '01-direct-call-architecture.md'], ['RAG 与 Agent 架构', '02-rag-agent-architecture.md'], ['架构选择', '03-architecture-selection.md']] },
    ],
  },
  {
    id: 'AI08',
    title: '评测与可观测性',
    path: '/ai/08-evaluation-observability',
    navigationGroup: '工程与治理',
    description: '建立质量目标、评测数据、评分、回归门禁、调用链观测和线上反馈闭环。',
    chapters: [
      { title: '质量目标', directory: '01-quality-objectives', responsibility: '把业务目标转换为质量基线和可定位的失败分类。', articles: [['成功标准与质量基线', '01-success-criteria-quality-baseline.md'], ['失败分类', '02-failure-taxonomy.md']] },
      { title: '评测数据', directory: '02-evaluation-data', responsibility: '设计有代表性的样本，隔离数据用途并管理版本。', articles: [['样本设计', '01-sample-design.md'], ['数据划分', '02-data-splitting.md'], ['数据版本', '03-data-versioning.md']] },
      { title: '评分方法', directory: '03-scoring-methods', responsibility: '组合规则、模型和人工评分，并校准一致性与偏差。', articles: [['规则评分', '01-rule-based-scoring.md'], ['模型评分', '02-model-based-scoring.md'], ['人工评审与校准', '03-human-review-calibration.md']] },
      { title: '回归评测', directory: '04-regression-evaluation', responsibility: '处理非确定性结果，以持续评测支撑发布门禁。', articles: [['非确定性与重复评测', '01-nondeterminism-repeated-evaluation.md'], ['持续回归', '02-continuous-regression.md'], ['发布门禁', '03-release-gates.md']] },
      { title: '调用链观测', directory: '05-call-observability', responsibility: '关联模型、检索和工具 Span，同时控制可观测内容边界。', articles: [['Trace 与 Span', '01-traces-spans.md'], ['模型、检索与工具轨迹', '02-model-retrieval-tool-traces.md'], ['会话关联与内容边界', '03-session-correlation-content-boundary.md']] },
      { title: '线上质量', directory: '06-online-quality', responsibility: '联合观察质量、时延和成本，并将异常样本反馈到评测。', articles: [['质量、时延与成本', '01-quality-latency-cost.md'], ['异常、漂移与样本回流', '02-anomalies-drift-sample-feedback.md']] },
    ],
  },
  {
    id: 'AI09',
    title: '安全与治理',
    path: '/ai/09-security-governance',
    navigationGroup: '工程与治理',
    description: '按信任边界治理提示注入、输出、工具、数据、供应链和审计风险。',
    chapters: [
      { title: '信任边界', directory: '01-trust-boundary', responsibility: '识别 AI 应用的数据流、资产、威胁和不同可信等级的输入。', articles: [['数据流、资产与威胁', '01-dataflow-assets-threats.md'], ['输入信任分级', '02-input-trust-levels.md']] },
      { title: '提示注入', directory: '02-prompt-injection', responsibility: '区分直接与间接注入，隔离不可信上下文并验证防护。', articles: [['直接与间接提示注入', '01-direct-indirect-prompt-injection.md'], ['不可信上下文隔离', '02-untrusted-context-isolation.md'], ['防护验证', '03-defense-validation.md']] },
      { title: '输出安全', directory: '03-output-safety', responsibility: '校验和安全呈现模型输出，限制代码、命令和有害内容。', articles: [['输出校验与安全渲染', '01-output-validation-safe-rendering.md'], ['代码与命令执行', '02-code-command-execution.md'], ['内容风险处理', '03-content-risk-handling.md']] },
      { title: '工具与 Agent 安全', directory: '04-tool-agent-security', responsibility: '用身份、授权、确认和行为边界限制 Agent 权力。', articles: [['身份、授权与最小权限', '01-identity-authorization-least-privilege.md'], ['高风险操作确认', '02-high-risk-action-approval.md'], ['过度代理防护', '03-excessive-agency-protection.md']] },
      { title: '数据保护', directory: '05-data-protection', responsibility: '保护敏感数据和日志，执行保留删除与租户隔离。', articles: [['敏感数据与日志', '01-sensitive-data-logs.md'], ['保留与删除', '02-retention-deletion.md'], ['多租户隔离', '03-multitenant-isolation.md']] },
      { title: '供应链安全', directory: '06-supply-chain-security', responsibility: '核验模型、数据、依赖、插件和外部服务的来源与风险。', articles: [['模型与数据来源', '01-model-data-provenance.md'], ['依赖、插件与外部服务', '02-dependencies-plugins-services.md']] },
      { title: '治理与审计', directory: '07-governance-audit', responsibility: '登记 AI 资产、风险和责任，并建立审计与事件响应。', articles: [['AI 资产、风险与责任', '01-ai-assets-risks-accountability.md'], ['审计与事件响应', '02-audit-incident-response.md']] },
    ],
  },
  {
    id: 'AI10',
    title: '性能、成本与部署',
    path: '/ai/10-performance-deployment',
    navigationGroup: '工程与治理',
    description: '优化 AI 应用的时延、吞吐和成本，并完成部署、发布、容量和运行治理。',
    chapters: [
      { title: '性能模型', directory: '01-performance-model', responsibility: '拆解端到端时延、吞吐和并发，使用证据定位瓶颈。', articles: [['端到端时延', '01-end-to-end-latency.md'], ['吞吐与并发', '02-throughput-concurrency.md'], ['瓶颈分析', '03-bottleneck-analysis.md']] },
      { title: '请求优化', directory: '02-request-optimization', responsibility: '通过 Token、流式、缓存、批处理和并发控制改善体验。', articles: [['Token 与流式体验', '01-token-streaming-experience.md'], ['Prompt 与响应缓存', '02-prompt-response-caching.md'], ['批处理与并发控制', '03-batching-concurrency-control.md']] },
      { title: '模型路由', directory: '03-model-routing', responsibility: '按任务和质量证据进行模型分层、路由和可验证降级。', articles: [['模型分层与路由', '01-model-tiering-routing.md'], ['降级与效果验证', '02-fallback-quality-validation.md']] },
      { title: '成本治理', directory: '04-cost-governance', responsibility: '计量和归集成本，设置预算限额并发现异常。', articles: [['成本计量与归集', '01-cost-metering-allocation.md'], ['预算、限额与异常', '02-budgets-limits-anomalies.md']] },
      { title: '应用部署', directory: '05-application-deployment', responsibility: '配置和部署 AI 应用、队列及工作进程，并建立弹性和健康检查。', articles: [['容器与运行配置', '01-containers-runtime-configuration.md'], ['队列与工作进程', '02-queues-workers.md'], ['扩缩容与健康检查', '03-scaling-health-checks.md']] },
      { title: '发布与恢复', directory: '06-release-recovery', responsibility: '控制配置和灰度发布，处理回滚、提供商故障和任务恢复。', articles: [['配置、灰度与回滚', '01-configuration-canary-rollback.md'], ['提供商故障与任务恢复', '02-provider-failures-task-recovery.md']] },
      { title: '容量与运行', directory: '07-capacity-operations', responsibility: '通过压测、SLO、告警、演练和运行手册维护生产能力。', articles: [['压测与容量基线', '01-load-testing-capacity-baseline.md'], ['SLO 与告警', '02-slo-alerting.md'], ['故障演练与运行手册', '03-failure-drills-runbooks.md']] },
    ],
  },
]

/**
 * 将紧凑目录定义扩展为具有稳定文章 ID 的标准 catalog 数据。
 *
 * @param {object[]} definitions 模块定义，文章以 `[标题, 文件名, 可选发布链接]` 表示。
 * @returns {object[]} 可供导航、侧栏和测试共同使用的模块记录。
 */
function createCatalogModules(definitions) {
  const modules = []
  for (const definition of definitions) {
    const module = { ...definition, chapters: [] }
    for (const [chapterIndex, chapterDefinition] of definition.chapters.entries()) {
      const chapter = { ...chapterDefinition, articles: [] }
      for (const [articleIndex, articleDefinition] of chapterDefinition.articles.entries()) {
        const article = {
          id: `${definition.id}-A${String(chapterIndex + 1).padStart(2, '0')}-${String(articleIndex + 1).padStart(2, '0')}`,
          title: articleDefinition[0],
          file: articleDefinition[1],
        }
        if (articleDefinition[2]) article.publishedLink = articleDefinition[2]
        chapter.articles.push(article)
      }
      module.chapters.push(chapter)
    }
    modules.push(module)
  }
  return modules
}

export const aiCatalog = {
  title: 'AI 应用开发',
  version: '2026-09-28-application-lifecycle-v2',
  modules: createCatalogModules(aiModuleDefinitions),
}

/**
 * 解析 AI 模块当前可访问的入口。
 *
 * @param {object} module AI 目录中的模块记录，必须包含章节和文章数组。
 * @returns {string | null} 首个已发布正文、模块首页链接，或尚无入口时的 `null`。
 */
export function getAiModuleEntryLink(module) {
  for (const chapter of module.chapters ?? []) {
    for (const article of chapter.articles ?? []) {
      if (article.publishedLink) return article.publishedLink
    }
  }
  return module.hasIndex === false ? null : `${module.path}/index.md`
}

export const aiNavigation = []
const navigationGroups = new Map()

for (const module of aiCatalog.modules) {
  const entryLink = getAiModuleEntryLink(module)
  if (!entryLink) continue

  let group = navigationGroups.get(module.navigationGroup)
  if (!group) {
    group = { text: module.navigationGroup, items: [] }
    navigationGroups.set(module.navigationGroup, group)
    aiNavigation.push(group)
  }
  group.items.push({ text: module.title, link: entryLink })
}
