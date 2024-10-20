---
published: true
description: 如果你是三方库的开发者，优雅的处理这个问题并不简单。
tags:
  - 前端
---

# 如何让 Typescript 的构建产物同时支持 CommonJS 和 ESM

我最近在 Github 收到了一个 Issue，指出了我的开源项目中 `ESM` 格式的构建产物存在问题。
这个 Issue 非常有意思，并在[@Evert Pot](https://github.com/evert)的帮助下比较优雅的解决了这个问题。
这个 Issue 也反映了使用 Typescript 在同一个项目中，同时输出 `EJS` 和 `ESM` 格式在当下并不是一件轻松的事情。

## 为何选择使用 `tsc` 而不是 `webpack`/`rollup`/`tsup`

我的大多数开源项目都会选择直接使用 `tsc`，而不是 `webpack`/`rollup` 等构建工具。
这是因为 `tsc` 会最大程度的保留原始的文件代码结构和目录结构。当开发者在使用库时遇到问题，错误栈将会非常有帮助。
并且，开发者可以直接跳转至 `node_modules` 中的阅读源码，这对于调试和解决问题都非常有价值。

## 为什么要同时支持 ESM 和 CommonJS

直面现实, 拥抱未来。

CommonJS 是当下 Javascript 社区的现实。如果不借助 `webpack`/`rollup`/`vite`等工具，在 CommandJS 中是无法直接使用 ESM 包。
历史上沉淀下的大量工具包是不可能在短时间内全面支持 ESM，当下在全世界无数服务器中的项目也不可能马上用 ESM 重写。([npm-esm-vs-cjs](https://github.com/wooorm/npm-esm-vs-cjs?tab=readme-ov-file)展示了当下开源库中支持 ESM 的比例)

ESM 在当前看来，是 Javascript 的未来。JS 的社区是非常激进且活跃的，支持 ESM 即是让敢于尝试的人放手一搏，也是避免自己被淘汰。

> 当下越来越多的第三方库仅支持 ESM。我并不提倡这种做法，它太激进了。但这已经导致部分开发者不得不面对 ESM 和 CommonJS 二选一的局面。
> 我希望我的开源库不会给人们带来这种困扰。都是牛马，何必相互为难呢。

## 不要在 `tscofnig.json` 中使用 `esModuleInterop`

`esModuleInterop` 配置允许将 `import * as path from 'node:path'` 写成 `import path from 'node:path'`。

虽然这个配置可以少些几个字符，但是这个配置具有传染性！也就是说，如果库中使用了`esModuleInterop`，使用这个库的项目也必须添加`esModuleInterop`。
如果库不使用`esModuleInterop`，那么使用这个库的项目可以自由的选择是否开启`esModuleInterop`。

作为开源库的开发者，我认为应该将是否使用`esModuleInterop`配置的权力给予用户。

## 在 `package.json` 中配置 `exports`

`package.json`有许多的相似的字段，这也导致很容易配置错误。你是否能准确地说清楚`main`/`module`/`types`/`exports.require`/`exports.import`这几个字段的差异？：

- `main`: 库的默认入口文件。
  但是，如果用户使用 `CommandJS`，会优先使用 `exports.require`；如果用户 ESM，会优先使用 `exports.import`或者是`module`。
  在不支持 `exports` 的旧版本的 NodeJS 和构建工具中，依旧优先使用 `main`。
  因此我们通常将默认的 `CommonJS` 构建产物指定给 `main`。
- `module`: 虽然我们经常见到这个字段，但它并不是标准`package.json`字段。
  它是`exports.import`出现前的 JS 社区的代替方案。([参考资料](https://stackoverflow.com/questions/42708484/what-is-the-module-package-json-field-for))
  大多数流行的打包工具都是支持`module`字段的。也如你所想，他的优先级是低于`exports.import`的。
- `exports.require`/`exports.import`: Node.js 12+ 支持`exports`作为`main`的替代方案，可以支持定义子路径导出和条件导出，同时封装内部未导出的模块。
- `types`是 Typescript 查找`.d.ts`文件的入口。

我的建议是，不放弃任何一个字段。

> 我 Github 收到的 Issue 便是因为没有添加 `export.import` 导致在部分场景下 `ESM` 无法正确`import`。我竟然一直认为`module`是标准的`package.json`字段，因为看上去确实与`main`更搭配。

## 记得添加 `.js` 后缀

```typescript
// 缺少扩展名，编译成的 ESM 产物无法使用
import Foo from "./foo";
// ESM不会默认引入文件夹下的 index.js
import * from './directory'

// 正确的写法
import Foo from "./foo.js";
import * from './directory/index.js'
```

`tsc`编译时并不会自动的帮你添加`.js`后缀，但 ESM 要求必须有扩展名。这确实是一个麻烦。另外，在 Typescript 使用 `.js` 而不是 `.ts` 令人代码看上去不太优雅。
然而不幸的是，Typescript 团队并没有计划解决这个问题。不过我相信随着 ESM 更加广泛的应用，社区会推进 Typescript 团队改善这个问题。
至于现在，可以使用 `ts-patch` + `typescript-transformer-esm` 解决这个问题。

> 我选择添加 `.js` 扩展名的方案，因为 VsCode 可以将 `auto import` 配置改成自动添加 `.js`（默认是省略扩展名）。

## 垫片

ESM 并不支持 `__dirname` 和 `__filename` 两个全局变量，取而代之的是`import.meta.url`。不过，我们想要同时支持 `CommonJS` 和 `ESM`，建议更换成 [`cross-dirname`](https://www.npmjs.com/package/cross-dirname)。

## 构建脚本

由于 `tsc` 并不能将文件扩展名重写成 `.cjs`/`.mjs`。
因此我们需要分别在`CommonJS`和`ESM`的构建产物目录下添加`package.json`文件。
这确保了 NodeJS 可以正确的判定 `.js` 是 `CommonJS` 还是 `ESM`。

```bash
tsc --module commonjs --outDir cjs/
echo '{"type": "commonjs"}' > cjs/package.json

tsc --module esnext --outDir esm
echo '{"type": "module"}' > esm/package.json
```

## 后记

`ESM` 确实有许多令人眼前一亮的特性，但是目前依旧有许多工程性的问题需要解决（例如 Typescript 的扩展名）。
希望这篇文章可以解决你 `CommonJS` 和 `ESM` 二选一的困扰，成熟的开发者当然是选择全都要。
将这个恼人的决定权交给你的用户吧。

###### 本文参考： https://evertpot.com/universal-commonjs-esm-typescript-packages/
