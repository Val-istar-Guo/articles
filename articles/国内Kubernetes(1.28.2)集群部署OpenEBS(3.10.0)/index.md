---
published: true
description: 本文记录了在国内Kubernetes集群部署OpenEBS需要调整的配置和注意事项
date: 2024-02-15
tags:
  - 中间件
  - Kubernetes
---

# 国内 Kubernetes(1.28.2) 集群部署 OpenEBS(3.10.0)

本文遵照 [OpenEBS 官方文档](https://openebs.io/docs/user-guides/installation)安装，存储引擎采用`Jiva`。文章不会再重复介绍官网的安装流程，着重说明可能遇到的问题。

在运行 `helm install openebs openebs/openebs`时，可能会遇到这样一个错误：

```bash
Error: INSTALLATION FAILED: Get "https://github.com/openebs/charts/releases/download/openebs-3.10.0/openebs-3.10.0.tgz": unexpected EOF
```

这是由于 openebs 的 helm chart 有点大，国内容易下载失败。可以手动`wget`解决：

```bash
wget https://github.com/openebs/charts/releases/download/openebs-3.10.0/openebs-3.10.0.tgz
# 如果无法从github之间下载考虑使用ghproxy镜像加速
wget https://mirror.ghproxy.com/github.com/openebs/charts/releases/download/openebs-3.10.0/openebs-3.10.0.tgz
# 又或者使用helm pull
helm pull openebs/openebs --untar -d $YOUR_DIR

helm install openebs ./openebs-3.10.0.tgz
```

接下来，在 install 之后，会发现许多容器无法启动。

这是由于`Jiva`默认需要下载许多`registry.k8s.io`的镜像(Image)。这里需要修改默认的 helm values：

```yaml
# 配置文件参考 Helm 仓库说明
# https://openebs.github.io/jiva-operator/
jiva:
  enabled: true
  replicas: 1
  image: "docker.mirrors.sjtug.sjtu.edu.cn/openebs/jiva"
  defaultStoragePath: "/var/openebs"
  csiController:
    driverRegistrar:
      image:
        registry: k8s.mirror.nju.edu.cn/
        repository: sig-storage/csi-node-driver-registrar
        tag: v2.10.0
    resizer:
      image:
        registry: k8s.mirror.nju.edu.cn/
        repository: sig-storage/csi-resizer
        tag: v1.8.0
    attacher:
      image:
        registry: k8s.mirror.nju.edu.cn/
        repository: sig-storage/csi-attacher
        tag: v4.3.0
    provisioner:
      image:
        registry: k8s.mirror.nju.edu.cn/
        repository: sig-storage/csi-provisioner
        tag: v3.6.3

    livenessprobe:
      image:
        registry: k8s.mirror.nju.edu.cn/
        repository: sig-storage/livenessprobe
        tag: v2.10.0

  csiNode:
    livenessprobe:
      image:
        registry: k8s.mirror.nju.edu.cn/
        repository: sig-storage/livenessprobe
        tag: v2.10.0
    driverRegistrar:
      image:
        registry: k8s.mirror.nju.edu.cn/
        repository: sig-storage/csi-node-driver-registrar
        tag: v2.10.0

  jivaOperator:
    controller:
      image:
        registry: "docker.mirrors.sjtug.sjtu.edu.cn/"
        repository: openebs/jiva
    replica:
      image:
        registry: "docker.mirrors.sjtug.sjtu.edu.cn/"
        repository: openebs/jiva
    image:
      registry: "docker.mirrors.sjtug.sjtu.edu.cn/"
      repository: openebs/jiva-operator

  jivaCSIPlugin:
    image:
      registry: "docker.mirrors.sjtug.sjtu.edu.cn/"
      repository: openebs/jiva-csi
```

我们使用`docker.mirrors.sjtug.sjtu.edu.cn/`和`k8s.mirror.nju.edu.cn/`分别对`docker.io` 和 `registry.k8s.io`做镜像加速。`docker.io`并非必须，国内也可以访问，只是镜像下载速度非常慢。而`registry.k8s.io`在国内完全无法访问，必须使用其他国内镜像源。

> 这份 values 需要格外注意`csiController`和`csiNode`指定的镜像都写了`tag`。
> 这是由于`OpenEBS`默认的版本都非常低，而这个版本需要根据你的`Kubernetes`版本选择。
> 相关镜像版本及其支持的`Kubernetes`列表请查看[Kubernetes CSI 官网文档](https://kubernetes-csi.github.io/docs/external-attacher.html)
