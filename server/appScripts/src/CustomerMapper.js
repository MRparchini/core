function rowToCustomer(row) {
  return {
    id: String(row[0] || ''),
    code: String(row[1] || ''),
    name: String(row[2] || ''),
    address: String(row[3] || ''),
    postcode: String(row[4] || ''),
    telephoneNumber: String(row[5] || ''),
    notes: String(row[6] || '')
  };
}
