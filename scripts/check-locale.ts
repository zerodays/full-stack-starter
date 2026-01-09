/** biome-ignore-all lint/suspicious/noExplicitAny: this is just for checking locales */
import fs from "node:fs";
import path from "node:path";

// CONFIGURATION
// ------------------------------
// Adjust this path to where your locales folder lives (usually inside src for TS files)
const LOCALES_DIR = path.join(process.cwd(), "web/i18n/locales");
const BASE_LANG = "en"; // Your source of truth
// ------------------------------

// Helper: Recursively get all keys from an object as dot-notation strings
// Example: { auth: { login: "Login" } } -> ["auth.login"]
const getKeys = (obj: any, prefix = ""): Set<string> => {
  const keys = new Set<string>();

  // Handle case where the object itself is a string (leaf node)
  if (typeof obj === "string") return keys;

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === "object" && obj[key] !== null) {
        // If it's an object, dive deeper
        const nestedKeys = getKeys(obj[key], newPrefix);
        nestedKeys.forEach((k) => {
          keys.add(k);
        });
      } else {
        // If it's a value, add the key
        keys.add(newPrefix);
      }
    }
  }
  return keys;
};

const checkLocales = async () => {
  console.log(`📂 Scanning locales in: ${LOCALES_DIR}`);

  // 1. Get list of languages (folders in locales dir)
  const languages = fs
    .readdirSync(LOCALES_DIR)
    .filter((f) => fs.statSync(path.join(LOCALES_DIR, f)).isDirectory());

  if (!languages.includes(BASE_LANG)) {
    console.error(
      `❌ Base language folder "${BASE_LANG}" not found in ${LOCALES_DIR}`,
    );
    process.exit(1);
  }

  // 2. Load the Base Language (Source of Truth)
  console.log(`⭐ Loading Base Language: [${BASE_LANG}]...`);
  let baseTranslations: Record<string, any>;
  try {
    const module = await import(path.join(LOCALES_DIR, BASE_LANG, "index.ts"));
    baseTranslations = module.default || module;
  } catch (error) {
    console.error(
      `❌ Failed to load base language file. Ensure ${BASE_LANG}/index.ts exists.`,
    );
    console.error(error);
    process.exit(1);
  }

  const baseKeys = getKeys(baseTranslations);
  console.log(`   Found ${baseKeys.size} keys.\n`);

  let hasError = false;

  // 3. Compare against other languages
  const targetLangs = languages.filter((l) => l !== BASE_LANG);

  for (const lang of targetLangs) {
    console.log(`🔎 Checking [${lang}]...`);

    let targetTranslations: Record<string, any>;
    try {
      const module = await import(path.join(LOCALES_DIR, lang, "index.ts"));
      targetTranslations = module.default || module;
    } catch (_error) {
      console.error(`   ❌ Failed to load ${lang}/index.ts`);
      hasError = true;
      continue;
    }

    const targetKeys = getKeys(targetTranslations);

    // Check for MISSING keys (In Base, not in Target)
    const missingKeys = [...baseKeys].filter((k) => !targetKeys.has(k));

    // Check for EXTRA keys (In Target, not in Base)
    const extraKeys = [...targetKeys].filter((k) => !baseKeys.has(k));

    if (missingKeys.length > 0 || extraKeys.length > 0) {
      hasError = true;

      if (missingKeys.length > 0) {
        console.error(`   ❌ Missing ${missingKeys.length} keys:`);
        missingKeys.forEach((k) => {
          console.error(`      - ${k}`);
        });
      }

      if (extraKeys.length > 0) {
        if (missingKeys.length > 0) console.log(""); // Visual spacer
        console.warn(
          `   ⚠️  Found ${extraKeys.length} extra keys (orphaned or typo):`,
        );
        extraKeys.forEach((k) => {
          console.warn(`      + ${k}`);
        });
      }
    } else {
      console.log(`   ✅ OK`);
    }
  }

  console.log("--------------------------------------------------");
  if (hasError) {
    console.log("❌ Translation check failed.");
    process.exit(1);
  } else {
    console.log("✅ All translations are synchronized!");
    process.exit(0);
  }
};

checkLocales();
