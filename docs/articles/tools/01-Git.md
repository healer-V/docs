# Git 版本控制工具

## 一、Git 概述

::: tip 什么是 Git
Git 是一个分布式版本控制系统，用于跟踪文件的变化，协调多人协作开发，并管理项目的版本历史。它是目前最流行的版本控制工具。
:::

### 1、Git 的核心概念

::: info 核心概念
- **工作区（Working Directory）**：你正在编辑的文件
- **暂存区（Staging Area）**：准备提交的文件
- **本地仓库（Local Repository）**：已提交的版本历史
- **远程仓库（Remote Repository）**：远程服务器上的仓库
:::

### 2、Git 的优势

::: details 点击查看优势

- ✅ **分布式**：每个开发者都有完整的版本历史
- ✅ **快速**：大部分操作在本地完成
- ✅ **分支管理**：强大的分支和合并功能
- ✅ **数据完整性**：使用 SHA-1 哈希确保数据完整性
- ✅ **开源免费**：完全免费且开源

:::

## 二、Git 基本配置

### 1、配置用户名和邮箱

::: warning 重要
提交代码时，必须配置用户名和邮箱，这些信息会记录在每次提交中。
:::

#### 1.1、全局配置

```bash
# 配置全局用户名
git config --global user.name "Your Name"

# 配置全局邮箱
git config --global user.email "your.email@example.com"

# 查看全局配置
git config --global --list
```

#### 1.2、本地仓库配置

```bash
# 只配置当前仓库的用户名和邮箱
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 查看当前仓库配置
git config --list
```

### 2、配置 SSH 密钥

#### 2.1、生成 SSH 密钥

```bash
# 生成 SSH 密钥对
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"

# 按提示操作：
# 1. 选择保存位置（默认：~/.ssh/id_rsa）
# 2. 设置密码（可选，建议设置）
```

#### 2.2、查看 SSH 公钥

```bash
# 查看并复制 SSH 公钥
cat ~/.ssh/id_rsa.pub

# 或者使用
cat ~/.ssh/id_rsa.pub | pbcopy  # macOS
cat ~/.ssh/id_rsa.pub | clip    # Windows
```

#### 2.3、配置 SSH 密钥别名

::: tip 多密钥管理
如果你有多个 Git 账户（如 GitHub、GitLab），可以配置 SSH 别名来管理不同的密钥。
:::

```bash
# 编辑 SSH 配置文件
vim ~/.ssh/config
```

```ssh-config
# GitHub
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa_github
    IdentitiesOnly yes

# GitLab
Host gitlab.com
    HostName gitlab.com
    User git
    IdentityFile ~/.ssh/id_rsa_gitlab
    IdentitiesOnly yes

# 公司 Git 服务器
Host company-git
    HostName git.company.com
    User git
    IdentityFile ~/.ssh/id_rsa_company
    Port 22
```

#### 2.4、测试 SSH 连接

```bash
# 测试 GitHub 连接
ssh -T git@github.com

# 测试 GitLab 连接
ssh -T git@gitlab.com
```

### 3、配置别名

::: info 别名的作用
通过配置别名，可以简化常用 Git 命令，提高工作效率。
:::

```bash
# 常用别名配置
git config --global alias.st status
git config --global alias.ci commit
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'

# 使用别名
git st    # 等同于 git status
git ci -m "message"  # 等同于 git commit -m "message"
```

### 4、配置默认分支

```bash
# 设置默认分支为 main
git config --global init.defaultBranch main

# 设置默认分支为 master（旧版本）
git config --global init.defaultBranch master
```

### 5、配置 Pull Rebase

::: tip Rebase 的优势
使用 rebase 可以保持提交历史的线性，避免产生大量的 merge commit。
:::

```bash
# 配置 pull 时使用 rebase
git config --global pull.rebase true

# 或者使用 merge（默认）
git config --global pull.rebase false
```

## 三、Git 仓库操作

### 1、初始化仓库

#### 1.1、在当前目录初始化

```bash
# 初始化 Git 仓库
git init

# 初始化并设置默认分支
git init -b main
```

