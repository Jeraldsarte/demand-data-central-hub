'use server';

interface TaskRow {
  rowIndex: number;
  dateRequested: string;
  segment: string;
  type: string;
  task: string; // Col E
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
    return rows.map((row, index) => ({
      rowIndex: index + 2,
      dateRequested: typeof row[0] === 'string' ? row[0] : '',
      segment: typeof row[2] === 'string' ? row[2] : '',
      type: typeof row[3] === 'string' ? row[3] : '',
      task: typeof row[4] === 'string' ? row[4] : '', // Col E mapped
      brand: typeof row[5] === 'string' ? row[5] : '',
      agent: typeof row[7] === 'string' ? row[7] : '',
      dueDate: typeof row[8] === 'string' ? row[8] : '',
      auditor: typeof row[11] === 'string' ? row[11] : '',
      status: typeof row[12] === 'string' ? row[12] : 'Assigned',
    }));
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
      range: `Sheet1!M${rowIndex}`, // Col M
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newStatus]] },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to update sheet:', error);
    return { success: false };
  }
}

// NEW/UPDATED ACTION: Handles cross-column assignment for requests & approvals
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
      range: 'Sheet1!A:M',
      valueInputOption: 'USER_ENTERED',
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