const path = require('path');

// https://github.com/imbhargav5/nextbase-nextjs13-supabase-starter/blob/main/.eslintrc.cjs
// https://stackoverflow.com/questions/69513869/eslint-8-0-0-failed-to-load-plugin-typescript-eslint
// https://the-guild.dev/graphql/eslint/docs/getting-started

module.exports = {
  root: true,
  extends: [
    'plugin:@next/next/recommended',
  ],
  overrides: [
    {
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@next/next/recommended',
        'plugin:tailwindcss/recommended',
        'prettier',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint', 'tailwindcss', 'prettier'],
      rules: {
        'prettier/prettier': 1,
        'no-html-link-for-pages': 'off',
      },
      files: ['src/**/*.ts', 'src/**/*.tsx', './tailwind.config.ts', './src/app/global.css'],
    },
    {
      extends: ['prettier'],
      files: '*.js',
      rules: {},
    },
    {
      extends: ['prettier'],
      files: '*.cjs',
      rules: {},
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
      },
    },
    {
      files: ["*.graphql"],
      parser: "@graphql-eslint/eslint-plugin",
      plugins: ["@graphql-eslint"],
      rules: { "@graphql-eslint/known-type-names": "error" },
    },
  ],
  settings: {
    tailwindcss: {
      config: path.join(__dirname, './tailwind.config.ts'),
      // config: "tailwind.config.ts"
    },
  },
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
};
