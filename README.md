# 投稿审核工作台

已实现投稿录入、列表筛选与分页、详情抽屉、单条及批量审核、带遮罩的新手指引和审核日志。功能说明见 [功能清单](docs/FEATURES.md)。

## 技术栈

- 前端：Vue 3 + TypeScript + Vite + Element Plus + Tailwind CSS 4。
- 后端：Node.js + TypeScript + Fastify。
- 数据库：本地 SQLite，使用 Node.js 内置 `node:sqlite`。
- 不使用 React，不连接远程数据库。
- 为减少本地原生依赖安装步骤，使用内置 SQLite API 替代此前方案中的 better-sqlite3。
- 参考：[Vue](https://vuejs.org/guide/quick-start)、[Fastify](https://fastify.dev/docs/latest/)、[Node.js SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html)。

## 环境要求

- Node.js 24.x（项目使用内置 SQLite API）。
- npm 8 或更新版本。
- 使用 `node --version` 确认当前终端使用 Node.js 24.x。

## 开发启动

在本项目目录执行：

```bash
npm install
npm run dev
```

- 前端：http://127.0.0.1:5173。
- 后端：http://127.0.0.1:3000。
- 健康检查：http://127.0.0.1:3000/api/health。
- 开发时 Vite 将 `/api` 请求代理到后端。

后端使用 Fastify 内置的 Pino 日志，每条日志以单行 JSON 输出，无需额外日志格式化依赖。
日志保留毫秒时间戳、数字级别、消息、请求对象、附加字段与错误堆栈，堆栈换行保留为
JSON 转义字符；不做彩色显示或时间格式转换。

## 首次使用

1. 启动后自动创建 `data/review-desk.sqlite` 和业务表，预置三名演示审核员，不自动导入投稿。
2. 点击“录入投稿”，填写标题、作者、分类、正文和提交时间，保存为待审核投稿。录入不要求选择操作人。
3. 在顶部选择当前审稿人，通过行内按钮进行单条审核，或勾选当前页待审投稿进行批量审核。
4. 驳回必须填写非空原因，同一批次使用统一原因；不同原因请分批处理。
5. 切换状态为“全部”并查询，可查看处理后的投稿、详情、审核人及历史日志。

列表默认每页 20 条，关键词按标题、作者或正文进行字面包含匹配。日期范围包含起止日全天，显示和筛选均使用北京时间。只有点击查询才应用筛选；修改条件或翻页会清空已选项。

投稿保存在本地数据库中，重启后保留。操作人选择仅用于演示归属，不是真实身份认证。

仅点击投稿列表顶部的“新手指引”才会展示带遮罩的五步介绍。
指引覆盖人员选择、筛选、详情审核、批量操作和帮助入口，支持上一步、下一步、跳过和关闭。
首次访问、刷新页面、切换审稿人或返回列表均不会自动弹出；再次点击按钮会从第一步开始。

不提供审稿人管理页面及增删改接口，审核时可选择已有的可用人员。
已有数据库及历史审核关联保持兼容；演示审稿人仅在首次建表时创建。

## 检查与构建

```bash
npm run lint
npm run lint:fix
npm run check
npm test
npm run build
npm start
```

- `lint`：检查 JavaScript、TypeScript 和 Vue 单文件组件，任何警告或错误都会导致检查失败。
- `lint:fix`：自动修复可处理的代码格式问题，其余问题需手动修改。
- `check`：先执行 ESLint，再执行前后端 TypeScript 检查。
- `test`：运行基于内存 SQLite 的接口测试，覆盖录入、分页、筛选、审核冲突和事务回滚，不修改本地业务数据。
- `build`：生成前端静态资源和后端 JavaScript。
- `start`：启动构建后的服务，同时提供前端页面；访问 http://127.0.0.1:3000。

代码规范配置位于 `eslint.config.js`，使用 ESLint、TypeScript 和 Vue 推荐规则，
通过 ESLint Stylistic 统一两空格缩进、单引号、分号及多行尾逗号。
代码行宽上限为 100 字符（URL 和正则字面量除外）；长参数列表和表达式按逻辑分行。
非空对象采用多行格式，每个属性独占一行；较长的类型、解构、导入导出和数组也展开排版。
变量按用途分组，同组内的简短声明可连续排列，不同变量组之间留一个空行。
函数之间、变量声明与执行语句之间，以及校验分支和返回语句前保留空行，由 ESLint 检查。
Vue 模板采用 Vue 推荐格式规则；`dist/`、`coverage/`、`node_modules/` 和 `data/` 不参与检查。
`.editorconfig` 统一 UTF-8、LF 换行和文件末尾换行。
规则参考：[ESLint 配置](https://eslint.org/docs/latest/use/configure/configuration-files)、
[Vue 插件](https://eslint.vuejs.org/user-guide/)、[ESLint Stylistic](https://eslint.style/guide/config-presets)。

## 样式开发

Tailwind CSS 4 通过 `@tailwindcss/vite` 插件参与开发和生产构建，无需单独运行 CSS 命令。
`src/style.css` 导入 Tailwind，并通过 `@theme` 定义字体和 `desk-*` 项目配色。
页面布局、间距和字体优先使用工具类，当前 `src/App.vue` 已迁移，例如：

```html
<div class="mx-auto max-w-[760px] p-6 text-desk-ink">
  <p class="text-sm leading-[1.8] text-desk-muted">内容</p>
</div>
```

Element Plus 样式统一放在 `element-plus` CSS 层，位于 Tailwind 基础样式之后、工具类之前，
组件外观可通过 `class` 覆盖。工具类应以完整字符串出现在源码中，避免动态拼接类名。
接入方式参考 [Tailwind CSS 官方 Vite 安装指南](https://tailwindcss.com/docs/installation/using-vite)。

## 目录

```text
review-desk/
├── src/                 # 列表、详情与审核界面、录入组件及请求工具
├── server/
│   ├── index.ts         # 后端启动与退出
│   ├── app.ts           # Fastify 实例、模块注册及静态资源
│   ├── db.ts            # SQLite 连接与初始化导出
│   ├── database/        # 数据表、索引及操作人初始化
│   ├── http/            # 通用参数 schema 与错误处理
│   ├── operators/       # 操作人接口
│   ├── submissions/     # 投稿路由、schema、校验及查询
│   ├── reviews/         # 审核路由、schema、校验及事务
│   ├── review-logs/     # 审核日志接口及查询
│   └── submissions.test.ts # 接口与事务测试
├── shared/              # 按投稿、操作人、审核及日志拆分的共享类型
│   └── types.ts         # 统一类型导出，兼容现有前端引用
├── docs/FEATURES.md     # 分点功能规划与状态
├── SUBMISSION.md        # 需求假设、当前完成情况及 AI 协作
├── package.json
├── vite.config.ts
└── tsconfig*.json
```

## 接口约定

- `GET /api/operators`：可用审稿人列表。
- `POST /api/submissions`：录入一条待审核投稿，字段为 `title`、`author_name`、`category`、`content`、`submitted_at`（带时区的日期时间）。
- `GET /api/submissions`：参数为 `status`（默认 `pending`，支持 `all`）、`keyword`、`startDate`、`endDate`、`page`、`pageSize`（默认 20，最大 100）。返回当前页 `items`、匹配 `total`、全库是否存在投稿的 `hasSubmissions`，以及修正越界后的 `page` 和 `pageSize`。
- `GET /api/submissions/:id`：返回完整 `submission` 和该投稿的 `logs`。
- `POST /api/reviews`：提交 `operatorId`、`items: [{ id, version }]`、`action`（`approve` 或 `reject`）及驳回时必填的 `reason`；一次最多 100 条。返回 `batchId`、`successIds`、逐条 `failures`。状态或版本冲突允许其他记录成功；数据库异常回滚整批并返回错误。
- `GET /api/review-logs`：可按 `submissionId` 或 `operatorId` 查询，两个条件同时传入时同时生效。

当前服务仅绑定本机地址。第一版不提供撤销审核、重新送审、通知或完整账号系统。
