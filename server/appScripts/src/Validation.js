function validateCustomerForCreate(customer) {
  if (!customer || typeof customer !== 'object') {
    throw validationError('customer object is required.');
  }

  if (!customer.name || String(customer.name).trim() === '') {
    throw validationError('Customer name is required.');
  }
}

function validateProductForCreate(product) {
  if (!product || typeof product !== 'object') {
    throw validationError('product object is required.');
  }

  if (!product.name || String(product.name).trim() === '') {
    throw validationError('Product name is required.');
  }
}

function validateProductForUpdate(product) {
  if (!product || typeof product !== 'object') {
    throw validationError('product object is required.');
  }

  if (hasOwn(product, 'name') && String(product.name || '').trim() === '') {
    throw validationError('Product name is required.');
  }
}

function validateMenuForCreate(menu) {
  if (!menu || typeof menu !== 'object') {
    throw validationError('menu object is required.');
  }

  if (!menu.name || String(menu.name).trim() === '') {
    throw validationError('Menu name is required.');
  }

  validateMenuSortOrderInput(menu);
}

function validateMenuForUpdate(menu) {
  if (!menu || typeof menu !== 'object') {
    throw validationError('menu object is required.');
  }

  if (hasOwn(menu, 'name') && String(menu.name || '').trim() === '') {
    throw validationError('Menu name is required.');
  }

  validateMenuSortOrderInput(menu);
}

function validateMenuSortOrderInput(menu) {
  if (!hasOwn(menu, 'sortOrder') || menu.sortOrder === undefined || menu.sortOrder === null || cleanValue(menu.sortOrder) === '') {
    return;
  }

  normalizeNonNegativeIntegerInput(menu.sortOrder, 'Sort order');
}

function validateMenuItemForCreate(menuItem) {
  if (!menuItem || typeof menuItem !== 'object') {
    throw validationError('menuItem object is required.');
  }

  if (!getMenuItemInputMenuId(menuItem)) {
    throw validationError('MenuID is required.');
  }

  if (!getMenuItemInputProductId(menuItem)) {
    throw validationError('ProductID is required.');
  }

  if (!getMenuItemInputDisplayName(menuItem)) {
    throw validationError('DisplayName is required.');
  }

  validateMenuItemMutableFields(menuItem, true);
}

function validateMenuItemForUpdate(menuItem) {
  if (!menuItem || typeof menuItem !== 'object') {
    throw validationError('menuItem object is required.');
  }

  validateMenuItemMutableFields(menuItem, false);
}

