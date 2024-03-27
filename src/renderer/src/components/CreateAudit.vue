<template>
    <div>
        <h1>Neues Audit</h1>
        
        <h2>Normen und Normpunkte</h2>
        <div v-for="(norm, normIndex) in norms" :key="normIndex" class="pt-1">
            <div class="flex flex-wrap">
                <div class="flex align-items-center justify-content-center">
                    <NormSelection></NormSelection>
                </div>
                <div class="flex align-items-center justify-content-center pl-1">
                    <Button label="Normpunkt hinzufügen" @click="addNormPoint(normIndex)"/>
                </div>
            </div>
            <ul class="pt-1">
                <li class="pt-1" v-for="(pointIndex) in norm.points">
                <NormpointSelection @remove-entry="removeNormPoint(normIndex, pointIndex)"></NormpointSelection>
                </li>
            </ul>
            <!-- <button class="btn btn-secondary button-item" @click="removeNorm(normIndex)">Norm entfernen</button> -->
            <div class="pt-1">
                <Button label="Norm entfernen" severity="danger" @click="removeNorm(normIndex)"/>
            </div>
        </div>
        <div class="pt-1">
            <!-- <button class="btn btn-primary button-item" @click="addNorm">Norm hinzufügen</button> -->
            <Button label="Norm hinzufügen" @click="addNorm"/>
        </div>
        <!-- <button class="btn btn-secondary button-item" @click="navigateToMainMenu()">Zurück zum Hauptmenü</button> -->
        <!-- <button class="btn btn-primary button-item" @click="saveNormsToFile()">Normen in Datei speichern</button> -->
        <div class="pt-1">
            <Button label="Normen in Datei speichern" @click="saveNormsToFile()"/>
        </div>
    </div>
</template>
  
  
<script lang="ts">
  // import { ipcRenderer } from 'electron';
  import NormpointSelection from "./NormpointSelection.vue";
  import NormSelection from "./NormSelection.vue";
  import Button from "primevue/button";

  export default {
    data() {
      return {
        norms: [{ name: '', selectedValue: '', points: [ { name: '', selectedValue: ''} ] }],
        selectionOptions: ['+', '-', '~', '/']
      };
    },
    setup() {
        
    },
    watch: {
      norms: {
        handler(newValue) {
          localStorage.setItem('norms', JSON.stringify(newValue));
        }
      }
    },
    methods: {
      addNorm() {
        this.norms.push({ name: '', selectedValue: '', points: [] });
      },
      removeNorm(normIndex) {
        this.norms.splice(normIndex, 1);
        this.$store.commit('clearAllIso9001NormpointVerdicts');
      },
      addNormPoint(normIndex) {
        this.norms[normIndex].points.push({ name: '', selectedValue: ''});
      },
      removeNormPoint(normIndex, pointIndex) {
        this.norms[normIndex].points.splice(pointIndex, 1);
      },
    //   navigateToMainMenu() {
    //     this.$router.push("/");
    //   },
      saveNormsToFile() {
        // const savePath = window.dialog.openDialog('showSaveDialog', {title: "Speicherort auswählen", buttonLabel: "Speichern", properties: ['createDirectory']})
        // .then(result => {
        //   console.log(result);
        // });

        window.electron.ipcRenderer.send('saveNewAudit', JSON.stringify(this.$store.getters.getAllIso9001Normpoints, null, 2));
      }
    }
  };
</script>

<style>
  .buttonmargin {
    margin-bottom: 5px; /* Optional: Add margin between buttons */
  }
</style>