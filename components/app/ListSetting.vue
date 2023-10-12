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
        <v-tooltip activator="parent" location="bottom">設定変更</v-tooltip>
      </v-btn>
    </template>
    <template #default="{ isActive }">
      <v-card id="list_setting_dialog">
        <v-form autocomplete="off">
          <v-toolbar color="primary" density="compact">
            <v-icon size="small" class="ml-4">mdi-cog</v-icon>
            <span class="ml-1">設定変更</span>
          </v-toolbar>
          <v-card-text>
            <v-container class="py-0">
              <h4>
                表示項目
                <v-btn
                  color="secondary"
                  size="small"
                  class="ml-4"
                  :disabled="showItems.length >= items.length"
                  @click="setAllShowItems()"
                >
                  全選択
                </v-btn>
                <v-btn
                  color="secondary"
                  size="small"
                  class="ml-1"
                  :disabled="showItems.length <= requiredShowItems.length"
                  @click="clearShowItems()"
                >
                  全解除
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
              変更
            </v-btn>
            <v-btn
              id="list_setting_cancel_btn"
              color="secondary"
              variant="elevated"
              @click="isActive.value = false"
            >
              キャンセル
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  mixins: [Application],

  props: {
    admin: {
      type: Boolean,
      default: null
    },
    model: {
      type: String,
      required: true
    },
    hiddenItems: {
      type: Array,
      required: true
    }
  },
  emits: ['update:hiddenItems'],

  data () {
    return {
      waiting: null,
      showItems: null
    }
  },

  computed: {
    items () {
      return this.$tm(`items.${this.model}`).filter(item => !item.adminOnly || this.admin)
    },
    requiredShowItems () {
      return this.items.filter(item => item.required).map(item => item.key)
    }
  },

  methods: {
    initialize () {
      this.waiting = true
      this.showItems = this.items.filter(item => item.required || !this.hiddenItems.includes(item.key)).map(item => item.key)
    },

    setAllShowItems () {
      this.showItems = this.items.map(item => item.key)
      this.waiting = false
    },
    clearShowItems () {
      this.showItems = this.requiredShowItems
      this.waiting = false
    },

    change (isActive) {
      const hiddenItems = this.items.filter(item => !this.showItems.includes(item.key)).map(item => item.key)
      localStorage.setItem(`${this.model}.hidden-items`, hiddenItems.toString())
      this.$emit('update:hiddenItems', hiddenItems)
      isActive.value = false
    }
  }
})
</script>