function validateMenuItemMutableFields(menuItem, isCreate) {
  if (hasAny(menuItem, ['displayName', 'DisplayName']) && !getMenuItemInputDisplayName(menuItem)) {
    throw validationError('DisplayName is required.');
  }

  if (
    isCreate ||
    hasAny(menuItem, [
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
    normalizeMenuItemPenceInput(getMenuItemInputBasePricePence(menuItem));
  }

  if (hasAny(menuItem, ['sortOrder', 'SortOrder'])) {
    normalizeNonNegativeIntegerInput(getMenuItemInputSortOrder(menuItem), 'SortOrder');
  }
}

function getMenuItemInputMenuId(menuItem) {
  return cleanValue(menuItem.menuId || menuItem.menuID || menuItem.MenuID);
}

function getMenuItemInputProductId(menuItem) {
  return cleanValue(menuItem.productId || menuItem.productID || menuItem.ProductID);
}

function getMenuItemInputDisplayName(menuItem) {
  return cleanValue(menuItem.displayName !== undefined ? menuItem.displayName : menuItem.DisplayName);
}

function getMenuItemInputBasePricePence(menuItem) {
  if (menuItem.basePricePence !== undefined) {
    return {
      unit: 'pence',
      value: menuItem.basePricePence
    };
  }

  if (menuItem.BasePricePence !== undefined) {
    return {
      unit: 'pence',
      value: menuItem.BasePricePence
    };
  }

  if (menuItem.basePrice !== undefined) {
    return {
      unit: 'gbp',
      value: menuItem.basePrice
    };
  }

  if (menuItem.BasePrice !== undefined) {
    return {
      unit: 'gbp',
      value: menuItem.BasePrice
    };
  }

  if (menuItem.basePricePounds !== undefined) {
    return {
      unit: 'gbp',
      value: menuItem.basePricePounds
    };
  }

  if (menuItem.BasePricePounds !== undefined) {
    return {
      unit: 'gbp',
      value: menuItem.BasePricePounds
    };
  }

  if (menuItem.price !== undefined) {
    return {
      unit: 'gbp',
      value: menuItem.price
    };
  }

  return {
    unit: 'gbp',
    value: menuItem.Price
  };
}

function getMenuItemInputSortOrder(menuItem) {
  return menuItem.sortOrder !== undefined ? menuItem.sortOrder : menuItem.SortOrder;
}

function normalizeMenuItemPenceInput(value) {
  var priceInput = value && typeof value === 'object' && hasOwn(value, 'unit')
    ? value
    : {
      unit: 'pence',
      value: value
    };

  if (priceInput.value === undefined || priceInput.value === null || cleanValue(priceInput.value) === '') {
    throw validationError('BasePricePence is required.');
  }

  if (priceInput.unit === 'gbp') {
    return normalizeGbpPriceToPenceInput(priceInput.value);
  }

  var penceValue = cleanValue(priceInput.value);

  if (/^[£\s]*\d+(?:,\d{3})*(?:\.\d{1,2})?\s*$/.test(penceValue) || /^[£\s]*\d+\.\d{1,2}\s*$/.test(penceValue)) {
    var withoutCurrency = penceValue.replace(/[£,\s]/g, '');

    if (penceValue.indexOf('£') !== -1 || penceValue.indexOf(',') !== -1 || withoutCurrency.indexOf('.') !== -1) {
      return normalizeGbpPriceToPenceInput(withoutCurrency);
    }
  }

  return normalizeNonNegativeIntegerInput(priceInput.value, 'BasePricePence');
}

function normalizeGbpPriceToPenceInput(value) {
  var normalizedValue = cleanValue(value).replace(/[£,\s]/g, '');

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    throw validationError('BasePricePence must be a non-negative integer pence value or a GBP price with up to two decimal places.');
  }

  var parts = normalizedValue.split('.');
  var pounds = Number(parts[0]);
  var pence = Number(((parts[1] || '') + '00').slice(0, 2));

  if (!Number.isFinite(pounds) || !Number.isFinite(pence)) {
    throw validationError('BasePricePence must be a non-negative integer pence value or a GBP price with up to two decimal places.');
  }

  return pounds * 100 + pence;
}

function normalizeNonNegativeIntegerInput(value, label) {
  var number = Number(value);

  if (!Number.isFinite(number) || number < 0 || Math.floor(number) !== number) {
    throw validationError(label + ' must be a non-negative integer.');
  }

  return number;
}

function normalizeId(id, label) {
  var idLabel = label || 'ID';
  var normalizedId = String(id === undefined ? '' : id).trim();

  if (!normalizedId) {
    throw validationError(idLabel + ' is required.');
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

function hasAny(object, properties) {
  return properties.some(function(property) {
    return hasOwn(object, property);
  });
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
  var active = normalizeProductActiveFilter(params.active || params.isActive || params.status);

  if (pageSize > 200) {
    pageSize = 200;
  }

  return {
    page: page,
    pageSize: pageSize,
    query: query,
    active: active
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

function normalizeMenuItemPagination(params) {
  var page = normalizePositiveInteger(params.page, 1);
  var pageSize = normalizePositiveInteger(params.pageSize, MENU_ITEM_CONFIG.DEFAULT_PAGE_SIZE);
  var query = cleanValue(params.query || params.search || '');
  var menuId = cleanValue(params.menuId || params.menuID || params.MenuID || '');
  var productId = cleanValue(params.productId || params.productID || params.ProductID || '');
  var active = normalizeActiveFilter(params.active || params.isActive || params.status, 'Active filter');
  var effectiveActive = normalizeActiveFilter(
    params.effectiveActive || params.effectiveIsActive || params.effectiveStatus,
    'Effective active filter'
  );

  if (pageSize > MENU_ITEM_CONFIG.MAX_PAGE_SIZE) {
    pageSize = MENU_ITEM_CONFIG.MAX_PAGE_SIZE;
  }

  return {
    page: page,
    pageSize: pageSize,
    query: query,
    menuId: menuId,
    productId: productId,
    active: active,
    effectiveActive: effectiveActive
  };
}

function normalizeMenuActiveFilter(value) {
  return normalizeActiveFilter(value, 'Active filter');
}

function normalizeProductActiveFilter(value) {
  return normalizeActiveFilter(value, 'Active filter');
}

function normalizeActiveFilter(value, label) {
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

  throw validationError(label + ' must be active, inactive, or all.');
}

function normalizePositiveInteger(value, fallback) {
  var number = Number(value);

  if (!Number.isFinite(number) || number < 1) {
    return fallback;
  }

  return Math.floor(number);
}
