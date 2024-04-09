<template>
    <div class="flex flex-column">
        <div v-if="selectedNormpoint" class="flex align-items-center pr-1">
            {{ selectedNormpoint.normpunkt }}
        </div>
        <div class="flex align-items-center">
            <div class="flex flex-row">
                <div class="flex align-items-center">
                    <Dropdown v-model="selectedNormpoint" filter :options="normpoints" optionLabel="kapitel" placeholder="Normpunkt auswählen" />
                </div>
                <div class="flex align-items-center pl-1">
                    <Dropdown v-model="selectedVerdict" :options="selectionOptions"/>
                </div>
            </div>
        </div>
        <div class="flex align-items-center pt-1">
            <TextArea v-model="content" rows="10" cols="40"/>
        </div>
        <div class="flex align-items-center pt-1">
            <Button label="Entfernen" severity="danger" @click="removeEntry()"/>
        </div>
    </div>
</template>

<script lang="ts">
    import Dropdown from "primevue/dropdown";
    import TextArea from "primevue/textarea"

    export default {
        mounted() {
            this.normpoints = this.$store.getters.getAllIso9001Normpoints;
        },
        components: {
            Dropdown,
            TextArea
        },
        data() {
            return {
                selectedNormpoint: {
                    normpunkt: "",
                    kapitel: "",
                    inhalt: "",
                    verdict: null
                },
                selectedVerdict: null,
                content: "Norminhalt...",
                normpoints: [],
                selectionOptions: ['leer','+', '-', '~', '/']
            }
        },
        methods: {
            removeEntry() {
                if (this.selectedVerdict && this.selectedVerdict !== 'leer') {
                    this.$store.commit('clearIso9001NormpointVerdict', this.selectedNormpoint);
                    console.log(this.$store.getters.getIso9001NormpointById(this.selectedNormpoint.normpunkt))
                }
                this.$emit('removeEntry');
            }
        },
        watch: {
            selectedNormpoint: {
                handler(newValue) {
                    this.content = newValue.inhalt;
                }
            },
            selectedVerdict: {
                handler(newValue) {
                    if (newValue === 'leer' && this.selectedNormpoint) {
                        this.$store.commit('clearIso9001NormpointVerdict', this.selectedNormpoint);
                    } else if (this.selectedNormpoint) {
                        this.selectedNormpoint.verdict = newValue;
                        this.$store.commit('setIso9001NormpointVerdict', this.selectedNormpoint);
                    }
                }
            }
        }
    }
</script>