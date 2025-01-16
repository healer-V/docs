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
                    { text: '01-HTML&CSS', link: '/articles/basic/01-html.md' },
                    { text: '02-Javascript', link: '/articles/basic/02-javascript.md' },
                    { text: '03-ES6', link: '/articles/basic/03-ecmascript.md' },
                    { text: '04-TypeScript', link: '/articles/basic/04-typescript.md' },
                    { text: '05-Vue2', link: '/articles/basic/05-vue2.md' },
                    { text: '06-Vue3', link: '/articles/basic/06-vue3.md' },
                    { text: '07-React', link: '/articles/basic/07-react.md' },
                    { text: '08-Node.js', link: '/articles/basic/08-nodejs.md' },
                    { text: '09-Sass', link: '/articles/basic/09-Sass.md' },
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
                text: '🥝浏览器基础',
                // collapsible: true,
                items: [
                    { text: '01-浏览器基础', link: '/articles/browser/01-basic.md' },
                    { text: '02-浏览器渲染原理', link: '/articles/browser/02-render.md' },
                    { text: '03-事件循环', link: '/articles/browser/03-eventloop.md' },
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
                text: '🥤关于',
                // collapsible: true,
                items: [
                    { text: '关于我', link: '/articles/about/me' },
                    { text: '友情链接', link: '/articles/about/links' },
                ]
            },
        ]
        }
    ],
    '/blog/': [
        {
            text: '博客',
            items: [
                // This shows `/blog/index.md` page.
                { text: '01-vitepress搭建博客', link: '/blog/01-vitepress.md' }, // /blog/index.md
                { text: '02-vitepress中Md语法', link: '/blog/02-markdown.md' }, 
            ]
        }
    ],
    '/Practice/': [
        {
            text: '🍚Practice',
            items: [
                // This shows `/HarmonyOS/index.md` page.
                { text: '01-vue2移动端项目', link: '/Practice/01-vue2.md' }, // /HarmonyOS/index.md
                { text: '02-vue2PC端项目', link: '/Practice/02-vue2PC.md' }, // /HarmonyOS/index.md
                { text: '03-vue3移动端项目', link: '/Practice/03-vue3.md' }, // /HarmonyOS/index.md
                { text: '04-vue3PC端项目', link: '/Practice/04-vue3PC.md' }, // /HarmonyOS/index.md
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
            text: '🍓面试题',
            items: [
                { text: '01-html', link: '/interview/' }, // /interview/index.md
                { text: '02-css', link: '/interview/css.md' }, // /interview/css.md
                { text: '03-javascript', link: '/interview/javascript.md' }, // /interview/four.md
                { text: '04-vue', link: '/interview/vue.md' }, // /interview/four.md
                { text: '05-react', link: '/interview/vue.md' }, // /interview/four.md
                { text: '06-engineering', link: '/interview/engineering.md' }, // /interview/four.md
                { text: '07-network', link: '/interview/network.md' }, // /interview/four.md
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