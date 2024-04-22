<template>
    <Button label="Normpunkte anzeigen" @click="showNormpointsData()" />
    <div v-if="showNormpoints">
        <div v-for="normpoint in normpoints">
            {{ normpoint.normpoint_content }}
        </div>
    </div>
</template>

<script lang="ts">
    import Button from "primevue/button";

    export default {
        setup() {

        },
        mounted() {
            
        },
        components: {
            Button
        },
        props: {
            auditHash: Uint8Array
        },
        data() {
            return {
                normpoints: [{audit_hash: new Uint8Array, normpoint_content: ""}],
                showNormpoints: false
            }
        },
        methods: {
            showNormpointsData() {
                this.showNormpoints = !this.showNormpoints;
                if (this.showNormpoints) {
                    window.electron.ipcRenderer.on('normpoints-for-audit-fetched-zome', (event, data) => {
                        console.log(event);
                        this.normpoints = data;

                        // Remove first dummy entry
                        this.normpoints.shift();

                        window.electron.ipcRenderer.removeAllListeners('normpoints-for-audit-fetched-zome');
                    });
                    window.electron.ipcRenderer.send('get-normpoints-for-audit-zome-call', JSON.stringify(this.auditHash));
                }
            }
        }
    }
</script>