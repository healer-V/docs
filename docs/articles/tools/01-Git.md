# Git 常用 
本篇主要介绍 Git 的常用命令，包括 Git 的基本配置、创建仓库、添加文件、提交文件、查看状态、查看提交历史、撤销修改、删除文件、分支管理、远程仓库等。

## 1.Git 基本配置
### 配置 SSH 密钥
提交代码到远程仓库时，需要使用 SSH 密钥进行身份验证，因此需要先配置 SSH 密钥。
```shell
# 生成 SSH 密钥
ssh-keygen -t rsa -C poneding@gmail.com
# 查看 SSH 密钥，复制到 GitHub/GitLab 等 SSH Keys 中
cat ~/.ssh/id_rsa.pub
```
添加 .ssh/config 文件，配置 SSH 密钥的别名，方便管理多个 SSH 密钥。
```shell
vim ~/.ssh/config
```
### 配置用户名和邮箱
**提交代码时，需要配置用户名和邮箱**
```shell
git config --global user.name "poneding"
git config --global user.email poneding@gmail.com

# 只配置当前仓库的用户名和邮箱
git config user.name "poneding"
git config user.email poneding@gmail.com
```
### 配置别名 
通过配置别名，可以简化 Git 命令的输入，例如，将 git status 简化为 git st 获取 Git 仓库的状态。

git config --global alias.st status
git config --global alias.ci commit
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ck checkout
### 配置默认分支
最新版本的 Git 默认分支为 main，如果需要修改为 master，可以通过如下命令进行修改。

git config --global init.defaultBranch master
### 配置 rabase
当你运行 git pull 时，Git 会从远程仓库拉取最新的更改并将它们合并到你的本地分支。如果设置了 pull.rebase 为 true，Git 会在拉取远程更改后，不使用普通的 merge 操作，而是使用 rebase 将你本地的提交放在远程更改的后面。这样可以有效避免分支合并时产生大量的无用的 merge commit，有助于保持一个更线性、整洁的提交历史。

git config --global pull.rebase true
## 2.Git 仓库
### 初始化仓库 
在当前目录初始化仓库
```shell
git init
```
在指定目录创建仓库
```shell
git init mydir
```

### 克隆远程仓库
```shell
# SSH 方式
git clone git@github.com/poneding/archives.git
# HTTPS 方式
git clone https://github.com/kubernetes/kubernetes.git
```
克隆指定分支
```shell
# SSH 方式
git clone -b dev git@github.com/poneding/archives.git

# HTTPS 方式
git clone -b dev https://github.com/kubernetes/kubernetes.git
```
### 提交本地更改
```shell
# 拉取远程仓库的最新更改
git pull

# 添加所有文件到暂存区
git add .

# 提交所有文件到本地仓库
git commit -m "this commit"

# 首次推送到远程仓库
git push -u origin master

# 推送本地分支到远程仓库
git push origin master

# 推送所有本地分支到远程仓库
git push --all

# 推送所有标签到远程仓库
git push --tags
```

## 3.Git 工作流
### 添加文件
```shell
# 添加所有文件到暂存区
git add .

# 添加指定文件到暂存区
git add README.md
```
### 提交文件
```shell
# 提交所有文件到本地仓库
git commit -m "this commit"

# 提交指定文件到本地仓库
git commit README.md -m "this commit"
```
### 查看状态
```shell
# 查看所有文件状态
git status

# 查看指定文件状态
git status README.md
```
### 查看提交历史
```shell
# 查看所有提交历史
git log

# 查看指定提交历史
git log --oneline

# 查看提交历史，包括文件修改详情
git log -p

# 查看提交历史，包括文件修改详情，按文件显示
git log --stat

# 查看提交历史，包括文件修改详情，按文件显示，按提交时间排序
git log --stat --date-order

# 查看提交历史，包括文件修改详情，按文件显示，按提交时间排序，只显示最近的 5 条提交
git log --stat --date-order -5
```
### 撤销修改
```shell
# 撤销所有未提交的更改
git checkout .

# 撤销指定文件未提交的更改
git checkout README.md
```
### 删除文件
```shell
# 删除文件
rm README.md

# 将文件从暂存区删除
git rm README.md

# 将文件从工作区删除
git rm --cached README.md
```
## 4.Git分支管理
```shell
# 查看所有分支
git branch

# 查看当前分支
git branch --show-current

# 创建新分支
git branch dev

# 切换到指定分支
git checkout dev

# 创建并切换到新分支
git checkout -b dev

# 合并指定分支到当前分支
git merge dev

# 删除分支
git branch -d dev

# 强制删除分支
git branch -D dev
```
## 5. Git远程仓库
```shell
# 查看远程仓库
git remote -v

# 添加远程仓库
git remote add origin git@github.com/poneding/archives.git

# 修改远程仓库地址
git remote set-url origin git@github.com/poneding/archives-new.git

# 删除远程仓库
git remote rm origin

# 拉取远程仓库的最新更改
git pull

# 推送本地分支到远程仓库
git push origin master

# 推送所有本地分支到远程仓库
git push --all origin

# 推送所有标签到远程仓库
git push --tags origin
```

