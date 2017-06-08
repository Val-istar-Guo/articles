# Vue-Koa 同构开发环境

虽然 Vue 已经提供了近乎完美的工程化工具 vue-cli，
但是对于一些人来说，自行搭建一个灵活的开发环境也是一个不错的选择。
这篇文章将介绍我是如何使用Vue、Koa、PM2等常用框架搭建一个更适合
我个人开发的工程环境。

读这篇文章前，你必须要了解的内容有: Vue, Koa, Webpack, Babel



## 功能需求

- 开发环境的 Hot Reload （热重载）是必不可少的
- 支持 Server Side Render （服务器渲染）
- 兼容非同构 nodeJS 模块的使用
- 通过 PM2 快速部署项目



## Hot Reload

Webpack 提供 Hot Reload 支持，Vue本身也支持 Hot Reload。
因此，仅需在 webpack 配置文件中进行如下配置：

```javascript
{
  // More Config...
  bundle: [
    'Your Entry File',
    'webpack-hot-middleware/client',
  ],
  // More Config...
}
```



## Server Side Render

### 实现

Vue 具有极好的生态环境，我们可以直接使用`vue-server-renderer`。
这里我们使用的是`vue-server-renderer` 提供的 `createBundleRenderer()` 方法
通过`vue-ssr-bundle.json`文件进行渲染。

`vue-ssr-bundle.json` 文件是通过`vue-ssr-webpack-plugin`生成的 Client 端代码（具体编译成的内容意义我也不清楚）。
这样我们就不需要在 Server 端引入 Client 端代码，再去渲染。
仅仅需要将 `vue-ssr-webpack-plugin` 生成的`vue-ssr-bundle.json`文件内容作为参数传入 `createBundleRenderer()` 方法，
就可以得到 Client 端 HTML 的渲染结果。

### 独立的 HTML 模板

虽然 `vue-server-renderer` 支持 模版，可以将生成的 HTML 代码嵌入其中，但是我并不喜欢将HTML写入JS，有一下几个缺点：

1. 修改和编辑时没有高亮
2. 不能使用 ejs 等其他模版语言

因此，我将`view/index.html`作为模版，通过`html-webpack-plugin`将webpack提取的独立 css、js 文件作为`<link>`或`<script>`写入模板文件，
并生成一个文件 `index.dev.html/index.prod.html`（根据环境）。
最后，通过 `koa-views` 使用 `vue-server-renderer` 生成的 Client 端 HTML 作为参数、
`index.dev.html/index.prod.html`作为模板生成最终的HTML返回给 Client 端。



## 兼容非同构模块使用

虽然 `vue-server-renderer` 虽然使用方法非常便捷而神奇，但是依旧不能自动的支持非同构的 JS 代码在Server端运行。
例如，如果你使用`Chart.js^2.5.0`（一个小巧的图标绘制插件），将会报错`Cannot Find xxx from undefined`。
这里是由于未定义的变量`window`导致的。我们都明白，`window`是 浏览器中的变量自然不可能出现在NodeJS环境中。
但是放着如此不错的插件不用，未免太可惜了。

我们可以通过一个折衷的方法，通过在生成ssr所使用的webpack配置文件中设定别名，将模块指向一个代替模块。
默认代替模块为`empty.js`，webpack 配置如下：

```javascript
// empty.js
export default null;
```

```javascript
// webpack.config.ssr.js
{
  // More Config...
  resolve: {
    // More Config...
    alias: {
      chart: path.resolve(__dirname, 'empty'),
    },
  },
  // More Config...
}
```

```javascript
// webpack.config.client.js & webpack.config.dev.js
{
  // More Config...
  resolve: {
    // More Config...
    alias: {
      chart: 'chart.js',
    },
  },
  // More Config...
}
```

这里必须注意，别名不能与node中安装的模块重名。因此这里使用`chart`作为别名而不是`chart.js`。
在使用的时候要注意，在服务端渲染时chart.js会被empty.js代替。

```javascript
import Chart from 'chart';

if (Chart !== null) {
  // running on client;
} else {
  // running on server side render;
}
```

虽然这样处理并不优雅，至少能解决燃眉之急。最佳的方案还是选择一些同构的模块，这仅仅作为一个应急方案。

在这个模版中，文件`webpack.config.base.js`中导出了一个对象`NON_ISOMORPHIC_NODE_MODULES`
用来设定非同构的模块映射。文件`webpack.config.ssr.js`会自动读取这个变量用于生成别名。
可以将上面代码改为：

```javascript
// webpack.config.base.js
export const NON_ISOMORPHIC_NODE_MODULES = {
  chart: 'chart.js',
};
```



## 快速部署

PM2提供来快速部署的方法，如果你想详细了解如何使用，最好学习PM2然后了解 ecosystem.config.js 中的PM2配置。



## 开发体验

### Node Server Reload

这里并没有使用nodemon来做node server重启，而是直接使用PM2来做，目的是减少一些不必要的包依赖。
配合 Hot Reload 可以达到一流的开发体验。

### 格式约束

使用`.editorconfig`编辑器基本格式。对于代码风格，本来作者打算使用 eslint + airbnb进行，但是
vue文件又不太适合。在 Server 端也存在大量的JS文件，真希望有个完美的eslint插件。

### 默认别名

在这个模版中，根目录中的目录`contants/`与`utils/`分别用于存放在 Server 端和 Client 端都会
使用的公共静态变量和工具模块。为了方便使用，在两端都设置了别名(与文件名相同)。

在开发环境下，由于启动的是`/bin/server.dev.js`，Server代码并没有经过 webpack 处理，别名并没有被添加。
因此，这里使用 `app-module-path` 模块添加别名。如果使用者也想在 Server 端添加更多别名。也不得不在修改
`webpack.config.server.js`的同时，一并修改`/bin/server.dev.js`的少量内容。

如果可以，希望能够找到更好的解决方案。



## Problems

### PM2 无法与 Git 1.8 协同工作

和我一样使用CentOS的也大有人在，但是CentOS默认Yum仓库的git版本还停留在古老的 1.8 版。
当你的服务器git版本为 1.8.x时，使用PM2部署到该服务器，将无法获取最新的仓库中提交的版本，
每次部署都会重新部署一次第一次部署的旧版本。
我并不知道这是为什么，最简单的解决方案就是更新CentOS的git到最新版。

### yarn or npm 安装依赖时被随机kill

使用PM2部署时会首先安装需要的依赖，在使用`yarn`或`npm i`时，可能会提示被kill掉，导致部署失败。
这很可能时由于你租用的服务器内存太小的缘故（本项目的依赖稍多）。作者使用的是 1核1G的 的CentOS，
通过添加一个 1G 的swap 可以解决这个问题。