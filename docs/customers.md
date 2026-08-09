**customers
google appscript
/**
 * ============================================================
 * Customers CRUD API
 * Google Sheet: mame
 * Sheet: Customers
 *
 * Columns:
 * A = ID
 * B = Name
 * C = Address
 * D = postcode
 * E = Telephone number
 * F = Notes
 * ============================================================
 */

const CONFIG = {
  SPREADSHEET_ID: '1pRrAfHMyjEKIcoowv5GOxC9HETSRgJxHcxUlJU6i2mE',
  SHEET_NAME: 'Customers',

  HEADER_ROW: 1,
  FIRST_DATA_ROW: 2,

  COLUMNS: {
    id: 1,
    name: 2,
    address: 3,
    postcode: 4,
    telephoneNumber: 5,
    notes: 6
  },

  TOTAL_COLUMNS: 6
};


/**
 * ============================================================
 * GET API ROUTER
 *
 * درخواست‌های GET را مدیریت می‌کند.
 *
 * API های موجود:
 *
 * 1. گرفتن تمام مشتری‌ها:
 *    ?action=getAll
 *
 * 2. گرفتن یک مشتری بر اساس ID:
 *    ?action=getById&id=3
 *
 * اگر action ارسال نشود، به صورت پیش‌فرض getAll اجرا می‌شود.
 * ============================================================
 */
function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action
      ? String(e.parameter.action).trim()
      : 'getAll';

    switch (action) {

      case 'getAll':
        return apiGetAllCustomers();

      case 'getById':
        return apiGetCustomerById(e.parameter.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid GET action.'
        });
    }

  } catch (error) {
    return handleError(error);
  }
}


/**
 * ============================================================
 * POST API ROUTER
 *
 * درخواست‌های Create / Update / Delete را مدیریت می‌کند.
 *
 * action باید داخل Body ارسال شود.
 *
 * action های موجود:
 *
 * create
 * update
 * delete
 * ============================================================
 */
function doPost(e) {
  try {
    const body = parseRequestBody(e);

    if (!body.action) {
      return jsonResponse({
        success: false,
        code: 400,
        message: 'action is required.'
      });
    }

    switch (body.action) {

      case 'create':
        return apiCreateCustomer(body.customer);

      case 'update':
        return apiUpdateCustomer(body.id, body.customer);

      case 'delete':
        return apiDeleteCustomer(body.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid POST action.'
        });
    }

  } catch (error) {
    return handleError(error);
  }
}


/**
 * ============================================================
 * API: GET ALL CUSTOMERS
 *
 * تمام مشتری‌های موجود در Sheet را می‌خواند.
 *
 * خروجی:
 *
 * {
 *   success: true,
 *   count: 10,
 *   data: [...]
 * }
 * ============================================================
 */
function apiGetAllCustomers() {

  const sheet = getCustomersSheet();

  const lastRow = sheet.getLastRow();

  // اگر هیچ مشتری وجود نداشته باشد.
  if (lastRow < CONFIG.FIRST_DATA_ROW) {
    return jsonResponse({
      success: true,
      count: 0,
      data: []
    });
  }

  const numberOfRows =
    lastRow - CONFIG.FIRST_DATA_ROW + 1;

  const rows = sheet
    .getRange(
      CONFIG.FIRST_DATA_ROW,
      1,
      numberOfRows,
      CONFIG.TOTAL_COLUMNS
    )
    .getDisplayValues();

  const customers = rows

    // ردیف‌های خالی را حذف می‌کنیم.
    .filter(row => String(row[0]).trim() !== '')

    // هر ردیف Sheet را به Object تبدیل می‌کنیم.
    .map(row => rowToCustomer(row));

  return jsonResponse({
    success: true,
    count: customers.length,
    data: customers
  });
}


/**
 * ============================================================
 * API: GET CUSTOMER BY ID
 *
 * یک مشتری خاص را با استفاده از ID پیدا می‌کند.
 *
 * مثال:
 *
 * ?action=getById&id=5
 *
 * اگر مشتری پیدا نشود، code = 404 برگردانده می‌شود.
 * ============================================================
 */
function apiGetCustomerById(id) {

  const customerId = normalizeId(id);

  const sheet = getCustomersSheet();

  const rowNumber = findCustomerRowById(
    sheet,
    customerId
  );

  if (rowNumber === -1) {
    return jsonResponse({
      success: false,
      code: 404,
      message: 'Customer not found.'
    });
  }

  const row = sheet
    .getRange(
      rowNumber,
      1,
      1,
      CONFIG.TOTAL_COLUMNS
    )
    .getDisplayValues()[0];

  return jsonResponse({
    success: true,
    data: rowToCustomer(row)
  });
}


