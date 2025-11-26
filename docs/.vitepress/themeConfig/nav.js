export const nav = [
  {
    text: "🏠首页",
    link: "/articles/basic/01-html",
  },
  {
    text: "📖博客",
    link: "/blog-list",
  },
  {
    text: "🥤前端体系",
    items: [
      {
        text: "01-前端基础",
        collapsed: false,
        items: [
          { text: "html", link: "/frontend/01-html/01-overview.md" },
          { text: "css", link: "/frontend/02-css/01-overview.md" },
          {
            text: "javascript",
            link: "/frontend/03-javascript/01-dataType.md",
          },
          {
            text: "ecmascript",
            link: "/frontend/04-ecmascript/01-variable.md",
          },
          {
            text: "typescript",
            link: "/frontend/05-typescript/01-typescript.md",
          },
        ],
      },
      {
        text: "02-前端框架",
        collapsed: false,
        items: [
          { text: "vue2", link: "/frontend/06-vue2/01-vue2.md" },
          { text: "vue3", link: "/frontend/07-vue3/01-vue3.md" },
          { text: "react16", link: "/frontend/08-react16/01-react16.md" },
          { text: "react18", link: "/frontend/09-react18/01-react18.md" },
        ],
      },
      {
        text: "03-跨端技术",
        collapsed: false,
        items: [
          { text: "react native", link: "/crossend/01-reactnative/index.md" },
          { text: "flutter", link: "/crossend/02-flutter/index.md" },
          { text: "harmony os", link: "/crossend/03-harmonyOs/index.md" },
          { text: "elctron", link: "/crossend/04-elctron/index.md" },
        ],
      },
      {
        text: "04-微前端",
        collapsed: false,
        items: [{ text: "qiankun", link: "/micfrontend/01-qiankun/index.md" }],
      },
      {
        text: "05-前端工程化",
        collapsed: false,
        items: [
          { text: "webpack", link: "/engineering/01-webpack/" },
          { text: "vite", link: "/engineering/02-vite/01-vite.md" },
        ],
      },

    ],
  },

  {
    text: "🍚后端体系",
    items: [
      {
        text: "01-nodejs",
        collapsed: false,
        items: [
          { text: "nodejs", link: "/backend/01-nodejs/index.md" },
          { text: "express", link: "/backend/02-express/index.md" },
          { text: "nest.js", link: "/backend/03-nestjs/index.md" },
        ],
      },
      {
        text: "02-java",
        collapsed: false,
        items: [
          { text: "java", link: "/backend/01-html/01-html.md" },
          { text: "spring", link: "/backend/01-html/01-html.md" },
          { text: "spring boot", link: "/backend/01-html/01-html.md" },
        ],
      },
      {
        text: "02-数据库",
        collapsed: false,
        items: [
          { text: "mysql", link: "/backend/01-html/01-html.md" },
          { text: "postgreSQL", link: "/backend/01-html/01-html.md" },
          { text: "redis", link: "/backend/01-html/01-html.md" },
        ],
      },
    ],
  },
  {
    text: "🍨运维",
    items: [
      {
        text: "01-Shell脚本",
        link: "/operation/01-shell/index.md",
      },
      {
        text: "02-Docker容器",
        link: "/operation/05-docker/index.md",
      },
      {
        text: "03-Kubernetes",
        link: "/operation/04-k8s/index.md",
      },
      { text: "04-Jenkins", link: "/operation/02-jenkins/index.md" },
      { text: "05-CI/CD实践", link: "/operation/03-cicd/index.md" },
    ],
  },
  { text: "🍓web3.0", items:[
    { text: "01-web3.0", link: "/web3/01-web3.0/01-overview.md" },
    { text: "02-solidity", link: "/web3/02-solidity/01-overview.md" },
    { text: "03-ethereum", link: "/web3/03-ethereum/01-overview.md" },
  ]},
  { text: "🥃Interview", link: "/interview/index.md" },
  {
    text: "🍚workflow",
    items: [
      {
        text: "Training",
        items: [
          { text: "01-组件封装", link: "/skill/01-Vue组件封装" },
          { text: "02-项目实践", link: "/practices/" },
          { text: "03-项目难点", link: "/project/index.md" },
        ]
      },
      {
        text: "源码解读",
        items: [
          { text: "01-vue2源码", link: "/skill/01-Vue组件封装" },
          { text: "02-vue3源码", link: "/skill/02-Vue组件封装" },
          { text: "03-react16源码", link: "/skill/03-React组件封装" },
          { text: "04-react18源码", link: "/skill/04-React组件封装" },
        ]
      },
    ],
  },
  {
    text: "🍒关于",
    items: [
      { text: "关于我", link: "/about/" },
      { text: "友情链接", link: "/links" },
    ],
  },
];
