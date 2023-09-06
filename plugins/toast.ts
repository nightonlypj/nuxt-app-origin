import Toast, { useToast } from 'vue-toastification'
import 'vue-toastification/dist/index.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Toast, {
    position: 'bottom-right',
    transition: 'Vue-Toastification__fade'
  })

  return {
    provide: {
      toast: useToast()
    }
  }
})
