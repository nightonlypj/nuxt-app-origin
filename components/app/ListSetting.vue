<template>
  <v-dialog max-width="480px" :attach="$config.public.env.test">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        id="list_setting_btn"
        color="secondary"
        @click="initialize()"
      >
        <v-icon>mdi-cog</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ $t('設定変更') }}</v-tooltip>
      </v-btn>
    </template>
    <template #default="{ isActive }">
      <v-card id="list_setting_dialog">
        <v-form autocomplete="off">
          <v-toolbar color="primary" density="compact">
            <v-icon size="small" class="ml-4">mdi-cog</v-icon>
            <span class="ml-1">{{ $t('設定変更') }}</span>
          </v-toolbar>
          <v-card-text>
            <v-container class="py-0">
              <h4>
                {{ $t('表示項目') }}
                <v-btn
                  id="list_setting_show_items_set_all_btn"
                  color="secondary"
                  size="small"
                  class="ml-4"
                  :disabled="showItems.length >= items.length"
                  @click="setAllShowItems()"
                >
                  {{ $t('全選択') }}
                </v-btn>
                <v-btn
                  id="list_setting_show_items_clear_btn"
                  color="secondary"
                  size="small"
                  class="ml-1"
                  :disabled="showItems.length <= requiredShowItems.length"
                  @click="clearShowItems()"
                >
                  {{ $t('全解除') }}
                </v-btn>
              </h4>
              <template v-for="item in items" :key="item.key">
                <v-switch
                  :id="`list_setting_show_item_${item.key.replace('.', '_')}`"
                  v-model="showItems"
                  color="primary"
                  :label="item.title"
                  :value="item.key"
                  density="compact"
                  hide-details
                  :disabled="item.required"
                  @update:model-value="waiting = false"
                />
              </template>
            </v-container>
          </v-card-text>
          <v-card-actions class="justify-end mb-2 mr-2">
            <v-btn
              id="list_setting_submit_btn"
              color="primary"
              variant="elevated"
              :disabled="waiting"
              @click="change(isActive)"
            >
              {{ $t('変更') }}
            </v-btn>
            <v-btn
              id="list_setting_cancel_btn"
              color="secondary"
              variant="elevated"
              @click="isActive.value = false"
            >
              {{ $t('キャンセル') }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
const $props = defineProps({
  admin: {
    type: Boolean,
    default: null
  },
  model: {
    type: String,
    required: true
  },
  headers: {
    type: Array,
    required: true
  },
  hiddenItems: {
    type: Array,
    required: true
  }
})
const $emit = defineEmits(['update:hiddenItems'])
const $config = useRuntimeConfig()

const waiting = ref(false)
const showItems = ref<any>(null)

const items: any = computed(() => {
  return $props.headers.filter((item: any) => item.title != null && (!item.adminOnly || $props.admin))
})
const requiredShowItems = computed(() => {
  return items.value.filter((item: any) => item.required).map((item: any) => item.key)
})

function initialize () {
  waiting.value = true
  showItems.value = items.value.filter((item: any) => item.required || !$props.hiddenItems.includes(item.key)).map((item: any) => item.key)
}

function setAllShowItems () {
  showItems.value = items.value.map((item: any) => item.key)
  waiting.value = false
}
function clearShowItems () {
  showItems.value = requiredShowItems.value
  waiting.value = false
}

function change (isActive: any) {
  const hiddenItems = items.value.filter((item: any) => !showItems.value.includes(item.key)).map((item: any) => item.key)
  localStorage.setItem(`${$props.model}.hidden-items`, hiddenItems.toString())
  $emit('update:hiddenItems', hiddenItems)
  isActive.value = false
}
</script>
