var D = Object.defineProperty;
var R = (r, t, e) => t in r ? D(r, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : r[t] = e;
var v = (r, t, e) => R(r, typeof t != "symbol" ? t + "" : t, e);
import { app as g, BrowserWindow as k, ipcMain as d } from "electron";
import { fileURLToPath as _ } from "node:url";
import h from "node:path";
import p from "node:fs/promises";
import { Client as U } from "ssh2";
import { EventEmitter as H } from "events";
import A from "node:fs";
class F extends H {
  constructor() {
    super();
    v(this, "sessions", /* @__PURE__ */ new Map());
    v(this, "activeSessionId");
  }
  /**
   * Generate unique session ID
   */
  generateSessionId() {
    const e = Date.now(), s = Math.random().toString(36).substr(2, 9);
    return `ssh_${e}_${s}`;
  }
  /**
   * Generate smart session name
   * Multiple sessions from the same config will be automatically numbered: Config-1, Config-2, Config-3...
   */
  generateSessionName(e) {
    const n = Array.from(this.sessions.values()).filter((i) => i.configId === e.id).length + 1;
    return `${e.name}-${n}`;
  }
  /**
   * Create new SSH session
   */
  async createSession(e) {
    const s = this.generateSessionId(), n = this.generateSessionName(e), i = {
      id: s,
      name: n,
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
    return this.sessions.set(s, i), this.sessions.size === 1 && this.setActiveSession(s), this.emit("session-created", this.getSessionData(i)), this.connectSession(s).catch((a) => {
      console.error(`Failed to connect session ${s}:`, a), i.status = "error", i.error = a.message, this.emit("session-error", s, a.message);
    }), s;
  }
  /**
   * Establish SSH connection
   */
  async connectSession(e) {
    const s = this.sessions.get(e);
    if (!s)
      throw new Error(`Session ${e} not found`);
    return new Promise((n, i) => {
      const { config: a } = s, c = new U(), f = Date.now(), l = setTimeout(() => {
        c.end(), s.status = "error", s.error = "Connection timeout", this.emit("session-error", e, "Connection timeout"), i(new Error("Connection timeout"));
      }, 15e3);
      c.on("ready", () => {
        clearTimeout(l), s.connection = c, s.status = "connected", s.lastActivity = /* @__PURE__ */ new Date(), s.connectionTime = Date.now() - f, s.reconnectAttempts = 0, c.shell((w, y) => {
          if (w) {
            i(w);
            return;
          }
          s.stream = y, y.on("data", (S) => {
            s.lastActivity = /* @__PURE__ */ new Date(), s.bytesTransferred += S.length, this.emit("session-data", e, S.toString());
          }), y.stderr.on("data", (S) => {
            s.lastActivity = /* @__PURE__ */ new Date(), s.bytesTransferred += S.length, this.emit("session-data", e, S.toString());
          }), y.on("close", () => {
            s.status = "disconnected", this.emit("session-disconnected", e), s.reconnectAttempts < s.maxReconnectAttempts && this.scheduleReconnect(e);
          }), console.log("session-connected", e), this.emit("session-connected", e), n();
        });
      }), c.on("error", (w) => {
        clearTimeout(l), s.status = "error", s.error = this.categorizeError(w), this.emit("session-error", e, s.error), this.shouldRetryConnection(w) && s.reconnectAttempts < s.maxReconnectAttempts && this.scheduleReconnect(e), i(w);
      }), c.on("close", () => {
        s.status !== "disconnected" && (s.status = "disconnected", this.emit("session-disconnected", e), s.reconnectAttempts < s.maxReconnectAttempts && this.scheduleReconnect(e));
      });
      const m = {
        host: a.host,
        port: a.port,
        username: a.username,
        readyTimeout: 15e3,
        keepaliveInterval: 3e4
      };
      a.authType === "password" ? m.password = a.password : (m.privateKey = a.privateKey, a.passphrase && (m.passphrase = a.passphrase)), c.connect(m);
    });
  }
  /**
   * Send command to specified session
   */
  sendCommand(e, s) {
    const n = this.sessions.get(e);
    return !n || !n.stream || n.status !== "connected" ? !1 : (n.stream.write(s), n.lastActivity = /* @__PURE__ */ new Date(), n.bytesTransferred += Buffer.byteLength(s, "utf8"), !0);
  }
  /**
   * Resize session terminal
   */
  resizeSession(e, s, n) {
    const i = this.sessions.get(e);
    return !i || !i.stream || i.status !== "connected" ? !1 : (i.stream.setWindow(n, s, 0, 0), !0);
  }
  /**
   * Close specified session
   */
  async closeSession(e) {
    const s = this.sessions.get(e);
    if (s) {
      if (s.connection && s.connection.end(), this.activeSessionId === e) {
        const n = Array.from(this.sessions.keys()).filter(
          (i) => i !== e
        );
        n.length > 0 ? this.setActiveSession(n[0]) : this.activeSessionId = void 0;
      }
      this.sessions.delete(e), this.emit("session-closed", e);
    }
  }
  /**
   * Set active session
   */
  setActiveSession(e) {
    const s = this.sessions.get(e);
    if (!s)
      return !1;
    if (this.activeSessionId) {
      const n = this.sessions.get(this.activeSessionId);
      n && (n.isActive = !1);
    }
    return s.isActive = !0, this.activeSessionId = e, this.emit("active-session-changed", e), !0;
  }
  /**
   * Get active session ID
   */
  getActiveSessionId() {
    return this.activeSessionId;
  }
  /**
   * Get basic information of all sessions
   */
  getAllSessions() {
    return Array.from(this.sessions.values()).map(
      (e) => this.getSessionData(e)
    );
  }
  /**
   * Get specified session information
   */
  getSession(e) {
    const s = this.sessions.get(e);
    return s ? this.getSessionData(s) : void 0;
  }
  /**
   * Extract secure session data (excluding sensitive information)
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
   * Schedule reconnection
   */
  scheduleReconnect(e) {
    const s = this.sessions.get(e);
    if (!s) return;
    s.reconnectAttempts++, s.status = "connecting";
    const n = Math.min(1e3 * Math.pow(2, s.reconnectAttempts - 1), 1e4);
    this.emit("session-reconnecting", e, s.reconnectAttempts, n), setTimeout(() => {
      this.connectSession(e).catch((i) => {
        console.error(`Reconnect attempt ${s.reconnectAttempts} failed for session ${e}:`, i), s.reconnectAttempts >= s.maxReconnectAttempts && (s.status = "error", s.error = `Reconnection failed (attempted ${s.maxReconnectAttempts} times)`, this.emit("session-error", e, s.error));
      });
    }, n);
  }
  /**
   * Categorize error messages
   */
  categorizeError(e) {
    const s = e.message || e.toString();
    return s.includes("ENOTFOUND") || s.includes("getaddrinfo") ? "Hostname resolution failed, please check network connection and host address" : s.includes("ECONNREFUSED") ? "Connection refused, please check if port is correct or service is running" : s.includes("ETIMEDOUT") ? "Connection timeout, please check network connection" : s.includes("Authentication") ? "Authentication failed, please check username, password or key" : s.includes("Permission denied") ? "Permission denied, please check user permissions" : s.includes("Host key verification failed") ? "Host key verification failed, possible security risk" : s;
  }
  /**
   * Determine whether connection should be retried
   */
  shouldRetryConnection(e) {
    const s = e.message || e.toString();
    return ![
      "Authentication",
      "Permission denied",
      "Host key verification failed",
      "EACCES"
      // Permission error
    ].some((i) => s.includes(i));
  }
  /**
   * Manually reconnect session
   */
  async reconnectSession(e) {
    const s = this.sessions.get(e);
    if (!s)
      throw new Error(`Session ${e} not found`);
    s.connection && s.connection.end(), s.reconnectAttempts = 0, s.status = "connecting", s.error = void 0, await this.connectSession(e);
  }
  /**
   * Clean up all sessions
   */
  cleanup() {
    for (const [e] of this.sessions)
      this.closeSession(e).catch(console.error);
    this.sessions.clear(), this.activeSessionId = void 0;
  }
  /**
   * Get session object by ID (internal use)
   */
  getSessionObject(e) {
    return this.sessions.get(e);
  }
  /**
   * Get or create SFTP connection for session
   */
  async getSFTP(e) {
    const s = this.getSessionObject(e);
    if (!s || !s.connection || s.status !== "connected")
      throw new Error("SSH session not connected");
    return s.sftp ? s.sftp : new Promise((n, i) => {
      s.connection.sftp((a, c) => {
        if (a) {
          i(a);
          return;
        }
        s.sftp = c, n(c);
      });
    });
  }
  /**
   * List files in remote directory
   */
  async listFiles(e, s) {
    const n = await this.getSFTP(e);
    return new Promise((i, a) => {
      n.readdir(s, (c, f) => {
        if (c) {
          a(c);
          return;
        }
        const l = f.map((m) => ({
          name: m.filename,
          type: m.attrs.isDirectory() ? "directory" : "file",
          size: m.attrs.size,
          modifiedAt: new Date(m.attrs.mtime * 1e3).toISOString(),
          permissions: m.attrs.mode,
          isHidden: m.filename.startsWith("."),
          path: h.posix.join(s, m.filename)
        }));
        i(l);
      });
    });
  }
  /**
   * Create remote directory
   */
  async createDirectory(e, s) {
    const n = await this.getSFTP(e);
    return new Promise((i, a) => {
      n.mkdir(s, (c) => {
        if (c) {
          a(c);
          return;
        }
        i();
      });
    });
  }
  /**
   * Delete remote file
   */
  async deleteFile(e, s) {
    const n = await this.getSFTP(e);
    return new Promise((i, a) => {
      n.unlink(s, (c) => {
        if (c) {
          a(c);
          return;
        }
        i();
      });
    });
  }
  /**
   * Delete remote directory
   */
  async deleteDirectory(e, s) {
    const n = await this.getSFTP(e);
    return new Promise((i, a) => {
      n.rmdir(s, (c) => {
        if (c) {
          a(c);
          return;
        }
        i();
      });
    });
  }
  /**
   * Upload file to remote server
   */
  async uploadFile(e, s, n) {
    const i = await this.getSFTP(e);
    return new Promise((a, c) => {
      const f = A.createReadStream(s), l = i.createWriteStream(n);
      l.on("error", c), l.on("close", a), f.on("error", c), f.pipe(l);
    });
  }
  /**
   * Download file from remote server
   */
  async downloadFile(e, s, n) {
    const i = await this.getSFTP(e);
    return new Promise((a, c) => {
      const f = i.createReadStream(s), l = A.createWriteStream(n);
      f.on("error", c), l.on("error", c), l.on("close", a), f.pipe(l);
    });
  }
}
const T = h.dirname(_(import.meta.url));
process.env.APP_ROOT = h.join(T, "..");
const E = process.env.VITE_DEV_SERVER_URL, W = h.join(process.env.APP_ROOT, "dist-electron"), b = h.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = E ? h.join(process.env.APP_ROOT, "public") : b;
let u, o = null;
function C() {
  u = new k({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: h.join(process.env.VITE_PUBLIC, "app-icon.png"),
    title: "Web3 SSH Manager",
    webPreferences: {
      preload: h.join(T, "preload.cjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1,
      // Allow external wallet connections
      allowRunningInsecureContent: !0,
      // For Web3 wallet connections
      sandbox: !1,
      // Required for WalletConnect
      experimentalFeatures: !0,
      // Enable experimental web features
      enableBlinkFeatures: "CSSColorSchemeUARendering"
      // Enable modern CSS features
    },
    // Optimized title bar style for macOS
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    titleBarOverlay: process.platform === "win32" ? {
      color: "#000000",
      symbolColor: "#BCFF2F",
      height: 32
    } : void 0,
    backgroundColor: "#000000",
    // Window background color
    vibrancy: process.platform === "darwin" ? "under-window" : void 0,
    // macOS glass effect
    visualEffectState: process.platform === "darwin" ? "active" : void 0,
    show: !1
    // Don't show until ready
  }), u.once("ready-to-show", () => {
    u == null || u.show();
  }), u.webContents.on("did-finish-load", () => {
    u == null || u.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), u.webContents.openDevTools(), E ? u.loadURL(E) : u.loadFile(h.join(b, "index.html"));
}
g.on("window-all-closed", () => {
  process.platform !== "darwin" && (g.quit(), u = null);
});
g.on("activate", () => {
  k.getAllWindows().length === 0 && C();
});
function O() {
  o = new F(), o.on("session-created", (r) => {
    u == null || u.webContents.send("ssh-session-created", r);
  }), o.on("session-connected", (r) => {
    console.log("ssh-session-connected", r), u == null || u.webContents.send("ssh-session-connected", r);
  }), o.on("session-disconnected", (r) => {
    u == null || u.webContents.send("ssh-session-disconnected", r);
  }), o.on("session-error", (r, t) => {
    u == null || u.webContents.send("ssh-session-error", r, t);
  }), o.on("session-closed", (r) => {
    u == null || u.webContents.send("ssh-session-closed", r);
  }), o.on("active-session-changed", (r) => {
    u == null || u.webContents.send("ssh-active-session-changed", r);
  }), o.on("session-data", (r, t) => {
    u == null || u.webContents.send("ssh-session-data", r, t);
  }), o.on("session-reconnecting", (r, t, e) => {
    u == null || u.webContents.send("ssh-session-reconnecting", r, t, e);
  });
}
d.handle("ssh-create-session", async (r, t) => {
  try {
    if (!o)
      throw new Error("SSH manager not initialized");
    return { success: !0, sessionId: await o.createSession(t) };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
d.handle("ssh-close-session", async (r, t) => {
  try {
    if (!o)
      throw new Error("SSH manager not initialized");
    return await o.closeSession(t), { success: !0 };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
d.handle("ssh-switch-session", async (r, t) => {
  try {
    if (!o)
      throw new Error("SSH manager not initialized");
    return { success: o.setActiveSession(t) };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
d.handle("ssh-send-command", async (r, t, e) => {
  try {
    if (!o)
      throw new Error("SSH manager not initialized");
    return { success: o.sendCommand(t, e) };
  } catch (s) {
    return {
      success: !1,
      error: s instanceof Error ? s.message : "Unknown error"
    };
  }
});
d.handle("ssh-resize-session", async (r, t, e, s) => {
  try {
    if (!o)
      throw new Error("SSH manager not initialized");
    return { success: o.resizeSession(t, e, s) };
  } catch (n) {
    return {
      success: !1,
      error: n instanceof Error ? n.message : "Unknown error"
    };
  }
});
d.handle("ssh-get-all-sessions", async () => {
  try {
    return o ? { success: !0, sessions: o.getAllSessions() } : { success: !0, sessions: [] };
  } catch (r) {
    return {
      success: !1,
      error: r instanceof Error ? r.message : "Unknown error"
    };
  }
});
d.handle("ssh-get-active-session", async () => {
  try {
    return o ? { success: !0, sessionId: o.getActiveSessionId() } : { success: !0, sessionId: null };
  } catch (r) {
    return {
      success: !1,
      error: r instanceof Error ? r.message : "Unknown error"
    };
  }
});
d.handle("ssh-reconnect-session", async (r, t) => {
  try {
    if (!o)
      throw new Error("SSH manager not initialized");
    return await o.reconnectSession(t), { success: !0 };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
d.handle("ssh-test-connection", async (r, t) => {
  try {
    const { Client: e } = await import("ssh2");
    return new Promise((s) => {
      const n = new e(), i = Date.now(), a = setTimeout(() => {
        n.end(), s({
          success: !1,
          message: "Connection timeout",
          connectionTime: Date.now() - i
        });
      }, 1e4);
      n.on("ready", () => {
        clearTimeout(a);
        const c = Date.now() - i;
        n.end(), s({
          success: !0,
          message: `Connection successful! Time taken: ${c}ms`,
          connectionTime: c,
          serverInfo: {
            hostname: t.host,
            username: t.username
          }
        });
      }), n.on("error", (c) => {
        clearTimeout(a);
        const f = Date.now() - i;
        let l = "Connection failed";
        c.message.includes("ECONNREFUSED") ? l = "Connection refused, please check host address and port" : c.message.includes("ENOTFOUND") ? l = "Unable to resolve hostname, please check network connection" : c.message.includes("Authentication failed") ? l = "Authentication failed, please check username and password/key" : l = `Connection failed: ${c.message}`, s({
          success: !1,
          message: l,
          connectionTime: f
        });
      });
      try {
        const c = {
          host: t.host,
          port: t.port,
          username: t.username,
          readyTimeout: 1e4
        };
        t.authType === "password" ? c.password = t.password : (c.privateKey = t.privateKey, t.passphrase && (c.passphrase = t.passphrase)), n.connect(c);
      } catch (c) {
        clearTimeout(a), s({
          success: !1,
          message: `Configuration error: ${c instanceof Error ? c.message : "Unknown error"}`,
          connectionTime: Date.now() - i
        });
      }
    });
  } catch (e) {
    return {
      success: !1,
      message: `SSH module loading failed: ${e instanceof Error ? e.message : "Unknown error"}`
    };
  }
});
d.handle("fs:readdir", async (r, t) => {
  try {
    const e = await p.readdir(t, { withFileTypes: !0 }), s = [];
    for (const n of e) {
      const i = h.join(t, n.name);
      try {
        const a = await p.stat(i);
        s.push({
          name: n.name,
          type: n.isDirectory() ? "directory" : "file",
          size: a.size,
          modifiedAt: a.mtime.toISOString(),
          permissions: a.mode,
          isHidden: n.name.startsWith("."),
          path: i
        });
      } catch (a) {
        console.warn(`Cannot access ${i}:`, a);
      }
    }
    return { success: !0, files: s };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
d.handle("fs:stat", async (r, t) => {
  try {
    const e = await p.stat(t), s = e.isDirectory();
    return {
      success: !0,
      stats: {
        name: h.basename(t),
        type: s ? "directory" : "file",
        size: e.size,
        modifiedAt: e.mtime.toISOString(),
        permissions: e.mode,
        isHidden: h.basename(t).startsWith("."),
        path: t
      }
    };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
d.handle("fs:mkdir", async (r, t) => {
  try {
    return await p.mkdir(t, { recursive: !0 }), { success: !0 };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
d.handle("fs:unlink", async (r, t) => {
  try {
    return await p.unlink(t), { success: !0 };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
d.handle("fs:rmdir", async (r, t) => {
  try {
    return await p.rmdir(t, { recursive: !0 }), { success: !0 };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
d.handle("sftp:connect", async (r, t) => {
  try {
    if (!o)
      throw new Error("SSH manager not initialized");
    const e = o.getSessionObject(t);
    if (!e)
      throw new Error("SSH session not found");
    return { success: e.status === "connected" };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
d.handle("sftp:disconnect", async (r, t) => {
  try {
    return { success: !0 };
  } catch (e) {
    return {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
});
d.handle("sftp:listFiles", async (r, t, e) => {
  try {
    if (!o)
      throw new Error("SSH manager not initialized");
    const s = o.getSessionObject(t);
    if (!s || s.status !== "connected")
      throw new Error("SSH session not connected");
    return { success: !0, files: await o.listFiles(t, e) };
  } catch (s) {
    return {
      success: !1,
      error: s instanceof Error ? s.message : "Unknown error"
    };
  }
});
d.handle("sftp:mkdir", async (r, t, e) => {
  try {
    if (!o)
      throw new Error("SSH manager not initialized");
    const s = o.getSessionObject(t);
    if (!s || s.status !== "connected")
      throw new Error("SSH session not connected");
    return await o.createDirectory(t, e), { success: !0 };
  } catch (s) {
    return {
      success: !1,
      error: s instanceof Error ? s.message : "Unknown error"
    };
  }
});
d.handle("sftp:unlink", async (r, t, e) => {
  try {
    if (!o)
      throw new Error("SSH manager not initialized");
    const s = o.getSessionObject(t);
    if (!s || s.status !== "connected")
      throw new Error("SSH session not connected");
    return await o.deleteFile(t, e), { success: !0 };
  } catch (s) {
    return {
      success: !1,
      error: s instanceof Error ? s.message : "Unknown error"
    };
  }
});
d.handle("sftp:rmdir", async (r, t, e) => {
  try {
    if (!o)
      throw new Error("SSH manager not initialized");
    const s = o.getSessionObject(t);
    if (!s || s.status !== "connected")
      throw new Error("SSH session not connected");
    return await o.deleteDirectory(t, e), { success: !0 };
  } catch (s) {
    return {
      success: !1,
      error: s instanceof Error ? s.message : "Unknown error"
    };
  }
});
d.handle("sftp:uploadFile", async (r, t, e, s) => {
  try {
    if (!o)
      throw new Error("SSH manager not initialized");
    const n = o.getSessionObject(t);
    if (!n || n.status !== "connected")
      throw new Error("SSH session not connected");
    return await o.uploadFile(t, e, s), { success: !0 };
  } catch (n) {
    return {
      success: !1,
      error: n instanceof Error ? n.message : "Unknown error"
    };
  }
});
d.handle("sftp:downloadFile", async (r, t, e, s) => {
  try {
    if (!o)
      throw new Error("SSH manager not initialized");
    const n = o.getSessionObject(t);
    if (!n || n.status !== "connected")
      throw new Error("SSH session not connected");
    return await o.downloadFile(t, e, s), { success: !0 };
  } catch (n) {
    return {
      success: !1,
      error: n instanceof Error ? n.message : "Unknown error"
    };
  }
});
g.whenReady().then(() => {
  C(), O();
});
g.on("before-quit", () => {
  o && o.cleanup();
});
export {
  W as MAIN_DIST,
  b as RENDERER_DIST,
  E as VITE_DEV_SERVER_URL
};
