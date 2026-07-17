'use server';

interface TaskRow {
  rowIndex: number;
  dateRequested: string;
  segment: string;
  type: string;
  task: string;
  brand: string;
  agent: string;
  dueDate: string;
  auditor: string;
  status: string;
}

const getAuth = async () => {
  const { google } = await import('googleapis');
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) return null;

  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
};

export async function getTasks(): Promise<TaskRow[]> {
  try {
    const auth = await getAuth();
    if (!auth) return [];

    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A2:P',
    });

    const rows = response.data.values || [];
    
    // 🔴 BULLETPROOF CLEANER: Force every single value to be a primitive string or number
    const cleanData = rows.map((row, index) => ({
      rowIndex: Number(index + 2), 
      dateRequested: row[0] ? String(row[0]) : '',
      segment: row[2] ? String(row[2]) : '',
      type: row[3] ? String(row[3]) : '',
      task: row[4] ? String(row[4]) : '', 
      brand: row[5] ? String(row[5]) : '',
      agent: row[7] ? String(row[7]) : '',
      dueDate: row[8] ? String(row[8]) : '',
      auditor: row[11] ? String(row[11]) : '',
      status: row[12] ? String(row[12]) : 'Assigned',
    }));

    // 🔴 Strip any lingering Google memory streams before it crosses the server boundary
    return JSON.parse(JSON.stringify(cleanData));

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

export async function updateTaskStatus(rowIndex: number, newStatus: string) {
  try {
    const auth = await getAuth();
    if (!auth) return { success: false };

    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!M${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newStatus]] },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to update sheet:', error);
    return { success: false };
  }
}

export async function assignTaskAgent(rowIndex: number, agent: string, status: string) {
  try {
    const auth = await getAuth();
    if (!auth) return { success: false };

    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });

    // Write Agent Name to Column H (index 7)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!H${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[agent]] },
    });

    // Write Status to Column M (index 12)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!M${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[status]] },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to assign task parameters:', error);
    return { success: false };
  }
}

export async function addTask(taskData: {
  dateRequested: string;
  segment: string;
  type: string;
  task: string;
  brand: string;
  agent: string;
  dueDate: string;
  auditor: string;
}) {
  try {
    const auth = await getAuth();
    if (!auth) return { success: false };
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });
    
    const finalAgent = taskData.agent.trim() === "" ? "Unassigned" : taskData.agent;

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A1', // 🔴 CRITICAL FIX: Anchors the append explicitly to Column A
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS', // Guarantees it pushes a clean new row
      requestBody: {
        values: [[
          taskData.dateRequested, "", taskData.segment, taskData.type, taskData.task, 
          taskData.brand, "", finalAgent, taskData.dueDate, "", "", 
          taskData.auditor, "Assigned"
        ]]
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to add task:", error);
    return { success: false };
  }
}