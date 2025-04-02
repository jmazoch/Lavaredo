/**
 * Google Apps Script for Lavaredo Sheets API
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to https://script.google.com/ and create a new project
 * 2. Copy and paste this entire script
 * 3. Deploy as Web App:
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone" (important!)
 * 4. Use the provided URL in your application
 */

// Get the active spreadsheet
const SHEET_NAME = 'Orders'; // Change to your sheet name if different

function doGet(e) {
  const action = e.parameter.action;
  
  // Log the request for debugging
  console.log(`Received GET request with action: ${action}`);
  
  // Set CORS headers for all responses
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle different actions
  if (action === 'getOrders') {
    return handleGetOrders(output);
  } else if (action === 'getOrder') {
    return handleGetOrder(e.parameter.id, output);
  } else {
    // Default response for testing connectivity
    output.setContent(JSON.stringify({
      status: "success",
      message: "Google Sheets API is online",
      timestamp: new Date().toISOString()
    }));
    return output;
  }
}

function doPost(e) {
  // Log the request for debugging
  console.log('Received POST request');
  
  // Set CORS headers for all responses
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  try {
    // Parse the request data
    const data = JSON.parse(e.postData.contents);
    
    // Handle different actions
    if (data.action === 'updateOrderStatus') {
      return handleUpdateOrderStatus(data, output);
    } else {
      // Default action - add a new order
      return handleAddOrder(data, output);
    }
  } catch (error) {
    output.setContent(JSON.stringify({
      status: "error",
      message: "Failed to process request",
      error: error.toString()
    }));
    return output;
  }
}

/**
 * Handle GET request for all orders
 */
function handleGetOrders(output) {
  try {
    // Get the active spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      output.setContent(JSON.stringify({
        status: "error",
        message: `Sheet "${SHEET_NAME}" not found`
      }));
      return output;
    }
    
    // Get all data from the sheet
    const data = sheet.getDataRange().getValues();
    
    // Extract headers (first row)
    const headers = data[0];
    
    // Convert data to array of objects
    const rows = [];
    for (let i = 1; i < data.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      rows.push(row);
    }
    
    // Return the data
    output.setContent(JSON.stringify({
      status: "success",
      rows: rows
    }));
    return output;
  } catch (error) {
    output.setContent(JSON.stringify({
      status: "error",
      message: "Failed to fetch orders",
      error: error.toString()
    }));
    return output;
  }
}

/**
 * Handle GET request for a specific order
 */
function handleGetOrder(orderId, output) {
  try {
    if (!orderId) {
      output.setContent(JSON.stringify({
        status: "error",
        message: "Missing order ID parameter"
      }));
      return output;
    }
    
    // Get the active spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      output.setContent(JSON.stringify({
        status: "error",
        message: `Sheet "${SHEET_NAME}" not found`
      }));
      return output;
    }
    
    // Get all data from the sheet
    const data = sheet.getDataRange().getValues();
    
    // Extract headers (first row)
    const headers = data[0];
    
    // Find the order
    let orderRow = null;
    const idColumnIndex = headers.indexOf('ID');
    
    if (idColumnIndex === -1) {
      output.setContent(JSON.stringify({
        status: "error",
        message: "ID column not found in sheet"
      }));
      return output;
    }
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idColumnIndex]) === String(orderId)) {
        orderRow = data[i];
        break;
      }
    }
    
    if (!orderRow) {
      output.setContent(JSON.stringify({
        status: "error",
        message: `Order with ID "${orderId}" not found`
      }));
      return output;
    }
    
    // Convert row to object
    const order = {};
    for (let j = 0; j < headers.length; j++) {
      order[headers[j]] = orderRow[j];
    }
    
    // Return the order
    output.setContent(JSON.stringify({
      status: "success",
      order: order
    }));
    return output;
  } catch (error) {
    output.setContent(JSON.stringify({
      status: "error",
      message: "Failed to fetch order",
      error: error.toString()
    }));
    return output;
  }
}

