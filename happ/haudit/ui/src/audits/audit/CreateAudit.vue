<template>
  <mwc-snackbar ref="create-error"></mwc-snackbar>

  <div style="display: flex; flex-direction: column">
    <span style="font-size: 18px">Create Audit</span>
  
    <div style="margin-bottom: 16px">
      <mwc-textfield outlined label="Title" :value="title" @input="title = $event.target.value" required></mwc-textfield>
    </div>

    <div style="margin-bottom: 16px">
      <mwc-textarea outlined label="Audit Details" :value="auditDetails" @input="auditDetails = $event.target.value" required></mwc-textarea>
    </div>

  
    <mwc-button 
      raised
      label="Create Audit"
      :disabled="!isAuditValid"
      @click="createAudit"
    ></mwc-button>
  </div>
</template>
<script lang="ts">
import { defineComponent, inject, ComputedRef } from 'vue';
import { AppAgentClient, Record, AgentPubKey, EntryHash, ActionHash, DnaHash } from '@holochain/client';
import { Audit } from './types';
import '@material/mwc-button';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';

import '@material/mwc-textfield';
import '@material/mwc-textarea';
export default defineComponent({
  data(): {
    title: string;
    auditDetails: string;
  } {
    return { 
      title: '',
      auditDetails: '',
    }
  },
  computed: {
    isAuditValid() {
    return true && this.title !== '' && this.auditDetails !== '';
    },
  },
  mounted() {
  },
  methods: {
    async createAudit() {
      const audit: Audit = { 
        title: this.title!,

        audit_details: this.auditDetails!,
      };

      try {
        const record: Record = await this.client.callZome({
          cap_secret: null,
          role_name: 'audits',
          zome_name: 'audit',
          fn_name: 'create_audit',
          payload: audit,
        });
        this.$emit('audit-created', record.signed_action.hashed.hash);
      } catch (e: any) {
        const errorSnackbar = this.$refs['create-error'] as Snackbar;
        errorSnackbar.labelText = `Error creating the audit: ${e.data}`;
        errorSnackbar.show();
      }
    },
  },
  emits: ['audit-created'],
  setup() {
    const client = (inject('client') as ComputedRef<AppAgentClient>).value;
    return {
      client,
    };
  },
})
</script>
