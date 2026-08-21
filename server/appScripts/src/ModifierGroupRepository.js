function getModifierGroupsSheet() {
  var spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(MODIFIER_GROUP_CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(MODIFIER_GROUP_CONFIG.SHEET_NAME);
  }

  ensureModifierGroupsHeader(sheet);

  return sheet;
}

function ensureModifierGroupsHeader(sheet) {
  var currentHeaders = sheet
    .getRange(MODIFIER_GROUP_CONFIG.HEADER_ROW, 1, 1, MODIFIER_GROUP_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];
  var headersMatch = MODIFIER_GROUP_CONFIG.HEADERS.every(function(header, index) {
    return String(currentHeaders[index] || '').trim() === header;
  });

  if (headersMatch) {
    return;
  }

  sheet
    .getRange(MODIFIER_GROUP_CONFIG.HEADER_ROW, 1, 1, MODIFIER_GROUP_CONFIG.TOTAL_COLUMNS)
    .setValues([MODIFIER_GROUP_CONFIG.HEADERS]);
}

var MODIFIER_GROUP_ROWS_CACHE_KEY = 'modifierGroups:rows:v1';
var MODIFIER_GROUP_ROWS_CACHE_META_KEY = MODIFIER_GROUP_ROWS_CACHE_KEY + ':meta';
var MODIFIER_GROUP_ROWS_CACHE_TTL_SECONDS = 30;
var MODIFIER_GROUP_ROWS_CACHE_CHUNK_SIZE = 75000;

