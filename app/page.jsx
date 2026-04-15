"use client";

import { useEffect, useState } from "react";
import { STANDARD_FILTER_LIBRARY } from "../lib/standard-filters";
import { authenticatedFetch } from "../lib/authenticated-fetch";
import { getShopFromUrl } from "../lib/shopify-app-bridge";

const STRINGS = {
  en: {
    brandTitle: "Unlimited Filters",
    slogan: "Go beyond limits—filter your way.",
    loading: "Loading…",
    shopMissing: "Store context could not be detected. Open the app from Shopify Admin.",
    embeddedRequired:
      "This app must be opened inside Shopify Admin so a valid session token can be created.",
    genericError: "Something went wrong.",
    definitionsFailed: "Could not load metafield definitions.",
    configLoadFailed: "Could not load saved configuration.",
    configSaveFailed: "Could not save configuration.",
    saveSuccess: "Configuration saved.",
    unauthorized:
      "Authentication failed. Reopen the app from Shopify Admin and try again.",
    tabStandard: "Standard filters",
    tabCustom: "Custom metafields",
    searchLabel: "Search",
    placeholderStandard: "Name, key, or type…",
    placeholderCustom: "Name, namespace, key, or type…",
    emptyStandardSearch: "No standard filters match your search.",
    emptyCustomNone: "No custom metafield definitions found.",
    emptyCustomSearch: "No metafields match your search.",
    added: "Added",
    addFilter: "Add filter",
    typeLabel: "Type",
    selectedTitle: "Selected filters",
    selectedHint: "Review the list before saving.",
    noneSelected: "No filters selected yet.",
    remove: "Remove",
    saving: "Saving…",
    save: "Save configuration",
    backToShop: "Back to Shopify",
    moveUp: "Move up",
    moveDown: "Move down",
  },
  tr: {
    brandTitle: "Unlimited Filters",
    slogan: "Sınırları aşın, istediğiniz gibi filtreleyin.",
    loading: "Yükleniyor…",
    shopMissing: "Mağaza bağlamı algılanamadı. Uygulamayı Shopify Admin içinden açın.",
    embeddedRequired:
      "Bu uygulama geçerli session token üretebilmek için Shopify Admin içinde açılmalıdır.",
    genericError: "Bir hata oluştu.",
    definitionsFailed: "Metafield tanımları alınamadı.",
    configLoadFailed: "Kayıtlı yapılandırma alınamadı.",
    configSaveFailed: "Yapılandırma kaydedilemedi.",
    saveSuccess: "Yapılandırma kaydedildi.",
    unauthorized:
      "Kimlik doğrulama başarısız oldu. Uygulamayı Shopify Admin içinden yeniden açıp tekrar deneyin.",
    tabStandard: "Standart filtreler",
    tabCustom: "Özel metafieldlar",
    searchLabel: "Ara",
    placeholderStandard: "İsim, anahtar veya tip…",
    placeholderCustom: "İsim, namespace, anahtar veya tip…",
    emptyStandardSearch: "Aramanızla eşleşen standart filtre yok.",
    emptyCustomNone: "Özel metafield tanımı bulunamadı.",
    emptyCustomSearch: "Aramanızla eşleşen metafield yok.",
    added: "Eklendi",
    addFilter: "Filtre ekle",
    typeLabel: "Tip",
    selectedTitle: "Seçilen filtreler",
    selectedHint: "Kaydetmeden önce listeyi gözden geçirin.",
    noneSelected: "Henüz filtre seçilmedi.",
    remove: "Kaldır",
    saving: "Kaydediliyor…",
    save: "Yapılandırmayı kaydet",
    backToShop: "Mağazaya dön",
    moveUp: "Yukarı al",
    moveDown: "Aşağı al",
  },
};

function detectUiLang() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "en";
  }

  const list =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  for (let i = 0; i < list.length; i++) {
    const code = String(list[i] || "").toLowerCase();
    if (code.startsWith("tr")) {
      return "tr";
    }
  }

  return "en";
}

async function readJsonSafely(response, fallbackMessage) {
  const text = await response.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(text || fallbackMessage);
  }

  if (!response.ok) {
    throw new Error(json?.error || fallbackMessage);
  }

  return json;
}