#### 1.2、在指定目录创建仓库

```bash
# 在指定目录创建仓库
git init my-project

# 创建并进入目录
git init my-project && cd my-project
```

### 2、克隆远程仓库

#### 2.1、克隆仓库

```bash
# SSH 方式克隆
git clone git@github.com:username/repository.git

# HTTPS 方式克隆
git clone https://github.com/username/repository.git

# 克隆到指定目录
git clone git@github.com:username/repository.git my-project
```

#### 2.2、克隆指定分支

```bash
# 克隆指定分支
git clone -b dev git@github.com:username/repository.git

# 克隆指定分支到指定目录
git clone -b dev git@github.com:username/repository.git my-project
```

#### 2.3、克隆指定深度

```bash
# 只克隆最近的提交（浅克隆）
git clone --depth 1 git@github.com:username/repository.git

# 克隆指定深度的提交
git clone --depth 5 git@github.com:username/repository.git
```

### 3、查看仓库信息

```bash
# 查看远程仓库信息
git remote -v

# 查看仓库状态
git status

# 查看仓库配置
git config --list
```

## 四、Git 工作流

### 1、添加文件

#### 1.1、基本操作

```bash
# 添加所有文件到暂存区
git add .

# 添加指定文件
git add README.md

# 添加多个文件
git add file1.txt file2.txt

# 添加指定目录
git add src/
```

#### 1.2、交互式添加

```bash
# 交互式选择要添加的文件
git add -i

# 或者使用
git add -p  # 交互式选择要添加的代码块
```

#### 1.3、撤销暂存

```bash
# 撤销所有暂存的文件
git reset HEAD

# 撤销指定文件的暂存
git reset HEAD README.md

# 或者使用别名
git unstage README.md
```

### 2、提交文件

#### 2.1、基本提交

```bash
# 提交所有暂存的文件
git commit -m "提交信息"

# 提交指定文件
git commit README.md -m "更新 README"

# 提交并跳过暂存区（直接提交已跟踪的文件）
git commit -am "提交信息"
```

#### 2.2、提交信息规范

::: tip 提交信息规范
良好的提交信息有助于理解代码变更的目的和历史。
:::

```bash
# 格式：<type>(<scope>): <subject>
# type: feat, fix, docs, style, refactor, test, chore
# scope: 影响范围（可选）
# subject: 简短描述

# 示例
git commit -m "feat(user): 添加用户登录功能"
git commit -m "fix(api): 修复接口超时问题"
git commit -m "docs: 更新 README 文档"
```

#### 2.3、修改提交

```bash
# 修改最后一次提交信息
git commit --amend -m "新的提交信息"

# 修改最后一次提交并添加文件
git add forgotten-file.txt
git commit --amend --no-edit
```

### 3、查看状态

#### 3.1、查看工作区状态

```bash
# 查看所有文件状态
git status

# 简短格式
git status -s

# 查看指定文件状态
git status README.md
```

#### 3.2、查看文件差异

```bash
# 查看工作区与暂存区的差异
git diff

# 查看暂存区与仓库的差异
git diff --staged

# 查看指定文件的差异
git diff README.md

# 查看两个提交之间的差异
git diff commit1 commit2
```

### 4、查看提交历史

#### 4.1、基本查看

```bash
# 查看所有提交历史
git log

# 单行显示
git log --oneline

# 图形化显示分支
git log --oneline --graph --all

# 查看最近的 N 条提交
git log -5
```

#### 4.2、高级查看

```bash
# 查看提交历史及文件修改详情
git log -p

# 查看提交历史及统计信息
git log --stat

# 查看指定文件的提交历史
git log -- README.md

# 查看指定作者的提交
git log --author="Your Name"

# 查看指定时间范围的提交
git log --since="2023-01-01" --until="2023-12-31"
```

### 5、撤销修改

#### 5.1、撤销工作区修改

```bash
# 撤销所有未提交的更改
git checkout .

# 撤销指定文件的更改
git checkout README.md

# 使用 restore 命令（Git 2.23+）
git restore README.md
git restore .
```

