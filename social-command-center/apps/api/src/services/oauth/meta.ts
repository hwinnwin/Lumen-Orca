import { env } from '../../config/env.js';
import { storeTokens } from '../../utils/token-manager.js';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Meta OAuth handles both Facebook and Instagram.
 * Instagram Business/Creator accounts are accessed through Facebook Pages.
 */

export function getMetaAuthUrl(state: string): string {
  const scopes = [
    'pages_show_list',
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_read_user_content',
    'instagram_basic',
    'instagram_content_publish',
    'publish_video',
    'business_management', // Required to discover pages in business portfolios (NPE pages)
  ].join(',');

  const params = new URLSearchParams({
    client_id: env.META_APP_ID,
    redirect_uri: env.META_REDIRECT_URI,
    state,
    scope: scopes,
    response_type: 'code',
    auth_type: 'rerequest',
  });

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params}`;
}

export async function handleMetaCallback(code: string, userId: string) {
  console.log('[Meta OAuth] Starting token exchange...');

  // Step 1: Exchange code for short-lived token
  const tokenUrl = `${GRAPH_BASE}/oauth/access_token?${new URLSearchParams({
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    redirect_uri: env.META_REDIRECT_URI,
    code,
  })}`;

  const tokenRes = await fetch(tokenUrl);
  if (!tokenRes.ok) {
    const error = await tokenRes.text();
    console.error('[Meta OAuth] Token exchange failed:', error);
    throw new Error(`Meta token exchange failed: ${error}`);
  }
  const tokenData = await tokenRes.json() as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
  console.log('[Meta OAuth] Short-lived token obtained');

  // Step 2: Exchange short-lived token for long-lived token (60 days)
  const longLivedUrl = `${GRAPH_BASE}/oauth/access_token?${new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    fb_exchange_token: tokenData.access_token,
  })}`;

  const longLivedRes = await fetch(longLivedUrl);
  if (!longLivedRes.ok) {
    const error = await longLivedRes.text();
    console.error('[Meta OAuth] Long-lived token exchange failed:', error);
    throw new Error(`Meta long-lived token exchange failed: ${error}`);
  }
  const longLivedData = await longLivedRes.json() as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
  console.log('[Meta OAuth] Long-lived token obtained, expires_in:', longLivedData.expires_in);

  // Step 3: Fetch user profile
  const meRes = await fetch(`${GRAPH_BASE}/me?fields=id,name&access_token=${longLivedData.access_token}`);
  const meData = await meRes.json() as { id: string; name: string };
  console.log('[Meta OAuth] User profile:', meData.name, `(${meData.id})`);

  // Step 3.5: Check what permissions were actually granted
  const permsRes = await fetch(`${GRAPH_BASE}/me/permissions?access_token=${longLivedData.access_token}`);
  const permsData = await permsRes.json() as { data: Array<{ permission: string; status: string }> };
  console.log('[Meta OAuth] Granted permissions:', JSON.stringify(permsData.data));

  // Step 4: Fetch user's Facebook Pages
  const pagesUrl = `${GRAPH_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longLivedData.access_token}`;
  console.log('[Meta OAuth] Fetching pages from:', pagesUrl.replace(longLivedData.access_token, 'TOKEN_HIDDEN'));
  const pagesRes = await fetch(pagesUrl);
  const pagesRaw = await pagesRes.text();
  console.log('[Meta OAuth] Raw /me/accounts response:', pagesRaw);
  const pagesData = JSON.parse(pagesRaw) as {
    data: Array<{
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: { id: string };
    }>;
  };
  console.log('[Meta OAuth] Pages found:', pagesData.data?.length || 0,
    pagesData.data?.map(p => `${p.name} (IG: ${p.instagram_business_account ? 'yes' : 'no'})`).join(', '));

  // Step 4.5: Fallback — if no page from /me/accounts has instagram_business_account,
  // check user's business portfolios for additional pages (handles "New Pages Experience" pages
  // that don't appear in /me/accounts but are accessible via business portfolios).
  if (!pagesData.data?.find(p => p.instagram_business_account)) {
    console.log('[Meta OAuth] No IG found on /me/accounts pages. Checking business portfolios...');
    try {
      const bizRes = await fetch(`${GRAPH_BASE}/me/businesses?access_token=${longLivedData.access_token}`);
      const bizData = await bizRes.json() as { data?: Array<{ id: string; name: string }> };
      console.log('[Meta OAuth] Businesses found:', bizData.data?.length || 0,
        bizData.data?.map(b => `${b.name} (${b.id})`).join(', '));

      if (bizData.data?.length) {
        for (const biz of bizData.data) {
          const bizPagesRes = await fetch(
            `${GRAPH_BASE}/${biz.id}/owned_pages?fields=id,name,access_token,instagram_business_account&access_token=${longLivedData.access_token}`
          );
          const bizPagesData = await bizPagesRes.json() as { data?: typeof pagesData.data };
          console.log(`[Meta OAuth] Business "${biz.name}" owned pages:`, bizPagesData.data?.length || 0);

          if (bizPagesData.data) {
            for (const page of bizPagesData.data) {
              if (!pagesData.data.find(p => p.id === page.id)) {
                console.log(`[Meta OAuth] Adding business page: ${page.name} (${page.id}) IG: ${page.instagram_business_account ? 'yes' : 'no'}`);
                pagesData.data.push(page);
              }
            }
          }
        }
      }
    } catch (bizErr) {
      console.log('[Meta OAuth] Business portfolio fallback failed (non-fatal):', bizErr);
    }
  }

  const results = [];

  // Store Facebook connection using the PAGE access token (not user token).
  // Publishing to a Page requires pages_manage_posts + pages_read_engagement with a page token.
  if (pagesData.data?.length > 0) {
    const primaryPage = pagesData.data[0];
    const fbConnection = await storeTokens({
      userId,
      platform: 'FACEBOOK',
      accessToken: primaryPage.access_token, // Page token, not user token
      expiresIn: longLivedData.expires_in,
      platformUserId: meData.id,
      platformName: `${meData.name} - ${primaryPage.name}`,
      platformPageId: primaryPage.id,
      scopes: ['pages_manage_posts', 'pages_read_engagement', 'publish_video'],
    });
    results.push(fbConnection);
    console.log('[Meta OAuth] Facebook connection stored with PAGE token for:', primaryPage.name, `(${primaryPage.id})`);
  } else {
    console.log('[Meta OAuth] No Facebook Pages found — skipping FB connection');
  }

  // If there's an Instagram Business account linked, store that connection too
  // Use the Page access token for Instagram publishing
  const pageWithIg = pagesData.data?.find(p => p.instagram_business_account);
  if (pageWithIg && pageWithIg.instagram_business_account) {
    const igConnection = await storeTokens({
      userId,
      platform: 'INSTAGRAM',
      accessToken: pageWithIg.access_token, // Page access token
      expiresIn: longLivedData.expires_in,
      platformUserId: pageWithIg.instagram_business_account.id,
      platformPageId: pageWithIg.id,
      platformName: `${meData.name} (IG)`,
      scopes: ['instagram_basic', 'instagram_content_publish'],
    });
    results.push(igConnection);
    console.log('[Meta OAuth] Instagram connection stored, IG account:', pageWithIg.instagram_business_account.id);
  } else {
    console.log('[Meta OAuth] No Instagram Business account found on any Page');
  }

  console.log('[Meta OAuth] Complete! Connections stored:', results.length);
  return results;
}

export async function refreshMetaToken(accessToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const url = `${GRAPH_BASE}/oauth/access_token?${new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    fb_exchange_token: accessToken,
  })}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Meta token refresh failed: ${await res.text()}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}
