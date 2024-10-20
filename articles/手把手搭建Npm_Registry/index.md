---
published: true
description: 我想带你看看npm的install和publish的基本原理。
tags:
  - 前端
---

# 手把手搭建 Npm Registry

这篇文章不能说于[verdaccio](https://verdaccio.org/)毫无关系，那简直应该说是一丁点关系都没有。
我要带你重新认识一下`npm install`如何从 Registry 下载 `package`，以及`npm publish`如何打包文件发布至 Registry。

> 特别感谢 [@cycade](https://github.com/cycade) 的帮助。若没有他的帮助，这篇文章至少要再推迟半个月。

## `npm install`

先从下载看起，了解下载了什么内容后，就能更轻松的分析出`npm publish`的运行原理了。

假设我们安装一个名为`@buka/eslint-config`的 `package`：`npm install @buka/eslint-config`。
`npm`会先请求`https://registry.npmjs.com/@buka/eslint-config`获取 `package` 的元数据。我们看一下这份数据的核心字段：

> 建议你先将`https://registry.npmjs.com/@buka/eslint-config`拷贝到浏览器中查看完整的 JSON 数据

```json
{
  "name": "@buka/eslint-config",
  "dist-tags": {
    "latest": "1.6.4"
    // more tags...
  },

  "versions": {
    "0.0.1": {
      "version": "0.0.1",
      "dist": {
        "integrity": "sha512-gVGDqzhzEsysMy1an3PGrhRRTldjjl2Y1w7JE4GFrOSHSx7PCNhm6gXDmeyAeQrjpWWHv3gav/412k6s39HejA==",
        "tarball": "https://registry.npmjs.org/@buka/eslint-config/-/eslint-config-1.0.0.tgz"
      }
    }
    // more versions...
  },
  "time": {
    "0.0.1": "2020-03-01T13:42:33.031Z"
    // more time...
  }
}
```

这里列举的字段是`npm install`时不可缺少的字段。我们逐个说明其作用：

| property                     | description                                                                                                                                   |
| :--------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                       | `package` 名称，如果与`npm install [packageName]`指定的包名不一致，`npm`命令会报错。                                                          |
| `dist-tags`                  | 当我们在`npm install [packageName]@[tag]`指定 `package` 的 `tag` 时，`npm` 会通过`dist-tag`查找`tag`对应的版本号。                            |
| `versions[*].version`        | 这个版本号会用于填充`package.json`的`dependencies`的版本号。                                                                                  |
| `versions[*].dist.tarball`   | `package` 的压缩包的下载地址，需使用`tgz`压缩。下载地址的格式一般为`${your_registry}/${packageName}/-/${packageName}-${packageVersion}.tgz`。 |
| `versions[*].dist.integrity` | 用于验证压缩包完整性的校验码，采用`sha512`哈希算法。`npm publish`章节详细介绍如何生成。                                                       |
| `time`                       | 不同版本的创建时间，缺少这个字段`npm`也会报错。                                                                                               |

了解完每个字段的含义，`npm install [packageName]`的基本原理相信大家已经猜的七七八八了。
`npm`就是如你想象中那样，在获取到元数据文件后，找到对应版本的`tarball`下载并解压至`node_modules`。

## `npm publish`

在了解`npm install`原理后，`npm publish`的原理也就非常清晰了。就是把本地文件压缩成`tgz`发送给 Registry。
再由 Registry 构造/补充 `package` 的元数据文件。

这里我们介绍下`versions[*].dist.integrity`这个校验码如何生成：

```bash
curl "https://registry.npmjs.org/@buka/eslint-config/-/eslint-config-1.0.0.tgz" | openssl dgst -binary -sha512 | openssl base64 -A
```

也可以使用 NodeJS 实现

```typescript
import * as crypto from "crypto";

tarballFilepath = "";
const buf = await fs.readFile(tarballFilepath);
const integrity = crypto.createHash("sha512").update(buf).digest("base64");
```

## Registry

想要实现一个 Npm Registry。只要实现了`${your_registry}/${packageName}`和`${your_registry}/${packageName}/-/${packageName}-${packageVersion}.tgz`两个 GET 接口。
`npm`就可以通过`npm install`从你的 Registry 下载`package`。 至于`npm publish`需要实现哪些接口，我就没有细究了。

之所以有兴趣研究 Npm Registry 的实现，是由于我最近专注于实现一款名为[`OpenDoc`](https://github.com/buka-lnc/app.opendoc)的接口文档平台。想让其可以成为一个只读的 Npm Registry。
从而方便前端直接下载自动打包好的接口 SDK。这里必须要再次感谢 [@cycade](https://github.com/cycade) 的帮助，他分享的经验至少帮我节约了一周的时间。
