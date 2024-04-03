<template>
    <div v-for="item in jsonData">
        <ShareAuditEntry :normpunkt="item.normpunkt" :kapitel="item.kapitel" :inhalt="item.inhalt" :verdict="item.verdict"/>
    </div>

    <div class="pt-1">
        <Button label="Zurück zum Hauptmenü" @click="navigateToMainMenu()" />
    </div>
</template>

<script lang="ts">
    import Button from "primevue/button";
    import ShareAuditEntry from "../components/ShareAuditEntry.vue";

    export default {
        data() {
            return {
                jsonData: [{normpunkt: "", kapitel: "", inhalt: "", verdict: ""}]
            };
        },
        mounted() {
            window.electron.ipcRenderer.on('file-opened-for-sharing', (event, data) => {
                console.log(event);
                this.jsonData = JSON.parse(data);
            });
            window.electron.ipcRenderer.send('loadAuditForSharing');
        },
        methods: {
            navigateToMainMenu() {
                this.$router.push('/');
            }
        }
    }
</script>