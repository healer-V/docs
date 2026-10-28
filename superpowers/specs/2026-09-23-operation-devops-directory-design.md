---
title: "运维与 DevOps 知识目录重构设计"
tags:
  - 运维
  - DevOps
  - 知识目录
excerpt: "规划运维与 DevOps 知识域的十四个教程模块、学习依赖、章节和文章主题，并规定旧页面保留、规划条目展示及逐章开放的迁移方式。"
date: 2026-09-23
---

# 运维与 DevOps 知识目录重构设计

运维与 DevOps 知识域面向目标技术零基础的读者，从主机、网络和服务运行开始，逐步进入容器编排、持续交付、监控、可靠性、安全、基础设施自动化和平台工程。DevOps 是贯穿开发、交付、运行与反馈的协作和工程实践，不作为与具体技术模块重复的第十五个教程模块。

本文是**已确认的领域级目录设计**，不是十四个模块的完整教学蓝图，也不表示规划文章已经写成。每个模块进入正文前仍须按仓库规范分别确定主版本、官方来源、知识项、依赖、逐篇职责卡、覆盖矩阵和样板文章。

## 一、目标与边界

| 项目 | 设计决定 |
|------|----------|
| 顶部导航 | 名称为“运维与 DevOps”，按五个技术分组展示已开放模块 |
| 领域导读 | 规划 `content/operation/index.md`，解释 DevOps、学习路径与十四个模块的职责；不复制各模块教程 |
| 模块数量 | 十四个，按学习依赖与技术职责排序；不增设笼统的“DevOps 工具”模块 |
| 章节结构 | 每个模块独立使用两位编号的英文章节目录，章内文章从 `01` 连续编号 |
| 正文范围 | 本设计不创建新模块正文、不移动或删除旧文章、不修改正式导航 |
| 旧页面 | 除已退役的 Linux 旧目录外，其他旧文章和模块首页保留原路径，退出新导航但继续可访问 |
| 新页面 | 根据单模块蓝图和样板逐章重写，通过验收后才加入可点击导航 |

领域范围以服务器和应用交付运行为中心，不扩写编程语言、业务应用框架、数据库内部实现或云厂商全产品手册。Git 基础作为 CI/CD 的必要起点讲解；依赖其他方向的内容在使用处提供明确前置与有效入口。

## 二、导航与模块地图

| 分组 | 顺序 | 模块目录 | 模块职责 |
|------|-----:|----------|----------|
| 系统与网络 | 01 | `01-linux` | 操作、管理和诊断 Linux 主机 |
| 系统与网络 | 02 | `02-bash-shell` | 编写可检查、可恢复的 Bash 自动化脚本 |
| 系统与网络 | 03 | `03-networking` | 理解主机到服务的网络链路与分层排障 |
| 系统与网络 | 04 | `04-nginx` | 配置和维护静态服务、代理与入口流量 |
| 容器与编排 | 05 | `05-docker` | 构建镜像并运行、连接和维护单机容器 |
| 容器与编排 | 06 | `06-kubernetes` | 声明、部署、保护和诊断集群工作负载 |
| 持续交付 | 07 | `07-cicd` | 设计工具无关的质量门禁、制品与发布链路 |
| 持续交付 | 08 | `08-jenkins` | 使用并管理 Jenkins Job、Pipeline 与 Agent |
| 稳定性治理 | 09 | `09-monitoring-observability` | 采集、查询、告警并关联指标、日志和追踪 |
| 稳定性治理 | 10 | `10-sre` | 设定可靠性目标并治理值班、事故和容量 |
| 稳定性治理 | 11 | `11-operations-security` | 治理跨主机、容器、交付链路的运维安全风险 |
| 自动化与平台 | 12 | `12-ansible` | 管理受管主机的期望配置和批量变更 |
| 自动化与平台 | 13 | `13-terraform` | 声明基础设施资源并管理变更与状态 |
| 自动化与平台 | 14 | `14-platform-engineering` | 将交付和运维能力产品化为团队自助服务 |

编号代表推荐学习路径，不表示所有模块之间都有强制依赖。例如 Nginx 与 Docker 可在掌握 Linux、网络基础后分别学习；Jenkins 需要先理解 CI/CD 的通用概念。专题首页不占章节文章编号。

## 三、系统与网络

