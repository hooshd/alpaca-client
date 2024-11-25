import 'dotenv/config';
import { google } from 'googleapis';

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

function validateEnvironmentVariables() {
  const required = ['GOOGLE_PRIVATE_KEY', 'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PROJECT_ID'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Ensure private key is properly formatted
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey?.includes('BEGIN PRIVATE KEY') || !privateKey?.includes('END PRIVATE KEY')) {
    throw new Error('GOOGLE_PRIVATE_KEY is not properly formatted');
  }
}

export async function getAccounts(): Promise<SheetAccount[]> {
  try {
    // Validate environment variables before proceeding
    validateEnvironmentVariables();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle escaped newlines
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        project_id: process.env.GOOGLE_PROJECT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:I`,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      throw new Error('No data found in sheet');
    }

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
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}
