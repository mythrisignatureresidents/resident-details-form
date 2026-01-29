/**
 * Google Apps Script Code for Community Feedback Form
 * 
 * INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Paste this code into the editor
 * 4. Create a Google Sheet with these column headers in row 1:
 *    - S.NO
 *    - Timestamp
 *    - Block
 *    - Flat Number
 *    - Resident Type
 *    - Resident Name
 *    - Phone Number
 *    - Email ID
 *    - Owner Name
 *    - Owner Mobile
 *    - Adults Count
 *    - Children Count
 *    - Total Headcount
 *    - Pets
 *    - Dog
 *    - Dog Count
 *    - Cat
 *    - Cat Count
 *    - Birds
 *    - Birds Count
 *    - Others
 *    - Other Type
 *    - Other Count
 *    - Family Details
 *    - Emergency Contact Name
 *    - Emergency Contact Mobile
 *    - Move-in Date
 *    - Car Count
 *    - Bike Count
 *    - Bicycle Count
 *    - Electric Vehicle
 *    - Suggestions
 * 5. Replace 'YOUR_SHEET_ID' with your actual Google Sheet ID
 * 6. Deploy as a web app with:
 *    - Execute as: Me
 *    - Who has access: Anyone with Google account (strongest verification)
 * 7. Copy the web app URL and use it in the HTML form
 */

// Replace this with your Google Sheet ID (found in the sheet URL)
const SHEET_ID = '1mkUkyKthwilBsrTcadisE8wnhOYLI0GQOk75REq-DNM';
// IMPORTANT: Change this to match your actual sheet tab name
// Default Google Sheets use "Sheet1" - check your sheet and update accordingly
const SHEET_NAME = 'Resident Details'; // Change to your actual tab name

const HEADERS = [
  'S.NO',
  'Timestamp',
  'Block',
  'Flat Number',
  'Resident Type',
  'Resident Name',
  'Phone Number',
  'Email ID',
  'Owner Name',
  'Owner Mobile',
  'Adults Count',
  'Children Count',
  'Total Headcount',
  'Pets',
  'Dog',
  'Dog Count',
  'Cat',
  'Cat Count',
  'Birds',
  'Birds Count',
  'Others',
  'Other Type',
  'Other Count',
  'Family Details',
  'Emergency Contact Name',
  'Emergency Contact Mobile',
  'Move-in Date',
  'Car Count',
  'Bike Count',
  'Bicycle Count',
  'Electric Vehicle',
  'Submitted By Email',
  'Suggestions'
];

