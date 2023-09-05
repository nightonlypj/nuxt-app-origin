<template>
  <v-layout-item
    v-scroll="onScroll"
    class="text-end pointer-events-none"
    model-value
    position="bottom"
    size="44"
  >
    <div class="ma-4">
      <v-fab-transition>
        <v-btn
          v-show="model"
          class="mt-auto pointer-events-initial"
          color="primary"
          elevation="8"
          icon="mdi-chevron-up"
          size="default"
          @click="onClick"
        />
      </v-fab-transition>
    </div>
  </v-layout-item>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const model = ref(false)

function onScroll () {
  model.value = window.scrollY > 200
}

function onClick () {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
</script>

<style scoped>
.pointer-events-none {
  pointer-events: none;
  z-index: 9999 !important; /* v-footer等より大きく、v-snackbar(10000)より小さい値 */
}

.pointer-events-initial {
  pointer-events: initial;
}
</style>
