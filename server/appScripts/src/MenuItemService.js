function apiGetAllMenuItems(params) {
  var paginationOptions = normalizeMenuItemPagination(params || {});
  var result = getMenuItemsPage(paginationOptions);

  return jsonResponse({
    success: true,
    count: result.menuItems.length,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    hasPreviousPage: result.hasPreviousPage,
    hasNextPage: result.hasNextPage,
    pagination: {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      hasPreviousPage: result.hasPreviousPage,
      hasNextPage: result.hasNextPage
    },
    data: result.menuItems
  });
}

function apiGetMenuItemById(id) {
  var menuItemId = normalizeId(id, 'MenuItem ID');
  var menuItem = getMenuItemById(menuItemId);

  if (!menuItem) {
    return jsonResponse({
      success: false,
      code: 404,
      message: 'MenuItem not found.',
      data: null
    });
  }

  return jsonResponse({
    success: true,
    data: menuItem
  });
}

function apiCreateMenuItem(menuItem) {
  validateMenuItemForCreate(menuItem);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var createdMenuItem = createMenuItem(menuItem);

    return jsonResponse({
      success: true,
      code: 201,
      message: 'MenuItem created successfully.',
      data: createdMenuItem
    });
  } finally {
    lock.releaseLock();
  }
}

function apiUpdateMenuItem(id, menuItem) {
  var menuItemId = normalizeId(id, 'MenuItem ID');
  validateMenuItemForUpdate(menuItem);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var updatedMenuItem = updateMenuItem(menuItemId, menuItem);

    if (!updatedMenuItem) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'MenuItem not found.',
        data: null
      });
    }

    return jsonResponse({
      success: true,
      message: 'MenuItem updated successfully.',
      data: updatedMenuItem
    });
  } finally {
    lock.releaseLock();
  }
}

function apiDeleteMenuItem(id) {
  return apiSetMenuItemActive(id, false, 'MenuItem deactivated successfully.');
}

function apiActivateMenuItem(id) {
  return apiSetMenuItemActive(id, true, 'MenuItem activated successfully.');
}

function apiDeactivateMenuItem(id) {
  return apiSetMenuItemActive(id, false, 'MenuItem deactivated successfully.');
}

function apiSetMenuItemActive(id, isActive, message) {
  var menuItemId = normalizeId(id, 'MenuItem ID');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var updatedMenuItem = setMenuItemActive(menuItemId, isActive);

    if (!updatedMenuItem) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'MenuItem not found.',
        data: null
      });
    }

    return jsonResponse({
      success: true,
      message: message,
      data: updatedMenuItem
    });
  } finally {
    lock.releaseLock();
  }
}
