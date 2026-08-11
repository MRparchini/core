function rowToCustomer(row) {
  return {
    id: String(row[0] || ''),
    name: String(row[1] || ''),
    address: String(row[2] || ''),
    postcode: String(row[3] || ''),
    telephoneNumber: String(row[4] || ''),
    notes: String(row[5] || '')
  };
}
