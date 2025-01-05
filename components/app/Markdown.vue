<template>
  <Head>
    <!-- /* c8 ignore next */ -->
    <Link v-if="hljsCss != null" :href="hljsCss" rel="stylesheet" />
  </Head>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div v-if="source != null && source !== ''" v-html="md.render(source)" />
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import sanitizer from 'markdown-it-sanitizer'
import link from 'markdown-it-link-attributes'
import { full as emoji } from 'markdown-it-emoji'
import sub from 'markdown-it-sub'
import sup from 'markdown-it-sup'
import ins from 'markdown-it-ins'
import mark from 'markdown-it-mark'
import footnote from 'markdown-it-footnote'
import deflist from 'markdown-it-deflist'
import abbr from 'markdown-it-abbr'
import hljs from 'highlight.js'
import { useTheme } from 'vuetify'

const hljsCss = { // % mkdir public/highlight.js; cp -a node_modules/highlight.js/styles/{github,github-dark}.min.css public/highlight.js/
  light: '/highlight.js/github.min.css',
  dark: '/highlight.js/github-dark.min.css'
}[useTheme().name.value]

defineProps({
  source: {
    type: String,
    default: null
  }
})

const md: any = new MarkdownIt({ // https://github.com/markdown-it/markdown-it, https://markdown-it.github.io/
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
        // return '<pre class="hljs"><code>' + hljs.highlight(str, { language: lang, ignoreIllegals: true }).value + '</code></pre>'
      /* c8 ignore start */
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (__) { /* empty */ }
    }
    return ''
    // return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
    /* c8 ignore stop */
  }
})
  .use(sanitizer) // https://github.com/svbergerem/markdown-it-sanitizer, NOTE: 「html: true」で「<script>」等が、サニタイズされる
  .use(link, { // https://github.com/crookedneighbor/markdown-it-link-attributes
    attrs: {
      target: '_blank',
      rel: 'noopener'
    }
  })
  .use(emoji) // https://github.com/markdown-it/markdown-it-emoji
  .use(sub) // https://github.com/markdown-it/markdown-it-sub
  .use(sup) // https://github.com/markdown-it/markdown-it-sup
  .use(ins) // https://github.com/markdown-it/markdown-it-ins
  .use(mark) // https://github.com/markdown-it/markdown-it-mark
  .use(footnote) // https://github.com/markdown-it/markdown-it-footnote
  .use(deflist) // https://github.com/markdown-it/markdown-it-deflist
  .use(abbr) // https://github.com/markdown-it/markdown-it-abbr
</script>

<style scoped>
/* NOTE: VuetifyのCSS Resetで崩れる＋調整の為 */
div >>> hr {
  margin: 20px 0;
}
div >>> p {
  margin: 0 0 10px 0;
}
div >>> h1, div >>> h2, div >>> h3 {
  margin: 20px 0 10px 0;
}
div >>> h4, div >>> h5, div >>> h6 {
  margin: 10px 0;
}
div >>> blockquote {
  margin: 0 0 20px 0;
  padding: 10px 20px;
  border-left: 5px solid rgb(var(--v-theme-secondary-darken-1)); /* <- #eee; */
}
div >>> ul, div >>> ol {
  margin: 0 0 10px 0;
  padding: 0 0 0 40px;
}
div >>> ul ul, div >>> ol ul, div >>> ul ol, div >>> ol ol {
  margin: 0;
}
div >>> code {
  padding: 2px 4px;
  font-size: 90%;
  color: rgb(var(--v-theme-accent)); /* <- #d73a49; <- #c7254e; */
  background-color: rgb(var(--v-theme-secondary-darken-3)); /* <- #f9f2f4; */
  border-radius: 4px;
}
div >>> pre {
  padding: 9.5px;
  margin: 0 0 10px 0;
  word-break: break-all;
  background-color: rgb(var(--v-theme-secondary-darken-3)); /* <- #f5f5f5; */
  border: 1px solid rgb(var(--v-theme-secondary)); /* <- #ccc; */
  border-radius: 4px;
}
div >>> pre code {
  padding: 0;
  font-size: inherit;
  color: inherit;
  white-space: pre-wrap;
}
div >>> table {
  width: 100%;
  margin: 0 0 20px 0;
  border-collapse: collapse;
}
div >>> th {
  padding: 8px;
  background-color: rgb(var(--v-theme-secondary-darken-1)); /* <- なし */
  border-bottom: 2px solid rgb(var(--v-theme-secondary)); /* <- #ddd; */
}
div >>> tr:nth-child(odd) > td {
  background-color: rgb(var(--v-theme-secondary-darken-3)); /* <- #f9f9f9; */
}
div >>> tr:nth-child(even) > td {
  background-color: rgb(var(--v-theme-secondary-darken-2)); /* <- なし */
}
div >>> td {
  padding: 8px;
  border-top: 1px solid rgb(var(--v-theme-secondary)); /* <- #ddd; */
}
div >>> img {
  max-width: 35%;
  vertical-align: middle;
}
</style>
