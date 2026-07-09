import{_ as a,c as n,a2 as i,o as p}from"./chunks/framework.CO0qOYmW.js";const o=JSON.parse('{"title":"4.1 Vim 文本编辑器","description":"","frontmatter":{"title":"4.1 Vim 文本编辑器","category":"运维 · Linux","tags":["Linux"],"excerpt":"在没有图形界面的服务器上，Vim 几乎是唯一内置的强大编辑器。掌握 Vim 的基本操作是 Linux 运维的必备技能。 很多人第一次用 Vim 连怎么退出都不知道。这很正常。本章从最实用的操作开始讲。 Vim 的设计哲学是通过模式切换来分离..."},"headers":[],"relativePath":"operation/00-linux/09-vim.md","filePath":"operation/00-linux/09-vim.md","lastUpdated":1773591891000}'),l={name:"operation/00-linux/09-vim.md"};function e(t,s,h,k,d,c){return p(),n("div",null,s[0]||(s[0]=[i(`<h1 id="_4-1-vim-文本编辑器" tabindex="-1">4.1 Vim 文本编辑器 <a class="header-anchor" href="#_4-1-vim-文本编辑器" aria-label="Permalink to &quot;4.1 Vim 文本编辑器&quot;">​</a></h1><h2 id="为什么要学-vim" tabindex="-1">为什么要学 Vim？ <a class="header-anchor" href="#为什么要学-vim" aria-label="Permalink to &quot;为什么要学 Vim？&quot;">​</a></h2><p>在没有图形界面的服务器上，Vim 几乎是唯一内置的强大编辑器。掌握 Vim 的基本操作是 Linux 运维的必备技能。</p><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>很多人第一次用 Vim 连怎么退出都不知道。这很正常。本章从最实用的操作开始讲。</p></div><hr><h2 id="vim-的三种模式" tabindex="-1">Vim 的三种模式 <a class="header-anchor" href="#vim-的三种模式" aria-label="Permalink to &quot;Vim 的三种模式&quot;">​</a></h2><p>Vim 的设计哲学是通过<strong>模式切换</strong>来分离&quot;输入内容&quot;和&quot;执行命令&quot;这两种操作，理解模式是学习 Vim 的关键。</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>┌──────────────────────────────────────────────────────┐</span></span>
<span class="line"><span>│                                                      │</span></span>
<span class="line"><span>│   Normal（普通模式）                                  │</span></span>
<span class="line"><span>│   ← 默认模式，用于导航和执行命令                        │</span></span>
<span class="line"><span>│   ↑ Esc     ↓ i/a/o 等                              │</span></span>
<span class="line"><span>│                                                      │</span></span>
<span class="line"><span>│   Insert（插入模式）                                   │</span></span>
<span class="line"><span>│   ← 在此模式下输入文本                                 │</span></span>
<span class="line"><span>│                                                      │</span></span>
<span class="line"><span>│   Visual（可视模式）                                   │</span></span>
<span class="line"><span>│   ← 在此模式下选择文本                                 │</span></span>
<span class="line"><span>│   ← 在 Normal 模式下按 v 进入                         │</span></span>
<span class="line"><span>│                                                      │</span></span>
<span class="line"><span>│   Command（命令行模式）                                │</span></span>
<span class="line"><span>│   ← 用于保存、退出、查找替换等                          │</span></span>
<span class="line"><span>│   ← 在 Normal 模式下按 : 进入                         │</span></span>
<span class="line"><span>│                                                      │</span></span>
<span class="line"><span>└──────────────────────────────────────────────────────┘</span></span></code></pre></div><p><strong>记住：按 <code>Esc</code> 总能回到 Normal 模式。迷失时按 <code>Esc</code>。</strong></p><hr><h2 id="最先要掌握的操作" tabindex="-1">最先要掌握的操作 <a class="header-anchor" href="#最先要掌握的操作" aria-label="Permalink to &quot;最先要掌握的操作&quot;">​</a></h2><h3 id="打开和退出" tabindex="-1">打开和退出 <a class="header-anchor" href="#打开和退出" aria-label="Permalink to &quot;打开和退出&quot;">​</a></h3><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 打开文件</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> vim</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> filename.txt</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 打开并跳到第 100 行</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> vim</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> +100</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> filename.txt</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 打开并搜索关键词</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> vim</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> +/keyword</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> filename.txt</span></span></code></pre></div><p><strong>退出（在 Normal 模式下）：</strong></p><table tabindex="0"><thead><tr><th>命令</th><th>说明</th></tr></thead><tbody><tr><td><code>:q</code></td><td>退出（文件未修改时）</td></tr><tr><td><code>:q!</code></td><td>强制退出，丢弃所有修改</td></tr><tr><td><code>:w</code></td><td>保存文件</td></tr><tr><td><code>:wq</code> 或 <code>:x</code></td><td>保存并退出</td></tr><tr><td><code>ZZ</code></td><td>保存并退出（快捷键）</td></tr><tr><td><code>ZQ</code></td><td>不保存退出（快捷键）</td></tr></tbody></table><hr><h2 id="normal-模式-移动光标" tabindex="-1">Normal 模式：移动光标 <a class="header-anchor" href="#normal-模式-移动光标" aria-label="Permalink to &quot;Normal 模式：移动光标&quot;">​</a></h2><p>不要用方向键，用以下键位（手不离主键区，效率更高）：</p><h3 id="基本移动" tabindex="-1">基本移动 <a class="header-anchor" href="#基本移动" aria-label="Permalink to &quot;基本移动&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>h ← 左</span></span>
<span class="line"><span>j ↓ 下</span></span>
<span class="line"><span>k ↑ 上</span></span>
<span class="line"><span>l → 右</span></span>
<span class="line"><span></span></span>
<span class="line"><span>0    行首（第一个字符）</span></span>
<span class="line"><span>^    行首（第一个非空字符）</span></span>
<span class="line"><span>$    行尾</span></span>
<span class="line"><span>gg   文件第一行</span></span>
<span class="line"><span>G    文件最后一行</span></span>
<span class="line"><span>50G  跳到第 50 行</span></span>
<span class="line"><span>:50  跳到第 50 行（命令行模式）</span></span></code></pre></div><h3 id="按词移动" tabindex="-1">按词移动 <a class="header-anchor" href="#按词移动" aria-label="Permalink to &quot;按词移动&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>w    下一个词的开头（Word）</span></span>
<span class="line"><span>e    当前词的结尾（End）</span></span>
<span class="line"><span>b    上一个词的开头（Back）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>W / E / B  同上，但以空格为词的分隔符</span></span></code></pre></div><h3 id="按屏幕移动" tabindex="-1">按屏幕移动 <a class="header-anchor" href="#按屏幕移动" aria-label="Permalink to &quot;按屏幕移动&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Ctrl+f    向下翻一页（Forward）</span></span>
<span class="line"><span>Ctrl+b    向上翻一页（Back）</span></span>
<span class="line"><span>Ctrl+d    向下翻半页（Down）</span></span>
<span class="line"><span>Ctrl+u    向上翻半页（Up）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>H    跳到屏幕顶部（High）</span></span>
<span class="line"><span>M    跳到屏幕中部（Middle）</span></span>
<span class="line"><span>L    跳到屏幕底部（Low）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>zz   将当前行滚到屏幕中央</span></span></code></pre></div><hr><h2 id="进入-insert-模式" tabindex="-1">进入 Insert 模式 <a class="header-anchor" href="#进入-insert-模式" aria-label="Permalink to &quot;进入 Insert 模式&quot;">​</a></h2><table tabindex="0"><thead><tr><th>键</th><th>进入位置</th></tr></thead><tbody><tr><td><code>i</code></td><td>光标前（Insert）</td></tr><tr><td><code>a</code></td><td>光标后（Append）</td></tr><tr><td><code>I</code></td><td>行首</td></tr><tr><td><code>A</code></td><td>行尾</td></tr><tr><td><code>o</code></td><td>在当前行下方新建一行</td></tr><tr><td><code>O</code></td><td>在当前行上方新建一行</td></tr><tr><td><code>s</code></td><td>删除当前字符并进入插入模式</td></tr><tr><td><code>S</code></td><td>删除当前行并进入插入模式</td></tr></tbody></table><hr><h2 id="normal-模式-编辑操作" tabindex="-1">Normal 模式：编辑操作 <a class="header-anchor" href="#normal-模式-编辑操作" aria-label="Permalink to &quot;Normal 模式：编辑操作&quot;">​</a></h2><h3 id="删除" tabindex="-1">删除 <a class="header-anchor" href="#删除" aria-label="Permalink to &quot;删除&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>x    删除光标处的字符</span></span>
<span class="line"><span>X    删除光标前的字符</span></span>
<span class="line"><span>dd   删除当前行</span></span>
<span class="line"><span>D    删除从光标到行尾</span></span>
<span class="line"><span>dw   删除一个词</span></span>
<span class="line"><span>d$   删除到行尾（等同于 D）</span></span>
<span class="line"><span>d0   删除到行首</span></span>
<span class="line"><span></span></span>
<span class="line"><span>5dd  删除 5 行（数字前缀可用于大多数命令）</span></span></code></pre></div><h3 id="复制和粘贴" tabindex="-1">复制和粘贴 <a class="header-anchor" href="#复制和粘贴" aria-label="Permalink to &quot;复制和粘贴&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>yy   复制当前行（Yank）</span></span>
<span class="line"><span>Y    复制当前行（同 yy）</span></span>
<span class="line"><span>yw   复制一个词</span></span>
<span class="line"><span>y$   复制到行尾</span></span>
<span class="line"><span></span></span>
<span class="line"><span>5yy  复制 5 行</span></span>
<span class="line"><span></span></span>
<span class="line"><span>p    粘贴到光标后（Paste）</span></span>
<span class="line"><span>P    粘贴到光标前</span></span>
<span class="line"><span></span></span>
<span class="line"><span>dd 然后 p  = 剪切并粘贴（移动行）</span></span></code></pre></div><h3 id="撤销和重做" tabindex="-1">撤销和重做 <a class="header-anchor" href="#撤销和重做" aria-label="Permalink to &quot;撤销和重做&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>u         撤销（Undo）</span></span>
<span class="line"><span>Ctrl+r    重做（Redo）</span></span>
<span class="line"><span>.         重复上一次操作（非常实用！）</span></span></code></pre></div><h3 id="修改" tabindex="-1">修改 <a class="header-anchor" href="#修改" aria-label="Permalink to &quot;修改&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>r    替换光标处的单个字符（不进入插入模式）</span></span>
<span class="line"><span>R    进入替换模式（输入内容会覆盖原有字符）</span></span>
<span class="line"><span>cw   删除一个词并进入插入模式（Change Word）</span></span>
<span class="line"><span>cc   删除整行并进入插入模式</span></span>
<span class="line"><span>C    删除到行尾并进入插入模式</span></span></code></pre></div><hr><h2 id="搜索和替换" tabindex="-1">搜索和替换 <a class="header-anchor" href="#搜索和替换" aria-label="Permalink to &quot;搜索和替换&quot;">​</a></h2><h3 id="搜索" tabindex="-1">搜索 <a class="header-anchor" href="#搜索" aria-label="Permalink to &quot;搜索&quot;">​</a></h3><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">/keyword</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">     向下搜索（Enter</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> 确认）</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">?</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">keyword     向上搜索</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">n</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">            下一个匹配</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">N</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">            上一个匹配</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">*</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">            搜索光标所在的单词</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">#            反向搜索光标所在的单词</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 搜索时忽略大小写</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:set</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> ignorecase</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:set</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> ic</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">      # 缩写</span></span></code></pre></div><h3 id="替换-命令行模式" tabindex="-1">替换（命令行模式） <a class="header-anchor" href="#替换-命令行模式" aria-label="Permalink to &quot;替换（命令行模式）&quot;">​</a></h3><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 替换当前行第一个匹配</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:s/old/new</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 替换当前行所有匹配</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:s/old/new/g</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 替换所有行所有匹配（全局替换）</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">%s/old/new/g</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 替换时逐个确认</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">%s/old/new/gc</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 替换指定范围（第 10 到 20 行）</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:10,20s/old/new/g</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 使用正则表达式</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">%s/</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\\</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">bfoo</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\\</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">b/bar/g</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    # 只替换完整单词 foo</span></span></code></pre></div><hr><h2 id="visual-模式-选择文本" tabindex="-1">Visual 模式：选择文本 <a class="header-anchor" href="#visual-模式-选择文本" aria-label="Permalink to &quot;Visual 模式：选择文本&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>v     字符选择（按字符）</span></span>
<span class="line"><span>V     行选择（按行）</span></span>
<span class="line"><span>Ctrl+v  列选择（块选择）</span></span></code></pre></div><p>选择后可以：</p><ul><li><code>d</code> 删除</li><li><code>y</code> 复制</li><li><code>c</code> 修改（删除并进入插入）</li><li><code>&gt;</code> / <code>&lt;</code> 缩进/取消缩进</li><li><code>:s/old/new/g</code> 只在选中范围内替换</li></ul><p><strong>列选择（Ctrl+v）非常实用：</strong></p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Ctrl+v → 选择多行的某一列 → I → 输入内容 → Esc</span></span>
<span class="line"><span>→ 在多行同时添加相同内容（如添加注释 #）</span></span></code></pre></div><hr><h2 id="命令行模式常用操作" tabindex="-1">命令行模式常用操作 <a class="header-anchor" href="#命令行模式常用操作" aria-label="Permalink to &quot;命令行模式常用操作&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 保存</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:w</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:w</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> newname.txt</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">     # 另存为</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 读取另一个文件的内容插入到当前位置</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:r</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> otherfile.txt</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 执行 Shell 命令（不退出 Vim）</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">!ls</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> -la</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">!date</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 将命令输出插入到文件</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:r</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> !date</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:r</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> !cat</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> /etc/hosts</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 显示行号</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:set</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> number</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:set</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> nu</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">       # 缩写</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:set</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> nonu</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">     # 取消行号</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 显示相对行号</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:set</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> relativenumber</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 设置 Tab 宽度</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:set</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> tabstop=</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">4</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:set</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> expandtab</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    # 用空格代替 Tab</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 语法高亮</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:syntax</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> on</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:syntax</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> off</span></span></code></pre></div><hr><h2 id="多文件和分屏" tabindex="-1">多文件和分屏 <a class="header-anchor" href="#多文件和分屏" aria-label="Permalink to &quot;多文件和分屏&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 打开多个文件</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> vim</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> file1.txt</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> file2.txt</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 在 Vim 中切换文件</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:n</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">     # 下一个文件</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:prev</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">  # 上一个文件</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:ls</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    # 列出所有打开的文件（buffer）</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 分割窗口</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:sp</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> file2.txt</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">     # 水平分割</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:vsp</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> file2.txt</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    # 垂直分割</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">Ctrl+w</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> s</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">          # 水平分割当前文件</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">Ctrl+w</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> v</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">          # 垂直分割当前文件</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 在分割窗口间移动</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">Ctrl+w</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> h/j/k/l</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    # 方向移动</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">Ctrl+w</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> w</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">          # 轮流切换</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 关闭窗口</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">:q</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> 或</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> Ctrl+w</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> q</span></span></code></pre></div><hr><h2 id="配置文件-vimrc" tabindex="-1">配置文件 ~/.vimrc <a class="header-anchor" href="#配置文件-vimrc" aria-label="Permalink to &quot;配置文件 ~/.vimrc&quot;">​</a></h2><p>把常用配置写入 <code>~/.vimrc</code>，每次打开 Vim 自动生效：</p><div class="language-vim vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">vim</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">&quot; ~/.vimrc</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">&quot; 显示行号</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">set</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> number</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">set</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> relativenumber</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">&quot; 语法高亮</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">syntax on</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">&quot; 缩进设置</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">set</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> tabstop</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">4</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">set</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> shiftwidth</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">4</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">set</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> expandtab</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">set</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> autoindent</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">&quot; 搜索设置</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">set</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> ignorecase</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">    &quot; 忽略大小写</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">set</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> smartcase</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">     &quot; 如果包含大写则区分大小写</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">set</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> hlsearch</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">      &quot; 高亮搜索结果</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">set</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> incsearch</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">     &quot; 增量搜索</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">&quot; 显示匹配括号</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">set</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> showmatch</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">&quot; 编码</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">set</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> encoding</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">utf-</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">8</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">&quot; 鼠标支持</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">set</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> mouse</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">a</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">&quot; 颜色主题</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">colorscheme</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> desert</span></span></code></pre></div><hr><h2 id="速查表" tabindex="-1">速查表 <a class="header-anchor" href="#速查表" aria-label="Permalink to &quot;速查表&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>[导航]</span></span>
<span class="line"><span>h j k l      左下上右</span></span>
<span class="line"><span>0 ^ $        行首/非空行首/行尾</span></span>
<span class="line"><span>gg G         文件头/尾</span></span>
<span class="line"><span>数字G        跳到第N行</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[插入模式]</span></span>
<span class="line"><span>i a          光标前/后插入</span></span>
<span class="line"><span>o O          下方/上方新建行</span></span>
<span class="line"><span>I A          行首/行尾插入</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[编辑]</span></span>
<span class="line"><span>x dd         删除字符/行</span></span>
<span class="line"><span>yy p         复制行/粘贴</span></span>
<span class="line"><span>u Ctrl+r     撤销/重做</span></span>
<span class="line"><span>. r          重复操作/替换字符</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[搜索]</span></span>
<span class="line"><span>/word        向下搜索</span></span>
<span class="line"><span>n N          下一个/上一个</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[命令]</span></span>
<span class="line"><span>:w :q :wq    保存/退出/保存退出</span></span>
<span class="line"><span>:q!          强制退出</span></span>
<span class="line"><span>:%s/a/b/g    全局替换</span></span></code></pre></div>`,63)]))}const g=a(l,[["render",e]]);export{o as __pageData,g as default};
