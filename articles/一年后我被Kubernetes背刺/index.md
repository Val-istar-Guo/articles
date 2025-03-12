---
published: true
description: 被忽视的 Kubernetes API 过期问题
date: 2025-02-21
tags:
  - Kubernetes
---

# 一年后我被 Kubernetes 背刺

在一个夜深人静的午夜，我照常登陆 Kubernetes 查看服务的部署状况。可这个午夜，**真 TM 是见了鬼**：

```bash
Post "https://***********:6443/api/v1/namespaces/default/serviceaccounts/******/token": tls: failed to verify certificate: x509: certificate has expired or is not yet valid: current time 2025-02-21T02:03:32+08:00 is after 2025-02-20T16:53:11Z
```

`Lens` 不想跟我说话，并向我扔了一个错误提示。我一个闪身把屎送入了 `DeepSeek`。

> 根据错误信息，问题出在 Kubernetes API 服务器的证书上。具体原因是：
>
> 证书过期：错误信息显示当前时间 2025-02-21T02:03:32+08:00 已经超过了证书的有效期 2025-02-20T16:53:11Z，说明证书已过期。
>
> 证书未生效：如果当前时间早于证书的有效起始时间，也会出现类似错误，但根据错误信息，当前时间已经超过了证书的有效期，因此主要是证书过期问题。
>
> ......

回想一年前 [搭建 Kubernetes](https://val-istar-guo.com/articles/%E5%9B%BD%E5%86%85%E8%87%AA%E5%BB%BAKubernetes%E6%8C%87%E5%8D%97) 时，并没有任何文章/资料提及 Kubernetes API 的证书在一年后会过期（苦笑）。

[kubeadm_certs]: https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/

解决问题的方法并不复杂，根据 [Kubernetes 官方文档][kubeadm_certs] 的说明，我们只需要执行：

```bash
kubeadm certs renew all
```

> 更新证书后，可以使用 openssl 命令查看证书下一次的过期时间：
>
> ```bash
> openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -enddate
> ```
>
> 如果你这时发现证书的过期时间还是存在问题，那很有可能是服务器时间出现了问题。
> 这时候你需要安装 ntp 服务同步服务器时间（也可以考虑使用 [chrony](https://whatiknown.cheverjohn.me/Cheatsheets/kubernetesBootstrap#time-must-be-adjusted-to-be-consistent)）：
>
> ```bash
> sudo apt-get install ntp
> sudo systemctl enable ntp
> sudo systemctl start ntp
> ```

这样就手动完成了证书更新，然后重启 Kubernetes API 服务即可（懒的话就重启服务器吧）。

另外，在 [Kubernetes 官方文档][kubeadm_certs] 也提及了:

> kubeadm renews all the certificates during control plane upgrade.
>
> This feature is designed for addressing the simplest use cases; if you don't have specific requirements on certificate renewal and perform Kubernetes version upgrades regularly (less than 1 year in between each upgrade), kubeadm will take care of keeping your cluster up to date and reasonably secure.

**意思是如果你每年都更新 Kubernetes 集群的版本，那么证书也将会自动更新。** 这可能就是为什么在部署的教程中，没有任何有关证书过期时间警告的原因吧。

最后，记得更新 `~/.kube/config`: `cp -f /etc/kubernetes/admin.conf $HOME/.kube/config`。
