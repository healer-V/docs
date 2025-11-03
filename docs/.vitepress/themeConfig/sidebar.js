export const sidebar =
    {
        '/articles/': [
            {
                text: '首页',
                items: [
                    {
                        text: '🍎前端基础',
                        // collapsible: true, // 侧边栏可折叠
                        collapsed: true, // 侧边栏可折叠
                        items: [
                            {text: '01-HTML', link: '/articles/basic/01-html.md'},
                            {text: '02-CSS', link: '/articles/basic/02-css.md'},
                            {text: '03-JS', link: '/articles/basic/03-javascript.md'},
                            {text: '04-ES6', link: '/articles/basic/04-ecmascript.md'},
                            {text: '05-TS', link: '/articles/basic/05-typescript.md'},
                            {text: '06-Vue2', link: '/articles/basic/06-vue2.md'},
                            {text: '07-Vue3', link: '/articles/basic/07-vue3.md'},
                            {text: '08-React16', link: '/articles/basic/08-react16.md'},
                            {text: '09-React18', link: '/articles/basic/09-react18.md'},
                            {text: '10-Node.js', link: '/articles/basic/10-nodejs.md'},
                            {text: '11-Sass', link: '/articles/basic/11-Sass.md'},
                        ]
                    },
                    {
                        text: '🍑服务端',
                        collapsed: true, 
                        items: [
                            {text: '01-Node.js', link: '/articles/server/01-NodeJs.md'},
                            {text: '02-Express', link: '/articles/server/02-Express.md'},
                            {text: '03-Nest.js', link: '/articles/server/03-NestJs.md'},
                        ]
                    },
                    {
                        text: '🥝浏览器基础',
                        collapsed: true, 
                        items: [
                            {text: '01-线程与进程', link: '/articles/browser/01-basic.md'},
                            {text: '02-机制与引擎', link: '/articles/browser/02-render.md'},
                        ]
                    },
                    {
                        text: '🍓网络基础',
                        collapsed: true, 
                        items: [
                            {text: '01-网络协议', link: '/articles/network/01-http.md'},
                            {text: '02-文件传输', link: '/articles/network/02-FileTransfer.md'},
                            {text: '03-WebSocket', link: '/articles/network/03-WebSocket.md'},
                        ]
                    },

                    {
                        text: '🍎混合App开发',
                        collapsed: true, 
                        items: [
                            {text: '01-Uniapp', link: '/articles/frame/01-Uniapp.md'},
                            {text: '02-Flutter', link: '/articles/frame/02-Flutter.md'},
                            {text: '03-React Native', link: '/articles/frame/03-ReactNative.md'},
                            {text: '04-HarmonyOS', link: '/articles/frame/04-HarmonyOS.md'},
                            {text: '05-Electron', link: '/articles/frame/05-Electron.md'},

                        ]
                    },
                    {
                        text: '🍉前端工程化',
                        collapsed: true, 
                        items: [
                            {text: '01-Webpack', link: '/articles/engineering/01-Webpack.md'},
                            {text: '02-Vite', link: '/articles/engineering/02-Vite.md'},
                            {text: '03-ESBuild', link: '/articles/engineering/03-ESBuild.md'},
                            {text: '04-Rollup', link: '/articles/engineering/04-Rollup.md'},
                        ]
                    },
                    {
                        text: '🍜工具',
                        collapsed: true, 
                        items: [
                            {text: '01-Git', link: '/articles/tools/01-Git.md'},
                            {text: '02-Markdown', link: '/articles/tools/02-Markdown.md'},
                            {text: '03-IDE工具', link: '/articles/tools/03-IDE.md'},
                        ]
                    },

                    {
                        text: '🍏博客',
                        collapsed: true, 
                        items: [
                            {text: '01-搭建博客', link: '/articles/blog/01-vitepress.md'},
                            {text: '02-Markdown语法', link: '/articles/blog/02-markdown.md'},
                        ]
                    },
                ]
            }
        ],
        '/skill/': [
            {
                text: '🥤实践技巧',
                items: [
                    {text: '01-Vue组件封装', link: '/skill/01-Vue组件封装.md'},
                    {text: '02-React组件封装', link: '/skill/02-React组件封装.md'},
                ]
                // items: [
                //     {
                //         text: '🥝前端项目技巧',
                //         items: [
                //             {text: '01-Vue组件封装', link: '/skill/01-Vue组件封装.md'},
                //             {text: '02-React组件封装', link: '/skill/02-React组件封装.md'},
                //         ]
                //     },
                //     {
                //         text: '🥝后端项目技巧',
                //         items: [
                //             {text: '01-Vue组件封装', link: '/skill/01-Vue组件封装.md'},
                //             {text: '02-React组件封装', link: '/skill/02-React组件封装.md'},
                //         ]
                //     }
                // ]
            }
        ],
        '/practice/': [
            {
                text: '🍚项目',
                items: [
                    {text: '01-vue2移动端项目', link: '/practice/01-vue2.md'},
                    {text: '02-vue2PC端项目', link: '/practice/02-vue2PC.md'},
                    {text: '03-vue3移动端项目', link: '/practice/03-vue3.md'},
                    {text: '04-vue3PC端项目', link: '/practice/04-vue3PC.md'},

                ]
            }
        ],
        '/project/': [
            {
                text: '🥥项目要点',
                items: [
                    {text: '移动端项目要点', link: '/project/'}, // /project/index.md
                    {text: 'PC端项目要点', link: '/project/pc'},
                ]
            }
        ],
        '/interview/': [
            {
                text: '📖 面试题',
                items: [
                    {text: '01-Html', link: '/interview/'}, // /interview/index.md
                    {text: '02-Css', link: '/interview/02-css.md'},
                    {text: '03-JS', link: '/interview/03-javascript.md'},
                    {text: '04-ES6', link: '/interview/04-ES6.md'},
                    {text: '05-TS', link: '/interview/05-typescript.md'},
                    {text: '06-Vue', link: '/interview/06-vue.md'},
                    {text: '07-React', link: '/interview/08-react16.md'},
                    {text: '08-工程化', link: '/interview/08-engineering.md'},
                    {text: '09-网络', link: '/interview/09-network.md'},
                    {text: '10-浏览器', link: '/interview/10-Browser.md'},
                    {text: '11-手写题', link: '/interview/11-Handwriting.md'},
                    {text: '12-项目常考', link: '/interview/12-Optimize.md'},
                ]
            }
        ],
        '/diary/': [
            {
                text: '🍒随记',
                items: [
                    {text: '2023年', link: '/diary/index.md'},
                    {text: '2024年', link: '/diary/2024'},
                    {text: '2025年', link: '/diary/2025'},
                ]
            }
        ],
        '/about/': [
            {
                text: '🍒 关于',
                items: [
                    {text: '关于我', link: '/about/'},
                ]
            }
        ],

         '/frontend/01-javascript/': [
            {
                text: 'javascript',
                items: [
                    {text: 'javascript', link: '/frontend/01-javascript/01-javascript.md'},
                    // {text: '数据类型', link: '/frontend/01-javascript/02-datatype.md'},
                    // {text: '流程控制', link: '/frontend/01-javascript/03-controlflow.md'},
                    // {text: '函数', link: '/frontend/01-javascript/04-function.md'},
                    // {text: '对象', link: '/frontend/01-javascript/05-object.md'},
                    // {text: '数组', link: '/frontend/01-javascript/06-array.md'},
                    // {text: '正则', link: '/frontend/01-javascript/07-regex.md'},
                    // {text: 'DOM', link: '/frontend/01-javascript/08-dom.md'},
                    // {text: 'BOM', link: '/frontend/01-javascript/09-bom.md'},
                    // {text: '事件', link: '/frontend/01-javascript/10-event.md'},
                    // {text: '异步编程', link: '/frontend/01-javascript/11-async.md'},
                    // {text: '模块化', link: '/frontend/01-javascript/12-module.md'},
                    // {text: '设计模式', link: '/frontend/01-javascript/13-designpattern.md'},
                ]
            }
        ],
         '/frontend/02-ecmascript/': [
            {
                text: 'ecmascript',
                items: [
                    {text: 'ecmascript', link: '/frontend/02-ecmascript/01-ecmascript.md'},
                ]
            }
        ],
         '/frontend/03-typescript/': [
            {
                text: 'typescript',
                items: [
                    {text: 'typescript', link: '/frontend/03-typescript/01-typescript.md'},
                ]
            }
        ],
         '/frontend/04-vue2/': [
            {
                text: 'vue2',
                items: [
                    {text: 'vue2', link: '/frontend/04-vue2/01-vue2.md'},
                ]
            }
        ],
         '/frontend/05-vue3/': [
            {
                text: 'vue3',
                items: [
                    {text: 'vue3', link: '/frontend/05-vue3/01-vue3.md'},
                ]
            }
        ],
         '/frontend/06-react16/': [
            {
                text: 'React 16 学习指南',
                items: [
                    {text: '01-概述', link: '/frontend/06-react16/01-overview.md'},
                    {text: '02-核心概念', link: '/frontend/06-react16/02-core-concepts.md'},
                    {text: '03-组件开发', link: '/frontend/06-react16/02-component.md'},
                    {text: '04-生命周期', link: '/frontend/06-react16/03-lifecycle.md'},
                    {text: '05-Hooks', link: '/frontend/06-react16/04-hooks.md'},
                    {text: '06-性能优化', link: '/frontend/06-react16/05-performance.md'},
                    {text: '07-新特性', link: '/frontend/06-react16/06-new-features.md'},
                    {text: '08-完整指南', link: '/frontend/06-react16/01-react16.md'},
                ]
            }
        ],
         '/frontend/07-react18/': [
            {
                text: 'react18',
                items: [
                    {text: 'react18', link: '/frontend/07-react18/01-react18.md'},
                ]
            }
        ],
         '/backend/01-nodejs/': [
            {
                text: '前端基础',
                items: [
                    {text: 'nodejs', link: '/backend/01-nodejs/01-nodejs.md'},
                ]
            }
        ],
         '/backend/02-express/': [
            {
                text: '前端基础',
                items: [
                    {text: 'express', link: '/backend/02-express/01-express.md'},
                ]
            }
        ],
         '/backend/03-nestjs/': [
            {
                text: '前端基础',
                items: [
                    {text: 'nestjs', link: '/backend/03-nestjs/01-nestjs.md'},
                ]
            }
        ],
        //  '/webpack/': [
        //     {
        //         text: '前端基础',
        //         items: [
        //             {text: 'webpack', link: '/frontend/11-webpack/01-webpack.md'},
        //         ]
        //     }
        // ],
        //  '/vite/': [
        //     {
        //         text: '前端基础',
        //         items: [
        //             {text: 'vite', link: '/frontend/12-vite/01-vite.md'},
        //         ]
        //     }
        // ],
        //  '/esbuild/': [
        //     {
        //         text: '前端基础',
        //         items: [
        //             {text: 'esbuild', link: '/frontend/13-esbuild/01-esbuild.md'},
        //         ]
        //     }
        // ],
        //  '/rollup/': [
        //     {
        //         text: '前端基础',
        //         items: [
        //             {text: 'rollup', link: '/frontend/14-rollup/01-rollup.md'},
        //         ]
        //     }
        // ],

    }