import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import sl from "./locales/sl";

i18n
  .use(LanguageDetector) // detects user language
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    fallbackLng: "en",
    defaultNS: "common", // default namespace used if not specified

    interpolation: {
      escapeValue: false, // react already safes from xss
    },

    // Load translations directly from imported resources
    resources: {
      en,
      sl,
    },
  });

export default i18n;
