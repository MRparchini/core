function doGet(e) {
  try {
    assertApiKey(e);

    var action = e && e.parameter && e.parameter.action
      ? String(e.parameter.action).trim()
      : 'getAll';
    var service = normalizeApiService(e && e.parameter ? e.parameter.service : '');

    return handleGetServiceAction(service, action, e.parameter || {});
  } catch (error) {
    return handleError(error);
  }
}

function doPost(e) {
  try {
    var body = parseRequestBody(e);

    assertApiKey(e, body);

    if (!body.action) {
      return jsonResponse({
        success: false,
        code: 400,
        message: 'action is required.',
        data: null
      });
    }

    var service = normalizeApiService(body.service);

    return handlePostServiceAction(service, body);
  } catch (error) {
    return handleError(error);
  }
}

function normalizeApiService(service) {
  var normalizedService = String(service || 'customers').trim().toLowerCase();

  if (normalizedService === 'customer') {
    return 'customers';
  }

  if (normalizedService === 'product') {
    return 'products';
  }

  return normalizedService;
}

function handleGetServiceAction(service, action, params) {
  if (service === 'products') {
    switch (action) {
      case 'getAll':
        return apiGetAllProducts(params);

      case 'getById':
        return apiGetProductById(params.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid products GET action.',
          data: null
        });
    }
  }

  if (service === 'customers') {
    switch (action) {
      case 'getAll':
        return apiGetAllCustomers(params);

      case 'getById':
        return apiGetCustomerById(params.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid customers GET action.',
          data: null
        });
    }
  }

  return jsonResponse({
    success: false,
    code: 400,
    message: 'Invalid service.',
    data: null
  });
}

function handlePostServiceAction(service, body) {
  if (service === 'products') {
    switch (body.action) {
      case 'create':
        return apiCreateProduct(body.product);

      case 'update':
        return apiUpdateProduct(body.id, body.product);

      case 'delete':
        return apiDeleteProduct(body.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid products POST action.',
          data: null
        });
    }
  }

  if (service === 'customers') {
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
          message: 'Invalid customers POST action.',
          data: null
        });
    }
  }

  return jsonResponse({
    success: false,
    code: 400,
    message: 'Invalid service.',
    data: null
  });
}