function getModifierGroupRows(sheet, lastRow) {
  if (lastRow < MODIFIER_GROUP_CONFIG.FIRST_DATA_ROW) {
    return [];
  }

  var cachedRows = getCachedModifierGroupRows(lastRow);

  if (cachedRows) {
    return cachedRows;
  }

  var numberOfRows = lastRow - MODIFIER_GROUP_CONFIG.FIRST_DATA_ROW + 1;
  var rows = sheet
    .getRange(MODIFIER_GROUP_CONFIG.FIRST_DATA_ROW, 1, numberOfRows, MODIFIER_GROUP_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues();

  cacheModifierGroupRows(rows, lastRow);

  return rows;
}

function getCachedModifierGroupRows(lastRow) {
  try {
    var cache = CacheService.getScriptCache();
    var metaValue = cache.get(MODIFIER_GROUP_ROWS_CACHE_META_KEY);

    if (!metaValue) {
      return null;
    }

    var meta = JSON.parse(metaValue);

    if (meta.lastRow !== lastRow || meta.columns !== MODIFIER_GROUP_CONFIG.TOTAL_COLUMNS || meta.chunks < 1) {
      return null;
    }

    var payload = '';

    for (var index = 0; index < meta.chunks; index += 1) {
      var chunk = cache.get(MODIFIER_GROUP_ROWS_CACHE_KEY + ':' + index);

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

function cacheModifierGroupRows(rows, lastRow) {
  try {
    var cache = CacheService.getScriptCache();
    var payload = JSON.stringify(rows);
    var chunks = Math.ceil(payload.length / MODIFIER_GROUP_ROWS_CACHE_CHUNK_SIZE);

    for (var index = 0; index < chunks; index += 1) {
      cache.put(
        MODIFIER_GROUP_ROWS_CACHE_KEY + ':' + index,
        payload.slice(
          index * MODIFIER_GROUP_ROWS_CACHE_CHUNK_SIZE,
          (index + 1) * MODIFIER_GROUP_ROWS_CACHE_CHUNK_SIZE
        ),
        MODIFIER_GROUP_ROWS_CACHE_TTL_SECONDS
      );
    }

    cache.put(
      MODIFIER_GROUP_ROWS_CACHE_META_KEY,
      JSON.stringify({
        lastRow: lastRow,
        columns: MODIFIER_GROUP_CONFIG.TOTAL_COLUMNS,
        chunks: chunks
      }),
      MODIFIER_GROUP_ROWS_CACHE_TTL_SECONDS
    );
  } catch (error) {
    // CacheService is opportunistic; sheet reads remain the source of truth.
  }
}

function clearModifierGroupsCache() {
  try {
    var cache = CacheService.getScriptCache();
    var keys = [MODIFIER_GROUP_ROWS_CACHE_META_KEY];
    var metaValue = cache.get(MODIFIER_GROUP_ROWS_CACHE_META_KEY);

    if (metaValue) {
      var meta = JSON.parse(metaValue);

      for (var index = 0; index < meta.chunks; index += 1) {
        keys.push(MODIFIER_GROUP_ROWS_CACHE_KEY + ':' + index);
      }
    }

    cache.removeAll(keys);
  } catch (error) {
    // The next read will fall back to the sheet if cache invalidation fails.
  }
}

function getModifierGroupsPage(options) {
  var sheet = getModifierGroupsSheet();
  var rows = getModifierGroupRows(sheet, sheet.getLastRow());
  var modifierGroups = rows
    .filter(function(row) {
      return String(row[0]).trim() !== '';
    })
    .map(rowToModifierGroup)
    .filter(function(modifierGroup) {
      return modifierGroupMatchesQuery(modifierGroup, options.query);
    })
    .sort(compareModifierGroups);

  var total = modifierGroups.length;
  var startOffset = (options.page - 1) * options.pageSize;
  var pagedModifierGroups = modifierGroups.slice(startOffset, startOffset + options.pageSize);

  return buildModifierGroupsPageResult(pagedModifierGroups, total, options.page, options.pageSize);
}

function modifierGroupMatchesQuery(modifierGroup, query) {
  var normalizedQuery = normalizeModifierGroupSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  var tokens = normalizedQuery.split(' ').filter(Boolean);
  var searchableText = normalizeModifierGroupSearchText(modifierGroup.name);

  return searchableText.indexOf(normalizedQuery) !== -1 ||
    tokens.every(function(token) {
      return searchableText.indexOf(token) !== -1;
    });
}

function compareModifierGroups(left, right) {
  var leftName = normalizeModifierGroupName(left.name);
  var rightName = normalizeModifierGroupName(right.name);

  if (leftName < rightName) return -1;
  if (leftName > rightName) return 1;
  return 0;
}

function buildModifierGroupsPageResult(modifierGroups, total, page, pageSize) {
  var totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

  return {
    modifierGroups: modifierGroups,
    total: total,
    page: page,
    pageSize: pageSize,
    totalPages: totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  };
}

function normalizeModifierGroupSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getModifierGroupById(id) {
  var sheet = getModifierGroupsSheet();
  var rowNumber = findModifierGroupRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var row = sheet
    .getRange(rowNumber, 1, 1, MODIFIER_GROUP_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];

  return rowToModifierGroup(row);
}

function createModifierGroup(modifierGroup) {
  var sheet = getModifierGroupsSheet();
  var normalizedName = cleanValue(modifierGroup.name || modifierGroup.Name);

  assertModifierGroupNameIsUnique(sheet, normalizedName, '');

  var newId = generateModifierGroupId(sheet);
  var newRowNumber = sheet.getLastRow() + 1;
  var row = [
    newId,
    normalizedName
  ];

  sheet
    .getRange(newRowNumber, MODIFIER_GROUP_CONFIG.COLUMNS.id)
    .setNumberFormat('@');

  sheet
    .getRange(newRowNumber, 1, 1, MODIFIER_GROUP_CONFIG.TOTAL_COLUMNS)
    .setValues([row]);

  SpreadsheetApp.flush();
  clearModifierGroupsCache();

  return rowToModifierGroup(row);
}

function updateModifierGroup(id, modifierGroup) {
  var sheet = getModifierGroupsSheet();
  var rowNumber = findModifierGroupRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var currentRow = sheet
    .getRange(rowNumber, 1, 1, MODIFIER_GROUP_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];

  var currentModifierGroup = rowToModifierGroup(currentRow);

  if (hasAny(modifierGroup, ['name', 'Name'])) {
    var normalizedName = cleanValue(modifierGroup.name !== undefined ? modifierGroup.name : modifierGroup.Name);
    assertModifierGroupNameIsUnique(sheet, normalizedName, id);
    currentModifierGroup.name = normalizedName;
  }

  var updatedRow = [
    currentModifierGroup.id,
    currentModifierGroup.name
  ];

  sheet
    .getRange(rowNumber, 1, 1, MODIFIER_GROUP_CONFIG.TOTAL_COLUMNS)
    .setValues([updatedRow]);

  SpreadsheetApp.flush();
  clearModifierGroupsCache();

  return rowToModifierGroup(updatedRow);
}

function deleteModifierGroup(id) {
  var sheet = getModifierGroupsSheet();
  var rowNumber = findModifierGroupRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var deletedRow = sheet
    .getRange(rowNumber, 1, 1, MODIFIER_GROUP_CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];
  var deletedModifierGroup = rowToModifierGroup(deletedRow);

  sheet.deleteRow(rowNumber);
  SpreadsheetApp.flush();
  clearModifierGroupsCache();

  return deletedModifierGroup;
}

function findModifierGroupRowById(sheet, id) {
  var lastRow = sheet.getLastRow();

  if (lastRow < MODIFIER_GROUP_CONFIG.FIRST_DATA_ROW) {
    return -1;
  }

  var numberOfRows = lastRow - MODIFIER_GROUP_CONFIG.FIRST_DATA_ROW + 1;
  var ids = sheet
    .getRange(MODIFIER_GROUP_CONFIG.FIRST_DATA_ROW, MODIFIER_GROUP_CONFIG.COLUMNS.id, numberOfRows, 1)
    .getDisplayValues()
    .flat();

  var index = ids.findIndex(function(currentId) {
    return String(currentId).trim() === String(id).trim();
  });

  if (index === -1) {
    return -1;
  }

  return MODIFIER_GROUP_CONFIG.FIRST_DATA_ROW + index;
}

function generateModifierGroupId(sheet) {
  var id = Utilities.getUuid();

  while (findModifierGroupRowById(sheet, id) !== -1) {
    id = Utilities.getUuid();
  }

  return id;
}

function assertModifierGroupNameIsUnique(sheet, name, ignoredId) {
  var normalizedName = normalizeModifierGroupName(name);

  if (!normalizedName) {
    throw validationError('Modifier group name is required.');
  }

  var rows = getModifierGroupRows(sheet, sheet.getLastRow());
  var duplicate = rows.some(function(row) {
    var modifierGroup = rowToModifierGroup(row);

    return modifierGroup.id !== ignoredId && normalizeModifierGroupName(modifierGroup.name) === normalizedName;
  });

  if (duplicate) {
    throw duplicateError('Modifier group name must be unique.');
  }
}

function normalizeModifierGroupName(value) {
  return cleanValue(value).toLowerCase();
}
