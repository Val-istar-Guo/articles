---
published: true
description: 本文记载家中搭建OpenWRT的详细过程及沉淀的技术方案。所谓“智能”只是噱头罢了。
date: 2021-08-10
tags:
  - 智能家居
  - 路由器
---

# 家用智能路由器

[OpenWRT]: https://openwrt.org
[OpenWRT SDK]: https://openwrt.org/docs/guide-developer/using_the_sdk
[LEDE]: https://github.com/coolsnowwolf/lede
[Merlin]: https://www.asuswrt-merlin.net
[NAS]: https://www.synology.cn/zh-cn/products/DS720+
[Docker]: https://www.docker.com

## 路由器技术选型

我将目前主要的方案分成三类：

- 软路由

  使用高性能的台式机或者服务器配合软件实现路由器的所有功能。同等硬件条件下，软路由往往不如硬路由。但是 PC 价格真的太低了。
  尤其是目前某宝有许多专门为软路由设计的硬件。同等价格下的家用路由器，软路由非常不错。知乎上一位大佬对于软路由的评价非常真切：

  > 其实很多家用路由器都是工作在软路由模式下。虽然会有 NAT 转发芯片，但是只要你在路由器里启用了家长控制、流量统计、QOS 限速、广告过滤、不可描述之类的功能，这个芯片就歇菜了。包处理的担子还是要交给 CPU。然后就是 MIPS/ARM 的性能被 X86 吊打。

  另外，软路由安装和使用更简单。交互也更加友好。非常适合新人入门使用。

- 硬路由

  这只是相对软路由的称呼，也就是指的传统的路由器。不过直接从厂商买来的路由器功能并不太强大。需要用于手动刷固件从而获得更强大的功能。

- 智能路由

  直接购买将“智能”作为噱头的路由器。这类路由器无法提供一些不可描述的功能。

我家中选择的是硬路由的方案。一是因为家中有多台网络设备，高端的硬路由能提供更大的宽带和更好的性能。二是我自信能解决遇到的复杂技术问题。

## 设配选购/技术选型

- 路由器：WRT3200ACM

  WRT 系列路由器与[OpenWRT][OpenWRT]大有渊源。可以轻易刷成 OpenWRT 系统，并且不需要担心路由器变砖的问题。
  WRT3200ACM 更是 WRT 系列中的高配版本，开启一系列插件后依旧能否轻松负载千兆宽带。

- 路由固件：[OpenWRT][OpenWRT]

  [OpenWRT][OpenWRT]其实是一个轻量级的 Linux。潘多拉和受软路由钟爱的[LEDE][LEDE]固件均源于[OpenWRT][OpenWRT]。
  另外两个流行的固件：Padavan（又称老毛子）和[Merlin（又称梅林）][Merlin]都源于华硕的官方固件。
  之所以选择[OpenWRT][OpenWRT]，最主要的原因是其官方网站具有最完善的官方说明文档；
  其次官方版本的[OpenWRT][OpenWRT]也是最轻量的，可以根据自己的需要进行定制。

- NAS: [Synology DS720+][NAS]

  虽然[OpenWRT][OpenWRT]可以通过安装`samba`插件为局域网提供文件共享服务，但是在路由器上安装的扩展磁盘无处安放且散热不畅。
  更何况，独立的 NAS 能够提供更友好的操作界面、磁盘备份、图片/视频管理软件、邮件服务等。

  NAS 本身也非常适合安装的软路由的，不过我并不打算这样做。如果资金不足又想要得到所有功能，购买一个 NAS 搭配软路由也是不错的选择。

## 知识储备

- 了解 Linux 系统的基本原理，并能熟练的编写 Shell 脚本。
- 有一定的编码基础和较强的动手能力。我们需要动手编译一些[OpenWRT][OpenWRT]官方未提供的不可描述的插件。
- 能顺畅使用[Docker][Docker]。我们需要搭建一个可重复使用的编译环境。

## 上传固件

