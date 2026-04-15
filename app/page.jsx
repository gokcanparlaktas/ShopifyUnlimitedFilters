"use client";

import { useEffect, useMemo, useState } from "react";
import { STANDARD_FILTER_LIBRARY } from "../lib/standard-filters";
export default function HomePage() {
  const [definitions, setDefinitions] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const shop = "filter-test-74b5ly2r.myshopify.com";
  useEffect(function () {
    async function initPage() {
      try {
        setLoading(true);
        setError("");
  
        const definitionsResponse = await fetch(
            `/api/metafield-definitions?shop=${encodeURIComponent(shop)}`,
            {
              cache: "no-store",
            }
          );
  
        const definitionsText = await definitionsResponse.text();
  
        let definitionsJson;
        try {
          definitionsJson = JSON.parse(definitionsText);
        } catch (parseError) {
          throw new Error(definitionsText);
        }
  
        if (!definitionsJson.ok) {
          throw new Error(definitionsJson.error || "Metafield definitions alınamadı");
        }
  
        setDefinitions(Array.isArray(definitionsJson.definitions) ? definitionsJson.definitions : []);
  
        const configResponse = await fetch(
            `/api/config?shop=${encodeURIComponent(shop)}`,
            {
              cache: "no-store",
            }
          );
  
        const configJson = await configResponse.json();
  
        if (configJson.ok) {
          const filters = Array.isArray(configJson.config?.filters)
            ? configJson.config.filters
            : [];
          setSelectedFilters(filters);
        }
      } catch (err) {
        setError(err.message || "Bir hata oluştu");
      } finally {
        setLoading(false);
      }
    }
  
    initPage();
  }, []);
  const currentLocale = "tr";

  function getFilterLabel(filter) {
    if (filter.labels && filter.labels[currentLocale]) {
      return filter.labels[currentLocale];
    }
  
    if (filter.labels && filter.labels.en) {
      return filter.labels.en;
    }
  
    return filter.labelKey || filter.key;
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

  async function saveConfig() {
    try {
      setSaving(true);
      setSaveMessage("");
  
      const response = await fetch(
        `/api/config?shop=${encodeURIComponent(shop)}`,
        {
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
        }
      );
  
      const json = await response.json();
  
      if (!json.ok) {
        throw new Error(json.error || "Config kaydedilemedi");
      }
  
      setSaveMessage("Configuration saved.");
    } catch (err) {
      setSaveMessage(err.message || "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  }


  const selectedFiltersJson = useMemo(function () {
    return JSON.stringify(selectedFilters, null, 2);
  }, [selectedFilters]);
  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "40px auto",
        padding: "0 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Unlimited Filters</h1>
      
      <p>Product metafield tanımları</p>

      {loading ? <p>Yükleniyor...</p> : null}
      {error ? <pre style={{ whiteSpace: "pre-wrap", color: "crimson" }}>{error}</pre> : null}

      {!loading && !error ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          <section>
  <div
    style={{
      border: "1px solid #ddd",
      borderRadius: 8,
      padding: 16,
      background: "#fff",
      marginBottom: 20,
    }}
  >
    <h2 style={{ marginTop: 0 }}>Standard filters</h2>

    <div style={{ display: "grid", gap: 10 }}>
      {STANDARD_FILTER_LIBRARY.map(function (filter) {
        const isAdded = selectedFilters.some(function (selected) {
          return selected.id === filter.id;
        });

        return (
          <div
            key={filter.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 6,
              padding: 10,
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 700 }}>{getFilterLabel(filter)}</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              {filter.key} • {filter.type}
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
                marginTop: 8,
                minHeight: 36,
                padding: "0 12px",
                cursor: isAdded ? "default" : "pointer",
              }}
            >
              {isAdded ? "Added" : "Add filter"}
            </button>
          </div>
        );
      })}
    </div>
  </div>

  <h2 style={{ marginTop: 0 }}>Custom metafields</h2>

  <div style={{ display: "grid", gap: 12 }}>
    {definitions.map(function (item) {
      const isAdded = selectedFilters.some(function (selected) {
        return selected.id === item.suggestedFilter.id;
      });

      return (
        <div
          key={item.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12,
            background: "#fff",
          }}
        >
          <div style={{ fontWeight: 700 }}>{item.name}</div>
          <div>{item.namespace}.{item.key}</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            type: {item.type} {item.category ? `(${item.category})` : ""}
          </div>

          {item.description ? (
            <div style={{ marginTop: 6, fontSize: 13 }}>{item.description}</div>
          ) : null}

          <pre
            style={{
              marginTop: 10,
              padding: 10,
              background: "#f7f7f7",
              borderRadius: 6,
              fontSize: 12,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(item.suggestedFilter, null, 2)}
          </pre>

          <button
            type="button"
            onClick={function () {
              addFilter(item);
            }}
            disabled={isAdded}
            style={{
              marginTop: 10,
              minHeight: 36,
              padding: "0 12px",
              cursor: isAdded ? "default" : "pointer",
            }}
          >
            {isAdded ? "Added" : "Add filter"}
          </button>
        </div>
      );
    })}
  </div>
</section>

          <aside
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 16,
              background: "#fff",
              position: "sticky",
              top: 20,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Selected filters</h2>

            {selectedFilters.length === 0 ? (
  <p>Henüz filtre seçilmedi.</p>
) : (
  <div style={{ display: "grid", gap: 10 }}>
    {selectedFilters.map(function (filter) {
      return (
        <div
          key={filter.id}
          style={{
            border: "1px solid #eee",
            borderRadius: 6,
            padding: 10,
          }}
        >
          <div style={{ fontWeight: 700 }}>{getFilterLabel(filter)}</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            {filter.namespace ? `${filter.namespace}.` : ""}{filter.key} • {filter.type}
          </div>

          <button
            type="button"
            onClick={function () {
              removeFilter(filter.id);
            }}
            style={{
              marginTop: 8,
              minHeight: 32,
              padding: "0 10px",
              cursor: "pointer",
            }}
          >
            Remove
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
    marginTop: 12,
    minHeight: 40,
    padding: "0 14px",
    cursor: saving ? "default" : "pointer",
  }}
>
  {saving ? "Saving..." : "Save configuration"}
</button>

{saveMessage ? (
  <div style={{ marginTop: 10, fontSize: 13 }}>
    {saveMessage}
  </div>
) : null}

<h3 style={{ marginTop: 20 }}>Filters JSON preview</h3>
            <pre
              style={{
                padding: 10,
                background: "#f7f7f7",
                borderRadius: 6,
                fontSize: 12,
                overflowX: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedFiltersJson}
            </pre>
          </aside>
        </div>
      ) : null}
    </main>
  );
}