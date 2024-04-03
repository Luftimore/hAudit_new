<template>
    {{ normpunkt }} {{ kapitel }} {{ inhalt }} {{ verdict }}
</template>

<script lang="ts">

    export default {
        setup() {

        },
        data() {
            return {
                
            }
        },
        props: {
            normpunkt: String,
            kapitel: String,
            inhalt: String,
            verdict: String
        }
    }
</script>