#### 5.2、撤销暂存区修改

```bash
# 撤销所有暂存的文件
git reset HEAD

# 撤销指定文件的暂存
git reset HEAD README.md

# 使用 restore 命令
git restore --staged README.md
```

#### 5.3、撤销提交

```bash
# 撤销最后一次提交，保留更改
git reset --soft HEAD~1

# 撤销最后一次提交，不保留更改
git reset --hard HEAD~1

# 撤销到指定提交
git reset --hard commit-hash
```

::: warning 危险操作
`git reset --hard` 会永久删除未提交的更改，请谨慎使用！
:::

### 6、删除文件

#### 6.1、删除工作区文件

```bash
# 删除文件（需要手动添加到暂存区）
rm README.md
git add README.md
git commit -m "删除 README.md"
```

#### 6.2、使用 Git 删除

```bash
# 删除文件并添加到暂存区
git rm README.md

# 删除文件但保留工作区文件
git rm --cached README.md

# 强制删除
git rm -f README.md
```

## 五、Git 分支管理

### 1、查看分支

```bash
# 查看所有本地分支
git branch

# 查看所有分支（包括远程）
git branch -a

# 查看远程分支
git branch -r

# 查看当前分支
git branch --show-current
```

### 2、创建分支

```bash
# 创建新分支
git branch dev

# 创建并切换到新分支
git checkout -b dev

# 或者使用（Git 2.23+）
git switch -c dev

# 基于指定提交创建分支
git branch dev commit-hash
```

### 3、切换分支

```bash
# 切换到指定分支
git checkout dev

# 或者使用（Git 2.23+）
git switch dev

# 切换到上一个分支
git checkout -
```

### 4、合并分支

#### 4.1、基本合并

```bash
# 合并指定分支到当前分支
git merge dev

# 合并时创建合并提交
git merge --no-ff dev

# 合并时只快进（如果可能）
git merge --ff-only dev
```

#### 4.2、解决冲突

::: warning 合并冲突
当两个分支修改了同一文件的同一部分时，会产生合并冲突，需要手动解决。
:::

```bash
# 1. 查看冲突文件
git status

# 2. 编辑冲突文件，解决冲突
# <<<<<<< HEAD
# 当前分支的内容
# =======
# 要合并的分支的内容
# >>>>>>> branch-name

# 3. 标记冲突已解决
git add resolved-file.txt

# 4. 完成合并
git commit
```

### 5、删除分支

```bash
# 删除已合并的分支
git branch -d dev

# 强制删除分支
git branch -D dev

# 删除远程分支
git push origin --delete dev
```

### 6、重命名分支

```bash
# 重命名当前分支
git branch -m new-name

# 重命名指定分支
git branch -m old-name new-name
```

## 六、Git 远程仓库

### 1、查看远程仓库

```bash
# 查看所有远程仓库
git remote -v

# 查看远程仓库详细信息
git remote show origin
```

### 2、添加远程仓库

```bash
# 添加远程仓库
git remote add origin git@github.com:username/repository.git

# 添加多个远程仓库
git remote add upstream git@github.com:original/repository.git
```

### 3、修改远程仓库

```bash
# 修改远程仓库地址
git remote set-url origin git@github.com:username/new-repository.git

# 查看远程仓库地址
git remote get-url origin
```

### 4、删除远程仓库

```bash
# 删除远程仓库
git remote rm origin

# 或者使用
git remote remove origin
```

### 5、拉取远程更改

```bash
# 拉取远程仓库的最新更改
git pull

# 拉取指定远程分支
git pull origin main

# 拉取时使用 rebase
git pull --rebase origin main
```

### 6、推送本地更改

```bash
# 首次推送到远程仓库
git push -u origin main

# 推送本地分支到远程
git push origin main

# 推送所有本地分支
git push --all origin

# 推送所有标签
git push --tags origin

# 强制推送（谨慎使用）
git push --force origin main
```

::: warning 强制推送
`git push --force` 会覆盖远程历史，可能影响其他开发者，请谨慎使用！
:::

## 七、VSCode 中使用 Git

