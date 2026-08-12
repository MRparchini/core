function getCustomersSheet() {
  var spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    throw new Error('Customers sheet was not found.');
  }

  return sheet;
}

function getAllCustomers() {
  var sheet = getCustomersSheet();
  var lastRow = sheet.getLastRow();

  if (lastRow < CONFIG.FIRST_DATA_ROW) {
    return [];
  }

  var numberOfRows = lastRow - CONFIG.FIRST_DATA_ROW + 1;
  var rows = sheet
    .getRange(CONFIG.FIRST_DATA_ROW, 1, numberOfRows, CONFIG.TOTAL_COLUMNS)
    .getDisplayValues();

  return rows
    .filter(function(row) {
      return String(row[0]).trim() !== '';
    })
    .map(rowToCustomer);
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
