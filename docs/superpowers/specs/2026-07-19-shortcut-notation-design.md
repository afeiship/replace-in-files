# 设计文档：`$(xxx.yyy)` 通用简写系统

**日期**：2026-07-19
**项目**：@jswork/replace-in-files
**状态**：已批准

## 背景

`rifc` 工具支持 `$(cmd)` 语法执行 shell 命令并将输出作为替换值。但常用命令如 `git config user.email` 过长，用户希望在 YAML 配置中写 `$(git.email)` 这种简写形式。

## 需求

- 在 YAML 配置的 `to` 字段中支持 `$(xxx.yyy)` dot-notation 简写
- 内置一组常用开发工具的简写映射（git、npm、node、date 等）
- 不引入新语法，复用现有 `$(...)` 机制
- 现有完整命令写法 `$(git config user.email)` 仍然有效

## 设计

### 核心机制

在 `bin/index.js` 的 `cmdReplace` 方法中，现有 `$(cmd)` 判断逻辑内部增加 dot-notation 简写检测：

1. 当 `$(...)` 内部内容匹配 `xxx.yyy` 格式时，查内置映射表
2. 映射命中 → 将简写展开为完整 shell 命令，再走 `execSync`
3. 映射未命中 → 保持原有行为，直接 `execSync` 执行内部内容

### 内置映射表

```js
const SHORTCUTS = {
  // git
  'git.email': 'git config user.email',
  'git.user': 'git config user.name',
  'git.remote': 'git remote get-url origin',
  'git.branch': 'git rev-parse --abbrev-ref HEAD',
  'git.hash': 'git rev-parse --short HEAD',
  // npm
  'npm.name': 'node -e "console.log(require(\'./package.json\').name)"',
  'npm.version': 'node -e "console.log(require(\'./package.json\').version)"',
  'npm.description': 'node -e "console.log(require(\'./package.json\').description)"',
  // node
  'node.version': 'node -v',
  // date
  'date.year': 'date +%Y',
  'date.today': 'date +%Y-%m-%d',
};
```

### 代码改动

**文件**：`bin/index.js`

**位置**：第 72-83 行 switch 块中的 `$(...)` case

**改动前**：
```js
case to?.startsWith('$(') && to.endsWith(')'):
  to = execSync(to.slice(2, -1), { encoding: 'utf8' });
  break;
```

**改动后**：
```js
case to?.startsWith('$(') && to.endsWith(')'):
  const inner = to.slice(2, -1).trim();
  const resolved = SHORTCUTS[inner];
  to = execSync(resolved || inner, { encoding: 'utf8' }).trim();
  break;
```

**新增**：在文件顶部（`const env = process.env;` 附近）添加 `SHORTCUTS` 常量定义。

### 配置文件示例更新

**文件**：`config.init.yaml`

新增简写示例：
```yaml
replacements:
  - from: /aaa/g
    to: AAA
  - item: '${env.HOME}'
  - item: '${pkg.version}'
  - from: __USAGE__
    to: $(rifc -h)
  - from: __GIT_EMAIL__
    to: $(git.email)
  - from: __NPM_VERSION__
    to: $(npm.version)
```

### 文档更新

**README.md**：在替换规则语法表格中新增 `$(xxx.yyy)` 简写行，列出所有内置简写。

**llms.txt**：在替换规则特殊语法部分新增简写说明，列出内置映射表。

## 不变的部分

- 现有 `$(git config user.email)` 完整命令写法仍然有效
- 现有 `${env.HOME}` / `${pkg.version}` 模板插值不受影响
- 现有 `/pattern/g` 正则语法不受影响
- `from` 字段的 `$` + `{` 变量模式不受影响

## 错误处理

- 简写映射未命中时，回退到原有行为（直接 execSync 执行）
- 如果简写对应的命令执行失败（如不在 git 仓库中执行 `git.email`），execSync 会抛出错误，与现有行为一致
- 对 execSync 结果调用 `.trim()` 去除末尾换行符，避免替换值带多余空白
