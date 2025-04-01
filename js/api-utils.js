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
    
    // Lokální vývoj
    if (host === 'localhost' || host === '127.0.0.1') {
      console.log('Using local development API path');
      return '';  // Relativní URL pro localhost
    }
    
    // Production URL - pro jistotu vracíme plnou URL
    if (host.includes('https://superb-torrone-4a9209.netlify.app')) {
      console.log('Using production domain API path');
      return `https://${host}`;
    }
    
    // Netlify preview/staging
    if (host.includes('netlify.app')) {
      console.log('Using Netlify preview API path');
      return `https://${host}`;
    }
    
    // Fallback pro ostatní domény
    console.log('Using fallback API path');
    return '';  // Výchozí relativní cesta
  },
  
  // Způsoby, jak se dostat k funkcím - seřazené podle preference
  getFunctionPaths: function() {
    return [
      '/.netlify/functions',  // Standardní Netlify cesta
      '/api',                 // Kdyby existovalo přesměrování
      '/functions',           // Alternativní cesta
      '/netlify/functions'    // Další možnost
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
    
    // Přidání admin tokenu, pokud existuje
    const adminToken = sessionStorage.getItem('adminToken');
    if (adminToken) {
      fetchOptions.headers.Authorization = `Bearer ${adminToken}`;
    }
    
    // Debug info
    console.log(`Calling function ${functionName} with options:`, fetchOptions);
    
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
        
        const response = await fetch(url, fetchOpts);
        clearTimeout(timeoutId);
        
        console.log(`Response from ${url}:`, response.status);
        
        // Pokud je response OK, vrátíme data
        if (response.ok) {
          const data = await response.json();
          console.log(`Success from ${url}:`, data);
          return data;
        }
        
        // Pokud status není OK, zalogujeme chybu a zkusíme další URL
        console.warn(`Failed with status ${response.status} from ${url}`);
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
