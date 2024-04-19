Please note: The contents of the folder happ/ have been auto-generated using the [Holochain scaffolding tool](https://developer.holochain.org/get-started/) with Holochain version 0.2.6. All content in src/ taken from other sources is marked accordingly with comments.

# haudit

An Electron application with Vue and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)

## Project Setup

### Install

```bash
$ npm install
```

### Development
Make sure the file paths in the handleLaunch and installWebHapp functions of the file src/main/index.ts are set accordingly to use the happ file in happ/ and the Holochain conductor in out/bins with the configuration file in /out/config/conductor-config.yaml.

```bash
$ npm run dev
```

### Build
Make sure the file paths in the handleLaunch and installWebHapp functions of the file src/main/index.ts are set accordingly to use the happ file in {process.resourcesPath}/happ/haudit.happ and the Holochain conductor in {process.resourcesPath}/out/bins with the configuration file in {process.resourcesPath}/out/config/conductor-config.yaml.

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
