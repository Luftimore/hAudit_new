<template>
    <!-- {{normpoint}}: {{verdict}} -->
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
                    <Dropdown v-model="selectedVerdict" :options="selectionOptions" :value="option"/>
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
    import iso9001data from "../data/iso9001.ts"

    export default {
        mounted() {
            // this.normpoints = iso9001data;
            // console.log(this.normpoints);
            this.normpoints = this.$store.getters.getAllIso9001Normpoints;
        },
        components: {
            Dropdown,
            TextArea
        },
        data() {
            return {
                selectedNormpoint: null,
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
                    if (newValue === 'leer') {
                        this.$store.commit('clearIso9001NormpointVerdict', this.selectedNormpoint);
                    } else {
                        this.selectedNormpoint.verdict = newValue;
                        this.$store.commit('setIso9001NormpointVerdict', this.selectedNormpoint);
                    }

                    console.log(this.$store.getters.getIso9001NormpointById(this.selectedNormpoint.normpunkt))
                }
            }
        }
    }
</script>