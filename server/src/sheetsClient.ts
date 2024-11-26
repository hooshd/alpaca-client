import 'dotenv/config';
import { google, Auth } from 'googleapis';

export interface SheetAccount {
  display_name: string;
  name: string;
  type: string;
  alpacaApiKey: string;
  alpacaApiSecret: string;
  email: string;
  openAiApiKey: string;
  openAiModel: string;
  adapticId: string;
}

const SPREADSHEET_ID = '1XooIEued5d1znnz5Gufh3--U_Ahn3WMNgOgrlR-bjGc';
const SHEET_NAME = 'config';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

/**
 * Validates required environment variables and their format
 * @throws {Error} If any required variables are missing or malformed
 */
function validateEnvironmentVariables() {
  const required = [
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_CLIENT_EMAIL',
    'GOOGLE_PROJECT_ID',
    'GOOGLE_PRIVATE_KEY_ID',
    'GOOGLE_CLIENT_ID'
  ];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const error = new Error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error(error.message);
    throw error;
  }

  // Ensure private key is properly formatted
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey?.includes('BEGIN PRIVATE KEY') || !privateKey?.includes('END PRIVATE KEY')) {
    const error = new Error('GOOGLE_PRIVATE_KEY is not properly formatted');
    console.error(error.message);
    throw error;
  }
}

/**
 * Creates and returns an authenticated Google Auth client using service account credentials
 * @returns {Promise<Auth.GoogleAuth>} Authenticated Google Auth client
 * @throws {Error} If authentication fails
 */
async function getAuthClient(): Promise<Auth.GoogleAuth> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID
      },
      scopes: SCOPES,
    });

    return auth;
  } catch (error) {
    console.error(`Authentication failed: ${(error as Error).message}`);
    throw new Error('Failed to initialize Google Sheets client');
  }
}

/**
 * Fetches account data from Google Sheets
 * @returns {Promise<SheetAccount[]>} Array of account data
 * @throws {Error} If sheet data cannot be fetched or processed
 */
export async function getAccounts(): Promise<SheetAccount[]> {
  try {
    // Validate environment variables before proceeding
    validateEnvironmentVariables();

    // Get authenticated client
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Fetch data from sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:I`,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      const error = new Error('No data found in sheet');
      console.error(error.message);
      throw error;
    }

    // Map row data to SheetAccount interface
    return rows.map((row) => ({
      display_name: row[0] || '',
      name: row[1] || '',
      type: row[2] || '',
      alpacaApiKey: row[3] || '',
      alpacaApiSecret: row[4] || '',
      email: row[5] || '',
      openAiApiKey: row[6] || '',
      openAiModel: row[7] || '',
      adapticId: row[8] || '',
    }));
  } catch (error) {
    console.error(`Error fetching sheet data: ${(error as Error).message}`);
    throw error;
  }
}
