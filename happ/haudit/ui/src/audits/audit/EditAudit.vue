<template>
  <mwc-snackbar ref="update-error"></mwc-snackbar>

  <div style="display: flex; flex-direction: column">
    <span style="font-size: 18px">Edit Audit</span>
      <div style="margin-bottom: 16px">
      <mwc-textfield outlined label="Title" :value="title" @input="title = $event.target.value" required></mwc-textfield>
      </div>

      <div style="margin-bottom: 16px">
      <mwc-textarea outlined label="Audit Details" :value="auditDetails" @input="auditDetails = $event.target.value" required></mwc-textarea>
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
        :disabled="!isAuditValid"
        @click="updateAudit"
        style="flex: 1;"
      ></mwc-button>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, inject, ComputedRef } from 'vue';
import { AppAgentClient, Record, AgentPubKey, EntryHash, ActionHash, DnaHash } from '@holochain/client';
import { Audit } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import { decode } from '@msgpack/msgpack';
import { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-textarea';

import '@material/mwc-textfield';
export default defineComponent({
  data(): {
    title: string;
    auditDetails: string;
  } {
    const currentAudit = decode((this.currentRecord.entry as any).Present.entry) as Audit;
    return { 
      title: currentAudit.title,
      auditDetails: currentAudit.auditDetails,
    }
  },
  props: {
    originalAuditHash: {
      type: null,
      required: true,
    },
    currentRecord: {
      type: Object,
      required: true
    }
  },
  computed: {
    currentAudit() {
      return decode((this.currentRecord.entry as any).Present.entry) as Audit;
    },
    isAuditValid() {
      return true && this.title !== '' && this.auditDetails !== '';
    },
  },
  mounted() {
    if (this.currentRecord === undefined) {
      throw new Error(`The currentRecord input is required for the EditAudit element`);
    }
    if (this.originalAuditHash === undefined) {
      throw new Error(`The originalAuditHash input is required for the EditAudit element`);
    }
  },
  methods: {
    async updateAudit() {

      const audit: Audit = { 
        title: this.title,
        audit_details: this.auditDetails,
      };

      try {
        const updateRecord: Record = await this.client.callZome({
          cap_secret: null,
          role_name: 'audits',
          zome_name: 'audit',
          fn_name: 'update_audit',
          payload: {
            original_audit_hash: this.originalAuditHash,
            previous_audit_hash: this.currentRecord.signed_action.hashed.hash,
            updated_audit: audit
          }
        });
        this.$emit('audit-updated', updateRecord.signed_action.hashed.hash);
      } catch (e: any) {
        const errorSnackbar = this.$refs['update-error'] as Snackbar;
        errorSnackbar.labelText = `Error updating the audit: ${e.data}`;
        errorSnackbar.show();
      }
    },
  },
  emits: ['audit-updated', 'edit-canceled'],
  setup() {
    const client = (inject('client') as ComputedRef<AppAgentClient>).value;
    return {
      client,
    };
  },
})
</script>
