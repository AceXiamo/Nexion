# 🚀 Nexion

> 基于 Web3 技术的下一代 SSH 管理器

Nexion 将传统的 SSH 管理与前沿的 Web3 技术相结合，提供安全、去中心化的服务器访问解决方案。通过区块链加密存储你的 SSH 配置，并使用 Web3 钱包进行身份验证。

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![Version](https://img.shields.io/badge/version-0.1.0--beta-green.svg)

## ✨ 核心特性

- 🔐 **Web3 身份验证** - 使用加密钱包替代传统 SSH 密钥
- 🌐 **去中心化存储** - SSH 配置加密存储在 X Layer 区块链上
- 🔒 **端到端加密** - 先进的密码学技术保护你的数据
- 📱 **跨平台支持** - 支持 Windows、macOS 和 Linux 系统
- 🎯 **现代化界面** - 使用 React & Electron 构建的简洁直观界面
- 🌍 **多语言支持** - 支持中文和英文界面
- ⚡ **快速连接** - 一键连接到你的服务器

## 🛠️ 技术架构

### 前端技术
- **框架**: Electron + React + TypeScript
- **UI 库**: Tailwind CSS + Lucide Icons
- **状态管理**: Zustand + React Query
- **路由**: React Router
- **国际化**: i18next

### Web3 技术栈
- **区块链**: X Layer (OKX Layer2)
- **钱包集成**: OKX Wallet + WalletConnect
- **Web3 库**: Wagmi + Viem
- **加密算法**: ECIES + ChaCha20Poly1305

### 后端服务
- **SSH 连接**: SSH2 + Node-pty
- **终端模拟**: xterm.js
- **加密存储**: 本地 + 区块链双重加密

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 或 npm
- Git

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/AceXiamo/Nexion.git
cd Nexion
```

2. **安装依赖**
```bash
pnpm install
# 或者
npm install
```

3. **开发模式运行**
```bash
pnpm dev
# 或者
npm run dev
```

4. **构建应用**
```bash
pnpm build
# 或者
npm run build
```

## 📖 使用指南

### 第一次使用

1. **连接钱包**
   - 点击右上角的"连接钱包"按钮
   - 选择 OKX 钱包或其他 WalletConnect 兼容钱包
   - 完成钱包连接

2. **身份验证**
   - 首次使用需要进行数字签名验证
   - 点击"验证身份"按钮完成注册

3. **添加 SSH 配置**
   - 在连接页面点击"添加配置"
   - 填写服务器信息（主机、端口、用户名等）
   - 配置将自动加密并存储到区块链

4. **建立连接**
   - 选择已配置的服务器
   - 点击"连接"按钮
   - 在终端中开始使用

### 高级功能

- **多标签终端**: 同时连接多个服务器
- **会话管理**: 保持和恢复连接会话
- **安全加密**: 所有数据端到端加密保护
- **跨设备同步**: 通过区块链在不同设备间同步配置

## 🔧 开发指南

### 项目结构

```
Nexion/
├── src/
│   ├── components/         # React 组件
│   │   ├── layout/        # 布局组件
│   │   ├── ssh/           # SSH 相关组件
│   │   ├── ui/            # UI 基础组件
│   │   └── wallet/        # 钱包组件
│   ├── hooks/             # React Hooks
│   ├── services/          # 服务层
│   ├── stores/            # 状态管理
│   ├── types/             # TypeScript 类型
│   ├── views/             # 页面视图
│   ├── locales/           # 国际化文件
│   └── lib/               # 工具库
├── electron/              # Electron 主进程
├── public/                # 静态资源
└── build/                 # 构建输出
```

### 开发脚本

```bash
# 开发模式
pnpm dev

# 代码检查
pnpm lint

# 构建应用
pnpm build

# 预览构建
pnpm preview
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

### 开发规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 代码规范
- 编写清晰的提交信息
- 为新功能添加相应的测试
- 更新相关文档

## 🛡️ 安全性

Nexion 采用多层安全防护：

- **端到端加密**: 使用 ECIES + ChaCha20Poly1305 加密算法
- **区块链存储**: 配置数据加密存储在去中心化区块链上
- **钱包验证**: 通过数字签名确保身份安全
- **本地保护**: 敏感数据在本地也进行加密处理

## 🔗 相关链接

- [X Layer 区块链浏览器](https://www.oklink.com/xlayer-test)
- [OKX 钱包](https://www.okx.com/web3)
- [项目文档](https://github.com/AceXiamo/Nexion/wiki)
- [问题反馈](https://github.com/AceXiamo/Nexion/issues)

## 📄 许可证

本项目采用 [Apache 2.0 许可证](LICENSE)。

## 🙏 致谢

感谢以下开源项目和技术：

- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [X Layer](https://www.okx.com/xlayer) - 高性能区块链网络
- [OKX Wallet](https://www.okx.com/web3) - Web3 钱包基础设施
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

---

<div align="center">

**[⬆ 回到顶部](#-nexion)**

Made with ❤️ by [AceXiamo](https://github.com/AceXiamo)

</div>
