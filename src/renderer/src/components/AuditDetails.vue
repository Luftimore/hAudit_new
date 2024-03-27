<template>
    <!-- <div v-for="entry in this.data">
        {{entry.normpunkt}} - {{entry.kapitel}} - {{entry.inhalt}}
    </div> -->
    <div>
        <DataTable :value="data">
            <Column field="normpunkt" header="Normpunkt" />
            <Column field="kapitel" header="Kapitel" />
            <Column field="inhalt" header="Inhalt" />
            <Column field="verdict" header="Bewertung" />
        </DataTable>
    </div>
</template>

<script lang="ts">
    import DataTable from 'primevue/datatable';
    import Column from 'primevue/column';

    export default {
        data() {
            return {
                
            };
        },
        props: {
            data: Object
        }
    }
</script>