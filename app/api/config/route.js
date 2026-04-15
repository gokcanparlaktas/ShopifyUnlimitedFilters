import { adminGraphQL } from "../../../lib/shopify-admin";
import {
  getSessionTokenFromRequest,
  verifySessionToken,
  getShopFromSessionTokenPayload,
  SessionAuthError,
} from "../../../lib/shopify-session";

const NAMESPACE = "unlimited_filters";
const KEY = "config";

function buildCorsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function getAuthenticatedSession(request) {
  const token = getSessionTokenFromRequest(request);
  const payload = verifySessionToken(token);
  const shop = getShopFromSessionTokenPayload(payload);

  return { shop, sessionToken: token };
}

function isAuthError(error) {
  return error instanceof SessionAuthError;
}

function getDefaultConfig() {
  return {
    enabled: true,
    showSorting: true,
    grid: {
      mobile: 2,
      tablet: 3,
      desktop: 4,
    },
    filters: [],
  };
}

async function getShopData(shop, sessionToken) {
  const query = `
    query GetShopData {
      shop {
        id
        metafield(namespace: "${NAMESPACE}", key: "${KEY}") {
          value
        }
      }
    }
  `;

  const data = await adminGraphQL(shop, sessionToken, query);

  return {
    shopId: data?.shop?.id || "",
    existingConfigValue: data?.shop?.metafield?.value || "",
  };
}

function parseStoredConfig(existingConfigValue) {
  if (!existingConfigValue) {
    return getDefaultConfig();
  }

  try {
    const parsed = JSON.parse(existingConfigValue);

    return {
      enabled: parsed?.enabled ?? true,
      showSorting: parsed?.showSorting ?? true,
      grid: parsed?.grid || {
        mobile: 2,
        tablet: 3,
        desktop: 4,
      },
      filters: Array.isArray(parsed?.filters) ? parsed.filters : [],
    };
  } catch (error) {
    return getDefaultConfig();
  }
}

export async function OPTIONS(request) {
  const origin = request.headers.get("origin");

  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(origin),
  });
}

export async function GET(request) {
  const origin = request.headers.get("origin");

  try {
    const { shop, sessionToken } = getAuthenticatedSession(request);
    const { existingConfigValue } = await getShopData(shop, sessionToken);
    const config = parseStoredConfig(existingConfigValue);

    return Response.json(
      {
        ok: true,
        config,
      },
      {
        headers: buildCorsHeaders(origin),
      }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error?.message || "Config alınamadı",
      },
      {
        status: isAuthError(error) ? 401 : 500,
        headers: buildCorsHeaders(origin),
      }
    );
  }
}

export async function POST(request) {
  const origin = request.headers.get("origin");

  try {
    const { shop, sessionToken } = getAuthenticatedSession(request);
    const body = await request.json();

    const config = {
      enabled: body?.enabled ?? true,
      showSorting: body?.showSorting ?? true,
      grid: body?.grid || {
        mobile: 2,
        tablet: 3,
        desktop: 4,
      },
      filters: Array.isArray(body?.filters) ? body.filters : [],
    };

    const { shopId } = await getShopData(shop, sessionToken);

    if (!shopId) {
      throw new Error("shop.id alınamadı");
    }

    const query = `
      mutation SaveShopConfig($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      metafields: [
        {
          ownerId: shopId,
          namespace: NAMESPACE,
          key: KEY,
          type: "json",
          value: JSON.stringify(config),
        },
      ],
    };

    const data = await adminGraphQL(shop, sessionToken, query, variables);
    const userErrors = data?.metafieldsSet?.userErrors || [];

    if (userErrors.length > 0) {
      throw new Error(userErrors[0]?.message || "Config kaydedilemedi");
    }

    return Response.json(
      {
        ok: true,
        config,
      },
      {
        headers: buildCorsHeaders(origin),
      }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error?.message || "Config kaydedilemedi",
      },
      {
        status: isAuthError(error) ? 401 : 500,
        headers: buildCorsHeaders(origin),
      }
    );
  }
}