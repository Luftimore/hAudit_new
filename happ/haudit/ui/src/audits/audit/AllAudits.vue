<template>
  <div v-if="loading" style="display: flex; flex: 1; align-items: center; justify-content: center">
    <mwc-circular-progress indeterminate></mwc-circular-progress>
  </div>

  <div v-else style="display: flex; flex-direction: column">
    <span v-if="error">Error fetching the audits: {{error.data}}.</span>
    <div v-else-if="hashes && hashes.length > 0" style="margin-bottom: 8px">
      <AuditDetail 
        v-for="hash in hashes" 
        :audit-hash="hash"
        @audit-deleted="fetchAudit()"
      >
      </AuditDetail>
    </div>
    <span v-else>No audits found.</span>
  </div>

</template>

<script lang="ts">
import { defineComponent, inject, toRaw, ComputedRef } from 'vue';
import { decode } from '@msgpack/msgpack';
import { AppAgentClient, NewEntryAction, Link, Record, AgentPubKey, EntryHash, ActionHash } from '@holochain/client';
import '@material/mwc-circular-progress';
import AuditDetail from './AuditDetail.vue';
import { AuditSignal } from './types';

export default defineComponent({
  components: {
    AuditDetail
  },
  data(): { hashes: Array<ActionHash> | undefined; loading: boolean; error: any } {
    return {
      hashes: undefined,
      loading: true,
      error: undefined
    }
  },
  async mounted() {
    await this.fetchAudit();
    toRaw(this.client).on('signal', signal => {
      if (signal.zome_name !== 'audit') return; 
      const payload = signal.payload as AuditSignal;
      if (payload.type !== 'EntryCreated') return;
      if (payload.app_entry.type !== 'Audit') return;
      if (this.hashes) this.hashes.push(payload.action.hashed.hash);
    });
  },
  methods: {
    async fetchAudit() {
      try {
        const links: Array<Link> = await this.client.callZome({
          cap_secret: null,
          role_name: 'audits',
          zome_name: 'audit',
          fn_name: 'get_all_audits',
          payload: null,
        });
        this.hashes = links.map(l => l.target);
      } catch (e) {
        this.error = e;
      }
      this.loading = false;
    }
  },
  setup() {
    const client = (inject('client') as ComputedRef<AppAgentClient>).value;
    return {
      client,
    };
  },
})
</script>
