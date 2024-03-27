<template>
    <CreateAudit></CreateAudit>
    <div class="pt-1">
        <Button label="Zurück zum Hauptmenü" @click="navigateToMainMenu()" />
    </div>
</template>

<script lang="ts">
    import CreateAudit from '../components/CreateAudit.vue'
    import Button from "primevue/button";

    export default {
        data() {
            return {
                
            };
        },
        methods: {
            navigateToMainMenu() {
                this.$store.commit('clearAllIso9001NormpointVerdicts');
                this.$router.push('/');
            }
        }
    }
</script>