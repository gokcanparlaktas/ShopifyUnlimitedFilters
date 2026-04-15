"use client";

import createApp from "@shopify/app-bridge";
import { getSessionToken } from "@shopify/app-bridge/utilities";

let appInstance = null;

export function getShopifyHostFromUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("host") || "";
}

export function getShopFromUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("shop") || "";
}

export function getAppBridge() {
  if (appInstance) {
    return appInstance;
  }

  if (typeof window === "undefined") {
    throw new Error("App Bridge sadece browser ortamında başlatılabilir");
  }

  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "";
  const host = getShopifyHostFromUrl();

  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_SHOPIFY_API_KEY eksik");
  }

  if (!host) {
    throw new Error("URL içinde host parametresi bulunamadı");
  }

  appInstance = createApp({
    apiKey,
    host,
    forceRedirect: true,
  });

  return appInstance;
}

export async function getFreshSessionToken() {
  const app = getAppBridge();
  const token = await getSessionToken(app);

  if (!token) {
    throw new Error("Session token alınamadı");
  }

  return token;
}