/**
 * ============================================================
 * API: CREATE CUSTOMER
 *
 * یک مشتری جدید به Sheet اضافه می‌کند.
 *
 * ID نیازی نیست از React ارسال شود.
 * ID به صورت خودکار ساخته می‌شود.
 *
 * Body example:
 *
 * {
 *   "action": "create",
 *   "customer": {
 *     "name": "John Smith",
 *     "address": "10 High Street",
 *     "postcode": "CF44 7AA",
 *     "telephoneNumber": "07123456789",
 *     "notes": "Regular customer"
 *   }
 * }
 * ============================================================
 */
function apiCreateCustomer(customer) {

  validateCustomerForCreate(customer);

  // جلوگیری از ساخته شدن ID تکراری در درخواست‌های همزمان
  const lock = LockService.getScriptLock();

  lock.waitLock(10000);

  try {

    const sheet = getCustomersSheet();

    const newId = getNextCustomerId(sheet);

    const newRowNumber = sheet.getLastRow() + 1;

    const row = [
      newId,
      cleanValue(customer.name),
      cleanValue(customer.address),
      cleanValue(customer.postcode),
      cleanValue(customer.telephoneNumber),
      cleanValue(customer.notes)
    ];

    /*
     * شماره تلفن باید Text باشد تا صفر اول آن
     * توسط Google Sheets حذف نشود.
     */
    sheet
      .getRange(
        newRowNumber,
        CONFIG.COLUMNS.telephoneNumber
      )
      .setNumberFormat('@');

    sheet
      .getRange(
        newRowNumber,
        1,
        1,
        CONFIG.TOTAL_COLUMNS
      )
      .setValues([row]);

    SpreadsheetApp.flush();

    return jsonResponse({
      success: true,
      code: 201,
      message: 'Customer created successfully.',
      data: rowToCustomer(row)
    });

  } finally {
    lock.releaseLock();
  }
}


/**
 * ============================================================
 * API: UPDATE CUSTOMER
 *
 * اطلاعات یک مشتری موجود را بر اساس ID تغییر می‌دهد.
 *
 * فقط فیلدهایی که ارسال می‌شوند تغییر می‌کنند.
 *
 * بنابراین لازم نیست تمام اطلاعات مشتری دوباره ارسال شوند.
 *
 * ID قابل تغییر نیست.
 *
 * مثال:
 *
 * {
 *   "action": "update",
 *   "id": 5,
 *   "customer": {
 *     "telephoneNumber": "07999999999",
 *     "notes": "New phone number"
 *   }
 * }
 * ============================================================
 */
function apiUpdateCustomer(id, customer) {

  const customerId = normalizeId(id);

  if (!customer || typeof customer !== 'object') {
    return jsonResponse({
      success: false,
      code: 400,
      message: 'customer object is required.'
    });
  }

  const lock = LockService.getScriptLock();

  lock.waitLock(10000);

  try {

    const sheet = getCustomersSheet();

    const rowNumber = findCustomerRowById(
      sheet,
      customerId
    );

    if (rowNumber === -1) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'Customer not found.'
      });
    }

    const currentRow = sheet
      .getRange(
        rowNumber,
        1,
        1,
        CONFIG.TOTAL_COLUMNS
      )
      .getDisplayValues()[0];

    const currentCustomer =
      rowToCustomer(currentRow);

    /*
     * فقط فیلدهایی که واقعاً از React ارسال شده‌اند
     * جایگزین مقدار فعلی می‌شوند.
     */

    if (hasOwn(customer, 'name')) {
      currentCustomer.name =
        cleanValue(customer.name);
    }

    if (hasOwn(customer, 'address')) {
      currentCustomer.address =
        cleanValue(customer.address);
    }

    if (hasOwn(customer, 'postcode')) {
      currentCustomer.postcode =
        cleanValue(customer.postcode);
    }

    if (hasOwn(customer, 'telephoneNumber')) {
      currentCustomer.telephoneNumber =
        cleanValue(customer.telephoneNumber);
    }

    if (hasOwn(customer, 'notes')) {
      currentCustomer.notes =
        cleanValue(customer.notes);
    }

    const updatedRow = [
      currentCustomer.id,
      currentCustomer.name,
      currentCustomer.address,
      currentCustomer.postcode,
      currentCustomer.telephoneNumber,
      currentCustomer.notes
    ];

    /*
     * دوباره مطمئن می‌شویم شماره تلفن
     * به عنوان Text ذخیره شود.
     */
    sheet
      .getRange(
        rowNumber,
        CONFIG.COLUMNS.telephoneNumber
      )
      .setNumberFormat('@');

    sheet
      .getRange(
        rowNumber,
        1,
        1,
        CONFIG.TOTAL_COLUMNS
      )
      .setValues([updatedRow]);

    SpreadsheetApp.flush();

    return jsonResponse({
      success: true,
      message: 'Customer updated successfully.',
      data: currentCustomer
    });

  } finally {
    lock.releaseLock();
  }
}


