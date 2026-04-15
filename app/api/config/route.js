import { adminGraphQL } from "../../../lib/shopify-admin";

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

async function getShopId(shop) {
  const query = `
    query GetShopId {
      shop {
        id
        metafield(namespace: "${NAMESPACE}", key: "${KEY}") {
          value
        }
      }
    }
  `;

  const data = await adminGraphQL(shop, query);

  return {
    shopId: data?.shop?.id || "",
    existingConfigValue: data?.shop?.metafield?.value || "",
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");

  if (!shop) {
    return Response.json(
      {
        ok: false,
        error: "shop parametresi gerekli",
      },
      { status: 400 }
    );
  }

  try {
    const { existingConfigValue } = await getShopId(shop);

    if (!existingConfigValue) {
      return Response.json({
        ok: true,
        config: getDefaultConfig(),
      });
    }

    return Response.json({
      ok: true,
      config: JSON.parse(existingConfigValue),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");

  if (!shop) {
    return Response.json(
      {
        ok: false,
        error: "shop parametresi gerekli",
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const config = {
      enabled: body.enabled ?? true,
      showSorting: body.showSorting ?? true,
      grid: body.grid || {
        mobile: 2,
        tablet: 3,
        desktop: 4,
      },
      filters: Array.isArray(body.filters) ? body.filters : [],
    };

    const { shopId } = await getShopId(shop);

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

    const data = await adminGraphQL(shop, query, variables);
    const userErrors = data?.metafieldsSet?.userErrors || [];

    if (userErrors.length > 0) {
      throw new Error(userErrors[0].message || "Config kaydedilemedi");
    }

    return Response.json({
      ok: true,
      config,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}