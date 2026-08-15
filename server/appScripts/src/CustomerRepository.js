function getCustomersSheet() {
  var spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    throw new Error('Customers sheet was not found.');
  }

  return sheet;
}

var CUSTOMER_ROWS_CACHE_KEY = 'customers:rows:v1';
var CUSTOMER_ROWS_CACHE_META_KEY = CUSTOMER_ROWS_CACHE_KEY + ':meta';
var CUSTOMER_ROWS_CACHE_TTL_SECONDS = 30;
var CUSTOMER_ROWS_CACHE_CHUNK_SIZE = 75000;

function getCustomerRowsForSearch(sheet, lastRow) {
  var cachedRows = getCachedCustomerRows(lastRow);

  if (cachedRows) {
    return cachedRows;
  }

  var numberOfRows = lastRow - CONFIG.FIRST_DATA_ROW + 1;
  var rows = sheet
    .getRange(CONFIG.FIRST_DATA_ROW, 1, numberOfRows, CONFIG.TOTAL_COLUMNS)
    .getDisplayValues();

  cacheCustomerRows(rows, lastRow);

  return rows;
}

function getCachedCustomerRows(lastRow) {
  try {
    var cache = CacheService.getScriptCache();
    var metaValue = cache.get(CUSTOMER_ROWS_CACHE_META_KEY);

    if (!metaValue) {
      return null;
    }

    var meta = JSON.parse(metaValue);

    if (meta.lastRow !== lastRow || meta.columns !== CONFIG.TOTAL_COLUMNS || meta.chunks < 1) {
      return null;
    }

    var payload = '';

    for (var index = 0; index < meta.chunks; index += 1) {
      var chunk = cache.get(CUSTOMER_ROWS_CACHE_KEY + ':' + index);

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

function cacheCustomerRows(rows, lastRow) {
  try {
    var cache = CacheService.getScriptCache();
    var payload = JSON.stringify(rows);
    var chunks = Math.ceil(payload.length / CUSTOMER_ROWS_CACHE_CHUNK_SIZE);

    for (var index = 0; index < chunks; index += 1) {
      cache.put(
        CUSTOMER_ROWS_CACHE_KEY + ':' + index,
        payload.slice(
          index * CUSTOMER_ROWS_CACHE_CHUNK_SIZE,
          (index + 1) * CUSTOMER_ROWS_CACHE_CHUNK_SIZE
        ),
        CUSTOMER_ROWS_CACHE_TTL_SECONDS
      );
    }

    cache.put(
      CUSTOMER_ROWS_CACHE_META_KEY,
      JSON.stringify({
        lastRow: lastRow,
        columns: CONFIG.TOTAL_COLUMNS,
        chunks: chunks
      }),
      CUSTOMER_ROWS_CACHE_TTL_SECONDS
    );
  } catch (error) {
    // CacheService is opportunistic; sheet reads remain the source of truth.
  }
}

function clearCustomersCache() {
  try {
    var cache = CacheService.getScriptCache();
    var keys = [CUSTOMER_ROWS_CACHE_META_KEY];
    var metaValue = cache.get(CUSTOMER_ROWS_CACHE_META_KEY);

    if (metaValue) {
      var meta = JSON.parse(metaValue);

      for (var index = 0; index < meta.chunks; index += 1) {
        keys.push(CUSTOMER_ROWS_CACHE_KEY + ':' + index);
      }
    }

    cache.removeAll(keys);
  } catch (error) {
    // The next read will fall back to the sheet if cache invalidation fails.
  }
}

function getCustomersPage(options) {
  var sheet = getCustomersSheet();
  var lastRow = sheet.getLastRow();
  var page = options.page;
  var pageSize = options.pageSize;
  var query = options.query;

  if (lastRow < CONFIG.FIRST_DATA_ROW) {
    return buildCustomersPageResult([], 0, page, pageSize);
  }

  if (query) {
    return searchCustomersPage(sheet, lastRow, page, pageSize, query);
  }

  var total = lastRow - CONFIG.FIRST_DATA_ROW + 1;
  var startOffset = (page - 1) * pageSize;

  if (startOffset >= total) {
    return buildCustomersPageResult([], total, page, pageSize);
  }

  var startRow = CONFIG.FIRST_DATA_ROW + startOffset;
  var numberOfRows = Math.min(pageSize, total - startOffset);
  var rows = sheet
    .getRange(startRow, 1, numberOfRows, CONFIG.TOTAL_COLUMNS)
    .getDisplayValues();

  var customers = rows
    .filter(function(row) {
      return String(row[0]).trim() !== '';
    })
    .map(rowToCustomer);

  return buildCustomersPageResult(customers, total, page, pageSize);
}

function searchCustomersPage(sheet, lastRow, page, pageSize, query) {
  var rows = getCustomerRowsForSearch(sheet, lastRow);

  var matchedCustomers = rows
    .filter(function(row) {
      return String(row[0]).trim() !== '' && customerRowMatchesQuery(row, query);
    })
    .map(rowToCustomer);

  var startOffset = (page - 1) * pageSize;
  var customers = matchedCustomers.slice(startOffset, startOffset + pageSize);

  return buildCustomersPageResult(customers, matchedCustomers.length, page, pageSize);
}

function customerRowMatchesQuery(row, query) {
  var normalizedQuery = normalizeCustomerSearchText(query);
  var compactQuery = normalizeCustomerSearchCompact(query);
  var telephoneQuery = normalizeCustomerTelephone(query);
  var tokens = normalizedQuery.split(' ').filter(Boolean);

  if (!normalizedQuery) {
    return true;
  }

  var customer = rowToCustomer(row);
  var searchableText = [
    customer.id,
    customer.code,
    customer.name,
    customer.address,
    customer.postcode,
    customer.telephoneNumber,
    customer.notes
  ].join(' ');

  if (normalizeCustomerSearchText(searchableText).indexOf(normalizedQuery) !== -1) {
    return true;
  }

  if (
    compactQuery.length >= 3 &&
    normalizeCustomerSearchCompact(customer.postcode).indexOf(compactQuery) !== -1
  ) {
    return true;
  }

  if (
    telephoneQuery.length >= 4 &&
    normalizeCustomerTelephone(customer.telephoneNumber).indexOf(telephoneQuery) !== -1
  ) {
    return true;
  }

  return tokens.length > 0 && tokens.every(function(token) {
    return normalizeCustomerSearchText(searchableText).indexOf(token) !== -1;
  });
}

function buildCustomersPageResult(customers, total, page, pageSize) {
  var totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

  return {
    customers: customers,
    total: total,
    page: page,
    pageSize: pageSize,
    totalPages: totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  };
}

function normalizeCustomerSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCustomerSearchCompact(value) {
  return normalizeCustomerSearchText(value).replace(/\s+/g, '');
}

function normalizeCustomerTelephone(value) {
  return String(value || '').replace(/\D/g, '');
}

function getCustomerById(id) {
  var sheet = getCustomersSheet();
  var rowNumber = findCustomerRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var row = sheet
    .getRange(rowNumber, 1, 1, CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];

  return rowToCustomer(row);
}

function createCustomer(customer) {
  var sheet = getCustomersSheet();
  var newId = generateCustomerId(sheet);
  var newRowNumber = sheet.getLastRow() + 1;
  var row = [
    newId,
    cleanValue(customer.code),
    cleanValue(customer.name),
    cleanValue(customer.address),
    cleanValue(customer.postcode),
    cleanValue(customer.telephoneNumber),
    cleanValue(customer.notes)
  ];

  sheet
    .getRange(newRowNumber, CONFIG.COLUMNS.id)
    .setNumberFormat('@');

  sheet
    .getRange(newRowNumber, CONFIG.COLUMNS.telephoneNumber)
    .setNumberFormat('@');

  sheet
    .getRange(newRowNumber, 1, 1, CONFIG.TOTAL_COLUMNS)
    .setValues([row]);

  SpreadsheetApp.flush();
  clearCustomersCache();

  return rowToCustomer(row);
}

function updateCustomer(id, customer) {
  var sheet = getCustomersSheet();
  var rowNumber = findCustomerRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var currentRow = sheet
    .getRange(rowNumber, 1, 1, CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];

  var currentCustomer = rowToCustomer(currentRow);

  if (hasOwn(customer, 'name')) {
    currentCustomer.name = cleanValue(customer.name);
  }

  if (hasOwn(customer, 'code')) {
    currentCustomer.code = cleanValue(customer.code);
  }

  if (hasOwn(customer, 'address')) {
    currentCustomer.address = cleanValue(customer.address);
  }

  if (hasOwn(customer, 'postcode')) {
    currentCustomer.postcode = cleanValue(customer.postcode);
  }

  if (hasOwn(customer, 'telephoneNumber')) {
    currentCustomer.telephoneNumber = cleanValue(customer.telephoneNumber);
  }

  if (hasOwn(customer, 'notes')) {
    currentCustomer.notes = cleanValue(customer.notes);
  }

  var updatedRow = [
    currentCustomer.id,
    currentCustomer.code,
    currentCustomer.name,
    currentCustomer.address,
    currentCustomer.postcode,
    currentCustomer.telephoneNumber,
    currentCustomer.notes
  ];

  sheet
    .getRange(rowNumber, CONFIG.COLUMNS.telephoneNumber)
    .setNumberFormat('@');

  sheet
    .getRange(rowNumber, 1, 1, CONFIG.TOTAL_COLUMNS)
    .setValues([updatedRow]);

  SpreadsheetApp.flush();
  clearCustomersCache();

  return currentCustomer;
}

function deleteCustomer(id) {
  var sheet = getCustomersSheet();
  var rowNumber = findCustomerRowById(sheet, id);

  if (rowNumber === -1) {
    return null;
  }

  var deletedRow = sheet
    .getRange(rowNumber, 1, 1, CONFIG.TOTAL_COLUMNS)
    .getDisplayValues()[0];

  var deletedCustomer = rowToCustomer(deletedRow);

  sheet.deleteRow(rowNumber);
  SpreadsheetApp.flush();
  clearCustomersCache();

  return deletedCustomer;
}

function findCustomerRowById(sheet, id) {
  var lastRow = sheet.getLastRow();

  if (lastRow < CONFIG.FIRST_DATA_ROW) {
    return -1;
  }

  var numberOfRows = lastRow - CONFIG.FIRST_DATA_ROW + 1;
  var ids = sheet
    .getRange(CONFIG.FIRST_DATA_ROW, CONFIG.COLUMNS.id, numberOfRows, 1)
    .getDisplayValues()
    .flat();

  var index = ids.findIndex(function(currentId) {
    return String(currentId).trim() === String(id).trim();
  });

  if (index === -1) {
    return -1;
  }

  return CONFIG.FIRST_DATA_ROW + index;
}

function generateCustomerId(sheet) {
  var id = Utilities.getUuid();

  while (findCustomerRowById(sheet, id) !== -1) {
    id = Utilities.getUuid();
  }

  return id;
}
