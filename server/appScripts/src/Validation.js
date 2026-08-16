function validateCustomerForCreate(customer) {
  if (!customer || typeof customer !== 'object') {
    throw new Error('customer object is required.');
  }

  if (!customer.name || String(customer.name).trim() === '') {
    throw new Error('Customer name is required.');
  }
}

function validateProductForCreate(product) {
  if (!product || typeof product !== 'object') {
    throw new Error('product object is required.');
  }

  if (!product.name || String(product.name).trim() === '') {
    throw new Error('Product name is required.');
  }
}

function validateMenuForCreate(menu) {
  if (!menu || typeof menu !== 'object') {
    throw new Error('menu object is required.');
  }

  if (!menu.name || String(menu.name).trim() === '') {
    throw new Error('Menu name is required.');
  }

  validateMenuSortOrderInput(menu);
}

function validateMenuForUpdate(menu) {
  if (!menu || typeof menu !== 'object') {
    throw new Error('menu object is required.');
  }

  if (hasOwn(menu, 'name') && String(menu.name || '').trim() === '') {
    throw new Error('Menu name is required.');
  }

  validateMenuSortOrderInput(menu);
}

function validateMenuSortOrderInput(menu) {
  if (!hasOwn(menu, 'sortOrder') || menu.sortOrder === undefined || menu.sortOrder === null || cleanValue(menu.sortOrder) === '') {
    return;
  }

  var sortOrder = Number(menu.sortOrder);

  if (!Number.isFinite(sortOrder) || sortOrder < 0 || Math.floor(sortOrder) !== sortOrder) {
    throw new Error('Sort order must be a non-negative integer.');
  }
}
function normalizeId(id, label) {
  var idLabel = label || 'ID';
  var normalizedId = String(id === undefined ? '' : id).trim();

  if (!normalizedId) {
    throw new Error(idLabel + ' is required.');
  }

  return normalizedId;
}

function cleanValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function hasOwn(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function normalizeCustomerPagination(params) {
  var page = normalizePositiveInteger(params.page, 1);
  var pageSize = normalizePositiveInteger(params.pageSize, 50);
  var query = cleanValue(params.query || params.search || '');

  if (pageSize > 200) {
    pageSize = 200;
  }

  return {
    page: page,
    pageSize: pageSize,
    query: query
  };
}

function normalizeProductPagination(params) {
  var page = normalizePositiveInteger(params.page, 1);
  var pageSize = normalizePositiveInteger(params.pageSize, 50);
  var query = cleanValue(params.query || params.search || '');

  if (pageSize > 200) {
    pageSize = 200;
  }

  return {
    page: page,
    pageSize: pageSize,
    query: query
  };
}

function normalizeMenuPagination(params) {
  var page = normalizePositiveInteger(params.page, 1);
  var pageSize = normalizePositiveInteger(params.pageSize, MENU_CONFIG.DEFAULT_PAGE_SIZE);
  var query = cleanValue(params.query || params.search || '');
  var active = normalizeMenuActiveFilter(params.active || params.isActive || params.status);

  if (pageSize > MENU_CONFIG.MAX_PAGE_SIZE) {
    pageSize = MENU_CONFIG.MAX_PAGE_SIZE;
  }

  return {
    page: page,
    pageSize: pageSize,
    query: query,
    active: active
  };
}

function normalizeMenuActiveFilter(value) {
  var normalizedValue = String(value === undefined || value === null ? '' : value).trim().toLowerCase();

  if (!normalizedValue || normalizedValue === 'all') {
    return null;
  }

  if (
    normalizedValue === 'true' ||
    normalizedValue === 'yes' ||
    normalizedValue === '1' ||
    normalizedValue === 'active'
  ) {
    return true;
  }

  if (
    normalizedValue === 'false' ||
    normalizedValue === 'no' ||
    normalizedValue === '0' ||
    normalizedValue === 'inactive'
  ) {
    return false;
  }

  throw new Error('Active filter must be active, inactive, or all.');
}
function normalizePositiveInteger(value, fallback) {
  var number = Number(value);

  if (!Number.isFinite(number) || number < 1) {
    return fallback;
  }

  return Math.floor(number);
}

