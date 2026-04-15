(function () {
    const EMBED = window.UnlimitedFiltersConfig || null;
    if (!EMBED) return;
  
    function isCollectionPage() {
      return !!EMBED.collectionHandle;
    }
  
    function findCollectionMountTarget() {
      const selectors = [
        '.shopify-section[id*="product-grid"]',
        '.main-collection-product-grid',
        '.product-grid-container',
        '#ProductGridContainer',
        '.collection__products',
        '.collection-product-grid',
        '.template-collection main',
        'main'
      ];
  
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) return el;
      }
  
      return null;
    }
  
    function findNativeGridContainer() {
      const selectors = [
        '.product-grid-container',
        '#ProductGridContainer',
        '.collection__products',
        '.collection-product-grid',
        '.main-collection-product-grid'
      ];
  
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) return el;
      }
  
      return null;
    }
  
    function createRoot() {
      const existing = document.getElementById('custom-filter-root');
      if (existing) return existing;
  
      const root = document.createElement('div');
      root.id = 'custom-filter-root';
      root.setAttribute('data-shop-domain', EMBED.shopDomain || '');
      root.setAttribute('data-storefront-token', EMBED.storefrontToken || '');
      root.setAttribute('data-collection-handle', EMBED.collectionHandle || '');
      root.setAttribute('data-app-base-url', EMBED.appBaseUrl || '');
      root.setAttribute('data-filters', '[]');
      root.setAttribute('data-col-mobile', String(EMBED.colMobile || 2));
      root.setAttribute('data-col-tablet', String(EMBED.colTablet || 3));
      root.setAttribute('data-col-desktop', String(EMBED.colDesktop || 4));
      root.setAttribute('data-side-padding', String(EMBED.sidePadding != null ? EMBED.sidePadding : 0));
  
      root.innerHTML = `
        <div class="uf-theme-container">
          <div class="adv-filters-layout">
            <aside class="adv-filters-sidebar">
              <div class="adv-filters-box">
                <h3 class="adv-filters-title">Filtreler</h3>
                <div id="custom-material-filter-options" class="adv-filter-groups"></div>
              </div>
            </aside>
  
            <div class="adv-filters-content">
              <div class="adv-filters-toolbar">
                <div class="custom-grid-search">
                  <input
                    id="custom-grid-search"
                    class="custom-grid-search__input"
                    type="search"
                    placeholder="Ara"
                  >
                </div>
  
                <label class="adv-sort-label">
                  <span>Sırala</span>
                  <select class="custom-grid-sort__select" name="sort_by" aria-label="Sırala">
                    <option value="created-descending">Son Eklenenler</option>
                    <option value="created-ascending">İlk eklenenler</option>
                    <option value="title-ascending">İsim (A-Z)</option>
                    <option value="title-descending">İsim (Z-A)</option>
                    <option value="price-ascending">Fiyat (Artan)</option>
                    <option value="price-descending">Fiyat (Azalan)</option>
                  </select>
                </label>
              </div>
  
              <div id="custom-products-grid" class="adv-products-grid"></div>
              <div id="custom-products-pagination" class="adv-products-pagination"></div>
            </div>
          </div>
        </div>
      `;
  
      return root;
    }

    function findExplicitMountTarget() {
      const mountId = EMBED && EMBED.mountId ? String(EMBED.mountId) : '';
      if (mountId) {
        const el = document.getElementById(mountId);
        if (el) return el;
      }

      return null;
    }
    function applyThemeContainerSpacing(root, mountTarget, nativeGrid) {
        if (!root) return;
      
        const container =
          (mountTarget && mountTarget.closest('.page-width, .container, .collection, .section, .shopify-section')) ||
          (nativeGrid && nativeGrid.closest('.page-width, .container, .collection, .section, .shopify-section')) ||
          document.querySelector('.page-width, .container');
      
        if (!container) return;
      
        const styles = window.getComputedStyle(container);
      
        function toPxNumber(value) {
          const n = parseFloat(String(value || '0'));
          return Number.isFinite(n) ? n : 0;
        }

        root.style.boxSizing = 'border-box';
        root.style.width = '100%';
        root.style.maxWidth = styles.maxWidth && styles.maxWidth !== 'none' ? styles.maxWidth : '100%';
        const basePaddingLeft = toPxNumber(styles.paddingLeft);
        const basePaddingRight = toPxNumber(styles.paddingRight);
        root.style.marginLeft = styles.marginLeft === 'auto' ? 'auto' : '0';
        root.style.marginRight = styles.marginRight === 'auto' ? 'auto' : '0';

        const sidePaddingAttr = root.getAttribute('data-side-padding');
        const sidePadding = sidePaddingAttr != null ? Number(sidePaddingAttr) : 0;
        const extraPadding = !Number.isNaN(sidePadding) && sidePadding > 0 ? sidePadding : 0;

        // Keep theme container padding, optionally add extra side padding.
        root.style.paddingLeft = basePaddingLeft + extraPadding + 'px';
        root.style.paddingRight = basePaddingRight + extraPadding + 'px';
      }
      function mountRoot() {
        const root = createRoot();
        const mountTarget = findExplicitMountTarget() || findCollectionMountTarget();
        const nativeGrid = findNativeGridContainer();

        // Mount into the block's placeholder when available so ordering matches Theme Editor.
        if (mountTarget && !root.parentNode) {
          mountTarget.appendChild(root);
        } else if (!root.parentNode) {
          const main = document.querySelector('main');
          if (main) {
            main.appendChild(root);
          } else {
            document.body.appendChild(root);
          }
        }
      
        applyThemeContainerSpacing(root, mountTarget, nativeGrid);
      
        if (nativeGrid && EMBED.hideNativeGrid) {
          nativeGrid.style.display = 'none';
        }
      
        return root;
      }
  
    function getMainScriptUrl() {
      const embedScript =
        document.currentScript ||
        document.querySelector('script[src*="unlimited-filters-embed.js"]');
  
      if (!embedScript || !embedScript.src) {
        return null;
      }
  
      return embedScript.src.replace('unlimited-filters-embed.js', 'unlimited-filters.js');
    }
  
    function loadMainScript() {
      if (window.__UF_MAIN_SCRIPT_LOADED__) {
        return;
      }
  
      const existing = document.querySelector('script[data-uf-main-script="true"]');
      if (existing) {
        window.__UF_MAIN_SCRIPT_LOADED__ = true;
        return;
      }
  
      const mainScriptUrl = getMainScriptUrl();
      if (!mainScriptUrl) {
        console.error('UF_EMBED_ERROR', 'unlimited-filters.js URL bulunamadı');
        return;
      }
  
      const script = document.createElement('script');
      script.src = mainScriptUrl;
      script.defer = true;
      script.setAttribute('data-uf-main-script', 'true');
  
      script.onload = function () {
        window.__UF_MAIN_SCRIPT_LOADED__ = true;
      };
  
      script.onerror = function () {
        console.error('UF_EMBED_ERROR', 'unlimited-filters.js yüklenemedi');
      };
  
      document.head.appendChild(script);
    }
  
    function init() {
      if (!isCollectionPage()) return;
  
      mountRoot();
      loadMainScript();
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();