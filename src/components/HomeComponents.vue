<script setup>
import TransitHelper from "../helpers/TransitHelper.js";

import { onMounted } from 'vue'
import { reactive } from 'vue'

const state = reactive({ rawText: 5 });

onMounted(async () => {
      state.rawText = await TransitHelper.testing();
})

</script>
<template>
    <pre>{{ state.rawText }}</pre>
</template>