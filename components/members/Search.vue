<template>
  <v-form autocomplete="on" @submit.prevent>
    <div
      id="member_search_area"
      @keydown.enter="appSetKeyDownEnter"
      @keyup.enter="search(true)"
    >
      <v-row>
        <v-col class="d-flex">
          <v-text-field
            id="member_search_text"
            v-model="syncQuery.text"
            label="検索"
            :placeholder="`ユーザー名${admin ? 'やメールアドレス' : ''}を入力`"
            autocomplete="on"
            style="max-width: 400px"
            density="compact"
            hide-details
            maxlength="255"
            clearable
            @update:model-value="waiting = false"
          />
          <v-btn
            id="member_search_btn"
            color="primary"
            class="ml-1 mt-1"
            :disabled="processing || waiting || blank()"
            @click="search(false)"
          >
            <v-icon size="large">mdi-magnify</v-icon>
          </v-btn>
          <v-btn
            id="member_search_option_btn"
            color="secondary"
            class="ml-2 mt-1"
            rounded
            @click="syncQuery.option = !syncQuery.option"
          >
            <v-icon size="x-large">{{ syncQuery.option ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
            <span class="hidden-sm-and-down">検索オプション</span>
          </v-btn>
        </v-col>
      </v-row>
      <v-row v-show="syncQuery.option" id="member_search_option_item">
        <v-col cols="auto" class="d-flex py-0">
          <v-chip size="small" class="mt-1">権限</v-chip>
          <template v-for="(value, key, index) in powers" :key="key">
            <v-checkbox
              :id="`member_search_power_${key}_check`"
              v-model="syncQuery.power[key]"
              color="primary"
              :label="value"
              :class="index + 1 < Object.keys(powers).length ? 'mr-2' : null"
              density="compact"
              hide-details
              :error="powerBlank()"
              @update:model-value="waiting = false"
            />
          </template>
        </v-col>
        <v-col cols="auto" class="d-flex py-0">
          <v-chip size="small" class="mt-1">状態</v-chip>
          <v-checkbox
            id="member_search_active_check"
            v-model="syncQuery.active"
            color="primary"
            label="有効"
            class="mr-2"
            density="compact"
            hide-details
            :error="activeBlank()"
            @update:model-value="waiting = false"
          />
          <v-checkbox
            id="member_search_destroy_check"
            v-model="syncQuery.destroy"
            color="primary"
            label="削除予定"
            density="compact"
            hide-details
            :error="activeBlank()"
            @update:model-value="waiting = false"
          />
        </v-col>
      </v-row>
    </div>
  </v-form>
</template>

<script>
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  mixins: [Application],

  props: {
    processing: {
      type: Boolean,
      default: null
    },
    query: {
      type: Object,
      required: true
    },
    admin: {
      type: Boolean,
      default: null
    }
  },
  emits: ['update:query', 'search'],

  data () {
    return {
      waiting: true,
      keyDownEnter: false
    }
  },

  computed: {
    powers () {
      return this.$tm('enums.member.power')
    },

    syncQuery: {
      get () {
        return this.query
      },
      set (value) {
        this.$emit('update:query', value)
      }
    }
  },

  methods: {
    blank () {
      return this.powerBlank() || this.activeBlank()
    },
    powerBlank () {
      for (const key in this.query.power) {
        if (this.query.power[key]) { return false }
      }
      return true
    },
    activeBlank () {
      return !this.query.active && !this.query.destroy
    },

    search (keydown) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (this.processing || this.waiting || this.blank() || (keydown && !enter)) { return }

      this.waiting = true
      this.$emit('search')
    },

    error () {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('error') }

      this.waiting = false
    }
  }
})
</script>