/**
 * Handle POST request to add an order
 */
function handleAddOrder(data, output) {
  try {
    // Validate required fields
    if (!data.name || !data.email || !data.items) {
      output.setContent(JSON.stringify({
        status: "error",
        message: "Missing required fields: name, email or items"
      }));
      return output;
    }
    
    // Get the active spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      output.setContent(JSON.stringify({
        status: "error",
        message: `Sheet "${SHEET_NAME}" not found`
      }));
      return output;
    }
    
    // Get headers
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Create array for the new row
    const newRow = [];
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      switch(header) {
        case 'ID':
          newRow.push(data.id || `ORD-${new Date().getTime()}`);
          break;
        case 'Name':
          newRow.push(data.name);
          break;
        case 'Email':
          newRow.push(data.email);
          break;
        case 'Phone':
          newRow.push(data.phone || '');
          break;
        case 'Items':
          newRow.push(data.items);
          break;
        case 'Timestamp':
          newRow.push(data.timestamp || new Date().toISOString());
          break;
        default:
          newRow.push(''); // Empty for any other column
      }
    }
    
    // Add the row to the sheet
    sheet.appendRow(newRow);
    
    // Return success
    output.setContent(JSON.stringify({
      status: "success",
      message: "Order added successfully",
      orderId: newRow[headers.indexOf('ID')]
    }));
    return output;
  } catch (error) {
    output.setContent(JSON.stringify({
      status: "error",
      message: "Failed to add order",
      error: error.toString()
    }));
    return output;
  }
}

/**
 * Handle POST request to update order status
 */
function handleUpdateOrderStatus(data, output) {
  try {
    // Validate required fields
    if (!data.id || !data.status) {
      output.setContent(JSON.stringify({
        status: "error",
        message: "Missing required fields: id or status"
      }));
      return output;
    }
    
    // Get the active spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      output.setContent(JSON.stringify({
        status: "error",
        message: `Sheet "${SHEET_NAME}" not found`
      }));
      return output;
    }
    
    // Get headers and data
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idColumnIndex = headers.indexOf('ID');
    const itemsColumnIndex = headers.indexOf('Items');
    
    if (idColumnIndex === -1 || itemsColumnIndex === -1) {
      output.setContent(JSON.stringify({
        status: "error",
        message: "Required columns 'ID' or 'Items' not found in sheet"
      }));
      return output;
    }
    
    // Find the order
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idColumnIndex]) === String(data.id)) {
        rowIndex = i + 1; // +1 because sheet is 1-indexed
        break;
      }
    }
    
    if (rowIndex === -1) {
      output.setContent(JSON.stringify({
        status: "error",
        message: `Order with ID "${data.id}" not found`
      }));
      return output;
    }
    
    // Update the order status in the Items JSON
    const items = data[rowIndex - 1][itemsColumnIndex];
    let itemsObj;
    
    try {
      if (typeof items === 'string') {
        itemsObj = JSON.parse(items);
      } else {
        itemsObj = items;
      }
      
      // Update status in the items object
      if (Array.isArray(itemsObj)) {
        itemsObj = itemsObj.map(item => ({
          ...item,
          status: data.status
        }));
      } else {
        itemsObj.status = data.status;
      }
      
      // Write back to sheet
      sheet.getRange(rowIndex, itemsColumnIndex + 1).setValue(JSON.stringify(itemsObj));
      
      output.setContent(JSON.stringify({
        status: "success",
        message: "Order status updated successfully",
        orderId: data.id,
        newStatus: data.status
      }));
      return output;
    } catch (error) {
      output.setContent(JSON.stringify({
        status: "error",
        message: "Failed to parse or update Items JSON",
        error: error.toString()
      }));
      return output;
    }
  } catch (error) {
    output.setContent(JSON.stringify({
      status: "error",
      message: "Failed to update order status",
      error: error.toString()
    }));
    return output;
  }
}
