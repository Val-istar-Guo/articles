---
description: 国内云服务商高昂的Kubernetes售价让人望而却步。而在国内，由于墙的缘故，自建Kubernetes远不像官网描述的那样简单。
tags:
  - 运维
  - Kubernetes
---

# 国内自建公网Kubernetes指南

为什么要自己搭建Kubernetes：

* Kubernetes可以轻松部署cert-manager、istio等开源工具
* Kubernetes能提供应用的部署、回滚、健康检查、故障转移等功能
* 云厂商价格太过昂贵
* 公网的Kubernetes方便根据云厂商的折扣力度，灵活选择购买哪家的机器

自建Kubernetes的问题：

* 为了尽可能节省支出，采用单Master节点的部署方式。存在Kubernetes主节点崩溃的风险
* 公网的Kubernetes部署方案可能存在一定安全隐患
* 采购的廉价机器无法运行需要占用大量资源的应用。
  虽然可以单独购买一台好的机器加入集群。但是价格太过昂贵。

## 价格

既然我们自己搭建Kubernetes的主要目的是**省钱**，那么看一下我总共花费了多少钱。

首先，我购买了：

* 一台 2核 4G 40G云盘 的阿里云ECS作为 Master
* 两台 2核 4G 60G云盘 的阿里云ECS作为 Worker
* 一台 2核 2G 60G云盘 的阿里云ECS作为 Gateway(istio ingress)

四台ECS均购买了三年，选择同配置下最低价格。总共花费约6691元（0.2元/天）。
对比腾讯云是2.6元/小时，而阿里云是2000+元/月
