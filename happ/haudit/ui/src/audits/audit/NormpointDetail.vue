<template>
  <div v-if="!loading">
    <div v-if="editing" style="display: flex; flex: 1;">
      <EditNormpoint
        :original-normpoint-hash="normpointHash"
        :current-record="record!"
        @normpoint-updated="editing = false; fetchNormpoint();"
        @edit-canceled="editing = false"
      ></EditNormpoint>
    </div>
    <div v-else-if="record" style="display: flex; flex-direction: column">
      <div style="display: flex; flex-direction: row">
        <span style="flex: 1"></span>
      
        <mwc-icon-button style="margin-left: 8px" icon="edit" @click="editing = true"></mwc-icon-button>
        <mwc-icon-button style="margin-left: 8px" icon="delete" @click="deleteNormpoint()"></mwc-icon-button>
      </div>

      <div style="display: flex; flex-direction: row; margin-bottom: 16px;">
	<span style="margin-right: 4px"><strong>Normpoint Content: </strong></span>
 	<span style="white-space: pre-line">{{  normpoint?.normpoint_content }} </span>
      </div>

    </div>
    
    <span v-else>The requested normpoint was not found.</span>
  </div>

  <div v-else style="display: flex; flex: 1; align-items: center; justify-content: center">
    <mwc-circular-progress indeterminate></mwc-circular-progress>
  </div>

  <mwc-snackbar ref="delete-error" leading>
  </mwc-snackbar>
</template>

<script lang="ts">
import { defineComponent, inject, ComputedRef } from 'vue';
import { decode } from '@msgpack/msgpack';
import { AppAgentClient, Record, AgentPubKey, EntryHash, ActionHash, DnaHash } from '@holochain/client';
import { Normpoint } from './types';
import '@material/mwc-circular-progress';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';
import EditNormpoint from './EditNormpoint.vue';

export default defineComponent({
  components: {
    EditNormpoint
  },
  props: {
    normpointHash: {
      type: Object,
      required: true
    }
  },
  data(): { record: Record | undefined; loading: boolean; editing: boolean; } {
    return {
      record: undefined,
      loading: true,
      editing: false,
    }
  },
  computed: {
    normpoint() {
      if (!this.record) return undefined;
      return decode((this.record.entry as any).Present.entry) as Normpoint;
    }
  },
  async mounted() {
    if (this.normpointHash === undefined) {
      throw new Error(`The normpointHash input is required for the NormpointDetail element`);
    }

    await this.fetchNormpoint();
  },
  methods: {
    async fetchNormpoint() {
      this.loading = true;
      this.record = undefined;

      this.record = await this.client.callZome({
        cap_secret: null,
        role_name: 'audits',
        zome_name: 'audit',
        fn_name: 'get_latest_normpoint',
        payload: this.normpointHash,
      });

      this.loading = false;
    },
    async deleteNormpoint() {
      try {
        await this.client.callZome({
          cap_secret: null,
          role_name: 'audits',
          zome_name: 'audit',
          fn_name: 'delete_normpoint',
          payload: this.normpointHash,
        });
        this.$emit('normpoint-deleted', this.normpointHash);
      } catch (e: any) {
        const errorSnackbar = this.$refs['delete-error'] as Snackbar;
        errorSnackbar.labelText = `Error deleting the normpoint: ${e.data}`;
        errorSnackbar.show();
      }
    }
  },
  emits: ['normpoint-deleted'],
  setup() {
    const client = (inject('client') as ComputedRef<AppAgentClient>).value;
    return {
      client
    };
  },
})
</script>
