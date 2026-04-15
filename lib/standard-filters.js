export const STANDARD_FILTER_LIBRARY = [
    {
      id: "vendor",
      labelKey: "filters.vendor",
      labels: {
        tr: "Marka",
        en: "Brand"
      },
      source: "standard",
      key: "vendor",
      type: "list",
      enabled: true,
      sortOrder: 1
    },
    {
      id: "price",
      labelKey: "filters.price",
      labels: {
        tr: "Fiyat",
        en: "Price"
      },
      source: "standard",
      key: "price",
      type: "price",
      enabled: true,
      sortOrder: 2
    },
    {
      id: "available_for_sale",
      labelKey: "filters.available",
      labels: {
        tr: "Stok Durumu",
        en: "Availability"
      },
      source: "standard",
      key: "availableForSale",
      type: "boolean",
      enabled: true,
      sortOrder: 3
    },
    {
      id: "tags",
      labelKey: "filters.tags",
      labels: {
        tr: "Etiketler",
        en: "Tags"
      },
      source: "standard",
      key: "tags",
      type: "list",
      enabled: false,
      sortOrder: 4
    },
    {
      id: "option1",
      labelKey: "filters.option1",
      labels: {
        tr: "Varyant Seçeneği 1",
        en: "Variant Option 1"
      },
      source: "standard",
      key: "option1",
      type: "list",
      enabled: false,
      sortOrder: 5
    },
    {
      id: "option2",
      labelKey: "filters.option2",
      labels: {
        tr: "Varyant Seçeneği 2",
        en: "Variant Option 2"
      },
      source: "standard",
      key: "option2",
      type: "list",
      enabled: false,
      sortOrder: 6
    },
    {
      id: "option3",
      labelKey: "filters.option3",
      labels: {
        tr: "Varyant Seçeneği 3",
        en: "Variant Option 3"
      },
      source: "standard",
      key: "option3",
      type: "list",
      enabled: false,
      sortOrder: 7
    }
  ];