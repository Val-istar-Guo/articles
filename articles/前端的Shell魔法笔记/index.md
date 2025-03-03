---
published: true
description: 我总结的一些实用的Shell脚本。
date: 2024-01-07
tags:
  - 前端
---

# 前端的 Shell 魔法笔记

## 关闭占用端口的程序

```shell
lsof -ti:8080 | xargs -n1 kill -9
```

## 读取 package.json 的数据

需要安装`jq`库解析 json 文件

> Github Action 中自带 jq 库，无需安装。

```shell
# debian
apt install jq
# mac
brew install jq
```

```shell
# 读取package.json中的name
cat package.json | jq -r '.name'

# 将package.json中的多个字段拼接成新的字符串 `${name}=${version}`
cat package.json | jq -r "'.name' + '=' + '.version'"
```

## 给 monorepo 添加 tag

```shell
echo $(pnpm -r exec cat package.json | jq -r '.name + "@" + .version') | xargs -n1 git tag
```

## 获取本地存在但远程不存在的 Tag

为避免给 monorepo 添加的 tag 已经存在而导致的`git push --tags`报错。可以过滤掉已存在的 tags 再推送。

> `changeset tag` 也会添加已存在的 tag

```shell
REMOTE_TAGS=$(git ls-remote --refs -t | awk '{print $2}' | awk -F '/' '{print $3}')
LOCAL_TAGS=$(git tag -l)
TAGS_REMOTE_NOT_EXIST=$(echo "$REMOTE_TAGS $REMOTE_TAGS $LOCAL_TAGS" | xargs -n1 | sort | uniq -u)
echo $TAGS_REMOTE_NOT_EXIST | xargs -n1 git push origin
```

## 载入 dotenv 的环境变量

直接从文件读取

```shell
source .env
# OR
export $(cat .env | xargs)
```

从 Github Actions 的 inputs 中读取

```yaml
# 假设我们给`your_action`一个`inputs.variables`参数
runs:
  steps:
    - uses: your_actions
      with:
        variables: |
          V1=my_variable1
          V2=my_variable2
```

```bash
# 可以这样读取到V1和V2到环境变量中
export $(cat <<EOF | xargs
${{inputs.variables}}
EOF
)

echo $V1 # my_variable1
echo $V2 # my_variable2
```

## 永不退出的 bash

永远不会退出，适用于调适 dockerfile。

```bash
tail -f /dev/null
```
