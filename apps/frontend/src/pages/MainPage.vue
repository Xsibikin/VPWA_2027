<template>
  <q-page >
    <h1>This will be main page</h1>
    <Teleport to="#left-drawer">
      <LeftSidebar/>
    </Teleport>

    <Teleport to="#right-drawer">
      <RightSidebar/>
    </Teleport>
  </q-page>
</template>

<script setup lang="ts">
  import LeftSidebar from '@/components/LeftSidebar.vue';
  import RightSidebar from '@/components/RightSidebar.vue';
</script>
