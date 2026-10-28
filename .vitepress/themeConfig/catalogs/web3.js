// 已确认的主题、章节与文章规划；目录只展示编号和标题。
// 正文重新编写并完成后设置 publishedLink；未编写条目不生成阅读链接。
export const web3Catalog = {
  "title": "Web3",
  "modules": [
    {
      "id": "WB01",
      "title": "区块链基础",
      "path": "/web3/01-blockchain",
      "chapters": [
        {
          "title": "账本与交易",
          "directory": "01-ledger",
          "articles": [
            {
              "id": "WB01-A01-01",
              "title": "共享账本与信任",
              "file": "01-ledger-trust.md"
            },
            {
              "id": "WB01-A01-02",
              "title": "交易与状态模型",
              "file": "02-transaction-state.md"
            }
          ]
        },
        {
          "title": "密码学与钱包",
          "directory": "02-cryptography",
          "articles": [
            {
              "id": "WB01-A02-01",
              "title": "哈希与包含证明",
              "file": "01-hash-proof.md"
            },
            {
              "id": "WB01-A02-02",
              "title": "密钥与数字签名",
              "file": "02-keys-signatures.md"
            },
            {
              "id": "WB01-A02-03",
              "title": "钱包与密钥托管",
              "file": "03-wallet-custody.md"
            }
          ]
        },
        {
          "title": "共识与最终性",
          "directory": "03-consensus",
          "articles": [
            {
              "id": "WB01-A03-01",
              "title": "共识与分叉选择",
              "file": "01-consensus-fork-choice.md"
            },
            {
              "id": "WB01-A03-02",
              "title": "确认、最终性与重组",
              "file": "02-finality-reorg.md"
            },
            {
              "id": "WB01-A03-03",
              "title": "共识安全边界",
              "file": "03-security-assumptions.md"
            }
          ]
        },
        {
          "title": "可编程账本",
          "directory": "04-architecture",
          "articles": [
            {
              "id": "WB01-A04-01",
              "title": "脚本与智能合约",
              "file": "01-programmable-ledger.md"
            },
            {
              "id": "WB01-A04-02",
              "title": "上链与链型选择",
              "file": "02-chain-selection.md"
            }
          ]
        }
      ]
    },
    {
      "id": "WB02",
      "title": "以太坊与 EVM",
      "path": "/web3/02-ethereum-protocol",
      "chapters": [
        {
          "title": "状态与执行",
          "directory": "01-state-execution",
          "articles": [
            {
              "id": "WB02-A01-01",
              "title": "执行层与共识层",
              "file": "01-node-architecture.md"
            },
            {
              "id": "WB02-A01-02",
              "title": "账户与状态",
              "file": "02-accounts-state.md"
            },
            {
              "id": "WB02-A01-03",
              "title": "EVM 状态转换",
              "file": "03-evm-state-transition.md"
            },
            {
              "id": "WB02-A01-04",
              "title": "调用帧与回滚",
              "file": "04-calls-reverts.md"
            }
          ]
        },
        {
          "title": "交易与费用",
          "directory": "02-transactions",
          "articles": [
            {
              "id": "WB02-A02-01",
              "title": "交易字段与类型",
              "file": "01-transaction-envelope.md"
            },
            {
              "id": "WB02-A02-02",
              "title": "Nonce 与待处理交易",
              "file": "02-nonce-pending.md"
            },
            {
              "id": "WB02-A02-03",
              "title": "Gas 与动态费用",
              "file": "03-gas-fees.md"
            },
            {
              "id": "WB02-A02-04",
              "title": "回执与执行结果",
              "file": "04-receipts-logs.md"
            }
          ]
        },
        {
          "title": "节点与读取",
          "directory": "03-node-data",
          "articles": [
            {
              "id": "WB02-A03-01",
              "title": "JSON-RPC 与网络标识",
              "file": "01-json-rpc.md"
            },
            {
              "id": "WB02-A03-02",
              "title": "区块标签与一致性",
              "file": "02-block-state-reads.md"
            },
            {
              "id": "WB02-A03-03",
              "title": "同步与历史状态",
              "file": "03-history-availability.md"
            }
          ]
        },
        {
          "title": "共识与升级",
          "directory": "04-finality-upgrades",
          "articles": [
            {
              "id": "WB02-A04-01",
              "title": "PoS 与最终性",
              "file": "01-pos-finality.md"
            },
            {
              "id": "WB02-A04-02",
              "title": "协议升级与兼容性",
              "file": "02-fork-compatibility.md"
            }
          ]
        },
        {
          "title": "Rollup 与跨链",
          "directory": "05-scaling",
          "articles": [
            {
              "id": "WB02-A05-01",
              "title": "Rollup 与数据可用性",
              "file": "01-rollup-data.md"
            },
            {
              "id": "WB02-A05-02",
              "title": "L2 费用与结算",
              "file": "02-l2-settlement-fees.md"
            },
            {
              "id": "WB02-A05-03",
              "title": "跨链消息与桥接",
              "file": "03-bridge-trust.md"
            }
          ]
        },
        {
          "title": "智能账户",
          "directory": "06-smart-accounts",
          "articles": [
            {
              "id": "WB02-A06-01",
              "title": "ERC-4337 账户抽象",
              "file": "01-erc4337.md"
            },
            {
              "id": "WB02-A06-02",
              "title": "EIP-7702 代码委托",
              "file": "02-eip7702.md"
            }
          ]
        }
      ]
    },
    {
      "id": "WB03",
      "title": "Solidity",
      "path": "/web3/03-solidity",
      "chapters": [
        {
          "title": "源码与编译",
          "directory": "01-source",
          "articles": [
            {
              "id": "WB03-A01-01",
              "title": "Solidity 编译与执行",
              "file": "01-compile-contract.md"
            },
            {
              "id": "WB03-A01-02",
              "title": "变量与作用域",
              "file": "02-declarations.md"
            }
          ]
        },
        {
          "title": "类型与控制流",
          "directory": "02-expressions",
          "articles": [
            {
              "id": "WB03-A02-01",
              "title": "布尔值与整数",
              "file": "01-value-types.md"
            },
            {
              "id": "WB03-A02-02",
              "title": "地址与字节类型",
              "file": "02-address-bytes.md"
            },
            {
              "id": "WB03-A02-03",
              "title": "运算与类型转换",
              "file": "03-operators-conversions.md"
            },
            {
              "id": "WB03-A02-04",
              "title": "分支与循环",
              "file": "04-control-flow.md"
            }
          ]
        },
        {
          "title": "数据与存储",
          "directory": "03-data",
          "articles": [
            {
              "id": "WB03-A03-01",
              "title": "数据位置与赋值",
              "file": "01-data-locations.md"
            },
            {
              "id": "WB03-A03-02",
              "title": "数组与集合遍历",
              "file": "02-arrays.md"
            },
            {
              "id": "WB03-A03-03",
              "title": "结构体与映射",
              "file": "03-structs-mappings.md"
            },
            {
              "id": "WB03-A03-04",
              "title": "存储布局与瞬态状态",
              "file": "04-storage-layout.md"
            }
          ]
        },
        {
          "title": "函数与调用",
          "directory": "04-functions",
          "articles": [
            {
              "id": "WB03-A04-01",
              "title": "函数参数与返回值",
              "file": "01-parameters-results.md"
            },
            {
              "id": "WB03-A04-02",
              "title": "可见性与可变性",
              "file": "02-visibility-mutability.md"
            },
            {
              "id": "WB03-A04-03",
              "title": "构造函数与修饰器",
              "file": "03-initialization-modifiers.md"
            },
            {
              "id": "WB03-A04-04",
              "title": "调用上下文",
              "file": "04-call-context.md"
            }
          ]
        },
        {
          "title": "错误与外部交互",
          "directory": "05-errors",
          "articles": [
            {
              "id": "WB03-A05-01",
              "title": "回滚与自定义错误",
              "file": "01-reverts.md"
            },
            {
              "id": "WB03-A05-02",
              "title": "try/catch 与失败传播",
              "file": "02-try-catch.md"
            },
            {
              "id": "WB03-A05-03",
              "title": "ETH 接收与兜底调用",
              "file": "03-ether-receiving.md"
            }
          ]
        },
        {
          "title": "合约组合",
          "directory": "06-composition",
          "articles": [
            {
              "id": "WB03-A06-01",
              "title": "导入、接口与抽象合约",
              "file": "01-imports-interfaces.md"
            },
            {
              "id": "WB03-A06-02",
              "title": "继承与线性化",
              "file": "02-inheritance.md"
            },
            {
              "id": "WB03-A06-03",
              "title": "库与自定义值类型",
              "file": "03-libraries.md"
            }
          ]
        },
        {
          "title": "编码与底层机制",
          "directory": "07-encoding",
          "articles": [
            {
              "id": "WB03-A07-01",
              "title": "事件与日志语义",
              "file": "01-events.md"
            },
            {
              "id": "WB03-A07-02",
              "title": "ABI 编码与选择器",
              "file": "02-abi.md"
            },
            {
              "id": "WB03-A07-03",
              "title": "低级调用与返回数据",
              "file": "03-low-level-calls.md"
            },
            {
              "id": "WB03-A07-04",
              "title": "内联汇编与内存边界",
              "file": "04-assembly.md"
            }
          ]
        }
      ]
    },
    {
      "id": "WB04",
      "title": "智能合约开发",
      "path": "/web3/04-contract-engineering",
      "chapters": [
        {
          "title": "构建与本地链",
          "directory": "01-build",
          "articles": [
            {
              "id": "WB04-A01-01",
              "title": "合约工具链",
              "file": "01-toolchains.md"
            },
            {
              "id": "WB04-A01-02",
              "title": "Foundry 与本地链",
              "file": "02-foundry-local.md"
            },
            {
              "id": "WB04-A01-03",
              "title": "编译配置与依赖",
              "file": "03-compiler-dependencies.md"
            }
          ]
        },
        {
          "title": "测试与调试",
          "directory": "02-tests",
          "articles": [
            {
              "id": "WB04-A02-01",
              "title": "合约单元测试",
              "file": "01-unit-tests.md"
            },
            {
              "id": "WB04-A02-02",
              "title": "模糊测试与不变量",
              "file": "02-fuzz-tests.md"
            },
            {
              "id": "WB04-A02-03",
              "title": "调用追踪与失败定位",
              "file": "03-traces.md"
            },
            {
              "id": "WB04-A02-04",
              "title": "Gas 与覆盖率",
              "file": "04-gas-coverage.md"
            }
          ]
        },
        {
          "title": "ERC-20 实现",
          "directory": "03-erc20",
          "articles": [
            {
              "id": "WB04-A03-01",
              "title": "ERC-20 标准实现",
              "file": "01-erc20.md"
            },
            {
              "id": "WB04-A03-02",
              "title": "ERC-20 扩展组合",
              "file": "02-erc20-extensions.md"
            },
            {
              "id": "WB04-A03-03",
              "title": "Permit 与代币接入",
              "file": "03-permit-integration.md"
            }
          ]
        },
        {
          "title": "权限与管理",
          "directory": "04-permissions",
          "articles": [
            {
              "id": "WB04-A04-01",
              "title": "所有权与角色权限",
              "file": "01-access-control.md"
            },
            {
              "id": "WB04-A04-02",
              "title": "暂停与管理边界",
              "file": "02-pausing.md"
            }
          ]
        },
        {
          "title": "部署与交付",
          "directory": "05-delivery",
          "articles": [
            {
              "id": "WB04-A05-01",
              "title": "部署脚本与清单",
              "file": "01-deploy-scripts.md"
            },
            {
              "id": "WB04-A05-02",
              "title": "源码验证与产物溯源",
              "file": "02-verification.md"
            },
            {
              "id": "WB04-A05-03",
              "title": "持续集成与发布门禁",
              "file": "03-ci-release.md"
            }
          ]
        },
        {
          "title": "代理与升级",
          "directory": "06-upgrades",
          "articles": [
            {
              "id": "WB04-A06-01",
              "title": "代理模式选择",
              "file": "01-proxy-patterns.md"
            },
            {
              "id": "WB04-A06-02",
              "title": "初始化与升级授权",
              "file": "02-initializers.md"
            },
            {
              "id": "WB04-A06-03",
              "title": "存储兼容与升级演练",
              "file": "03-upgrade-validation.md"
            }
          ]
        },
        {
          "title": "Hardhat 工程",
          "directory": "07-hardhat",
          "articles": [
            {
              "id": "WB04-A07-01",
              "title": "Hardhat 3 工程",
              "file": "01-hardhat-project.md"
            },
            {
              "id": "WB04-A07-02",
              "title": "Hardhat 测试与部署",
              "file": "02-hardhat-tests-deploy.md"
            },
            {
              "id": "WB04-A07-03",
              "title": "Hardhat 2 迁移",
              "file": "03-hardhat-migration.md"
            }
          ]
        }
      ]
    },
    {
      "id": "WB05",
      "title": "钱包与链交互",
      "path": "/web3/05-chain-interaction",
      "chapters": [
        {
          "title": "客户端与数据",
          "directory": "01-clients",
          "articles": [
            {
              "id": "WB05-A01-01",
              "title": "客户端与账户",
              "file": "01-client-model.md"
            },
            {
              "id": "WB05-A01-02",
              "title": "传输与链配置",
              "file": "02-transports.md"
            },
            {
              "id": "WB05-A01-03",
              "title": "地址、单位与 ABI",
              "file": "03-types-units.md"
            }
          ]
        },
        {
          "title": "状态读取",
          "directory": "02-reading",
          "articles": [
            {
              "id": "WB05-A02-01",
              "title": "区块与账户读取",
              "file": "01-chain-state.md"
            },
            {
              "id": "WB05-A02-02",
              "title": "合约只读调用",
              "file": "02-contract-read.md"
            },
            {
              "id": "WB05-A02-03",
              "title": "批量读取与一致性",
              "file": "03-batch-reading.md"
            }
          ]
        },
        {
          "title": "交易执行",
          "directory": "03-transactions",
          "articles": [
            {
              "id": "WB05-A03-01",
              "title": "模拟与合约写入",
              "file": "01-simulate-write.md"
            },
            {
              "id": "WB05-A03-02",
              "title": "回执与交易替换",
              "file": "02-receipts-replacement.md"
            },
            {
              "id": "WB05-A03-03",
              "title": "费用与 nonce 管理",
              "file": "03-fees-nonce.md"
            }
          ]
        },
        {
          "title": "消息签名",
          "directory": "04-signatures",
          "articles": [
            {
              "id": "WB05-A04-01",
              "title": "消息签名与验签",
              "file": "01-message-signing.md"
            },
            {
              "id": "WB05-A04-02",
              "title": "EIP-712 结构化签名",
              "file": "02-typed-data.md"
            }
          ]
        },
        {
          "title": "日志与诊断",
          "directory": "05-observation",
          "articles": [
            {
              "id": "WB05-A05-01",
              "title": "日志查询与订阅",
              "file": "01-logs-subscriptions.md"
            },
            {
              "id": "WB05-A05-02",
              "title": "错误诊断与重试",
              "file": "02-errors-retries.md"
            },
            {
              "id": "WB05-A05-03",
              "title": "本地交互测试",
              "file": "03-local-tests.md"
            }
          ]
        },
        {
          "title": "ethers 6",
          "directory": "06-ethers",
          "articles": [
            {
              "id": "WB05-A06-01",
              "title": "ethers 6 入门",
              "file": "01-getting-started.md"
            },
            {
              "id": "WB05-A06-02",
              "title": "Provider 与 Signer",
              "file": "02-provider-signer.md"
            },
            {
              "id": "WB05-A06-03",
              "title": "ethers 合约交互",
              "file": "03-contract-interaction.md"
            }
          ]
        },
        {
          "title": "Web3.js 版本",
          "directory": "07-web3js-baseline",
          "articles": [
            {
              "id": "WB05-A07-01",
              "title": "归档状态与维护范围",
              "file": "01-maintenance-baseline.md"
            },
            {
              "id": "WB05-A07-02",
              "title": "v1 与 v4 差异",
              "file": "02-v1-v4-differences.md"
            }
          ]
        },
        {
          "title": "Web3.js 诊断",
          "directory": "08-web3js-diagnostics",
          "articles": [
            {
              "id": "WB05-A08-01",
              "title": "连接与读取诊断",
              "file": "01-read-diagnostics.md"
            },
            {
              "id": "WB05-A08-02",
              "title": "发送与回执诊断",
              "file": "02-transaction-diagnostics.md"
            },
            {
              "id": "WB05-A08-03",
              "title": "事件与断连诊断",
              "file": "03-subscription-diagnostics.md"
            }
          ]
        },
        {
          "title": "Web3.js 迁移",
          "directory": "09-web3js-migration",
          "articles": [
            {
              "id": "WB05-A09-01",
              "title": "迁移到 viem 与 ethers",
              "file": "01-sdk-adaptation.md"
            },
            {
              "id": "WB05-A09-02",
              "title": "迁移回归与回退",
              "file": "02-migration-regression.md"
            }
          ]
        }
      ]
    },
    {
      "id": "WB06",
      "title": "DApp 开发",
      "path": "/web3/06-dapp",
      "chapters": [
        {
          "title": "应用边界",
          "directory": "01-foundation",
          "articles": [
            {
              "id": "WB06-A01-01",
              "title": "DApp 架构边界",
              "file": "01-application-boundaries.md"
            },
            {
              "id": "WB06-A01-02",
              "title": "wagmi 3 接入",
              "file": "02-wagmi-setup.md"
            }
          ]
        },
        {
          "title": "钱包连接",
          "directory": "02-wallets",
          "articles": [
            {
              "id": "WB06-A02-01",
              "title": "钱包发现与连接",
              "file": "01-wallet-discovery.md"
            },
            {
              "id": "WB06-A02-02",
              "title": "账户与网络状态",
              "file": "02-account-chain-state.md"
            }
          ]
        },
        {
          "title": "数据与交易",
          "directory": "03-interactions",
          "articles": [
            {
              "id": "WB06-A03-01",
              "title": "链查询与缓存",
              "file": "01-queries-cache.md"
            },
            {
              "id": "WB06-A03-02",
              "title": "交易状态与反馈",
              "file": "02-transaction-ui.md"
            },
            {
              "id": "WB06-A03-03",
              "title": "资产与元数据显示",
              "file": "03-asset-display.md"
            }
          ]
        },
        {
          "title": "身份与会话",
          "directory": "04-identity",
          "articles": [
            {
              "id": "WB06-A04-01",
              "title": "SIWE 登录与会话",
              "file": "01-siwe-sessions.md"
            },
            {
              "id": "WB06-A04-02",
              "title": "SSR 与连接恢复",
              "file": "02-ssr-hydration.md"
            }
          ]
        },
        {
          "title": "测试与交付",
          "directory": "05-delivery",
          "articles": [
            {
              "id": "WB06-A05-01",
              "title": "DApp 交互测试",
              "file": "01-application-tests.md"
            },
            {
              "id": "WB06-A05-02",
              "title": "环境配置与发布",
              "file": "02-environment-delivery.md"
            },
            {
              "id": "WB06-A05-03",
              "title": "wagmi 2 到 3 迁移",
              "file": "03-wagmi-migration.md"
            }
          ]
        }
      ]
    },
    {
      "id": "WB07",
      "title": "链上数据",
      "path": "/web3/07-onchain-data",
      "chapters": [
        {
          "title": "数据视图",
          "directory": "01-data-model",
          "articles": [
            {
              "id": "WB07-A01-01",
              "title": "链上数据视图",
              "file": "01-data-sources.md"
            },
            {
              "id": "WB07-A01-02",
              "title": "事件账本与实体",
              "file": "02-event-ledger.md"
            }
          ]
        },
        {
          "title": "采集与恢复",
          "directory": "02-ingestion",
          "articles": [
            {
              "id": "WB07-A02-01",
              "title": "区块扫描与断点",
              "file": "01-range-sync.md"
            },
            {
              "id": "WB07-A02-02",
              "title": "重组检测与回退",
              "file": "02-reorg-rollback.md"
            },
            {
              "id": "WB07-A02-03",
              "title": "重放与对账",
              "file": "03-replay-reconcile.md"
            }
          ]
        },
        {
          "title": "Subgraph",
          "directory": "03-subgraph",
          "articles": [
            {
              "id": "WB07-A03-01",
              "title": "Subgraph 构建",
              "file": "01-subgraph-build.md"
            },
            {
              "id": "WB07-A03-02",
              "title": "处理器与动态数据源",
              "file": "02-handlers-relations.md"
            },
            {
              "id": "WB07-A03-03",
              "title": "GraphQL 查询一致性",
              "file": "03-graphql-query.md"
            }
          ]
        },
        {
          "title": "数据服务质量",
          "directory": "04-data-quality",
          "articles": [
            {
              "id": "WB07-A04-01",
              "title": "映射测试与版本发布",
              "file": "01-subgraph-testing.md"
            },
            {
              "id": "WB07-A04-02",
              "title": "索引查询服务",
              "file": "02-query-service.md"
            },
            {
              "id": "WB07-A04-03",
              "title": "索引延迟与数据缺口",
              "file": "03-indexer-diagnostics.md"
            }
          ]
        }
      ]
    },
    {
      "id": "WB08",
      "title": "合约安全",
      "path": "/web3/08-contract-security",
      "chapters": [
        {
          "title": "威胁模型",
          "directory": "01-threat-model",
          "articles": [
            {
              "id": "WB08-A01-01",
              "title": "资产与信任边界",
              "file": "01-trust-boundaries.md"
            },
            {
              "id": "WB08-A01-02",
              "title": "资产不变量",
              "file": "02-security-properties.md"
            }
          ]
        },
        {
          "title": "合约缺陷",
          "directory": "02-contract-failures",
          "articles": [
            {
              "id": "WB08-A02-01",
              "title": "重入与状态一致性",
              "file": "01-reentrancy.md"
            },
            {
              "id": "WB08-A02-02",
              "title": "权限与初始化漏洞",
              "file": "02-authority-failures.md"
            },
            {
              "id": "WB08-A02-03",
              "title": "签名授权与重放",
              "file": "03-signature-replay.md"
            },
            {
              "id": "WB08-A02-04",
              "title": "金额计算与舍入",
              "file": "04-accounting-rounding.md"
            },
            {
              "id": "WB08-A02-05",
              "title": "外部资产兼容性",
              "file": "05-token-behavior.md"
            },
            {
              "id": "WB08-A02-06",
              "title": "资源限制与拒绝服务",
              "file": "06-denial-of-service.md"
            }
          ]
        },
        {
          "title": "链执行条件",
          "directory": "03-chain-risks",
          "articles": [
            {
              "id": "WB08-A03-01",
              "title": "预言机失效与操纵",
              "file": "01-oracle-manipulation.md"
            },
            {
              "id": "WB08-A03-02",
              "title": "排序、时间与随机性",
              "file": "02-ordering-randomness.md"
            }
          ]
        },
        {
          "title": "安全验证",
          "directory": "04-security-evidence",
          "articles": [
            {
              "id": "WB08-A04-01",
              "title": "静态分析与告警核验",
              "file": "01-static-analysis.md"
            },
            {
              "id": "WB08-A04-02",
              "title": "安全不变量测试",
              "file": "02-stateful-invariants.md"
            },
            {
              "id": "WB08-A04-03",
              "title": "审计范围与发现闭环",
              "file": "03-audit-findings.md"
            },
            {
              "id": "WB08-A04-04",
              "title": "事故响应与恢复",
              "file": "04-incident-response.md"
            }
          ]
        }
      ]
    },
    {
      "id": "WB09",
      "title": "DeFi",
      "path": "/web3/09-defi",
      "chapters": [
        {
          "title": "资产模型",
          "directory": "01-asset-model",
          "articles": [
            {
              "id": "WB09-A01-01",
              "title": "资产、仓位与会计",
              "file": "01-positions-accounting.md"
            },
            {
              "id": "WB09-A01-02",
              "title": "报价与预言机",
              "file": "02-prices-oracles.md"
            }
          ]
        },
        {
          "title": "自动做市",
          "directory": "02-automated-markets",
          "articles": [
            {
              "id": "WB09-A02-01",
              "title": "恒定乘积与兑换",
              "file": "01-constant-product.md"
            },
            {
              "id": "WB09-A02-02",
              "title": "流动性份额与价值变化",
              "file": "02-liquidity-shares.md"
            },
            {
              "id": "WB09-A02-03",
              "title": "集中流动性与 Tick",
              "file": "03-concentrated-liquidity.md"
            },
            {
              "id": "WB09-A02-04",
              "title": "Uniswap v4 与 Hooks",
              "file": "04-v4-hooks.md"
            }
          ]
        },
        {
          "title": "借贷与稳定币",
          "directory": "03-credit-protocols",
          "articles": [
            {
              "id": "WB09-A03-01",
              "title": "借贷仓位与利率",
              "file": "01-lending-positions.md"
            },
            {
              "id": "WB09-A03-02",
              "title": "健康度与清算",
              "file": "02-liquidation.md"
            },
            {
              "id": "WB09-A03-03",
              "title": "稳定币锚定机制",
              "file": "03-stablecoin-mechanisms.md"
            }
          ]
        },
        {
          "title": "协议组合",
          "directory": "04-composability",
          "articles": [
            {
              "id": "WB09-A04-01",
              "title": "ERC-4626 份额金库",
              "file": "01-tokenized-vaults.md"
            },
            {
              "id": "WB09-A04-02",
              "title": "闪电贷与原子组合",
              "file": "02-flash-loans.md"
            },
            {
              "id": "WB09-A04-03",
              "title": "协议集成与失败传播",
              "file": "03-integration-boundaries.md"
            }
          ]
        }
      ]
    },
    {
      "id": "WB10",
      "title": "NFT 与 DAO",
      "path": "/web3/10-nft-dao",
      "chapters": [
        {
          "title": "资产标准",
          "directory": "01-token-standards",
          "articles": [
            {
              "id": "WB10-A01-01",
              "title": "NFT 资产模型",
              "file": "01-asset-identity.md"
            },
            {
              "id": "WB10-A01-02",
              "title": "ERC-721 合约",
              "file": "02-erc721-contract.md"
            },
            {
              "id": "WB10-A01-03",
              "title": "ERC-1155 多资产合约",
              "file": "03-erc1155-contract.md"
            }
          ]
        },
        {
          "title": "元数据与存储",
          "directory": "02-metadata-storage",
          "articles": [
            {
              "id": "WB10-A02-01",
              "title": "元数据与更新权限",
              "file": "01-metadata-contract.md"
            },
            {
              "id": "WB10-A02-02",
              "title": "IPFS 内容与持久化",
              "file": "02-ipfs-persistence.md"
            }
          ]
        },
        {
          "title": "发行与交易",
          "directory": "03-issuance-trading",
          "articles": [
            {
              "id": "WB10-A03-01",
              "title": "铸造额度与名单",
              "file": "01-mint-controls.md"
            },
            {
              "id": "WB10-A03-02",
              "title": "订单、授权与版税",
              "file": "02-market-orders.md"
            }
          ]
        },
        {
          "title": "治理与国库",
          "directory": "04-governance",
          "articles": [
            {
              "id": "WB10-A04-01",
              "title": "DAO 治理与执行权",
              "file": "01-governance-boundaries.md"
            },
            {
              "id": "WB10-A04-02",
              "title": "投票权与检查点",
              "file": "02-votes-checkpoints.md"
            },
            {
              "id": "WB10-A04-03",
              "title": "Governor 与时间锁",
              "file": "03-governor-timelock.md"
            },
            {
              "id": "WB10-A04-04",
              "title": "国库权限与治理变更",
              "file": "04-treasury-controls.md"
            }
          ]
        }
      ]
    }
  ]
}
