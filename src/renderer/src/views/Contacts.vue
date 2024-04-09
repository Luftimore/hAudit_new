<template>
    Fremder Public Key:
    <Textarea v-model="newPubKey" rows="5" cols="30" />
    <Button label="Speichern" @click="saveNewPublicKey()" />

    Mein Public Key:
    <Textarea v-model="myPubKey" rows="5" cols="30" />

    <div class="pt-1">
        <Button label="Zurück zum Hauptmenü" @click="navigateToMainMenu()" />
    </div>
</template>

<script lang="ts">
    import Button from "primevue/button";
    import Textarea from "primevue/textarea";

    export default {
        data() {
            return {
                newPubKey: "",
                myPubKey: ""
            };
        },
        mounted() {
            window.electron.ipcRenderer.on("pgp-key-for-sharing-fetched", (event, data) => {
                console.log(event);

                this.myPubKey = data;
            })
            window.electron.ipcRenderer.send("fetch-pgp-key-for-sharing");
        },
        methods: {
            saveNewPublicKey() {
                this.$store.commit("addPublicKeyContact", {name: "PoC Key", pubKey: this.newPubKey});
                this.newPubKey = "Gespeichert"
            },
            navigateToMainMenu() {
                this.$router.push('/');
            }
        }
    }
</script>