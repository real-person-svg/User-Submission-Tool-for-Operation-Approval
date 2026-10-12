# 投稿审核工作台

当前仅完成工程骨架，**未实现投稿列表、审核、账号、日志等业务功能**。

## 技术栈

- 前端：Vue 3 + TypeScript + Vite + Element Plus + Tailwind CSS 4。
- 后端：Node.js + TypeScript + Fastify。
- 数据库：本地 SQLite，预留 Node.js 内置 `node:sqlite` 连接入口。
- 不使用 React，不连接远程数据库。
- 为减少本地原生依赖安装步骤，使用内置 SQLite API 替代此前方案中的 better-sqlite3。
- 参考：[Vue](https://vuejs.org/guide/quick-start)、[Fastify](https://fastify.dev/docs/latest/)、[Node.js SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html)。

## 环境要求

- Node.js 24.x（项目使用内置 SQLite API）。
- npm 8 或更新版本。
- 使用 `node --version` 检查版本；Node.js 16 不适用。

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

## 检查与构建

```bash
npm run lint
npm run lint:fix
npm run check
npm run build
npm start
```

- `lint`：检查 JavaScript、TypeScript 和 Vue 单文件组件，任何警告或错误都会导致检查失败。
- `lint:fix`：自动修复可处理的代码格式问题，其余问题需手动修改。
- `check`：先执行 ESLint，再执行前后端 TypeScript 检查。
- `build`：生成前端静态资源和后端 JavaScript。
- `start`：启动构建后的服务，同时提供前端页面；访问 http://127.0.0.1:3000。
- 当前没有业务实现，因此没有添加业务测试。

代码规范配置位于 `eslint.config.js`，使用 ESLint、TypeScript 和 Vue 推荐规则，
通过 ESLint Stylistic 统一两空格缩进、单引号、分号及多行尾逗号。
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
├── src/                 # Vue 入口、占位页面、基础样式
├── server/
│   ├── index.ts         # 后端启动与退出
│   ├── app.ts           # Fastify 实例、健康检查、静态资源
│   └── db.ts            # SQLite 连接入口（尚未调用）
├── shared/types.ts      # 预设业务类型，后续可调整
├── docs/FEATURES.md     # 分点功能规划与状态
├── SUBMISSION.md        # 需求假设、当前完成情况及 AI 协作
├── package.json
├── vite.config.ts
└── tsconfig*.json
```

## 后续开发

- 按 [功能清单](docs/FEATURES.md) 逐项实现。
- 开始数据库开发时补充迁移脚本和演示数据；当前不会自动创建数据库。
- 当前仅绑定本机地址。操作人选择方案仅用于演示，不构成真实身份认证。
