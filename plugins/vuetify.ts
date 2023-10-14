import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as labsComponents from 'vuetify/labs/components'
import * as directives from 'vuetify/directives'

export const vuetify = createVuetify({
  components: {
    ...components,
    ...labsComponents
  },
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: { // https://vuetifyjs.com/en/styles/colors/#material-colors
      light: {
        dark: false,
        colors: {
          primary: '#1976D2', // blue-darken-2 <- '#6200EE',
          'primary-darken-1': '#1565C0', // blue-darken-3 <- '#3700B3',
          secondary: '#616161', // grey-darken-2 <- '#03DAC6',
          'secondary-darken-1': '#424242', // grey-darken-3 <- '#018786',
          error: '#FF5252', // red-accent-2 <- '#B00020'
          // info: '#2196F3', // = blue
          // success: '#4CAF50', // = green
          // warning: '#FB8C00' // = orange-darken-1
          accent: '#FF8F00' // amber-darken-3 <- Nuxt2(blue-accent-1)
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: '#1976D2', // blue-darken-2 <- '#BB86FC'
          'primary-darken-1': '#1565C0', // blue-darken-3 <- '#3700B3'
          secondary: '#616161', // grey-darken-2 <- '#03DAC5'
          'secondary-darken-1': '#424242', // grey-darken-3 <- '#03DAC5'
          error: '#FF5252', // red-accent-2 <- '#CF6679'
          // info: '#2196F3', // = blue
          // success: '#4CAF50', // = green
          // warning: '#FB8C00' // = orange-darken-1
          accent: '#FF8F00' // amber-darken-3 <- Nuxt2(grey.darken3)
        }
      }
    }
  }
})

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(vuetify)
})
