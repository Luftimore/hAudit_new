<template>
    <div>
        <h1>Neues Audit</h1>
        
        <h2>Normen und Normpunkte</h2>
        <div v-for="(norm, normIndex) in norms" :key="normIndex" class="pt-1">
            <!-- <input type="text" v-model="norm.name" placeholder="Norm eingeben"> -->
            <!-- <NormpointSelection></NormpointSelection> -->
            <!-- <select v-model="norm.selectedValue">
              <option v-for="option in selectionOptions" :key="option" :value="option">{{ option }}</option>
            </select> -->
            <!-- <Dropdown v-model="norm.selectedValue" :options="selectionOptions" :value="option"></Dropdown> -->
            
            <!-- <button class="btn btn-primary button-item" @click="addNormPoint(normIndex)">Normpunkt hinzufügen</button> -->
            <div class="flex flex-wrap">
                <div class="flex align-items-center justify-content-center">
                    <NormSelection></NormSelection>
                </div>
                <div class="flex align-items-center justify-content-center pl-1">
                    <Button label="Normpunkt hinzufügen" @click="addNormPoint(normIndex)"/>
                </div>
            </div>
            <ul class="pt-1">
                <li class="pt-1" v-for="(point, pointIndex) in norm.points" :key="pointIndex">
                <!-- <input type="text" v-model="point.name" placeholder="Normpunkt eingeben"> -->
                <div class="flex flex-wrap">
                    <div class="flex align-items-center justify-content-center">
                        <NormpointSelection></NormpointSelection>
                    </div>
                    <div class="flex align-items-center justify-content-center pl-1">
                        <Dropdown v-model="point.value" :options="selectionOptions" :value="option"/>
                    </div>
                    <div class="flex align-items-center justify-content-center pl-1">
                        <Button label="Entfernen" severity="danger" @click="removeNormPoint(normIndex, pointIndex)"/>
                    </div>
                </div>
                <!-- <select v-model="point.value">
                  <option v-for="option in selectionOptions" :key="option" :value="option">{{ option }}</option>
                </select> -->
                <!-- <button class="btn btn-secondary button-item" @click="removeNormPoint(normIndex, pointIndex)">Entfernen</button> -->
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
  
  
<script>
  // import { ipcRenderer } from 'electron';
  import NormpointSelection from "./NormpointSelection.vue";
  import NormSelection from "./NormSelection.vue";
  import Dropdown from "primevue/dropdown";
  import Button from "primevue/button";

  export default {
    data() {
      return {
        norms: JSON.parse(localStorage.getItem('norms')) || [],
        selectionOptions: ['+', '-', '~', '/']
      };
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
        
        window.electron.ipcRenderer.send('saveNewAudit', JSON.stringify(this.norms, null, 2));
      }
    }
  };
</script>

<style>
  .buttonmargin {
    margin-bottom: 5px; /* Optional: Add margin between buttons */
  }
</style>