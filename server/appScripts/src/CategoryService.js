function apiGetAllCategories(params) {
  var paginationOptions = normalizeCategoryPagination(params || {});
  var result = getCategoriesPage(paginationOptions);

  return jsonResponse({
    success: true,
    count: result.categories.length,
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
    data: result.categories
  });
}

function apiGetCategoryById(id) {
  var categoryId = normalizeId(id, 'Category ID');
  var category = getCategoryById(categoryId);

  if (!category) {
    return jsonResponse({
      success: false,
      code: 404,
      message: 'Category not found.',
      data: null
    });
  }

  return jsonResponse({
    success: true,
    data: category
  });
}

function apiCreateCategory(category) {
  validateCategoryForCreate(category);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var createdCategory = createCategory(category);

    return jsonResponse({
      success: true,
      code: 201,
      message: 'Category created successfully.',
      data: createdCategory
    });
  } finally {
    lock.releaseLock();
  }
}

function apiUpdateCategory(id, category) {
  var categoryId = normalizeId(id, 'Category ID');
  validateCategoryForUpdate(category);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var updatedCategory = updateCategory(categoryId, category);

    if (!updatedCategory) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'Category not found.',
        data: null
      });
    }

    return jsonResponse({
      success: true,
      message: 'Category updated successfully.',
      data: updatedCategory
    });
  } finally {
    lock.releaseLock();
  }
}

function apiDeleteCategory(id) {
  var categoryId = normalizeId(id, 'Category ID');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var deletedCategory = deleteCategory(categoryId);

    if (!deletedCategory) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'Category not found.',
        data: null
      });
    }

    return jsonResponse({
      success: true,
      message: 'Category deleted successfully.',
      data: deletedCategory
    });
  } finally {
    lock.releaseLock();
  }
}
