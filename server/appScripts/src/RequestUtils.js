function parseRequestBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Request body is empty.');
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error('Request body must contain valid JSON.');
  }
}

function assertApiKey(e, body) {
  var expectedApiKey = PropertiesService
    .getScriptProperties()
    .getProperty('CUSTOMERS_API_KEY');

  if (!expectedApiKey) {
    return;
  }

  var queryKey = e && e.parameter ? e.parameter.key : '';
  var bodyKey = body && (body.apiKey || body.key);
  var actualApiKey = queryKey || bodyKey || '';

  if (String(actualApiKey) !== String(expectedApiKey)) {
    throw new Error('Invalid API key.');
  }
}
