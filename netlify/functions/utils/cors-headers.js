/**
 * Sdílené CORS hlavičky pro všechny serverless funkce
 * @returns {Object} Objekt s CORS hlavičkami
 */
exports.getCorsHeaders = function() {
  return {
    'Access-Control-Allow-Origin': '*',  // Povolí všechny domény
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };
};

/**
 * Helper pro vytvoření OPTIONS response
 * @returns {Object} Response objekt pro OPTIONS request
 */
exports.handleOptions = function() {
  return {
    statusCode: 204, // No content pro OPTIONS
    headers: this.getCorsHeaders(),
    body: ''
  };
};

/**
 * Wrapper pro konzistentní odpovědi s CORS hlavičkami
 * @param {number} statusCode HTTP status kód
 * @param {Object} body Tělo odpovědi
 * @returns {Object} Formátovaná odpověď
 */
exports.createResponse = function(statusCode, body) {
  return {
    statusCode,
    headers: this.getCorsHeaders(),
    body: JSON.stringify(body)
  };
};
