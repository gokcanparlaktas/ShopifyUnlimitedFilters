import { adminGraphQL } from "../../../lib/shopify-admin";
import { metafieldDefinitionToFilter } from "../../../lib/filter-mappers";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");

  if (!shop) {
    return Response.json(
      {
        ok: false,
        error: "shop parametresi gerekli"
      },
      { status: 400 }
    );
  }

  const query = `
    query ProductMetafieldDefinitions {
      metafieldDefinitions(first: 100, ownerType: PRODUCT) {
        nodes {
          id
          name
          namespace
          key
          description
          type {
            name
            category
          }
        }
      }
    }
  `;

  try {
    const data = await adminGraphQL(shop, query);

    const nodes = data?.metafieldDefinitions?.nodes || [];

    const definitions = nodes.map((item, index) => ({
      id: item.id,
      name: item.name,
      namespace: item.namespace,
      key: item.key,
      description: item.description || "",
      type: item.type?.name || "",
      category: item.type?.category || "",
      suggestedFilter: metafieldDefinitionToFilter(
        {
          name: item.name,
          namespace: item.namespace,
          key: item.key,
          type: item.type?.name || "",
          category: item.type?.category || ""
        },
        index + 1
      )
    }));

    return Response.json({
      ok: true,
      definitions
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}