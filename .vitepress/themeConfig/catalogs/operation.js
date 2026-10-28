// 已确认的运维与 DevOps 模块、章节和文章规划。
// 首篇允许使用明确标注状态的占位页承接专题导航；其他文章通过验收后再设置 publishedLink。
const operationModuleDefinitions = [
  {
    id: 'OPS01',
    title: 'Linux',
    path: '/operation/01-linux',
    navigationGroup: '系统与网络',
    description: '从零学习 Linux 主机、服务、存储、网络与安全管理，并建立基于证据的故障排查能力。',
    chapters: [
      { title: '系统与实验环境', directory: '01-system-foundation', responsibility: '建立 Linux、发行版与服务器的基本模型，并准备可恢复的隔离实验环境。', articles: [['Linux 与发行版', '01-linux-distribution.md', '/operation/01-linux/01-system-foundation/01-linux-distribution.md'], ['安装隔离实验环境', '02-install-lab.md', '/operation/01-linux/01-system-foundation/02-install-lab.md'], ['终端与命令帮助', '03-terminal-help.md', '/operation/01-linux/01-system-foundation/03-terminal-help.md']] },
      { title: '文件与目录', directory: '02-filesystem-operations', responsibility: '理解路径和文件系统，在受控目录中完成文件操作、查找与文本修改。', articles: [['文件系统与路径', '01-paths-filesystem.md', '/operation/01-linux/02-filesystem-operations/01-paths-filesystem.md'], ['文件操作与查找', '02-file-operations.md', '/operation/01-linux/02-filesystem-operations/02-file-operations.md'], ['文本查看与编辑', '03-text-inspection-editing.md', '/operation/01-linux/02-filesystem-operations/03-text-inspection-editing.md']] },
      { title: '用户与权限', directory: '03-users-permissions', responsibility: '管理本地身份，并根据所有者、用户组和权限位解释访问结果。', articles: [['用户与用户组', '01-users-groups.md', '/operation/01-linux/03-users-permissions/01-users-groups.md'], ['文件与目录权限', '02-file-permissions.md', '/operation/01-linux/03-users-permissions/02-file-permissions.md'], ['sudo 与权限边界', '03-sudo-boundary.md', '/operation/01-linux/03-users-permissions/03-sudo-boundary.md']] },
      { title: '进程与服务', directory: '04-processes-systemd', responsibility: '识别进程状态，管理 systemd 服务，并从本地日志定位启动故障。', articles: [['进程与信号', '01-process-signals.md', '/operation/01-linux/04-processes-systemd/01-process-signals.md'], ['systemd 服务管理', '02-systemd-services.md', '/operation/01-linux/04-processes-systemd/02-systemd-services.md'], ['系统日志与 journalctl', '03-journalctl.md', '/operation/01-linux/04-processes-systemd/03-journalctl.md']] },
      { title: '软件与周期任务', directory: '05-software-scheduled-jobs', responsibility: '管理软件包、计划任务和文件日志保留，并验证每次变更的实际结果。', articles: [['软件包管理', '01-package-management.md', '/operation/01-linux/05-software-scheduled-jobs/01-package-management.md'], ['定时任务', '02-scheduled-jobs.md', '/operation/01-linux/05-software-scheduled-jobs/02-scheduled-jobs.md'], ['日志轮转', '03-log-rotation.md', '/operation/01-linux/05-software-scheduled-jobs/03-log-rotation.md']] },
      { title: '存储与恢复', directory: '06-storage-backup', responsibility: '理解设备、文件系统和挂载关系，区分容量问题并实际验证恢复。', articles: [['磁盘与挂载', '01-disks-mounts.md', '/operation/01-linux/06-storage-backup/01-disks-mounts.md'], ['容量与文件系统', '02-capacity-filesystems.md', '/operation/01-linux/06-storage-backup/02-capacity-filesystems.md'], ['备份与恢复', '03-backup-restore.md', '/operation/01-linux/06-storage-backup/03-backup-restore.md']] },
      { title: '主机网络', directory: '07-host-networking', responsibility: '读取和调整主机网络状态，检查连接、解析和本机入口控制。', articles: [['主机网络配置', '01-host-configuration.md', '/operation/01-linux/07-host-networking/01-host-configuration.md'], ['连接与 DNS 检查', '02-connectivity-dns.md', '/operation/01-linux/07-host-networking/02-connectivity-dns.md'], ['主机防火墙', '03-host-firewall.md', '/operation/01-linux/07-host-networking/03-host-firewall.md']] },
      { title: '主机安全', directory: '08-host-security', responsibility: '保护远程访问，管理安全更新，并识别登录、提权和变更的审计线索。', articles: [['SSH 访问', '01-ssh-access.md', '/operation/01-linux/08-host-security/01-ssh-access.md'], ['安全更新与基线', '02-security-updates.md', '/operation/01-linux/08-host-security/02-security-updates.md'], ['主机审计线索', '03-host-audit.md', '/operation/01-linux/08-host-security/03-host-audit.md']] },
      { title: '主机故障排查', directory: '09-troubleshooting', responsibility: '按资源、磁盘、服务和网络证据分层定位常见主机故障。', articles: [['CPU 与内存异常', '01-cpu-memory.md', '/operation/01-linux/09-troubleshooting/01-cpu-memory.md'], ['磁盘与 I/O 异常', '02-disk-io.md', '/operation/01-linux/09-troubleshooting/02-disk-io.md'], ['服务与网络故障', '03-service-network.md', '/operation/01-linux/09-troubleshooting/03-service-network.md']] },
    ],
  },
  {
    id: 'OPS02',
    title: 'Bash 与 Shell',
    path: '/operation/02-bash-shell',
    navigationGroup: '系统与网络',
    description: '理解 Bash 的执行、展开和状态传播，编写可检查、可测试、可恢复的自动化脚本。',
    chapters: [
      { title: 'Bash 与脚本入口', directory: '01-shell-foundation', responsibility: '理解 Bash 如何执行命令，并正确创建和运行第一个脚本。', articles: [['Bash 与 Shell', '01-bash-shell.md', '/operation/02-bash-shell/01-shell-foundation/01-bash-shell.md'], ['第一个 Bash 脚本', '02-first-script.md'], ['引用与命令展开', '03-quoting-expansion.md']] },
      { title: '变量与参数', directory: '02-variables-parameters', responsibility: '让脚本安全接收、保存和传递参数、环境变量与多值数据。', articles: [['变量与参数展开', '01-variables-expansion.md'], ['脚本参数与退出状态', '02-arguments-status.md'], ['Bash 数组', '03-arrays.md']] },
      { title: '条件与循环', directory: '03-control-flow', responsibility: '使用命令状态、条件和有界迭代控制脚本流程。', articles: [['条件判断', '01-conditions.md'], ['循环与模式匹配', '02-loops-case.md']] },
      { title: '函数与组合', directory: '04-functions-composition', responsibility: '拆分脚本职责，控制变量作用域和文件加载副作用。', articles: [['函数与作用域', '01-functions-scope.md'], ['脚本拆分与加载', '02-script-composition.md']] },
      { title: '管道与文本', directory: '05-pipelines-text', responsibility: '组合标准流，并在明确的数据边界下完成匹配、变换、聚合和逐行读取。', articles: [['重定向与管道', '01-redirection-pipelines.md'], ['grep 文本匹配', '02-grep.md'], ['sed 文本变换', '03-sed.md'], ['awk 字段聚合', '04-awk-fields.md'], ['Bash 逐行读取', '05-read-records.md']] },
      { title: '进程与信号', directory: '06-processes-signals', responsibility: '等待后台任务、传播退出状态，并在中断时只清理脚本创建的资源。', articles: [['子进程与后台任务', '01-child-processes.md'], ['信号与 trap', '02-signals-trap.md']] },
      { title: '质量与安全', directory: '07-quality-security', responsibility: '验证脚本的失败路径、静态问题、输入边界和凭据暴露风险。', articles: [['Bash 错误处理', '01-error-handling.md', '/operation/02-bash-shell/07-quality-security/01-error-handling.md'], ['脚本测试与 ShellCheck', '02-testing-shellcheck.md'], ['输入与凭据边界', '03-input-secrets.md']] },
      { title: '自动化实践', directory: '08-automation-practice', responsibility: '在隔离数据上完成日志分析、巡检和可恢复备份三个脚本闭环。', articles: [['日志分析脚本', '01-log-analysis.md'], ['巡检脚本', '02-inspection.md'], ['备份与恢复脚本', '03-backup-restore.md']] },
    ],
  },
  {
    id: 'OPS03',
    title: '网络基础',
    path: '/operation/03-networking',
    navigationGroup: '系统与网络',
    description: '理解从主机接口到应用请求的网络链路，并能按 DNS、TCP、TLS 与访问控制分层排障。',
    chapters: [
      { title: '网络模型', directory: '01-network-model', responsibility: '建立网络分层、接口、地址和端口之间的关系。', articles: [['网络分层与数据传输', '01-layered-data-transfer.md', '/operation/03-networking/01-network-model/01-layered-data-transfer.md'], ['接口、地址与端口', '02-interfaces-addresses-ports.md']] },
      { title: 'IP 与路由', directory: '02-ip-routing', responsibility: '理解 IP 地址、子网、路由表和网关如何决定数据去向。', articles: [['IPv4、IPv6 与子网', '01-ip-subnetting.md'], ['路由与网关', '02-routing-gateways.md']] },
      { title: '传输与连接', directory: '03-transport-connections', responsibility: '理解 TCP、UDP 的差异，观察连接状态并取得基础抓包证据。', articles: [['TCP 连接与状态', '01-tcp-connections.md'], ['UDP 通信', '02-udp.md'], ['抓包基础', '03-packet-capture.md']] },
      { title: 'DNS', directory: '04-dns', responsibility: '解释域名解析链路、记录和缓存，并定位常见解析故障。', articles: [['域名解析链路', '01-resolution-path.md'], ['DNS 记录与缓存', '02-records-cache.md'], ['DNS 解析故障', '03-dns-troubleshooting.md']] },
      { title: 'HTTP 与 TLS', directory: '05-http-tls', responsibility: '理解 HTTP 报文、HTTPS 证书与连接超时的发生位置。', articles: [['HTTP 请求与响应', '01-http-messages.md'], ['HTTPS 与证书', '02-https-certificates.md'], ['连接超时', '03-connection-timeouts.md']] },
      { title: '防火墙与 NAT', directory: '06-firewalls-nat', responsibility: '理解包过滤、地址转换和访问控制对连接链路的影响。', articles: [['包过滤', '01-packet-filtering.md'], ['NAT', '02-nat.md'], ['访问控制排查', '03-access-control-troubleshooting.md']] },
      { title: '代理与负载均衡', directory: '07-proxy-balancing', responsibility: '区分正向代理、反向代理和常见负载均衡模型。', articles: [['正向代理与反向代理', '01-forward-reverse-proxy.md'], ['负载均衡模型', '02-load-balancing-models.md']] },
      { title: '网络诊断', directory: '08-network-diagnostics', responsibility: '用分层方法定位连通性、解析、握手和应用入口问题。', articles: [['连通性定位', '01-connectivity.md'], ['DNS、TCP 与 TLS 分层诊断', '02-layered-diagnostics.md'], ['抓包排障案例', '03-packet-capture-case.md']] },
    ],
  },
  {
    id: 'OPS04',
    title: 'Nginx',
    path: '/operation/04-nginx',
    navigationGroup: '系统与网络',
    description: '配置和维护 Nginx 静态服务、反向代理、负载均衡、TLS 与入口流量。',
    chapters: [
      { title: '基础与安装', directory: '01-foundation-installation', responsibility: '理解 Nginx 的定位和运行模型，完成安装、启动与首次验证。', articles: [['Nginx 定位与运行模型', '01-runtime-model.md', '/operation/04-nginx/01-foundation-installation/01-runtime-model.md'], ['安装、启动与验证', '02-install-start-verify.md']] },
      { title: '配置与路由', directory: '02-configuration-routing', responsibility: '理解配置作用域和请求匹配，并在重载前验证配置。', articles: [['配置结构与作用域', '01-configuration-scope.md'], ['server 与 location 匹配', '02-server-location-matching.md'], ['配置检查与重载', '03-validation-reload.md']] },
      { title: '静态内容', directory: '03-static-content', responsibility: '发布静态文件，设置缓存响应头，并处理单页应用回退路由。', articles: [['静态文件映射', '01-static-file-mapping.md'], ['缓存响应头', '02-cache-headers.md'], ['单页应用路由', '03-spa-routing.md']] },
      { title: '反向代理', directory: '04-reverse-proxy', responsibility: '正确处理代理 URI、请求头、超时和 WebSocket 连接。', articles: [['proxy_pass 与 URI', '01-proxy-pass-uri.md'], ['代理请求头', '02-proxy-headers.md'], ['超时与 WebSocket', '03-timeouts-websocket.md']] },
      { title: '负载均衡', directory: '05-load-balancing', responsibility: '配置 upstream 分发，并理解失败转移与健康判断边界。', articles: [['upstream 与分发策略', '01-upstream-strategies.md'], ['失败转移与健康判断', '02-failover-health.md']] },
      { title: 'TLS 与访问控制', directory: '06-tls-access-control', responsibility: '配置 HTTPS 证书、访问限制和请求限流。', articles: [['HTTPS 证书配置', '01-https-certificates.md'], ['访问限制与限流', '02-access-rate-limits.md']] },
      { title: '缓存与性能', directory: '07-cache-performance', responsibility: '使用压缩、连接和代理缓存，并通过测量判断优化效果。', articles: [['压缩与连接', '01-compression-connections.md'], ['代理缓存', '02-proxy-cache.md'], ['性能测量与调整', '03-performance-tuning.md']] },
      { title: '日志与排障', directory: '08-logging-troubleshooting', responsibility: '关联访问日志、错误日志和请求现象，并能回滚错误配置。', articles: [['访问日志与错误日志', '01-access-error-logs.md'], ['请求故障定位', '02-request-troubleshooting.md'], ['配置回滚', '03-configuration-rollback.md']] },
      { title: '生产实践', directory: '09-production-practice', responsibility: '组织前后端、多站点的可维护配置，并建立变更验收流程。', articles: [['前后端服务部署', '01-frontend-backend-deployment.md'], ['多站点配置', '02-multi-site.md'], ['变更与验收', '03-change-validation.md']] },
    ],
  },
  {
    id: 'OPS05',
    title: 'Docker',
    path: '/operation/05-docker',
    navigationGroup: '容器与编排',
    description: '构建镜像并运行、连接、持久化和维护单机容器，处理安全与供应链边界。',
    chapters: [
      { title: '容器基础', directory: '01-container-foundation', responsibility: '理解容器、镜像与 Docker Engine，并运行第一个容器。', articles: [['容器与镜像', '01-containers-images.md', '/operation/05-docker/01-container-foundation/01-containers-images.md'], ['安装与第一个容器', '02-install-first-container.md'], ['Docker Engine 运行模型', '03-engine-runtime.md']] },
      { title: '容器生命周期', directory: '02-container-lifecycle', responsibility: '创建、启停和观察容器，并限制其计算资源。', articles: [['创建、启动与停止', '01-create-start-stop.md'], ['资源限制', '02-resource-limits.md'], ['日志与状态检查', '03-logs-status.md']] },
      { title: '镜像与 Dockerfile', directory: '03-images-dockerfile', responsibility: '理解镜像层、Dockerfile 指令和构建上下文。', articles: [['镜像层', '01-image-layers.md'], ['Dockerfile 指令', '02-dockerfile-instructions.md'], ['构建上下文', '03-build-context.md']] },
      { title: '构建与分发', directory: '04-build-distribution', responsibility: '优化镜像构建并使用仓库和版本标识分发镜像。', articles: [['多阶段构建', '01-multi-stage-builds.md'], ['构建缓存', '02-build-cache.md'], ['镜像仓库与版本', '03-registry-versioning.md']] },
      { title: '网络与存储', directory: '05-networking-storage', responsibility: '连接容器、暴露端口并使用卷或挂载持久化数据。', articles: [['容器网络与端口', '01-container-networking-ports.md'], ['数据卷与挂载', '02-volumes-mounts.md'], ['容器数据备份', '03-data-backup.md']] },
      { title: 'Compose', directory: '06-compose', responsibility: '使用 Compose 描述多容器服务、环境和生命周期。', articles: [['Compose 服务模型', '01-service-model.md'], ['多容器配置', '02-multi-container-configuration.md'], ['环境与生命周期', '03-environments-lifecycle.md']] },
      { title: '安全与供应链', directory: '07-security-supply-chain', responsibility: '降低运行权限，保护构建密钥，并检查镜像来源与漏洞。', articles: [['非 root 运行', '01-non-root.md'], ['构建密钥', '02-build-secrets.md'], ['镜像来源与扫描', '03-image-provenance-scanning.md']] },
      { title: '运维与排障', directory: '08-operations-troubleshooting', responsibility: '定位启动、网络和存储故障，并在明确边界下清理和恢复。', articles: [['容器启动失败', '01-startup-failures.md'], ['网络与存储故障', '02-network-storage-failures.md'], ['清理与恢复', '03-cleanup-recovery.md']] },
    ],
  },
  {
    id: 'OPS06',
    title: 'Kubernetes',
    path: '/operation/06-kubernetes',
    navigationGroup: '容器与编排',
    description: '通过 Kubernetes API 声明、部署、保护和诊断集群工作负载。',
    chapters: [
      { title: '基础与环境', directory: '01-foundation-environment', responsibility: '理解 Kubernetes 的定位，准备实验集群并掌握 kubectl 基础。', articles: [['Kubernetes 定位', '01-kubernetes-positioning.md', '/operation/06-kubernetes/01-foundation-environment/01-kubernetes-positioning.md'], ['实验集群', '02-lab-cluster.md'], ['kubectl 入门', '03-kubectl-basics.md']] },
      { title: '集群与 API', directory: '02-cluster-api', responsibility: '理解控制平面、节点、API 对象和声明式调谐。', articles: [['控制平面与节点', '01-control-plane-nodes.md'], ['API 对象', '02-api-objects.md'], ['声明式配置与调谐', '03-declarative-reconciliation.md']] },
      { title: 'Pod 与工作负载', directory: '03-pods-workloads', responsibility: '根据任务的状态和生命周期选择并管理工作负载对象。', articles: [['Pod 生命周期', '01-pod-lifecycle.md'], ['Deployment', '02-deployment.md'], ['StatefulSet', '03-statefulset.md'], ['Job 与 CronJob', '04-jobs-cronjobs.md']] },
      { title: '服务与网络', directory: '04-services-networking', responsibility: '暴露服务、解析集群名称并控制工作负载间网络访问。', articles: [['Service 与集群 DNS', '01-services-dns.md'], ['入口流量', '02-ingress-traffic.md'], ['NetworkPolicy', '03-network-policy.md']] },
      { title: '配置与存储', directory: '05-configuration-storage', responsibility: '注入配置与密钥，并为有状态工作负载提供持久存储。', articles: [['ConfigMap 与 Secret', '01-configmap-secret.md'], ['Volume', '02-volumes.md'], ['PV、PVC 与 StorageClass', '03-persistent-storage.md']] },
      { title: '调度与资源', directory: '06-scheduling-resources', responsibility: '声明资源需求，影响节点选择并诊断调度失败。', articles: [['请求与限制', '01-requests-limits.md'], ['节点选择', '02-node-selection.md'], ['污点、容忍与调度故障', '03-taints-tolerations.md']] },
      { title: '可用性与扩缩容', directory: '07-availability-scaling', responsibility: '通过探针、更新策略、扩缩容和中断预算保护服务可用性。', articles: [['探针', '01-probes.md'], ['滚动更新', '02-rolling-updates.md'], ['自动扩缩容', '03-autoscaling.md'], ['中断预算', '04-disruption-budgets.md']] },
      { title: '安全与策略', directory: '08-security-policy', responsibility: '管理工作负载身份、授权和 Pod 安全边界。', articles: [['ServiceAccount 与 RBAC', '01-serviceaccount-rbac.md'], ['Pod 安全约束', '02-pod-security.md'], ['集群访问边界', '03-cluster-access.md']] },
      { title: '可观测性与排障', directory: '09-observability-troubleshooting', responsibility: '使用事件、日志和资源状态定位工作负载及节点故障。', articles: [['Events、日志与资源状态', '01-events-logs-status.md'], ['工作负载排障', '02-workload-troubleshooting.md'], ['节点排障', '03-node-troubleshooting.md']] },
      { title: '集群运维', directory: '10-cluster-operations', responsibility: '执行节点维护、版本升级以及集群备份与恢复。', articles: [['节点维护', '01-node-maintenance.md'], ['版本升级', '02-version-upgrades.md'], ['集群备份与恢复', '03-cluster-backup-restore.md']] },
      { title: 'Helm 与打包', directory: '11-helm-packaging', responsibility: '使用 Chart、Values 和 Release 管理应用包及其升级回滚。', articles: [['Chart 结构与模板', '01-chart-templates.md'], ['Values 管理', '02-values-management.md'], ['Release 升级与回滚', '03-release-upgrade-rollback.md']] },
    ],
  },
  {
    id: 'OPS07',
    title: 'CI/CD',
    path: '/operation/07-cicd',
    navigationGroup: '持续交付',
    description: '设计工具无关的质量门禁、制品、环境、发布与回退链路，并用 GitHub Actions 完成实践。',
    chapters: [
      { title: '交付基础', directory: '01-delivery-foundation', responsibility: '区分持续集成、交付与部署，并理解流水线中的制品流转。', articles: [['持续集成、交付与部署', '01-ci-delivery-deployment.md', '/operation/07-cicd/01-delivery-foundation/01-ci-delivery-deployment.md'], ['流水线与制品流转', '02-pipeline-artifact-flow.md']] },
      { title: 'Git 协作', directory: '02-git-collaboration', responsibility: '掌握流水线所需的 Git 提交、分支、合并与评审协作。', articles: [['Git 基础', '01-git-basics.md'], ['分支与合并策略', '02-branching-merging.md'], ['变更触发与代码评审', '03-triggers-code-review.md']] },
      { title: 'CI 与质量门禁', directory: '03-ci-quality-gates', responsibility: '组合测试、静态检查与安全门禁，阻止不合格变更继续流转。', articles: [['自动化测试', '01-automated-testing.md'], ['静态检查', '02-static-analysis.md'], ['安全与质量门禁', '03-security-quality-gates.md']] },
      { title: '构建与制品', directory: '04-build-artifacts', responsibility: '形成可复现构建，并管理制品版本、来源和完整性。', articles: [['可复现构建', '01-reproducible-builds.md'], ['制品版本与仓库', '02-artifact-versioning-repositories.md'], ['来源与完整性', '03-provenance-integrity.md']] },
      { title: '环境与配置', directory: '05-environments-configuration', responsibility: '隔离环境、保护配置和密钥，并使同一制品逐级晋级。', articles: [['环境隔离', '01-environment-isolation.md'], ['配置与密钥', '02-configuration-secrets.md'], ['制品晋级', '03-artifact-promotion.md']] },
      { title: '部署策略', directory: '06-deployment-strategies', responsibility: '选择滚动、蓝绿或灰度策略，并建立部署验证与回滚条件。', articles: [['滚动、蓝绿与灰度', '01-rollout-strategies.md'], ['部署验证', '02-deployment-verification.md'], ['回滚', '03-rollback.md']] },
      { title: '发布治理', directory: '07-release-governance', responsibility: '管理审批和审计，以发布指标判断结果并处置失败。', articles: [['审批与审计', '01-approvals-auditing.md'], ['发布指标', '02-release-metrics.md'], ['发布失败处置', '03-release-failure-response.md']] },
      { title: 'GitHub Actions 实践', directory: '08-github-actions-practice', responsibility: '使用 Workflow、Runner、缓存、制品和受保护环境实现一条完整交付链路。', articles: [['Workflow 与 Runner', '01-workflow-runners.md'], ['缓存与制品', '02-cache-artifacts.md'], ['受保护环境发布', '03-protected-environment-deployment.md']] },
    ],
  },
  {
    id: 'OPS08',
    title: 'Jenkins',
    path: '/operation/08-jenkins',
    navigationGroup: '持续交付',
    description: '使用并管理 Jenkins Job、Pipeline、Agent、凭据、插件与控制器。',
    chapters: [
      { title: '基础与安装', directory: '01-foundation-installation', responsibility: '理解 Jenkins 定位，完成安装、初始化和首次安全配置。', articles: [['Jenkins 定位', '01-jenkins-positioning.md', '/operation/08-jenkins/01-foundation-installation/01-jenkins-positioning.md'], ['安装与初始化', '02-install-initialize.md'], ['首次安全配置', '03-initial-security.md']] },
      { title: 'Controller 与 Agent', directory: '02-controller-agents', responsibility: '理解控制器、节点、执行器和工作区的运行边界。', articles: [['Controller 与 Agent', '01-controller-agent.md'], ['节点与执行器', '02-nodes-executors.md'], ['工作区', '03-workspaces.md']] },
      { title: 'Job 与触发器', directory: '03-jobs-triggers', responsibility: '配置参数化 Job 和触发方式，并理解 Freestyle 的适用边界。', articles: [['Job 与参数', '01-jobs-parameters.md'], ['触发器', '02-triggers.md'], ['Freestyle 任务边界', '03-freestyle-boundaries.md']] },
      { title: 'Pipeline 与 Jenkinsfile', directory: '04-pipeline-jenkinsfile', responsibility: '使用 Declarative Pipeline 描述阶段、并行和失败处理。', articles: [['Declarative Pipeline', '01-declarative-pipeline.md'], ['阶段与并行', '02-stages-parallel.md'], ['失败处理', '03-failure-handling.md']] },
      { title: '多分支与共享库', directory: '05-multibranch-libraries', responsibility: '管理多分支流水线，并通过 Shared Library 复用可信逻辑。', articles: [['多分支流水线', '01-multibranch-pipeline.md'], ['Shared Library', '02-shared-library.md'], ['流水线复用', '03-pipeline-reuse.md']] },
      { title: '凭据与安全', directory: '06-credentials-security', responsibility: '控制凭据作用域、用户权限和构建隔离。', articles: [['凭据作用域', '01-credential-scopes.md'], ['权限控制', '02-authorization.md'], ['构建隔离', '03-build-isolation.md']] },
      { title: '交付集成', directory: '07-delivery-integrations', responsibility: '用 Jenkins 构建镜像、部署 Kubernetes 并接入发布审批。', articles: [['Jenkins 构建镜像', '01-build-container-images.md'], ['部署到 Kubernetes', '02-deploy-kubernetes.md'], ['发布审批接入', '03-release-approvals.md']] },
      { title: '管理与扩展', directory: '08-administration-scaling', responsibility: '管理插件和配置，观察队列容量并执行可回退升级。', articles: [['插件与配置管理', '01-plugins-configuration.md'], ['队列与容量', '02-queue-capacity.md'], ['Jenkins 升级', '03-upgrades.md']] },
      { title: '备份与排障', directory: '09-backup-troubleshooting', responsibility: '验证备份恢复，并定位构建失败和控制器故障。', articles: [['备份与恢复', '01-backup-restore.md'], ['构建失败定位', '02-build-failure-troubleshooting.md'], ['Controller 故障', '03-controller-failures.md']] },
    ],
  },
  {
    id: 'OPS09',
    title: '监控与可观测性',
    path: '/operation/09-monitoring-observability',
    navigationGroup: '稳定性治理',
    description: '采集、查询、告警并关联指标、日志和追踪，形成从信号到排障证据的完整链路。',
    chapters: [
      { title: '可观测性基础', directory: '01-foundation', responsibility: '区分监控与可观测性，理解三类信号和数据采集链路。', articles: [['监控与可观测性', '01-monitoring-observability.md', '/operation/09-monitoring-observability/01-foundation/01-monitoring-observability.md'], ['指标、日志与追踪', '02-signals.md'], ['采集链路', '03-collection-pipeline.md']] },
      { title: '指标与 Prometheus', directory: '02-metrics-prometheus', responsibility: '设计指标和标签，完成 Prometheus 采集、查询与记录规则。', articles: [['指标与标签', '01-metrics-labels.md'], ['Exporter 与采集', '02-exporters-scraping.md'], ['PromQL', '03-promql.md'], ['记录规则', '04-recording-rules.md']] },
      { title: '基础设施监控', directory: '03-infrastructure-monitoring', responsibility: '建立主机、容器和 Kubernetes 集群的基础监控。', articles: [['主机监控', '01-host-monitoring.md'], ['容器监控', '02-container-monitoring.md'], ['Kubernetes 集群监控', '03-kubernetes-monitoring.md']] },
      { title: '日志', directory: '04-logs', responsibility: '生成和采集结构化日志，并管理检索与留存边界。', articles: [['结构化日志', '01-structured-logging.md'], ['日志采集与处理', '02-log-collection-processing.md'], ['日志检索与留存', '03-search-retention.md']] },
      { title: '追踪与 OpenTelemetry', directory: '05-tracing-opentelemetry', responsibility: '理解 Span 和上下文传播，完成埋点、Collector 和采样配置。', articles: [['Span 与上下文传播', '01-spans-context.md'], ['应用埋点', '02-instrumentation.md'], ['OpenTelemetry Collector', '03-collector.md'], ['追踪采样', '04-sampling.md']] },
      { title: '仪表盘与告警', directory: '06-dashboards-alerting', responsibility: '设计可行动的仪表盘和告警，并通过路由与降噪降低干扰。', articles: [['Grafana 仪表盘', '01-grafana-dashboards.md'], ['告警规则', '02-alert-rules.md'], ['通知路由与降噪', '03-notification-routing.md']] },
      { title: '信号关联', directory: '07-signal-correlation', responsibility: '关联指标、日志、追踪和性能剖析证据完成联合排障。', articles: [['指标、日志与追踪关联', '01-signal-correlation.md'], ['性能剖析', '02-profiling.md'], ['联合排障案例', '03-joint-troubleshooting.md']] },
      { title: '平台运维', directory: '08-platform-operations', responsibility: '监控监控平台自身，并治理高基数、存储成本与数据恢复。', articles: [['监控平台自监控', '01-self-monitoring.md'], ['基数与存储成本', '02-cardinality-storage-cost.md'], ['备份与恢复', '03-backup-recovery.md']] },
    ],
  },
  {
    id: 'OPS10',
    title: 'SRE',
    path: '/operation/10-sre',
    navigationGroup: '稳定性治理',
    description: '设定可靠性目标，并用错误预算、值班、事故复盘、容量和自动化治理生产风险。',
    chapters: [
      { title: '可靠性基础', directory: '01-reliability-foundation', responsibility: '从用户体验和服务边界理解可靠性及风险。', articles: [['可靠性与用户体验', '01-reliability-user-experience.md', '/operation/10-sre/01-reliability-foundation/01-reliability-user-experience.md'], ['风险与服务边界', '02-risk-service-boundaries.md']] },
      { title: 'SLI、SLO 与 SLA', directory: '02-sli-slo', responsibility: '设计可测量的 SLI，设定 SLO 并明确 SLA 的外部承诺边界。', articles: [['SLI 设计', '01-sli-design.md'], ['SLO 设定与测量', '02-slo-measurement.md'], ['SLA 边界', '03-sla-boundaries.md']] },
      { title: '错误预算', directory: '03-error-budgets', responsibility: '计算错误预算，并将消耗状态用于发布和风险决策。', articles: [['错误预算计算', '01-error-budget-calculation.md'], ['预算与发布决策', '02-budget-release-decisions.md']] },
      { title: '值班与事故', directory: '04-oncall-incidents', responsibility: '组织值班交接、事件分级、指挥、沟通与升级。', articles: [['值班交接', '01-oncall-handover.md'], ['事件分级与指挥', '02-incident-command.md'], ['沟通与升级', '03-communication-escalation.md']] },
      { title: '事故复盘', directory: '05-postmortems', responsibility: '开展无责复盘，跟踪行动项并从事故趋势改进系统。', articles: [['无责复盘', '01-blameless-postmortems.md'], ['行动项跟踪', '02-action-items.md'], ['事故趋势', '03-incident-trends.md']] },
      { title: '容量与韧性', directory: '06-capacity-resilience', responsibility: '规划容量，演练故障，并定义和验证灾难恢复目标。', articles: [['容量规划', '01-capacity-planning.md'], ['故障演练', '02-failure-exercises.md'], ['灾难恢复目标', '03-disaster-recovery-objectives.md']] },
      { title: '重复劳动与自动化', directory: '07-toil-automation', responsibility: '识别重复劳动，确定自动化优先级并控制自动化风险。', articles: [['重复劳动识别', '01-toil-identification.md'], ['自动化优先级', '02-automation-prioritization.md'], ['自动化风险', '03-automation-risks.md']] },
      { title: '可靠性实践', directory: '08-reliability-practice', responsibility: '将 SLO、事故演练和恢复验证组合为可复现的可靠性闭环。', articles: [['SLO 实践', '01-slo-practice.md'], ['事故演练', '02-incident-exercise.md'], ['恢复验证', '03-recovery-verification.md']] },
    ],
  },
  {
    id: 'OPS11',
    title: '运维安全',
    path: '/operation/11-operations-security',
    navigationGroup: '稳定性治理',
    description: '治理跨主机、网络、容器、集群与交付链路的身份、供应链、漏洞和响应风险。',
    chapters: [
      { title: '安全基础', directory: '01-security-foundation', responsibility: '识别运维资产、威胁和分层防护关系。', articles: [['运维资产与威胁', '01-assets-threats.md', '/operation/11-operations-security/01-security-foundation/01-assets-threats.md'], ['分层防护', '02-defense-in-depth.md']] },
      { title: '资产与基线', directory: '02-assets-baselines', responsibility: '维护资产清单、配置基线和变更审计证据。', articles: [['资产清单', '01-asset-inventory.md'], ['配置基线', '02-configuration-baselines.md'], ['变更审计', '03-change-auditing.md']] },
      { title: '身份与密钥', directory: '03-identity-secrets', responsibility: '应用最小权限，治理密钥生命周期并审计访问。', articles: [['身份与最小权限', '01-identity-least-privilege.md'], ['密钥生命周期', '02-secret-lifecycle.md'], ['访问审计', '03-access-auditing.md']] },
      { title: '主机与网络安全', directory: '04-host-network-security', responsibility: '治理主机加固、网络边界和远程访问。', articles: [['主机加固策略', '01-host-hardening.md'], ['网络边界', '02-network-boundaries.md'], ['远程访问治理', '03-remote-access.md']] },
      { title: '容器与 Kubernetes 安全', directory: '05-container-k8s-security', responsibility: '控制镜像、运行时、集群权限和工作负载策略风险。', articles: [['镜像与运行时风险', '01-image-runtime-risks.md'], ['集群权限', '02-cluster-permissions.md'], ['工作负载策略', '03-workload-policies.md']] },
      { title: '供应链安全', directory: '06-supply-chain', responsibility: '保护 CI/CD 凭据，验证依赖和制品来源，并建立供应链门禁。', articles: [['CI/CD 凭据', '01-cicd-credentials.md'], ['依赖与制品来源', '02-dependency-artifact-provenance.md'], ['供应链门禁', '03-supply-chain-gates.md']] },
      { title: '漏洞与补丁', directory: '07-vulnerabilities-patching', responsibility: '对漏洞分级，验证补丁并管理暂时无法修复的例外。', articles: [['漏洞分级', '01-vulnerability-prioritization.md'], ['补丁验证', '02-patch-validation.md'], ['例外管理', '03-exception-management.md']] },
      { title: '检测与响应', directory: '08-detection-response', responsibility: '从安全日志检测异常，遏制事件并保全证据。', articles: [['安全日志与检测', '01-security-logging-detection.md'], ['事件遏制', '02-incident-containment.md'], ['证据保全', '03-evidence-preservation.md']] },
      { title: '安全恢复', directory: '09-security-recovery', responsibility: '恢复受影响资产，轮换密钥并验证恢复后安全状态。', articles: [['受影响资产恢复', '01-asset-recovery.md'], ['密钥轮换', '02-secret-rotation.md'], ['恢复后验证', '03-post-recovery-validation.md']] },
    ],
  },
  {
    id: 'OPS12',
    title: 'Ansible',
    path: '/operation/12-ansible',
    navigationGroup: '自动化与平台',
    description: '声明和维护受管主机的期望配置，安全执行可验证、可限批的批量变更。',
    chapters: [
      { title: '基础与环境', directory: '01-foundation-environment', responsibility: '理解控制节点和受管节点，完成安装与第一次执行。', articles: [['控制节点与受管节点', '01-control-managed-nodes.md', '/operation/12-ansible/01-foundation-environment/01-control-managed-nodes.md'], ['安装与第一次执行', '02-install-first-run.md']] },
      { title: 'Inventory 与连接', directory: '02-inventory-connectivity', responsibility: '组织主机清单、分组和连接，并理解动态清单的适用场景。', articles: [['Inventory', '01-inventory.md'], ['主机分组与连接', '02-groups-connections.md'], ['动态清单', '03-dynamic-inventory.md']] },
      { title: 'Playbook 与模块', directory: '03-playbooks-modules', responsibility: '使用 Play、Task 和模块表达幂等变更并解释执行结果。', articles: [['Play 与 Task', '01-play-tasks.md'], ['模块与幂等性', '02-modules-idempotency.md'], ['执行结果', '03-execution-results.md']] },
      { title: '变量与模板', directory: '04-variables-templates', responsibility: '理解变量优先级，渲染模板并通过 Handler 响应配置变更。', articles: [['变量优先级', '01-variable-precedence.md'], ['模板', '02-templates.md'], ['Handlers', '03-handlers.md']] },
      { title: 'Role 与 Collection', directory: '05-roles-collections', responsibility: '使用 Role 和 Collection 组织复用内容并控制版本。', articles: [['Role 结构', '01-role-structure.md'], ['Collection', '02-collections.md'], ['复用与版本', '03-reuse-versioning.md']] },
      { title: '提权与敏感信息', directory: '06-privilege-secrets', responsibility: '控制提权、Vault 和敏感输出边界。', articles: [['提权', '01-privilege-escalation.md'], ['Vault', '02-vault.md'], ['敏感输出保护', '03-sensitive-output.md']] },
      { title: '质量控制', directory: '07-quality-control', responsibility: '通过语法、Lint、测试、限批和回退降低批量变更风险。', articles: [['语法检查与 Lint', '01-syntax-lint.md'], ['自动化测试', '02-testing.md'], ['限批与回退', '03-batching-rollback.md']] },
      { title: '运维实践', directory: '08-operations-practice', responsibility: '完成主机初始化、配置分发和批量变更验证。', articles: [['主机初始化', '01-host-bootstrap.md'], ['配置分发', '02-configuration-distribution.md'], ['批量变更与验证', '03-batch-change-validation.md']] },
    ],
  },
  {
    id: 'OPS13',
    title: 'Terraform',
    path: '/operation/13-terraform',
    navigationGroup: '自动化与平台',
    description: '声明基础设施资源，管理状态、漂移、模块和团队审查，并控制创建与销毁风险。',
    chapters: [
      { title: '基础与工作流', directory: '01-foundation-workflow', responsibility: '理解 IaC 与 Terraform，完成安装和 Write-Plan-Apply 工作流。', articles: [['IaC 与 Terraform', '01-iac-terraform.md', '/operation/13-terraform/01-foundation-workflow/01-iac-terraform.md'], ['安装 Terraform', '02-installation.md'], ['Write-Plan-Apply', '03-write-plan-apply.md']] },
      { title: '资源与 Provider', directory: '02-resources-providers', responsibility: '使用 HCL、Provider、Resource 和 Data Source 描述资源。', articles: [['HCL 基础', '01-hcl-basics.md'], ['Provider 与 Resource', '02-providers-resources.md'], ['Data Source', '03-data-sources.md']] },
      { title: '输入与表达式', directory: '03-inputs-expressions', responsibility: '管理变量、输出、表达式和资源依赖。', articles: [['变量与输出', '01-variables-outputs.md'], ['表达式', '02-expressions.md'], ['资源依赖', '03-resource-dependencies.md']] },
      { title: 'State 与 Backend', directory: '04-state-backends', responsibility: '理解 State 的资源身份作用，并安全使用远程存储和锁。', articles: [['State 作用', '01-state-purpose.md'], ['远程存储与锁', '02-remote-state-locking.md'], ['状态安全', '03-state-security.md']] },
      { title: 'Module 与版本', directory: '05-modules-versions', responsibility: '设计可复用 Module，并控制 Provider 和模块版本。', articles: [['Module 设计', '01-module-design.md'], ['Provider 版本', '02-provider-versions.md'], ['模块复用', '03-module-reuse.md']] },
      { title: '漂移与重构', directory: '06-drift-refactoring', responsibility: '检测漂移，导入既有资源并安全重构资源地址。', articles: [['漂移检测', '01-drift-detection.md'], ['资源导入', '02-resource-import.md'], ['地址变更与重构', '03-address-refactoring.md']] },
      { title: '测试与安全', directory: '07-testing-security', responsibility: '执行格式化、校验和 terraform test，并保护敏感值与策略边界。', articles: [['格式与校验', '01-format-validation.md'], ['terraform test', '02-terraform-test.md'], ['敏感值与策略', '03-sensitive-values-policy.md']] },
      { title: '团队自动化', directory: '08-team-automation', responsibility: '建立 Plan 审核、自动化执行和有边界的销毁恢复流程。', articles: [['Plan 审核', '01-plan-review.md'], ['自动化执行', '02-automated-execution.md'], ['销毁与恢复边界', '03-destroy-recovery.md']] },
    ],
  },
  {
    id: 'OPS14',
    title: '平台工程',
    path: '/operation/14-platform-engineering',
    navigationGroup: '自动化与平台',
    description: '将交付和运维能力产品化为有契约、可治理、可演进的团队自助服务。',
    chapters: [
      { title: '平台基础', directory: '01-platform-foundation', responsibility: '理解平台工程定位，以及平台团队与基础设施团队的职责边界。', articles: [['平台工程定位', '01-platform-engineering.md', '/operation/14-platform-engineering/01-platform-foundation/01-platform-engineering.md'], ['平台与基础设施团队边界', '02-team-boundaries.md']] },
      { title: '平台产品', directory: '02-platform-product', responsibility: '从开发者需求定义服务目录和平台能力契约。', articles: [['开发者需求', '01-developer-needs.md'], ['服务目录', '02-service-catalog.md'], ['平台能力契约', '03-capability-contracts.md']] },
      { title: '标准化路径', directory: '03-golden-paths', responsibility: '设计 Golden Path、项目模板和模板版本演进方式。', articles: [['标准化路径', '01-golden-paths.md'], ['项目模板', '02-project-templates.md'], ['模板版本演进', '03-template-versioning.md']] },
      { title: '自助服务', directory: '04-self-service', responsibility: '通过开发者门户提供环境申请、权限和审批能力。', articles: [['开发者门户', '01-developer-portal.md'], ['环境申请', '02-environment-provisioning.md'], ['权限与审批', '03-permissions-approvals.md']] },
      { title: 'GitOps 与 Argo CD', directory: '05-gitops-argocd', responsibility: '理解 GitOps 原则，并使用 Argo CD 管理同步、漂移和发布回退。', articles: [['GitOps 原则', '01-gitops-principles.md'], ['Argo CD 同步与漂移', '02-argocd-sync-drift.md'], ['发布回退', '03-release-rollback.md']] },
      { title: '平台治理', directory: '06-platform-governance', responsibility: '统一策略入口、密钥集成和多租户边界。', articles: [['策略入口', '01-policy-entrypoints.md'], ['密钥集成', '02-secret-integration.md'], ['多租户边界', '03-multitenancy.md']] },
      { title: '平台运维与成本', directory: '07-operations-cost', responsibility: '建立平台可观测性，并治理容量和成本分摊。', articles: [['平台可观测性', '01-platform-observability.md'], ['容量管理', '02-capacity-management.md'], ['成本分摊', '03-cost-allocation.md']] },
      { title: '平台演进', directory: '08-platform-evolution', responsibility: '以使用率和开发者体验评估平台，并管理迁移和能力退役。', articles: [['使用率与开发者体验', '01-adoption-developer-experience.md'], ['平台迁移', '02-platform-migration.md'], ['能力退役', '03-capability-retirement.md']] },
    ],
  },
]

