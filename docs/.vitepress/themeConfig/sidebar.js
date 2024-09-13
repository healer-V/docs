export const sidebar =
{
    '/articles/':[
        {
        text: '文章',
        items: [
            {
                text: '🧀站点介绍',
                link: '/articles/'
            },
            {
                text: '🥩前端基础',
                // collapsible: true,
                items: [
                    { text: 'HTML', link: '/articles/basic/html.md' },
                    { text: 'CSS', link: '/articles/basic/css.md' },
                    { text: 'Javascript', link: '/articles/basic/javascript.md' },
                    { text: 'TypeScript', link: '/articles/basic/typescript.md' },
                ]
            },
            {
                text: '🍇网络相关',
                // collapsible: true,
                items: [
                    { text: 'HTTP', link: '/articles/network/http.md' },
                    { text: 'UDP/TCP', link: '/articles/network/udp&tcp.md' },
                ]
            },
            {
                text: '🥝浏览器相关',
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
                // { text: 'Three', link: '/blog/three' }, // /blog/three.md
                // { text: 'Four', link: '/blog/four' } // /blog/four.md
            ]
        }
    ]
}