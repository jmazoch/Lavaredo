/**
 * Google Apps Script pro přístup k tabulce objednávek
 * Tento kód vložte do Google Apps Script editoru ve vašem Google Sheets dokumentu
 */

// Konfigurace
const CONFIG = {
  // Nepovinný API klíč pro základní zabezpečení
  API_KEY: '',
  // Sheet name, který obsahuje data
  SHEET_NAME: 'Sheet1' // Změňte podle názvu vašeho listu
};

/**
 * Nastavení webové aplikace:
 * 1. Klikněte na "Deploy" > "New deployment"
 * 2. Vyberte "Web app"
 * 3. Nastavte "Execute as" na "Me"
 * 4. Nastavte "Who has access" na "Anyone" nebo "Anyone, even anonymous"
 * 5. Klikněte na "Deploy"
 */

function doGet(e) {
  // Nastavení CORS hlaviček
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  setCorsHeaders(output);
  
  // Získání akce z parametrů
  const action = e.parameter.action || '';
  console.log('doGet called with action: ' + action);
  
  // Zpracování podle typu akce
  if (action === 'getOrders') {
    return getAllOrders(output);
  } else if (action === 'getOrder') {
    const id = e.parameter.id || '';
    return getOrder(id, output);
  } else {
    // Výchozí odpověď
    output.setContent(JSON.stringify({
      success: true, 
      message: "API is working",
      timestamp: new Date().toISOString()
    }));
    return output;
  }
}

function doPost(e) {
  // Nastavení CORS hlaviček
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  setCorsHeaders(output);
  
  try {
    // Parsování příchozích dat
    const data = JSON.parse(e.postData.contents);
    console.log('Received data: ' + JSON.stringify(data).substring(0, 100) + '...');
    
    // Získání akce z dat
    const action = data.action || '';
    
    if (action === 'updateOrderStatus') {
      return updateOrderStatus(data, output);
    } else {
      // Výchozí akce - přidání nové objednávky
      return addOrder(data, output);
    }
  } catch (error) {
    output.setContent(JSON.stringify({
      error: true,
      message: "Error processing request: " + error.message
    }));
    return output;
  }
}

/**
 * Získá všechny objednávky z tabulky
 */
function getAllOrders(output) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    output.setContent(JSON.stringify({
      error: true,
      message: `List "${CONFIG.SHEET_NAME}" nebyl nalezen`
    }));
    return output;
  }
  
  // Získání dat z tabulky
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    output.setContent(JSON.stringify({
      rows: []
    }));
    return output;
  }
  
  const headers = data[0];
  const rows = [];
  
  // Převedení řádků na objekty
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((header, j) => {
      row[header] = data[i][j];
    });
    rows.push(row);
  }

  console.log(`Found ${rows.length} rows`);
  
  output.setContent(JSON.stringify({
    rows: rows
  }));
  return output;
}

/**
 * Přidá novou objednávku do tabulky
 */
function addOrder(data, output) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    output.setContent(JSON.stringify({
      error: true,
      message: `List "${CONFIG.SHEET_NAME}" nebyl nalezen`
    }));
    return output;
  }
  
  // Získání hlaviček
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Kontrola hlaviček - přidáme warning pokud jsou odlišné od těch, které očekáváme
  const expectedHeaders = ['ID', 'Name', 'Email', 'Phone', 'Items', 'Timestamp'];
  const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    console.log(`Warning: Missing expected headers: ${missingHeaders.join(', ')}`);
  }
  
  // Mapování dat podle hlaviček
  const rowData = headers.map(header => {
    switch(header) {
      case 'ID': return data.id || '';
      case 'Name': return data.name || '';
      case 'Email': return data.email || '';
      case 'Phone': return data.phone || '';
      case 'Items': return data.items || '[]';
      case 'Timestamp': return data.timestamp || new Date().toISOString();
      default: return ''; // Pro neznámé hlavičky vložíme prázdné hodnoty
    }
  });
  
  // Přidání řádku
  sheet.appendRow(rowData);
  
  output.setContent(JSON.stringify({
    success: true,
    message: 'Objednávka byla úspěšně přidána',
    orderId: data.id
  }));
  return output;
}

