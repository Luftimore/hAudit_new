/* eslint-disable @typescript-eslint/no-var-requires */
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import * as openpgp from 'openpgp';

import { ZomeCallNapi, ZomeCallSigner, ZomeCallUnsignedNapi } from '@holochain/hc-spin-rust-utils';
import { randomNonce, getNonceExpiration, CallZomeRequestSigned, CallZomeRequest, AdminWebsocket, CellType, AppAgentWebsocket, Record } from '@holochain/client';
import { encode, decode } from '@msgpack/msgpack'

import split from 'split';

import * as childProcess from 'child_process';

import { writeFileSync, readFile, existsSync, mkdir } from 'fs';
import { Audit, Normpoint } from './types';

// var privatePGPKey, publicPGPKey, lair_url, installedApps, appPort, 
//    appAgentWs, appInfo, pubKey, zomeCallUnsignedNapi, zomeCallSigner, zomeCallSignedNapi, zomeCallSigned;

var privatePGPKey, publicPGPKey, lair_url, installedApps, appPort, 
    appAgentWs, appInfo, pubKey, zomeCallSigner;

var adminWebsocket;
var conductorHandle;

const presetPassword = "testing";

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
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
          type: 'rsa',
          rsaBits: 4096,
          userIDs: [{ name: 'Test', email: 'test@testing.com' }],
          passphrase: 'testing'
      });

      privatePGPKey = loadPrivateKey(JSON.stringify(privateKey));
      publicPGPKey = loadPublicKey(JSON.stringify(publicKey));

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

        loadPrivateKey(data);
        
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

        loadPublicKey(data);

      });
    } catch (err) {
      if (err instanceof Error) {
        console.log("Error reading public key: " + err.message);
      }
    }
  }

  console.log("App path: " + app.getAppPath());

  handleLaunch(presetPassword);

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

async function loadPublicKey(data : string) {
  var armoredEncryptedKey = JSON.parse(data);

  publicPGPKey = await openpgp.readKey({ armoredKey: armoredEncryptedKey });

  console.log(publicPGPKey);
}

async function loadPrivateKey(data : string) {
  var armoredEncryptedPKey = JSON.parse(data);

  var encryptedPKey = await openpgp.readPrivateKey({ armoredKey: armoredEncryptedPKey });

  privatePGPKey = await openpgp.decryptKey({
    privateKey: encryptedPKey,
    passphrase: "testing"
  });

  console.log(privatePGPKey);
}

async function encryptForRecipient(data : string) {
  var encryptedData = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: data }),
      encryptionKeys: [publicPGPKey]
      //passwords: ["testing"]
    });

  return encryptedData;
}

async function tryDecryptingNormpointData(normpointDataEncrypted : string) {
  var normpointData = await openpgp.readMessage( {
    armoredMessage: normpointDataEncrypted
  });

  var decryptedNormpointData = await openpgp.decrypt({
    message: normpointData,
    decryptionKeys: privatePGPKey
  })

  return decryptedNormpointData;
}

