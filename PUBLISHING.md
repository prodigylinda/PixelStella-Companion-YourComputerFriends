# 发布到GitHub

推荐仓库名：`PixelStella-Companion-YourComputerFriends`

展示标题：**PixelStella-Companion-YourComputerFriends**

About Description：

```text
Customizable desktop companion for Windows, with offline chibi avatars, local image import, study reminders, focus timers and optional local AI. 中文 · English · Français. Electron + TypeScript, local-first, MIT.
```

Topics：`desktop-pet` `desktop-companion` `electron` `typescript` `windows` `local-first` `avatar-creator` `study-planner` `reminder` `pomodoro`

许可证：MIT；原创内容版权署名：prodigylinda。package.json中的`private: true`用于防止误发npm包，不影响GitHub开源。

## 上传范围

只将 scripts/prepare-source.mjs 导出的 PixelStella-Companion-YourComputerFriends-github 目录作为提交目录。它是经过筛选的干净源码副本，包含源码、配置、锁文件、测试、构建脚本、文档、原创图标及检查过的截图。没有运行环境、node_modules、构建产物、EXE、私人图片、真实存档、导出计划、备份或模型权重。

尚未在本目录初始化Git、创建远程仓库或推送。创建仓库时请选择Public，仓库名填`PixelStella-Companion-YourComputerFriends`；使用空仓库，不另外自动生成README或许可证，以免与本地文件冲突。

本次未访问、创建或推送远程仓库。先检查指定仓库是否已有历史；只有远程为空且本地尚未初始化时，才在干净源码副本执行以下命令。远程已有提交时应先保留历史并正常合并，不要强推：

```powershell
git init -b main
git add .
git diff --cached --stat
git commit -m "Initial open-source release of PixelStella"
git remote add origin https://github.com/prodigylinda/PixelStella-Companion-YourComputerFriends.git
git push -u origin main
```

提交前确认Git已配置你自己的姓名和邮箱。远程地址是计划使用的地址，不代表仓库已经创建；若使用其他账号或名称请相应调整。远程已有提交时不要直接强推，应先检查并保留其历史。

不需要把便携运行时放进Git源码仓库。以后如需发布可下载程序，可单独打包并创建Release；当前没有发布Release。公开前可在GitHub设置中启用Private Vulnerability Reporting。
