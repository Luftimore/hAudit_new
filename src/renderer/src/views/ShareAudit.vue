<template>
    <DataTable v-model:selection="selectedNormpoints" :value="jsonData">
        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <Column field="normpunkt" header="Normpunkt" />
        <Column field="kapitel" header="Kapitel" />
        <Column field="inhalt" header="Inhalt" />
        <Column field="verdict" header="Bewertung" />
    </DataTable>

    <div class="pt-1">
        <Button label="Ausgewählte Normpunkte teilen..." @click="shareDialogVisible = true" />
    </div>

    
    <Dialog v-model:visible="shareDialogVisible" modal header="Normpunkte teilen" :style="{ width: '25rem' }">
        <span class="p-text-secondary block mb-5">Folgende Normpunkte veröffentlichen für...</span>
        <div v-for="normpoint in selectedNormpoints">
            <div v-if="normpoint.normpunkt !== ''">
                {{ normpoint.normpunkt }} - {{ normpoint.kapitel }}
            </div>
        </div>
        <div class="flex align-items-center gap-3 mb-3">
            <label class="font-semibold w-6rem">Benutzer</label>
            <Dropdown v-model="selectedRecipient" filter :options="recipients" optionLabel="name" placeholder="Empfänger auswählen" />
        </div>
        <div class="flex justify-content-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="shareDialogVisible = false"></Button>
            <Button type="button" label="Teilen" @click="shareDialogVisible = false"></Button>
        </div>
    </Dialog>

    <div class="pt-1">
        <Button label="Zurück zum Hauptmenü" @click="navigateToMainMenu()" />
    </div>
</template>

<script lang="ts">
    import Button from "primevue/button";
    import DataTable from "primevue/datatable";
    import Column from "primevue/column";
    import Dialog from "primevue/dialog";
    import Dropdown from "primevue/dropdown";

    export default {
        data() {
            return {
                jsonData: [{normpunkt: "", kapitel: "", inhalt: "", verdict: ""}],
                shareDialogVisible: false,
                selectedNormpoints: [{normpunkt: "", kapitel: "", inhalt: "", verdict: ""}],
                selectedRecipient: null,
                recipients: []
            };
        },
        mounted() {            
            window.electron.ipcRenderer.on('file-opened-for-sharing', (event, data) => {
                console.log(event);
                this.jsonData = JSON.parse(data);

                this.jsonData = this.jsonData.filter(entry => entry.verdict != null)
            });
            window.electron.ipcRenderer.send('loadAuditForSharing');
        },
        methods: {
            navigateToMainMenu() {
                this.$router.push('/');
            },
            shareNormpoints() {

            }
        }
    }
</script>