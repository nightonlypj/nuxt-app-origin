import { configure } from 'vee-validate'
import { localize } from '@vee-validate/i18n'
import en from '~/locales/validate.en'
import ja from '~/locales/validate.ja'

export default defineNuxtPlugin(() => {
  configure({ generateMessage: localize({ en, ja }) })
})