以下文章名称只表达拟主讲主题；单篇是否拆分、合并及最终文件名由对应模块蓝图的知识项和职责卡确定。规划条目目前均不作为已发布正文。

### 1. Linux

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-system-foundation` | Linux 与发行版；安装实验环境；终端、命令与帮助系统 |
| `02-filesystem-operations` | 文件系统与目录；文件操作与查找；文本查看与编辑 |
| `03-users-permissions` | 用户与用户组；文件权限；`sudo` 与权限边界 |
| `04-processes-systemd` | 进程与信号；服务管理；系统日志与 `journalctl` |
| `05-software-scheduled-jobs` | 软件包管理；定时任务；日志轮转 |
| `06-storage-backup` | 磁盘与挂载；容量与文件系统；备份与恢复 |
| `07-host-networking` | 主机网络配置；连接与 DNS 检查；主机防火墙 |
| `08-host-security` | SSH 访问；安全更新与基线；主机审计 |
| `09-troubleshooting` | CPU 与内存异常；磁盘与 I/O 异常；服务与网络故障 |

Linux 只主讲主机层操作和本地诊断；Bash 负责脚本语言，网络基础负责协议机制，监控专题负责集中采集与告警。

### 2. Bash 与 Shell

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-shell-foundation` | Bash 执行模型；第一个脚本；引用与命令展开 |
| `02-variables-parameters` | 变量与环境；脚本参数和退出状态；数组 |
| `03-control-flow` | 条件判断；循环与模式匹配 |
| `04-functions-composition` | 函数与作用域；脚本拆分与复用 |
| `05-pipelines-text` | 重定向与管道；`grep`、`sed`、`awk`；文本批处理 |
| `06-processes-signals` | 子进程与后台任务；信号和 `trap` |
| `07-quality-security` | 错误处理；脚本测试与 ShellCheck；输入和密钥边界 |
| `08-automation-practice` | 日志分析脚本；巡检脚本；备份脚本 |

Shell 的基础命令使用由 Linux 提供必要上下文，本模块主讲 Bash 语法、运行行为和可验证的脚本质量，不替代 Ansible 的主机期望状态管理。

### 3. 网络基础

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-network-model` | 网络分层与数据传输；接口、地址和端口 |
| `02-ip-routing` | IPv4/IPv6 与子网；路由与网关 |
| `03-transport-connections` | TCP 连接与状态；UDP；抓包基础 |
| `04-dns` | 域名解析链路；DNS 记录与缓存；解析故障 |
| `05-http-tls` | HTTP 请求与响应；HTTPS 与证书；连接超时 |
| `06-firewalls-nat` | 包过滤；NAT；访问控制排查 |
| `07-proxy-balancing` | 正向与反向代理；负载均衡模型 |
| `08-network-diagnostics` | 连通性定位；DNS/TCP/TLS 分层诊断；抓包案例 |

此模块解释跨产品网络机制。Linux 的主机配置、Nginx 的指令、Docker 的容器网络和 Kubernetes 的 Service 分别在所属模块主讲。

### 4. Nginx

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-foundation-installation` | Nginx 定位与运行模型；安装、启动与验证 |
| `02-configuration-routing` | 配置结构与作用域；`server`/`location` 匹配；配置检查与重载 |
| `03-static-content` | 静态文件映射；缓存响应头；单页应用路由 |
| `04-reverse-proxy` | `proxy_pass` 与 URI；代理请求头；超时与 WebSocket |
| `05-load-balancing` | `upstream` 与分发策略；失败转移与健康判断 |
| `06-tls-access-control` | HTTPS 证书配置；访问限制与限流 |
| `07-cache-performance` | 压缩与连接；代理缓存；性能测量与调整 |
| `08-logging-troubleshooting` | 访问与错误日志；请求故障定位；配置回滚 |
| `09-production-practice` | 前后端服务部署；多站点配置；变更与验收 |

## 四、容器与编排

