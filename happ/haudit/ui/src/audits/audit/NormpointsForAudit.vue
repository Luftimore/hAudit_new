
<template>
  <div v-if="loading" style="display: flex; flex: 1; align-items: center; justify-content: center">
    <mwc-circular-progress indeterminate></mwc-circular-progress>
  </div>
  
  <div v-else style="display: flex; flex-direction: column">
    <span v-if="error">Error fetching the normpoints: {{error}}.</span>
    <div v-else-if="links && links.length > 0" style="margin-bottom: 8px">
      <NormpointDetail 
        v-for="link in links" 
        :normpoint-hash="link.target" 
      >
      </NormpointDetail>
    </div>
    <span v-else>No normpoints found for this audit.</span>
  </div>

</template>

<script lang="ts">
import { defineComponent, inject, ComputedRef } from 'vue';
import { decode } from '@msgpack/msgpack';
import { AppAgentClient, Record, Link, AgentPubKey } from '@holochain/client';
import '@material/mwc-circular-progress';
import NormpointDetail from './NormpointDetail.vue';

export default defineComponent({
  components: {
    NormpointDetail
  },
  props: {
    auditHash: {
      type: Object,
      required: true
    }
  },
  data(): { links: Array<Link> | undefined; loading: boolean; error: any } {
    return {
      links: undefined,
      loading: true,
      error: undefined
    }
  },
  async mounted() {
    if (this.auditHash === undefined) {
      throw new Error(`The auditHashHash input is required for the NormpointsForAudit element`);
    }

    try {
      this.links = await this.client.callZome({
        cap_secret: null,
        role_name: 'audits',
        zome_name: 'audit',
        fn_name: 'get_normpoints_for_audit',
        payload: this.auditHash,
      });
    } catch (e) {
      this.error = e;
    }
    this.loading = false;
  },
  setup() {
    const client = (inject('client') as ComputedRef<AppAgentClient>).value;
    return {
      client,
    };
  },
})
</script>
