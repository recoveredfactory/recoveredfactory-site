#!/usr/bin/env node
// One-time helper: mint the Immigration Daybook's Facebook Page token, which
// also posts to the Instagram account linked to that Page, and save it straight
// into this repo's GitHub secrets. Run it yourself, in your own terminal.
//
//   META_APP_ID=... META_APP_SECRET=... node apps/daybook/scripts/daybook/meta-auth.mjs
//
// It opens a Facebook consent page. Sign in as the account that manages the
// Daybook Page, approve every Page and permission it asks for, and it:
//   1. trades the consent for a long-lived user token, and that for the Page's
//      token, which does NOT expire;
//   2. prints only who it will post as: the Page, and the Instagram account if
//      one is linked yet (re-run once it is; nothing else changes);
//   3. saves the secrets into the `social` environment of
//      recoveredfactory/recoveredfactory-site with `gh secret set`, creating the
//      environment if it's missing. The token is piped to gh, never printed.
//
// Secrets it writes (environment `social`):
//   DAYBOOK_FB_PAGE_ID        the Page that posts
//   DAYBOOK_META_PAGE_TOKEN   the Page token (Facebook posts, and Instagram via the Page)
//   DAYBOOK_IG_USER_ID        the linked Instagram account, when there is one
//   DAYBOOK_META_APP_SECRET   for appsecret_proof, if the app requires it
//
// Prereqs, all from 287g-explorer's setup (docs/SOCIAL_UPLOAD.md there): the
// Meta app with Facebook Login, http://localhost:4180 among its Valid OAuth
// Redirect URIs, your login holding a role on the app, and `gh` logged in with
// admin rights on this repo. Standard Access is enough to post to a Page you
// manage; no App Review.
//
// A Business-type app logs in through Facebook Login for Business, which takes a
// saved configuration instead of a list of scopes: passing scopes to it gets
// "Invalid Scopes" even when the permissions are assigned (2026-10-16). Create
// one under Facebook Login for Business → Configurations (token type: user
// access token; the Pages and Instagram permissions below; your Page and its
// Instagram account as assets) and pass its id as META_CONFIG_ID or
// --config-id. Without one, the scope list is sent, which suits a classic
// Facebook Login app.
//
// Flags:
//   --config-id <id>   Facebook Login for Business configuration (or META_CONFIG_ID)
//   --page <id>        pick the Page when you manage several
//   --print            print the secrets instead of saving them (avoid; anything
//                      printed can end up in a log or a transcript)
//   --repo <o/r>       default recoveredfactory/recoveredfactory-site
//   --env <name>       default social
//   --port <n>         default 4180; must match a Valid OAuth Redirect URI
//   --api-version <v>  default v25.0
//
// The 287(g) app's env names work too: INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET.

import { execFile, spawnSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag) => {
  const eq = args.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const die = (msg) => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
};

const appId = process.env.META_APP_ID || process.env.INSTAGRAM_APP_ID || valueOf('--app-id');
const appSecret = process.env.META_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;
if (!appId || !appSecret) die('Set META_APP_ID and META_APP_SECRET in the environment.');

const configId = process.env.META_CONFIG_ID || valueOf('--config-id');
const port = Number(valueOf('--port') || 4180);
const apiVersion = valueOf('--api-version') || 'v25.0';
const wantPage = valueOf('--page');
const repo = valueOf('--repo') || 'recoveredfactory/recoveredfactory-site';
const envName = valueOf('--env') || 'social';
const printOnly = has('--print');
const redirectUri = `http://localhost:${port}`;
const GRAPH = `https://graph.facebook.com/${apiVersion}`;

if (!printOnly) {
  const auth = spawnSync('gh', ['auth', 'status'], { stdio: 'ignore' });
  if (auth.error || auth.status !== 0) die('gh is not installed or not logged in. Run `gh auth login` first.');
}

// Posting a carousel to the Page needs pages_manage_posts; Instagram through
// the Page needs the instagram_* pair. Standard Access covers all of them for a
// Page you manage.
const scope = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'business_management',
  'instagram_basic',
  'instagram_content_publish',
].join(',');

const authUrl =
  `https://www.facebook.com/${apiVersion}/dialog/oauth?` +
  new URLSearchParams(
    configId
      ? {
          client_id: appId,
          redirect_uri: redirectUri,
          config_id: configId,
          response_type: 'code',
          override_default_response_type: 'true',
        }
      : { client_id: appId, redirect_uri: redirectUri, scope, response_type: 'code' },
  );

const proof = (tok) => createHmac('sha256', appSecret).update(tok).digest('hex');

async function getJson(url) {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `${res.status} from ${new URL(url).pathname}`);
  return json;
}

