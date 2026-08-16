function apiGetAllProducts(params) {
  var paginationOptions = normalizeProductPagination(params || {});
  var result = getProductsPage(paginationOptions);

  return jsonResponse({
    success: true,
    count: result.products.length,
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
    data: result.products
  });
}

function apiGetProductById(id) {
  var productId = normalizeId(id, 'Product ID');
  var product = getProductById(productId);

  if (!product) {
    return jsonResponse({
      success: false,
      code: 404,
      message: 'Product not found.',
      data: null
    });
  }

  return jsonResponse({
    success: true,
    data: product
  });
}

function apiCreateProduct(product) {
  validateProductForCreate(product);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var createdProduct = createProduct(product);

    return jsonResponse({
      success: true,
      code: 201,
      message: 'Product created successfully.',
      data: createdProduct
    });
  } finally {
    lock.releaseLock();
  }
}

function apiUpdateProduct(id, product) {
  var productId = normalizeId(id, 'Product ID');
  validateProductForUpdate(product);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var updatedProduct = updateProduct(productId, product);

    if (!updatedProduct) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'Product not found.',
        data: null
      });
    }

    return jsonResponse({
      success: true,
      message: 'Product updated successfully.',
      data: updatedProduct
    });
  } finally {
    lock.releaseLock();
  }
}

function apiDeleteProduct(id) {
  return apiSetProductActive(id, false, 'Product deactivated successfully.');
}

function apiActivateProduct(id) {
  return apiSetProductActive(id, true, 'Product activated successfully.');
}

function apiDeactivateProduct(id) {
  return apiSetProductActive(id, false, 'Product deactivated successfully.');
}

function apiSetProductActive(id, isActive, message) {
  var productId = normalizeId(id, 'Product ID');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var updatedProduct = setProductActive(productId, isActive);

    if (!updatedProduct) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'Product not found.',
        data: null
      });
    }

    return jsonResponse({
      success: true,
      message: message,
      data: updatedProduct
    });
  } finally {
    lock.releaseLock();
  }
}
