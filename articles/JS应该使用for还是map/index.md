---
published: true
description: JS有实现循环的可以即使用for，也可以使用map、filter。for的性能比map好就应该选择for吗？
date: 2024-02-25
tags:
  - 前端
---

# JS 应该使用 for 还是 map

我猜你在看本文之前一定看过很多关于 `for`、`forEach`、`map`、`filter` 性能分析的文章。但是我认为，性能不是你选择使用`for`还是`map`时应该关注的重点。**性能问题你往往 80%的场景下都遇不到，你更应当关注的是哪种风格能够减少出 Bug 的可能性，以及哪种风格更易于后续维护。**

你应该仅在出现或预测到性能问题时，针对性的优化相关代码。其他时候，应优先保证代码可靠性和可维护性。性能问题往往会导致业务系统操作缓慢，我们可以通过限流和增加服务器的手段暂时性缓解问题，直到完成性能优化；但是 Bug 和难以维护的代码将会让你的业务付出惨痛的代价和无法估量的成本。

> 研发间流传着一个笑话，为了保住饭碗。应该尽可能减少注释。
> 如果将所有`map`和`filter`都换成`for`，那这工作就是铁饭碗了。

## 应该优先选择`map`和`filter`

如果你遇到需要转换一个数组或者筛选数组元素的时候，你总是应该优先选择`map`或`filter`解决问题。如果你熟悉`ramda`库，配合其一起使用将有效的提升代码可读性。让我们看一些例子：

```javascript
const arr = [1, 2, 3];

// 使用 for
const newArr = [];
for (const num of arr) {
  newArr.push(num + 1);
}

// 使用 map
const newArr = arr.map((num) => num + 1);

// 使用 map 配合 ramda
const newArr = arr.map(R.inc);
```

没有人会认为`map`比`for`的可读性更差。但是不少人忽略的一点，**`map`不需要一个可变的`newArr`**。

习惯使用 JS 开发的可能会很疑惑，`newArr`都是`const`，哪里存在可变？
让我们关注`newArr.push(num + 1)`这一行，它在主动修改`newArr`变量。
而`map`并不会主动修改`newArr`。在 JS 中，`const`仅代表了数组/对象的引用不变，而不是数据不变。

可是`newArr.push(num + 1)`这又有什么问题呢？

这里的问题非常大且隐蔽：**使用`map`消除了可变的`newArr`，意味着你不会不小心将`.push`写成`.shift`而产生 Bug。`map`消除了你产生 Bug 的可能性！**

> `ramda`是一个非常优秀的基础函数库，可以大大增加代码可读性。
> `ramda`宣扬`函数式`可能会引来一些人对其嗤之以鼻。
> 我想这些人一定是遇到了将几十个函数串成一个糖葫芦的代码。
> 并因此认为`函数式`等价于晦涩难懂。
>
> 我也遇到过这种代码（正是我函数式的启蒙导师写出来的），
> 我认为这是非常错误的代码编写习惯造成的。
> 正确的开发习惯是：将函数合理拆分组合，并为其合理的命名。
> 将一长串函数分割成多个独立的、可复用的、命名清晰的多个函数。
>
> 请相信我，正确的使用`ramda`会助你写出可读性更棒的代码。

## 避免使用 `forEach`

`forEach`和`for`看上去是等价的，不过我强烈建议你将`forEach`更换成`for...of`。
因为我认为`forEach`存在以下几个问题：

1. `forEach`没有`break`和`continue`两个重要关键字。未来新需求加入时，有可能需要将其重构成`for...of`。
   > 不能打断的遍历没有意思，就像是生气的女人，打断不了。
   > —— Anders Wang
2. `forEach`无法很好的处理`Promise`。未来新需求需要添加异步逻辑时，我们需要将其重构成`map`或者是`for...of`。
3. `forEach`破坏了链式调用。`map`后可以接`filter`，`filter`后可以接`map`。但千万不要尝试在`forEach`后添加什么代码。

与其使用`forEach`，更换成`for...of`不是更好吗？

> 从我对`forEach`的态度可以看出来，我并不是一个纯粹的`函数式`支持者。
> 我认为优秀的代码，是满足基本需求之上具备最佳的可读性的代码。
> 在`ramda`中存在的`ifElse`、`when`、`either`等函数都将导致代码可读性变差，我一般是不会使用的。
