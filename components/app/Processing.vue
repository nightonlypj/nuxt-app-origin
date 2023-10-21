<template>
  <v-overlay
    model-value
    contained
    persistent
    scrim="secondary"
    class="align-center justify-center"
  >
    <v-progress-circular
      indeterminate
      color="primary"
      :size="50"
    />
  </v-overlay>
</template>