### 1、VSCode Git 集成概述

::: tip VSCode Git 功能
VSCode 内置了强大的 Git 支持，提供了可视化的 Git 操作界面，无需使用命令行即可完成大部分 Git 操作。
:::

### 2、Git 面板介绍

#### 2.1、源代码管理面板

::: info 打开方式
- 点击左侧活动栏的源代码管理图标（或按 `Ctrl+Shift+G` / `Cmd+Shift+G`）
- 使用命令面板：`Ctrl+Shift+P`（Mac: `Cmd+Shift+P`），输入 "Git: Show Source Control"
:::

**面板功能区域：**
- **更改区域**：显示所有修改的文件
- **暂存更改**：显示已暂存的文件
- **消息框**：输入提交信息
- **操作按钮**：提交、同步、刷新等

#### 2.2、状态指示器

::: details 文件状态图标

- **U**：未跟踪的文件（Untracked）
- **M**：已修改的文件（Modified）
- **D**：已删除的文件（Deleted）
- **A**：已添加的文件（Added）
- **R**：已重命名的文件（Renamed）
- **C**：冲突的文件（Conflict）

:::

### 3、基本操作

#### 3.1、查看更改

```bash
# 在 VSCode 中：
# 1. 打开源代码管理面板
# 2. 点击文件查看差异
# 3. 或使用 "Git: Open Changes" 命令
```

**操作步骤：**
1. 在源代码管理面板中，点击文件名
2. 右侧会显示文件的差异对比
3. 绿色表示新增，红色表示删除

#### 3.2、暂存文件

**方法一：使用界面**
1. 在源代码管理面板中，点击文件旁的 `+` 号
2. 或右键文件，选择 "暂存更改"

**方法二：使用命令**
- `Ctrl+Shift+P` → 输入 "Git: Stage" → 选择文件

**批量操作：**
- 点击 "更改" 旁的 `+` 号，暂存所有更改
- 或使用命令 "Git: Stage All Changes"

#### 3.3、取消暂存

**操作步骤：**
1. 在 "暂存的更改" 区域，点击文件旁的 `-` 号
2. 或右键文件，选择 "取消暂存更改"

#### 3.4、提交更改

**操作步骤：**
1. 暂存要提交的文件
2. 在消息框中输入提交信息
3. 点击 `✓` 按钮或按 `Ctrl+Enter`（Mac: `Cmd+Enter`）提交

**提交选项：**
- **提交**：只提交到本地仓库
- **提交并推送**：提交并推送到远程仓库
- **提交全部**：提交所有暂存的更改

#### 3.5、撤销更改

**撤销工作区更改：**
1. 在源代码管理面板中，右键文件
2. 选择 "放弃更改"
3. 确认操作

**撤销所有更改：**
- 使用命令 "Git: Discard All Changes"

::: warning 注意
撤销操作无法恢复，请谨慎使用！
:::

### 4、分支管理

#### 4.1、查看分支

**方法一：状态栏**
- 左下角状态栏显示当前分支名称
- 点击可切换分支

**方法二：命令面板**
- `Ctrl+Shift+P` → 输入 "Git: Checkout to..."

**方法三：分支视图**
- 使用扩展 "Git Graph" 查看分支图

#### 4.2、创建分支

**操作步骤：**
1. 点击左下角分支名称
2. 选择 "创建新分支..."
3. 输入分支名称
4. 按 `Enter` 创建并切换

**或使用命令：**
- `Ctrl+Shift+P` → "Git: Create Branch..."

#### 4.3、切换分支

**操作步骤：**
1. 点击左下角分支名称
2. 选择要切换的分支
3. 或使用命令 "Git: Checkout to..."

#### 4.4、合并分支

**操作步骤：**
1. 切换到目标分支（如 `main`）
2. `Ctrl+Shift+P` → "Git: Merge Branch..."
3. 选择要合并的分支
4. 解决冲突（如果有）

#### 4.5、删除分支

**操作步骤：**
1. `Ctrl+Shift+P` → "Git: Delete Branch..."
2. 选择要删除的分支
3. 确认删除

