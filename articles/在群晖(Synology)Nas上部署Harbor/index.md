---
published: true
description: 在云服务上部署Harbor是比较昂贵的。用租一年云服务的钱购买一台Nas部署Harbor，就显得尤为划算。
tags:
  - 中间件
  - Harbor
---

<!-- [Harbor]: https://goharbor.io/docs/2.10.0/install-config/installation-prereqs/ -->

# 在群晖(Synology)Nas 上部署 Harbor

我使用的是群晖 720+双盘位 Nas， 并为其配备了两个 4TB 希捷机械硬盘（HDD）。
另外，我还额外安装了一个 4G 内存条，以满足 Harbor 的最低安装条件。

## 安装 Harbor 的配置要求

[Harbor 官网](https://goharbor.io/docs/2.10.0/install-config/installation-prereqs/)详细说明了安装 Harbor 的最低配置要求：

| 资源 | 最低  | 推荐  |
| :--- | :---- | :---- |
| CPU  | 2 CPU | 4CPU  |
| 内存 | 4GB   | 8GB   |
| 硬盘 | 40GB  | 160GB |

## 选择安装方式

[Harbor 官网](https://goharbor.io/docs/2.10.0/install-config/download-installer/)就如何安装已经给出详细的步骤。
我会对安装过程做一些重复的演示，并着重说明在群晖（Synology）上遇到的问题。

Harbor 提供了`在线安装（Online installer）`和`离线安装（Offline install）`两种方式。
正如其名， **离线安装包** 会额外下载已经构建好的镜像。方便起见，我选择`在线安装（Online installer）`。

## 安装 Docker

进入群晖（Synology）Nas 的管理界面，打开套件中心安装 **Container Manager**。

## 部署 Harbor

```bash
# 登录至Nas
ssh your_nas_ip

# 在群晖Nas上新建一个harbor共享文件用于存放Harbor相关的内容
# 'volumn1'这个名字在不同Nas下可能会不同，需要找到你的Nas的文件目录
cd /volumn1/harbor

# 下载安装包
wget https://github.com/goharbor/harbor/releases/download/v2.10.0/harbor-online-installer-v2.10.0.tgz
# 解压安装包
tar xzvf harbor-online-installer-v2.10.0.tgz

# 解压后会在当前文件夹创建一个harbor目录
# 我将其重命名未installer
mv harbor installer
```

由于群晖的 Nas 系统下并未按照`tput`命令，会导致安装脚本执行错误，我们需要手动修复一下脚本：

> tput 命令主要是用于控制台日志的染色，并不会影响实际运行。我们将其删除即可

```bash
# 进入解压后的安装目录
cd /volumn1/harbor/installer


# 使用vim编辑文件手动将tput命令都删除
# 例如：将 `bold=$(tput bold)`命令替换成 `bold=""`
vim common.sh
# 或者使用sed命令快速修改
sed -i -e '/tput/s/\(\w*=\).*/\1""/' common.sh
```

接下来，需要修改 Harbor 默认的配置文件模板。Harbor 的默认配置会启动 HTTPS，并需要我们配置证书。
但是为了更方便证书管理，采用 Http 启动 Harbor，并且在 Harbor 前的 Nginx 代理上统一管理 Https 证书更加优雅。

> [Nginx Proxy Manager](https://nginxproxymanager.com/)是一款优秀的的轻量的反向代理服务。
> 它自带 Web UI 并能够自动的申请和更新 Letsencrypt 证书。
> 非常适合 Nas。
>
> 我通过[Nginx Proxy Manager](https://nginxproxymanager.com/) 管理进入 Nas 的流量，并将发送至 Harbor 的 Https 请求转成 Http。
>
> 如果你希望 Harbor 直接启动 Https 服务，请查看[Harbor 官网 Configure HTTPS Access to Harbor 章节](https://goharbor.io/docs/2.10.0/install-config/configure-https/)的内容。

复制一份 Harbor 提供的默认配置文件模板：

```bash
cp harbor.yml.tmpl harbor.yml
```

修改`harbor.yaml`：

```yaml
# 填写你的域名
hostname: example.com

http:
  # http 端口
  port: 10001

# 需要将HTTPS配置注释
# https:
# https port for harbor, default is 443
# port: 443
# The path of cert and key files for nginx
# certificate: /your/certificate/path
# private_key: /your/private/key/path

# 虽然我们在Nginx上配置了Https证书
# 但是Harbor依旧需要我们添加`external_url`配置真实的url才能正常访问
external_url: https://exmaple.com
# 后面的配置可以不做改动
# ...
```

我们还需要添加一个文件夹存放 Harbor 镜像启动后的数据（数据库、配置文件等等）。

```bash
cd /volumn1/installer
# Harbor的安装脚本默认使用的文件夹名为common
# 像更换这个文件夹位置必须更改Harbor的安装脚本
mkdir common
```

> 为什么需要手动创建这个文件夹我也并没有调查清楚。
> 在 Linux 系统上，common 文件夹在安装 Harbor 时会自动创建。
> 但是在 Nas 并没有自动创建，我不得不手动补上这个文件夹。

最后，运行 Harbor 提供的安装脚本：

```bash
./install.sh
```

运行完成后，需等待 docker 启动镜像。
启动后，访问上一步`hostname`或`external_url`配置的域名，即可进入登录页面。

> IP+Port 访问 Harbor 服务会被拒绝。
