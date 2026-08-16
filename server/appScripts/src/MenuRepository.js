function getMenusSheet() {
  var spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(MENU_CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(MENU_CONFIG.SHEET_NAME);
  }

  ensureMenusHeader(sheet);

  return sheet;
}

function ensureMenusHeader(sheet) {
  var currentHeaders = sheet
    .getRange(MENU_CONFIG.HEADER_ROW, 1, 1, MENU_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];
  var headersMatch = MENU_CONFIG.HEADERS.every(function(header, index) {
    return String(currentHeaders[index] || '').trim() === header;
  });

  if (headersMatch) {
    return;
  }

  sheet
    .getRange(MENU_CONFIG.HEADER_ROW, 1, 1, MENU_CONFIG.TOTAL_COLUMNS)
    .setValues([MENU_CONFIG.HEADERS]);
}

var MENU_ROWS_CACHE_KEY = 'menus:rows:v1';
var MENU_ROWS_CACHE_META_KEY = MENU_ROWS_CACHE_KEY + ':meta';
var MENU_ROWS_CACHE_TTL_SECONDS = 30;
var MENU_ROWS_CACHE_CHUNK_SIZE = 75000;

function getMenuRows(sheet, lastRow) {
  if (lastRow < MENU_CONFIG.FIRST_DATA_ROW) {
    return [];
  }

  var cachedRows = getCachedMenuRows(lastRow);

  if (cachedRows) {
    return cachedRows;
  }

  var numberOfRows = lastRow - MENU_CONFIG.FIRST_DATA_ROW + 1;
  var rows = sheet
    .getRange(MENU_CONFIG.FIRST_DATA_ROW, 1, numberOfRows, MENU_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues();

  cacheMenuRows(rows, lastRow);

  return rows;
}

function getCachedMenuRows(lastRow) {
  try {
    var cache = CacheService.getScriptCache();
    var metaValue = cache.get(MENU_ROWS_CACHE_META_KEY);

    if (!metaValue) {
      return null;
    }

    var meta = JSON.parse(metaValue);

    if (meta.lastRow !== lastRow || meta.columns !== MENU_CONFIG.TOTAL_COLUMNS || meta.chunks < 1) {
      return null;
    }

    var payload = '';

    for (var index = 0; index < meta.chunks; index += 1) {
      var chunk = cache.get(MENU_ROWS_CACHE_KEY + ':' + index);

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

function cacheMenuRows(rows, lastRow) {
  try {
    var cache = CacheService.getScriptCache();
    var payload = JSON.stringify(rows);
    var chunks = Math.ceil(payload.length / MENU_ROWS_CACHE_CHUNK_SIZE);

    for (var index = 0; index < chunks; index += 1) {
      cache.put(
        MENU_ROWS_CACHE_KEY + ':' + index,
        payload.slice(
          index * MENU_ROWS_CACHE_CHUNK_SIZE,
          (index + 1) * MENU_ROWS_CACHE_CHUNK_SIZE
        ),
        MENU_ROWS_CACHE_TTL_SECONDS
      );
    }

    cache.put(
      MENU_ROWS_CACHE_META_KEY,
      JSON.stringify({
        lastRow: lastRow,
        columns: MENU_CONFIG.TOTAL_COLUMNS,
        chunks: chunks
      }),
      MENU_ROWS_CACHE_TTL_SECONDS
    );
  } catch (error) {
    // CacheService is opportunistic; sheet reads remain the source of truth.
  }
}

function clearMenusCache() {
  try {
    var cache = CacheService.getScriptCache();
    var keys = [MENU_ROWS_CACHE_META_KEY];
    var metaValue = cache.get(MENU_ROWS_CACHE_META_KEY);

    if (metaValue) {
      var meta = JSON.parse(metaValue);

      for (var index = 0; index < meta.chunks; index += 1) {
        keys.push(MENU_ROWS_CACHE_KEY + ':' + index);
      }
    }

    cache.removeAll(keys);
  } catch (error) {
    // The next read will fall back to the sheet if cache invalidation fails.
  }
}

function getMenusPage(options) {
  var sheet = getMenusSheet();
  var rows = getMenuRows(sheet, sheet.getLastRow());
  var menus = rows
    .filter(function(row) {
      return String(row[0]).trim() !== '';
    })
    .map(rowToMenu)
    .filter(function(menu) {
      return menuMatchesActiveFilter(menu, options.active);
    })
    .filter(function(menu) {
      return menuMatchesQuery(menu, options.query);
    })
    .sort(compareMenus);

  var total = menus.length;
  var startOffset = (options.page - 1) * options.pageSize;
  var pagedMenus = menus.slice(startOffset, startOffset + options.pageSize);

  return buildMenusPageResult(pagedMenus, total, options.page, options.pageSize);
}

function menuMatchesActiveFilter(menu, active) {
  if (active === true) {
    return menu.isActive === true;
  }

  if (active === false) {
    return menu.isActive === false;
  }

  return true;
}

function menuMatchesQuery(menu, query) {
  var normalizedQuery = normalizeMenuSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  var tokens = normalizedQuery.split(' ').filter(Boolean);
  var searchableText = normalizeMenuSearchText([
    menu.name,
    menu.description
  ].join(' '));

  return searchableText.indexOf(normalizedQuery) !== -1 ||
    tokens.every(function(token) {
      return searchableText.indexOf(token) !== -1;
    });
}

function compareMenus(left, right) {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  var leftName = normalizeMenuName(left.name);
  var rightName = normalizeMenuName(right.name);

  if (leftName < rightName) return -1;
  if (leftName > rightName) return 1;
  return 0;
}

function buildMenusPageResult(menus, total, page, pageSize) {
  var totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

  return {
    menus: menus,
    total: total,
    page: page,
    pageSize: pageSize,
    totalPages: totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  };
}

function normalizeMenuSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getMenuById(id) {
  var sheet = getMenusSheet();
  var rowNumber = findMenuRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var row = sheet
    .getRange(rowNumber, 1, 1, MENU_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];

  return rowToMenu(row);
}

function createMenu(menu) {
  var sheet = getMenusSheet();
  var normalizedName = cleanValue(menu.name);

  assertMenuNameIsUnique(sheet, normalizedName, '');

  var newId = generateMenuId(sheet);
  var newRowNumber = sheet.getLastRow() + 1;
  var now = new Date().toISOString();
  var row = [
    newId,
    normalizedName,
    cleanValue(menu.description),
    normalizeMenuSortOrderValue(menu.sortOrder),
    cleanMenuIsActive(menu.isActive),
    now,
    now
  ];

  sheet
    .getRange(newRowNumber, MENU_CONFIG.COLUMNS.id)
    .setNumberFormat('@');

  sheet
    .getRange(newRowNumber, 1, 1, MENU_CONFIG.TOTAL_COLUMNS)
    .setValues([row]);

  SpreadsheetApp.flush();
  clearMenusCache();

  return rowToMenu(row);
}

function updateMenu(id, menu) {
  var sheet = getMenusSheet();
  var rowNumber = findMenuRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var currentRow = sheet
    .getRange(rowNumber, 1, 1, MENU_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];

  var currentMenu = rowToMenu(currentRow);

  if (hasOwn(menu, 'name')) {
    var normalizedName = cleanValue(menu.name);
    assertMenuNameIsUnique(sheet, normalizedName, id);
    currentMenu.name = normalizedName;
  }

  if (hasOwn(menu, 'description')) {
    currentMenu.description = cleanValue(menu.description);
  }

  if (hasOwn(menu, 'sortOrder')) {
    currentMenu.sortOrder = normalizeMenuSortOrderValue(menu.sortOrder);
  }

  if (hasOwn(menu, 'isActive')) {
    currentMenu.isActive = cleanMenuIsActive(menu.isActive);
  }

  currentMenu.updatedAt = new Date().toISOString();

  var updatedRow = [
    currentMenu.id,
    currentMenu.name,
    currentMenu.description,
    currentMenu.sortOrder,
    currentMenu.isActive,
    currentMenu.createdAt,
    currentMenu.updatedAt
  ];

  sheet
    .getRange(rowNumber, 1, 1, MENU_CONFIG.TOTAL_COLUMNS)
    .setValues([updatedRow]);

  SpreadsheetApp.flush();
  clearMenusCache();

  return rowToMenu(updatedRow);
}

function setMenuActive(id, isActive) {
  return updateMenu(id, { isActive: isActive });
}

function deleteMenu(id) {
  return setMenuActive(id, false);
}

function findMenuRowById(sheet, id) {
  var lastRow = sheet.getLastRow();

  if (lastRow < MENU_CONFIG.FIRST_DATA_ROW) {
    return -1;
  }

  var numberOfRows = lastRow - MENU_CONFIG.FIRST_DATA_ROW + 1;
  var ids = sheet
    .getRange(MENU_CONFIG.FIRST_DATA_ROW, MENU_CONFIG.COLUMNS.id, numberOfRows, 1)
    .getDisplayValues()
    .flat();

  var index = ids.findIndex(function(currentId) {
    return String(currentId).trim() === String(id).trim();
  });

  if (index === -1) {
    return -1;
  }

  return MENU_CONFIG.FIRST_DATA_ROW + index;
}

function generateMenuId(sheet) {
  var id = Utilities.getUuid();

  while (findMenuRowById(sheet, id) !== -1) {
    id = Utilities.getUuid();
  }

  return id;
}

function assertMenuNameIsUnique(sheet, name, ignoredId) {
  var normalizedName = normalizeMenuName(name);

  if (!normalizedName) {
    throw validationError('Menu name is required.');
  }

  var rows = getMenuRows(sheet, sheet.getLastRow());
  var duplicate = rows.some(function(row) {
    var menu = rowToMenu(row);

    return menu.id !== ignoredId && normalizeMenuName(menu.name) === normalizedName;
  });

  if (duplicate) {
    throw duplicateError('Menu name must be unique.');
  }
}

function normalizeMenuName(value) {
  return cleanValue(value).toLowerCase();
}

function normalizeMenuSortOrderValue(value) {
  if (value === undefined || value === null || cleanValue(value) === '') {
    return 0;
  }

  var number = Number(value);

  if (!Number.isFinite(number) || number < 0 || Math.floor(number) !== number) {
    throw validationError('Sort order must be a non-negative integer.');
  }

  return number;
}

function cleanMenuIsActive(value) {
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
