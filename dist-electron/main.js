var b = Object.defineProperty;
var C = (n, o, e) => o in n ? b(n, o, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[o] = e;
var y = (n, o, e) => C(n, typeof o != "symbol" ? o + "" : o, e);
import { app as p, BrowserWindow as A, ipcMain as l } from "electron";
import { fileURLToPath as D } from "node:url";
import h from "node:path";
import { Client as _ } from "ssh2";
import { EventEmitter as x } from "events";
class N extends x {
  constructor() {
    super();
    y(this, "sessions", /* @__PURE__ */ new Map());
    y(this, "activeSessionId");
  }
  /**
   * 生成唯一的会话ID
   */
  generateSessionId() {
    const e = Date.now(), s = Math.random().toString(36).substr(2, 9);
    return `ssh_${e}_${s}`;
  }
  /**
   * 生成智能会话名称
   * 同一配置的多个会话会自动编号：Config-1, Config-2, Config-3...
   */
  generateSessionName(e) {
    const r = Array.from(this.sessions.values()).filter((c) => c.configId === e.id).length + 1;
    return `${e.name}-${r}`;
  }
  /**
   * 创建新的 SSH 会话
   */
  async createSession(e) {
    const s = this.generateSessionId(), r = this.generateSessionName(e), c = {
      id: s,
      name: r,
      configId: e.id,
      configName: e.name,
      config: e,
      isActive: !1,
      status: "connecting",
      createdAt: /* @__PURE__ */ new Date(),
      lastActivity: /* @__PURE__ */ new Date(),
      reconnectAttempts: 0,
      maxReconnectAttempts: 3,
      bytesTransferred: 0
    };
    return this.sessions.set(s, c), this.sessions.size === 1 && this.setActiveSession(s), this.emit("session-created", this.getSessionData(c)), this.connectSession(s).catch((u) => {
      console.error(`Failed to connect session ${s}:`, u), c.status = "error", c.error = u.message, this.emit("session-error", s, u.message);
    }), s;
  }
  /**
   * 建立 SSH 连接
   */
  async connectSession(e) {
    const s = this.sessions.get(e);
    if (!s)
      throw new Error(`Session ${e} not found`);
    return new Promise((r, c) => {
      const { config: u } = s, a = new _(), v = Date.now(), d = setTimeout(() => {
        a.end(), s.status = "error", s.error = "连接超时", this.emit("session-error", e, "连接超时"), c(new Error("连接超时"));
      }, 15e3);
      a.on("ready", () => {
        clearTimeout(d), s.connection = a, s.status = "connected", s.lastActivity = /* @__PURE__ */ new Date(), s.connectionTime = Date.now() - v, s.reconnectAttempts = 0, a.shell((m, S) => {
          if (m) {
            c(m);
            return;
          }
          s.stream = S, S.on("data", (f) => {
            s.lastActivity = /* @__PURE__ */ new Date(), s.bytesTransferred += f.length, this.emit("session-data", e, f.toString());
          }), S.stderr.on("data", (f) => {
            s.lastActivity = /* @__PURE__ */ new Date(), s.bytesTransferred += f.length, this.emit("session-data", e, f.toString());
          }), S.on("close", () => {
            s.status = "disconnected", this.emit("session-disconnected", e), s.reconnectAttempts < s.maxReconnectAttempts && this.scheduleReconnect(e);
          }), console.log("session-connected", e), this.emit("session-connected", e), r();
        });
      }), a.on("error", (m) => {
        clearTimeout(d), s.status = "error", s.error = this.categorizeError(m), this.emit("session-error", e, s.error), this.shouldRetryConnection(m) && s.reconnectAttempts < s.maxReconnectAttempts && this.scheduleReconnect(e), c(m);
      }), a.on("close", () => {
        s.status !== "disconnected" && (s.status = "disconnected", this.emit("session-disconnected", e), s.reconnectAttempts < s.maxReconnectAttempts && this.scheduleReconnect(e));
      });
      const g = {
        host: u.host,
        port: u.port,
        username: u.username,
        readyTimeout: 15e3,
        keepaliveInterval: 3e4
      };
      u.authType === "password" ? g.password = u.password : (g.privateKey = u.privateKey, u.passphrase && (g.passphrase = u.passphrase)), a.connect(g);
    });
  }
  /**
   * 向指定会话发送命令
   */
  sendCommand(e, s) {
    const r = this.sessions.get(e);
    return !r || !r.stream || r.status !== "connected" ? !1 : (r.stream.write(s), r.lastActivity = /* @__PURE__ */ new Date(), r.bytesTransferred += Buffer.byteLength(s, "utf8"), !0);
  }
  /**
   * 调整会话终端大小
   */
  resizeSession(e, s, r) {
    const c = this.sessions.get(e);
    return !c || !c.stream || c.status !== "connected" ? !1 : (c.stream.setWindow(r, s, 0, 0), !0);
  }
  /**
   * 关闭指定会话
   */
  async closeSession(e) {
    const s = this.sessions.get(e);
    if (s) {
      if (s.connection && s.connection.end(), this.activeSessionId === e) {
        const r = Array.from(this.sessions.keys()).filter(
          (c) => c !== e
        );
        r.length > 0 ? this.setActiveSession(r[0]) : this.activeSessionId = void 0;
      }
      this.sessions.delete(e), this.emit("session-closed", e);
    }
  }
  /**
   * 设置活跃会话
   */
  setActiveSession(e) {
    const s = this.sessions.get(e);
    if (!s)
      return !1;
    if (this.activeSessionId) {
      const r = this.sessions.get(this.activeSessionId);
      r && (r.isActive = !1);
    }
    return s.isActive = !0, this.activeSessionId = e, this.emit("active-session-changed", e), !0;
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
      (e) => this.getSessionData(e)
    );
  }
  /**
   * 获取指定会话信息
   */
  getSession(e) {
    const s = this.sessions.get(e);
    return s ? this.getSessionData(s) : void 0;
  }
  /**
   * 提取会话的安全数据（不包含敏感信息）
   */
  getSessionData(e) {
    return {
      id: e.id,
      name: e.name,
      configId: e.configId,
      configName: e.configName,
      status: e.status,
      error: e.error,
      isActive: e.isActive,
      createdAt: e.createdAt,
      lastActivity: e.lastActivity,
      reconnectAttempts: e.reconnectAttempts,
      connectionTime: e.connectionTime,
      bytesTransferred: e.bytesTransferred
    };
  }
  /**
   * 计划重连
   */
  scheduleReconnect(e) {
    const s = this.sessions.get(e);
    if (!s) return;
    s.reconnectAttempts++, s.status = "connecting";
    const r = Math.min(1e3 * Math.pow(2, s.reconnectAttempts - 1), 1e4);
    this.emit("session-reconnecting", e, s.reconnectAttempts, r), setTimeout(() => {
      this.connectSession(e).catch((c) => {
        console.error(`Reconnect attempt ${s.reconnectAttempts} failed for session ${e}:`, c), s.reconnectAttempts >= s.maxReconnectAttempts && (s.status = "error", s.error = `重连失败 (已尝试 ${s.maxReconnectAttempts} 次)`, this.emit("session-error", e, s.error));
      });
    }, r);
  }
  /**
   * 分类错误信息
   */
  categorizeError(e) {
    const s = e.message || e.toString();
    return s.includes("ENOTFOUND") || s.includes("getaddrinfo") ? "主机名解析失败，请检查网络连接和主机地址" : s.includes("ECONNREFUSED") ? "连接被拒绝，请检查端口是否正确或服务是否运行" : s.includes("ETIMEDOUT") ? "连接超时，请检查网络连接" : s.includes("Authentication") ? "认证失败，请检查用户名、密码或密钥" : s.includes("Permission denied") ? "权限被拒绝，请检查用户权限" : s.includes("Host key verification failed") ? "主机密钥验证失败，可能是安全风险" : s;
  }
  /**
   * 判断是否应该重试连接
   */
  shouldRetryConnection(e) {
    const s = e.message || e.toString();
    return ![
      "Authentication",
      "Permission denied",
      "Host key verification failed",
      "EACCES"
      // 权限错误
    ].some((c) => s.includes(c));
  }
  /**
   * 手动重连会话
   */
  async reconnectSession(e) {
    const s = this.sessions.get(e);
    if (!s)
      throw new Error(`Session ${e} not found`);
    s.connection && s.connection.end(), s.reconnectAttempts = 0, s.status = "connecting", s.error = void 0, await this.connectSession(e);
  }
  /**
   * 清理所有会话
   */
  cleanup() {
    for (const [e] of this.sessions)
      this.closeSession(e).catch(console.error);
    this.sessions.clear(), this.activeSessionId = void 0;
  }
}
const E = h.dirname(D(import.meta.url));
process.env.APP_ROOT = h.join(E, "..");
const w = process.env.VITE_DEV_SERVER_URL, k = h.join(process.env.APP_ROOT, "dist-electron"), T = h.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = w ? h.join(process.env.APP_ROOT, "public") : T;
let t, i = null;
function R() {
  t = new A({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: h.join(process.env.VITE_PUBLIC, "app-icon.png"),
    title: "Web3 SSH Manager",
    webPreferences: {
      preload: h.join(E, "preload.cjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1,
      // Allow external wallet connections
      allowRunningInsecureContent: !0,
      // For Web3 wallet connections
      sandbox: !1
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
    vibrancy: process.platform === "darwin" ? "under-window" : void 0,
    // macOS 毛玻璃效果
    visualEffectState: process.platform === "darwin" ? "active" : void 0,
    show: !1
    // Don't show until ready
  }), t.once("ready-to-show", () => {
    t == null || t.show(), w && (t == null || t.webContents.openDevTools());
  }), t.webContents.on("did-finish-load", () => {
    t == null || t.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString()), t == null || t.webContents.executeJavaScript(`
      console.log('Wallet detection:', {
        ethereum: typeof window.ethereum,
        okxwallet: typeof window.okxwallet,
        metaMask: typeof window.MetaMask
      });
    `).catch(console.error);
  }), w ? t.loadURL(w) : t.loadFile(h.join(T, "index.html"));
}
p.on("window-all-closed", () => {
  process.platform !== "darwin" && (p.quit(), t = null);
});
p.on("activate", () => {
  A.getAllWindows().length === 0 && R();
});
function O() {
  i = new N(), i.on("session-created", (n) => {
    t == null || t.webContents.send("ssh-session-created", n);
  }), i.on("session-connected", (n) => {
    console.log("ssh-session-connected", n), t == null || t.webContents.send("ssh-session-connected", n);
  }), i.on("session-disconnected", (n) => {
    t == null || t.webContents.send("ssh-session-disconnected", n);
  }), i.on("session-error", (n, o) => {
    t == null || t.webContents.send("ssh-session-error", n, o);
  }), i.on("session-closed", (n) => {
    t == null || t.webContents.send("ssh-session-closed", n);
  }), i.on("active-session-changed", (n) => {
    t == null || t.webContents.send("ssh-active-session-changed", n);
  }), i.on("session-data", (n, o) => {
    t == null || t.webContents.send("ssh-session-data", n, o);
  }), i.on("session-reconnecting", (n, o, e) => {
    t == null || t.webContents.send("ssh-session-reconnecting", n, o, e);
  });
}
l.handle("ssh-create-session", async (n, o) => {
  try {
    if (!i)
      throw new Error("SSH 管理器未初始化");
    return { success: !0, sessionId: await i.createSession(o) };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "未知错误"
    };
  }
});
l.handle("ssh-close-session", async (n, o) => {
  try {
    if (!i)
      throw new Error("SSH 管理器未初始化");
    return await i.closeSession(o), { success: !0 };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "未知错误"
    };
  }
});
l.handle("ssh-switch-session", async (n, o) => {
  try {
    if (!i)
      throw new Error("SSH 管理器未初始化");
    return { success: i.setActiveSession(o) };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "未知错误"
    };
  }
});
l.handle("ssh-send-command", async (n, o, e) => {
  try {
    if (!i)
      throw new Error("SSH 管理器未初始化");
    return { success: i.sendCommand(o, e) };
  } catch (s) {
    return {
      success: !1,
      error: s instanceof Error ? s.message : "未知错误"
    };
  }
});
l.handle("ssh-resize-session", async (n, o, e, s) => {
  try {
    if (!i)
      throw new Error("SSH 管理器未初始化");
    return { success: i.resizeSession(o, e, s) };
  } catch (r) {
    return {
      success: !1,
      error: r instanceof Error ? r.message : "未知错误"
    };
  }
});
l.handle("ssh-get-all-sessions", async () => {
  try {
    return i ? { success: !0, sessions: i.getAllSessions() } : { success: !0, sessions: [] };
  } catch (n) {
    return {
      success: !1,
      error: n instanceof Error ? n.message : "未知错误"
    };
  }
});
l.handle("ssh-get-active-session", async () => {
  try {
    return i ? { success: !0, sessionId: i.getActiveSessionId() } : { success: !0, sessionId: null };
  } catch (n) {
    return {
      success: !1,
      error: n instanceof Error ? n.message : "未知错误"
    };
  }
});
l.handle("ssh-reconnect-session", async (n, o) => {
  try {
    if (!i)
      throw new Error("SSH 管理器未初始化");
    return await i.reconnectSession(o), { success: !0 };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "未知错误"
    };
  }
});
l.handle("ssh-test-connection", async (n, o) => {
  try {
    const { Client: e } = await import("ssh2");
    return new Promise((s) => {
      const r = new e(), c = Date.now(), u = setTimeout(() => {
        r.end(), s({
          success: !1,
          message: "连接超时",
          connectionTime: Date.now() - c
        });
      }, 1e4);
      r.on("ready", () => {
        clearTimeout(u);
        const a = Date.now() - c;
        r.end(), s({
          success: !0,
          message: `连接成功！耗时 ${a}ms`,
          connectionTime: a,
          serverInfo: {
            hostname: o.host,
            username: o.username
          }
        });
      }), r.on("error", (a) => {
        clearTimeout(u);
        const v = Date.now() - c;
        let d = "连接失败";
        a.message.includes("ECONNREFUSED") ? d = "连接被拒绝，请检查主机地址和端口" : a.message.includes("ENOTFOUND") ? d = "无法解析主机名，请检查网络连接" : a.message.includes("Authentication failed") ? d = "认证失败，请检查用户名和密码/密钥" : d = `连接失败: ${a.message}`, s({
          success: !1,
          message: d,
          connectionTime: v
        });
      });
      try {
        const a = {
          host: o.host,
          port: o.port,
          username: o.username,
          readyTimeout: 1e4
        };
        o.authType === "password" ? a.password = o.password : (a.privateKey = o.privateKey, o.passphrase && (a.passphrase = o.passphrase)), r.connect(a);
      } catch (a) {
        clearTimeout(u), s({
          success: !1,
          message: `配置错误: ${a instanceof Error ? a.message : "未知错误"}`,
          connectionTime: Date.now() - c
        });
      }
    });
  } catch (e) {
    return {
      success: !1,
      message: `SSH 模块加载失败: ${e instanceof Error ? e.message : "未知错误"}`
    };
  }
});
p.whenReady().then(() => {
  R(), O();
});
p.on("before-quit", () => {
  i && i.cleanup();
});
export {
  k as MAIN_DIST,
  T as RENDERER_DIST,
  w as VITE_DEV_SERVER_URL
};