function doPost(e) {
  try {
    // Handle JSON, form-encoded, and multipart form data
    let data;
    
    // Check if postData exists (for JSON requests)
    if (e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      // Handle form data (form-encoded or multipart)
      // Google Apps Script automatically parses form data into e.parameter
      data = {
        block: e.parameter.block || '',
        flatNumber: e.parameter.flatNumber || '',
        residentType: e.parameter.residentType || '',
        residentName: e.parameter.residentName || '',
        mobile: e.parameter.mobile || '',
        email: e.parameter.email || '',
        ownerName: e.parameter.ownerName || '',
        ownerMobile: e.parameter.ownerMobile || '',
        adultsCount: e.parameter.adultsCount || '',
        childrenCount: e.parameter.childrenCount || '',
        headcount: e.parameter.headcount || '',
        pets: e.parameter.pets || '',
        petDog: e.parameter.petDog || '',
        petDogCount: e.parameter.petDogCount || '',
        petCat: e.parameter.petCat || '',
        petCatCount: e.parameter.petCatCount || '',
        petBird: e.parameter.petBird || '',
        petBirdCount: e.parameter.petBirdCount || '',
        petOther: e.parameter.petOther || '',
        petOtherType: e.parameter.petOtherType || '',
        petOtherCount: e.parameter.petOtherCount || '',
        familyDetails: e.parameter.familyDetails || '',
        emergencyName: e.parameter.emergencyName || '',
        emergencyMobile: e.parameter.emergencyMobile || '',
        moveInDate: e.parameter.moveInDate || '',
        carCount: e.parameter.carCount || '',
        bikeCount: e.parameter.bikeCount || '',
        bicycleCount: e.parameter.bicycleCount || '',
        electricVehicle: e.parameter.electricVehicle || '',
        suggestions: e.parameter.suggestions || ''
      };
    } else {
      // Fallback: try to parse as JSON if postData exists
      if (e.postData && e.postData.contents) {
        data = JSON.parse(e.postData.contents);
      } else {
        throw new Error('No data received. postData: ' + (e.postData ? 'exists' : 'undefined') + ', parameter: ' + (e.parameter ? 'exists' : 'undefined'));
      }
    }
    
    // Validate required fields
    const submittedByEmail = Session.getActiveUser().getEmail();
    if (!submittedByEmail) {
      return createResponse({
        success: false,
        message: 'Login required. Please sign in with your Google account to submit.'
      });
    }

    if (!data.block || !data.flatNumber || !data.residentType || !data.residentName || !data.mobile || !data.adultsCount || data.childrenCount === '' || !data.pets) {
      return createResponse({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Open the Google Sheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // If sheet doesn't exist, use the first sheet
    if (!sheet) {
      sheet = spreadsheet.getSheets()[0];
    }
    
    // Ensure headers exist
    const existingData = sheet.getDataRange().getValues();
    if (!existingData.length || existingData[0].length === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    } else {
      const currentHeaders = existingData[0].map(header => String(header || '').trim());
      const missingHeaders = HEADERS.filter(header => currentHeaders.indexOf(header) === -1);
      if (missingHeaders.length) {
        const nextCol = currentHeaders.length + 1;
        sheet.getRange(1, nextCol, 1, missingHeaders.length).setValues([missingHeaders]);
      }
    }

    const updatedData = sheet.getDataRange().getValues();
    const headerRow = updatedData[0].map(header => String(header || '').trim());
    const headerIndex = headerRow.reduce((map, header, index) => {
      map[header] = index;
      return map;
    }, {});

    const flatNumberNormalized = String(data.flatNumber || '').trim().toUpperCase();
    const flatNumberColumnIndex = headerIndex['Flat Number'];
    let existingRowIndex = -1;
    if (flatNumberColumnIndex !== undefined) {
      const flatValues = updatedData.slice(1).map(row => String(row[flatNumberColumnIndex] || '').trim().toUpperCase());
      existingRowIndex = flatValues.indexOf(flatNumberNormalized);
    }

    // Get existing data to calculate next serial number
    const dataRowCount = updatedData.length > 1 ? updatedData.length - 1 : 0;
    // S.NO is the first column (index 0), header row is row 0
    // Next serial number = number of data rows (excluding header)
    // existingData.length includes header row, so subtract 1 to get data rows count
    const nextSerialNumber = dataRowCount + 1;
    
    // Add new row with the feedback data
    const timestamp = new Date();
    const flatNumber = flatNumberNormalized;

    // Create row array aligned to headers
    const row = new Array(headerRow.length).fill('');
    row[headerIndex['S.NO']] = nextSerialNumber;
    row[headerIndex['Timestamp']] = timestamp;
    row[headerIndex['Block']] = data.block || '';
    row[headerIndex['Flat Number']] = flatNumber;
    const isOwner = String(data.residentType || '').toLowerCase() === 'owner';
    const ownerNameValue = isOwner ? (data.residentName || '') : (data.ownerName || '');
    const ownerMobileValue = isOwner ? (data.mobile || '') : (data.ownerMobile || '');

    row[headerIndex['Resident Type']] = data.residentType || '';
    row[headerIndex['Resident Name']] = data.residentName || '';
    row[headerIndex['Phone Number']] = data.mobile || '';
    row[headerIndex['Email ID']] = data.email || '';
    row[headerIndex['Owner Name']] = ownerNameValue;
    row[headerIndex['Owner Mobile']] = ownerMobileValue;
    row[headerIndex['Adults Count']] = data.adultsCount || '';
    row[headerIndex['Children Count']] = data.childrenCount || '';
    row[headerIndex['Total Headcount']] = data.headcount || '';
    row[headerIndex['Pets']] = data.pets || '';
    row[headerIndex['Dog']] = data.petDog || '';
    row[headerIndex['Dog Count']] = data.petDogCount || '';
    row[headerIndex['Cat']] = data.petCat || '';
    row[headerIndex['Cat Count']] = data.petCatCount || '';
    row[headerIndex['Birds']] = data.petBird || '';
    row[headerIndex['Birds Count']] = data.petBirdCount || '';
    row[headerIndex['Others']] = data.petOther || '';
    row[headerIndex['Other Type']] = data.petOtherType || '';
    row[headerIndex['Other Count']] = data.petOtherCount || '';
    row[headerIndex['Family Details']] = data.familyDetails || '';
    row[headerIndex['Emergency Contact Name']] = data.emergencyName || '';
    row[headerIndex['Emergency Contact Mobile']] = data.emergencyMobile || '';
    row[headerIndex['Move-in Date']] = data.moveInDate || '';
    row[headerIndex['Car Count']] = data.carCount || '';
    row[headerIndex['Bike Count']] = data.bikeCount || '';
    row[headerIndex['Bicycle Count']] = data.bicycleCount || '';
    row[headerIndex['Electric Vehicle']] = data.electricVehicle || '';
    row[headerIndex['Submitted By Email']] = submittedByEmail;
    row[headerIndex['Suggestions']] = data.suggestions || '';
    
    let lastRow = sheet.getLastRow();
    if (existingRowIndex !== -1) {
      const sheetRow = existingRowIndex + 2; // +1 for header row, +1 for 1-based index
      const existingRow = updatedData[existingRowIndex + 1];
      const existingSn = existingRow[headerIndex['S.NO']];
      row[headerIndex['S.NO']] = existingSn || nextSerialNumber;
      sheet.getRange(sheetRow, 1, 1, headerRow.length).setValues([row]);
      lastRow = Math.max(lastRow, sheetRow);
    } else {
      sheet.appendRow(row);
      lastRow = sheet.getLastRow();
    }
    
    // Format S.NO column (column A) as number to prevent date conversion
    // Format the entire column to ensure consistency
    if (lastRow > 0) {
      const snColumnRange = sheet.getRange(1, 1, lastRow, 1);
      snColumnRange.setNumberFormat('0'); // Format as integer (no decimals)
      
      // Also explicitly set the new row's S.NO as number
      const newSnCell = sheet.getRange(lastRow, 1);
      newSnCell.setValue(nextSerialNumber);
      newSnCell.setNumberFormat('0');
    }
    
    // Return success response
    return createResponse({
      success: true,
      message: existingRowIndex !== -1
        ? 'Thank you! Your information has been updated successfully.'
        : 'Thank you! Your information has been submitted successfully.'
    });
    
  } catch (error) {
    // Return error response
    return createResponse({
      success: false,
      message: 'An error occurred: ' + error.toString()
    });
  }
}

function doGet(e) {
  // Simple test endpoint
  if (e.parameter.test === 'connection') {
    return createResponse({ 
      status: 'ok', 
      message: 'Script is accessible' 
    });
  }

  if (e.parameter.action === 'whoami') {
    const submittedByEmail = Session.getActiveUser().getEmail();
    const payload = {
      status: 'ok',
      email: submittedByEmail || ''
    };
    if (e.parameter.callback) {
      return ContentService
        .createTextOutput(`${e.parameter.callback}(${JSON.stringify(payload)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return createResponse(payload);
  }
  
  return createResponse({ 
    status: 'ok',
    message: 'Community Resident Information API'
  });
}

// Helper function to create JSON response
// Google Apps Script Web Apps handle CORS automatically when deployed with "Anyone" access
function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Test function (optional - for debugging)
function testSubmission() {
  const testData = {
    block: 'A',
    flatNumber: '101',
    residentType: 'Owner',
    residentName: 'Test User',
    mobile: '1234567890',
    email: 'test@example.com',
    adultsCount: '2',
    childrenCount: '1',
    headcount: '3',
    pets: 'Yes',
    petDog: 'Yes',
    petDogCount: '1',
    suggestions: 'No issues'
  };
  
  const mockEvent = {
    parameter: testData
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
  Logger.log('Check your sheet - a new row should be added with S.NO = ' + (SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME).getDataRange().getValues().length));
}

