import { app, shell, BrowserWindow, ipcMain, IpcMainInvokeEvent, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import * as openpgp from 'openpgp';

import { ZomeCallNapi, ZomeCallSigner, ZomeCallUnsignedNapi } from '@holochain/hc-spin-rust-utils';
import { randomNonce, getNonceExpiration, CallZomeRequestSigned, CallZomeRequest, AdminWebsocket } from '@holochain/client';
import { encode, decode } from '@msgpack/msgpack'

import split from 'split';

import * as childProcess from 'child_process';

import { writeFileSync, readFile, existsSync, mkdir } from 'fs';

let appQuitting = false;

var privatePGPKey, publicPGPKey, lair_url;

var adminWebsocket;
var conductorHandle;

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.on('saveNewAudit', (event, norms) => {
    dialog.showSaveDialog({title: 'Audit speichern', defaultPath: 'neuesAudit.json', filters: [{ name: "JSON files", extensions: ['json']}]})
    .then((result) => {
      if (!result.canceled) {
        const filePath = result.filePath;

        try {
          writeFileSync(filePath!, norms, 'utf-8');
          console.log("Saved file.");
          event.reply('newAuditSaved', {success: true});
        } catch (err) {
          if (err instanceof Error) {
            console.log("Error saving file: " + err.message);
            event.reply('newAuditSaved', {success: false, error: err.message});
          }
        }
      }
    });
  });

  ipcMain.on('loadAudit', (event) => {
    dialog.showOpenDialog({ properties: ['openFile'] })
    .then((result) => {
      if (!result.canceled) {
        const filePath = result.filePaths[0];

        readFile(filePath, 'utf-8', (err, data) => {
          if (err) {
            console.error('Error reading file: ', err);
            return;
          }

          event.reply('file-opened', data);
        });
      }
    }).catch((err) => {
      if (err instanceof Error) {
        console.error('Error opening file dialog: ', err);
      }
    });
  });

  ipcMain.on('loadAuditForSharing', (event) => {
    dialog.showOpenDialog({ properties: ['openFile'] })
    .then((result) => {
      if (!result.canceled) {
        const filePath = result.filePaths[0];

        readFile(filePath, 'utf-8', (err, data) => {
          if (err) {
            console.error('Error reading file: ', err);
            return;
          }

          event.reply('file-opened-for-sharing', data);
        });
      }
    }).catch((err) => {
      if (err instanceof Error) {
        console.error('Error opening file dialog: ', err);
      }
    });
  });

  console.log(app.getPath("userData"));

  // Make sure that folder does not exist before generating encryption key
  if (!existsSync(app.getPath("userData") + "/pgp_keys")) {
    try {
      mkdir(app.getPath("userData") + "/pgp_keys", (err) => err && console.log(err));
    } catch (err) {
      if (err instanceof Error) {
        console.log("Error creating directory pgp_keys: " + err.message);
      }
    }
    

    // Generate new PGP keypair if it doesn't exist
    // Source: https://github.com/openpgpjs/openpgpjs/blob/main/README.md#getting-started
    // ------
    (async () => {
      const { privateKey, publicKey } = await openpgp.generateKey({
          type: 'rsa', // Type of the key
          rsaBits: 4096, // RSA key size (defaults to 4096 bits)
          userIDs: [{ name: 'Test', email: 'test@testing.com' }], // you can pass multiple user IDs
          passphrase: 'testing' // protects the private key
      });

      privatePGPKey = privateKey;
      publicPGPKey = publicKey;

      // Save private key to disk
      try {
        writeFileSync(app.getPath("userData") + "/pgp_keys/pgp_key.json", JSON.stringify(privateKey), 'utf-8');
        console.log("Saved new private key to: " + app.getPath("userData") + "/pgp_keys/pgp_key");
      } catch (err) {
        if (err instanceof Error) {
          console.log("Error saving private key: " + err.message);
        }
      }

      // Save public key to disk
      try {
        writeFileSync(app.getPath("userData") + "/pgp_keys/pgp_key.pub.json", JSON.stringify(publicKey), 'utf-8');
        console.log("Saved new public key to: " + app.getPath("userData") + "/pgp_keys/pgp_key.pub");
      } catch (err) {
        if (err instanceof Error) {
          console.log("Error saving public key: " + err.message);
        }
      }
    })();
    // ------
  } else {
    // Read private key
    try {
      readFile(app.getPath("userData") + "/pgp_keys/pgp_key.json", 'utf-8', (err, data) => {
        if (err) {
          console.error('Error reading file: ', err);
          return;
        }

        privatePGPKey = JSON.parse(data);
      });
    } catch (err) {
      if (err instanceof Error) {
        console.log("Error reading private key: " + err.message);
      }
    }

    // Read public key
    try {
      readFile(app.getPath("userData") + "/pgp_keys/pgp_key.pub.json", 'utf-8', (err, data) => {
        if (err) {
          console.error('Error reading file: ', err);
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

  const WINDOW_INFO_MAP: Record<string, {agentPubKey; zomeCallSigner: ZomeCallSigner}> = {};

  ipcMain.on('sign-zome-call', async (e: IpcMainInvokeEvent, request: CallZomeRequest) => {
    const windowInfo = WINDOW_INFO_MAP[e.sender.id];

    const zomeCallUnsignedNapi: ZomeCallUnsignedNapi = {
      provenance: Array.from(request.provenance),
      cellId: [Array.from(request.cell_id[0]), Array.from(request.cell_id[1])],
      zomeName: request.zome_name,
      fnName: request.fn_name,
      payload: Array.from(encode(request.payload)),
      nonce: Array.from(await randomNonce()),
      expiresAt: getNonceExpiration()
    };

    const zomeCallSignedNapi: ZomeCallNapi =
      await windowInfo.zomeCallSigner.signZomeCall(zomeCallUnsignedNapi);

    const zomeCallSigned: CallZomeRequestSigned = {
      provenance: Uint8Array.from(zomeCallSignedNapi.provenance),
      cap_secret: null,
      cell_id: [
        Uint8Array.from(zomeCallSignedNapi.cellId[0]),
        Uint8Array.from(zomeCallSignedNapi.cellId[1]),
      ],
      zome_name: zomeCallSignedNapi.zomeName,
      fn_name: zomeCallSignedNapi.fnName,
      payload: Uint8Array.from(zomeCallSignedNapi.payload),
      signature: Uint8Array.from(zomeCallSignedNapi.signature),
      expires_at: zomeCallSignedNapi.expiresAt,
      nonce: Uint8Array.from(zomeCallSignedNapi.nonce)
    }

    return zomeCallSigned;
  });

  console.log("App path: " + app.getAppPath());

  handleLaunch("testing");

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  try {
    await uninstallApp("haudit");
  } catch (err) {
    if (err instanceof Error) {
      console.log("Could not uninstall app, reason: " + err);
    }
  }
  
  await adminWebsocket.client.close();

  if (conductorHandle && !conductorHandle.killed) {
    conductorHandle.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

async function handleLaunch(password: string) {
  conductorHandle = childProcess.spawn("./out/bins/holochain-v0.2.6-x86_64-pc-windows-msvc.exe", ['-c', './out/config/conductor-config.yaml', '-p']);

  conductorHandle.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  
  conductorHandle.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
  
  conductorHandle.on('exit', (code, signal) => {
    console.log(`Child process exited with code ${code} and signal ${signal}`);
  });

  conductorHandle.stdin.write(password);
  conductorHandle.stdin.end();

  conductorHandle.stdout.pipe(split()).on('data', async (line: string) => {
    if (line.includes('FATAL PANIC PanicInfo')) {
      console.log(
        `Holochain version 0.2.6 failed to start up and crashed. Check the logs for details.`
        );
    }

    if (line.includes('connection_url')) {
      lair_url = line.split('#')[2].trim()
      console.log('LAIR URL: "' + lair_url + '"')
    }

    if (line.includes('Conductor ready.')) {
      adminWebsocket = await AdminWebsocket.connect(
        new URL("ws://127.0.0.1:1234")
      );
      console.log('Connected to admin websocket.');
      // const installedApps = await adminWebsocket.listApps({});
      const appInterfaces = await adminWebsocket.listAppInterfaces();
      console.log('Got appInterfaces: ', appInterfaces);
      let appPort;
      if (appInterfaces.length > 0) {
        appPort = appInterfaces[0];
      } else {
        const attachAppInterfaceResponse = await adminWebsocket.attachAppInterface({});
        console.log('Attached app interface port: ', attachAppInterfaceResponse);
        appPort = attachAppInterfaceResponse.port;
      }

      console.log("Current directory: " + __dirname);

      installWebHapp("haudit");
    }
  });
}

async function installWebHapp(appId: string, networkSeed?: string) {
  const pubKey = await adminWebsocket.generateAgentPubKey();
  const appInfo = await adminWebsocket.installApp({
    agent_key: pubKey,
    installed_app_id: appId,
    membrane_proofs: {},
    path: "./happ/haudit.happ",
    network_seed: networkSeed,
  });
  await adminWebsocket.enableApp({ installed_app_id: appId });
  console.log('Installed application hAudit...');
  const installedApps = await adminWebsocket.listApps({});
  console.log('Installed apps: ', installedApps);
  console.log(`INFO: hAudit ${appInfo}`)
}

async function uninstallApp(appId: string) {
  await adminWebsocket.uninstallApp({ installed_app_id: appId });
  console.log('Uninstalled app.');
  const installedApps = await adminWebsocket.listApps({});
  console.log('Installed applications: ', installedApps);
}