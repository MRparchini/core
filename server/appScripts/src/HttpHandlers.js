function doGet(e) {
  try {
    assertApiKey(e);

    var action = e && e.parameter && e.parameter.action
      ? String(e.parameter.action).trim()
      : 'getAll';

    switch (action) {
      case 'getAll':
        return apiGetAllCustomers();

      case 'getById':
        return apiGetCustomerById(e.parameter.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid GET action.',
          data: null
        });
    }
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
          message: 'Invalid POST action.',
          data: null
        });
    }
  } catch (error) {
    return handleError(error);
  }
}
