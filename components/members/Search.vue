<template>
  <v-form autocomplete="on" @submit.prevent>
    <div
      id="input_area"
      @keydown.enter="appSetKeyDownEnter"
      @keyup.enter="search(true)"
    >
      <v-row>
        <v-col class="d-flex">
          <v-text-field
            id="search_text"
            v-model="syncQuery.text"
            label="検索"
            :placeholder="textPlaceholder"
            autocomplete="on"
            style="max-width: 400px"
            density="compact"
            hide-details
            maxlength="255"
            clearable
            @input="waiting = false"
          />
          <v-btn
            id="search_btn"
            color="primary"
            class="ml-1 mt-1"
            :disabled="processing || waiting || blank()"
            @click="search(false)"
          >
            <v-icon size="large">mdi-magnify</v-icon>
          </v-btn>
          <v-btn
            id="option_btn"
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
      <v-row v-show="syncQuery.option" id="option_item">
        <v-col cols="auto" class="d-flex py-0">
          <v-chip size="small" class="mt-1">権限</v-chip>
          <template v-for="(value, key, index) in powers" :key="key">
            <v-checkbox
              v-model="syncQuery.power[key]"
              input-value="1"
              color="primary"
              :label="value"
              :class="index + 1 < Object.keys(powers).length ? 'mr-2' : null"
              density="compact"
              hide-details
              :error="powerBlank()"
              @change="waiting = false"
            />
          </template>
        </v-col>
        <v-col cols="auto" class="d-flex py-0">
          <v-chip size="small" class="mt-1">状態</v-chip>
          <v-checkbox
            v-model="syncQuery.active"
            color="primary"
            label="有効"
            class="mr-2"
            density="compact"
            hide-details
            :error="activeBlank()"
            @click="waiting = false"
          />
          <v-checkbox
            v-model="syncQuery.destroy"
            color="primary"
            label="削除予定"
            density="compact"
            hide-details
            :error="activeBlank()"
            @click="waiting = false"
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
    textPlaceholder () {
      return `ユーザー名${this.admin ? 'やメールアドレス' : ''}を入力`
    },

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