function normalizeErrorMessage(error, locale) {
  const L = STRINGS[locale] || STRINGS.en;
  const message = String(error?.message || "").trim();

  if (!message) {
    return L.genericError;
  }

  const lower = message.toLowerCase();

  if (
    lower.includes("session token") ||
    lower.includes("authorization") ||
    lower.includes("unauthorized") ||
    lower.includes("401") ||
    lower.includes("forbidden") ||
    lower.includes("403")
  ) {
    return L.unauthorized;
  }

  if (
    lower.includes("host parametresi") ||
    lower.includes("shopify admin") ||
    lower.includes("embedded")
  ) {
    return L.embeddedRequired;
  }

  return message;
}

const t = {
  navBg: "#011E88",
  navBorder: "rgba(255,255,255,0.12)",
  pageBg: "#f1f5f9",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "rgba(1, 30, 136, 0.1)",
  borderStrong: "rgba(1, 30, 136, 0.16)",
  text: "#0f172a",
  textMuted: "#64748b",
  accent: "#011E88",
  accentHover: "#0a2ba8",
  radiusLg: 14,
  radiusMd: 10,
  radiusSm: 8,
  shadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
  shadowSm: "0 1px 2px rgba(15, 23, 42, 0.05)",
  font: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const FILTER_FIELD_KEY_LABELS = {
  vendor: { en: "Vendor", tr: "Satıcı / Marka" },
  availableForSale: { en: "Availability", tr: "Stok Durumu" },
  available_for_sale: { en: "Availability", tr: "Stok Durumu" },
  price: { en: "Price", tr: "Fiyat" },
  compareAtPrice: { en: "Compare-at Price", tr: "Karşılaştırma Fiyatı" },
  tags: { en: "Tags", tr: "Etiketler" },
  option1: { en: "Variant Option 1", tr: "Varyant Seçeneği 1" },
  option2: { en: "Variant Option 2", tr: "Varyant Seçeneği 2" },
  option3: { en: "Variant Option 3", tr: "Varyant Seçeneği 3" },
  productType: { en: "Product Type", tr: "Ürün Türü" },
  product_type: { en: "Product Type", tr: "Ürün Türü" },
  title: { en: "Title", tr: "Başlık" },
  handle: { en: "Handle", tr: "URL Deseni" },
  sku: { en: "SKU", tr: "Stok Kodu" },
  barcode: { en: "Barcode", tr: "Barkod" },
  createdAt: { en: "Created At", tr: "Oluşturulma" },
  updatedAt: { en: "Updated At", tr: "Güncellenme" },
  publishedAt: { en: "Published At", tr: "Yayınlanma" },
};

export default function HomePage() {
  const [definitions, setDefinitions] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [shop, setShop] = useState("");
  const [activeTab, setActiveTab] = useState("standard");
  const [filterSearch, setFilterSearch] = useState("");
  const [uiLocale, setUiLocale] = useState("en");
  const [draggingFilterId, setDraggingFilterId] = useState(null);
  const [dragOverFilterId, setDragOverFilterId] = useState(null);

  useEffect(function () {
    const locale = detectUiLang();
    setUiLocale(locale);

    try {
      const shopParam = getShopFromUrl().trim();
      setShop(shopParam);
    } catch (error) {
      setShop("");
    }
  }, []);

  useEffect(function () {
    document.documentElement.lang = uiLocale === "tr" ? "tr" : "en";
  }, [uiLocale]);

  useEffect(function () {
    let cancelled = false;

    async function initPage() {
      const L = STRINGS[uiLocale] || STRINGS.en;

      try {
        setLoading(true);
        setError("");
        setSaveMessage("");

        const definitionsResponse = await authenticatedFetch("/api/metafield-definitions", {
          cache: "no-store",
        });

        const definitionsJson = await readJsonSafely(
          definitionsResponse,
          L.definitionsFailed
        );

        if (!definitionsJson.ok) {
          throw new Error(definitionsJson.error || L.definitionsFailed);
        }

        const configResponse = await authenticatedFetch("/api/config", {
          cache: "no-store",
        });

        const configJson = await readJsonSafely(configResponse, L.configLoadFailed);

        if (!configJson.ok) {
          throw new Error(configJson.error || L.configLoadFailed);
        }

        if (cancelled) {
          return;
        }

        setDefinitions(
          Array.isArray(definitionsJson.definitions) ? definitionsJson.definitions : []
        );

        const filters = Array.isArray(configJson.config?.filters)
          ? configJson.config.filters
          : [];

        setSelectedFilters(filters);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(normalizeErrorMessage(err, uiLocale));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initPage();

    return function () {
      cancelled = true;
    };
  }, [uiLocale]);

  function goBackToShopify() {
    if (!shop) {
      return;
    }

    const target = `https://${shop}/admin`;

    try {
      if (window.top && window.top !== window) {
        window.top.location.href = target;
        return;
      }
    } catch (error) {
      // ignore and fall back
    }

    window.location.href = target;
  }

  function formatShopName(shopDomain) {
    const raw = String(shopDomain || "").trim().toLowerCase();
    if (!raw) {
      return "";
    }

    const base = raw.endsWith(".myshopify.com")
      ? raw.slice(0, -".myshopify.com".length)
      : raw.split(".")[0];

    const cleaned = base
      .replace(/^https?:\/\//, "")
      .replace(/[^a-z0-9-]+/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!cleaned) {
      return shopDomain;
    }

    return cleaned
      .split("-")
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }

  function getFilterLabel(filter) {
    if (filter.labels && filter.labels[uiLocale]) {
      return filter.labels[uiLocale];
    }

    if (filter.labels && filter.labels.en) {
      return filter.labels.en;
    }

    if (filter.labels && filter.labels.tr) {
      return filter.labels.tr;
    }

    return filter.labelKey || filter.label || filter.key;
  }

  function formatType(rawType) {
    const input = String(rawType || "").trim();
    if (!input) {
      return "";
    }

    const base = input.split("(")[0].trim().toLowerCase();

    const map = {
      single_line_text_field: { en: "Text", tr: "Metin" },
      multi_line_text_field: { en: "Text", tr: "Metin" },
      rich_text_field: { en: "Rich text", tr: "Zengin metin" },
      list: { en: "List", tr: "Liste" },
      number_integer: { en: "Number", tr: "Sayı" },
      number_decimal: { en: "Number", tr: "Sayı" },
      boolean: { en: "Boolean", tr: "Evet / Hayır" },
      date: { en: "Date", tr: "Tarih" },
      date_time: { en: "Date & time", tr: "Tarih / Saat" },
      color: { en: "Color", tr: "Renk" },
      weight: { en: "Weight", tr: "Ağırlık" },
      volume: { en: "Volume", tr: "Hacim" },
      dimension: { en: "Dimension", tr: "Boyut" },
      rating: { en: "Rating", tr: "Puan" },
      money: { en: "Money", tr: "Para" },
      url: { en: "URL", tr: "Bağlantı" },
      json: { en: "JSON", tr: "JSON" },
      price: { en: "Price", tr: "Fiyat" },
      range: { en: "Range", tr: "Aralık" },
    };

    const pick = function (token) {
      const clean = String(token || "").trim().toLowerCase();
      if (map[clean]) {
        return map[clean][uiLocale] || map[clean].en;
      }
      const readable = clean.replace(/_/g, " ").replace(/\./g, " · ").trim();
      return readable ? readable.charAt(0).toUpperCase() + readable.slice(1) : "";
    };

    if (base.startsWith("list.")) {
      const inner = base.slice("list.".length);
      const listLabel = uiLocale === "tr" ? "liste" : "list";
      const listTitle = listLabel
        ? listLabel.charAt(0).toUpperCase() + listLabel.slice(1)
        : "";
      return `${listTitle} · ${pick(inner)}`;
    }

    return pick(base);
  }

  function formatFilterFieldKey(key) {
    const k = String(key || "").trim();
    if (!k) {
      return "";
    }

    if (FILTER_FIELD_KEY_LABELS[k]) {
      return FILTER_FIELD_KEY_LABELS[k][uiLocale] || FILTER_FIELD_KEY_LABELS[k].en;
    }

    let s = k.replace(/_/g, " ");
    s = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    s = s.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");

    const lowered = s.toLowerCase().trim();
    if (!lowered) {
      return "";
    }

    return lowered
      .split(" ")
      .map(function (part) {
        if (!part) return part;
        if (part === "/" || part === "·") return part;
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }

  function addFilter(definition) {
    const filter = definition.suggestedFilter;

    setSelectedFilters(function (prev) {
      const alreadyExists = prev.some(function (item) {
        return item.id === filter.id;
      });

      if (alreadyExists) {
        return prev;
      }

      return prev.concat({
        ...filter,
        sortOrder: prev.length + 1,
      });
    });
  }

  function removeFilter(filterId) {
    setSelectedFilters(function (prev) {
      return prev
        .filter(function (item) {
          return item.id !== filterId;
        })
        .map(function (item, index) {
          return {
            ...item,
            sortOrder: index + 1,
          };
        });
    });
  }

  function reorderSelectedFilters(fromId, toId) {
    if (!fromId || !toId || fromId === toId) {
      return;
    }

    setSelectedFilters(function (prev) {
      const fromIndex = prev.findIndex(function (f) {
        return f.id === fromId;
      });
      const toIndex = prev.findIndex(function (f) {
        return f.id === toId;
      });

      if (fromIndex < 0 || toIndex < 0) {
        return prev;
      }

      const next = prev.slice();
      const moved = next.splice(fromIndex, 1)[0];
      next.splice(toIndex, 0, moved);

      return next.map(function (item, index) {
        return { ...item, sortOrder: index + 1 };
      });
    });
  }

  function moveSelectedFilterBy(filterId, delta) {
    if (!filterId || !delta) {
      return;
    }

    setSelectedFilters(function (prev) {
      const fromIndex = prev.findIndex(function (f) {
        return f.id === filterId;
      });

      if (fromIndex < 0) {
        return prev;
      }

      const toIndex = Math.max(0, Math.min(prev.length - 1, fromIndex + delta));
      if (toIndex === fromIndex) {
        return prev;
      }

      const next = prev.slice();
      const moved = next.splice(fromIndex, 1)[0];
      next.splice(toIndex, 0, moved);

      return next.map(function (item, index) {
        return { ...item, sortOrder: index + 1 };
      });
    });
  }

  async function saveConfig() {
    const L = STRINGS[uiLocale] || STRINGS.en;

    try {
      setSaving(true);
      setSaveMessage("");

      const response = await authenticatedFetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: true,
          showSorting: true,
          grid: {
            mobile: 2,
            tablet: 3,
            desktop: 4,
          },
          filters: selectedFilters,
        }),
      });

      const json = await readJsonSafely(response, L.configSaveFailed);

      if (!json.ok) {
        throw new Error(json.error || L.configSaveFailed);
      }

      setSaveMessage(L.saveSuccess);
    } catch (err) {
      setSaveMessage(normalizeErrorMessage(err, uiLocale));
    } finally {
      setSaving(false);
    }
  }

  const searchQ = filterSearch.trim().toLowerCase();

  function standardFilterMatches(filter) {
    if (!searchQ) {
      return true;
    }

    const label = getFilterLabel(filter).toLowerCase();

    return (
      label.includes(searchQ) ||
      String(filter.key || "").toLowerCase().includes(searchQ) ||
      String(formatFilterFieldKey(filter.key) || "").toLowerCase().includes(searchQ) ||
      String(filter.type || "").toLowerCase().includes(searchQ)
    );
  }

  function definitionMatches(item) {
    if (!searchQ) {
      return true;
    }

    const blob = [
      item.name,
      item.namespace,
      item.key,
      formatFilterFieldKey(item.key),
      item.type,
      item.category,
      item.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return blob.includes(searchQ);
  }

  const standardFiltered = STANDARD_FILTER_LIBRARY.filter(standardFilterMatches);
  const definitionsFiltered = definitions.filter(definitionMatches);

  const panel = {
    background: t.surface,
    borderRadius: t.radiusLg,
    border: `1px solid ${t.border}`,
    boxShadow: t.shadow,
    padding: 22,
  };

  const card = {
    border: `1px solid ${t.border}`,
    borderRadius: t.radiusMd,
    padding: 14,
    background: t.surfaceMuted,
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  };

  const btnPrimary = {
    marginTop: 10,
    minHeight: 38,
    padding: "0 16px",
    borderRadius: t.radiusSm,
    border: "none",
    background: t.accent,
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: t.font,
    boxShadow: "0 1px 2px rgba(1, 30, 136, 0.2)",
  };

  const btnGhost = {
    marginTop: 8,
    minHeight: 34,
    padding: "0 12px",
    borderRadius: t.radiusSm,
    border: `1px solid ${t.borderStrong}`,
    background: t.surface,
    color: t.text,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: t.font,
  };

  const tabBtnBase = {
    flex: 1,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: t.font,
    cursor: "pointer",
    border: "none",
    borderRadius: t.radiusSm,
    transition: "background 0.15s ease, color 0.15s ease",
  };

  const C = STRINGS[uiLocale] || STRINGS.en;
  const saveMsgOk =
    saveMessage === STRINGS.en.saveSuccess || saveMessage === STRINGS.tr.saveSuccess;

  return (
    <>
      <style>{`
        @keyframes uf-pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }

        @media (max-width: 520px) {
          .uf-nav-inner {
            flex-wrap: wrap;
            gap: 10px;
            padding: 12px 14px !important;
          }
          .uf-back-btn {
            height: 36px !important;
            padding: 0 10px !important;
            border-radius: 10px !important;
            flex: 0 0 auto;
          }
          .uf-logo-box {
            width: 52px !important;
            height: 52px !important;
            border-radius: 12px !important;
            padding: 2px !important;
          }
          .uf-logo-img {
            width: 48px !important;
            height: 48px !important;
          }
          .uf-brand {
            min-width: 0;
            flex: 1 1 220px;
          }
          .uf-brand-title {
            font-size: 16px !important;
          }
          .uf-brand-slogan {
            font-size: 12px !important;
          }
          .uf-shop-pill {
            display: none !important;
          }
          .uf-page-wrap {
            padding: 16px 14px 28px !important;
          }
          .uf-aside {
            position: static !important;
            top: auto !important;
          }
          .uf-reorder-buttons {
            display: inline-flex !important;
          }
        }

        .uf-reorder-buttons {
          display: none;
        }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          margin: 0,
          padding: 0,
          fontFamily: t.font,
          color: t.text,
          background: t.pageBg,
          boxSizing: "border-box",
        }}
      >
        <nav
          style={{
            width: "100%",
            background: t.navBg,
            borderBottom: `1px solid ${t.navBorder}`,
            boxShadow: "0 2px 8px rgba(1, 30, 136, 0.25)",
          }}
        >
          <div
            className="uf-nav-inner"
            style={{
              maxWidth: 1120,
              margin: "0 auto",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <button
              type="button"
              onClick={goBackToShopify}
              disabled={!shop}
              className="uf-back-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 40,
                padding: "0 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.10)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: shop ? "pointer" : "not-allowed",
                opacity: shop ? 1 : 0.55,
                fontFamily: t.font,
                whiteSpace: "nowrap",
              }}
              title={shop ? `https://${shop}/admin` : undefined}
            >
              <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>
                ←
              </span>
              {C.backToShop}
            </button>

            <div
              className="uf-logo-box"
              style={{
                width: 68,
                height: 68,
                borderRadius: 14,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "inset 0 0 0 1px rgba(1, 30, 136, 0.08)",
                padding: 2,
                boxSizing: "border-box",
              }}
            >
              <img
                src="/icon.svg"
                alt={C.brandTitle}
                width={64}
                height={64}
                className="uf-logo-img"
                style={{ display: "block", objectFit: "contain" }}
              />
            </div>

            <div className="uf-brand" style={{ flex: 1, minWidth: 0 }}>
              <div
                className="uf-brand-title"
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                {C.brandTitle}
              </div>
              <div
                className="uf-brand-slogan"
                style={{
                  marginTop: 4,
                  color: "rgba(255,255,255,0.72)",
                  fontSize: 13,
                  lineHeight: 1.35,
                }}
              >
                {C.slogan}
              </div>
            </div>

            {shop ? (
              <div
                title={shop}
                className="uf-shop-pill"
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.85)",
                  fontFamily: "ui-monospace, monospace",
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "rgba(0,0,0,0.18)",
                  maxWidth: "min(100%, 240px)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {formatShopName(shop)}
              </div>
            ) : null}
          </div>
        </nav>

        <div
          className="uf-page-wrap"
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "24px 20px 40px",
            display: "grid",
            gap: 20,
          }}
        >
          {loading ? (
            <div
              style={{
                ...panel,
                textAlign: "center",
                padding: "36px 24px",
                color: t.textMuted,
                fontSize: 15,
                animation: "uf-pulse 1.2s ease-in-out infinite",
              }}
            >
              {C.loading}
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              style={{
                ...panel,
                borderColor: "rgba(220, 38, 38, 0.2)",
                background: "#fef2f2",
                color: "#991b1b",
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {error}
            </div>
          ) : null}

          {!loading && !error ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
                gap: 20,
                alignItems: "start",
              }}
            >
              <div style={{ ...panel, padding: 0, overflow: "hidden", minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    padding: 6,
                    gap: 4,
                    background: t.surfaceMuted,
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <button
                    type="button"
                    onClick={function () {
                      setActiveTab("standard");
                    }}
                    style={{
                      ...tabBtnBase,
                      background: activeTab === "standard" ? t.surface : "transparent",
                      color: activeTab === "standard" ? t.accent : t.textMuted,
                      boxShadow: activeTab === "standard" ? t.shadowSm : "none",
                    }}
                  >
                    {C.tabStandard}
                  </button>

                  <button
                    type="button"
                    onClick={function () {
                      setActiveTab("custom");
                    }}
                    style={{
                      ...tabBtnBase,
                      background: activeTab === "custom" ? t.surface : "transparent",
                      color: activeTab === "custom" ? t.accent : t.textMuted,
                      boxShadow: activeTab === "custom" ? t.shadowSm : "none",
                    }}
                  >
                    {C.tabCustom}
                  </button>
                </div>

                <div style={{ padding: "14px 16px 16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: t.textMuted,
                    }}
                  >
                    {C.searchLabel}
                  </label>

                  <input
                    type="search"
                    value={filterSearch}
                    onChange={function (e) {
                      setFilterSearch(e.target.value);
                    }}
                    placeholder={
                      activeTab === "standard"
                        ? C.placeholderStandard
                        : C.placeholderCustom
                    }
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "11px 14px",
                      fontSize: 15,
                      fontFamily: t.font,
                      border: `1px solid ${t.borderStrong}`,
                      borderRadius: t.radiusMd,
                      outline: "none",
                      background: t.surface,
                    }}
                  />
                </div>

                <div
                  style={{
                    padding: "0 16px 18px",
                    display: "grid",
                    gap: 12,
                    maxHeight: "min(70vh, 640px)",
                    overflowY: "auto",
                  }}
                >
                  {activeTab === "standard" ? (
                    standardFiltered.length === 0 ? (
                      <div
                        style={{
                          padding: "28px 16px",
                          textAlign: "center",
                          color: t.textMuted,
                          fontSize: 14,
                          borderRadius: t.radiusMd,
                          border: `1px dashed ${t.borderStrong}`,
                          background: t.surfaceMuted,
                        }}
                      >
                        {C.emptyStandardSearch}
                      </div>
                    ) : (
                      standardFiltered.map(function (filter) {
                        const isAdded = selectedFilters.some(function (selected) {
                          return selected.id === filter.id;
                        });

                        return (
                          <div key={filter.id} style={card}>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>
                              {getFilterLabel(filter)}
                            </div>

                            <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>
                              {formatFilterFieldKey(filter.key)} · {C.typeLabel}:{" "}
                              {formatType(filter.type)}
                            </div>

                            <button
                              type="button"
                              onClick={function () {
                                setSelectedFilters(function (prev) {
                                  const alreadyExists = prev.some(function (item) {
                                    return item.id === filter.id;
                                  });

                                  if (alreadyExists) {
                                    return prev;
                                  }

                                  return prev.concat({
                                    ...filter,
                                    sortOrder: prev.length + 1,
                                  });
                                });
                              }}
                              disabled={isAdded}
                              style={{
                                ...btnPrimary,
                                marginTop: 12,
                                opacity: isAdded ? 0.55 : 1,
                                cursor: isAdded ? "default" : "pointer",
                                background: isAdded ? t.textMuted : t.accent,
                                boxShadow: isAdded ? "none" : btnPrimary.boxShadow,
                              }}
                            >
                              {isAdded ? C.added : C.addFilter}
                            </button>
                          </div>
                        );
                      })
                    )
                  ) : definitionsFiltered.length === 0 ? (
                    <div
                      style={{
                        padding: "28px 16px",
                        textAlign: "center",
                        color: t.textMuted,
                        fontSize: 14,
                        borderRadius: t.radiusMd,
                        border: `1px dashed ${t.borderStrong}`,
                        background: t.surfaceMuted,
                      }}
                    >
                      {definitions.length === 0 ? C.emptyCustomNone : C.emptyCustomSearch}
                    </div>
                  ) : (
                    definitionsFiltered.map(function (item) {
                      const isAdded = selectedFilters.some(function (selected) {
                        return selected.id === item.suggestedFilter.id;
                      });

                      return (
                        <div key={item.id} style={card}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>

                          <div style={{ fontSize: 13, color: t.text, marginTop: 4 }}>
                            <span style={{ fontFamily: "ui-monospace, monospace" }}>
                              {item.namespace}
                            </span>
                            <span style={{ color: t.textMuted }}> · </span>
                            <span>{formatFilterFieldKey(item.key)}</span>
                          </div>

                          <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>
                            {C.typeLabel}: {formatType(item.type)}{" "}
                            {item.category ? `(${item.category})` : ""}
                          </div>

                          {item.description ? (
                            <div
                              style={{
                                marginTop: 10,
                                fontSize: 13,
                                color: t.textMuted,
                                lineHeight: 1.45,
                              }}
                            >
                              {item.description}
                            </div>
                          ) : null}

                          <button
                            type="button"
                            onClick={function () {
                              addFilter(item);
                            }}
                            disabled={isAdded}
                            style={{
                              ...btnPrimary,
                              marginTop: 12,
                              opacity: isAdded ? 0.55 : 1,
                              cursor: isAdded ? "default" : "pointer",
                              background: isAdded ? t.textMuted : t.accent,
                              boxShadow: isAdded ? "none" : btnPrimary.boxShadow,
                            }}
                          >
                            {isAdded ? C.added : C.addFilter}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <aside
                className="uf-aside"
                style={{
                  ...panel,
                  position: "sticky",
                  top: 16,
                  alignSelf: "start",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontSize: 17,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {C.selectedTitle}
                </h2>

                <p style={{ margin: "0 0 16px", fontSize: 13, color: t.textMuted }}>
                  {C.selectedHint}
                </p>

                {selectedFilters.length === 0 ? (
                  <div
                    style={{
                      padding: "20px 16px",
                      textAlign: "center",
                      borderRadius: t.radiusMd,
                      border: `1px dashed ${t.borderStrong}`,
                      color: t.textMuted,
                      fontSize: 14,
                      background: t.surfaceMuted,
                    }}
                  >
                    {C.noneSelected}
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {selectedFilters.map(function (filter) {
                      const isDragging = draggingFilterId === filter.id;
                      const isDragOver =
                        dragOverFilterId === filter.id && draggingFilterId !== filter.id;

                      return (
                        <div
                          key={filter.id}
                          style={{
                            ...card,
                            background: t.surface,
                            boxShadow: t.shadowSm,
                            borderColor: isDragOver
                              ? "rgba(1, 30, 136, 0.35)"
                              : card.border,
                            outline: isDragOver
                              ? "2px solid rgba(1, 30, 136, 0.18)"
                              : "none",
                            opacity: isDragging ? 0.65 : 1,
                            cursor: "grab",
                          }}
                          draggable
                          onDragStart={function (e) {
                            setDraggingFilterId(filter.id);
                            setDragOverFilterId(null);

                            try {
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", filter.id);
                            } catch (error) {
                              // ignore
                            }
                          }}
                          onDragOver={function (e) {
                            e.preventDefault();
                            setDragOverFilterId(filter.id);

                            try {
                              e.dataTransfer.dropEffect = "move";
                            } catch (error) {
                              // ignore
                            }
                          }}
                          onDragLeave={function () {
                            setDragOverFilterId(function (prev) {
                              return prev === filter.id ? null : prev;
                            });
                          }}
                          onDrop={function (e) {
                            e.preventDefault();

                            let fromId = draggingFilterId;

                            try {
                              const from = e.dataTransfer.getData("text/plain");
                              if (from) {
                                fromId = from;
                              }
                            } catch (error) {
                              // ignore
                            }

                            reorderSelectedFilters(fromId, filter.id);
                            setDraggingFilterId(null);
                            setDragOverFilterId(null);
                          }}
                          onDragEnd={function () {
                            setDraggingFilterId(null);
                            setDragOverFilterId(null);
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              aria-hidden="true"
                              title="Drag"
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 8,
                                border: `1px solid ${t.borderStrong}`,
                                background: t.surfaceMuted,
                                display: "grid",
                                placeItems: "center",
                                color: t.textMuted,
                                flexShrink: 0,
                                cursor: "grab",
                                userSelect: "none",
                              }}
                            >
                              ⋮⋮
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>
                                {getFilterLabel(filter)}
                              </div>
                            </div>

                            <div className="uf-reorder-buttons" style={{ gap: 6, flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={function (e) {
                                  e.stopPropagation();
                                  moveSelectedFilterBy(filter.id, -1);
                                }}
                                title={C.moveUp}
                                aria-label={C.moveUp}
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 9,
                                  border: `1px solid ${t.borderStrong}`,
                                  background: t.surface,
                                  color: t.text,
                                  cursor: "pointer",
                                  fontWeight: 700,
                                  lineHeight: 1,
                                }}
                              >
                                ↑
                              </button>

                              <button
                                type="button"
                                onClick={function (e) {
                                  e.stopPropagation();
                                  moveSelectedFilterBy(filter.id, 1);
                                }}
                                title={C.moveDown}
                                aria-label={C.moveDown}
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 9,
                                  border: `1px solid ${t.borderStrong}`,
                                  background: t.surface,
                                  color: t.text,
                                  cursor: "pointer",
                                  fontWeight: 700,
                                  lineHeight: 1,
                                }}
                              >
                                ↓
                              </button>
                            </div>
                          </div>

                          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>
                            {filter.namespace ? (
                              <>
                                <span style={{ fontFamily: "ui-monospace, monospace" }}>
                                  {filter.namespace}
                                </span>
                                <span> · </span>
                              </>
                            ) : null}
                            {formatFilterFieldKey(filter.key)} · {C.typeLabel}:{" "}
                            {formatType(filter.type)}
                          </div>

                          <button
                            type="button"
                            onClick={function () {
                              removeFilter(filter.id);
                            }}
                            style={btnGhost}
                          >
                            {C.remove}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={saveConfig}
                  disabled={saving}
                  style={{
                    ...btnPrimary,
                    marginTop: 18,
                    width: "100%",
                    minHeight: 44,
                    fontSize: 15,
                    cursor: saving ? "wait" : "pointer",
                    opacity: saving ? 0.85 : 1,
                  }}
                  onMouseOver={function (e) {
                    if (!saving) {
                      e.currentTarget.style.background = t.accentHover;
                    }
                  }}
                  onMouseOut={function (e) {
                    e.currentTarget.style.background = t.accent;
                  }}
                >
                  {saving ? C.saving : C.save}
                </button>

                {saveMessage ? (
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      padding: "10px 12px",
                      borderRadius: t.radiusSm,
                      background: saveMsgOk ? "#ecfdf5" : "#fef2f2",
                      color: saveMsgOk ? "#065f46" : "#991b1b",
                      border: `1px solid ${
                        saveMsgOk
                          ? "rgba(5, 150, 105, 0.2)"
                          : "rgba(220, 38, 38, 0.15)"
                      }`,
                    }}
                  >
                    {saveMessage}
                  </div>
                ) : null}
              </aside>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}