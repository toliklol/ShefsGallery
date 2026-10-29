import js from '@eslint/js'
import globals from 'globals'
import { defineConfig } from 'eslint/config'
import config from 'eslint-config-prettier'
import plugin from 'eslint-plugin-prettier/recommended'

export default defineConfig([
    {
        files: ['**/*.{js,mjs,cjs}'],
        plugins: { js },
        extends: ['js/recommended'],
        languageOptions: { globals: globals.browser },
        config,
        plugin,
    },
])
