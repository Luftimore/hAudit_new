<template>
    <DataTable :value="jsonData">
        <Column field="normpunkt" header="Normpunkt" />
        <Column field="kapitel" header="Kapitel" />
        <Column field="inhalt" header="Inhalt" />
        <Column field="verdict" header="Bewertung" />
    </DataTable>
</template>

<script lang="ts">
    export default {
        setup() {

        },
        data() {
            return {
                normpoints: []
            }
        }
    }
</script>