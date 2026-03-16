import pluginVue from 'eslint-plugin-vue';

export default [
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['src/**/*.{js,vue}'],
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'vue/multi-word-component-names': 'off',
    },
  },
];
