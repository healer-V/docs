export const operationSidebar = {
  "/operation/00-linux/": [
    {
      "text": "Linux 系统学习指南",
      "items": [
        {
          "text": "学习路线总览",
          "link": "/operation/00-linux/index.md"
        },
        {
          "text": "第1章：认识 Linux",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Linux 简介与历史",
              "link": "/operation/00-linux/01-intro.md"
            },
            {
              "text": "1.2 安装与环境搭建",
              "link": "/operation/00-linux/02-installation.md"
            },
            {
              "text": "1.3 Shell 与终端基础",
              "link": "/operation/00-linux/03-terminal.md"
            }
          ]
        },
        {
          "text": "第2章：文件系统",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 目录结构详解",
              "link": "/operation/00-linux/04-filesystem.md"
            },
            {
              "text": "2.2 文件与目录操作",
              "link": "/operation/00-linux/05-file-operations.md"
            },
            {
              "text": "2.3 文件查找与搜索",
              "link": "/operation/00-linux/06-find-search.md"
            }
          ]
        },
        {
          "text": "第3章：权限与用户管理",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 用户与用户组",
              "link": "/operation/00-linux/07-users.md"
            },
            {
              "text": "3.2 文件权限详解",
              "link": "/operation/00-linux/08-permissions.md"
            }
          ]
        },
        {
          "text": "第4章：文本处理",
          "collapsed": true,
          "items": [
            {
              "text": "4.1 Vim 编辑器",
              "link": "/operation/00-linux/09-vim.md"
            },
            {
              "text": "4.2 文本处理三剑客（grep/sed/awk）",
              "link": "/operation/00-linux/10-text-processing.md"
            }
          ]
        },
        {
          "text": "第5章：进程与系统管理",
          "collapsed": true,
          "items": [
            {
              "text": "5.1 进程管理",
              "link": "/operation/00-linux/11-process.md"
            },
            {
              "text": "5.2 系统资源监控",
              "link": "/operation/00-linux/12-monitor.md"
            }
          ]
        },
        {
          "text": "第6章：网络管理",
          "collapsed": true,
          "items": [
            {
              "text": "6.1 网络管理与诊断",
              "link": "/operation/00-linux/13-network.md"
            }
          ]
        },
        {
          "text": "第7章：软件包管理",
          "collapsed": true,
          "items": [
            {
              "text": "7.1 APT / YUM / DNF 包管理",
              "link": "/operation/00-linux/14-package-manager.md"
            }
          ]
        }
      ]
    }
  ],
  "/operation/01-shell/": [
    {
      "text": "Shell 核心",
      "items": [
        {
          "text": "第1章：Shell 脚本",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Shell 概述",
              "link": "/operation/01-shell/index.md"
            },
            {
              "text": "1.2 Shell 基础语法",
              "link": "/operation/01-shell/01-basics.md"
            },
            {
              "text": "1.3 流程控制",
              "link": "/operation/01-shell/02-control-flow.md"
            }
          ]
        },
        {
          "text": "第2章：实战应用",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 文本处理",
              "link": "/operation/01-shell/03-text-processing.md"
            },
            {
              "text": "2.2 实用脚本案例",
              "link": "/operation/01-shell/04-practical-scripts.md"
            }
          ]
        }
      ]
    }
  ],
  "/operation/02-jenkins/": [
    {
      "text": "Jenkins 核心",
      "items": [
        {
          "text": "第1章：Jenkins CI/CD",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Jenkins 概述",
              "link": "/operation/02-jenkins/index.md"
            },
            {
              "text": "1.2 安装与配置",
              "link": "/operation/02-jenkins/01-installation.md"
            },
            {
              "text": "1.3 Job 与 Pipeline",
              "link": "/operation/02-jenkins/02-freestyle-jobs.md"
            },
            {
              "text": "1.4 高级流水线",
              "link": "/operation/02-jenkins/03-advanced-pipeline.md"
            }
          ]
        }
      ]
    }
  ],
  "/operation/03-cicd/": [
    {
      "text": "CI/CD 核心",
      "items": [
        {
          "text": "第1章：CI/CD 实践",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 CI/CD 概述",
              "link": "/operation/03-cicd/index.md"
            },
            {
              "text": "1.2 GitHub Actions 实战",
              "link": "/operation/03-cicd/01-github-actions.md"
            },
            {
              "text": "1.3 CI/CD 最佳实践",
              "link": "/operation/03-cicd/02-cicd-practices.md"
            }
          ]
        }
      ]
    }
  ],
  "/operation/04-k8s/": [
    {
      "text": "Kubernetes 核心",
      "items": [
        {
          "text": "第1章：Kubernetes 基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 K8s 概述",
              "link": "/operation/04-k8s/index.md"
            },
            {
              "text": "1.2 核心概念",
              "link": "/operation/04-k8s/01-core-concepts.md"
            },
            {
              "text": "1.3 工作负载",
              "link": "/operation/04-k8s/02-workloads.md"
            }
          ]
        },
        {
          "text": "第2章：网络与存储",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 网络与服务发现",
              "link": "/operation/04-k8s/03-networking.md"
            },
            {
              "text": "2.2 存储与配置管理",
              "link": "/operation/04-k8s/04-storage-config.md"
            }
          ]
        }
      ]
    }
  ],
  "/operation/05-docker/": [
    {
      "text": "Docker 核心",
      "items": [
        {
          "text": "第1章：Docker 基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Docker 概述",
              "link": "/operation/05-docker/index.md"
            },
            {
              "text": "1.2 基础操作",
              "link": "/operation/05-docker/01-basics.md"
            },
            {
              "text": "1.3 Dockerfile 最佳实践",
              "link": "/operation/05-docker/02-dockerfile.md"
            }
          ]
        },
        {
          "text": "第2章：网络与编排",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 网络与数据卷",
              "link": "/operation/05-docker/03-networking-volumes.md"
            },
            {
              "text": "2.2 Docker Compose",
              "link": "/operation/05-docker/04-compose.md"
            }
          ]
        }
      ]
    }
  ],
  "/operation/06-nginx/": [
    {
      "text": "Nginx 核心",
      "items": [
        {
          "text": "第1章：Nginx 基础",
          "collapsed": true,
          "items": [
            {
              "text": "1.1 Nginx 概述",
              "link": "/operation/06-nginx/index.md"
            },
            {
              "text": "1.2 安装与配置",
              "link": "/operation/06-nginx/01-installation.md"
            },
            {
              "text": "1.3 配置文件详解",
              "link": "/operation/06-nginx/02-config.md"
            }
          ]
        },
        {
          "text": "第2章：核心功能",
          "collapsed": true,
          "items": [
            {
              "text": "2.1 静态资源服务",
              "link": "/operation/06-nginx/03-static.md"
            },
            {
              "text": "2.2 反向代理",
              "link": "/operation/06-nginx/04-reverse-proxy.md"
            },
            {
              "text": "2.3 负载均衡",
              "link": "/operation/06-nginx/05-load-balance.md"
            },
            {
              "text": "2.4 HTTPS 配置",
              "link": "/operation/06-nginx/06-https.md"
            }
          ]
        },
        {
          "text": "第3章：运维实战",
          "collapsed": true,
          "items": [
            {
              "text": "3.1 性能优化",
              "link": "/operation/06-nginx/07-performance.md"
            },
            {
              "text": "3.2 日志管理",
              "link": "/operation/06-nginx/08-logging.md"
            },
            {
              "text": "3.3 实战案例",
              "link": "/operation/06-nginx/09-practice.md"
            }
          ]
        }
      ]
    }
  ]
};
