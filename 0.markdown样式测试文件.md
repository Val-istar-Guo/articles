---
description: Markdown样式测试文件
test: true
---
# Markdown样式测试文件

[Github]: https://github.com

## H2

### H3

#### H4

##### H5

###### H6

这是一段测试文本：*斜体*、**粗体**、`代码`。

This is a test paragraph: *italic*, **bold**, `code`.

## 表格语法

| Left | Right | Center |
|:-----|------:|:------:|
| left | right | center |
| 左   | 右    | 中     |

## 代码语法

```typescript
import path from 'path'

path.resolve(__dirname)
console.log('hello world')
```

## 列表语法

* 第 1 行
  * 第 1.1 行
  * 第 1.2 行
    * 第 1.2.1 行
* 第 2 行

  第二行的折行
* 第 3 行


1. 第 1 行
   1.  第 1.1 行
   1. 第 1.2 行
   1. 第 1.2.1 行
1. 第 2 行

   第二行的折行
1. 第 3 行


## 引用语法

> 这是一段*引用*，但不是**鲁迅**说过的。
> 鲁迅说过，[Github][Github]不是万能的
>
>> 这是引用的引用
>> ```typescript
>> console.log('hello world')
>> ```

## 分割线

---

## 超链接

[Github][Github]

## 图片

![这是图片](https://markdown.com.cn/assets/img/philly-magic-garden.9c0b4415.jpg 'Image')
