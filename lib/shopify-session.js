import crypto from "crypto";

export class SessionAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "SessionAuthError";
  }
}

function base64UrlNormalize(input) {
  const value = String(input || "").trim();
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4 || 4)) % 4;
  return normalized + "=".repeat(paddingLength);
}

function base64UrlDecode(input) {
  return Buffer.from(base64UrlNormalize(input), "base64").toString("utf8");
}

function base64UrlToBuffer(input) {
  return Buffer.from(base64UrlNormalize(input), "base64");
}

function parseJson(input, errorMessage) {
  try {
    return JSON.parse(input);
  } catch (error) {
    throw new SessionAuthError(errorMessage);
  }
}

function isValidMyShopifyDomain(value) {
  const host = String(value || "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(host);
}

export function getSessionTokenFromRequest(request) {
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization") ||
    "";

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new SessionAuthError("Session token bulunamadı");
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    throw new SessionAuthError("Session token boş");
  }

  return token;
}

export function verifySessionToken(token) {
  const secret = process.env.SHOPIFY_CLIENT_SECRET || "";
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "";

  if (!secret) {
    throw new SessionAuthError("SHOPIFY_CLIENT_SECRET eksik");
  }

  if (!apiKey) {
    throw new SessionAuthError("NEXT_PUBLIC_SHOPIFY_API_KEY eksik");
  }

  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    throw new SessionAuthError("Geçersiz session token formatı");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const header = parseJson(
    base64UrlDecode(encodedHeader),
    "Session token header parse edilemedi"
  );

  if (String(header.alg || "") !== "HS256") {
    throw new SessionAuthError("Session token algoritması desteklenmiyor");
  }

  const data = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest();

  const actualSignature = base64UrlToBuffer(encodedSignature);

  if (
    expectedSignature.length !== actualSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, actualSignature)
  ) {
    throw new SessionAuthError("Session token imzası geçersiz");
  }

  const payload = parseJson(
    base64UrlDecode(encodedPayload),
    "Session token payload parse edilemedi"
  );

  const now = Math.floor(Date.now() / 1000);

  if (payload.nbf && Number(payload.nbf) > now) {
    throw new SessionAuthError("Session token henüz geçerli değil");
  }

  if (payload.exp && Number(payload.exp) < now) {
    throw new SessionAuthError("Session token süresi dolmuş");
  }

  const audience = payload.aud;
  const audMatches = Array.isArray(audience)
    ? audience.includes(apiKey)
    : String(audience || "") === apiKey;

  if (!audMatches) {
    throw new SessionAuthError("Session token audience geçersiz");
  }

  return payload;
}

export function getShopFromSessionTokenPayload(payload) {
  const dest = String(payload?.dest || "").trim();
  const iss = String(payload?.iss || "").trim();

  if (dest) {
    try {
      const host = new URL(dest).host.toLowerCase();
      if (isValidMyShopifyDomain(host)) {
        return host;
      }
    } catch (error) {
      // continue
    }
  }

  if (iss) {
    try {
      const url = new URL(iss);
      const shopParam = (url.searchParams.get("shop") || "").trim().toLowerCase();

      if (isValidMyShopifyDomain(shopParam)) {
        return shopParam;
      }

      const host = url.host.toLowerCase();
      if (isValidMyShopifyDomain(host)) {
        return host;
      }
    } catch (error) {
      // continue
    }
  }

  throw new SessionAuthError("Session token içinden shop bulunamadı");
}