import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const env = createEnv({
  clientPrefix: "VITE_",
  isServer: false,

  client: {
    VITE_SITE_URL: z.url().optional(),
  },

  runtimeEnvStrict: {
    VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
  },
});
export default env;
