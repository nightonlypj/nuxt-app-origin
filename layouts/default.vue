<template>
  <v-app>
    <v-app-bar clipped-left fixed app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <NuxtLink to="/" class="toolbar-title d-flex">
        <v-img src="/logo.png" max-width="40px" max-height="40px" />
        <v-app-bar-title
          v-if="$vuetify.breakpoint.width > 226"
          :style="{ 'max-width': ($vuetify.breakpoint.width - 226) + 'px' }"
          class="ml-1 align-self-center d-inline-block text-truncate"
        >
          {{ `${$t('app_name')}${$t('sub_title')}${$config.envName}` }}
        </v-app-bar-title>
      </NuxtLink>
      <v-spacer />
      <template v-if="!$auth.loggedIn">
        <v-btn to="/users/sign_in" text rounded nuxt>
          <v-icon>mdi-login</v-icon>
          <div class="hidden-sm-and-down">ログイン</div>
        </v-btn>
        <v-btn to="/users/sign_up" text rounded nuxt>
          <v-icon>mdi-account-plus</v-icon>
          <div class="hidden-sm-and-down">アカウント登録</div>
        </v-btn>
      </template>
      <template v-else>
        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn
              id="user_menu_btn"
              class="d-inline-block"
              max-width="400px"
              text
              v-bind="attrs"
              v-on="on"
            >
              <v-avatar size="32px">
                <v-img id="user_image" :src="$auth.user.image_url.small" />
              </v-avatar>
              <div class="text-truncate hidden-sm-and-down ml-1">{{ $auth.user.name }}</div>
            </v-btn>
          </template>
          <v-list dense rounded>
            <v-list-item to="/users/update" nuxt>
              <v-icon>mdi-account-edit</v-icon>
              <v-list-item-title class="ml-2">ユーザー情報</v-list-item-title>
            </v-list-item>
            <v-list-item to="/users/sign_out" nuxt>
              <v-icon>mdi-logout</v-icon>
              <v-list-item-title class="ml-2">ログアウト</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn to="/infomations" text rounded nuxt>
          <v-badge :content="$auth.user.infomation_unread_count" :value="$auth.user.infomation_unread_count" color="red" overlap>
            <v-icon>mdi-bell</v-icon>
          </v-badge>
        </v-btn>
      </template>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" width="300px" clipped fixed app>
      <v-list>
        <template v-if="!$auth.loggedIn">
          <v-list-item to="/users/sign_in" nuxt>
            <v-icon>mdi-login</v-icon>
            <v-list-item-title class="ml-2">ログイン</v-list-item-title>
          </v-list-item>
          <v-list-item to="/users/sign_up" nuxt>
            <v-icon>mdi-account-plus</v-icon>
            <v-list-item-title class="ml-2">アカウント登録</v-list-item-title>
          </v-list-item>
        </template>
        <template v-else>
          <v-list-group>
            <template #activator>
              <v-avatar size="32px">
                <v-img id="user_image" :src="$auth.user.image_url.small" />
              </v-avatar>
              <v-list-item-title>
                <div class="text-truncate ml-1">{{ $auth.user.name }}</div>
              </v-list-item-title>
            </template>
            <v-list-item to="/users/update" nuxt>
              <v-icon class="ml-4">mdi-account-edit</v-icon>
              <v-list-item-title class="ml-2">ユーザー情報</v-list-item-title>
            </v-list-item>
            <v-list-item to="/users/sign_out" nuxt>
              <v-icon class="ml-4">mdi-logout</v-icon>
              <v-list-item-title class="ml-2">ログアウト</v-list-item-title>
            </v-list-item>
          </v-list-group>
        </template>
        <v-divider />
        <v-list-item to="/infomations" nuxt>
          <v-badge v-if="$auth.loggedIn" :content="$auth.user.infomation_unread_count" :value="$auth.user.infomation_unread_count" color="red" overlap>
            <v-icon>mdi-bell</v-icon>
          </v-badge>
          <v-icon v-else>mdi-bell</v-icon>
          <v-list-item-title class="ml-2">お知らせ</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="$auth.loggedIn" to="/downloads" nuxt>
          <v-badge :content="$auth.user.undownloaded_count" :value="$auth.user.undownloaded_count" color="red" overlap>
            <v-icon>mdi-download</v-icon>
          </v-badge>
          <v-list-item-title class="ml-2">ダウンロード結果</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="$auth.loggedIn || $config.enablePublicSpace" to="/spaces" nuxt>
          <v-icon>mdi-folder-open</v-icon>
          <v-list-item-title class="ml-2">スペース</v-list-item-title>
        </v-list-item>
        <template v-if="$auth.loggedIn">
          <v-list-item v-for="space in $auth.user.spaces" :id="`space_link_${space.code}`" :key="space.code" :to="`/-/${space.code}`" nuxt>
            <v-avatar v-if="space.image_url != null" size="24px">
              <v-img :id="`space_image_${space.code}`" :src="space.image_url.mini" />
            </v-avatar>
            <v-list-item-title class="text-overline ml-2">{{ space.name }}</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main class="mx-2">
      <v-container fluid>
        <DestroyInfo />
        <nuxt />
      </v-container>
    </v-main>

    <v-footer absolute inset app>
      <div class="flex-grow-1 text-center text-truncate">
        <span class="hidden-sm-and-down">Copyright </span>&copy; <a :href="$t('my_url')" target="_blank" rel="noopener noreferrer">{{ $t('my_name') }}</a> All Rights Reserved.
      </div>
    </v-footer>

    <go-top :max-width="48" :size="48" :right="24" :bottom="24" bg-color="#1867c0" />
  </v-app>
</template>

<script>
import GoTop from '@inotom/vue-go-top'
import DestroyInfo from '~/components/DestroyInfo.vue'

export default {
  components: {
    GoTop,
    DestroyInfo
  },

  data () {
    return {
      drawer: this.$vuetify.breakpoint.width >= 1264 // NOTE: md(Medium)以下の初期表示はメニューを閉じる
    }
  },

  head () {
    return {
      titleTemplate: `%s - ${this.$t('app_name')}${this.$config.envName}`
    }
  }
}
</script>

<style scoped>
.toolbar-title {
  color: inherit !important;
  text-decoration: inherit;
}
.v-data-table__mobile-row {
  padding-left: 0px !important;
}
.v-data-table__mobile-row__header {
  padding-right: 8px !important;
  white-space: nowrap;
  font-size: 10px;
}
</style>
<style>
.v-btn {
  text-transform: none;
}
.v-application .text-overline {
  text-transform: none !important;
}
.v-input input {
  max-height: 38px; /* NOTE: 文字が下寄りになる為 */
}
</style>
