function validateCustomerForCreate(customer) {
  if (!customer || typeof customer !== 'object') {
    throw new Error('customer object is required.');
  }

  if (!customer.name || String(customer.name).trim() === '') {
    throw new Error('Customer name is required.');
  }
}

function normalizeId(id) {
  var customerId = String(id === undefined ? '' : id).trim();

  if (!customerId) {
    throw new Error('Customer ID is required.');
  }

  return customerId;
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
