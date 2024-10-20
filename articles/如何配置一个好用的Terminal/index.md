---
published: true
description:
tags:
  - 研发工具
---

# 如何配置一个好用的 Terminal

无论是 MacOS 还是 Linux，Terminal 默认的 Shell 都是 Bash。它勉强能用，但对于研发来讲远远不够。

> 2019 年起 MacOS 默认的 Shell 从 Bash 改为 Zsh

## 安装 Zsh

Zsh 有强大的补全功能、完善的插件机制和丰富的生态。

```bash
# Debian 安装方式
# 其他系统请自行查阅资料
apt update
apt install zsh

chsh -s /bin/zsh
```

> MacOS 系统自带 Zsh 无需安装
> 2019 年后，默认 shell 也更换为 Zsh 无需手动切换

## 安装 OhMyZsh

[OhMyZsh]: https://ohmyz.sh/

OhMyZsh 可以极大的简化 Zsh 配置难度。它内置了丰富的 Zsh 插件和主题。
可以按照[官网教程][OhMyZsh]直接安装：

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
# 或者是
sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
```

## 安装 Powerlevel10k

[Powerlevel10k]: https://github.com/romkatv/powerlevel10k

[Powerlevel10k][Powerlevel10k] 是一个注重速度、灵活性并且开箱即用的 Zsh 主题。它比 OhMyZsh 内置的主题都要强大。是我目前找到的最好用的主题。

[Powerlevel10k][Powerlevel10k] 安装文档中推荐先安装[MesloLGS NF](https://github.com/ryanoasis/nerd-fonts/tree/master/patched-fonts/Meslo)字体。
这个字体包含了主题中可用的一些图标，能够令 Terminal 更美观。按[官网][Powerlevel10k]教程安装即可：

```bash
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ~/powerlevel10k
echo 'source ~/powerlevel10k/powerlevel10k.zsh-theme' >>~/.zshrc
```

## 添加 Zsh 插件

[OhMyZsh][OhMyZsh]提供了许多 Zsh 插件，可以从[这里](https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins)查找需要的插件。并在`~/.zshrc`中添加：

```bash
# 添加git和docker插件
plugins=(git docker)
```

## 一键初始化新电脑

当我们配置好 Terminal 后，为避免我们更换电脑后需要从头再来。
在 Github 上添加一个`dotfiles`仓库保存相关配置是一个不错的选择。

[这是我的 dotfiles 仓库](https://github.com/Val-istar-Guo/dotfiles)。可以 fork 一份后，根据自己的需要修改。
