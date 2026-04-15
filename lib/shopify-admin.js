const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || "";
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || "";
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

function ensureSessionToken(sessionToken) {
  const token = String(sessionToken || "").trim();

  if (!token) {
    throw new Error("Session token gerekli");
  }

  return token;
}

export async function getAdminAccessToken(shopDomain, sessionToken) {
  const shop = ensureMyShopifyDomain(shopDomain);
  const token = ensureSessionToken(sessionToken);

  if (!CLIENT_ID) {
    throw new Error("SHOPIFY_CLIENT_ID eksik");
  }

  if (!CLIENT_SECRET) {
    throw new Error("SHOPIFY_CLIENT_SECRET eksik");
  }

  const form = new URLSearchParams();
  form.set("client_id", CLIENT_ID);
  form.set("client_secret", CLIENT_SECRET);
  form.set("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange");
  form.set("subject_token", token);
  form.set("subject_token_type", "urn:ietf:params:oauth:token-type:id_token");
  form.set(
    "requested_token_type",
    "urn:shopify:params:oauth:token-type:online-access-token"
  );

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
    throw new Error(
      `Admin token cevabı parse edilemedi: ${response.status} ${text || ""}`.trim()
    );
  }

  if (!response.ok) {
    throw new Error(
      `Admin token alınamadı: ${response.status} ${
        json?.error_description || json?.error || text || "Bilinmeyen hata"
      }`
    );
  }

  if (!json?.access_token) {
    throw new Error("Admin access token response içinde access_token yok");
  }

  return json.access_token;
}

export async function adminGraphQL(shopDomain, sessionToken, query, variables = {}) {
  const shop = ensureMyShopifyDomain(shopDomain);
  const accessToken = await getAdminAccessToken(shop, sessionToken);

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
    throw new Error(
      `Admin GraphQL cevabı parse edilemedi: ${response.status} ${text || ""}`.trim()
    );
  }

  if (!response.ok) {
    throw new Error(
      `Admin GraphQL HTTP hatası: ${response.status} ${
        json?.errors ? JSON.stringify(json.errors) : text || ""
      }`.trim()
    );
  }

  if (json?.errors?.length) {
    throw new Error(`Admin GraphQL hatası: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}