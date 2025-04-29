module.exports = {
    root: true,
    env: {
      browser: true,
      node: true,
    },
    extends: [
      'plugin:vue/vue3-essential', 
      'eslint:recommended'
    ],
    parserOptions: {
      ecmaVersion: 2020,
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'off', 
    },
    globals: {
      defineProps: 'readonly',
      defineEmits: 'readonly',
      defineExpose: 'readonly',
      withDefaults: 'readonly'
    }
  }