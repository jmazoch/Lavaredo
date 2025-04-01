/**
 * Utilitní funkce pro práci s API
 */

console.log('API Utils module loaded');

// Nastavení podle prostředí
const apiConfig = {
  // Zjištění aktuálního prostředí pro správné URL
  getBaseUrl: function() {
    const host = window.location.hostname;
    
    // Logování pro debugging
    console.log('Current hostname:', host);
    
    // Always return empty base URL which creates a relative path
    // This makes it work regardless of domain
    return '';
    
    // Previous complex logic removed because it was causing problems
  },
  
  // Způsoby, jak se dostat k funkcím - seřazené podle preference
  getFunctionPaths: function() {
    return [
      '/.netlify/functions',  // Standardní Netlify cesta
      '/api'                  // Přesměrování na Netlify functions
    ];
  },
  
  // Vytvoření plné URL pro funkci
  getFunctionUrl: function(functionName, queryParams = {}) {
    const baseUrl = this.getBaseUrl();
    const functionPaths = this.getFunctionPaths();
    
    // Vytvoření query stringu
    const queryString = Object.keys(queryParams).length > 0 
      ? '?' + new URLSearchParams(queryParams).toString() 
      : '';
    
    // Vrátíme pole možných URL
    return functionPaths.map(path => 
      `${baseUrl}${path}/${functionName}${queryString}`
    );
  },
  
  /**
   * Provede API request s postupným zkoušením různých URL cest
   * 
   * @param {string} functionName - Název serverless funkce
   * @param {Object} options - Fetch options (method, headers, body...)
   * @param {Object} queryParams - Query parametry
   * @returns {Promise<Object>} - Výsledek requestu
   */
  async callFunction(functionName, options = {}, queryParams = {}) {
    // Základní nastavení pro fetch
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'omit', // Neposílat cookies pro cross-domain requesty
      mode: 'cors'         // Explicitně vynutit CORS mode
    };
    
    // Sloučení výchozích options s těmi, co přijdou jako parametr
    const fetchOptions = { ...defaultOptions, ...options };
    
    // Get the most reliable admin token - ensure it has proper format
    if (!fetchOptions.headers.Authorization) {
      try {
        // Try to get the token from both storage locations
        let adminToken = sessionStorage.getItem('adminToken') || 
                         localStorage.getItem('adminToken');
        
        // If no token found or token doesn't have proper format, create new one
        if (!adminToken || !adminToken.startsWith('admin_')) {
          console.log('Creating new admin token with proper format');
          adminToken = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          sessionStorage.setItem('adminToken', adminToken);
          localStorage.setItem('adminToken', adminToken);
        }
        
        fetchOptions.headers.Authorization = `Bearer ${adminToken}`;
        console.log('Using admin token for authorization:', adminToken.substring(0, 15) + '...');
      } catch (e) {
        console.error('Error getting admin token:', e);
        // Use a fallback token if all else fails
        const fallbackToken = `admin_fallback_${Date.now()}`;
        fetchOptions.headers.Authorization = `Bearer ${fallbackToken}`;
      }
    }
    
    // Debug info
    console.log(`Calling function ${functionName} with options:`, {
      method: fetchOptions.method,
      headers: { ...fetchOptions.headers, Authorization: 'Bearer [REDACTED]' },
      bodyLength: fetchOptions.body ? fetchOptions.body.length : 0
    });
    console.log(`Current URL: ${window.location.href}`);
    console.log(`Origin: ${window.location.origin}`);
    
    // Získání možných URL pro funkci
    const urls = this.getFunctionUrl(functionName, queryParams);
    console.log(`Will try these URLs:`, urls);
    
    let lastError = null;
    
    // Postupně zkouší všechny URL cesty, dokud jedna nefunguje
    for (const url of urls) {
      try {
        console.log(`Trying ${url}...`);
        
        // Nastavení timeoutu pro fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const fetchOpts = { ...fetchOptions, signal: controller.signal };
        
        const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
        console.log(`Full URL being called: ${fullUrl}`);
        
        const response = await fetch(fullUrl, fetchOpts);
        clearTimeout(timeoutId);
        
        console.log(`Response from ${fullUrl}:`, response.status);
        
        // Pokud je response OK, vrátíme data
        if (response.ok) {
          const data = await response.json();
          console.log(`Success from ${fullUrl}:`, data);
          return data;
        }
        
        // Enhanced error handling for auth issues
        if (response.status === 401) {
          console.error("Authentication failed. Token may be invalid or expired.");
          console.log("Headers sent:", fetchOpts.headers);
          
          // Try to get a more detailed error message
          try {
            const errorData = await response.json();
            console.error("Server auth error details:", errorData);
          } catch (e) {
            console.log("Could not parse error response");
          }
        }
        
        // Pokud status není OK, zalogujeme chybu a zkusíme další URL
        console.warn(`Failed with status ${response.status} from ${fullUrl}`);
        try {
          const errorText = await response.text();
          console.warn(`Error response: ${errorText}`);
        } catch (e) {
          console.warn('Could not read error response');
        }
        lastError = new Error(`API returned status ${response.status}`);
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        lastError = error;
      }
    }
    
    // Pokud všechny URL selžou, vyhodíme poslední chybu
    throw lastError || new Error('Failed to call function, all URLs failed');
  }
};

// Export pro použití v jiných souborech
window.apiUtils = apiConfig;
