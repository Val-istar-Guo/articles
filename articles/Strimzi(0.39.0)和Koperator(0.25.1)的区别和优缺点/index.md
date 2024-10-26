---
published: true
description: Strimzi 和 Koperator 是最热门的两个Kafka Operator。我部署并使用它俩的基本功能，并总结其优缺点。希望后来的小伙伴们不再需要为了寻找最适合自己的方案，而像我一样将两条路都走一遍。
date: 2024-01-16
tags:
  - 中间件
  - Kubernetes
---

# Strimzi(0.39.0) 和 Koperator(0.25.1) 的区别和优缺点

- Strimzi 社区更加的活跃，迭代速度也高于 KOperator。
- 使用 Strimzi 部署最简单的 Kafka 集群 会比使用 Koperator 部署 占用更多的内存。

  Strimzi: `strimzi-cluster-operator`约 300 MB，`zookeeper`约 1G，`kafka`约 600MB，`kafka-entity-operator` 约 600MB。

  Koperator: `zookeeper-operator`约 20MB，`zookeeper`约 200MB，`kafka-operator`约 50MB，`kafka`约 600MB，`kafka-cruisecontrol`约 200MB。

  > `kafka-entity-operator`和`kafkacruisecontrol`功能类似，都是用于管理`KafkaTopic`和`KafkaUser`

  这一点内存差距对于个完整的 Kafka 集群来说确实没多少。但不得不吐槽：Strimzi 的 `operator` 吃掉更多内存责任在 `Java`。

- Strimzi 具有更完善的上下游生态。
  即便部署一个最简单的 Kafka 集群， Koperator 也需要再部署一个 `zookeeper-operator` 管理 `zookeeper`。
- Strimzi 的`KafkaTopic`默认只能 **watch** Kafka 集群所在的命名空间。虽然能通过配置添加更多的命名空间，但是无法 **watch** 全部命名空间。
  更多信息可以查看这个 [Github Issue](https://github.com/strimzi/strimzi-kafka-operator/issues/1206)

  而 Koperator 则默认会 **watch** 全部命名空间的`KafkaTopic`。

- Koperator 在创建 Kafka 集群后会再集群中自动创建三个给`Koperator`使用的`Topic`。Strimzi 则会创建一个干净的 Kafka 集群。
- Strimzi 有一份堪称保姆的使用文档。中文资料也更加丰富一些。
- Strimzi 和 Koperator 均支持 `LoadBalancer` 和 `NodePort` 的方式对外集群外暴露 Kafka 服务。
  另外， Strimzi 默认支持 Nginx Ingress，但不支持 Istio。
  至于 KOperator，根本没有对 Ingress 的支持的文档。

  > Strimzi 也并非完全不能通过 Istio 的 `Gateway`和 `VirtualService` 对外暴露 Kafka 服务。
  > 经过我连续两天的查询中英文资料并调参配置，我成功使用 Istio Ingress 对外暴露 Kafka 服务。
  > 但是成果令人非常不满意！
  > 因为在创建 Kafka CRD 时，我们需要：
  >
  > 1. 注释`spec/kafka/listeners/0/configuration/bootstrap/host`配置（不注释的话 Kafka Operator 会报错，且无法启动 Kafka 服务）。
  > 2. 等待 Kafka Operator 启动完 Kafka 服务后，再添加 bootstrap 配置并等待 Kafka 服务重启。重启后，虽然 Kafka Operator 中依旧会报错，但是重启后的 Kafka 服务竟然使用了新的配置。
  >    此时，就可以通过 Istio Ingress 访问 Kafka 服务了。
  >
  > > 更详细的配置说明可以查看[这个 Issue](https://github.com/strimzi/strimzi-kafka-operator/issues/4542)
  >
  > 但是上述使得 Istio Ingress 正确运行的操作手段是一种非常错误的行为。它会导致 Kafka CDR 在未来的修改无法正确生效，还会导致其无法轻易的迁移至另外一个集群。
  >
  > 综上所述，虽然我找到了解决方案，但是**这个方案也只是另外一坨大便**罢了。不如等待 Strimzi 新版本支持 Kubernetes 的 Gateway API 更稳妥。