- 首先需要进入[OpenWRT 官网](https://firmware-selector.openwrt.org/)下载最新版本的 OpenWRT 固件。需要根据购买的路由器型号进行选择。
- WRT 系列路由器可以直接上传[OpenWRT][OpenWRT]固件，上传完成后重启路由器即可。其他路由器请自行查找刷固件的技术方案。

## OpenWRT 基础配置

[OpenWRT][OpenWRT]虽然也提供配置页面。但既然是一个 Linux 系统，便可以通过`ssh`登录到命令行进行配置。
虽然配置页面听起来虽然不错。但是在配置完成前，页面交互体验还是非常不友好的。
并且使用`shell`命令进行配置，我们便可将之整理成脚本以备重置路由器时使用。

### 包管理工具

每个 Linux 系统都有自己的包管理工具。[OpenWRT][OpenWRT]使用`opkg` 命令作为包管理工具。使用方法详见[说明文档](https://openwrt.org/zh/docs/techref/opkg)。
我们第一步便是更新可用软件包列表：

```shell
opkg update

# 升级所有的软件包
opkg list-upgradable | cut -f 1 -d ' ' | xargs opkg upgrade
```

为了以后使用方便，我们设定定时任务每日更新软件包列表

```shell
touch /etc/root/root
echo "0 4 * * * opkg update" > /etc/crontabs/root
/etc/init.d/cron enable
```

### 支持 HTTPS

[OpenWRT][OpenWRT] 并没有默认安装`openssl`，导致无法在命令行发送`https`请求。由于我们之后配置需要的一些文件必须通过`https`下载，因此先安装这个插件：

```shell
opkg install libustream-openssl
```

### 页面美化

[luci-theme-argon](https://github.com/jerrykuku/luci-theme-argon)是一个使用较为广泛且比较好看的页面样式插件。我非常喜欢 Material Design，便选择了此插件。

```shell
# 汉化
opkg install luci-i18n-base-zh-cn luci-i18n-opkg-zh-cn luci-i18n-firewall-zh-cn

# 安装 luci-theme-argon
wget --no-check-certificate https://github.com/jerrykuku/luci-theme-argon/releases/download/v2.2.5/luci-theme-argon_2.2.5-20200914_all.ipk -O luci-theme-argon.ipk
opkg install luci-theme-argon.ipk
```

安装完成后，重新访问配置页面即可。

###### 如果发现页面依旧存在部分英文，是由于浏览器缓存导致。删除浏览器缓存后再次刷新页面即可。

### 路由器实时监控

- `luci-app-statistics`：实时监控插件
- `luci-i18n-statistics-zh-cn`：实时监控的汉化插件
- `collectd-mod-curl`：扩展实时监控插件功能：使用`curl`指令实时监控网络连通性和响应时间。

```shell
opkg install luci-app-statistics luci-i18n-statistics-zh-cn collectd-mod-curl

# 启用 collectd-mod-curl
uci set luci_statistics.collectd_curl.enable='1'

# 监控baidu.com的响应时间
uci add luci_statistics collectd_curl_page
uci set luci_statistics.@collectd_curl_page[-1].enable='1'
uci set luci_statistics.@collectd_curl_page[-1].name='BaiDu'
uci set luci_statistics.@collectd_curl_page[-1].url='baidu.com'

# 监控google.com的响应时间
uci add luci_statistics collectd_curl_page
uci set luci_statistics.@collectd_curl_page[-1].enable='1'
uci set luci_statistics.cfg288c80.name='Google'
uci set luci_statistics.cfg288c80.url='google.com'

uci commit
```

> `uci`是“Unified Configuration Interface”(统一配置界面)的缩写，意在 OpenWrt 整个系统的配置集中化。

`uci`指令用于管理 OpenWRT 的配置。使用指令比直接修改配置文件方便太多了，使用方法详见[说明文档](https://openwrt.org/docs/guide-user/base-system/uci)

### 无线网络配置

此配置建议进入配置页面进行配置。如果打算整理初始化脚本，以下代码可做参考：

```shell
PASSWORD="changeme"
ESSID="无线账户"

uci set wireless.radio0.channel='auto'
uci set wireless.radio0.htmode='VHT160'
uci set wireless.default_radio0.key=$PASSWORD
uci set wireless.default_radio0.ssid=$ESSID
uci set wireless.default_radio0.encryption='psk2'
uci set wireless.default_radio1.key=$PASSWORD
uci set wireless.default_radio1.ssid=$ESSID
uci set wireless.default_radio1.encryption='psk2'
uci set wireless.radio2.channel='auto'
uci set wireless.default_radio2.key=$PASSWORD
uci set wireless.default_radio2.ssid=$ESSID
uci set wireless.default_radio2.encryption='psk2'

uci commit
```

WRT3200ACM 有三个频段（`radio0`、`radio1`、`radio2`）。这与路由器硬件息息相关，需要根据路由器型号编写脚本。
`wireless.radio0.htmode='VHT160'`也是 WRT3200ACM 独有的带宽，也因此导致了 WRT3200ACM 无法在国内上市。

## 编译 OpenWRT 软件包

很多不可描述的插件并不能直接从 [OpenWRT][OpenWRT] 官方软件源安装，需要自己动手编译。
不过由于路由器性能比较低，并不适合直接在路由器上编译 ipk 包。我们需要通过 [OpenWRT SDK][OPENWRT SDK] 交叉编译软件包。

### 构建编译环境

相比安装一个 Linux 系统，使用 Docker 来构建编译环境会方便许多。
首先，需要根据路由器型号下载对应的 [OpenWRT SDK][OpenWRT SDK]。
这里我们使用 WRT3200ACM 需要的 [SDK](https://downloads.openwrt.org/releases/19.07.4/targets/mvebu/cortexa9/)：

```dockerfile
FROM ubuntu
WORKDIR /root
ENV DEBIAN_FRONTEND  noninteractive
ENV OPENWRT_SDK openwrt-sdk-19.07.4-mvebu-cortexa9_gcc-7.5.0_musl_eabi.Linux-x86_64
COPY ${OPENWRT_SDK}.tar.xz /root/${OPENWRT_SDK}.tar.xz
RUN apt-get update && \
    apt-get install xz-utils vim -y && \
    tar -xvf /root/${OPENWRT_SDK}.tar.xz  && \
    mv /root/${OPENWRT_SDK} /root/sdk && cd /root/sdk &&\
    apt-get install build-essential ccache flex gawk gettext git liblzma-dev libncurses5-dev libssl-dev python subversion u-boot-tools unzip wget xsltproc zlib1g-dev python3 rsync -y && \
    ./scripts/feeds update -a && \
    ./scripts/feeds install -a
```

> 更多细节参考[GitHub](https://github.com/Val-istar-Guo/openwrt-sdk-arm_cortex-a9_vfpv3-d16)

构建完成后，为之后方便使用可以发布至 DockerHub。至此我们便准备好了编译环境。

### 编译软件包

我们需要的软件包：

- [openwrt-shadowsocksr](): ssr 插件
- [luci-app-shadowsocksr](): ssr 插件管理界面
- [openwrt-ckipver](): ssr 订阅功能
- [openwrt-dns-forwarder](): ssr 的 DNS 防污染功能
- [openwrt-cdns](): ssr 的 DNS 防污染列表扩展之一
- [openwrt-pdnsd](): ssr 的 DNS 防污染列表扩展之一
- [ddns-scripts_aliyun](): 阿里云 DDNS 服务

使用我们刚刚构建的编译环境：

```dockerfile
FROM valistarguo/openwrt-sdk-arm_cortex-a9_vfpv3-d16 as builder

WORKDIR /root/sdk
COPY .config /root/sdk/.config
RUN cd /root/sdk && \
    git clone https://github.com/Hill-98/luci-app-shadowsocksr.git package/luci-app-shadowsocksr && \
    git clone https://github.com/Hill-98/openwrt-ckipver.git package/ckipver && \
    git clone https://github.com/Hill-98/openwrt-cdns package/cdns && \
    git clone https://github.com/Hill-98/openwrt-shadowsocksr package/shadowsocksr-libev && \
    git clone https://github.com/sensec/ddns-scripts_aliyun.git package/ddns-scripts_aliyun && \
    git clone https://github.com/aa65535/openwrt-dns-forwarder.git package/dns-forwarder && \
    git clone https://github.com/Hill-98/openwrt-pdnsd package/pdnsd && \
    cd package/luci-app-shadowsocksr/tools/po2lmo && \
    make && make install && \
    cd /root/sdk

RUN make package/shadowsocksr-libev/compile package/ddns-scripts_aliyun/compile package/luci-app-shadowsocksr/compile package/ckipver/compile package/cdns/compile package/dns-forwarder/compile package/pdnsd/compile -j$((`nproc`+1)) V=s && \
    make package/index V=s
```

> 更多细节参考[GitHub](https://github.com/Val-istar-Guo/openwrt-packages-arm_cortex-a9_vfpv3-d16)

### 搭建软件源

虽然直接在 Docker 中构建好 ipk 软件包，然后直接上传到[OpenWRT][OpenWRT]安装没什么问题。但是这并不方便长久的管理软件包。
搭建独立的软件源，非常方便后续重置路由器时再次安装需要的软件。接下来我们需要做的事情：

- 生成软件源的公钥和私钥，OpenWRT 添加新的软件源需要对软件源进行验证。
- 添加 Nginx 服务，提供软件包和公钥下载服务

我们从上一节`dockerfile`的基础上继续改动：

```dockerfile
FROM valistarguo/openwrt-sdk-arm_cortex-a9_vfpv3-d16 as builder

WORKDIR /root/sdk
COPY .config /root/sdk/.config
RUN cd /root/sdk && \
    git clone https://github.com/Hill-98/luci-app-shadowsocksr.git package/luci-app-shadowsocksr && \
    git clone https://github.com/Hill-98/openwrt-ckipver.git package/ckipver && \
    git clone https://github.com/Hill-98/openwrt-cdns package/cdns && \
    git clone https://github.com/Hill-98/openwrt-shadowsocksr package/shadowsocksr-libev && \
    git clone https://github.com/sensec/ddns-scripts_aliyun.git package/ddns-scripts_aliyun && \
    git clone https://github.com/aa65535/openwrt-dns-forwarder.git package/dns-forwarder && \
    git clone https://github.com/Hill-98/openwrt-pdnsd package/pdnsd && \
    cd package/luci-app-shadowsocksr/tools/po2lmo && \
    make && make install && \
    cd /root/sdk

RUN make package/shadowsocksr-libev/compile package/ddns-scripts_aliyun/compile package/luci-app-shadowsocksr/compile package/ckipver/compile package/cdns/compile package/dns-forwarder/compile package/pdnsd/compile -j$((`nproc`+1)) V=s && \
    make package/index V=s && \
    ./staging_dir/host/bin/usign -G -s mime.key -p mime.pub && \
    ./staging_dir/host/bin/usign -S -m bin/packages/arm_cortex-a9_vfpv3-d16/base/Packages -s mime.key -x bin/packages/arm_cortex-a9_vfpv3-d16/base/Packages.sig && \
    mv mime.pub bin/packages/arm_cortex-a9_vfpv3-d16/base/mime.pub


FROM nginx
RUN mkdir /usr/share/nginx/packages
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /root/sdk/bin/packages/arm_cortex-a9_vfpv3-d16/base/ /usr/share/nginx/packages
RUN chown -R nginx /usr/share/nginx/packages && chgrp -R nginx /usr/share/nginx/packages
```

> 更多细节参考[GitHub](https://github.com/Val-istar-Guo/openwrt-packages-arm_cortex-a9_vfpv3-d16)

接下来我们只需要将编译完成的 docker 镜像部署在一台服务器上。也可以部署在家中的 NAS 上，访问速度更快也更安全。

## OpenWRT 高级配置

### 添加软件源

添加我们刚部署好的软件源：

```shell
wget http://openwrt.val-istar-guo.com/mime.pub
opkg-key add mime.pub
echo "src/gz vg http://openwrt.val-istar-guo.com/" > /etc/opkg/customfeeds.conf
opkg update
```

### 动态 DNS

由于我们没有固定 IP，即使联系网络供应商也只能获得一个动态 IP。动态 DNS（DDNS）便可以帮助我们自动的修改域名的主机记录值。
这里需要根据自己的域名供应商进行选择和配置：

```shell
opkg install ddns-scripts luci-app-ddns luci-i18n-ddns-zh-cn ddns-scripts_aliyun

DDNS_USERNAME="username"
DDNS_PASSWORD="password"
DDNS_HOST="myhost.example.com"
DDNS_DOMAIN="myhost@example.com"

uci set ddns.ddns_ipv4=service
uci set ddns.ddns_ipv4.service_name='aliyun.com'
uci set ddns.ddns_ipv4.lookup_host=$DDNS_HOST
uci set ddns.ddns_ipv4.domain=$DDNS_DOMAIN
uci set ddns.ddns_ipv4.username=$DDNS_USERNAME
uci set ddns.ddns_ipv4.password=$DDNS_PASSWORD
uci set ddns.ddns_ipv4.enabled='1'
uci commit
```

这里需要注意，如果`doamin`是二级域名，需要使用`@`代替`.`作为分隔符（~~也不知道是哪个傻逼这么设计的，搞得跟邮箱似的~~）。

### 不可描述的上网方式

我们要使用刚才编译好的软件源安装相关插件：

```shell
# 必要依赖
opkg install libpcre libev libsodium libudns
opkg install ipset
# 支持UDP协议透明代理
opkg install iptables-mod-tproxy ip
# DNS污染列表解析
opkg remove dnsmasq
opkg install dnsmasq-full
# 获取 DNS 域名污染列表和服务器订阅数据
opkg install curl
# base64 解码 DNS 域名污染列表和服务器订阅数据
opkg install coreutils-base64
# 服务器订阅脚本使用 bash 解释器运行
opkg install bash
# 用于订阅脚本解析域名
opkg install bind-dig

# 后续安装需要私搭的软件源
# 用于订阅脚本检测 IP 地址合法性
opkg install ckipver
# 防污染包
opkg install cdns dns-forwarder pdnsd

opkg install shadowsocksr-libev luci-app-shadowsocksr
```

安装完成后，我们可以进入路由器的配置页面添加相关配置。配置完成后需要重启路由器才能生效。

> 首次安装后需要重启路由器，可能是由于 `shadowsocksr-libev` 没有在安装时启动导致。

### NAS

[Synology DS720+][NAS]并不需要在路由器中添加太多配置，我们需要做的只是为[Synology DS720+][NAS]的两个网卡其提供固定的局域网 IP：

```shell
uci add dhcp host
uci set dhcp.@host[-1].mac=$NAS_MAC_1
uci set dhcp.@host[-1].dns='1'
uci set dhcp.@host[-1].name='NAS'
uci set dhcp.@host[-1].ip='192.168.1.2'
uci set dhcp.@host[-1].mac=$NAS_MAC_2
uci set dhcp.@host[-1].dns='1'
uci set dhcp.@host[-1].name='NAS'
uci set dhcp.@host[-1].ip='192.168.1.3'

uci commit
```

[Synology DS720+][NAS] 提供了许多不错的软件：`Photo Station`、`Vidio Station`、`MAIL邮箱服务`。
为了能够在外网访问这些服务，我们需要修改防火墙配置：

```shell
# NAS管理界面
uci add firewall redirect
uci set firewall.@redirect[-1].dest_port='5000'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].name='NAS'
uci set firewall.@redirect[-1].src_dport='5000'
uci set firewall.@redirect[-1].target='DNAT'
uci set firewall.@redirect[-1].dest_ip='192.168.1.2'
uci set firewall.@redirect[-1].dest='lan'
# Photo Station服务
uci add firewall redirect
uci set firewall.@redirect[-1].dest_port='80'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].name='Photo Station'
uci set firewall.@redirect[-1].src_dport='19000'
uci set firewall.@redirect[-1].target='DNAT'
uci set firewall.@redirect[-1].dest_ip='192.168.1.2'
uci set firewall.@redirect[-1].dest='lan'
# Vidio Station服务
uci add firewall redirect
uci set firewall.@redirect[-1].dest_port='9007'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].name='Vidio Station'
uci set firewall.@redirect[-1].src_dport='18000'
uci set firewall.@redirect[-1].target='DNAT'
uci set firewall.@redirect[-1].dest_ip='192.168.1.2'
uci set firewall.@redirect[-1].dest='lan'
# MAIL邮箱服务
uci add firewall redirect
uci set firewall.@redirect[-1].dest_port='25'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].name='SMTP'
uci set firewall.@redirect[-1].src_dport='25'
uci set firewall.@redirect[-1].target='DNAT'
uci set firewall.@redirect[-1].dest_ip='192.168.1.2'
uci set firewall.@redirect[-1].dest='lan'
uci add_list firewall.@redirect[-1].proto='tcp'
uci add firewall redirect
uci set firewall.@redirect[-1].dest_port='143'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].name='IMAP'
uci set firewall.@redirect[-1].src_dport='143'
uci set firewall.@redirect[-1].target='DNAT'
uci set firewall.@redirect[-1].dest_ip='192.168.1.2'
uci set firewall.@redirect[-1].dest='lan'
uci add firewall redirect
uci set firewall.@redirect[-1].dest_port='110'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].name='POP3'
uci set firewall.@redirect[-1].src_dport='110'
uci set firewall.@redirect[-1].target='DNAT'
uci set firewall.@redirect[-1].dest_ip='192.168.1.2'
uci set firewall.@redirect[-1].dest='lan'
uci add_list firewall.@redirect[-1].proto='tcp'
uci add firewall redirect
uci set firewall.@redirect[-1].dest_port='465'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].name='SMTP-SS'
uci set firewall.@redirect[-1].src_dport='465'
uci set firewall.@redirect[-1].target='DNAT'
uci set firewall.@redirect[-1].dest_ip='192.168.1.2'
uci set firewall.@redirect[-1].dest='lan'
uci add_list firewall.@redirect[-1].proto='tcp'
uci add firewall redirect
uci set firewall.@redirect[-1].dest_port='587'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].name='SMTP-TLS'
uci set firewall.@redirect[-1].src_dport='587'
uci set firewall.@redirect[-1].target='DNAT'
uci set firewall.@redirect[-1].dest_ip='192.168.1.2'
uci set firewall.@redirect[-1].dest='lan'
uci add_list firewall.@redirect[-1].proto='tcp'
uci add firewall redirect
uci set firewall.@redirect[-1].dest_port='993'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].name='IMAP-SSL/TLS'
uci set firewall.@redirect[-1].src_dport='993'
uci set firewall.@redirect[-1].target='DNAT'
uci set firewall.@redirect[-1].dest_ip='192.168.1.2'
uci set firewall.@redirect[-1].dest='lan'
uci add_list firewall.@redirect[-1].proto='tcp'
uci add firewall redirect
uci set firewall.@redirect[-1].dest_port='995'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].name='POP3-SSL/TLS'
uci set firewall.@redirect[-1].src_dport='995'
uci set firewall.@redirect[-1].target='DNAT'
uci set firewall.@redirect[-1].dest_ip='192.168.1.2'
uci set firewall.@redirect[-1].dest='lan'
uci add_list firewall.@redirect[-1].proto='tcp'

uci commit firewall
```

## OpenWRT 初始化脚本

上述所有的脚本已经整理至[GitHub](https://github.com/Val-istar-Guo/openwrt-init-shell)。
至此，我所需要的路由器功能都已添加。本文若对你有帮助，还请在 GitHub 点个 Star。
