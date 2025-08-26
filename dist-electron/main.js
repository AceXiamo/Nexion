var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Client } from "ssh2";
import { EventEmitter } from "events";
class SSHSessionManager extends EventEmitter {
  constructor() {
    super();
    __publicField(this, "sessions", /* @__PURE__ */ new Map());
    __publicField(this, "activeSessionId");
  }
  /**
   * 创建新的 SSH 会话
   */
  async createSession(config) {
    const sessionId = `ssh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionName = `${config.username}@${config.host}:${config.port}`;
    const session = {
      id: sessionId,
      name: sessionName,
      config,
      isActive: false,
      status: "connecting",
      createdAt: /* @__PURE__ */ new Date(),
      lastActivity: /* @__PURE__ */ new Date()
    };
    this.sessions.set(sessionId, session);
    if (this.sessions.size === 1) {
      this.setActiveSession(sessionId);
    }
    this.emit("session-created", this.getSessionData(session));
    this.connectSession(sessionId).catch((error) => {
      console.error(`Failed to connect session ${sessionId}:`, error);
      session.status = "error";
      session.error = error.message;
      this.emit("session-error", sessionId, error.message);
    });
    return sessionId;
  }
  /**
   * 建立 SSH 连接
   */
  async connectSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return new Promise((resolve, reject) => {
      const { config } = session;
      const conn = new Client();
      const timeout = setTimeout(() => {
        conn.end();
        reject(new Error("连接超时"));
      }, 15e3);
      conn.on("ready", () => {
        clearTimeout(timeout);
        session.connection = conn;
        session.status = "connected";
        session.lastActivity = /* @__PURE__ */ new Date();
        conn.shell((err, stream) => {
          if (err) {
            reject(err);
            return;
          }
          session.stream = stream;
          stream.on("data", (data) => {
            session.lastActivity = /* @__PURE__ */ new Date();
            this.emit("session-data", sessionId, data.toString());
          });
          stream.stderr.on("data", (data) => {
            session.lastActivity = /* @__PURE__ */ new Date();
            this.emit("session-data", sessionId, data.toString());
          });
          stream.on("close", () => {
            session.status = "disconnected";
            this.emit("session-disconnected", sessionId);
          });
          this.emit("session-connected", sessionId);
          resolve();
        });
      });
      conn.on("error", (err) => {
        clearTimeout(timeout);
        session.status = "error";
        session.error = err.message;
        this.emit("session-error", sessionId, err.message);
        reject(err);
      });
      conn.on("close", () => {
        session.status = "disconnected";
        this.emit("session-disconnected", sessionId);
      });
      const connectionConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: 15e3,
        keepaliveInterval: 3e4
      };
      if (config.authType === "password") {
        connectionConfig.password = config.password;
      } else {
        connectionConfig.privateKey = config.privateKey;
        if (config.passphrase) {
          connectionConfig.passphrase = config.passphrase;
        }
      }
      conn.connect(connectionConfig);
    });
  }
  /**
   * 向指定会话发送命令
   */
  sendCommand(sessionId, command) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.stream || session.status !== "connected") {
      return false;
    }
    session.stream.write(command);
    session.lastActivity = /* @__PURE__ */ new Date();
    return true;
  }
  /**
   * 调整会话终端大小
   */
  resizeSession(sessionId, cols, rows) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.stream || session.status !== "connected") {
      return false;
    }
    session.stream.setWindow(rows, cols);
    return true;
  }
  /**
   * 关闭指定会话
   */
  async closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }
    if (session.connection) {
      session.connection.end();
    }
    if (this.activeSessionId === sessionId) {
      const remainingSessions = Array.from(this.sessions.keys()).filter(
        (id) => id !== sessionId
      );
      if (remainingSessions.length > 0) {
        this.setActiveSession(remainingSessions[0]);
      } else {
        this.activeSessionId = void 0;
      }
    }
    this.sessions.delete(sessionId);
    this.emit("session-closed", sessionId);
  }
  /**
   * 设置活跃会话
   */
  setActiveSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    if (this.activeSessionId) {
      const prevActive = this.sessions.get(this.activeSessionId);
      if (prevActive) {
        prevActive.isActive = false;
      }
    }
    session.isActive = true;
    this.activeSessionId = sessionId;
    this.emit("active-session-changed", sessionId);
    return true;
  }
  /**
   * 获取活跃会话ID
   */
  getActiveSessionId() {
    return this.activeSessionId;
  }
  /**
   * 获取所有会话的基本信息
   */
  getAllSessions() {
    return Array.from(this.sessions.values()).map(
      (session) => this.getSessionData(session)
    );
  }
  /**
   * 获取指定会话信息
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? this.getSessionData(session) : void 0;
  }
  /**
   * 提取会话的安全数据（不包含敏感信息）
   */
  getSessionData(session) {
    return {
      id: session.id,
      name: session.name,
      status: session.status,
      error: session.error,
      isActive: session.isActive,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    };
  }
  /**
   * 清理所有会话
   */
  cleanup() {
    for (const [sessionId] of this.sessions) {
      this.closeSession(sessionId).catch(console.error);
    }
    this.sessions.clear();
    this.activeSessionId = void 0;
  }
}
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let sshManager = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    title: "Web3 SSH Manager",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      // Allow external wallet connections
      allowRunningInsecureContent: true,
      // For Web3 wallet connections
      enableRemoteModule: false,
      sandbox: false
      // Required for WalletConnect
    },
    // macOS 优化的标题栏样式
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    titleBarOverlay: process.platform === "win32" ? {
      color: "#000000",
      symbolColor: "#BCFF2F",
      height: 32
    } : void 0,
    backgroundColor: "#000000",
    // 窗口背景色
    vibrancy: process.platform === "darwin" ? "ultra-dark" : void 0,
    // macOS 毛玻璃效果
    visualEffectState: process.platform === "darwin" ? "active" : void 0,
    show: false
    // Don't show until ready
  });
  win.once("ready-to-show", () => {
    win == null ? void 0 : win.show();
    if (VITE_DEV_SERVER_URL) {
      win == null ? void 0 : win.webContents.openDevTools();
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
    win == null ? void 0 : win.webContents.executeJavaScript(`
      console.log('Wallet detection:', {
        ethereum: typeof window.ethereum,
        okxwallet: typeof window.okxwallet,
        metaMask: typeof window.MetaMask
      });
    `).catch(console.error);
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
function initSSHManager() {
  sshManager = new SSHSessionManager();
  sshManager.on("session-created", (sessionData) => {
    win == null ? void 0 : win.webContents.send("ssh-session-created", sessionData);
  });
  sshManager.on("session-connected", (sessionId) => {
    win == null ? void 0 : win.webContents.send("ssh-session-connected", sessionId);
  });
  sshManager.on("session-disconnected", (sessionId) => {
    win == null ? void 0 : win.webContents.send("ssh-session-disconnected", sessionId);
  });
  sshManager.on("session-error", (sessionId, error) => {
    win == null ? void 0 : win.webContents.send("ssh-session-error", sessionId, error);
  });
  sshManager.on("session-closed", (sessionId) => {
    win == null ? void 0 : win.webContents.send("ssh-session-closed", sessionId);
  });
  sshManager.on("active-session-changed", (sessionId) => {
    win == null ? void 0 : win.webContents.send("ssh-active-session-changed", sessionId);
  });
  sshManager.on("session-data", (sessionId, data) => {
    win == null ? void 0 : win.webContents.send("ssh-session-data", sessionId, data);
  });
}
ipcMain.handle("ssh-create-session", async (event, config) => {
  try {
    if (!sshManager) {
      throw new Error("SSH 管理器未初始化");
    }
    const sessionId = await sshManager.createSession(config);
    return { success: true, sessionId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
});
ipcMain.handle("ssh-close-session", async (event, sessionId) => {
  try {
    if (!sshManager) {
      throw new Error("SSH 管理器未初始化");
    }
    await sshManager.closeSession(sessionId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
});
ipcMain.handle("ssh-switch-session", async (event, sessionId) => {
  try {
    if (!sshManager) {
      throw new Error("SSH 管理器未初始化");
    }
    const success = sshManager.setActiveSession(sessionId);
    return { success };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
});
ipcMain.handle("ssh-send-command", async (event, sessionId, command) => {
  try {
    if (!sshManager) {
      throw new Error("SSH 管理器未初始化");
    }
    const success = sshManager.sendCommand(sessionId, command);
    return { success };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
});
ipcMain.handle("ssh-resize-session", async (event, sessionId, cols, rows) => {
  try {
    if (!sshManager) {
      throw new Error("SSH 管理器未初始化");
    }
    const success = sshManager.resizeSession(sessionId, cols, rows);
    return { success };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
});
ipcMain.handle("ssh-get-all-sessions", async (event) => {
  try {
    if (!sshManager) {
      return { success: true, sessions: [] };
    }
    const sessions = sshManager.getAllSessions();
    return { success: true, sessions };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
});
ipcMain.handle("ssh-get-active-session", async (event) => {
  try {
    if (!sshManager) {
      return { success: true, sessionId: null };
    }
    const sessionId = sshManager.getActiveSessionId();
    return { success: true, sessionId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
});
ipcMain.handle("ssh-test-connection", async (event, config) => {
  try {
    const { Client: Client2 } = await import("ssh2");
    return new Promise((resolve) => {
      const conn = new Client2();
      const startTime = Date.now();
      const timeout = setTimeout(() => {
        conn.end();
        resolve({
          success: false,
          message: "连接超时",
          connectionTime: Date.now() - startTime
        });
      }, 1e4);
      conn.on("ready", () => {
        clearTimeout(timeout);
        const connectionTime = Date.now() - startTime;
        conn.end();
        resolve({
          success: true,
          message: `连接成功！耗时 ${connectionTime}ms`,
          connectionTime,
          serverInfo: {
            hostname: config.host,
            username: config.username
          }
        });
      });
      conn.on("error", (err) => {
        clearTimeout(timeout);
        const connectionTime = Date.now() - startTime;
        let errorMessage = "连接失败";
        if (err.message.includes("ECONNREFUSED")) {
          errorMessage = "连接被拒绝，请检查主机地址和端口";
        } else if (err.message.includes("ENOTFOUND")) {
          errorMessage = "无法解析主机名，请检查网络连接";
        } else if (err.message.includes("Authentication failed")) {
          errorMessage = "认证失败，请检查用户名和密码/密钥";
        } else {
          errorMessage = `连接失败: ${err.message}`;
        }
        resolve({
          success: false,
          message: errorMessage,
          connectionTime
        });
      });
      try {
        const connectionConfig = {
          host: config.host,
          port: config.port,
          username: config.username,
          readyTimeout: 1e4
        };
        if (config.authType === "password") {
          connectionConfig.password = config.password;
        } else {
          connectionConfig.privateKey = config.privateKey;
          if (config.passphrase) {
            connectionConfig.passphrase = config.passphrase;
          }
        }
        conn.connect(connectionConfig);
      } catch (error) {
        clearTimeout(timeout);
        resolve({
          success: false,
          message: `配置错误: ${error instanceof Error ? error.message : "未知错误"}`,
          connectionTime: Date.now() - startTime
        });
      }
    });
  } catch (error) {
    return {
      success: false,
      message: `SSH 模块加载失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
});
app.whenReady().then(() => {
  createWindow();
  initSSHManager();
});
app.on("before-quit", () => {
  if (sshManager) {
    sshManager.cleanup();
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
