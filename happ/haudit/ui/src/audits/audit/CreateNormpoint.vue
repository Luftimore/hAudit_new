<template>
  <mwc-snackbar ref="create-error"></mwc-snackbar>

  <div style="display: flex; flex-direction: column">
    <span style="font-size: 18px">Create Normpoint</span>
  
    <div style="margin-bottom: 16px">
      <mwc-textarea outlined label="Normpoint Content" :value="normpointContent" @input="normpointContent = $event.target.value" required></mwc-textarea>
    </div>

  
    <mwc-button 
      raised
      label="Create Normpoint"
      :disabled="!isNormpointValid"
      @click="createNormpoint"
    ></mwc-button>
  </div>
</template>
<script lang="ts">
import { defineComponent, inject, ComputedRef } from 'vue';
import { AppAgentClient, Record, AgentPubKey, EntryHash, ActionHash, DnaHash } from '@holochain/client';
import { Normpoint } from './types';
import '@material/mwc-button';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';

import '@material/mwc-textarea';
export default defineComponent({
  data(): {
    normpointContent: string;
  } {
    return { 
      normpointContent: '',
    }
  },
  props: {
    auditHash: {
      type: null,
      required: true
    },
  },
  computed: {
    isNormpointValid() {
    return true && this.normpointContent !== '';
    },
  },
  mounted() {
    if (this.auditHash === undefined) {
      throw new Error(`The auditHash input is required for the CreateNormpoint element`);
    }
  },
  methods: {
    async createNormpoint() {
      const normpoint: Normpoint = { 
        normpoint_content: this.normpointContent!,

        audit_hash: this.auditHash!,
      };

      try {
        const record: Record = await this.client.callZome({
          cap_secret: null,
          role_name: 'audits',
          zome_name: 'audit',
          fn_name: 'create_normpoint',
          payload: normpoint,
        });
        this.$emit('normpoint-created', record.signed_action.hashed.hash);
      } catch (e: any) {
        const errorSnackbar = this.$refs['create-error'] as Snackbar;
        errorSnackbar.labelText = `Error creating the normpoint: ${e.data}`;
        errorSnackbar.show();
      }
    },
  },
  emits: ['normpoint-created'],
  setup() {
    const client = (inject('client') as ComputedRef<AppAgentClient>).value;
    return {
      client,
    };
  },
})
</script>
