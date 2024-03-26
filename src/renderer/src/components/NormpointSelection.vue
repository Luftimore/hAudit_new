<template>
    <!-- {{normpoint}}: {{verdict}} -->
    <Dropdown v-model="selectedNormpoint" filter :options="normpoints" optionLabel="question" placeholder="Normpunkt auswählen" />
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
                selectedNormpoint: null,
                normpoints: [
                    { question: "Question 1" },
                    { question: "Question 2" }
                ]
            }
        }
    }
</script>