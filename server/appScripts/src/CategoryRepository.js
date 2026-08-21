function getCategoriesSheet() {
  var spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(CATEGORY_CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CATEGORY_CONFIG.SHEET_NAME);
  }

  ensureCategoriesHeader(sheet);

  return sheet;
}

function ensureCategoriesHeader(sheet) {
  var currentHeaders = sheet
    .getRange(CATEGORY_CONFIG.HEADER_ROW, 1, 1, CATEGORY_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];
  var headersMatch = CATEGORY_CONFIG.HEADERS.every(function(header, index) {
    return String(currentHeaders[index] || '').trim() === header;
  });

  if (headersMatch) {
    return;
  }

  sheet
    .getRange(CATEGORY_CONFIG.HEADER_ROW, 1, 1, CATEGORY_CONFIG.TOTAL_COLUMNS)
    .setValues([CATEGORY_CONFIG.HEADERS]);
}

var CATEGORY_ROWS_CACHE_KEY = 'categories:rows:v1';
var CATEGORY_ROWS_CACHE_META_KEY = CATEGORY_ROWS_CACHE_KEY + ':meta';
var CATEGORY_ROWS_CACHE_TTL_SECONDS = 30;
var CATEGORY_ROWS_CACHE_CHUNK_SIZE = 75000;

