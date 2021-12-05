<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" width="300px" clipped fixed app>
      <v-list>
        <template v-if="!$auth.loggedIn">
          <v-list-item to="/users/sign_in" exact nuxt>
            <v-list-item-icon>
              <v-icon>mdi-login</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>ログイン</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item to="/users/sign_up" exact nuxt>
            <v-list-item-icon>
              <v-icon>mdi-account-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>アカウント登録</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-divider />
          <v-list-item to="/infomations" exact nuxt>
            <v-list-item-icon>
              <v-icon>mdi-bell</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>お知らせ</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
        <template v-if="$auth.loggedIn">
          <v-list-item to="/infomations" exact nuxt>
            <v-list-item-icon>
              <v-badge :content="$auth.user.infomation_unread_count" :value="$auth.user.infomation_unread_count" color="red" overlap>
                <v-icon>mdi-bell</v-icon>
              </v-badge>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>お知らせ</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-divider />
          <v-list-item to="/users/edit" exact nuxt>
            <v-list-item-icon>
              <v-icon>mdi-account-edit</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>登録情報変更</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item to="/users/sign_out" exact nuxt>
            <v-list-item-icon>
              <v-icon>mdi-logout</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>ログアウト</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar clipped-left fixed app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <NuxtLink to="/" class="toolbar-title d-flex">
        <v-img src="/v.png" max-width="40px" max-height="40px" />
        <v-toolbar-title
          v-if="$vuetify.breakpoint.width > 226"
          :style="{ 'max-width': ($vuetify.breakpoint.width - 226) + 'px' }"
          class="ml-1 align-self-center d-inline-block text-truncate"
        >
          {{ $t('app_name') + $config.envName }}
        </v-toolbar-title>
      </NuxtLink>
      <v-spacer />
      <template v-if="!$auth.loggedIn">
        <v-btn to="/users/sign_in" text rounded exact nuxt>
          <v-icon>mdi-login</v-icon>
          <div class="hidden-sm-and-down">ログイン</div>
        </v-btn>
        <v-btn to="/users/sign_up" text rounded exact nuxt>
          <v-icon>mdi-account-plus</v-icon>
          <div class="hidden-sm-and-down">アカウント登録</div>
        </v-btn>
      </template>
      <template v-else>
        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn class="d-inline-block" max-width="400px" style="text-transform: none" text v-bind="attrs" v-on="on">
              <v-avatar size="32px">
                <v-img :src="$auth.user.image_url.small" />
              </v-avatar>
              <div class="text-truncate hidden-sm-and-down">{{ $auth.user.name }}</div>
            </v-btn>
          </template>
          <v-list>
            <v-list-item to="/users/edit" exact nuxt>
              <v-list-item-icon>
                <v-icon>mdi-account-edit</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>登録情報変更</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item to="/users/sign_out" exact nuxt>
              <v-list-item-icon>
                <v-icon>mdi-logout</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>ログアウト</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn to="/infomations" text rounded exact nuxt>
          <v-badge :content="$auth.user.infomation_unread_count" :value="$auth.user.infomation_unread_count" color="red" overlap>
            <v-icon>mdi-bell</v-icon>
          </v-badge>
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-alert v-if="$auth.loggedIn && $auth.user.destroy_schedule_at != null && $route.path !== '/users/undo_delete'" type="warning">
          このアカウントは{{ $dateFormat($auth.user.destroy_schedule_at, 'ja') }}以降に削除されます。
          <NuxtLink to="/users/undo_delete">取り消しはこちら</NuxtLink>
        </v-alert>
        <nuxt />
      </v-container>
    </v-main>

    <v-footer absolute inset app>
      <div class="flex-grow-1 text-center">
        <span>Copyright &copy; <a :href="$t('my_url')" target="_blank" rel="noopener noreferrer">{{ $t('my_name') }}</a> All Rights Reserved.</span>
      </div>
    </v-footer>

    <go-top :max-width="48" :size="48" :right="24" :bottom="24" bg-color="#1867c0" />
  </v-app>
</template>

<script>
import GoTop from '@inotom/vue-go-top'

export default {
  name: 'LayoutsDefault',
  components: {
    GoTop
  },

  data () {
    return {
      drawer: this.$vuetify.breakpoint.width >= 1264 // Tips: md(Medium)以下の初期表示はメニューを閉じる
    }
  }
}
</script>

<style>
.toolbar-title {
  color: inherit !important;
  text-decoration: inherit;
}
</style>