### 1. Docker

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-container-foundation` | 容器与镜像；安装与第一个容器；Docker Engine 运行模型 |
| `02-container-lifecycle` | 创建、启动与停止；资源限制；日志与状态检查 |
| `03-images-dockerfile` | 镜像层；Dockerfile 指令；构建上下文 |
| `04-build-distribution` | 多阶段构建；构建缓存；镜像仓库与版本 |
| `05-networking-storage` | 容器网络与端口；数据卷与挂载；数据备份 |
| `06-compose` | Compose 服务模型；多容器配置；环境与生命周期 |
| `07-security-supply-chain` | 非 root 运行；构建密钥；镜像来源与扫描 |
| `08-operations-troubleshooting` | 启动失败；网络与存储故障；清理与恢复 |

### 2. Kubernetes

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-foundation-environment` | Kubernetes 定位；实验集群；`kubectl` 入门 |
| `02-cluster-api` | 控制平面与节点；API 对象；声明式配置与调谐 |
| `03-pods-workloads` | Pod 生命周期；Deployment；StatefulSet；Job 与 CronJob |
| `04-services-networking` | Service 与集群 DNS；入口流量；NetworkPolicy |
| `05-configuration-storage` | ConfigMap 与 Secret；Volume；PV、PVC 与 StorageClass |
| `06-scheduling-resources` | 请求与限制；节点选择；污点、容忍与调度故障 |
| `07-availability-scaling` | 探针；滚动更新；自动扩缩容；中断预算 |
| `08-security-policy` | ServiceAccount 与 RBAC；Pod 安全约束；集群访问边界 |
| `09-observability-troubleshooting` | Events、日志与资源状态；工作负载排障；节点排障 |
| `10-cluster-operations` | 节点维护；版本升级；集群备份与恢复 |
| `11-helm-packaging` | Chart 结构与模板；Values 管理；Release 升级与回滚 |

Docker 主讲单机容器与镜像；Kubernetes 主讲集群 API 和工作负载。两者只保留各自的基础观察与安全机制，集中监控和跨系统风险治理在后续专题讲解。

## 五、持续交付

### 1. CI/CD

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-delivery-foundation` | 持续集成、交付与部署；流水线和制品流转 |
| `02-git-collaboration` | Git 基础；分支与合并策略；变更触发与代码评审 |
| `03-ci-quality-gates` | 自动化测试；静态检查；安全与质量门禁 |
| `04-build-artifacts` | 可复现构建；制品版本与仓库；来源与完整性 |
| `05-environments-configuration` | 环境隔离；配置和密钥；制品晋级 |
| `06-deployment-strategies` | 滚动、蓝绿与灰度；部署验证；回滚 |
| `07-release-governance` | 审批与审计；发布指标；失败处置 |
| `08-github-actions-practice` | Workflow 与 Runner；缓存和制品；受保护环境发布 |

Git 基础必须达到读者能独立提交、分支、合并和理解流水线触发的深度，不假设仓库已有完整 Git 教程。CI/CD 的主线保持工具无关；GitHub Actions 提供一条具体、可复现的实施链路。

### 2. Jenkins

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-foundation-installation` | Jenkins 定位；安装与初始化；首次安全配置 |
| `02-controller-agents` | Controller 与 Agent；节点、执行器和工作区 |
| `03-jobs-triggers` | Job 与参数；触发器；Freestyle 任务边界 |
| `04-pipeline-jenkinsfile` | Declarative Pipeline；阶段与并行；失败处理 |
| `05-multibranch-libraries` | 多分支流水线；Shared Library；流水线复用 |
| `06-credentials-security` | 凭据作用域；权限控制；构建隔离 |
| `07-delivery-integrations` | Jenkins 构建镜像；部署到 Kubernetes；发布审批接入 |
| `08-administration-scaling` | 插件与配置管理；队列和容量；升级 |
| `09-backup-troubleshooting` | 备份与恢复；构建失败定位；Controller 故障 |

Jenkins 专题只完整主讲产品的作业、流水线、节点和管理机制。质量门禁与发布策略的通用取舍在 CI/CD 专题主讲。

## 六、稳定性治理

