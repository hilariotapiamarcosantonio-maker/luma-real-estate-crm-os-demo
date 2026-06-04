import { google } from "googleapis";
import { config } from "dotenv";
import path from "path";

// Cargar variables de .env.local
config({ path: path.resolve(process.cwd(), ".env.local") });

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const spreadsheetId = process.env.SPREADSHEET_ID;

if (!clientEmail || !privateKey || !spreadsheetId) {
  console.error("❌ ERROR: Faltan variables requeridas en .env.local (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, SPREADSHEET_ID).");
  process.exit(1);
}

async function testConnection() {
  console.log("=== INICIANDO VALIDACIÓN DE CONEXIÓN A GOOGLE SHEETS (Service Account) ===");
  console.log(`Email de Service Account: ${clientEmail}`);
  console.log(`Spreadsheet ID: ${spreadsheetId}`);

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 1. Leer metadatos de la hoja
    console.log("1. Leyendo metadatos de la hoja...");
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    console.log(`✅ Conexión establecida. Título de la hoja: "${metadata.data.properties.title}"`);

    const tempTabName = "__LUMA_CONNECTION_TEST__";

    // 2. Crear una pestaña temporal
    console.log(`2. Creando pestaña temporal "${tempTabName}"...`);
    const addSheetResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: tempTabName },
            },
          },
        ],
      },
    });
    const tempSheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;
    console.log(`✅ Pestaña temporal creada (ID: ${tempSheetId})`);

    // 3. Escribir una fila temporal
    console.log("3. Escribiendo fila de prueba...");
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tempTabName}!A1:C1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["Test", "Connection", "Success"]],
      },
    });
    console.log("✅ Fila de prueba escrita con éxito.");

    // 4. Eliminar la pestaña temporal
    console.log(`4. Eliminando pestaña temporal "${tempTabName}"...`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteSheet: {
              sheetId: tempSheetId,
            },
          },
        ],
      },
    });
    console.log("✅ Pestaña temporal eliminada.");

    console.log("\n=========================================================");
    console.log("CONEXIÓN GOOGLE SHEETS DEMO VERIFICADA");
    console.log("=========================================================\n");

  } catch (error) {
    console.error("❌ ERROR PROBANDO LA CONEXIÓN A GOOGLE SHEETS:");
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();
