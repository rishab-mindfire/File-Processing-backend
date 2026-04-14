import hub from "@mindfiredigital/eslint-plugin-hub";
import globals from "globals";

export default [
  hub.configs["flat/mern"],
  {
    languageOptions: {
      globals: globals.builtin,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
];
