<template>

    <div v-for="entry in auditReportsData">
        {{ entry.title }} - {{ entry.audit_details }} <NormpointDetails :auditHash="entry.hash"></NormpointDetails>
    </div>

    <div class="pt-1">
        <Button label="Zurück zum Hauptmenü" @click="navigateToMainMenu()" />
    </div>
</template>

<script lang="ts">
    import Button from "primevue/button";
    import NormpointDetails from "../components/NormpointDetails.vue";


    export default {
        data() {
            return {
                auditReportsData: [{hash: new Uint8Array, title: "", audit_details: ""}]
            };
        },
        mounted() {
            window.electron.ipcRenderer.on("audit-reports-fetched-zome", (event, data) => {
                console.log(event);
                console.log("Dataview: " + data)
                this.auditReportsData = data;
            });

            window.electron.ipcRenderer.send('get-all-audit-reports-zome-call');
        },
        methods: {
            navigateToMainMenu() {
                this.$router.push('/');
            }
        }
    }
</script>