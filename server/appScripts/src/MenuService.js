function apiGetAllMenus(params) {
  var paginationOptions = normalizeMenuPagination(params || {});
  var result = getMenusPage(paginationOptions);

  return jsonResponse({
    success: true,
    count: result.menus.length,
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
    data: result.menus
  });
}

function apiGetMenuById(id) {
  var menuId = normalizeId(id, 'Menu ID');
  var menu = getMenuById(menuId);

  if (!menu) {
    return jsonResponse({
      success: false,
      code: 404,
      message: 'Menu not found.',
      data: null
    });
  }

  return jsonResponse({
    success: true,
    data: menu
  });
}

function apiCreateMenu(menu) {
  validateMenuForCreate(menu);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var createdMenu = createMenu(menu);

    return jsonResponse({
      success: true,
      code: 201,
      message: 'Menu created successfully.',
      data: createdMenu
    });
  } finally {
    lock.releaseLock();
  }
}

function apiUpdateMenu(id, menu) {
  var menuId = normalizeId(id, 'Menu ID');

  validateMenuForUpdate(menu);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var updatedMenu = updateMenu(menuId, menu);

    if (!updatedMenu) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'Menu not found.',
        data: null
      });
    }

    return jsonResponse({
      success: true,
      message: 'Menu updated successfully.',
      data: updatedMenu
    });
  } finally {
    lock.releaseLock();
  }
}

function apiDeleteMenu(id) {
  return apiSetMenuActive(id, false, 'Menu deactivated successfully.');
}

function apiActivateMenu(id) {
  return apiSetMenuActive(id, true, 'Menu activated successfully.');
}

function apiDeactivateMenu(id) {
  return apiSetMenuActive(id, false, 'Menu deactivated successfully.');
}

function apiSetMenuActive(id, isActive, message) {
  var menuId = normalizeId(id, 'Menu ID');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var updatedMenu = setMenuActive(menuId, isActive);

    if (!updatedMenu) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'Menu not found.',
        data: null
      });
    }

    return jsonResponse({
      success: true,
      message: message,
      data: updatedMenu
    });
  } finally {
    lock.releaseLock();
  }
}
