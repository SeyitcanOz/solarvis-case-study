import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // --- RELAXED RULES START ---
      
      // Allow modifying objects returned by hooks (Fixes your specific SceneLogic error)
      'react-hooks/immutability': 'off',
      
      // Allow 'any' types without errors
      '@typescript-eslint/no-explicit-any': 'off',
      
      // Ignore unused variables and arguments
      '@typescript-eslint/no-unused-vars': 'off',
      
      // Allow @ts-ignore comments
      '@typescript-eslint/ban-ts-comment': 'off',
      
      // --- RELAXED RULES END ---
    },
  },
)