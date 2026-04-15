const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
export async function getAdminAccessToken(shopDomain) {
  if (!shopDomain) {
    throw new Error("shopDomain gerekli");
  }

  const form = new URLSearchParams();
  form.set("grant_type", "client_credentials");
  form.set("client_id", CLIENT_ID || "");
  form.set("client_secret", CLIENT_SECRET || "");

  const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Admin token alınamadı: ${response.status} ${text}`);
  }

  const json = await response.json();
  return json.access_token;
}

export async function adminGraphQL(shopDomain, query, variables = {}) {
  if (!shopDomain) {
    throw new Error("shopDomain gerekli");
  }

  const accessToken = await getAdminAccessToken(shopDomain);

  const response = await fetch(`https://${shopDomain}/admin/api/2026-04/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(`Admin GraphQL HTTP hatası: ${response.status}`);
  }

  if (json.errors) {
    throw new Error(`Admin GraphQL hatası: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}