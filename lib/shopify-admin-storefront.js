const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const ADMIN_API_VERSION = "2026-04";

function ensureMyShopifyDomain(shopDomain) {
  const shop = String(shopDomain || "").trim().toLowerCase();

  if (!shop) {
    throw new Error("shopDomain gerekli");
  }

  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop)) {
    throw new Error("Geçersiz shopDomain");
  }

  return shop;
}

export async function getAdminAccessToken(shopDomain) {
  const shop = ensureMyShopifyDomain(shopDomain);

  if (!CLIENT_ID) {
    throw new Error("SHOPIFY_CLIENT_ID eksik");
  }

  if (!CLIENT_SECRET) {
    throw new Error("SHOPIFY_CLIENT_SECRET eksik");
  }

  const form = new URLSearchParams();
  form.set("grant_type", "client_credentials");
  form.set("client_id", CLIENT_ID);
  form.set("client_secret", CLIENT_SECRET);

  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: form.toString(),
    cache: "no-store",
  });

  const text = await response.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`Admin token cevabı parse edilemedi: ${response.status} ${text}`);
  }

  if (!response.ok) {
    throw new Error(
      `Admin token alınamadı: ${response.status} ${json?.error_description || json?.error || text}`
    );
  }

  if (!json?.access_token) {
    throw new Error("Admin access token bulunamadı");
  }

  return json.access_token;
}

export async function adminGraphQL(shopDomain, query, variables = {}) {
  const shop = ensureMyShopifyDomain(shopDomain);
  const accessToken = await getAdminAccessToken(shop);

  const response = await fetch(`https://${shop}/admin/api/${ADMIN_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const text = await response.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`Admin GraphQL cevabı parse edilemedi: ${response.status} ${text}`);
  }

  if (!response.ok) {
    throw new Error(`Admin GraphQL HTTP hatası: ${response.status}`);
  }

  if (json?.errors?.length) {
    throw new Error(`Admin GraphQL hatası: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}