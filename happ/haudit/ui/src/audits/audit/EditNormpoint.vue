<template>
  <mwc-snackbar ref="update-error"></mwc-snackbar>

  <div style="display: flex; flex-direction: column">
    <span style="font-size: 18px">Edit Normpoint</span>
      <div style="margin-bottom: 16px">
      <mwc-textarea outlined label="Normpoint Content" :value="normpointContent" @input="normpointContent = $event.target.value" required></mwc-textarea>
      </div>



    <div style="display: flex; flex-direction: row">
      <mwc-button
        outlined
        label="Cancel"
        @click="$emit('edit-canceled')"
        style="flex: 1; margin-right: 16px;"
      ></mwc-button>
      <mwc-button 
        raised
        label="Save"
        :disabled="!isNormpointValid"
        @click="updateNormpoint"
        style="flex: 1;"
      ></mwc-button>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, inject, ComputedRef } from 'vue';
import { AppAgentClient, Record, AgentPubKey, EntryHash, ActionHash, DnaHash } from '@holochain/client';
import { Normpoint } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import { decode } from '@msgpack/msgpack';
import { Snackbar } from '@material/mwc-snackbar';

import '@material/mwc-textarea';
export default defineComponent({
  data(): {
    normpointContent: string;
  } {
    const currentNormpoint = decode((this.currentRecord.entry as any).Present.entry) as Normpoint;
    return { 
      normpointContent: currentNormpoint.normpointContent,
    }
  },
  props: {
    originalNormpointHash: {
      type: null,
      required: true,
    },
    currentRecord: {
      type: Object,
      required: true
    }
  },
  computed: {
    currentNormpoint() {
      return decode((this.currentRecord.entry as any).Present.entry) as Normpoint;
    },
    isNormpointValid() {
      return true && this.normpointContent !== '';
    },
  },
  mounted() {
    if (this.currentRecord === undefined) {
      throw new Error(`The currentRecord input is required for the EditNormpoint element`);
    }
    if (this.originalNormpointHash === undefined) {
      throw new Error(`The originalNormpointHash input is required for the EditNormpoint element`);
    }
  },
  methods: {
    async updateNormpoint() {

      const normpoint: Normpoint = { 
        normpoint_content: this.normpointContent,
        audit_hash: this.currentNormpoint.audit_hash,
      };

      try {
        const updateRecord: Record = await this.client.callZome({
          cap_secret: null,
          role_name: 'audits',
          zome_name: 'audit',
          fn_name: 'update_normpoint',
          payload: {
            original_normpoint_hash: this.originalNormpointHash,
            previous_normpoint_hash: this.currentRecord.signed_action.hashed.hash,
            updated_normpoint: normpoint
          }
        });
        this.$emit('normpoint-updated', updateRecord.signed_action.hashed.hash);
      } catch (e: any) {
        const errorSnackbar = this.$refs['update-error'] as Snackbar;
        errorSnackbar.labelText = `Error updating the normpoint: ${e.data}`;
        errorSnackbar.show();
      }
    },
  },
  emits: ['normpoint-updated', 'edit-canceled'],
  setup() {
    const client = (inject('client') as ComputedRef<AppAgentClient>).value;
    return {
      client,
    };
  },
})
</script>
