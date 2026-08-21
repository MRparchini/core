function apiGetAllModifierGroups(params) {
  var paginationOptions = normalizeModifierGroupPagination(params || {});
  var result = getModifierGroupsPage(paginationOptions);

  return jsonResponse({
    success: true,
    count: result.modifierGroups.length,
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
    data: result.modifierGroups
  });
}

function apiGetModifierGroupById(id) {
  var modifierGroupId = normalizeId(id, 'Modifier group ID');
  var modifierGroup = getModifierGroupById(modifierGroupId);

  if (!modifierGroup) {
    return jsonResponse({
      success: false,
      code: 404,
      message: 'Modifier group not found.',
      data: null
    });
  }

  return jsonResponse({
    success: true,
    data: modifierGroup
  });
}

function apiCreateModifierGroup(modifierGroup) {
  validateModifierGroupForCreate(modifierGroup);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var createdModifierGroup = createModifierGroup(modifierGroup);

    return jsonResponse({
      success: true,
      code: 201,
      message: 'Modifier group created successfully.',
      data: createdModifierGroup
    });
  } finally {
    lock.releaseLock();
  }
}

function apiUpdateModifierGroup(id, modifierGroup) {
  var modifierGroupId = normalizeId(id, 'Modifier group ID');
  validateModifierGroupForUpdate(modifierGroup);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var updatedModifierGroup = updateModifierGroup(modifierGroupId, modifierGroup);

    if (!updatedModifierGroup) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'Modifier group not found.',
        data: null
      });
    }

    return jsonResponse({
      success: true,
      message: 'Modifier group updated successfully.',
      data: updatedModifierGroup
    });
  } finally {
    lock.releaseLock();
  }
}

function apiDeleteModifierGroup(id) {
  var modifierGroupId = normalizeId(id, 'Modifier group ID');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var deletedModifierGroup = deleteModifierGroup(modifierGroupId);

    if (!deletedModifierGroup) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'Modifier group not found.',
        data: null
      });
    }

    return jsonResponse({
      success: true,
      message: 'Modifier group deleted successfully.',
      data: deletedModifierGroup
    });
  } finally {
    lock.releaseLock();
  }
}