### 1. 监控与可观测性

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-foundation` | 监控与可观测性；指标、日志与追踪；采集链路 |
| `02-metrics-prometheus` | 指标与标签；Exporter 与采集；PromQL；记录规则 |
| `03-infrastructure-monitoring` | 主机监控；容器监控；Kubernetes 集群监控 |
| `04-logs` | 结构化日志；日志采集与处理；检索与留存 |
| `05-tracing-opentelemetry` | Span 与上下文传播；应用埋点；Collector 与采样 |
| `06-dashboards-alerting` | Grafana 仪表盘；告警规则；通知路由与降噪 |
| `07-signal-correlation` | 指标、日志与追踪关联；性能剖析；联合排障案例 |
| `08-platform-operations` | 监控平台自监控；基数与存储成本；备份和恢复 |

本模块主讲监控数据从产生到采集、查询、告警和关联排障的完整链路。Linux、Docker、Kubernetes、Nginx 只主讲自身的本地观察入口；告警后的值班响应归 SRE。性能剖析的具体技术和稳定性须在单模块蓝图中根据选定版本进一步核对。

### 2. SRE

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-reliability-foundation` | 可靠性与用户体验；风险和服务边界 |
| `02-sli-slo` | SLI 设计；SLO 设定与测量；SLA 边界 |
| `03-error-budgets` | 错误预算计算；预算与发布决策 |
| `04-oncall-incidents` | 值班交接；事件分级与指挥；沟通和升级 |
| `05-postmortems` | 无责复盘；行动项跟踪；事故趋势 |
| `06-capacity-resilience` | 容量规划；故障演练；灾难恢复目标 |
| `07-toil-automation` | 重复劳动识别；自动化优先级；自动化风险 |
| `08-reliability-practice` | SLO 实践；事故演练；恢复验证 |

### 3. 运维安全

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-security-foundation` | 运维资产与威胁；分层防护 |
| `02-assets-baselines` | 资产清单；配置基线；变更审计 |
| `03-identity-secrets` | 身份与最小权限；密钥生命周期；访问审计 |
| `04-host-network-security` | 主机加固策略；网络边界；远程访问治理 |
| `05-container-k8s-security` | 镜像与运行时风险；集群权限；工作负载策略 |
| `06-supply-chain` | CI/CD 凭据；依赖与制品来源；供应链门禁 |
| `07-vulnerabilities-patching` | 漏洞分级；补丁验证；例外管理 |
| `08-detection-response` | 安全日志与检测；事件遏制；证据保全 |
| `09-security-recovery` | 受影响资产恢复；密钥轮换；恢复后验证 |

SRE 使用监控证据制定目标和组织事故响应，不复制 Prometheus/Grafana 操作教程。运维安全负责跨技术风险与控制措施；产品自身的权限、配置和命令仍由各产品模块主讲。

## 七、自动化与平台

### 1. Ansible

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-foundation-environment` | 控制节点与受管节点；安装与第一次执行 |
| `02-inventory-connectivity` | Inventory；主机分组与连接；动态清单 |
| `03-playbooks-modules` | Play 与 Task；模块和幂等性；执行结果 |
| `04-variables-templates` | 变量优先级；模板；Handlers |
| `05-roles-collections` | Role 结构；Collection；复用与版本 |
| `06-privilege-secrets` | 提权；Vault；敏感输出保护 |
| `07-quality-control` | 语法检查与 Lint；测试；限批与回退 |
| `08-operations-practice` | 主机初始化；配置分发；批量变更与验证 |

