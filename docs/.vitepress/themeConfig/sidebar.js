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
                text: '🥔前端基础',
                // collapsible: true,
                items: [
                    { text: 'HTML&CSS', link: '/articles/basic/index.md' },
                    { text: 'Javascript', link: '/articles/basic/javascript.md' },
                    { text: 'TypeScript', link: '/articles/basic/typescript.md' },
                    { text: 'Node.js', link: '/articles/basic/nodejs.md' },
                ]
            },
            {
                text: '🍇网络基础',
                // collapsible: true,
                items: [
                    { text: '网络协议', link: '/articles/network/http.md' },
                    { text: 'UDP/TCP', link: '/articles/network/udp&tcp.md' },
                ]
            },
            {
                text: '🥝浏览器',
                // collapsible: true,
                items: [
                    { text: '浏览器渲染原理', link: '/articles/browser/render.md' },
                    { text: '事件循环', link: '/articles/browser/eventloop.md' },
                    { text: 'V8引擎', link: '/articles/browser/V8.md' },
                ]
            },
            {
                text: '🍒框架',
                // collapsible: true,
                items: [
                    { text: 'Vue', link: '/articles/frame/Vue.md' },
                    { text: 'React', link: '/articles/frame/React.md' },
                    { text: 'Angular', link: '/articles/frame/Angular.md' },
                    { text: 'Uniapp', link: '/articles/frame/Uniapp.md' },
                    { text: 'Flutter', link: '/articles/frame/Flutter.md' },
                    { text: 'React Native', link: '/articles/frame/ReactNative.md' },
    
                ]
            },
            {
                text: '🥭前端工程化',
                // collapsible: true,
                items: [
                    { text: 'Webpack', link: '/articles/engineering/Webpack.md' },
                    { text: 'Vite', link: '/articles/engineering/Vite.md' },
                    { text: 'ESBuild', link: '/articles/engineering/ESBuild.md' },
                    { text: 'Rollup', link: '/articles/engineering/Rollup.md' },
                    { text: 'Rolldown', link: '/articles/engineering/Rolldown.md' },
                ]
            },
            {
                text: '🥪工具',
                // collapsible: true,
                items: [
                    { text: 'Git', link: '/articles/tools/Git.md' },
                    { text: 'Markdown', link: '/articles/tools/Markdown.md' },
                    { text: 'VSCode', link: '/articles/tools/Vscode.md' },
                ]
            },
    
            {
                text: '🍘关于',
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
                { text: 'vitepress搭建文档', link: '/blog/' }, // /blog/index.md
                // { text: 'Three', link: '/blog/html' }, // /blog/three.md
                // { text: 'Four', link: '/blog/four' } // /blog/four.md
            ]
        }
    ],
    '/HarmonyOS/': [
        {
            text: '🍚HarmonyOS',
            items: [
                // This shows `/HarmonyOS/index.md` page.
                { text: '鸿蒙开发', link: '/HarmonyOS/' }, // /HarmonyOS/index.md
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
                { text: '06-network', link: '/interview/network.md' }, // /interview/four.md
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