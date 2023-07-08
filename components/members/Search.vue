<template>
  <v-form autocomplete="on" @submit.prevent>
    <div
      id="input_area"
      @keydown.enter="appSetKeyDownEnter"
      @keyup.enter="search(true)"
    >
      <div class="d-flex">
        <v-text-field
          id="search_text"
          v-model="syncQuery.text"
          label="検索"
          :placeholder="textPlaceholder"
          autocomplete="on"
          style="max-width: 400px"
          dense
          hide-details
          maxlength="255"
          clearable
          @input="waiting = false"
        />
        <v-btn
          id="search_btn"
          color="primary"
          class="ml-1"
          :disabled="processing || waiting || blank()"
          @click="search(false)"
        >
          <v-icon dense>mdi-magnify</v-icon>
        </v-btn>
        <v-btn
          id="option_btn"
          class="ml-2"
          rounded
          @click="syncQuery.option = !syncQuery.option"
        >
          <v-icon>{{ syncQuery.option ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
          <span class="hidden-sm-and-down">検索オプション</span>
        </v-btn>
      </div>
      <v-row v-show="syncQuery.option" id="option_item" class="py-4">
        <v-col cols="auto" class="py-0 pe-0">
          <v-chip label small class="mt-2">
            権限
          </v-chip>
        </v-col>
        <v-col v-for="(value, key, index) in $t('enums.member.power')" :key="key" cols="auto" class="ps-2 py-0" :class="index + 1 < Object.keys($t('enums.member.power')).length ? 'pe-0' : null">
          <v-checkbox
            v-model="syncQuery.power[key]"
            input-value="1"
            :label="value"
            dense
            hide-details
            :error="powerBlank()"
            @change="waiting = false"
          />
        </v-col>
        <v-col cols="auto" class="d-flex pe-0 py-0">
          <v-chip label small class="mt-2">
            状態
          </v-chip>
          <v-checkbox
            v-model="syncQuery.active"
            label="有効"
            class="ml-2"
            dense
            hide-details
            :error="activeBlank()"
            @click="waiting = false"
          />
          <v-checkbox
            v-model="syncQuery.destroy"
            label="削除予約"
            class="ml-2"
            dense
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
import Application from '~/plugins/application.js'

export default {
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
      if (this.$config.debug) { console.log('error') }

      this.waiting = false
    }
  }
}
</script>