/**
 * ============================================================
 * API: DELETE CUSTOMER
 *
 * یک مشتری را بر اساس ID پیدا کرده
 * و کل ردیف مربوط به آن را از Sheet حذف می‌کند.
 *
 * ID های دیگر تغییر نمی‌کنند.
 *
 * مثال:
 *
 * {
 *   "action": "delete",
 *   "id": 5
 * }
 * ============================================================
 */
function apiDeleteCustomer(id) {

  const customerId = normalizeId(id);

  const lock = LockService.getScriptLock();

  lock.waitLock(10000);

  try {

    const sheet = getCustomersSheet();

    const rowNumber = findCustomerRowById(
      sheet,
      customerId
    );

    if (rowNumber === -1) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'Customer not found.'
      });
    }

    /*
     * قبل از حذف، اطلاعات مشتری را می‌خوانیم
     * تا بتوانیم در Response نشان دهیم چه چیزی حذف شده.
     */
    const deletedRow = sheet
      .getRange(
        rowNumber,
        1,
        1,
        CONFIG.TOTAL_COLUMNS
      )
      .getDisplayValues()[0];

    const deletedCustomer =
      rowToCustomer(deletedRow);

    sheet.deleteRow(rowNumber);

    SpreadsheetApp.flush();

    return jsonResponse({
      success: true,
      message: 'Customer deleted successfully.',
      data: deletedCustomer
    });

  } finally {
    lock.releaseLock();
  }
}


/**
 * ============================================================
 * SHEET HELPER
 *
 * فایل mame را با Spreadsheet ID باز می‌کند
 * و Sheet با نام Customers را برمی‌گرداند.
 * ============================================================
 */
function getCustomersSheet() {

  const spreadsheet =
    SpreadsheetApp.openById(
      CONFIG.SPREADSHEET_ID
    );

  const sheet =
    spreadsheet.getSheetByName(
      CONFIG.SHEET_NAME
    );

  if (!sheet) {
    throw new Error(
      'Customers sheet was not found.'
    );
  }

  return sheet;
}


/**
 * ============================================================
 * FIND CUSTOMER ROW
 *
 * ID موردنظر را در ستون A جستجو می‌کند.
 *
 * اگر پیدا شود شماره واقعی Row برگردانده می‌شود.
 * اگر پیدا نشود -1 برمی‌گرداند.
 * ============================================================
 */
function findCustomerRowById(sheet, id) {

  const lastRow = sheet.getLastRow();

  if (lastRow < CONFIG.FIRST_DATA_ROW) {
    return -1;
  }

  const numberOfRows =
    lastRow - CONFIG.FIRST_DATA_ROW + 1;

  const ids = sheet
    .getRange(
      CONFIG.FIRST_DATA_ROW,
      CONFIG.COLUMNS.id,
      numberOfRows,
      1
    )
    .getDisplayValues()
    .flat();

  const index = ids.findIndex(
    currentId =>
      String(currentId).trim() === String(id).trim()
  );

  if (index === -1) {
    return -1;
  }

  return CONFIG.FIRST_DATA_ROW + index;
}


/**
 * ============================================================
 * GENERATE NEXT ID
 *
 * بزرگ‌ترین ID فعلی را پیدا می‌کند
 * و عدد بعدی را برای مشتری جدید می‌سازد.
 *
 * مثال:
 *
 * IDs:
 * 1, 2, 5, 8
 *
 * New ID:
 * 9
 *
 * بنابراین حذف شدن یک مشتری باعث استفاده مجدد
 * از ID قدیمی نمی‌شود.
 * ============================================================
 */