function getCategoryRows(sheet, lastRow) {
  if (lastRow < CATEGORY_CONFIG.FIRST_DATA_ROW) {
    return [];
  }

  var cachedRows = getCachedCategoryRows(lastRow);

  if (cachedRows) {
    return cachedRows;
  }

  var numberOfRows = lastRow - CATEGORY_CONFIG.FIRST_DATA_ROW + 1;
  var rows = sheet
    .getRange(CATEGORY_CONFIG.FIRST_DATA_ROW, 1, numberOfRows, CATEGORY_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues();

  cacheCategoryRows(rows, lastRow);

  return rows;
}

function getCachedCategoryRows(lastRow) {
  try {
    var cache = CacheService.getScriptCache();
    var metaValue = cache.get(CATEGORY_ROWS_CACHE_META_KEY);

    if (!metaValue) {
      return null;
    }

    var meta = JSON.parse(metaValue);

    if (meta.lastRow !== lastRow || meta.columns !== CATEGORY_CONFIG.TOTAL_COLUMNS || meta.chunks < 1) {
      return null;
    }

    var payload = '';

    for (var index = 0; index < meta.chunks; index += 1) {
      var chunk = cache.get(CATEGORY_ROWS_CACHE_KEY + ':' + index);

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

function cacheCategoryRows(rows, lastRow) {
  try {
    var cache = CacheService.getScriptCache();
    var payload = JSON.stringify(rows);
    var chunks = Math.ceil(payload.length / CATEGORY_ROWS_CACHE_CHUNK_SIZE);

    for (var index = 0; index < chunks; index += 1) {
      cache.put(
        CATEGORY_ROWS_CACHE_KEY + ':' + index,
        payload.slice(
          index * CATEGORY_ROWS_CACHE_CHUNK_SIZE,
          (index + 1) * CATEGORY_ROWS_CACHE_CHUNK_SIZE
        ),
        CATEGORY_ROWS_CACHE_TTL_SECONDS
      );
    }

    cache.put(
      CATEGORY_ROWS_CACHE_META_KEY,
      JSON.stringify({
        lastRow: lastRow,
        columns: CATEGORY_CONFIG.TOTAL_COLUMNS,
        chunks: chunks
      }),
      CATEGORY_ROWS_CACHE_TTL_SECONDS
    );
  } catch (error) {
    // CacheService is opportunistic; sheet reads remain the source of truth.
  }
}

function clearCategoriesCache() {
  try {
    var cache = CacheService.getScriptCache();
    var keys = [CATEGORY_ROWS_CACHE_META_KEY];
    var metaValue = cache.get(CATEGORY_ROWS_CACHE_META_KEY);

    if (metaValue) {
      var meta = JSON.parse(metaValue);

      for (var index = 0; index < meta.chunks; index += 1) {
        keys.push(CATEGORY_ROWS_CACHE_KEY + ':' + index);
      }
    }

    cache.removeAll(keys);
  } catch (error) {
    // The next read will fall back to the sheet if cache invalidation fails.
  }
}

function getCategoriesPage(options) {
  var sheet = getCategoriesSheet();
  var rows = getCategoryRows(sheet, sheet.getLastRow());
  var categories = rows
    .filter(function(row) {
      return String(row[0]).trim() !== '';
    })
    .map(rowToCategory)
    .filter(function(category) {
      return categoryMatchesQuery(category, options.query);
    })
    .sort(compareCategories);

  var total = categories.length;
  var startOffset = (options.page - 1) * options.pageSize;
  var pagedCategories = categories.slice(startOffset, startOffset + options.pageSize);

  return buildCategoriesPageResult(pagedCategories, total, options.page, options.pageSize);
}

function categoryMatchesQuery(category, query) {
  var normalizedQuery = normalizeCategorySearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  var tokens = normalizedQuery.split(' ').filter(Boolean);
  var searchableText = normalizeCategorySearchText([
    category.name,
    category.color
  ].join(' '));

  return searchableText.indexOf(normalizedQuery) !== -1 ||
    tokens.every(function(token) {
      return searchableText.indexOf(token) !== -1;
    });
}

function compareCategories(left, right) {
  var leftName = normalizeCategoryName(left.name);
  var rightName = normalizeCategoryName(right.name);

  if (leftName < rightName) return -1;
  if (leftName > rightName) return 1;
  return 0;
}

function buildCategoriesPageResult(categories, total, page, pageSize) {
  var totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

  return {
    categories: categories,
    total: total,
    page: page,
    pageSize: pageSize,
    totalPages: totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  };
}

function normalizeCategorySearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCategoryById(id) {
  var sheet = getCategoriesSheet();
  var rowNumber = findCategoryRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var row = sheet
    .getRange(rowNumber, 1, 1, CATEGORY_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];

  return rowToCategory(row);
}

function createCategory(category) {
  var sheet = getCategoriesSheet();
  var normalizedName = cleanValue(category.name || category.Name);

  assertCategoryNameIsUnique(sheet, normalizedName, '');

  var newId = generateCategoryId(sheet);
  var newRowNumber = sheet.getLastRow() + 1;
  var row = [
    newId,
    normalizedName,
    cleanValue(category.color),
    cleanCategoryApplyColorToAllItems(getCategoryInputApplyColorToAllItems(category))
  ];

  sheet
    .getRange(newRowNumber, CATEGORY_CONFIG.COLUMNS.id)
    .setNumberFormat('@');

  sheet
    .getRange(newRowNumber, 1, 1, CATEGORY_CONFIG.TOTAL_COLUMNS)
    .setValues([row]);

  SpreadsheetApp.flush();
  clearCategoriesCache();

  return rowToCategory(row);
}

function updateCategory(id, category) {
  var sheet = getCategoriesSheet();
  var rowNumber = findCategoryRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var currentRow = sheet
    .getRange(rowNumber, 1, 1, CATEGORY_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];

  var currentCategory = rowToCategory(currentRow);

  if (hasAny(category, ['name', 'Name'])) {
    var normalizedName = cleanValue(category.name !== undefined ? category.name : category.Name);
    assertCategoryNameIsUnique(sheet, normalizedName, id);
    currentCategory.name = normalizedName;
  }

  if (hasOwn(category, 'color')) {
    currentCategory.color = cleanValue(category.color);
  }

  if (hasAny(category, ['applyColorToAllItems', 'ApplyColorToAllItems'])) {
    currentCategory.applyColorToAllItems = cleanCategoryApplyColorToAllItems(
      getCategoryInputApplyColorToAllItems(category)
    );
  }

  var updatedRow = [
    currentCategory.id,
    currentCategory.name,
    currentCategory.color,
    currentCategory.applyColorToAllItems
  ];

  sheet
    .getRange(rowNumber, 1, 1, CATEGORY_CONFIG.TOTAL_COLUMNS)
    .setValues([updatedRow]);

  SpreadsheetApp.flush();
  clearCategoriesCache();

  return rowToCategory(updatedRow);
}

function deleteCategory(id) {
  var sheet = getCategoriesSheet();
  var rowNumber = findCategoryRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var deletedRow = sheet
    .getRange(rowNumber, 1, 1, CATEGORY_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];
  var deletedCategory = rowToCategory(deletedRow);

  sheet.deleteRow(rowNumber);
  SpreadsheetApp.flush();
  clearCategoriesCache();

  return deletedCategory;
}

function findCategoryRowById(sheet, id) {
  var lastRow = sheet.getLastRow();

  if (lastRow < CATEGORY_CONFIG.FIRST_DATA_ROW) {
    return -1;
  }

  var numberOfRows = lastRow - CATEGORY_CONFIG.FIRST_DATA_ROW + 1;
  var ids = sheet
    .getRange(CATEGORY_CONFIG.FIRST_DATA_ROW, CATEGORY_CONFIG.COLUMNS.id, numberOfRows, 1)
    .getDisplayValues()
    .flat();

  var index = ids.findIndex(function(currentId) {
    return String(currentId).trim() === String(id).trim();
  });

  if (index === -1) {
    return -1;
  }

  return CATEGORY_CONFIG.FIRST_DATA_ROW + index;
}

function generateCategoryId(sheet) {
  var id = Utilities.getUuid();

  while (findCategoryRowById(sheet, id) !== -1) {
    id = Utilities.getUuid();
  }

  return id;
}

function assertCategoryNameIsUnique(sheet, name, ignoredId) {
  var normalizedName = normalizeCategoryName(name);

  if (!normalizedName) {
    throw validationError('Category name is required.');
  }

  var rows = getCategoryRows(sheet, sheet.getLastRow());
  var duplicate = rows.some(function(row) {
    var category = rowToCategory(row);

    return category.id !== ignoredId && normalizeCategoryName(category.name) === normalizedName;
  });

  if (duplicate) {
    throw duplicateError('Category name must be unique.');
  }
}

function normalizeCategoryName(value) {
  return cleanValue(value).toLowerCase();
}

function getCategoryInputApplyColorToAllItems(category) {
  if (category.applyColorToAllItems !== undefined) {
    return category.applyColorToAllItems;
  }

  return category.ApplyColorToAllItems;
}

function cleanCategoryApplyColorToAllItems(value) {
  if (value === true) {
    return true;
  }

  var normalizedValue = String(value === undefined || value === null ? '' : value).trim().toLowerCase();

  return normalizedValue === 'true' ||
    normalizedValue === 'yes' ||
    normalizedValue === '1';
}
