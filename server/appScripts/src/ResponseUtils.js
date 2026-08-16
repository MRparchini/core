function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function expectedApiError(message, code) {
  var error = new Error(message);
  error.isExpectedApiError = true;
  error.code = code;

  return error;
}

function validationError(message) {
  return expectedApiError(message, 400);
}

function duplicateError(message) {
  return expectedApiError(message, 409);
}

function notFoundError(message) {
  return expectedApiError(message, 404);
}

function handleError(error) {
  console.error(error);

  if (error && error.isExpectedApiError) {
    return jsonResponse({
      success: false,
      code: error.code,
      message: error.message,
      data: null
    });
  }

  return jsonResponse({
    success: false,
    code: 500,
    message: error && error.message ? error.message : 'Internal server error.',
    data: null
  });
}
