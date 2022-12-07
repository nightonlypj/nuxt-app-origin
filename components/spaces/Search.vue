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
          :disabled="processing || waiting || blank()"
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
      <v-row v-if="$auth.loggedIn" v-show="syncQuery.option" id="option_item" class="py-4">
        <v-col cols="auto" class="d-flex py-0">
          <v-checkbox
            v-model="syncQuery.public"
            label="公開"
            dense
            hide-details
            :error="privateBlank()"
            @click="waiting = false"
          />
          <v-checkbox
            v-model="syncQuery.private"
            label="非公開"
            class="ml-2"
            dense
            hide-details
            :error="privateBlank()"
            @click="waiting = false"
          />
        </v-col>
        <v-col cols="auto" class="d-flex py-0">
          <v-checkbox
            v-model="syncQuery.join"
            label="参加"
            dense
            hide-details
            :error="joinBlank()"
            @click="waiting = false"
          />
          <v-checkbox
            v-model="syncQuery.nojoin"
            label="未参加"
            class="ml-2"
            dense
            hide-details
            :error="joinBlank()"
            @click="waiting = false"
          />
        </v-col>
        <v-col cols="auto" class="d-flex py-0">
          <v-checkbox
            v-model="syncQuery.active"
            label="有効"
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
    blank () {
      return this.privateBlank() || this.joinBlank() || this.activeBlank()
    },
    privateBlank () {
      return !this.query.public && !this.query.private
    },
    joinBlank () {
      return !this.query.join && !this.query.nojoin
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
