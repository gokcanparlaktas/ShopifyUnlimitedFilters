(function () {
    const FILTER_CONFIG = {
      shop: {
        domain: '',
        storefrontToken: '',
        collectionHandle: '',
        appBaseUrl: ''
      },
      enabled: true,
      showSorting: true,
      showSearch: true,
      filterAccordionDefaultOpen: true,
      filters: []
    };
  
    let ALL_PRODUCTS = [];
    let CURRENT_PAGE = 1;
    const PRODUCTS_PER_PAGE = 24;
  
    function getRootElement() {
      return document.getElementById('custom-filter-root');
    }
  
    function getFilterContainer() {
      return document.getElementById('custom-material-filter-options');
    }
  
    function getProductsGrid() {
      return document.getElementById('custom-products-grid');
    }
  
    function getPaginationContainer() {
      return document.getElementById('custom-products-pagination');
    }
  
    function getSortSelect() {
      return document.querySelector('.custom-grid-sort__select');
    }
  
    function getSortContainer() {
      const select = getSortSelect();
      if (!select) return null;
  
      return (
        select.closest('.custom-grid-sort') ||
        select.closest('.custom-grid-sort-wrap') ||
        select.parentElement
      );
    }
  
    function getSearchInput() {
      return (
        document.querySelector('.custom-grid-search__input') ||
        document.querySelector('.custom-grid-search input[type="search"]') ||
        document.querySelector('#custom-grid-search') ||
        document.querySelector('[data-custom-grid-search]')
      );
    }
  
    function getSearchContainer() {
      const input = getSearchInput();
      if (!input) return null;
  
      return (
        input.closest('.custom-grid-search') ||
        input.closest('.custom-grid-search-wrap') ||
        input.parentElement
      );
    }
  
    function applyUiVisibility(config) {
      const sortContainer = getSortContainer();
      const searchContainer = getSearchContainer();
  
      if (sortContainer) {
        sortContainer.style.display = config.showSorting === false ? 'none' : '';
      }
  
      if (searchContainer) {
        searchContainer.style.display = config.showSearch === false ? 'none' : '';
      }
    }
  
    function applyShopConfigFromDom(config) {
      const rootEl = getRootElement();
  
      if (!rootEl) {
        throw new Error('custom-filter-root elementi bulunamadı');
      }
  
      config.shop.domain = rootEl.getAttribute('data-shop-domain') || '';
      config.shop.storefrontToken = rootEl.getAttribute('data-storefront-token') || '';
      config.shop.collectionHandle = rootEl.getAttribute('data-collection-handle') || '';
      config.shop.appBaseUrl = rootEl.getAttribute('data-app-base-url') || '';
  
      const filtersJson = rootEl.getAttribute('data-filters') || '[]';
  
      try {
        const parsedFilters = JSON.parse(filtersJson);
        config.filters = Array.isArray(parsedFilters) ? parsedFilters : [];
      } catch (error) {
        config.filters = [];
      }
  
      return config;
    }
  
    async function loadRemoteConfig(config) {
      if (!config.shop.appBaseUrl) {
        console.error('REMOTE_CONFIG_ERROR', 'appBaseUrl bulunamadı');
        return config;
      }
  
      if (!config.shop.domain) {
        console.error('REMOTE_CONFIG_ERROR', 'shop domain bulunamadı');
        return config;
      }
  
      try {
        const response = await fetch(
          config.shop.appBaseUrl +
            '/api/public-config?shop=' +
            encodeURIComponent(config.shop.domain),
          {
            method: 'GET'
          }
        );
  
        const json = await response.json();
  
        if (!response.ok) {
          console.error('REMOTE_CONFIG_HTTP_ERROR', response.status, json);
          return config;
        }
  
        if (!json.ok || !json.config) {
          console.error('REMOTE_CONFIG_RESPONSE_ERROR', json);
          return config;
        }
  
        config.enabled = json.config.enabled !== false;
        config.showSorting = json.config.showSorting !== false;
        config.showSearch = json.config.showSearch !== false;
        config.filterAccordionDefaultOpen =
          json.config.filterAccordionDefaultOpen !== false;
  
        if (Array.isArray(json.config.filters)) {
          config.filters = json.config.filters;
        }
  
        return config;
      } catch (error) {
        console.error('REMOTE_CONFIG_ERROR', error);
        return config;
      }
    }
  
    function getGridColumns() {
      const root = getRootElement();
  
      return {
        mobile: Number(root && root.getAttribute('data-col-mobile')) || 2,
        tablet: Number(root && root.getAttribute('data-col-tablet')) || 3,
        desktop: Number(root && root.getAttribute('data-col-desktop')) || 4
      };
    }
  
    function applyGridColumns() {
      const gridEl = getProductsGrid();
      if (!gridEl) return;
  
      const cols = getGridColumns();
      gridEl.style.gridTemplateColumns = `repeat(${cols.desktop}, minmax(0, 1fr))`;
  
      if (window.innerWidth < 992) {
        gridEl.style.gridTemplateColumns = `repeat(${cols.tablet}, minmax(0, 1fr))`;
      }
      if (window.innerWidth < 768) {
        gridEl.style.gridTemplateColumns = `repeat(${cols.mobile}, minmax(0, 1fr))`;
      }
    }
  
    function getMetafieldIdentifiers(config) {
      return config.filters
        .filter(function (filter) {
          return filter.source === 'metafield';
        })
        .map(function (filter) {
          return {
            namespace: filter.namespace,
            key: filter.key
          };
        });
    }
  
    function buildProductsQuery() {
      return `
        query GetCollectionProducts(
          $handle: String!,
          $after: String,
          $identifiers: [HasMetafieldsIdentifier!]!
        ) {
          collection(handle: $handle) {
            products(first: 250, after: $after) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                id
                title
                handle
                vendor
                tags
                availableForSale
                createdAt
                featuredImage {
                  url
                  altText
                }
                options {
                  name
                  optionValues {
                    name
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                metafields(identifiers: $identifiers) {
                  namespace
                  key
                  value
                }
              }
            }
          }
        }
      `;
    }
  
    const PRODUCTS_QUERY = buildProductsQuery();
  
    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  
    function normalizeText(value) {
      return String(value || '').trim().toLocaleLowerCase('tr-TR');
    }
  
    function getFilterLabel(filter) {
      if (!filter) return '';
  
      if (filter.label) {
        return filter.label;
      }
  
      if (filter.labels && filter.labels.tr) {
        return filter.labels.tr;
      }
  
      if (filter.labels && filter.labels.en) {
        return filter.labels.en;
      }
  
      return filter.labelKey || filter.key || '';
    }
  
    function normalizeProduct(rawProduct) {
      const options = Array.isArray(rawProduct.options) ? rawProduct.options : [];
  
      function getOptionValues(index) {
        const option = options[index];
  
        if (!option || !Array.isArray(option.optionValues)) {
          return [];
        }
  
        return option.optionValues
          .map(function (item) {
            return item && item.name ? item.name : '';
          })
          .filter(Boolean);
      }
  
      return {
        id: rawProduct.id,
        title: rawProduct.title,
        handle: rawProduct.handle,
        vendor: rawProduct.vendor || '',
        tags: Array.isArray(rawProduct.tags) ? rawProduct.tags : [],
        availableForSale: Boolean(rawProduct.availableForSale),
        createdAt: rawProduct.createdAt,
        featuredImage: rawProduct.featuredImage
          ? {
              url: rawProduct.featuredImage.url,
              altText: rawProduct.featuredImage.altText
            }
          : null,
        price: rawProduct.priceRange && rawProduct.priceRange.minVariantPrice
          ? {
              amount: rawProduct.priceRange.minVariantPrice.amount,
              currencyCode: rawProduct.priceRange.minVariantPrice.currencyCode
            }
          : null,
        options: {
          option1: getOptionValues(0),
          option2: getOptionValues(1),
          option3: getOptionValues(2)
        },
        metafields: Array.isArray(rawProduct.metafields)
          ? rawProduct.metafields
              .filter(function (item) {
                return item && item.namespace && item.key;
              })
              .map(function (item) {
                return {
                  namespace: item.namespace,
                  key: item.key,
                  value: item.value
                };
              })
          : []
      };
    }
  
    function normalizeProducts(rawProducts) {
      return (Array.isArray(rawProducts) ? rawProducts : []).map(normalizeProduct);
    }
  
    function getMetafieldValue(product, namespace, key) {
      const metafield = (product.metafields || []).find(function (item) {
        return item.namespace === namespace && item.key === key;
      });
  
      return metafield ? metafield.value : '';
    }
  
    function getStandardFilterValue(product, key) {
      if (!product) return '';
  
      if (key === 'vendor') {
        return product.vendor || '';
      }
  
      if (key === 'tags') {
        return Array.isArray(product.tags) ? product.tags.join(',') : '';
      }
  
      if (key === 'availableForSale') {
        return product.availableForSale ? 'true' : 'false';
      }
  
      if (key === 'option1' || key === 'option2' || key === 'option3') {
        const values = product.options && product.options[key] ? product.options[key] : [];
        return Array.isArray(values) ? values.join(',') : '';
      }
  
      return product[key] || '';
    }
  
    function getProductPrice(product) {
      if (!product || !product.price || product.price.amount == null) {
        return null;
      }
  
      const amount = Number(product.price.amount);
      return Number.isNaN(amount) ? null : amount;
    }
  
    function getNumericValue(rawValue) {
      if (rawValue == null) return null;
      const numericValue = Number(rawValue);
      return Number.isNaN(numericValue) ? null : numericValue;
    }
  
    function normalizeFacetValues(rawValue) {
      if (!rawValue) return [];
  
      return String(rawValue)
        .split(',')
        .map(function (value) {
          return value.trim();
        })
        .filter(function (value) {
          return Boolean(value) && value !== 'Default Title';
        });
    }
  
    function getPriceRange(products) {
      const prices = products
        .map(getProductPrice)
        .filter(function (price) {
          return price != null;
        });
  
      if (!prices.length) return null;
  
      return {
        min: Math.min.apply(null, prices),
        max: Math.max.apply(null, prices)
      };
    }
  
    function buildFacetGroups(products, config) {
      const groups = [];
  
      config.filters.forEach(function (filter) {
        if (filter.key === 'price' && filter.type === 'price') {
          const priceRange = getPriceRange(products);
  
          if (priceRange) {
            groups.push({
              key: 'price',
              label: getFilterLabel(filter) || 'Fiyat',
              type: 'price',
              min: priceRange.min,
              max: priceRange.max
            });
          }
  
          return;
        }
  
        if (filter.type === 'list' || filter.type === 'boolean') {
          const counts = {};
  
          products.forEach(function (product) {
            let rawValue = '';
  
            if (filter.source === 'metafield') {
              rawValue = getMetafieldValue(product, filter.namespace, filter.key);
            } else if (filter.source === 'standard') {
              rawValue = getStandardFilterValue(product, filter.key);
            }
  
            normalizeFacetValues(rawValue).forEach(function (value) {
              counts[value] = (counts[value] || 0) + 1;
            });
          });
  
          if (Object.keys(counts).length > 0) {
            groups.push({
              key: filter.key,
              label: getFilterLabel(filter),
              type: filter.type,
              values: counts
            });
          }
  
          return;
        }
  
        if (filter.type === 'range') {
          const values = products
            .map(function (product) {
              let rawValue = '';
  
              if (filter.source === 'metafield') {
                rawValue = getMetafieldValue(product, filter.namespace, filter.key);
              } else if (filter.source === 'standard') {
                rawValue = getStandardFilterValue(product, filter.key);
              }
  
              return getNumericValue(rawValue);
            })
            .filter(function (value) {
              return value != null;
            });
  
          if (values.length > 0) {
            groups.push({
              key: filter.key,
              label: getFilterLabel(filter),
              type: 'range',
              min: Math.min.apply(null, values),
              max: Math.max.apply(null, values)
            });
          }
        }
      });
  
      return groups;
    }
  
    async function fetchCollectionProductsPage(config, afterCursor) {
      const endpoint = 'https://' + config.shop.domain + '/api/2026-04/graphql.json';
  
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': config.shop.storefrontToken
        },
        body: JSON.stringify({
          query: PRODUCTS_QUERY,
          variables: {
            handle: config.shop.collectionHandle,
            after: afterCursor || null,
            identifiers: getMetafieldIdentifiers(config)
          }
        })
      });
  
      if (!response.ok) {
        throw new Error('Storefront API HTTP hatası: ' + response.status);
      }
  
      const json = await response.json();
  
      if (json.errors) {
        throw new Error(
          'GraphQL hatası: ' +
            (json.errors[0] && json.errors[0].message
              ? json.errors[0].message
              : 'Bilinmeyen hata')
        );
      }
  
      return json;
    }
  
    async function fetchAllCollectionProducts(config) {
      let allNodes = [];
      let afterCursor = null;
      let hasNextPage = true;
  
      while (hasNextPage) {
        const response = await fetchCollectionProductsPage(config, afterCursor);
        const collection = response && response.data && response.data.collection ? response.data.collection : null;
  
        if (!collection) {
          throw new Error('Collection bulunamadı');
        }
  
        const productsConnection = collection.products || {};
        const nodes = Array.isArray(productsConnection.nodes) ? productsConnection.nodes : [];
        const pageInfo = productsConnection.pageInfo || {};
  
        allNodes = allNodes.concat(nodes);
        hasNextPage = Boolean(pageInfo.hasNextPage);
        afterCursor = pageInfo.endCursor || null;
      }
  
      return { products: allNodes };
    }
  
    function renderFilters(facetGroups) {
      const container = getFilterContainer();
      if (!container) return;
  
      if (!facetGroups.length) {
        container.innerHTML = '<p>Filtre bulunamadı</p>';
        return;
      }
  
      function getGroupAccordionOpen(groupKey) {
        const def = (FILTER_CONFIG.filters || []).find(function (item) {
          return item && item.key === groupKey;
        });
        if (def && typeof def.accordionOpen === 'boolean') {
          return def.accordionOpen;
        }
        return FILTER_CONFIG.filterAccordionDefaultOpen !== false;
      }
  
      container.innerHTML = facetGroups.map(function (group, index) {
        let optionsHtml = '';
  
        if (group.type === 'price' || group.type === 'range') {
          optionsHtml =
            '<div class="adv-filter-range">' +
              '<label class="adv-filter-range__label">' +
                '<span>Min</span>' +
                '<input class="adv-filter-range-input" type="number" data-filter-key="' + group.key + '" data-filter-type="range" data-range-type="min" placeholder="' + group.min + '">' +
              '</label>' +
              '<label class="adv-filter-range__label">' +
                '<span>Max</span>' +
                '<input class="adv-filter-range-input" type="number" data-filter-key="' + group.key + '" data-filter-type="range" data-range-type="max" placeholder="' + group.max + '">' +
              '</label>' +
            '</div>';
        } else {
          const entries = Object.entries(group.values || {});
          const shouldScroll = entries.length > 7;
          const listClass = shouldScroll ? 'adv-filter-options adv-filter-options--scroll' : 'adv-filter-options';

          const searchHtml =
            '<div class="adv-filter-options-search">' +
              '<input class="adv-filter-options-search__input" type="search" data-adv-filter-options-search="' + group.key + '" placeholder="Ara...">' +
            '</div>';

          const listHtml = entries.map(function (entry, optionIndex) {
            const value = entry[0];
            const count = entry[1];
            const inputId = 'adv-filter-' + group.key + '-' + index + '-' + optionIndex;
  
            return (
              '<label class="adv-filter-option" for="' + inputId + '">' +
                '<input id="' + inputId + '" class="adv-filter-checkbox" type="checkbox" data-filter-key="' + group.key + '" value="' + escapeHtml(value) + '">' +
                '<span class="adv-filter-option__label">' + escapeHtml(value) + '</span>' +
                '<span class="adv-filter-option__count">(' + count + ')</span>' +
              '</label>'
            );
          }).join('');

          optionsHtml =
            searchHtml +
            '<div class="' + listClass + '" data-adv-filter-options-list="' + group.key + '">' +
              listHtml +
            '</div>';
        }
  
        const openAttr = getGroupAccordionOpen(group.key) ? ' open' : '';

        return (
          '<details class="adv-filter-group"' + openAttr + '>' +
            '<summary class="adv-filter-group__summary">' +
              '<span class="adv-filter-group__title">' + escapeHtml(group.label) + '</span>' +
              '<span class="adv-filter-group__chevron" aria-hidden="true">⌄</span>' +
            '</summary>' +
            '<div class="adv-filter-group__content">' + optionsHtml + '</div>' +
          '</details>'
        );
      }).join('');
    }
  
    function formatMoney(amount, currencyCode) {
      const value = Number(amount || 0);
  
      try {
        return new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: currencyCode || 'TRY',
          maximumFractionDigits: 2
        }).format(value);
      } catch (e) {
        return String(value);
      }
    }
  
    function renderProducts(products) {
      const gridEl = getProductsGrid();
      if (!gridEl) return;
  
      applyGridColumns();
  
      if (!products.length) {
        gridEl.innerHTML = '<div class="adv-products-empty">Sonuç bulunamadı.</div>';
        return;
      }
  
      gridEl.innerHTML = products.map(function (product) {
        const productUrl = '/products/' + product.handle;
        const imageUrl = product.featuredImage ? product.featuredImage.url : '';
        const imageAlt = product.featuredImage && product.featuredImage.altText ? product.featuredImage.altText : product.title;
        const priceText = product.price ? formatMoney(product.price.amount, product.price.currencyCode) : '';
        const vendorText = product.vendor || '';
  
        return (
          '<div class="adv-card">' +
            '<a class="adv-card__link" href="' + productUrl + '">' +
              (
                imageUrl
                  ? '<div class="adv-card__image-wrap"><img class="adv-card__image" src="' + imageUrl + '" alt="' + escapeHtml(imageAlt) + '"></div>'
                  : '<div class="adv-card__image-wrap"><div class="adv-card__image--placeholder"></div></div>'
              ) +
              '<div class="adv-card__body">' +
                '<div class="adv-card__vendor">' + escapeHtml(vendorText) + '</div>' +
                '<div class="adv-card__title">' + escapeHtml(product.title) + '</div>' +
                '<div class="adv-card__price">' + escapeHtml(priceText) + '</div>' +
              '</div>' +
            '</a>' +
          '</div>'
        );
      }).join('');
    }
  
    function getSelectedFilters() {
      const selected = {};
  
      document.querySelectorAll('.adv-filter-checkbox:checked').forEach(function (input) {
        const key = input.dataset.filterKey;
        if (!selected[key]) selected[key] = [];
        selected[key].push(input.value);
      });
  
      document.querySelectorAll('input[data-filter-type="range"]').forEach(function (input) {
        const key = input.dataset.filterKey;
        const rangeType = input.dataset.rangeType;
        const val = (input.value || '').trim();
        if (!key || !rangeType || val === '') return;
        const sk = key + '_' + rangeType;
        selected[sk] = [val];
      });
  
      const searchInput = getSearchInput();
if (FILTER_CONFIG.showSearch !== false && searchInput) {
  const searchValue = (searchInput.value || '').trim();
  if (searchValue) {
    selected.__search = [searchValue];
  }
}
  
      return selected;
    }
  
    function getProductNumericValue(product, baseKey) {
      if (baseKey === 'price') {
        return getProductPrice(product);
      }
  
      const filterDef = FILTER_CONFIG.filters.find(function (filter) {
        return filter.key === baseKey;
      });
  
      if (!filterDef) {
        return null;
      }
  
      if (filterDef.source === 'metafield') {
        return getNumericValue(
          getMetafieldValue(product, filterDef.namespace, filterDef.key)
        );
      }
  
      if (filterDef.source === 'standard') {
        return getNumericValue(getStandardFilterValue(product, filterDef.key));
      }
  
      return null;
    }
  
    function productMatchesFilters(product, selectedFilters) {
      const searchTerms = selectedFilters.__search || [];
      const searchTerm = searchTerms.length ? normalizeText(searchTerms[0]) : '';
  
      if (searchTerm) {
        const searchableBlob = [
          product.title,
          product.vendor,
          product.handle,
          Array.isArray(product.tags) ? product.tags.join(' ') : ''
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('tr-TR');
  
        if (searchableBlob.indexOf(searchTerm) === -1) {
          return false;
        }
      }
  
      const rangeBaseKeys = {};
  
      Object.keys(selectedFilters).forEach(function (key) {
        if (key.endsWith('_min')) {
          rangeBaseKeys[key.slice(0, -4)] = true;
        }
        if (key.endsWith('_max')) {
          rangeBaseKeys[key.slice(0, -4)] = true;
        }
      });
  
      for (const baseKey of Object.keys(rangeBaseKeys)) {
        const minArr = selectedFilters[baseKey + '_min'] || [];
        const maxArr = selectedFilters[baseKey + '_max'] || [];
  
        const minVal =
          minArr[0] != null && minArr[0] !== ''
            ? parseFloat(String(minArr[0]).replace(/,/g, '.'))
            : null;
  
        const maxVal =
          maxArr[0] != null && maxArr[0] !== ''
            ? parseFloat(String(maxArr[0]).replace(/,/g, '.'))
            : null;
  
        if (minVal == null && maxVal == null) {
          continue;
        }
  
        const productVal = getProductNumericValue(product, baseKey);
  
        if (productVal == null) return false;
        if (minVal != null && productVal < minVal) return false;
        if (maxVal != null && productVal > maxVal) return false;
      }
  
      return Object.keys(selectedFilters).every(function (key) {
        if (key === '__search') return true;
        if (key.endsWith('_min') || key.endsWith('_max')) return true;
  
        const selectedValues = selectedFilters[key];
        if (!Array.isArray(selectedValues) || !selectedValues.length) return true;
  
        const filterDef = FILTER_CONFIG.filters.find(function (filter) {
          return filter.key === key;
        });
  
        if (!filterDef) return true;
  
        let rawValue = '';
  
        if (filterDef.source === 'metafield') {
          rawValue = getMetafieldValue(product, filterDef.namespace, filterDef.key);
        } else if (filterDef.source === 'standard') {
          rawValue = getStandardFilterValue(product, filterDef.key);
        }
  
        const productValues = normalizeFacetValues(rawValue).map(normalizeText);
  
        return selectedValues.some(function (selectedValue) {
          const normalizedSelectedValue = normalizeText(selectedValue);
  
          return productValues.some(function (productValue) {
            return productValue.indexOf(normalizedSelectedValue) > -1;
          });
        });
      });
    }
  
    function filterProducts(products, selectedFilters) {
      return products.filter(function (product) {
        return productMatchesFilters(product, selectedFilters);
      });
    }
  
    function sortProducts(products, sortBy) {
      const items = products.slice();
  
      if (sortBy === 'created-descending') {
        items.sort(function (a, b) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      }
      if (sortBy === 'created-ascending') {
        items.sort(function (a, b) {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
      }
      if (sortBy === 'title-ascending') {
        items.sort(function (a, b) {
          return String(a.title || '').localeCompare(String(b.title || ''), 'tr');
        });
      }
      if (sortBy === 'title-descending') {
        items.sort(function (a, b) {
          return String(b.title || '').localeCompare(String(a.title || ''), 'tr');
        });
      }
      if (sortBy === 'price-ascending') {
        items.sort(function (a, b) {
          return (getProductPrice(a) || 0) - (getProductPrice(b) || 0);
        });
      }
      if (sortBy === 'price-descending') {
        items.sort(function (a, b) {
          return (getProductPrice(b) || 0) - (getProductPrice(a) || 0);
        });
      }
  
      return items;
    }
  
    function paginateProducts(products, page, perPage) {
      const start = (page - 1) * perPage;
      const end = start + perPage;
      return products.slice(start, end);
    }
  
    function renderPagination(products, onPageChange) {
      const paginationEl = getPaginationContainer();
      if (!paginationEl) return;
  
      const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  
      if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
      }
  
      let html = '';
  
      for (let i = 1; i <= totalPages; i += 1) {
        html += '<button class="' + (i === CURRENT_PAGE ? 'is-active' : '') + '" data-page="' + i + '">' + i + '</button>';
      }
  
      paginationEl.innerHTML = html;
  
      paginationEl.querySelectorAll('button[data-page]').forEach(function (button) {
        button.addEventListener('click', function () {
          CURRENT_PAGE = Number(button.getAttribute('data-page')) || 1;
          onPageChange();
        });
      });
    }
  
    function init() {
      try {
        applyShopConfigFromDom(FILTER_CONFIG);
      } catch (error) {
        console.error('INIT_ERROR', error);
        return;
      }
  
      loadRemoteConfig(FILTER_CONFIG)
  .then(function () {
    applyUiVisibility(FILTER_CONFIG);

    if (FILTER_CONFIG.enabled === false) {
      const filterContainer = getFilterContainer();
      if (filterContainer) {
        filterContainer.innerHTML = '';
      }

      return { products: [] };
    }

    return fetchAllCollectionProducts(FILTER_CONFIG);
  })
        .then(function (result) {
          ALL_PRODUCTS = normalizeProducts(result.products);
          const facetGroups = buildFacetGroups(ALL_PRODUCTS, FILTER_CONFIG);
  
          renderFilters(facetGroups);
  
          function updateVisibleProducts(allFilteredProducts) {
            const pagedProducts = paginateProducts(
              allFilteredProducts,
              CURRENT_PAGE,
              PRODUCTS_PER_PAGE
            );
            renderProducts(pagedProducts);
            renderPagination(allFilteredProducts, function () {
              updateVisibleProducts(allFilteredProducts);
            });
          }
  
          function applyFilters() {
            const selectedFilters = getSelectedFilters();
            const filteredProducts = filterProducts(ALL_PRODUCTS, selectedFilters);
            const sortSelect = getSortSelect();
            const sortBy = sortSelect ? sortSelect.value : 'created-descending';
            const sortedProducts = sortProducts(filteredProducts, sortBy);
  
            CURRENT_PAGE = 1;
            updateVisibleProducts(sortedProducts);
          }
  
          updateVisibleProducts(ALL_PRODUCTS);
  
          document.addEventListener('change', function (event) {
            if (
              event.target &&
              (
                event.target.classList.contains('adv-filter-checkbox') ||
                event.target.classList.contains('custom-grid-sort__select')
              )
            ) {
              applyFilters();
            }
          });
  
          document
            .querySelectorAll('input[data-filter-type="range"]')
            .forEach(function (input) {
              input.addEventListener('input', applyFilters);
            });
  
          // Per-filter option search (filters option list inside each accordion)
          document
            .querySelectorAll('.adv-filter-options-search__input')
            .forEach(function (input) {
              input.addEventListener('input', function () {
                const key = input.getAttribute('data-adv-filter-options-search') || '';
                const list = document.querySelector('[data-adv-filter-options-list="' + key + '"]');
                if (!list) return;
                const term = normalizeText((input.value || '').trim());
                const options = list.querySelectorAll('.adv-filter-option');
                options.forEach(function (opt) {
                  const textEl = opt.querySelector('.adv-filter-option__label');
                  const txt = textEl ? normalizeText(textEl.textContent || '') : '';
                  const visible = !term || txt.indexOf(term) !== -1;
                  opt.style.display = visible ? '' : 'none';
                });
              });
            });

          const searchInput = getSearchInput();
          if (searchInput) {
            searchInput.addEventListener('input', applyFilters);
          }
  
          window.addEventListener('resize', function () {
            applyGridColumns();
          });
        })
        .catch(function (error) {
          console.error('FETCH_ERROR', error);
        });
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();