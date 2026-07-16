/// <reference path="./.sst/platform/config.d.ts" />

const ROOT_DOMAIN = "recoveredfactory.net";
const PROD_DOMAIN = ROOT_DOMAIN;
const WWW_DOMAIN = `www.${ROOT_DOMAIN}`;
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
    const siteOrigin = siteDomain
      ? `https://${siteDomain}`
      : process.env.PUBLIC_SITE_URL ?? "";
    const envSiteHost = (() => {
      if (!process.env.PUBLIC_SITE_URL) return "";
      try {
        return new URL(process.env.PUBLIC_SITE_URL).hostname;
      } catch {
        return "";
      }
    })();
    const allowedImageHosts = [
      "airtableusercontent.com",
      ROOT_DOMAIN,
      siteDomain,
      envSiteHost,
    ]
      .filter(Boolean)
      .join(",");

    const hostedZone = aws.route53.getZoneOutput({
      name: ROOT_DOMAIN,
      privateZone: false,
    });

    const stripeSecretKey = new sst.Secret("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = new sst.Secret("STRIPE_WEBHOOK_SECRET");
    const kitApiKey = new sst.Secret("KIT_API_KEY");
    const kitApiSecret = new sst.Secret("KIT_API_SECRET");

    if (stage === "prod") {
      const kitRecords = [
        {
          name: "ckespa",
          type: "CNAME",
          records: ["spf.dm-c54c6f45.sg5.convertkit.com"],
        },
        {
          name: "cka._domainkey",
          type: "CNAME",
          records: ["dkim.dm-6d754837.sg5.convertkit.com"],
        },
        {
          name: "cka2._domainkey",
          type: "CNAME",
          records: ["dkim2.dm-ca6faf1c.sg5.convertkit.com"],
        },
        {
          name: "_dmarc",
          type: "TXT",
          records: ["v=DMARC1; p=none;"],
        },
      ];

      kitRecords.forEach((record) => {
        const recordId = record.name.replace(/[^a-z0-9-]/gi, "-");
        new aws.route53.Record(`kit-${recordId}`, {
          zoneId: hostedZone.zoneId,
          name: record.name,
          type: record.type,
          ttl: 300,
          records: record.records,
          allowOverwrite: true,
        });
      });
    }

    const resizer = new sst.aws.Function("ImageResizerFn", {
      handler: "packages/services/image-resizer.handler",
      nodejs: { install: ["sharp"] },
      runtime: "nodejs20.x",
      memory: "512 MB",
      url: true,
      environment: {
        SST_STAGE: stage,
        ALLOWED_IMAGE_HOSTS: allowedImageHosts,
        SITE_BASE_URL: siteOrigin,
      },
    });

    const site = new sst.aws.SvelteKit("Web", {
      path: "apps/web",
      ...(siteDomain
        ? {
            domain: {
              name: siteDomain,
              redirects: siteDomain === ROOT_DOMAIN ? [WWW_DOMAIN] : [],
              dns: sst.aws.dns({ zone: hostedZone.zoneId }),
            },
          }
        : {}),
      environment: {
        PUBLIC_STAGE: stage,
        PUBLIC_SITE_URL: siteDomain
          ? `https://${siteDomain}`
          : process.env.PUBLIC_SITE_URL ?? "",
        PUBLIC_IMAGE_RESIZER_URL: resizer.url,
        PUBLIC_SUPPORT_LINK_MONTHLY_12:
          stage === "prod"
            ? "https://buy.stripe.com/bJe14oblegwncEAcn2fAc02"
            : "https://buy.stripe.com/test_9B628semw6lPbMdeKa9IQ00",
        PUBLIC_SUPPORT_LINK_MONTHLY_75:
          stage === "prod"
            ? "https://buy.stripe.com/3cIfZi0GAeofcEAcn2fAc01"
            : "https://buy.stripe.com/test_7sYaEY3HS7pTdUl7hI9IQ01",
        PUBLIC_SUPPORT_LINK_ONCE:
          stage === "prod"
            ? "https://buy.stripe.com/5kQ8wQble5RJ5c82MsfAc00"
            : "https://buy.stripe.com/test_4gM28s7Y8dOh4jL31s9IQ02",
        STRIPE_SECRET_KEY: stripeSecretKey.value,
        STRIPE_WEBHOOK_SECRET: stripeWebhookSecret.value,
        STRIPE_PRICE_LEVEL_1: process.env.STRIPE_PRICE_LEVEL_1 ?? "",
        STRIPE_PRICE_LEVEL_2: process.env.STRIPE_PRICE_LEVEL_2 ?? "",
        STRIPE_PRICE_ONCE: process.env.STRIPE_PRICE_ONCE ?? "",
        KIT_API_KEY: kitApiKey.value,
        KIT_API_SECRET: kitApiSecret.value,
        KIT_TAG_SUPPORT_LEVEL_1: process.env.KIT_TAG_SUPPORT_LEVEL_1 ?? "",
        KIT_TAG_SUPPORT_LEVEL_2: process.env.KIT_TAG_SUPPORT_LEVEL_2 ?? "",
        KIT_TAG_SUPPORTED_ONCE: process.env.KIT_TAG_SUPPORTED_ONCE ?? "",
      },
    });

    return {
      url: site.url,
      domain: siteDomain,
    };
  },
});