async function handleLaunch(password: string) {
  //conductorHandle = childProcess.spawn("./out/bins/holochain-v0.2.6-x86_64-pc-windows-msvc.exe", ['-c', './out/config/conductor-config.yaml', '-p']);
  conductorHandle = childProcess.spawn(process.resourcesPath + "/out/bins/holochain-v0.2.6-x86_64-pc-windows-msvc.exe", ['-c', process.resourcesPath + '/out/config/conductor-config.yaml', '-p']);

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
      
      if (appInterfaces.length > 0) {
        appPort = appInterfaces[0];
      } else {
        const attachAppInterfaceResponse = await adminWebsocket.attachAppInterface({ port: 1235 });
        console.log('Attached app interface port: ', attachAppInterfaceResponse);
        appPort = attachAppInterfaceResponse.port;
      }

      console.log("Current directory: " + __dirname);

      await installWebHapp("haudit");

      appAgentWs = await AppAgentWebsocket.connect(
        new URL("ws://127.0.0.1:" + appPort),
        "haudit"
      );

      zomeCallSigner = await ZomeCallSigner.connect(lair_url, password);

      ipcMain.on("get-all-audit-reports-zome-call", async (event) => {
          event.reply("audit-reports-fetched-zome", await getAllAudits());
      });

      ipcMain.on("create-shared-report-with-points-zome-call", async (event, data) => {
        var normpoints : Normpoint[] = [];

        interface NormpointsArray {
          normpunkt: string;
          kapitel: string;
          inhalt: string;
          verdict: string;
        }

        interface DataEntry {
          reportTitle: string,
          reportDetails: string,
          normpoints : NormpointsArray[],
          recipient: string
        }

        var dataCopy : DataEntry = JSON.parse(data);

        console.log("dataCopy" + JSON.stringify(dataCopy));

        for (const entry of dataCopy.normpoints) {
          var normpoint : Normpoint = {
            audit_hash: new Uint8Array,
            normpoint_content: entry.normpunkt + " - " +
                               entry.kapitel + " - " +
                               // entry.inhalt + " - " + 
                               entry.verdict
          }

          normpoints.push(normpoint);
        }

        event.reply("shared-report-created-zome", await createSharedAuditReportWithNormpoints(dataCopy.reportTitle, dataCopy.reportDetails, normpoints));
      });

      ipcMain.on("get-normpoints-for-audit-zome-call", async (event, data) => {
        const dataParsed = JSON.parse(data);
        // console.log(dataParsed);
        event.reply("normpoints-for-audit-fetched-zome", await getNormpointsForAudit(dataParsed.data));
      });

      // await getAllAudits();
      // var normpoints : Normpoint[] = [
      //   {
      //     normpoint_content: "Testcontent!",
      //     audit_hash: new Uint8Array
      //   },
      //   {
      //     normpoint_content: "Testcontent1!",
      //     audit_hash: new Uint8Array
      //   },
      //   {
      //     normpoint_content: "Testcontent2!",
      //     audit_hash: new Uint8Array
      //   },
      // ];

      // await createSharedAuditReportWithNormpoints("Test", "TestDetails", normpoints);
    }
  });
}

async function createSharedAuditReportWithNormpoints(auditTitle : string, auditDetails : string, points : Normpoint[]) {
  var audit : Audit = {
    title: auditTitle,
    audit_details: auditDetails
  }

  console.log("Audittitel " + auditTitle)
  console.log("Auditdetails " + auditDetails)

  var zomeCall : CallZomeRequest = {
    provenance: pubKey,
    cell_id: [installedApps[0].cell_info["audits"][0][CellType.Provisioned].cell_id[0], 
      installedApps[0].cell_info["audits"][0][CellType.Provisioned].cell_id[1]],
    zome_name: "audit",
    fn_name: "create_audit",
    payload: audit
  }
  
  var zomeCallSigned = await zomeCallSignerHandler(zomeCall);

  var response : Record = await appAgentWs.callZome(zomeCallSigned, 30000)
  .catch((err) => {
    console.log("Error creating Audit: " + err);
  });

  for (const point of points) {
    var content = point.normpoint_content;
    point.audit_hash = response.signed_action.hashed.hash;
    // @ts-ignore
    point.normpoint_content = await encryptForRecipient(content);
    await createNormpoint(point);
  }
}

async function createNormpoint(point : Normpoint) {
  var zomeCall : CallZomeRequest = {
    provenance: pubKey,
    cell_id: [installedApps[0].cell_info["audits"][0][CellType.Provisioned].cell_id[0], 
      installedApps[0].cell_info["audits"][0][CellType.Provisioned].cell_id[1]],
    zome_name: "audit",
    fn_name: "create_normpoint",
    payload: point
  }
  
  var zomeCallSigned = await zomeCallSignerHandler(zomeCall);

  var response : Record = await appAgentWs.callZome(zomeCallSigned, 30000)
  .catch((err) => {
    console.log("Error creating Normpoint: " + err);
  });

  console.log(response);
}

async function getNormpointsForAudit(hash : Uint8Array) {
  var zomeCall : CallZomeRequest = {
    provenance: pubKey,
    cell_id: [installedApps[0].cell_info["audits"][0][CellType.Provisioned].cell_id[0], 
      installedApps[0].cell_info["audits"][0][CellType.Provisioned].cell_id[1]],
    zome_name: "audit",
    fn_name: "get_normpoints_for_audit",
    payload: hash
  }

  const getNormpointsSigned = await zomeCallSignerHandler(zomeCall);

  const links : Record = await appAgentWs.callZome(getNormpointsSigned, 30000);
  const data = JSON.parse(JSON.stringify(links));

  var results : Normpoint[] = [];

  console.log("Results: " + links)

  for (const link of data) {
    const point : Normpoint = await getNormpoint(link.target.data);

    console.log("Before decrypt: " + JSON.stringify(point))

    // Try to decrypt normpoint content
    
    try {
      // @ts-ignore
    point.normpoint_content = await tryDecryptingNormpointData(point.normpoint_content);
    } catch (err) {
      point.normpoint_content = "Konnte nicht entschlüsselt werden!"
    };
    
    console.log("After decrypt: " + JSON.stringify(point))

    results.push(point);
  }

  return results;
}

