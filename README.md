# Open Switch

<p align="center">
  <img src="app-icon-placeholder.png" alt="Open Switch Logo" width="128" height="128">
</p>

<p align="center">
  <strong>OpenCode CLI 的现代化配置管理器</strong>
</p>

<p align="center">
  一个优雅、高效的桌面应用，用于管理 OpenCode CLI 的 AI 提供商、MCP 服务器和全局提示词配置
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#安装">安装</a> •
  <a href="#开发">开发</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#常见问题">常见问题</a>
</p>

---

## 简介

Open Switch 是一个专为 OpenCode CLI 设计的图形化配置管理工具。它提供了直观的界面来管理 AI 提供商配置、MCP 服务器和全局提示词，让您无需手动编辑 JSON 配置文件。

### 为什么选择 Open Switch？

- 🎯 **简单易用** - 图形化界面，无需手动编辑配置文件
- 🔒 **安全可靠** - API 密钥安全存储，支持凭证管理
- 🌍 **多语言支持** - 支持中文、英语、日语
- 🎨 **现代设计** - 赛博工业风格，玻璃拟态效果
- ⚡ **高性能** - 基于 Tauri 2.x 和 Rust，启动快速，资源占用低

## 功能特性

### 🤖 AI 提供商管理
- 添加、编辑和删除 AI 提供商配置
- 支持多种 SDK 类型：
  - OpenAI
  - Anthropic
  - Google (Gemini)
  - OpenAI 兼容接口
- 通过 `~/.local/share/opencode/auth.json` 安全管理 API 密钥
- 支持自定义请求头（Headers）
- 模型配置支持：
  - 思考模式（Thinking Mode）
  - 缓存键（Cache Key）选项
  - 多模型配置

### 🔌 MCP 服务器管理
- 配置模型上下文协议（Model Context Protocol）服务器
- 支持两种服务器类型：
  - **本地服务器**：基于命令行启动（如 `npx`、`node` 等）
  - **远程服务器**：基于 URL 的远程服务
- 环境变量配置支持
- 单独启用/禁用服务器
- **跨平台兼容**：
  - Windows：自动为 npm/npx 命令添加 `cmd /c` 包装
  - macOS/Linux：原生命令支持

### 📝 全局提示词管理
- 为 OpenCode 的 `AGENTS.md` 创建和管理提示词模板
- 功能特性：
  - 一键切换不同的提示词配置
  - 切换时自动备份当前提示词
  - 首次启动时自动导入现有的 `AGENTS.md`
  - 完整的 Markdown 编辑支持
  - 提示词模板本地存储（SQLite）

### 🌐 多语言支持
- 🇨🇳 简体中文
- 🇺🇸 English（英语）
- 🇯🇵 日本語（日语）

### 🎨 现代化界面
- 深色"赛博工业"主题，青色（Cyan）点缀
- 玻璃拟态（Glassmorphism）设计风格
- Framer Motion 流畅动画效果
- 完全响应式布局，适配不同屏幕尺寸
- 自定义窗口控制栏（macOS 风格）

## 系统要求

### 运行要求
- **操作系统**：
  - macOS 10.15+
  - Windows 10+
  - Linux（主流发行版）
- **磁盘空间**：约 50MB

### 开发要求
- Node.js 18+
- pnpm 8+
- Rust 1.70+（用于 Tauri 后端）

## 安装

### 方式一：下载预编译版本（推荐）

