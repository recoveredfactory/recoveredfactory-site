/// <reference path="./.sst/platform/config.d.ts" />

const ROOT_DOMAIN = "recoveredfactory.net";
const PROD_DOMAIN = "cms--prod.recoveredfactory.net";
const STAGE_DOMAIN = "cms--stage.recoveredfactory.net";

export default $config({
  app() {
    return {
      name: "recoveredfactory-ghost",
      home: "aws",
      region: "us-east-1",
    };
  },
  async run() {
    const stage = $app.stage;
    const siteDomain =
      stage === "prod" ? PROD_DOMAIN : stage === "staging" ? STAGE_DOMAIN : undefined;

    const hostedZone = aws.route53.getZoneOutput({
      name: ROOT_DOMAIN,
      privateZone: false,
    });

    const site = new sst.aws.SvelteKit("Web", {
      path: "apps/web",
      ...(siteDomain
        ? {
            domain: {
              name: siteDomain,
              dns: sst.aws.dns({ zone: hostedZone.zoneId }),
            },
          }
        : {}),
      environment: {
        PUBLIC_SITE_URL: siteDomain
          ? `https://${siteDomain}`
          : process.env.PUBLIC_SITE_URL ?? "",
      },
    });

    return {
      url: site.url,
      domain: siteDomain,
    };
  },
});
