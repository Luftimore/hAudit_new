<template>
    <Dropdown v-model="selectedNorm" filter :options="norms" optionLabel="norm" placeholder="Norm auswählen" />
</template>

<script lang="ts">
    import Dropdown from "primevue/dropdown";

    export default {
        setup() {

        },
        components: {
            Dropdown
        },
        data() {
            return {
                selectedNorm: null,
                norms: [
                    { norm: "Norm 1" },
                    { norm: "Norm 2" }
                ]
            }
        }
    }
</script>