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
          placeholder="名称や説明を入力"
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
          :disabled="processing || waiting"
          @click="search(false)"
        >
          <v-icon dense>mdi-magnify</v-icon>
        </v-btn>
        <v-btn
          v-if="$auth.loggedIn"
          id="option_btn"
          class="ml-2"
          rounded
          @click="syncQuery.option = !syncQuery.option"
        >
          <v-icon>{{ syncQuery.option ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
          <span class="hidden-sm-and-down">検索オプション</span>
        </v-btn>
      </div>
      <v-row v-if="$auth.loggedIn" v-show="syncQuery.option" id="option_item">
        <v-col>
          <v-checkbox
            v-model="syncQuery.exclude"
            label="参加スペースを除く"
            dense
            hide-details
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
    }
  },

  data () {
    return {
      waiting: true,
      keyDownEnter: false
    }
  },

  computed: {
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
