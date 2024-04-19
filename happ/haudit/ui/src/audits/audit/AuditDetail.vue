<template>
  <div v-if="!loading">
    <div v-if="editing" style="display: flex; flex: 1;">
      <EditAudit
        :original-audit-hash="auditHash"
        :current-record="record!"
        @audit-updated="editing = false; fetchAudit();"
        @edit-canceled="editing = false"
      ></EditAudit>
    </div>
    <div v-else-if="record" style="display: flex; flex-direction: column">
      <div style="display: flex; flex-direction: row">
        <span style="flex: 1"></span>
      
        <mwc-icon-button style="margin-left: 8px" icon="edit" @click="editing = true"></mwc-icon-button>
        <mwc-icon-button style="margin-left: 8px" icon="delete" @click="deleteAudit()"></mwc-icon-button>
      </div>

      <div style="display: flex; flex-direction: row; margin-bottom: 16px;">
	<span style="margin-right: 4px"><strong>Title: </strong></span>
 	<span style="white-space: pre-line">{{  audit?.title }} </span>
      </div>

      <div style="display: flex; flex-direction: row; margin-bottom: 16px;">
	<span style="margin-right: 4px"><strong>Audit Details: </strong></span>
 	<span style="white-space: pre-line">{{  audit?.audit_details }} </span>
      </div>

    </div>
    
    <span v-else>The requested audit was not found.</span>
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
import { Audit } from './types';
import '@material/mwc-circular-progress';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';
import EditAudit from './EditAudit.vue';

export default defineComponent({
  components: {
    EditAudit
  },
  props: {
    auditHash: {
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
    audit() {
      if (!this.record) return undefined;
      return decode((this.record.entry as any).Present.entry) as Audit;
    }
  },
  async mounted() {
    if (this.auditHash === undefined) {
      throw new Error(`The auditHash input is required for the AuditDetail element`);
    }

    await this.fetchAudit();
  },
  methods: {
    async fetchAudit() {
      this.loading = true;
      this.record = undefined;

      this.record = await this.client.callZome({
        cap_secret: null,
        role_name: 'audits',
        zome_name: 'audit',
        fn_name: 'get_latest_audit',
        payload: this.auditHash,
      });

      this.loading = false;
    },
    async deleteAudit() {
      try {
        await this.client.callZome({
          cap_secret: null,
          role_name: 'audits',
          zome_name: 'audit',
          fn_name: 'delete_audit',
          payload: this.auditHash,
        });
        this.$emit('audit-deleted', this.auditHash);
      } catch (e: any) {
        const errorSnackbar = this.$refs['delete-error'] as Snackbar;
        errorSnackbar.labelText = `Error deleting the audit: ${e.data}`;
        errorSnackbar.show();
      }
    }
  },
  emits: ['audit-deleted'],
  setup() {
    const client = (inject('client') as ComputedRef<AppAgentClient>).value;
    return {
      client
    };
  },
})
</script>
