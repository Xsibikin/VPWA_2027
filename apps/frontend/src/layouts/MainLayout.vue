<template>
  <q-layout view="lhh lpR lfr">
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      side="left"
      bordered
    >
      <div id="left-drawer"></div>
    </q-drawer>

    <q-drawer
      v-model="rightDrawerOpen"
      show-if-above
      side="right"
      bordered
    >
      <div id="right-drawer"></div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);
</script>
