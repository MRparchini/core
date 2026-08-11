function apiGetAllCustomers() {
  var customers = getAllCustomers();

  return jsonResponse({
    success: true,
    count: customers.length,
    data: customers
  });
}

function apiGetCustomerById(id) {
  var customerId = normalizeId(id);
  var customer = getCustomerById(customerId);

  if (!customer) {
    return jsonResponse({
      success: false,
      code: 404,
      message: 'Customer not found.',
      data: null
    });
  }

  return jsonResponse({
    success: true,
    data: customer
  });
}

function apiCreateCustomer(customer) {
  validateCustomerForCreate(customer);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var createdCustomer = createCustomer(customer);

    return jsonResponse({
      success: true,
      code: 201,
      message: 'Customer created successfully.',
      data: createdCustomer
    });
  } finally {
    lock.releaseLock();
  }
}

function apiUpdateCustomer(id, customer) {
  var customerId = normalizeId(id);

  if (!customer || typeof customer !== 'object') {
    return jsonResponse({
      success: false,
      code: 400,
      message: 'customer object is required.',
      data: null
    });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var updatedCustomer = updateCustomer(customerId, customer);

    if (!updatedCustomer) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'Customer not found.',
        data: null
      });
    }

    return jsonResponse({
      success: true,
      message: 'Customer updated successfully.',
      data: updatedCustomer
    });
  } finally {
    lock.releaseLock();
  }
}

function apiDeleteCustomer(id) {
  var customerId = normalizeId(id);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var deletedCustomer = deleteCustomer(customerId);

    if (!deletedCustomer) {
      return jsonResponse({
        success: false,
        code: 404,
        message: 'Customer not found.',
        data: null
      });
    }

    return jsonResponse({
      success: true,
      message: 'Customer deleted successfully.',
      data: deletedCustomer
    });
  } finally {
    lock.releaseLock();
  }
}
