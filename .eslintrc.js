module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    '@nuxtjs/eslint-config-typescript',
    'plugin:nuxt/recommended',
    'plugin:vue/vue3-recommended',
    'plugin:vue/base',
    'plugin:vuetify/base'
  ],
  plugins: [
  ],
  // add your custom rules here
  rules: {
    'prefer-promise-reject-errors': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/no-reserved-component-names': 'off',
    'vue/no-multiple-template-root': 'off',
    '@typescript-eslint/no-var-requires': 'off'
  }
}
