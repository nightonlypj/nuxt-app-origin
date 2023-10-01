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
            placeholder="名称や説明を入力"
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
            v-if="$auth.loggedIn"
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
      <v-row v-if="$auth.loggedIn" v-show="syncQuery.option" id="option_item">
        <v-col v-if="$config.public.enablePublicSpace" cols="auto" class="d-flex py-0">
          <v-chip size="small" class="mt-1">表示</v-chip>
          <v-checkbox
            v-model="syncQuery.public"
            color="primary"
            label="公開"
            class="mr-2"
            density="compact"
            hide-details
            :error="privateBlank()"
            @click="waiting = false"
          />
          <v-checkbox
            v-model="syncQuery.private"
            color="primary"
            label="非公開"
            density="compact"
            hide-details
            :error="privateBlank()"
            @click="waiting = false"
          />
        </v-col>
        <v-col v-if="$config.public.enablePublicSpace" cols="auto" class="d-flex py-0">
          <v-chip size="small" class="mt-1">状況</v-chip>
          <v-checkbox
            v-model="syncQuery.join"
            color="primary"
            label="参加"
            class="mr-2"
            density="compact"
            hide-details
            :error="joinBlank()"
            @click="waiting = false"
          />
          <v-checkbox
            v-model="syncQuery.nojoin"
            color="primary"
            label="未参加"
            density="compact"
            hide-details
            :error="joinBlank()"
            @click="waiting = false"
          />
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
      if (this.$config.public.enablePublicSpace) {
        return this.privateBlank() || this.joinBlank() || this.activeBlank()
      } else {
        return this.activeBlank()
      }
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
      if (this.$config.public.debug) { console.log('error') }

      this.waiting = false
    }
  }
})
</script>