async function getNormpoint(hash : Uint8Array) {
  var zomeCall : CallZomeRequest = {
    provenance: pubKey,
    cell_id: [installedApps[0].cell_info["audits"][0][CellType.Provisioned].cell_id[0], 
      installedApps[0].cell_info["audits"][0][CellType.Provisioned].cell_id[1]],
    zome_name: "audit",
    fn_name: "get_latest_normpoint",
    payload: hash
  }

  const getNormpointSigned = await zomeCallSignerHandler(zomeCall);

  const response : Record = await appAgentWs.callZome(getNormpointSigned, 30000);
  const data = JSON.parse(JSON.stringify(response));

  const point : Normpoint = decode(data.entry.Present.entry.data) as Normpoint;

  return point;
}

async function getAllAudits() {

  var zomeCall : CallZomeRequest = {
    provenance: pubKey,
    cell_id: [installedApps[0].cell_info["audits"][0][CellType.Provisioned].cell_id[0], 
      installedApps[0].cell_info["audits"][0][CellType.Provisioned].cell_id[1]],
    zome_name: "audit",
    fn_name: "get_all_audits_content",
    payload: null
  }

  const getAllAuditsSigned = await zomeCallSignerHandler(zomeCall);

  const response : Record = await appAgentWs.callZome(getAllAuditsSigned, 30000);
  const data = JSON.parse(JSON.stringify(response));

  // console.log(JSON.stringify(response))

  interface ResultItem {
    hash: Uint8Array;
    title: string;
    audit_details: string;
  }

  var results : ResultItem[] = [];

  for (const entry of data) {
    const hash = entry.signed_action.hashed.hash;
    const audit : Audit = decode(entry.entry.Present.entry.data) as Audit;
    results.push({hash: hash, title: audit.title, audit_details: audit.audit_details});
  }

  // console.log("Results: " + JSON.stringify(results))

  return results;
}

async function installWebHapp(appId: string, networkSeed?: string) {
  pubKey = await adminWebsocket.generateAgentPubKey();
  appInfo = await adminWebsocket.installApp({
    agent_key: pubKey,
    installed_app_id: appId,
    membrane_proofs: {},
    path: process.resourcesPath + "/happ/haudit.happ",
    //path: "./happ/haudit.happ",
    network_seed: networkSeed,
  }).catch((error) => {
    console.log("Error: " + error);
  });;
  await adminWebsocket.enableApp({ installed_app_id: appId });
  console.log(appInfo);
  console.log('Installed application hAudit...');
  installedApps = await adminWebsocket.listApps({});
  console.log('Installed apps: ', installedApps);
  console.log('Installed apps cell info: ', JSON.stringify(installedApps[0].cell_info));
  //console.log(`INFO: hAudit ${appInfo}`)
}

async function uninstallApp(appId: string) {
  await adminWebsocket.uninstallApp({ installed_app_id: appId });
  console.log('Uninstalled app.');
  installedApps = await adminWebsocket.listApps({});
  console.log('Installed applications: ', installedApps);
}

async function zomeCallSignerHandler(request: CallZomeRequest) {

  var zomeCallUnsignedNapi: ZomeCallUnsignedNapi = {
    provenance: Array.from(request.provenance),
    cellId: [Array.from(request.cell_id[0]), Array.from(request.cell_id[1])],
    zomeName: request.zome_name,
    fnName: request.fn_name,
    payload: Array.from(encode(request.payload)),
    nonce: Array.from(await randomNonce()),
    expiresAt: getNonceExpiration()
  };

  var zomeCallSignedNapi: ZomeCallNapi =
    await zomeCallSigner.signZomeCall(zomeCallUnsignedNapi);

  var zomeCallSigned: CallZomeRequestSigned = {
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
}