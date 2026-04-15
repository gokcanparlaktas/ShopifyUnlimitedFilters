import { adminGraphQL } from "../../../lib/shopify-admin";
import { metafieldDefinitionToFilter } from "../../../lib/filter-mappers";
import {
  getSessionTokenFromRequest,
  verifySessionToken,
  getShopFromSessionTokenPayload,
  SessionAuthError,
} from "../../../lib/shopify-session";

function getAuthenticatedSession(request) {
  const token = getSessionTokenFromRequest(request);
  const payload = verifySessionToken(token);
  const shop = getShopFromSessionTokenPayload(payload);

  return { shop, sessionToken: token };
}

function isAuthError(error) {
  return error instanceof SessionAuthError;
}

export async function GET(request) {
  try {
    const { shop, sessionToken } = getAuthenticatedSession(request);

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

    const data = await adminGraphQL(shop, sessionToken, query);
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
          category: item.type?.category || "",
        },
        index + 1
      ),
    }));

    return Response.json({
      ok: true,
      definitions,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error?.message || "Metafield definitions alınamadı",
      },
      {
        status: isAuthError(error) ? 401 : 500,
      }
    );
  }
}