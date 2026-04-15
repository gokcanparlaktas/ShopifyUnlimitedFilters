import { adminGraphQL } from "../../../lib/shopify-admin-storefront";

const NAMESPACE = "unlimited_filters";
const KEY = "config";

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

function isValidShopDomain(shop) {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(String(shop || "").trim());
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

export async function GET(request) {
  try {
    const shop = request.nextUrl.searchParams.get("shop") || "";

    if (!isValidShopDomain(shop)) {
      return Response.json(
        {
          ok: false,
          error: "Geçersiz shop parametresi",
        },
        { status: 400 }
      );
    }

    const query = `
      query GetShopConfig {
        shop {
          metafield(namespace: "${NAMESPACE}", key: "${KEY}") {
            value
          }
        }
      }
    `;

    const data = await adminGraphQL(shop, query);
    const existingConfigValue = data?.shop?.metafield?.value || "";
    const config = parseStoredConfig(existingConfigValue);

    return Response.json({
      ok: true,
      config,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error?.message || "Config alınamadı",
      },
      { status: 500 }
    );
  }
}