<template>

    <div class="pt-1">
        <Button label="Zurück zum Hauptmenü" @click="navigateToMainMenu()" />
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
            navigateToMainMenu() {
                this.$router.push('/');
            }
        }
    }
</script>