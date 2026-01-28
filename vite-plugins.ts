import path from "node:path";
import type { Plugin } from "vite";

interface PreventImportsOptions {
  /** The directory path to block imports from (can be relative or absolute) */
  folder: string;
  /** The directory path from which imports should be blocked (if not specified, blocks from anywhere) */
  fromFolder?: string;
  /** List of file paths or glob patterns to ignore from blocking */
  ignores?: string[];
}

/**
 * Enforces architectural boundaries by blocking imports from a directory.
 *
 * Leverages Vite's resolver to catch all import variations, including
 * normalized paths like `../web/../server`.
 *
 * @example
 * preventImports({ folder: './server' })
 *
 * @example
 * preventImports({ folder: './server', ignores: ['./server/shared.ts'] })
 *
 * @example
 * // Only block imports from web/ to server/
 * preventImports({ folder: './server', fromFolder: './web' })
 */
export const preventImports = ({
  folder,
  fromFolder,
  ignores,
}: PreventImportsOptions): Plugin => {
  // Normalize the blocked path to an absolute path for consistent comparison
  const blockedPath = path.resolve(folder);
  // Normalize the fromFolder path if provided
  const fromPath = fromFolder ? path.resolve(fromFolder) : null;
  // Normalize ignore paths to absolute paths
  const ignoredPaths = (ignores ?? []).map((p) => path.resolve(p));

  return {
    name: "vite-plugin-prevent-imports",
    // ensure this runs before other resolution plugins
    enforce: "pre" as const,

    async resolveId(source, importer, options) {
      // If there is no importer, it's an entry point (allow it)
      if (!importer) return null;

      // If fromFolder is specified, only block imports from files within that folder
      if (fromPath && !importer.startsWith(fromPath)) {
        return null;
      }

      // Resolve the import using Vite's internal resolver 'skipSelf' prevents
      // this plugin from entering an infinite loop
      const resolution = await this.resolve(source, importer, {
        skipSelf: true,
        ...options,
      });

      // If resolution fails or is external, let Vite handle it
      if (!resolution || !resolution.id) return null;

      // Check if the resolved absolute path starts with the blocked directory
      // Using .startsWith is safer than .includes to prevent false positives
      if (resolution.id.startsWith(blockedPath)) {
        // Check if the resolved path is in the ignore list
        const isIgnored = ignoredPaths.some(
          (ignoredPath) =>
            resolution.id === ignoredPath ||
            resolution.id.startsWith(ignoredPath + path.sep),
        );

        if (!isIgnored) {
          throw new Error(
            `\n🚨 SECURITY ERROR: Blocked import detected.\n` +
              `   File: ${importer}\n` +
              `   Attempted to import: ${source}\n` +
              `   Resolved to blocked path: ${resolution.id}\n`,
          );
        }
      }

      return null; // Return null to allow other plugins/Vite to handle valid imports
    },
  };
};