### 5、远程仓库操作

#### 5.1、查看远程仓库

**操作步骤：**
1. `Ctrl+Shift+P` → "Git: Show Remote"
2. 或使用命令面板查看远程信息

#### 5.2、拉取更改

**方法一：使用按钮**
- 点击源代码管理面板的 "..." 菜单
- 选择 "拉取"

**方法二：使用命令**
- `Ctrl+Shift+P` → "Git: Pull"

**方法三：同步**
- 点击状态栏的同步图标
- 或使用 "Git: Sync" 命令

#### 5.3、推送更改

**方法一：使用按钮**
- 点击源代码管理面板的 "..." 菜单
- 选择 "推送"

**方法二：使用命令**
- `Ctrl+Shift+P` → "Git: Push"

**方法三：提交并推送**
- 提交时选择 "提交并推送"

#### 5.4、克隆仓库

**操作步骤：**
1. `Ctrl+Shift+P` → "Git: Clone"
2. 输入仓库 URL
3. 选择保存位置
4. 选择是否在新窗口中打开

### 6、解决冲突

#### 6.1、冲突标记

::: info 冲突显示
VSCode 会在冲突文件中显示冲突标记，并提供解决选项。
:::

**冲突区域显示：**
```
<<<<<<< HEAD
当前分支的内容
=======
要合并的分支的内容
>>>>>>> branch-name
```

#### 6.2、解决冲突

**方法一：使用界面**
1. 打开冲突文件
2. 点击 "接受当前更改"、"接受传入的更改" 或 "接受双方更改"
3. 手动编辑解决冲突
4. 保存文件

**方法二：使用合并编辑器**
1. VSCode 会自动打开合并编辑器
2. 左侧：当前分支
3. 右侧：要合并的分支
4. 中间：解决后的结果
5. 点击 "接受" 按钮选择更改

**完成解决：**
1. 解决所有冲突后，暂存文件
2. 提交更改完成合并

### 7、Git 历史查看

#### 7.1、查看提交历史

**方法一：使用 Git Graph 扩展**
1. 安装 "Git Graph" 扩展
2. 点击源代码管理面板的 "查看 Git 图" 图标
3. 查看可视化的提交历史

**方法二：使用命令**
- `Ctrl+Shift+P` → "Git: View History"

#### 7.2、查看文件历史

**操作步骤：**
1. 在文件资源管理器中，右键文件
2. 选择 "Git: View File History"
3. 查看该文件的所有提交历史

#### 7.3、比较版本

**操作步骤：**
1. 在 Git 历史中，选择两个提交
2. 右键选择 "比较提交"
3. 查看差异

### 8、常用快捷键

::: details 快捷键列表

| 操作 | Windows/Linux | macOS |
|------|--------------|-------|
| 打开源代码管理 | `Ctrl+Shift+G` | `Cmd+Shift+G` |
| 提交 | `Ctrl+Enter` | `Cmd+Enter` |
| 拉取 | `Ctrl+Shift+P` → Pull | `Cmd+Shift+P` → Pull |
| 推送 | `Ctrl+Shift+P` → Push | `Cmd+Shift+P` → Push |
| 切换分支 | 点击状态栏分支名 | 点击状态栏分支名 |
| 查看差异 | 点击文件 | 点击文件 |

:::

### 9、Git 扩展推荐

#### 9.1、Git Graph

::: tip 推荐扩展
**Git Graph**：可视化 Git 提交历史，支持分支图、提交详情、文件历史等。
:::

**安装：**
1. 打开扩展面板（`Ctrl+Shift+X`）
2. 搜索 "Git Graph"
3. 点击安装

**功能：**
- 可视化分支图
- 查看提交详情
- 比较提交
- 创建/切换/合并分支
- 查看文件历史

#### 9.2、GitLens

::: tip 推荐扩展
**GitLens**：增强 Git 功能，提供代码作者信息、提交历史、文件注释等。
:::

**主要功能：**
- 代码作者信息
- 文件/行提交历史
- 提交搜索
- 比较任意版本
- 仓库和文件历史