/**
 * Získá jednu objednávku podle ID
 */
function getOrder(orderId, output) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    output.setContent(JSON.stringify({
      error: true,
      message: `List "${CONFIG.SHEET_NAME}" nebyl nalezen`
    }));
    return output;
  }
  
  // Kontrola ID
  if (!orderId) {
    output.setContent(JSON.stringify({
      error: true,
      message: 'Chybí ID objednávky'
    }));
    return output;
  }
  
  // Načtení dat
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Najdeme index sloupce s ID
  const idColumnIndex = headers.indexOf('ID');
  if (idColumnIndex === -1) {
    // Pokud sloupec ID neexistuje, zkusíme používat první sloupec
    console.log('Warning: ID column not found, using first row index instead');
  }
  
  // Hledání řádku s odpovídajícím ID
  let orderRow = null;
  for (let i = 1; i < data.length; i++) {
    const rowId = idColumnIndex !== -1 ? data[i][idColumnIndex] : i;
    if (rowId == orderId) {
      orderRow = data[i];
      break;
    }
  }
  
  if (!orderRow) {
    output.setContent(JSON.stringify({
      error: true,
      message: 'Objednávka nebyla nalezena'
    }));
    return output;
  }
  
  // Převedení řádku na objekt
  const order = {};
  headers.forEach((header, j) => {
    order[header] = orderRow[j];
  });
  
  output.setContent(JSON.stringify({
    order: order
  }));
  return output;
}

/**
 * Aktualizace statusu objednávky
 */
function updateOrderStatus(data, output) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    output.setContent(JSON.stringify({
      error: true,
      message: `List "${CONFIG.SHEET_NAME}" nebyl nalezen`
    }));
    return output;
  }
  
  // Kontrola ID a statusu
  if (!data.id || !data.status) {
    output.setContent(JSON.stringify({
      error: true,
      message: 'Chybí ID objednávky nebo status'
    }));
    return output;
  }
  
  // Načtení dat
  const sheetData = sheet.getDataRange().getValues();
  const headers = sheetData[0];
  
  // Najdeme index sloupce s ID a Items (kde je uložen status)
  const idColumnIndex = headers.indexOf('ID');
  const itemsColumnIndex = headers.indexOf('Items');
  
  if (idColumnIndex === -1 || itemsColumnIndex === -1) {
    output.setContent(JSON.stringify({
      error: true,
      message: 'Chybí sloupec ID nebo Items'
    }));
    return output;
  }
  
  // Hledání řádku s odpovídajícím ID
  let rowIndex = -1;
  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][idColumnIndex] == data.id) {
      rowIndex = i + 1; // +1 protože řádky v Sheets začínají od 1, ne 0
      break;
    }
  }
  
  if (rowIndex === -1) {
    output.setContent(JSON.stringify({
      error: true,
      message: 'Objednávka nebyla nalezena'
    }));
    return output;
  }
  
  // Získání aktuálních Items
  let items;
  try {
    const itemsStr = sheetData[rowIndex - 1][itemsColumnIndex];
    items = JSON.parse(itemsStr);
  } catch (e) {
    items = []; // Pokud nelze parsovat, vytvoříme nové pole
  }
  
  // Přidání nebo aktualizace statusu
  if (Array.isArray(items)) {
    items = items.map(item => ({
      ...item,
      status: data.status
    }));
  } else {
    items = {
      ...items,
      status: data.status
    };
  }
  
  // Uložení aktualizovaných Items
  sheet.getRange(rowIndex, itemsColumnIndex + 1).setValue(JSON.stringify(items));
  
  output.setContent(JSON.stringify({
    success: true,
    message: 'Status objednávky byl aktualizován',
    orderId: data.id,
    status: data.status
  }));
  return output;
}

/**
 * Nastavení CORS hlaviček
 */
function setCorsHeaders(output, origin = '*') {
  output.setHeader('Access-Control-Allow-Origin', origin);
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return output;
}
