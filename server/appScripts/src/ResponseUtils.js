function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleError(error) {
  console.error(error);

  return jsonResponse({
    success: false,
    code: 500,
    message: error && error.message ? error.message : 'Internal server error.',
    data: null
  });
}
