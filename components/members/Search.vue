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
          :disabled="processing || waiting || powerBlank()"
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
      <v-row v-show="syncQuery.option" id="option_item">
        <v-col cols="auto" class="d-flex">
          <div class="mt-2">
            権限:
          </div>
          <v-checkbox
            v-for="(value, key) in $t('enums.member.power')"
            :key="key"
            v-model="syncQuery.power[key]"
            input-value="1"
            :label="value"
            class="ml-2"
            dense
            hide-details
            :error="powerBlank()"
            @change="waiting = false"
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
    powerBlank () {
      for (const key in this.query.power) {
        if (this.query.power[key]) { return false }
      }
      return true
    },

    search (keydown) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (this.processing || this.waiting || this.powerBlank() || (keydown && !enter)) { return }

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
