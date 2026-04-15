"use client";

import { getFreshSessionToken } from "./shopify-app-bridge";

export async function authenticatedFetch(url, options = {}) {
  const token = await getFreshSessionToken();

  if (!token) {
    throw new Error("Session token alınamadı");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, {
    ...options,
    headers,
  });
}