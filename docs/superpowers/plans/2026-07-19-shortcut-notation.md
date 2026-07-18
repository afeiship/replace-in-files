# $(xxx.yyy) 通用简写系统 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `rifc` 的 `$(...)` 命令替换语法中增加 dot-notation 简写映射，让用户可以写 `$(git.email)` 代替 `$(git config user.email)`。

**Architecture:** 在 `bin/index.js` 顶部新增 `SHORTCUTS` 常量映射表，在现有 `$(...)` switch-case 内部增加简写查找逻辑——命中则展开为完整命令再执行，未命中则回退到原有行为。同时更新配置模板和文档。

**Tech Stack:** Node.js, commander, child_process.execSync, YAML

---

### Task 1: 添加 SHORTCUTS 映射表常量

**Files:**
- Modify: `bin/index.js:18-22`（在 `const env = process.env;` 之后、`const cwd = process.cwd();` 之前）

- [ ] **Step 1: 在 `bin/index.js` 中添加 SHORTCUTS 常量**

在 `const env = process.env;`（第 18 行）之后插入：

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

- [ ] **Step 2: 验证文件语法正确**

Run: `node --check bin/index.js`
Expected: 无输出（语法正确）

- [ ] **Step 3: Commit**

```bash
git add bin/index.js
git commit -m "feat: add SHORTCUTS mapping table for dot-notation command shortcuts"
```

---

### Task 2: 修改 $(...) case 增加简写查找逻辑

**Files:**
- Modify: `bin/index.js:79-81`（switch 块中的 `$(...)` case）

- [ ] **Step 1: 替换现有 `$(...)` case 逻辑**

将现有代码（约第 79-81 行）：

```js
        // process to is $(cmd) case:
        case to?.startsWith('$(') && to.endsWith(')'):
          to = execSync(to.slice(2, -1), { encoding: 'utf8' });
          break;
```

替换为：

```js
        // process to is $(cmd) / $(shortcut) case:
        case to?.startsWith('$(') && to.endsWith(')'):
          const inner = to.slice(2, -1).trim();
          const resolved = SHORTCUTS[inner];
          to = execSync(resolved || inner, { encoding: 'utf8' }).trim();
          break;
```

- [ ] **Step 2: 验证文件语法正确**

Run: `node --check bin/index.js`
Expected: 无输出（语法正确）

- [ ] **Step 3: 手动验证简写功能**

在项目根目录创建临时测试配置：

```bash
cat > /tmp/rif-test-config.yaml << 'EOF'
files:
  - '/tmp/rif-test.txt'
replacements:
  - from: __GIT_EMAIL__
    to: $(git.email)
  - from: __GIT_USER__
    to: $(git.user)
  - from: __DATE__
    to: $(date.today)
  - from: __FULL_CMD__
    to: $(echo hello-world)
EOF
echo '__GIT_EMAIL__ __GIT_USER__ __DATE__ __FULL_CMD__' > /tmp/rif-test.txt
node bin/index.js -c /tmp/rif-test-config.yaml -v
cat /tmp/rif-test.txt
```

Expected: 输出中 `__GIT_EMAIL__` 被替换为 git 邮箱，`__GIT_USER__` 被替换为 git 用户名，`__DATE__` 被替换为今天日期，`__FULL_CMD__` 被替换为 `hello-world`。同时原有完整命令写法 `$(echo hello-world)` 仍然正常工作。

- [ ] **Step 4: 清理临时文件**

```bash
rm /tmp/rif-test-config.yaml /tmp/rif-test.txt
```

- [ ] **Step 5: Commit**

```bash
git add bin/index.js
git commit -m "feat: resolve $(xxx.yyy) dot-notation shortcuts via SHORTCUTS mapping"
```

---

### Task 3: 更新配置模板 config.init.yaml

**Files:**
- Modify: `config.init.yaml`

- [ ] **Step 1: 在 config.init.yaml 的 replacements 中新增简写示例**

将现有内容：

```yaml
name: replace-in-files
files:
  - 'src/**/*.js'
  - '.*'
  - '*'
  - '!node_modules'
  - '!rif.config.yaml'
replacements:
  - from: /aaa/g
    to: AAA
  - item: '${env.HOME}'
  - item: '${pkg.version}'
  - from: __USAGE__
    to: $(rifc -h)
```

