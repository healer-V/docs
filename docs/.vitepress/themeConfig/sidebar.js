export const sidebar =
{
    '/articles/':[
        {
        text: '首页',
        items: [
            // {
            //     text: '🍇前言',
            //     link: '/articles/'
            // },
            {
                text: '🍎前端基础',
                // collapsible: true,
                items: [
                    { text: '01-HTML', link: '/articles/basic/01-html.md' },
                    { text: '02-CSS', link: '/articles/basic/02-css.md' },
                    { text: '03-JS', link: '/articles/basic/02-javascript.md' },
                    { text: '04-ES6', link: '/articles/basic/03-ecmascript.md' },
                    { text: '05-TS', link: '/articles/basic/04-typescript.md' },
                    { text: '06-Vue2', link: '/articles/basic/05-vue2.md' },
                    { text: '07-Vue3', link: '/articles/basic/06-vue3.md' },
                    { text: '08-React', link: '/articles/basic/07-react.md' },
                    { text: '09-Node.js', link: '/articles/basic/08-nodejs.md' },
                    { text: '10-Sass', link: '/articles/basic/09-Sass.md' },
                ]
            },
               {
                text: '🥝浏览器基础',
                // collapsible: true,
                items: [
                    { text: '01-浏览器基础', link: '/articles/browser/01-basic.md' },
                    { text: '02-浏览器渲染原理', link: '/articles/browser/02-render.md' },
                    { text: '03-事件循环', link: '/articles/browser/03-eventloop.md' },
                ]
            },
            {
                text: '🍓网络基础',
                // collapsible: true,
                items: [
                    { text: '01-HTTP协议', link: '/articles/network/01-http.md' },
                    { text: '02-TCP/IP协议', link: '/articles/network/02-tcp.md' },
                ]
            },
         
            {
                text: '🍎混合App开发',
                // collapsible: true,
                items: [
                    { text: '01-Uniapp', link: '/articles/frame/01-Uniapp.md' },
                    { text: '02-Flutter', link: '/articles/frame/02-Flutter.md' },
                    { text: '03-React Native', link: '/articles/frame/03-ReactNative.md' },
                    { text: '04-HarmonyOS', link: '/articles/frame/04-HarmonyOS.md' },
                    { text: '05-Electron', link: '/articles/frame/05-Electron.md' },
    
                ]
            },
            {
                text: '🍉前端工程化',
                // collapsible: true,
                items: [
                    { text: '01-Webpack', link: '/articles/engineering/01-Webpack.md' },
                    { text: '02-Vite', link: '/articles/engineering/02-Vite.md' },
                    { text: '03-ESBuild', link: '/articles/engineering/03-ESBuild.md' },
                    { text: '04-Rollup', link: '/articles/engineering/04-Rollup.md' },
                ]
            },
            {
                text: '🍜工具',
                // collapsible: true,
                items: [
                    { text: '01-Git', link: '/articles/tools/01-Git.md' },
                    { text: '02-Markdown', link: '/articles/tools/02-Markdown.md' },
                    { text: '03-VsCode', link: '/articles/tools/03-Vscode.md' },
                    { text: '04-HBuilderX', link: '/articles/tools/04-HBuilderX.md' },
                ]
            },
    
            {
                text: '🍏博客',
                // collapsible: true,
                items: [
                    { text: '01-搭建博客', link: '/articles/blog/01-vitepress' },
                    { text: '02-VP中Md语法', link: '/articles/blog/02-markdown.md' },
                ]
            },
        ]
        }
    ],
    '/skill/': [
        {
            text: '🥤实践技巧',
            items: [
                // This shows `/blog/index.md` page.
                { text: '01-Vue组件封装', link: '/skill/01-Vue组件封装.md' }, // /blog/index.md
                { text: '02-React组件封装', link: '/skill/02-React组件封装.md' }, 
            ]
        }
    ],
    '/practice/': [
        {
            text: '🍚项目',
            items: [
                // This shows `/HarmonyOS/index.md` page.
                { text: '01-vue2移动端项目', link: '/practice/01-vue2.md' }, // /HarmonyOS/index.md
                { text: '02-vue2PC端项目', link: '/practice/02-vue2PC.md' }, // /HarmonyOS/index.md
                { text: '03-vue3移动端项目', link: '/practice/03-vue3.md' }, // /HarmonyOS/index.md
                { text: '04-vue3PC端项目', link: '/practice/04-vue3PC.md' }, // /HarmonyOS/index.md
                // { text: 'Three', link: '/HarmonyOS/html' }, // /HarmonyOS/three.md
                // { text: 'Four', link: '/HarmonyOS/four' } // /HarmonyOS/four.md
            ]
        }
    ],
    'project/' : [
        {
            text: '🥥项目要点',
            items: [
                // This shows `/project/index.md` page.
                { text: '移动端项目要点', link: '/project/' }, // /project/index.md
                { text: 'PC端项目要点', link: '/project/pc' }, // /project/three.md
                // { text: 'Four', link: '/project/four' } // /project/four.md
            ]
        }
    ],
    '/interview/': [
        {
            text: '📖 面试题',
            items: [
                { text: '01-Html', link: '/interview/' }, // /interview/index.md
                { text: '02-Css', link: '/interview/02-css.md' }, // /interview/css.md
                { text: '03-JS', link: '/interview/03-javascript.md' }, // /interview/four.md
                { text: '04-ES6', link: '/interview/04-ES6.md' }, // /interview/four.md
                { text: '05-TS', link: '/interview/09-typescript.md' }, // /interview/four.md
                { text: '06-Vue', link: '/interview/05-vue.md' }, // /interview/four.md
                { text: '07-React', link: '/interview/06-react.md' }, // /interview/four.md
                { text: '08-Engineer', link: '/interview/07-engineering.md' }, // /interview/four.md
                { text: '09-Network', link: '/interview/08-network.md' }, // /interview/four.md
            ]
        }
    ],   
    '/diary/' : [
        {
            text:'🍒随记',
            items: [
                {text: '2023年', link: '/diary/index.md'},
                {text: '2024年', link: '/diary/2024'},
                {text: '2025年', link: '/diary/2025'},
                // This shows `/diary/index.md` page.
            ]
        }
    ],
    '/about/': [
        {
            text: '🍒 关于',
            items: [
                // This shows `/about/index.md` page.
                { text: '关于我', link: '/about/' }, // /about/index.md
                { text: '友情链接', link: '/about/links' }, // /about/links.md
                // { text: 'Four', link: '/about/four' } // /about/four.md
            ]
        }
    ]
}