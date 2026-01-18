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
              dns: sst.aws.dns({ zone: hostedZone.zoneId }),
            },
          }
        : {}),
      environment: {
        PUBLIC_SITE_URL: siteDomain
          ? `https://${siteDomain}`
          : process.env.PUBLIC_SITE_URL ?? "",
        PUBLIC_IMAGE_RESIZER_URL: resizer.url,
      },
    });

    return {
      url: site.url,
      domain: siteDomain,
    };
  },
});
