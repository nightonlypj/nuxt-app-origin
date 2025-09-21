import withNuxt from './.nuxt/eslint.config.mjs' // https://eslint.nuxt.com/packages/module
import vuetify from 'eslint-plugin-vuetify' // https://github.com/vuetifyjs/eslint-plugin-vuetify

export default withNuxt(
  vuetify.configs['flat/base'],
  {
    rules: {
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      'no-lonely-if': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'error',
      'no-throw-literal': 'error'
    }
  }
)
