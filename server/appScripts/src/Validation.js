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

  validateMenuItemMutableFields(menuItem, true);
}

function validateMenuItemForUpdate(menuItem) {
  if (!menuItem || typeof menuItem !== 'object') {
    throw validationError('menuItem object is required.');
  }

  validateMenuItemMutableFields(menuItem, false);
}

function validateMenuItemMutableFields(menuItem, isCreate) {
  if (isCreate || hasAny(menuItem, ['basePricePence', 'BasePricePence'])) {
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

function getMenuItemInputBasePricePence(menuItem) {
  return menuItem.basePricePence !== undefined ? menuItem.basePricePence : menuItem.BasePricePence;
}

function getMenuItemInputSortOrder(menuItem) {
  return menuItem.sortOrder !== undefined ? menuItem.sortOrder : menuItem.SortOrder;
}

function normalizeMenuItemPenceInput(value) {
  if (value === undefined || value === null || cleanValue(value) === '') {
    throw validationError('BasePricePence is required.');
  }

  return normalizeNonNegativeIntegerInput(value, 'BasePricePence');
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
