<template>
  <div
    id="back_to_top_item"
    v-scroll="updateShow"
    class="text-end pointer-events-none"
    @scroll="updateShow()"
  >
    <!-- NOTE: @scrollはtestの為 -->
    <v-fab-transition class="ma-4">
      <v-btn
        v-show="show"
        id="back_to_top_btn"
        class="mt-auto pointer-events-initial"
        color="primary"
        elevation="8"
        icon="mdi-chevron-up"
        size="default"
        @click="backToTop()"
      />
    </v-fab-transition>
  </div>
</template>

<script setup lang="ts">
const show = ref(false)

function updateShow () {
  show.value = window.scrollY > 200
}

function backToTop () {
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
