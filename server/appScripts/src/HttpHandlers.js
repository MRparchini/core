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

  if (normalizedService === 'category') {
    return 'Categories';
  }

  if (
    normalizedService === 'modifierGroup' ||
    normalizedService === 'modifiergroups' ||
    normalizedService === 'modifier-group' ||
    normalizedService === 'modifier-groups'
  ) {
    return 'ModifierGroups';
  }

  if (normalizedService === 'menu') {
    return 'menus';
  }

  if (
    normalizedService === 'menuitem' ||
    normalizedService === 'menuitems' ||
    normalizedService === 'menu-item' ||
    normalizedService === 'menu-items'
  ) {
    return 'menuItems';
  }

  return normalizedService;
}

function getMenuItemPayload(body) {
  return body.menuItem || body.menuItems || body['menu-item'] || body['menu-items'];
}

function getCategoryPayload(body) {
  return body.category || body.categories;
}

function getModifierGroupPayload(body) {
  return body.modifierGroup ||
    body.modifierGroups ||
    body['modifier-group'] ||
    body['modifier-groups'];
}

function handleGetServiceAction(service, action, params) {
  if (service === 'modifierGroups') {
    switch (action) {
      case 'getAll':
      case 'search':
        return apiGetAllModifierGroups(params);

      case 'getById':
        return apiGetModifierGroupById(params.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid modifierGroups GET action.',
          data: null
        });
    }
  }

  if (service === 'categories') {
    switch (action) {
      case 'getAll':
      case 'search':
        return apiGetAllCategories(params);

      case 'getById':
        return apiGetCategoryById(params.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid categories GET action.',
          data: null
        });
    }
  }

  if (service === 'menuItems') {
    switch (action) {
      case 'getAll':
      case 'search':
        return apiGetAllMenuItems(params);

      case 'getById':
        return apiGetMenuItemById(params.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid menuItems GET action.',
          data: null
        });
    }
  }

  if (service === 'menus') {
    switch (action) {
      case 'getAll':
      case 'search':
        return apiGetAllMenus(params);

      case 'getById':
        return apiGetMenuById(params.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid menus GET action.',
          data: null
        });
    }
  }

  if (service === 'products') {
    switch (action) {
      case 'getAll':
      case 'search':
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
  if (service === 'modifierGroups') {
    switch (body.action) {
      case 'create':
        return apiCreateModifierGroup(getModifierGroupPayload(body));

      case 'update':
        return apiUpdateModifierGroup(body.id, getModifierGroupPayload(body));

      case 'delete':
        return apiDeleteModifierGroup(body.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid modifierGroups POST action.',
          data: null
        });
    }
  }

  if (service === 'categories') {
    switch (body.action) {
      case 'create':
        return apiCreateCategory(getCategoryPayload(body));

      case 'update':
        return apiUpdateCategory(body.id, getCategoryPayload(body));

      case 'delete':
        return apiDeleteCategory(body.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid categories POST action.',
          data: null
        });
    }
  }

  if (service === 'menuItems') {
    switch (body.action) {
      case 'create':
        return apiCreateMenuItem(getMenuItemPayload(body));

      case 'update':
        return apiUpdateMenuItem(body.id, getMenuItemPayload(body));

      case 'activate':
        return apiActivateMenuItem(body.id);

      case 'deactivate':
        return apiDeactivateMenuItem(body.id);

      case 'delete':
        return apiDeleteMenuItem(body.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid menuItems POST action.',
          data: null
        });
    }
  }

  if (service === 'menus') {
    switch (body.action) {
      case 'create':
        return apiCreateMenu(body.menu);

      case 'update':
        return apiUpdateMenu(body.id, body.menu);

      case 'activate':
        return apiActivateMenu(body.id);

      case 'deactivate':
        return apiDeactivateMenu(body.id);

      case 'delete':
        return apiDeleteMenu(body.id);

      default:
        return jsonResponse({
          success: false,
          code: 400,
          message: 'Invalid menus POST action.',
          data: null
        });
    }
  }

  if (service === 'products') {
    switch (body.action) {
      case 'create':
        return apiCreateProduct(body.product);

      case 'update':
        return apiUpdateProduct(body.id, body.product);

      case 'activate':
        return apiActivateProduct(body.id);

      case 'deactivate':
        return apiDeactivateProduct(body.id);

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