从 [Releases](https://github.com/fengshao1227/Open-Switch/releases) 页面下载适合您系统的版本：

- **macOS**：`Open-Switch_x.x.x_aarch64.dmg` 或 `Open-Switch_x.x.x_x64.dmg`
- **Windows**：`Open-Switch_x.x.x_x64-setup.exe`
- **Linux**：`Open-Switch_x.x.x_amd64.AppImage` 或 `.deb`

### 方式二：从源码构建

```bash
# 1. 克隆仓库
git clone https://github.com/fengshao1227/Open-Switch.git
cd Open-Switch/open-switch

# 2. 安装依赖
pnpm install

# 3. 开发模式运行
pnpm dev

# 4. 构建生产版本
pnpm build
```

构建完成后，安装包位于 `src-tauri/target/release/bundle/` 目录。

## 开发

### 开发命令

```bash
# 启动开发服务器（前端 + Tauri）
pnpm dev

# 仅启动前端开发服务器
pnpm dev:renderer

# TypeScript 类型检查
pnpm typecheck

# 代码格式化
pnpm format

# 构建生产版本
pnpm build
```

### 项目结构

```
open-switch/
├── src/                      # 前端源码（React + TypeScript）
│   ├── components/
│   │   └── ui/              # shadcn/ui 组件库
│   ├── lib/
│   │   ├── api.ts           # Tauri IPC 通信封装
│   │   └── utils.ts         # 工具函数
│   ├── types/               # TypeScript 类型定义
│   ├── i18n/                # 国际化配置
│   │   ├── locales/         # 翻译文件
│   │   └── config.ts        # i18n 配置
│   ├── App.tsx              # 主应用组件
│   └── main.tsx             # 应用入口
├── src-tauri/               # 后端源码（Rust）
│   ├── src/
│   │   ├── lib.rs           # Tauri 命令定义
│   │   ├── config.rs        # OpenCode 配置管理
│   │   ├── auth.rs          # 凭证管理
│   │   ├── mcp.rs           # MCP 服务器管理
│   │   ├── database.rs      # SQLite 数据库
│   │   ├── prompt.rs        # 提示词数据结构
│   │   └── prompt_service.rs # 提示词业务逻辑
│   ├── capabilities/        # Tauri 权限配置
│   ├── tauri.conf.json      # Tauri 配置文件
│   └── Cargo.toml           # Rust 依赖配置
├── public/                  # 静态资源
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # TailwindCSS 配置
└── README.md
```

## 技术栈

### 前端
- **框架**：React 18
- **语言**：TypeScript
- **样式**：TailwindCSS + shadcn/ui
- **状态管理**：TanStack Query (React Query)
- **动画**：Framer Motion
- **国际化**：react-i18next
- **构建工具**：Vite

### 后端
- **框架**：Tauri 2.x
- **语言**：Rust
- **数据库**：SQLite (rusqlite)
- **序列化**：serde + serde_json

## 配置文件

Open Switch 管理以下配置文件：

| 文件路径 | 用途 | 格式 |
|---------|------|------|
| `~/.config/opencode/opencode.json` | OpenCode 主配置文件 | JSON |
| `~/.local/share/opencode/auth.json` | API 密钥和凭证存储 | JSON |
| `~/.config/opencode/AGENTS.md` | 全局提示词文件 | Markdown |
| `~/.open-switch/open-switch.db` | 本地提示词模板数据库 | SQLite |

> **注意**：在 Windows 系统上，配置文件路径会自动适配为 Windows 标准路径。

## 常见问题

### Q: Open Switch 与 OpenCode CLI 的关系？
A: Open Switch 是 OpenCode CLI 的配置管理工具，它通过读写 OpenCode 的配置文件来管理设置，不会影响 OpenCode CLI 的正常使用。

### Q: 是否支持多个 OpenCode 配置？
A: 目前 Open Switch 管理系统默认的 OpenCode 配置文件。如果需要管理多个配置，可以通过切换提示词模板来实现部分功能。

### Q: API 密钥安全吗？
A: 是的。API 密钥存储在 `~/.local/share/opencode/auth.json` 文件中，该文件权限受操作系统保护。Open Switch 不会将密钥上传到任何服务器。

### Q: 如何更新 Open Switch？
A: 从 [Releases](https://github.com/fengshao1227/Open-Switch/releases) 页面下载最新版本并安装即可。应用会保留您的所有配置和数据。

### Q: 遇到问题如何反馈？
A: 请在 [GitHub Issues](https://github.com/fengshao1227/Open-Switch/issues) 提交问题报告，我们会尽快回复。

## 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 作者

**fengshao1227**

- GitHub: [@fengshao1227](https://github.com/fengshao1227)
- 项目主页: [Open-Switch](https://github.com/fengshao1227/Open-Switch)

---

<p align="center">
  如果这个项目对您有帮助，请给个 ⭐️ Star 支持一下！
</p>
