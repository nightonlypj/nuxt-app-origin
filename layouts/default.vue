<template>
  <v-app dark>
    <v-navigation-drawer
      v-model="drawer"
      :mini-variant="miniVariant"
      :clipped="clipped"
      fixed
      app
    >
      <v-list>
        <v-list-item
          v-for="(item, i) in displayItems"
          :key="i"
          :to="item.to"
          router
          exact
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="item.title" />
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar
      :clipped-left="clipped"
      fixed
      app
    >
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-btn
        icon
        @click.stop="miniVariant = !miniVariant"
      >
        <v-icon>mdi-{{ `chevron-${miniVariant ? 'right' : 'left'}` }}</v-icon>
      </v-btn>
      <v-btn
        icon
        @click.stop="clipped = !clipped"
      >
        <v-icon>mdi-application</v-icon>
      </v-btn>
      <v-btn
        icon
        @click.stop="fixed = !fixed"
      >
        <v-icon>mdi-minus</v-icon>
      </v-btn>
      <v-toolbar-title v-text="title" />
      <v-spacer />
      <v-btn v-if="!$auth.loggedIn" to="/users/sign_in" text rounded nuxt>
        ログイン
      </v-btn>
      <v-btn v-if="!$auth.loggedIn" to="/users/sign_up" text rounded nuxt>
        アカウント登録
      </v-btn>
      <v-btn
        v-if="$auth.loggedIn"
        to="/users/edit"
        class="d-inline-block"
        max-width="400px"
        style="text-transform: none"
        text
        rounded
        nuxt
      >
        <v-avatar size="32px" style="margin-top: 2px; margin-right: 2px">
          <v-img :src="$auth.user.image_url.small" />
        </v-avatar>
        <div class="text-truncate hidden-sm-and-down">
          {{ $auth.user.name }}
        </div>
      </v-btn>
      <v-btn v-if="$auth.loggedIn" to="/users/sign_out" icon nuxt>
        <v-icon>mdi-logout</v-icon>
      </v-btn>
      <v-btn
        icon
        @click.stop="rightDrawer = !rightDrawer"
      >
        <v-icon>mdi-menu</v-icon>
      </v-btn>
    </v-app-bar>
    <v-main>
      <v-container>
        <v-alert v-if="$auth.loggedIn && $auth.user.destroy_schedule_at != null && $route.path !== '/users/undo_delete'" type="warning">
          このアカウントは{{ $dateFormat($auth.user.destroy_schedule_at, 'ja') }}以降に削除されます。
          <NuxtLink to="/users/undo_delete">
            取り消しはこちら
          </NuxtLink>
        </v-alert>
        <nuxt />
      </v-container>
    </v-main>
    <v-navigation-drawer
      v-model="rightDrawer"
      :right="right"
      temporary
      fixed
    >
      <v-list>
        <v-list-item @click.native="right = !right">
          <v-list-item-action>
            <v-icon light>
              mdi-repeat
            </v-icon>
          </v-list-item-action>
          <v-list-item-title>Switch drawer (click me)</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-footer
      :absolute="!fixed"
      app
    >
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'LayoutsDefault',

  data () {
    return {
      clipped: false,
      drawer: false,
      fixed: false,
      items: [
        {
          icon: 'mdi-apps',
          title: 'Welcome',
          to: '/',
          loggedIn: null
        },
        {
          icon: 'mdi-chart-bubble',
          title: 'Inspire',
          to: '/inspire',
          loggedIn: null
        },
        {
          icon: 'mdi-login',
          title: 'ログイン',
          to: '/users/sign_in',
          loggedIn: false
        },
        {
          icon: 'mdi-account-plus',
          title: 'アカウント登録',
          to: '/users/sign_up',
          loggedIn: false
        },
        {
          icon: 'mdi-account-edit',
          title: '登録情報変更',
          to: '/users/edit',
          loggedIn: true
        },
        {
          icon: 'mdi-logout',
          title: 'ログアウト',
          to: '/users/sign_out',
          loggedIn: true
        }
      ],
      miniVariant: false,
      right: true,
      rightDrawer: false,
      title: 'Vuetify.js'
    }
  },

  computed: {
    displayItems () {
      return this.items.filter(item => (item.loggedIn === null) || (item.loggedIn === this.$auth.loggedIn))
    }
  }
}
</script>
