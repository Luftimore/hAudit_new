"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const openpgp = require("openpgp");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const openpgp__namespace = /* @__PURE__ */ _interopNamespaceDefault(openpgp);
const icon = path.join(__dirname, "../../resources/icon.png");
const fs = require("fs");
var privatePGPKey, publicPGPKey;
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.on("ping", () => console.log("pong"));
  electron.ipcMain.on("saveNewAudit", (event, norms) => {
    electron.dialog.showSaveDialog({ title: "Audit speichern", defaultPath: "neuesAudit.json", filters: [{ name: "JSON files", extensions: ["json"] }] }).then((result) => {
      if (!result.canceled) {
        const filePath = result.filePath;
        try {
          fs.writeFileSync(filePath, norms, "utf-8");
          console.log("Saved file.");
          event.reply("newAuditSaved", { success: true });
        } catch (err) {
          if (err instanceof Error) {
            console.log("Error saving file: " + err.message);
            event.reply("newAuditSaved", { success: false, error: err.message });
          }
        }
      }
    });
  });
  electron.ipcMain.on("loadAudit", (event) => {
    electron.dialog.showOpenDialog({ properties: ["openFile"] }).then((result) => {
      if (!result.canceled) {
        const filePath = result.filePaths[0];
        fs.readFile(filePath, "utf-8", (err, data) => {
          if (err) {
            console.error("Error reading file: ", err);
            return;
          }
          event.reply("file-opened", data);
        });
      }
    }).catch((err) => {
      if (err instanceof Error) {
        console.error("Error opening file dialog: ", err);
      }
    });
  });
  if (!fs.existsSync(electron.app.getPath("userData") + "/pgp_keys")) {
    try {
      fs.mkdir(electron.app.getPath("userData") + "/pgp_keys", (err) => err && console.log(err));
    } catch (err) {
      if (err instanceof Error) {
        console.log("Error creating directory pgp_keys: " + err.message);
      }
    }
    (async () => {
      const { privateKey, publicKey } = await openpgp__namespace.generateKey({
        type: "rsa",
        // Type of the key
        rsaBits: 4096,
        // RSA key size (defaults to 4096 bits)
        userIDs: [{ name: "Test", email: "test@testing.com" }],
        // you can pass multiple user IDs
        passphrase: "testing"
        // protects the private key
      });
      privatePGPKey = privateKey;
      publicPGPKey = publicKey;
      try {
        fs.writeFileSync(electron.app.getPath("userData") + "/pgp_keys/pgp_key.json", JSON.stringify(privateKey), "utf-8");
        console.log("Saved new private key to: " + electron.app.getPath("userData") + "/pgp_keys/pgp_key");
      } catch (err) {
        if (err instanceof Error) {
          console.log("Error saving private key: " + err.message);
        }
      }
      try {
        fs.writeFileSync(electron.app.getPath("userData") + "/pgp_keys/pgp_key.pub.json", JSON.stringify(publicKey), "utf-8");
        console.log("Saved new public key to: " + electron.app.getPath("userData") + "/pgp_keys/pgp_key.pub");
      } catch (err) {
        if (err instanceof Error) {
          console.log("Error saving public key: " + err.message);
        }
      }
    })();
  } else {
    try {
      fs.readFile(electron.app.getPath("userData") + "/pgp_keys/pgp_key.json", "utf-8", (err, data) => {
        if (err) {
          console.error("Error reading file: ", err);
          return;
        }
        privatePGPKey = JSON.parse(data);
      });
    } catch (err) {
      if (err instanceof Error) {
        console.log("Error reading private key: " + err.message);
      }
    }
    try {
      fs.readFile(electron.app.getPath("userData") + "/pgp_keys/pgp_key.pub.json", "utf-8", (err, data) => {
        if (err) {
          console.error("Error reading file: ", err);
          return;
        }
        publicPGPKey = JSON.parse(data);
      });
    } catch (err) {
      if (err instanceof Error) {
        console.log("Error reading public key: " + err.message);
      }
    }
  }
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0)
      createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
