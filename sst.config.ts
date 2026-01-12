import { defineConfig } from "sst";
import * as sst from "sst";

export default defineConfig({
  app(input) {
    return {
      name: "recoveredfactory-ghost",
      region: "us-east-1",
    };
  },
  async run() {
    const site = new sst.aws.SvelteKit("Web", {
      path: "apps/web",
      domain: {
        name: "recoveredfactory.net",
        // Configure DNS via your provider or Route 53.
        // Example: dns: sst.aws.dns({ zone: "recoveredfactory.net" })
      },
      environment: {
        PUBLIC_SITE_URL: "https://recoveredfactory.net",
        GHOST_CONTENT_API_URL: process.env.GHOST_CONTENT_API_URL ?? "",
        GHOST_CONTENT_API_KEY: process.env.GHOST_CONTENT_API_KEY ?? "",
        GHOST_MEMBER_STATUS_URL: process.env.GHOST_MEMBER_STATUS_URL ?? "",
        GHOST_PORTAL_SIGNIN_URL:
          process.env.GHOST_PORTAL_SIGNIN_URL ??
          "https://members.recoveredfactory.net/#/portal/signin",
        GHOST_PORTAL_UPGRADE_URL:
          process.env.GHOST_PORTAL_UPGRADE_URL ??
          "https://members.recoveredfactory.net/#/portal/signup",
        GHOST_MEMBER_CACHE_TTL_SECONDS:
          process.env.GHOST_MEMBER_CACHE_TTL_SECONDS ?? "120",
      },
    });

    // members.recoveredfactory.net is owned by Ghost(Pro) and should be configured there.

    return {
      url: site.url,
    };
  },
});
