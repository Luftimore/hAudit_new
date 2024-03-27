<template>
    <div class="flex flex-column">
        <div class="pb-1">
            <Button label="Neues Audit" @click="openView('new-audit')"/>
        </div>
        <div class="pb-1">
            <Button label="Audit öffnen" @click="openView('load-audit')"/>
        </div>
        <div class="pb-1">
            <Button label="Bericht teilen" @click="openView('share-audit')"/>
        </div>
        <div class="pb-1">
            <Button label="Geteilte Berichte" @click="openView('shared-audits')"/>
        </div>
        <div class="pb-1">
            <Button label="Kontakte" @click="openView('contacts')"/>
        </div>
    </div>
</template>
  
<script lang="ts">
    import Button from "primevue/button";

    export default {
        data() {
            return {
                
            };
        },
        methods: {
            openView(destination) {
                switch (destination) {
                    case "new-audit":
                        this.$router.push("/new_audit")
                        break;
                    case "load-audit":
                        this.$router.push("/load_audit")
                        break;
                    case "share-audit":
                        this.$router.push("/share_audit")
                        break;
                    case "shared-audits":
                        this.$router.push("/shared_audits")
                        break;
                    case "contacts":
                        this.$router.push("/contacts")
                        break;
                    default:
                        break;
                }
            }
        }
    }
</script>
  
<style scoped>

</style>