替换为：

```yaml
name: replace-in-files
files:
  - 'src/**/*.js'
  - '.*'
  - '*'
  - '!node_modules'
  - '!rif.config.yaml'
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

- [ ] **Step 2: Commit**

```bash
git add config.init.yaml
git commit -m "feat: add shortcut examples to init config template"
```

---

### Task 4: 更新 README.md 文档

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 在替换规则语法表格中新增简写行，并新增内置简写列表**

在 README.md 的替换规则语法表格（`| \`item: X\` |` 行）之后，新增一行：

```markdown
| `$(xxx.yyy)` | 命令简写 | `to: $(git.email)` → 替换为 git 邮箱 |
```

在"可用模板变量"表格之后，新增"内置命令简写"部分：

```markdown
### 内置命令简写

`$(xxx.yyy)` 格式的简写会自动展开为对应的 shell 命令执行：

| 简写 | 展开命令 | 说明 |
|------|----------|------|
| `$(git.email)` | `git config user.email` | Git 邮箱 |
| `$(git.user)` | `git config user.name` | Git 用户名 |
| `$(git.remote)` | `git remote get-url origin` | Git 远程仓库地址 |
| `$(git.branch)` | `git rev-parse --abbrev-ref HEAD` | 当前分支名 |
| `$(git.hash)` | `git rev-parse --short HEAD` | 当前提交短哈希 |
| `$(npm.name)` | `node -e "console.log(require('./package.json').name)"` | 包名 |
| `$(npm.version)` | `node -e "console.log(require('./package.json').version)"` | 包版本 |
| `$(npm.description)` | `node -e "console.log(require('./package.json').description)"` | 包描述 |
| `$(node.version)` | `node -v` | Node.js 版本 |
| `$(date.year)` | `date +%Y` | 当前年份 |
| `$(date.today)` | `date +%Y-%m-%d` | 当前日期 |
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add shortcut notation section to README"
```

---

### Task 5: 更新 llms.txt 文档

**Files:**
- Modify: `llms.txt`

- [ ] **Step 1: 在"替换规则的特殊语法"部分新增简写说明**

在 llms.txt 的"命令替换"条目之后，新增：

```markdown
- **命令简写**：`to` 中 `$(xxx.yyy)` 格式的 dot-notation 简写会通过内置映射表展开为完整 shell 命令再执行。支持的简写包括：`git.email`、`git.user`、`git.remote`、`git.branch`、`git.hash`、`npm.name`、`npm.version`、`npm.description`、`node.version`、`date.year`、`date.today`。未匹配的 `$(...)` 内容仍按原有行为直接作为 shell 命令执行。
```

- [ ] **Step 2: Commit**

```bash
git add llms.txt
git commit -m "docs: add shortcut notation description to llms.txt"
```

---

### Task 6: 运行 prettier 格式化并最终验证

**Files:**
- Modify: `bin/index.js`（可能被 prettier 格式化）

- [ ] **Step 1: 运行 prettier**

```bash
pnpm run pretty
```

Expected: 无错误输出，文件格式化完成

- [ ] **Step 2: 再次验证语法**

```bash
node --check bin/index.js
```

Expected: 无输出（语法正确）

- [ ] **Step 3: 最终端到端验证**

```bash
cat > /tmp/rif-final-test.yaml << 'EOF'
files:
  - '/tmp/rif-final-test.txt'
replacements:
  - from: __GIT_EMAIL__
    to: $(git.email)
  - from: __GIT_BRANCH__
    to: $(git.branch)
  - from: __DATE__
    to: $(date.today)
  - from: __ECHO__
    to: $(echo works)
EOF
echo '__GIT_EMAIL__ __GIT_BRANCH__ __DATE__ __ECHO__' > /tmp/rif-final-test.txt
node bin/index.js -c /tmp/rif-final-test.yaml -v
cat /tmp/rif-final-test.txt
rm /tmp/rif-final-test.yaml /tmp/rif-final-test.txt
```

Expected: 所有占位符被正确替换，简写和完整命令写法均正常工作。

- [ ] **Step 4: 如有 prettier 变更则提交**

```bash
git add -A
git diff --cached --quiet || git commit -m "style: apply prettier formatting"
```