### 2. Terraform

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-foundation-workflow` | IaC 与 Terraform；安装；Write–Plan–Apply |
| `02-resources-providers` | HCL 基础；Provider 与 Resource；Data Source |
| `03-inputs-expressions` | 变量与输出；表达式；资源依赖 |
| `04-state-backends` | State 作用；远程存储与锁；状态安全 |
| `05-modules-versions` | Module 设计；Provider 版本；模块复用 |
| `06-drift-refactoring` | 漂移检测；资源导入；地址变更与重构 |
| `07-testing-security` | 格式与校验；`terraform test`；敏感值与策略 |
| `08-team-automation` | Plan 审核；自动化执行；销毁与恢复边界 |

Ansible 管理已存在主机上的期望配置；Terraform 声明资源并通过 State 管理资源身份和变更。两者不合成一个“自动化运维”大全。Terraform 的实践示例要明确资源创建与销毁的成本、权限和回收条件。

### 3. 平台工程

| 章节目录 | 规划文章主题 |
|----------|--------------|
| `01-platform-foundation` | 平台工程定位；平台与基础设施团队边界 |
| `02-platform-product` | 开发者需求；服务目录；平台能力契约 |
| `03-golden-paths` | 标准化路径；项目模板；模板版本演进 |
| `04-self-service` | 开发者门户；环境申请；权限与审批 |
| `05-gitops-argocd` | GitOps 原则；Argo CD 同步与漂移；发布回退 |
| `06-platform-governance` | 策略入口；密钥集成；多租户边界 |
| `07-operations-cost` | 平台可观测性；容量与成本分摊 |
| `08-platform-evolution` | 使用率与开发者体验；平台迁移；能力退役 |

平台工程主讲对内服务、开发者体验与能力组合，不复制 CI/CD、Kubernetes、Ansible、Terraform 或监控的完整操作教程。GitOps 的通用交付含义可在 CI/CD 中最小说明，Argo CD 的具体协调行为在本模块主讲。

## 八、依赖与能力边界

| 能力链路 | 必要前置 | 主要验证结果 |
|----------|----------|--------------|
| 主机与服务运行 | Linux；网络基础；按需 Bash、Nginx | 能启动服务、定位主机与请求链路故障 |
| 容器和集群部署 | Linux；网络基础；Docker 后进入 Kubernetes | 能构建镜像、部署应用并判断工作负载状态 |
| 持续交付 | Git 基础；构建与测试；按需 Docker/Kubernetes | 能使一次变更经过门禁、制品、发布和回退 |
| 生产监控与可靠性 | 运行中服务；监控与可观测性后进入 SRE | 能从告警取得证据、判断目标并组织恢复 |
| 安全治理 | 已理解受保护的主机、容器和交付链路 | 能识别风险、应用控制并验证恢复 |
| 自动化与平台 | Linux；按场景掌握交付、Kubernetes、Ansible 或 Terraform | 能审查自动化变更并提供有边界的自助能力 |

各模块完整知识项清单与逐篇唯一主讲位置在对应模块蓝图中建立；本表只锁定领域级依赖和最终能力，不以目录名称代替覆盖矩阵。

## 九、现有内容与迁移

当前真实目录有七个模块、四十篇文章和七个首页；历史路由基线记录了四十七个运维页面。当前 `operation.js` 配有二百二十七个侧栏链接，其中一百八十个目标不存在。缺失链接是规划意图，不是已发布文章。

| 当前目录或配置 | 新归属 | 处理方式 |
|--------------|--------|----------|
| 已退役的 Linux 旧目录 | `01-linux` | 旧目录删除；新正文按章节重写 |
| `01-shell` | `02-bash-shell` | 同上 |
| 无 | `03-networking` | 新模块，仅在蓝图及样板确认后写正文 |
| `06-nginx` | `04-nginx` | 旧稿保留，新正文按配置职责拆分 |
| `05-docker` | `05-docker` | 即使数字相同，也新建章节目录；旧平铺文章保留 |
| `04-k8s` | `06-kubernetes` | 旧稿保留，新正文按集群对象与能力重写 |
| `03-cicd` | `07-cicd` | 旧稿保留；GitHub Actions 归工具实践章 |
| `02-jenkins` | `08-jenkins` | 旧稿保留；与 CI/CD 通用主题确定唯一主讲 |
| `07-observability-sre` | `09-monitoring-observability`、`10-sre` | 当前仅有规划链接，拆分归属，不迁移正文 |
| `08-security` | `11-operations-security` | 当前仅有规划链接，重新定义职责 |
| `09-automation` | `12-ansible`、`13-terraform`、`14-platform-engineering` | 当前仅有规划链接，按技术对象拆分 |
| `nav.js`、`sidebar/operation.js` | 新导航与新侧栏 | 保留用户现有未提交改动；实施时只调整运维相关片段 |

除已退役的 Linux 旧目录外，正式迁移采用新旧路径并行，不删除其他旧稿，也不立即给其他旧 URL 设置重定向。保留的旧路由仍由旧页面提供，既有锚点不会因跳转到不同标题而失效。新导航不挂载旧稿入口；未来若另行批准退役其他旧页面，必须先逐条核对 URL、锚点和新内容，再使用已有的路由迁移机制。

导航数据区分规划标题和已发布链接。未完成的章节与文章可在侧栏作为纯文本展示，只有真实且验收通过的页面提供链接；顶部导航只链接已存在的领域导读或模块首页。实施时优先复用现有目录生成与导航过滤能力，不依赖缺失链接被运行时静默过滤来表示规划状态。

## 十、实施门禁与验证

| 阶段 | 必须完成 | 本阶段禁止 |
|------|----------|------------|
| 领域设计 | 本文的模块职责、章节方向、旧稿保留与导航策略经确认 | 将规划标题当成已完成正文 |
| 单模块蓝图 | 锁定主版本和官方来源、知识项、必要依赖、逐篇职责卡、覆盖矩阵、样板选择 | 只凭本文批量创建正文 |
| 样板校准 | 代表性文章的示例实际验证并经用户确认 | 样板未通过就展开整章 |
| 逐章实施 | 新正文逐篇验收，核对重复主讲、链接、侧栏和旧路由 | 删除旧稿或加入空链接 |
| 整体验收 | 运行目录与链接测试、运维构建单元、站点组装和历史路由检查 | 以文件数或目录外观宣称教学完成 |

计划使用仓库现有的 `pnpm docs:test`、`pnpm docs:build:unit`、`pnpm docs:assemble`、`pnpm docs:routes:check` 和目录检查脚本；具体参数与构建范围在实施计划中核对。现有工作区有大量非本任务改动，实施与验证必须保留它们，不自动提交、推送或部署。

## 十一、事实来源与版本闭合

| 范围 | 官方资料入口 | 本设计采用的边界 |
|------|--------------|------------------|
| Linux 主机 | [Ubuntu Server 文档](https://ubuntu.com/server/docs/) | 系统、软件、网络、安全和存储分属不同能力 |
| Bash | [GNU Bash 手册](https://www.gnu.org/software/bash/manual/) | 脚本运行、展开、控制流与信号以 Bash 行为为准 |
| Docker | [Docker Engine 文档](https://docs.docker.com/engine/) | Engine 管理镜像、容器、网络与卷 |
| Kubernetes | [Kubernetes Concepts](https://kubernetes.io/docs/concepts/) | API、工作负载、网络、存储、安全和集群管理 |
| Nginx | [Nginx Beginner's Guide](https://nginx.org/en/docs/beginners_guide.html) | 配置作用域、静态服务、代理和进程控制 |
| Jenkins | [Jenkins Handbook](https://www.jenkins.io/doc/book/) | Pipeline、Agent、安全与系统管理 |
| CI/CD | [GitHub Actions 文档](https://docs.github.com/en/actions) | 工具实践与通用交付原则分开 |
| 监控 | [Prometheus 文档](https://prometheus.io/docs/introduction/overview/)、[OpenTelemetry 文档](https://opentelemetry.io/docs/concepts/) | 指标与告警、遥测信号和关联链路分工 |
| SRE | [Google SRE Book](https://sre.google/sre-book/service-level-objectives/) | SLI、SLO 和可靠性决策，不替代监控工具教程 |
| 运维安全 | [NIST CSF 2.0](https://www.nist.gov/cyberframework) | 风险治理、保护、检测、响应与恢复 |
| Ansible | [Ansible 入门文档](https://docs.ansible.com/projects/ansible/latest/getting_started/index.html) | Inventory、Playbook 与受管节点期望状态 |
| Terraform | [Terraform 文档](https://developer.hashicorp.com/terraform/docs) | 资源配置、模块、工作流与 State |
| 平台工程 | [Argo CD 文档](https://argo-cd.readthedocs.io/en/stable/) | GitOps 产品接入只占平台能力的一部分 |
| DevOps | [Microsoft DevOps 概览](https://learn.microsoft.com/en-us/devops/what-is-devops) | 人员、流程与技术贯通应用生命周期 |

本设计锁定知识归属，不假定上述文档当前默认版本就是未来示例版本。各模块蓝图必须选择一个明确主版本及运行环境，核对当时官方发布和兼容矩阵，再确定示例、版本差异与实际验证入口。没有这个结论的模块不得进入正文阶段。

## 十二、设计自检

| 检查 | 结果 |
|------|------|
| 范围与数量 | 十四个技术模块加一个领域导读；DevOps 不重复成第十五模块 |
| 学习顺序 | 主机与网络先于服务、容器和交付；监控先于 SRE 决策；平台工程最后整合 |
| 重复归属 | 产品机制留在产品模块，通用交付、监控、可靠性和跨系统安全各有主讲 |
| 新旧路径 | 旧稿、旧 URL 和锚点保留；新路径只在正文验收后开放 |
| 真实状态 | 规划主题未写成正文；版本、职责卡和覆盖矩阵由单模块蓝图闭合 |
| 工作区保护 | 本设计不触碰用户当前未提交的导航、旧文章和路由迁移表 |