function getNextCustomerId(sheet) {

  const lastRow = sheet.getLastRow();

  if (lastRow < CONFIG.FIRST_DATA_ROW) {
    return 1;
  }

  const numberOfRows =
    lastRow - CONFIG.FIRST_DATA_ROW + 1;

  const ids = sheet
    .getRange(
      CONFIG.FIRST_DATA_ROW,
      CONFIG.COLUMNS.id,
      numberOfRows,
      1
    )
    .getDisplayValues()
    .flat();

  const numericIds = ids
    .map(id => Number(id))
    .filter(id => Number.isFinite(id));

  if (numericIds.length === 0) {
    return 1;
  }

  return Math.max(...numericIds) + 1;
}


/**
 * ============================================================
 * ROW TO CUSTOMER OBJECT
 *
 * یک ردیف Google Sheet را به Object قابل استفاده
 * در React تبدیل می‌کند.
 *
 * در Sheet نام ستون "Telephone number" است،
 * اما در API از telephoneNumber استفاده می‌کنیم
 * تا در JavaScript تمیزتر باشد.
 * ============================================================
 */
function rowToCustomer(row) {

  return {
    id: String(row[0] || ''),
    name: String(row[1] || ''),
    address: String(row[2] || ''),
    postcode: String(row[3] || ''),
    telephoneNumber: String(row[4] || ''),
    notes: String(row[5] || '')
  };
}


/**
 * ============================================================
 * CREATE VALIDATION
 *
 * اطلاعات لازم برای ساخت مشتری جدید را بررسی می‌کند.
 *
 * فعلاً Name اجباری است.
 * بقیه فیلدها می‌توانند خالی باشند.
 * ============================================================
 */
function validateCustomerForCreate(customer) {

  if (!customer || typeof customer !== 'object') {
    throw new Error(
      'customer object is required.'
    );
  }

  if (
    !customer.name ||
    String(customer.name).trim() === ''
  ) {
    throw new Error(
      'Customer name is required.'
    );
  }
}


/**
 * ============================================================
 * NORMALIZE ID
 *
 * ID دریافت شده از Request را تمیز و بررسی می‌کند.
 * ============================================================
 */
function normalizeId(id) {

  const customerId =
    String(id === undefined ? '' : id).trim();

  if (!customerId) {
    throw new Error(
      'Customer ID is required.'
    );
  }

  return customerId;
}


/**
 * ============================================================
 * CLEAN VALUE
 *
 * null و undefined را به String خالی تبدیل می‌کند
 * تا مقدار نامناسب وارد Sheet نشود.
 * ============================================================
 */
function cleanValue(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(value).trim();
}


/**
 * ============================================================
 * HAS OWN PROPERTY
 *
 * بررسی می‌کند که آیا یک Field واقعاً
 * در Object ارسال شده یا نه.
 *
 * این موضوع در Update مهم است، چون نمی‌خواهیم
 * فیلدی که ارسال نشده به اشتباه خالی شود.
 * ============================================================
 */
function hasOwn(object, property) {
  return Object.prototype.hasOwnProperty.call(
    object,
    property
  );
}


/**
 * ============================================================
 * PARSE REQUEST BODY
 *
 * Body ارسال شده از React را از JSON
 * به JavaScript Object تبدیل می‌کند.
 * ============================================================
 */
function parseRequestBody(e) {

  if (
    !e ||
    !e.postData ||
    !e.postData.contents
  ) {
    throw new Error(
      'Request body is empty.'
    );
  }

  try {

    return JSON.parse(
      e.postData.contents
    );

  } catch (error) {

    throw new Error(
      'Request body must contain valid JSON.'
    );
  }
}


/**
 * ============================================================
 * JSON RESPONSE
 *
 * تمام Response های API را به JSON تبدیل می‌کند.
 * Apps Script ContentService این JSON را
 * به React برمی‌گرداند.
 * ============================================================
 */
function jsonResponse(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


/**
 * ============================================================
 * ERROR HANDLER
 *
 * خطاهای پیش‌بینی نشده را به یک Response استاندارد
 * تبدیل می‌کند تا React همیشه JSON دریافت کند.
 * ============================================================
 */
function handleError(error) {

  console.error(error);

  return jsonResponse({
    success: false,
    code: 500,
    message:
      error && error.message
        ? error.message
        : 'Internal server error.'
  });
}