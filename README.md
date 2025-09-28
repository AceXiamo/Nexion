# 🚀 Nexion

> Next-generation SSH manager powered by Web3 technology

Nexion combines traditional SSH management with cutting-edge Web3 technology to provide a secure, decentralized server access solution. Store your SSH configurations on the blockchain with end-to-end encryption and authenticate using your Web3 wallet.

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## ✨ Key Features

- 🔐 **Web3 Authentication** - Use your crypto wallet instead of traditional SSH keys
- 🌐 **Decentralized Storage** - SSH configs encrypted and stored on X Layer blockchain
- 🔒 **End-to-End Encryption** - Advanced cryptography protects your data
- 📱 **Cross-Platform** - Available on Windows, macOS, and Linux
- 🎯 **Modern UI** - Clean, intuitive interface built with React & Electron
- 🌍 **Multi-language Support** - Available in English and Chinese
- ⚡ **Quick Connect** - One-click connection to your servers

## 🛠️ Tech Stack

### Frontend
- **Framework**: Electron + React + TypeScript
- **UI Library**: Tailwind CSS + Lucide Icons
- **State Management**: Zustand + React Query
- **Routing**: React Router
- **Internationalization**: i18next

### Web3 Stack
- **Blockchain**: X Layer (OKX Layer2)
- **Wallet Integration**: OKX Wallet + WalletConnect
- **Web3 Libraries**: Wagmi + Viem
- **Encryption**: ECIES + ChaCha20Poly1305

### Backend Services
- **SSH Connection**: SSH2 + Node-pty
- **Terminal Emulation**: xterm.js
- **Encrypted Storage**: Local + Blockchain dual encryption

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- yarn or npm
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/AceXiamo/Nexion.git
cd Nexion
```

2. **Install dependencies**
```bash
yarn install
# or
npm install
```

3. **Run in development mode**
```bash
yarn dev:testnet
yarn dev:mainnet
# or
npm run dev:testnet
npm run dev:mainnet
```

4. **Build the application**
```bash
yarn build:testnet
yarn build:mainnet
# or
npm run build:testnet
npm run build:mainnet
```

## 📖 Usage Guide

### First Time Setup

1. **Connect Wallet**
   - Click the "Connect Wallet" button in the top right
   - Select OKX Wallet or other WalletConnect compatible wallet
   - Complete wallet connection

2. **Identity Verification**
   - First-time users need to complete digital signature verification
   - Click "Verify Identity" button to complete registration

3. **Add SSH Configuration**
   - Go to Connections page and click "Add Configuration"
   - Fill in server information (host, port, username, etc.)
   - Configuration will be automatically encrypted and stored on blockchain

4. **Establish Connection**
   - Select a configured server
   - Click "Connect" button
   - Start using in the terminal

### Advanced Features

- **Multi-tab Terminal**: Connect to multiple servers simultaneously
- **Session Management**: Maintain and restore connection sessions
- **Security Encryption**: All data protected with end-to-end encryption
- **Cross-device Sync**: Sync configurations across devices via blockchain

## 🔧 Development

### Project Structure

```
Nexion/
├── src/
│   ├── components/         # React components
│   │   ├── layout/        # Layout components
│   │   ├── ssh/           # SSH-related components
│   │   ├── ui/            # UI base components
│   │   └── wallet/        # Wallet components
│   ├── hooks/             # React Hooks
│   ├── services/          # Service layer
│   ├── stores/            # State management
│   ├── types/             # TypeScript types
│   ├── views/             # Page views
│   ├── locales/           # Internationalization files
│   └── lib/               # Utility libraries
├── electron/              # Electron main process
├── public/                # Static assets
└── build/                 # Build output
```

### Development Scripts

```bash
# Development mode
yarn dev:testnet
yarn dev:mainnet

# Code linting
yarn lint

# Build application
yarn build:testnet
yarn build:mainnet
```

## 🛡️ Security

Nexion employs multi-layered security protection:

- **End-to-End Encryption**: Uses ECIES + ChaCha20Poly1305 encryption algorithms
- **Blockchain Storage**: Configuration data encrypted and stored on decentralized blockchain
- **Wallet Verification**: Digital signatures ensure identity security
- **Local Protection**: Sensitive data is also encrypted locally

## 🔗 Links

- [X Layer Blockchain Explorer](https://www.oklink.com/xlayer-test)
- [OKX Wallet](https://www.okx.com/web3)
- [Project Documentation](https://github.com/AceXiamo/Nexion/wiki)
- [Issue Tracker](https://github.com/AceXiamo/Nexion/issues)

## 📄 License

This project is licensed under the [Apache 2.0 License](LICENSE).

## ☕ Support the Project

If you find Nexion useful and would like to support its development, consider buying me a coffee! In true Web3 spirit, you can send crypto directly to my wallet:

### 💰 Donation Address
```
0xe92bc8BB508028CB43ab43ec69def83C406489aa
```

**Supported Networks:**
- Ethereum (ETH)
- X Layer (OKB, USDT, USDC)
- Polygon (MATIC, USDT, USDC)
- BSC (BNB, BUSD, USDT)

Your support helps maintain and improve Nexion. Every contribution, no matter how small, is greatly appreciated! 🙏

## 🙏 Acknowledgments

Thanks to the following open source projects and technologies:

- [Electron](https://electronjs.org/) - Cross-platform desktop application framework
- [React](https://reactjs.org/) - User interface library
- [X Layer](https://www.okx.com/xlayer) - High-performance blockchain network
- [OKX Wallet](https://www.okx.com/web3) - Web3 wallet infrastructure
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

<div align="center">

**[⬆ Back to top](#-nexion)**

Made with ❤️ by [AceXiamo](https://github.com/AceXiamo)

</div>
