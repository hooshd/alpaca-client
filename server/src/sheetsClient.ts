import { google } from 'googleapis';
import path from 'path';

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

export async function getAccounts(): Promise<SheetAccount[]> {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '../service-account.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:I`,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.error('No data found in sheet');
      return [];
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
