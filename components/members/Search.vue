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
          @input="waiting = false"
        />
        <v-btn
          id="search_btn"
          color="primary"
          class="ml-1"
          :disabled="processing || waiting"
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
        <v-col class="d-flex">
          <div class="mt-2">
            権限:
          </div>
          <v-checkbox
            v-for="(value, key) in $t('enums.member.power')"
            :id="key + '_check'"
            :key="key"
            v-model="syncQuery.power[key]"
            :label="value"
            class="ml-2"
            dense
            hide-details
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
    currentMemberAdmin: {
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
      return 'ユーザー名' + (this.currentMemberAdmin ? 'やメールアドレス' : '') + 'を入力'
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
    search (keydown) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (this.processing || this.waiting || (keydown && !enter)) { return }

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
