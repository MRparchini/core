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

function normalizePositiveInteger(value, fallback) {
  var number = Number(value);

  if (!Number.isFinite(number) || number < 1) {
    return fallback;
  }

  return Math.floor(number);
}
