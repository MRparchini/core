function getMenuItemsSheet() {
  var spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(MENU_ITEM_CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(MENU_ITEM_CONFIG.SHEET_NAME);
  }

  ensureMenuItemsHeader(sheet);

  return sheet;
}

function ensureMenuItemsHeader(sheet) {
  var currentHeaders = sheet
    .getRange(MENU_ITEM_CONFIG.HEADER_ROW, 1, 1, MENU_ITEM_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];
  var headersMatch = MENU_ITEM_CONFIG.HEADERS.every(function(header, index) {
    return String(currentHeaders[index] || '').trim() === header;
  });

  if (headersMatch) {
    return;
  }

  if (menuItemsSheetHasData(sheet)) {
    throw validationError('MenuItems worksheet header is incompatible. Expected: ' + MENU_ITEM_CONFIG.HEADERS.join(', '));
  }

  sheet
    .getRange(MENU_ITEM_CONFIG.HEADER_ROW, 1, 1, MENU_ITEM_CONFIG.TOTAL_COLUMNS)
    .setValues([MENU_ITEM_CONFIG.HEADERS]);
}

function menuItemsSheetHasData(sheet) {
  var lastRow = sheet.getLastRow();

  if (lastRow < MENU_ITEM_CONFIG.FIRST_DATA_ROW) {
    return false;
  }

  var numberOfRows = lastRow - MENU_ITEM_CONFIG.FIRST_DATA_ROW + 1;
  var rows = sheet
    .getRange(MENU_ITEM_CONFIG.FIRST_DATA_ROW, 1, numberOfRows, MENU_ITEM_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues();

  return rows.some(function(row) {
    return row.some(function(value) {
      return String(value || '').trim() !== '';
    });
  });
}

var MENU_ITEM_ROWS_CACHE_KEY = 'menuItems:rows:v1';
var MENU_ITEM_ROWS_CACHE_META_KEY = MENU_ITEM_ROWS_CACHE_KEY + ':meta';
var MENU_ITEM_ROWS_CACHE_TTL_SECONDS = 30;
var MENU_ITEM_ROWS_CACHE_CHUNK_SIZE = 75000;

function getMenuItemRows(sheet, lastRow) {
  if (lastRow < MENU_ITEM_CONFIG.FIRST_DATA_ROW) {
    return [];
  }

  var cachedRows = getCachedMenuItemRows(lastRow);

  if (cachedRows) {
    return cachedRows;
  }

  var numberOfRows = lastRow - MENU_ITEM_CONFIG.FIRST_DATA_ROW + 1;
  var rows = sheet
    .getRange(MENU_ITEM_CONFIG.FIRST_DATA_ROW, 1, numberOfRows, MENU_ITEM_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues();

  cacheMenuItemRows(rows, lastRow);

  return rows;
}

function getCachedMenuItemRows(lastRow) {
  try {
    var cache = CacheService.getScriptCache();
    var metaValue = cache.get(MENU_ITEM_ROWS_CACHE_META_KEY);

    if (!metaValue) {
      return null;
    }

    var meta = JSON.parse(metaValue);

    if (meta.lastRow !== lastRow || meta.columns !== MENU_ITEM_CONFIG.TOTAL_COLUMNS || meta.chunks < 1) {
      return null;
    }

    var payload = '';

    for (var index = 0; index < meta.chunks; index += 1) {
      var chunk = cache.get(MENU_ITEM_ROWS_CACHE_KEY + ':' + index);

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

function cacheMenuItemRows(rows, lastRow) {
  try {
    var cache = CacheService.getScriptCache();
    var payload = JSON.stringify(rows);
    var chunks = Math.ceil(payload.length / MENU_ITEM_ROWS_CACHE_CHUNK_SIZE);

    for (var index = 0; index < chunks; index += 1) {
      cache.put(
        MENU_ITEM_ROWS_CACHE_KEY + ':' + index,
        payload.slice(
          index * MENU_ITEM_ROWS_CACHE_CHUNK_SIZE,
          (index + 1) * MENU_ITEM_ROWS_CACHE_CHUNK_SIZE
        ),
        MENU_ITEM_ROWS_CACHE_TTL_SECONDS
      );
    }

    cache.put(
      MENU_ITEM_ROWS_CACHE_META_KEY,
      JSON.stringify({
        lastRow: lastRow,
        columns: MENU_ITEM_CONFIG.TOTAL_COLUMNS,
        chunks: chunks
      }),
      MENU_ITEM_ROWS_CACHE_TTL_SECONDS
    );
  } catch (error) {
    // CacheService is opportunistic; sheet reads remain the source of truth.
  }
}

function clearMenuItemsCache() {
  try {
    var cache = CacheService.getScriptCache();
    var keys = [MENU_ITEM_ROWS_CACHE_META_KEY];
    var metaValue = cache.get(MENU_ITEM_ROWS_CACHE_META_KEY);

    if (metaValue) {
      var meta = JSON.parse(metaValue);

      for (var index = 0; index < meta.chunks; index += 1) {
        keys.push(MENU_ITEM_ROWS_CACHE_KEY + ':' + index);
      }
    }

    cache.removeAll(keys);
  } catch (error) {
    // The next read will fall back to the sheet if cache invalidation fails.
  }
}

function getMenuItemsPage(options) {
  var sheet = getMenuItemsSheet();
  var rows = getMenuItemRows(sheet, sheet.getLastRow());
  var joinData = loadMenuItemJoinData();
  var menuItems = rows
    .filter(function(row) {
      return String(row[0]).trim() !== '';
    })
    .map(rowToMenuItem)
    .map(function(menuItem) {
      return addMenuItemDerivedFields(menuItem, joinData);
    })
    .filter(function(menuItem) {
      return menuItemMatchesFilters(menuItem, options);
    })
    .filter(function(menuItem) {
      return menuItemMatchesQuery(menuItem, options.query);
    })
    .sort(function(left, right) {
      return compareMenuItems(left, right, joinData);
    });

  var total = menuItems.length;
  var startOffset = (options.page - 1) * options.pageSize;
  var pagedMenuItems = menuItems.slice(startOffset, startOffset + options.pageSize);

  return buildMenuItemsPageResult(pagedMenuItems, total, options.page, options.pageSize);
}

function getMenuItemById(id) {
  var sheet = getMenuItemsSheet();
  var rowNumber = findMenuItemRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var row = sheet
    .getRange(rowNumber, 1, 1, MENU_ITEM_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];

  return addMenuItemDerivedFields(rowToMenuItem(row), loadMenuItemJoinData());
}

function createMenuItem(menuItem) {
  var sheet = getMenuItemsSheet();
  var joinData = loadMenuItemJoinData();
  var normalizedMenuItem = normalizeMenuItemInput(menuItem, null);

  assertMenuItemRelationshipsExist(normalizedMenuItem, joinData);
  assertMenuItemRelationshipIsUnique(sheet, normalizedMenuItem.menuId, normalizedMenuItem.productId, '');

  var newId = generateMenuItemId(sheet);
  var newRowNumber = sheet.getLastRow() + 1;
  var now = new Date().toISOString();
  var row = [
    newId,
    normalizedMenuItem.menuId,
    normalizedMenuItem.productId,
    normalizedMenuItem.displayName,
    normalizedMenuItem.descriptionOverride,
    normalizedMenuItem.basePricePence,
    normalizedMenuItem.sortOrder,
    normalizedMenuItem.isActive,
    now,
    now
  ];

  sheet
    .getRange(newRowNumber, MENU_ITEM_CONFIG.COLUMNS.id)
    .setNumberFormat('@');

  sheet
    .getRange(newRowNumber, 1, 1, MENU_ITEM_CONFIG.TOTAL_COLUMNS)
    .setValues([row]);

  SpreadsheetApp.flush();
  clearMenuItemsCache();

  return addMenuItemDerivedFields(rowToMenuItem(row), joinData);
}

function updateMenuItem(id, menuItem) {
  var sheet = getMenuItemsSheet();
  var rowNumber = findMenuItemRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var currentRow = sheet
    .getRange(rowNumber, 1, 1, MENU_ITEM_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];
  var currentMenuItem = rowToMenuItem(currentRow);
  var normalizedMenuItem = normalizeMenuItemInput(menuItem, currentMenuItem);
  var joinData = loadMenuItemJoinData();

  assertMenuItemRelationshipsExist(normalizedMenuItem, joinData);
  assertMenuItemRelationshipIsUnique(sheet, normalizedMenuItem.menuId, normalizedMenuItem.productId, id);

  normalizedMenuItem.updatedAt = new Date().toISOString();

  var updatedRow = [
    normalizedMenuItem.id,
    normalizedMenuItem.menuId,
    normalizedMenuItem.productId,
    normalizedMenuItem.displayName,
    normalizedMenuItem.descriptionOverride,
    normalizedMenuItem.basePricePence,
    normalizedMenuItem.sortOrder,
    normalizedMenuItem.isActive,
    normalizedMenuItem.createdAt,
    normalizedMenuItem.updatedAt
  ];

  sheet
    .getRange(rowNumber, 1, 1, MENU_ITEM_CONFIG.TOTAL_COLUMNS)
    .setValues([updatedRow]);

  SpreadsheetApp.flush();
  clearMenuItemsCache();

  return addMenuItemDerivedFields(rowToMenuItem(updatedRow), joinData);
}

function setMenuItemActive(id, isActive) {
  return updateMenuItem(id, { isActive: isActive });
}

function deleteMenuItem(id) {
  return setMenuItemActive(id, false);
}

function upsertBaseMenuItemForCloverImport(importedProduct) {
  if (!importedProduct || typeof importedProduct !== 'object') {
    throw validationError('Imported product object is required.');
  }

  var cloverId = cleanValue(importedProduct.cloverId || importedProduct.CloverID || importedProduct['Clover ID']);

  if (!cloverId) {
    throw validationError('CloverID is required for MenuItem import.');
  }

  var product = findProductByCloverIdForMenuItemImport(cloverId);
  var baseMenu = getActiveBaseMenuForMenuItemImport();
  var basePricePence = normalizeMenuItemPenceInput(getMenuItemInputBasePricePence(importedProduct));
  var isActive = hasAny(importedProduct, ['isActive', 'IsActive', 'active', 'Active'])
    ? cleanMenuItemIsActive(
      importedProduct.isActive !== undefined
        ? importedProduct.isActive
        : importedProduct.IsActive !== undefined
          ? importedProduct.IsActive
          : importedProduct.active !== undefined
            ? importedProduct.active
            : importedProduct.Active
    )
    : true;

  return upsertMenuItemForCloverImport({
    menuId: baseMenu.id,
    productId: product.id,
    displayName: cleanValue(importedProduct.displayName || importedProduct.DisplayName || product.name),
    descriptionOverride: cleanValue(importedProduct.descriptionOverride || importedProduct.DescriptionOverride || ''),
    basePricePence: basePricePence,
    sortOrder: normalizeNonNegativeIntegerInput(importedProduct.sortOrder || importedProduct.SortOrder || 0, 'SortOrder'),
    isActive: isActive
  });
}

function upsertMenuItemForCloverImport(menuItem) {
  var sheet = getMenuItemsSheet();
  var joinData = loadMenuItemJoinData();
  var normalizedMenuItem = normalizeMenuItemInput(menuItem, null);

  assertMenuItemRelationshipsExist(normalizedMenuItem, joinData);

  var rowNumber = findMenuItemRowByMenuAndProduct(
    sheet,
    normalizedMenuItem.menuId,
    normalizedMenuItem.productId
  );

  if (rowNumber === -1) {
    return createMenuItem(normalizedMenuItem);
  }

  var currentRow = sheet
    .getRange(rowNumber, 1, 1, MENU_ITEM_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];
  var currentMenuItem = rowToMenuItem(currentRow);
  var updatedMenuItem = normalizeMenuItemInput({
    basePricePence: normalizedMenuItem.basePricePence,
    isActive: normalizedMenuItem.isActive
  }, currentMenuItem);

  updatedMenuItem.updatedAt = new Date().toISOString();

  var updatedRow = [
    updatedMenuItem.id,
    updatedMenuItem.menuId,
    updatedMenuItem.productId,
    updatedMenuItem.displayName,
    updatedMenuItem.descriptionOverride,
    updatedMenuItem.basePricePence,
    updatedMenuItem.sortOrder,
    updatedMenuItem.isActive,
    updatedMenuItem.createdAt,
    updatedMenuItem.updatedAt
  ];

  sheet
    .getRange(rowNumber, 1, 1, MENU_ITEM_CONFIG.TOTAL_COLUMNS)
    .setValues([updatedRow]);

  SpreadsheetApp.flush();
  clearMenuItemsCache();

  return addMenuItemDerivedFields(rowToMenuItem(updatedRow), joinData);
}

function normalizeMenuItemInput(input, currentMenuItem) {
  var menuItem = currentMenuItem ? {
    id: currentMenuItem.id,
    menuId: currentMenuItem.menuId,
    productId: currentMenuItem.productId,
    displayName: currentMenuItem.displayName,
    descriptionOverride: currentMenuItem.descriptionOverride,
    basePricePence: currentMenuItem.basePricePence,
    sortOrder: currentMenuItem.sortOrder,
    isActive: currentMenuItem.isActive,
    createdAt: currentMenuItem.createdAt,
    updatedAt: currentMenuItem.updatedAt
  } : {
    id: '',
    menuId: '',
    productId: '',
    displayName: '',
    descriptionOverride: '',
    basePricePence: 0,
    sortOrder: 0,
    isActive: true,
    createdAt: '',
    updatedAt: ''
  };

  if (hasAny(input, ['menuId', 'menuID', 'MenuID'])) {
    menuItem.menuId = getMenuItemInputMenuId(input);
  }

  if (hasAny(input, ['productId', 'productID', 'ProductID'])) {
    menuItem.productId = getMenuItemInputProductId(input);
  }

  if (hasAny(input, ['displayName', 'DisplayName'])) {
    menuItem.displayName = cleanValue(input.displayName !== undefined ? input.displayName : input.DisplayName);
  }

  if (hasAny(input, ['descriptionOverride', 'DescriptionOverride'])) {
    menuItem.descriptionOverride = cleanValue(input.descriptionOverride !== undefined ? input.descriptionOverride : input.DescriptionOverride);
  }

  if (
    hasAny(input, [
      'basePricePence',
      'BasePricePence',
      'basePrice',
      'BasePrice',
      'basePricePounds',
      'BasePricePounds',
      'price',
      'Price'
    ])
  ) {
    menuItem.basePricePence = normalizeMenuItemPenceInput(getMenuItemInputBasePricePence(input));
  }

  if (hasAny(input, ['sortOrder', 'SortOrder'])) {
    menuItem.sortOrder = normalizeNonNegativeIntegerInput(getMenuItemInputSortOrder(input), 'SortOrder');
  }

  if (hasAny(input, ['isActive', 'IsActive'])) {
    menuItem.isActive = cleanMenuItemIsActive(input.isActive !== undefined ? input.isActive : input.IsActive);
  }

  return menuItem;
}

function assertMenuItemRelationshipsExist(menuItem, joinData) {
  if (!joinData.menuById[menuItem.menuId]) {
    throw validationError('MenuID must reference an existing Menu.');
  }

  if (!joinData.productById[menuItem.productId]) {
    throw validationError('ProductID must reference an existing Product.');
  }
}

function assertMenuItemRelationshipIsUnique(sheet, menuId, productId, ignoredId) {
  var rows = getMenuItemRows(sheet, sheet.getLastRow());
  var duplicate = rows.some(function(row) {
    var menuItem = rowToMenuItem(row);

    return menuItem.id !== ignoredId &&
      menuItem.menuId === menuId &&
      menuItem.productId === productId;
  });

  if (duplicate) {
    throw duplicateError('MenuItem already exists for this MenuID and ProductID. Reactivate or edit the existing MenuItem.');
  }
}

function loadMenuItemJoinData() {
  var menuSheet = getMenusSheet();
  var productSheet = getProductsSheet();
  var menuRows = getMenuRows(menuSheet, menuSheet.getLastRow());
  var productRows = productSheet.getLastRow() < PRODUCT_CONFIG.FIRST_DATA_ROW
    ? []
    : getProductRowsForSearch(productSheet, productSheet.getLastRow());
  var menuById = {};
  var productById = {};

  menuRows
    .filter(function(row) {
      return String(row[0]).trim() !== '';
    })
    .map(rowToMenu)
    .forEach(function(menu) {
      menuById[menu.id] = menu;
    });

  productRows
    .filter(function(row) {
      return String(row[0]).trim() !== '';
    })
    .map(rowToProduct)
    .forEach(function(product) {
      productById[product.id] = product;
    });

  return {
    menuById: menuById,
    productById: productById
  };
}

function addMenuItemDerivedFields(menuItem, joinData) {
  var menu = joinData.menuById[menuItem.menuId] || null;
  var product = joinData.productById[menuItem.productId] || null;
  var menuName = menu ? menu.name : '';
  var menuIsActive = menu ? menu.isActive : false;
  var productName = product ? product.name : '';
  var kitchenName = product ? product.kitchenName : '';
  var productIsActive = product ? product.isActive : false;
  var effectiveDisplayName = menuItem.displayName || productName;
  var effectiveDescription = menuItem.descriptionOverride || (product ? product.description : '');

  return {
    id: menuItem.id,
    menuId: menuItem.menuId,
    productId: menuItem.productId,
    displayName: menuItem.displayName,
    descriptionOverride: menuItem.descriptionOverride,
    basePricePence: menuItem.basePricePence,
    sortOrder: menuItem.sortOrder,
    isActive: menuItem.isActive,
    createdAt: menuItem.createdAt,
    updatedAt: menuItem.updatedAt,
    menuName: menuName,
    menuIsActive: menuIsActive,
    productName: productName,
    kitchenName: kitchenName,
    productIsActive: productIsActive,
    effectiveDisplayName: effectiveDisplayName,
    effectiveDescription: effectiveDescription,
    effectiveIsActive: menuItem.isActive && menuIsActive && productIsActive
  };
}

function menuItemMatchesFilters(menuItem, options) {
  if (options.menuId && menuItem.menuId !== options.menuId) {
    return false;
  }

  if (options.productId && menuItem.productId !== options.productId) {
    return false;
  }

  if (options.active === true && menuItem.isActive !== true) {
    return false;
  }

  if (options.active === false && menuItem.isActive !== false) {
    return false;
  }

  if (options.effectiveActive === true && menuItem.effectiveIsActive !== true) {
    return false;
  }

  if (options.effectiveActive === false && menuItem.effectiveIsActive !== false) {
    return false;
  }

  return true;
}

function menuItemMatchesQuery(menuItem, query) {
  var normalizedQuery = normalizeMenuItemSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  var tokens = normalizedQuery.split(' ').filter(Boolean);
  var normalizedSearchableText = normalizeMenuItemSearchText([
    menuItem.effectiveDisplayName,
    menuItem.displayName,
    menuItem.productName,
    menuItem.kitchenName,
    menuItem.menuName
  ].join(' '));

  return normalizedSearchableText.indexOf(normalizedQuery) !== -1 ||
    tokens.every(function(token) {
      return normalizedSearchableText.indexOf(token) !== -1;
    });
}

function compareMenuItems(left, right, joinData) {
  var leftMenu = joinData.menuById[left.menuId] || null;
  var rightMenu = joinData.menuById[right.menuId] || null;
  var leftMenuSortOrder = leftMenu ? leftMenu.sortOrder : 0;
  var rightMenuSortOrder = rightMenu ? rightMenu.sortOrder : 0;

  if (leftMenuSortOrder !== rightMenuSortOrder) {
    return leftMenuSortOrder - rightMenuSortOrder;
  }

  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  var leftName = normalizeMenuItemSearchText(left.effectiveDisplayName);
  var rightName = normalizeMenuItemSearchText(right.effectiveDisplayName);

  if (leftName < rightName) return -1;
  if (leftName > rightName) return 1;
  return 0;
}

function buildMenuItemsPageResult(menuItems, total, page, pageSize) {
  var totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

  return {
    menuItems: menuItems,
    total: total,
    page: page,
    pageSize: pageSize,
    totalPages: totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  };
}

function normalizeMenuItemSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findMenuItemRowById(sheet, id) {
  var lastRow = sheet.getLastRow();

  if (lastRow < MENU_ITEM_CONFIG.FIRST_DATA_ROW) {
    return -1;
  }

  var numberOfRows = lastRow - MENU_ITEM_CONFIG.FIRST_DATA_ROW + 1;
  var ids = sheet
    .getRange(MENU_ITEM_CONFIG.FIRST_DATA_ROW, MENU_ITEM_CONFIG.COLUMNS.id, numberOfRows, 1)
    .getDisplayValues()
    .flat();

  var index = ids.findIndex(function(currentId) {
    return String(currentId).trim() === String(id).trim();
  });

  if (index === -1) {
    return -1;
  }

  return MENU_ITEM_CONFIG.FIRST_DATA_ROW + index;
}

function findMenuItemRowByMenuAndProduct(sheet, menuId, productId) {
  var lastRow = sheet.getLastRow();

  if (lastRow < MENU_ITEM_CONFIG.FIRST_DATA_ROW) {
    return -1;
  }

  var rows = getMenuItemRows(sheet, lastRow);
  var index = rows.findIndex(function(row) {
    var menuItem = rowToMenuItem(row);

    return menuItem.menuId === menuId && menuItem.productId === productId;
  });

  if (index === -1) {
    return -1;
  }

  return MENU_ITEM_CONFIG.FIRST_DATA_ROW + index;
}

function generateMenuItemId(sheet) {
  var id = Utilities.getUuid();

  while (findMenuItemRowById(sheet, id) !== -1) {
    id = Utilities.getUuid();
  }

  return id;
}

function getActiveBaseMenuForMenuItemImport() {
  var menuSheet = getMenusSheet();
  var menuRows = getMenuRows(menuSheet, menuSheet.getLastRow());
  var baseMenus = menuRows
    .filter(function(row) {
      return String(row[0]).trim() !== '';
    })
    .map(rowToMenu)
    .filter(function(menu) {
      return menu.isActive && normalizeMenuName(menu.name) === 'base';
    });

  if (baseMenus.length !== 1) {
    throw validationError('MenuItem import requires exactly one active Menu named Base.');
  }

  return baseMenus[0];
}

function findProductByCloverIdForMenuItemImport(cloverId) {
  var sheet = getProductsSheet();
  var headerRow = sheet
    .getRange(PRODUCT_CONFIG.HEADER_ROW, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0];
  var cloverColumnIndex = headerRow.findIndex(function(header) {
    return String(header || '').trim() === 'CloverID';
  });

  if (cloverColumnIndex === -1) {
    throw validationError('Products.CloverID header is required for MenuItem import.');
  }

  if (sheet.getLastRow() < PRODUCT_CONFIG.FIRST_DATA_ROW) {
    throw notFoundError('Product with CloverID ' + cloverId + ' was not found.');
  }

  var numberOfRows = sheet.getLastRow() - PRODUCT_CONFIG.FIRST_DATA_ROW + 1;
  var numberOfColumns = Math.max(PRODUCT_CONFIG.TOTAL_COLUMNS, cloverColumnIndex + 1);
  var rows = sheet
    .getRange(PRODUCT_CONFIG.FIRST_DATA_ROW, 1, numberOfRows, numberOfColumns)
    .getDisplayValues();
  var matches = rows
    .filter(function(row) {
      return String(row[0]).trim() !== '' && cleanValue(row[cloverColumnIndex]) === cloverId;
    })
    .map(rowToProduct);

  if (matches.length > 1) {
    throw duplicateError('Products.CloverID must be unique before MenuItem import.');
  }

  if (matches.length === 0) {
    throw notFoundError('Product with CloverID ' + cloverId + ' was not found.');
  }

  return matches[0];
}

function cleanMenuItemIsActive(value) {
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
