# replace-in-files

> 基于配置文件的批量文本替换工具。

## 简介

`rifc` 是一个 Node.js CLI 工具，通过 YAML 配置文件驱动，可对多个文件批量执行文本替换。支持正则表达式、环境变量插值、命令替换等多种替换方式。

## 安装

```shell
pnpm add @jswork/replace-in-files
```

## 使用

### 初始化配置文件

```shell
# 在当前目录生成 rif.config.yaml
rifc --init

# 强制覆盖已存在的配置文件
rifc --init --force
```

### 执行替换

```shell
# 使用默认配置文件 rif.config.yaml
rifc

# 指定配置文件路径
rifc -c my-config.yaml

# 开启详细模式，查看替换过程
rifc -v
```

### 命令行帮助

```shell
$ rifc -h
Usage: index [options]

Options:
  -V, --version  output the version number
  -i, --init     Init config file. (default: false)
  -f, --force    Force init config file. (default: false)
  -c, --config   Config file path.
  -v, --verbose  Verbose mode. (default: false)
  -h, --help     display help for command
```

## 配置文件说明

配置文件默认为 `rif.config.yaml`，包含两个核心字段：

```yaml
# 文件匹配模式（使用 fast-glob，支持 globstar）
files:
  - 'src/**/*.js'    # 匹配 src 下所有 js 文件
  - '.*'             # 匹配隐藏文件
  - '*'              # 匹配当前目录文件
  - '!node_modules'  # 排除 node_modules
  - '!rif.config.yaml' # 排除配置文件自身

# 替换规则列表
replacements:
  - from: /aaa/g          # 正则替换：将所有 aaa 替换为 AAA
    to: AAA
  - item: '${env.HOME}'   # 简写形式：将 ${env.HOME} 替换为实际环境变量值
  - item: '${pkg.version}' # 简写形式：将 ${pkg.version} 替换为 package.json 中的版本号
  - from: __USAGE__       # 命令替换：将 __USAGE__ 替换为命令输出
    to: $(rifc -h)
```

## 替换规则语法

| 语法 | 说明 | 示例 |
|------|------|------|
| `/pattern/g` | 全局正则替换 | `from: /aaa/g` → 匹配所有 `aaa` |
| `${...}` | 模板插值 | `to: ${env.HOME}` → 替换为环境变量值 |
| `$(cmd)` | 命令替换 | `to: $(git rev-parse HEAD)` → 替换为命令输出 |
| `item: X` | 简写形式 | `item: '${pkg.version}'` → from 和 to 都为该值 |

### 可用模板变量

| 变量 | 说明 |
|------|------|
| `${env.XXX}` | 环境变量（如 `${env.HOME}`、`${env.USER}`） |
| `${pkg.version}` | package.json 中的版本号 |
| `${pkg.name}` | package.json 中的包名 |
| `${PROJECT_NAME}` | 当前目录名称 |

## License

MIT
