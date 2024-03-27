<template>
    <DataTable :value="jsonData">
        <Column field="normpunkt" header="Normpunkt" />
        <Column field="kapitel" header="Kapitel" />
        <Column field="inhalt" header="Inhalt" />
        <Column field="verdict" header="Bewertung" />
    </DataTable>
    
    <div class="pt-1">
        <Button label="Zurück zum Hauptmenü" @click="navigateToMainMenu()" />
    </div>
</template>

<script lang="ts">
    import Button from "primevue/button";
    import DataTable from "primevue/datatable";
    import Column from "primevue/column";

    export default {
        data() {
            return {
                jsonData: null
            };
        },
        mounted() {
            window.electron.ipcRenderer.on('file-opened', (event, data) => {
                console.log(event);
                this.jsonData = JSON.parse(data);
            });
            window.electron.ipcRenderer.send('loadAudit');
        },
        methods: {
            navigateToMainMenu() {
                this.$router.push('/');
            }
        }
    }
</script>