#### 9.3、Git History

**功能：**
- 查看文件历史
- 查看行历史
- 比较文件版本

### 10、VSCode Git 配置

#### 10.1、Git 设置

**打开设置：**
- `Ctrl+,`（Mac: `Cmd+,`）
- 搜索 "git"

**常用设置：**
```json
{
  // 自动获取
  "git.autofetch": true,
  
  // 确认同步
  "git.confirmSync": true,
  
  // 启用编辑器内差异
  "git.enableSmartCommit": true,
  
  // 提交后自动获取
  "git.postCommitCommand": "sync",
  
  // 显示内联打开的文件更改
  "git.decorations.enabled": true
}
```

#### 10.2、忽略文件配置

**操作步骤：**
1. 在源代码管理面板中，右键未跟踪的文件
2. 选择 "添加到 `.gitignore`"
3. 选择忽略规则类型

**或手动编辑 `.gitignore`：**
```bash
# 依赖
node_modules/
dist/

# 环境变量
.env
.env.local

# 编辑器
.vscode/
.idea/

# 系统文件
.DS_Store
Thumbs.db
```

## 八、最佳实践

### 1、提交规范

::: tip 提交信息规范
遵循统一的提交信息格式，有助于团队协作和代码审查。
:::

**格式：**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型（type）：**
- `feat`：新功能
- `fix`：修复 bug
- `docs`：文档更新
- `style`：代码格式（不影响功能）
- `refactor`：重构
- `test`：测试相关
- `chore`：构建/工具相关

### 2、分支策略

::: info 推荐策略
- **main/master**：生产环境代码
- **develop**：开发环境代码
- **feature/***：功能分支
- **bugfix/***：修复分支
- **hotfix/***：紧急修复分支
:::

### 3、工作流程

**功能开发：**
1. 从 `develop` 创建 `feature/xxx` 分支
2. 开发完成后合并到 `develop`
3. 测试通过后合并到 `main`

**Bug 修复：**
1. 从 `main` 创建 `bugfix/xxx` 分支
2. 修复后合并到 `main` 和 `develop`

### 4、常见问题

#### 4.1、提交到错误的分支

```bash
# 1. 撤销提交但保留更改
git reset --soft HEAD~1

# 2. 切换到正确的分支
git checkout correct-branch

# 3. 重新提交
git commit -m "提交信息"
```

#### 4.2、忘记提交文件

```bash
# 添加到上次提交
git add forgotten-file.txt
git commit --amend --no-edit
```

#### 4.3、撤销已推送的提交

::: warning 危险操作
如果已经推送到远程，需要强制推送，可能影响其他开发者。
:::

```bash
# 1. 撤销本地提交
git reset --hard HEAD~1

# 2. 强制推送（谨慎使用）
git push --force origin branch-name
```

## 九、总结

### 1、Git 核心命令

::: info 常用命令速查

| 操作 | 命令 |
|------|------|
| 初始化 | `git init` |
| 克隆 | `git clone <url>` |
| 状态 | `git status` |
| 添加 | `git add .` |
| 提交 | `git commit -m "message"` |
| 推送 | `git push` |
| 拉取 | `git pull` |
| 分支 | `git branch` |
| 切换 | `git checkout <branch>` |
| 合并 | `git merge <branch>` |

:::

### 2、VSCode Git 优势

::: tip 使用建议
- ✅ **可视化操作**：无需记忆命令
- ✅ **实时反馈**：即时查看更改
- ✅ **冲突解决**：可视化解决冲突
- ✅ **历史查看**：方便查看提交历史
- ✅ **扩展丰富**：丰富的 Git 扩展
:::

### 3、学习资源

::: details 推荐资源
- 📚 **官方文档**：https://git-scm.com/doc
- 🎓 **交互式教程**：https://learngitbranching.js.org/
- 📖 **Pro Git 书籍**：https://git-scm.com/book
- 🎥 **视频教程**：各大在线教育平台
:::

---

**掌握 Git 和 VSCode Git 操作，可以大幅提升开发效率！** 🚀