/** Save one secret through gh, value on stdin so it never appears in argv or output. */
function saveSecret(name, value) {
  const r = spawnSync('gh', ['secret', 'set', name, '--env', envName, '--repo', repo], {
    input: value,
    stdio: ['pipe', 'ignore', 'pipe'],
  });
  if (r.status !== 0) throw new Error(`gh secret set ${name} failed: ${r.stderr?.toString().trim()}`);
  console.log(`  saved ${name}`);
}

function ensureEnvironment() {
  // PUT is idempotent: it creates the environment or leaves an existing one as is.
  const r = spawnSync('gh', ['api', '-X', 'PUT', `repos/${repo}/environments/${envName}`, '--silent'], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  if (r.status !== 0) throw new Error(`couldn't create environment ${envName}: ${r.stderr?.toString().trim()}`);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, redirectUri);
  const code = url.searchParams.get('code');
  if (!code) {
    const err = url.searchParams.get('error_description');
    res.writeHead(400).end(err ? `OAuth error: ${err}` : 'No ?code in callback.');
    if (err) console.error(`\n✗ OAuth error: ${err}\n`);
    return;
  }
  try {
    // code → short-lived user token → long-lived user token. A Page token
    // derived from the long-lived one doesn't expire.
    const short = await getJson(
      `${GRAPH}/oauth/access_token?` +
        new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }),
    );
    const long = await getJson(
      `${GRAPH}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: short.access_token,
        }),
    );
    const userToken = long.access_token;

    const accounts = await getJson(
      `${GRAPH}/me/accounts?` +
        new URLSearchParams({
          fields: 'name,id,access_token,tasks,instagram_business_account{id,username}',
          access_token: userToken,
          appsecret_proof: proof(userToken),
        }),
    );
    res.writeHead(200, { 'content-type': 'text/plain' }).end('Got it. Back to the terminal; you can close this tab.');

    const pages = accounts.data || [];
    const daybook = pages.filter((p) => /immigration daybook/i.test(p.name));
    const chosen = wantPage
      ? pages.find((p) => p.id === wantPage)
      : daybook.length === 1
        ? daybook[0]
        : pages.length === 1
          ? pages[0]
          : null;
    if (!chosen) {
      console.log(
        pages.length
          ? '\nWhich Page? Re-run with --page <id>:\n'
          : '\n✗ No Pages came back. Did you grant the Daybook Page on the consent screen?\n',
      );
      for (const p of pages) {
        const ig = p.instagram_business_account;
        console.log(`  --page ${p.id}   ${p.name}${ig ? `  →  @${ig.username}` : ''}`);
      }
      console.log('');
      return;
    }
    if (!(chosen.tasks || []).includes('CREATE_CONTENT')) {
      console.log(`\n! Your role on "${chosen.name}" may not allow posting (tasks: ${(chosen.tasks || []).join(', ')}).`);
    }

    const ig = chosen.instagram_business_account;
    console.log(`\n✓ Facebook: posts as the Page "${chosen.name}" (${chosen.id})`);
    console.log(
      ig
        ? `✓ Instagram: posts as @${ig.username} (${ig.id}), through that Page`
        : '· Instagram: no account linked to this Page yet. Link it, then run this again.',
    );

    const secrets = {
      DAYBOOK_FB_PAGE_ID: chosen.id,
      DAYBOOK_META_PAGE_TOKEN: chosen.access_token,
      DAYBOOK_META_APP_SECRET: appSecret,
      ...(ig ? { DAYBOOK_IG_USER_ID: ig.id } : {}),
    };
    if (printOnly) {
      console.log('\n--print: these are secrets. Save them, then clear your scrollback.\n');
      for (const [k, v] of Object.entries(secrets)) console.log(`  ${k}=${v}`);
      console.log('');
      return;
    }
    console.log(`\nSaving to ${repo}, environment "${envName}":`);
    ensureEnvironment();
    for (const [k, v] of Object.entries(secrets)) saveSecret(k, v);
    console.log('\nDone. The Page token does not expire; revoke it any time at');
    console.log('https://www.facebook.com/settings?tab=business_tools\n');
  } catch (err) {
    res.writeHead(500).end('Token exchange failed; see the terminal.');
    console.error('\n✗ Failed:', err?.message || err, '\n');
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

server.listen(port, () => {
  console.log(
    `\nOpening Facebook (${configId ? `Login for Business, configuration ${configId}` : 'scopes'}). ` +
      'Sign in as the account that manages the Page and approve:\n',
  );
  console.log(authUrl + '\n');
  console.log(`(Listening on ${redirectUri} for the callback…)\n`);
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  execFile(opener, [authUrl.toString()], () => {});
});
