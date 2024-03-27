<template>
    <AuditDetails :data="jsonData"></AuditDetails>
    <div class="pt-1">
        <Button label="Zurück zum Hauptmenü" @click="navigateToMainMenu()" />
    </div>
</template>

<script lang="ts">
    import CreateAudit from '../components/CreateAudit.vue'
    import Button from "primevue/button";
    import AuditDetails from "../components/AuditDetails.vue"

    export default {
        data() {
            return {
                jsonData: null
            };
        },
        mounted() {
            window.electron.ipcRenderer.on('file-opened', (event, data) => {
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