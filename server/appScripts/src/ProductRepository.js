function getProductsSheet() {
  var spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(PRODUCT_CONFIG.SHEET_NAME);

  if (!sheet) {
    throw new Error('Products sheet was not found.');
  }

  return sheet;
}

var PRODUCT_ROWS_CACHE_KEY = 'products:rows:v1';
var PRODUCT_ROWS_CACHE_META_KEY = PRODUCT_ROWS_CACHE_KEY + ':meta';
var PRODUCT_ROWS_CACHE_TTL_SECONDS = 30;
var PRODUCT_ROWS_CACHE_CHUNK_SIZE = 75000;

function getProductRowsForSearch(sheet, lastRow) {
  var cachedRows = getCachedProductRows(lastRow);

  if (cachedRows) {
    return cachedRows;
  }

  var numberOfRows = lastRow - PRODUCT_CONFIG.FIRST_DATA_ROW + 1;
  var rows = sheet
    .getRange(PRODUCT_CONFIG.FIRST_DATA_ROW, 1, numberOfRows, PRODUCT_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues();

  cacheProductRows(rows, lastRow);

  return rows;
}

function getCachedProductRows(lastRow) {
  try {
    var cache = CacheService.getScriptCache();
    var metaValue = cache.get(PRODUCT_ROWS_CACHE_META_KEY);

    if (!metaValue) {
      return null;
    }

    var meta = JSON.parse(metaValue);

    if (meta.lastRow !== lastRow || meta.columns !== PRODUCT_CONFIG.TOTAL_COLUMNS || meta.chunks < 1) {
      return null;
    }

    var payload = '';

    for (var index = 0; index < meta.chunks; index += 1) {
      var chunk = cache.get(PRODUCT_ROWS_CACHE_KEY + ':' + index);

      if (chunk === null) {
        return null;
      }

      payload += chunk;
    }

    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
}

function cacheProductRows(rows, lastRow) {
  try {
    var cache = CacheService.getScriptCache();
    var payload = JSON.stringify(rows);
    var chunks = Math.ceil(payload.length / PRODUCT_ROWS_CACHE_CHUNK_SIZE);

    for (var index = 0; index < chunks; index += 1) {
      cache.put(
        PRODUCT_ROWS_CACHE_KEY + ':' + index,
        payload.slice(
          index * PRODUCT_ROWS_CACHE_CHUNK_SIZE,
          (index + 1) * PRODUCT_ROWS_CACHE_CHUNK_SIZE
        ),
        PRODUCT_ROWS_CACHE_TTL_SECONDS
      );
    }

    cache.put(
      PRODUCT_ROWS_CACHE_META_KEY,
      JSON.stringify({
        lastRow: lastRow,
        columns: PRODUCT_CONFIG.TOTAL_COLUMNS,
        chunks: chunks
      }),
      PRODUCT_ROWS_CACHE_TTL_SECONDS
    );
  } catch (error) {
    // CacheService is opportunistic; sheet reads remain the source of truth.
  }
}

function clearProductsCache() {
  try {
    var cache = CacheService.getScriptCache();
    var keys = [PRODUCT_ROWS_CACHE_META_KEY];
    var metaValue = cache.get(PRODUCT_ROWS_CACHE_META_KEY);

    if (metaValue) {
      var meta = JSON.parse(metaValue);

      for (var index = 0; index < meta.chunks; index += 1) {
        keys.push(PRODUCT_ROWS_CACHE_KEY + ':' + index);
      }
    }

    cache.removeAll(keys);
  } catch (error) {
    // The next read will fall back to the sheet if cache invalidation fails.
  }
}

function getProductsPage(options) {
  var sheet = getProductsSheet();
  var lastRow = sheet.getLastRow();
  var page = options.page;
  var pageSize = options.pageSize;
  var query = options.query;

  if (lastRow < PRODUCT_CONFIG.FIRST_DATA_ROW) {
    return buildProductsPageResult([], 0, page, pageSize);
  }

  var rows = getProductRowsForSearch(sheet, lastRow);
  var matchedProducts = rows
    .filter(function(row) {
      return String(row[0]).trim() !== '';
    })
    .map(rowToProduct)
    .filter(function(product) {
      return productMatchesActiveFilter(product, options.active);
    })
    .filter(function(product) {
      return productMatchesQuery(product, query);
    });

  var startOffset = (page - 1) * pageSize;
  var products = matchedProducts.slice(startOffset, startOffset + pageSize);

  return buildProductsPageResult(products, matchedProducts.length, page, pageSize);
}

function productMatchesActiveFilter(product, active) {
  if (active === true) {
    return product.isActive === true;
  }

  if (active === false) {
    return product.isActive === false;
  }

  return true;
}

function productMatchesQuery(product, query) {
  var normalizedQuery = normalizeProductSearchText(query);
  var tokens = normalizedQuery.split(' ').filter(Boolean);

  if (!normalizedQuery) {
    return true;
  }

  var searchableText = [
    product.name,
    product.kitchenName
  ].join(' ');
  var normalizedSearchableText = normalizeProductSearchText(searchableText);

  return normalizedSearchableText.indexOf(normalizedQuery) !== -1 ||
    tokens.every(function(token) {
      return normalizedSearchableText.indexOf(token) !== -1;
    });
}

function buildProductsPageResult(products, total, page, pageSize) {
  var totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

  return {
    products: products,
    total: total,
    page: page,
    pageSize: pageSize,
    totalPages: totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  };
}

function normalizeProductSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getProductById(id) {
  var sheet = getProductsSheet();
  var rowNumber = findProductRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var row = sheet
    .getRange(rowNumber, 1, 1, PRODUCT_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];

  return rowToProduct(row);
}

function createProduct(product) {
  var sheet = getProductsSheet();
  var newId = generateProductId(sheet);
  var newRowNumber = sheet.getLastRow() + 1;
  var now = new Date().toISOString();
  var row = [
    newId,
    cleanValue(product.name),
    cleanValue(product.kitchenName),
    cleanValue(product.category),
    cleanProductIsActive(product.isActive),
    cleanValue(product.description),
    now,
    now
  ];

  sheet
    .getRange(newRowNumber, PRODUCT_CONFIG.COLUMNS.id)
    .setNumberFormat('@');

  sheet
    .getRange(newRowNumber, 1, 1, PRODUCT_CONFIG.TOTAL_COLUMNS)
    .setValues([row]);

  SpreadsheetApp.flush();
  clearProductsCache();

  return rowToProduct(row);
}

function updateProduct(id, product) {
  var sheet = getProductsSheet();
  var rowNumber = findProductRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var currentRow = sheet
    .getRange(rowNumber, 1, 1, PRODUCT_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];

  var currentProduct = rowToProduct(currentRow);

  if (hasOwn(product, 'name')) currentProduct.name = cleanValue(product.name);
  if (hasOwn(product, 'kitchenName')) currentProduct.kitchenName = cleanValue(product.kitchenName);
  if (hasOwn(product, 'category')) currentProduct.category = cleanValue(product.category);
  if (hasOwn(product, 'isActive')) currentProduct.isActive = cleanProductIsActive(product.isActive);
  if (hasOwn(product, 'description')) currentProduct.description = cleanValue(product.description);

  currentProduct.updatedAt = new Date().toISOString();

  var updatedRow = [
    currentProduct.id,
    currentProduct.name,
    currentProduct.kitchenName,
    currentProduct.category,
    currentProduct.isActive,
    currentProduct.description,
    currentProduct.createdAt,
    currentProduct.updatedAt
  ];

  sheet
    .getRange(rowNumber, 1, 1, PRODUCT_CONFIG.TOTAL_COLUMNS)
    .setValues([updatedRow]);

  SpreadsheetApp.flush();
  clearProductsCache();

  return rowToProduct(updatedRow);
}

function setProductActive(id, isActive) {
  return updateProduct(id, { isActive: isActive });
}

function deleteProduct(id) {
  return setProductActive(id, false);
}

function findProductRowById(sheet, id) {
  var lastRow = sheet.getLastRow();

  if (lastRow < PRODUCT_CONFIG.FIRST_DATA_ROW) {
    return -1;
  }

  var numberOfRows = lastRow - PRODUCT_CONFIG.FIRST_DATA_ROW + 1;
  var ids = sheet
    .getRange(PRODUCT_CONFIG.FIRST_DATA_ROW, PRODUCT_CONFIG.COLUMNS.id, numberOfRows, 1)
    .getDisplayValues()
    .flat();

  var index = ids.findIndex(function(currentId) {
    return String(currentId).trim() === String(id).trim();
  });

  if (index === -1) {
    return -1;
  }

  return PRODUCT_CONFIG.FIRST_DATA_ROW + index;
}

function generateProductId(sheet) {
  var id = Utilities.getUuid();

  while (findProductRowById(sheet, id) !== -1) {
    id = Utilities.getUuid();
  }

  return id;
}

function cleanProductIsActive(value) {
  if (value === false) {
    return false;
  }

  var normalizedValue = String(value === undefined || value === null ? '' : value).trim().toLowerCase();

  if (
    normalizedValue === 'false' ||
    normalizedValue === 'no' ||
    normalizedValue === '0' ||
    normalizedValue === 'inactive'
  ) {
    return false;
  }

  return true;
}