/**
 * 将紧凑的目录定义扩展为带稳定文章 ID 的目录数据。
 *
 * @param {object[]} definitions 模块定义；文章使用 `[标题, 文件名, 可选发布链接]` 表示，顺序即公开学习编号。
 * @returns {object[]} 可供导航、侧栏与测试共同使用的标准模块记录。
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

export const operationCatalog = {
  title: '运维与 DevOps',
  version: '2026-09-24-direct-entry-v2',
  modules: createCatalogModules(operationModuleDefinitions),
}

/**
 * 读取专题第一章第一篇已经登记的正文或占位页链接。
 *
 * @param {object} module 运维目录中的专题记录，必须包含非空的 chapters 和 articles。
 * @returns {string | null} 已登记首篇的站内链接；首篇尚无页面时返回 `null`。
 */
export function getOperationModuleEntryLink(module) {
  const firstChapter = module.chapters?.[0]
  const firstArticle = firstChapter?.articles?.[0]
  if (!firstArticle) {
    throw new Error(`运维专题缺少第一章第一篇：${module.path ?? module.title ?? '未知专题'}`)
  }
  return firstArticle.publishedLink ?? null
}

export const operationNavigation = []
const navigationGroups = new Map()

for (const module of operationCatalog.modules) {
  const entryLink = getOperationModuleEntryLink(module)
  if (!entryLink) continue

  let group = navigationGroups.get(module.navigationGroup)
  if (!group) {
    group = { text: module.navigationGroup, items: [] }
    navigationGroups.set(module.navigationGroup, group)
    operationNavigation.push(group)
  }
  group.items.push({ text: module.title, link: entryLink })
}
