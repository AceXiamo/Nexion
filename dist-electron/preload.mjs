"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
electron.contextBridge.exposeInMainWorld("walletDebug", {
  checkWalletAvailability: () => {
    const result = {
      ethereum: typeof window.ethereum !== "undefined",
      okxwallet: typeof window.okxwallet !== "undefined",
      userAgent: navigator.userAgent,
      isElectron: typeof process !== "undefined" && process.type === "renderer"
    };
    console.log("Wallet availability check:", result);
    return result;
  },
  logWalletProviders: () => {
    console.log(
      'All window properties containing "eth" or "wallet":',
      Object.keys(window).filter(
        (key) => key.toLowerCase().includes("eth") || key.toLowerCase().includes("wallet")
      )
    );
  }
});
{
  setTimeout(() => {
    if (typeof window.ethereum === "undefined" && typeof window.okxwallet === "undefined") {
      console.warn("No wallet detected, injecting mock provider for development...");
      window.ethereum = {
        isMetaMask: false,
        isOKXWallet: false,
        request: async ({ method, params }) => {
          console.log("Mock wallet request:", method, params);
          switch (method) {
            case "eth_requestAccounts":
              return ["0x742d35Cc6635C0532925a3b8c2412A4B1B06B2B5"];
            case "eth_chainId":
              return "0x7A0";
            case "eth_accounts":
              return ["0x742d35Cc6635C0532925a3b8c2412A4B1B06B2B5"];
            default:
              throw new Error(`Mock wallet: Method ${method} not implemented`);
          }
        },
        on: (event, callback) => {
          console.log("Mock wallet: Listening for", event);
        },
        removeListener: (event, callback) => {
          console.log("Mock wallet: Removing listener for", event);
        }
      };
      console.log("Mock wallet provider injected");
    }
  }, 1e3);
}
