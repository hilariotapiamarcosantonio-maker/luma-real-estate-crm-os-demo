import { google } from "googleapis";
import { config } from "dotenv";
import path from "path";

// Cargar variables
config({ path: path.resolve(process.cwd(), ".env.local") });

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const spreadsheetId = process.env.SPREADSHEET_ID;
const BASE_URL = "http://localhost:3000";

if (!clientEmail || !privateKey || !spreadsheetId) {
  console.error("❌ ERROR: Faltan variables en .env.local");
  process.exit(1);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("=== INICIANDO PRUEBA DE CRM CONTRA GOOGLE SHEETS DEMO ===");

  // 1. Esperar a que el servidor esté activo (reintentos)
  let serverReady = false;
  console.log(`Intentando conectar con el servidor Next.js en ${BASE_URL}...`);
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(BASE_URL);
      if (res.status === 200) {
        serverReady = true;
        break;
      }
    } catch (e) {
      // Ignorar error y reintentar
    }
    await delay(1000);
  }

  if (!serverReady) {
    console.error("❌ ERROR: El servidor local Next.js no está activo en el puerto 3000. Por favor ejecútalo con 'npm run dev' primero.");
    process.exit(1);
  }
  console.log("✓ Servidor Next.js activo y respondiendo.");

  // 2. Crear Propiedad en el CRM
  const propRef = `Propiedad de Prueba QA ${Date.now()}`;
  console.log(`\nCreando propiedad: "${propRef}"...`);
  const propPayload = {
    ref: propRef,
    type: "Apartamento",
    operation: "Venta",
    zone: "Piantini",
    address: "Calle Dr. Piantini #45",
    price: "185000",
    currency: "USD",
    maintenance: "150",
    beds: "2",
    baths: "2",
    parking: "1",
    m2: "85",
    furnished: "No",
    airbnbReady: "Sí",
    corp: "No",
    retirement: "No",
    investment: "Sí",
    status: "Disponible",
    owner: "Juan Pérez",
    expectedComm: "9250",
    agent: "Laura Méndez",
    notes: "Propiedad de prueba QA automática"
  };

  const propRes = await fetch(`${BASE_URL}/api/properties`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(propPayload)
  });

  const propData = await propRes.json();
  if (!propData.success || !propData.propertyId) {
    console.error("❌ Error al crear propiedad en el API:", propData);
    process.exit(1);
  }
  const propId = propData.propertyId;
  console.log(`✓ Propiedad creada a través de la API. ID asignado: ${propId}`);

  // 3. Crear Lead en el CRM
  const leadName = `Lead de Prueba QA ${Date.now()}`;
  const leadPhone = `+1809${Math.floor(1000000 + Math.random() * 9000000)}`;
  const leadEmail = `lead.qa.${Date.now()}@example.com`;
  console.log(`\nCreando lead: "${leadName}"...`);

  const leadPayload = {
    name: leadName,
    phone: leadPhone,
    email: leadEmail,
    source: "WhatsApp",
    opp: "Airbnb",
    budget: "185000",
    clientType: "Comprador",
    opType: "Venta",
    zoneOfInterest: "Piantini",
    propIdOfInterest: propId,
    propNameOfInterest: propRef,
    temperature: "Caliente",
    pipelineStage: "Nuevo lead",
    probability: "80",
    notes: "Interesado en la propiedad de prueba creada",
    agent: "Daniel Reyes"
  };

  const leadRes = await fetch(`${BASE_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadPayload)
  });

  const leadData = await leadRes.json();
  if (!leadData.success || !leadData.leadId) {
    console.error("❌ Error al crear lead en el API:", leadData);
    process.exit(1);
  }
  const leadId = leadData.leadId;
  console.log(`✓ Lead creado a través de la API. ID asignado: ${leadId}`);

  // 4. Agregar nota de seguimiento y cambiar estado del lead
  console.log(`\nRegistrando nota de seguimiento y cambiando estado a 'Contactado' para lead: ${leadId}...`);
  const followUpPayload = {
    status: "Contactado",
    note: "Se le envió el folleto informativo de la propiedad por WhatsApp.",
    agent: "Daniel Reyes"
  };

  const followUpRes = await fetch(`${BASE_URL}/api/leads/${leadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(followUpPayload)
  });

  const followUpData = await followUpRes.json();
  if (!followUpData.success) {
    console.error("❌ Error al registrar nota de seguimiento:", followUpData);
    process.exit(1);
  }
  console.log("✓ Nota de seguimiento registrada y estado actualizado.");

  // 5. Verificar la persistencia directamente en la Google Sheet demo usando la cuenta de servicio
  console.log("\nConectando a Google Sheets para verificar persistencia en vivo...");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // 5a. Verificar Propiedades
  console.log("Verificando existencia de la propiedad en la pestaña 'Propiedades'...");
  const propSheetRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Propiedades!A10:Y"
  });
  const propRows = propSheetRes.data.values || [];
  const foundPropRow = propRows.find(row => row[0] === propId);
  if (!foundPropRow) {
    console.error(`❌ ERROR: La propiedad con ID ${propId} no fue encontrada en Google Sheets.`);
    process.exit(1);
  }
  console.log(`✓ Propiedad encontrada en Google Sheets: [${foundPropRow[0]}] ${foundPropRow[1]} - OK`);

  // 5b. Verificar Leads
  console.log("Verificando existencia del lead en la pestaña 'Leads'...");
  const leadSheetRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Leads!A8:AS"
  });
  const leadRows = leadSheetRes.data.values || [];
  const foundLeadRow = leadRows.find(row => row[0] === leadId);
  if (!foundLeadRow) {
    console.error(`❌ ERROR: El lead con ID ${leadId} no fue encontrado en Google Sheets.`);
    process.exit(1);
  }
  console.log(`✓ Lead encontrado en Google Sheets: [${foundLeadRow[0]}] ${foundLeadRow[2]} (Estatus: ${foundLeadRow[11]}) - OK`);

  // 5c. Verificar Seguimiento
  console.log("Verificando existencia de la nota de seguimiento en la pestaña 'Seguimiento'...");
  const followUpSheetRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Seguimiento!A8:H"
  });
  const followUpRows = followUpSheetRes.data.values || [];
  const foundFollowUpRow = followUpRows.find(row => row[1] === leadId);
  if (!foundFollowUpRow) {
    console.error(`❌ ERROR: La nota de seguimiento para el lead ${leadId} no fue encontrada en Google Sheets.`);
    process.exit(1);
  }
  console.log(`✓ Nota de seguimiento encontrada en Google Sheets: [Lead: ${foundFollowUpRow[1]}] "${foundFollowUpRow[3]}" - OK`);

  console.log("\n=========================================================");
  console.log("🎉 PRUEBA DE INTEGRACIÓN Y PERSISTENCIA COMPLETADA CON ÉXITO");
  console.log("=========================================================\n");
}

run();
