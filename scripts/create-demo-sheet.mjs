import { google } from "googleapis";
import { config } from "dotenv";
import path from "path";
import fs from "fs";

// Cargar variables de .env.local
config({ path: path.resolve(process.cwd(), ".env.local") });

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const spreadsheetId = process.env.SPREADSHEET_ID;

if (!clientEmail || !privateKey) {
  console.error("❌ ERROR: Faltan credenciales de Google en .env.local.");
  process.exit(1);
}

if (!spreadsheetId || spreadsheetId === "REPLACE_ME" || spreadsheetId.trim() === "") {
  console.log("\n=================================================================================");
  console.log("⚠️ SPREADSHEET_ID NO CONFIGURADO EN .env.local");
  console.log("=================================================================================");
  console.log("Para inicializar la Google Sheet real para la demo, sigue estos pasos:");
  console.log("1. Ve a Google Sheets y crea una hoja nueva vacía.");
  console.log("2. Llámala: 'Luma Real Estate CRM OS — Demo Data'.");
  console.log("3. Compártela como Editor con el correo de la Service Account:");
  console.log(`   👉 ${clientEmail}`);
  console.log("4. Copia el ID de la hoja desde la URL de tu navegador.");
  console.log("5. Colócalo en la variable SPREADSHEET_ID de tu archivo .env.local.");
  console.log("6. Vuelve a ejecutar este script: 'node scripts/create-demo-sheet.mjs'.");
  console.log("=================================================================================\n");
  process.exit(0);
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

async function createDemoSheet() {
  console.log(`Conectando a Google Sheet con ID: ${spreadsheetId}...`);

  try {
    // 1. Obtener las pestañas actuales del Spreadsheet
    const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
    const existingTitles = sheetMetadata.data.sheets.map(s => s.properties.title);
    console.log("Pestañas existentes en la hoja:", existingTitles);

    const requiredSheets = ["Dashboard", "Propiedades", "Leads", "Visitas", "Cierres", "Seguimiento", "Asesores", "Configuracion"];
    const sheetsToAdd = requiredSheets.filter(title => !existingTitles.includes(title));

    // 2. Agregar las pestañas que falten
    if (sheetsToAdd.length > 0) {
      console.log("Agregando pestañas faltantes:", sheetsToAdd);
      const requests = sheetsToAdd.map(title => ({
        addSheet: {
          properties: { title }
        }
      }));
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests }
      });
      console.log("✅ Pestañas agregadas con éxito.");
    }

    // 3. Opcional: Eliminar la pestaña inicial vacía 'Sheet1' o 'Hoja 1'
    const sheetMetadataUpdated = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetToDelete = sheetMetadataUpdated.data.sheets.find(s => s.properties.title === "Sheet1" || s.properties.title === "Hoja 1");
    if (sheetToDelete) {
      console.log(`Eliminando pestaña vacía inicial '${sheetToDelete.properties.title}'...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteSheet: {
                sheetId: sheetToDelete.properties.sheetId
              }
            }
          ]
        }
      });
      console.log("✅ Pestaña inicial vacía eliminada.");
    }

    // 4. Escribir encabezados y datos ficticios iniciales en cada pestaña
    console.log("Poblando encabezados y datos mock iniciales...");

    // Pestaña Dashboard: KPIs en fila 4 y Funnel en B13:C18
    console.log("-> Configurando Dashboard KPIs...");
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Dashboard!A1:L18",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          ["VISTA DEL RÍO · REAL ESTATE CONTROL CENTER"],
          ["Métricas operativas del CRM inmobiliario."],
          [],
          ["Total Leads", "5", "", "Visitas Agendadas", "1", "", "Cierres Ganados", "1", "", "Comisiones (USD)", "USD 7,500"],
          [],
          [],
          [],
          [],
          [],
          ["EMBUDO DE VENTAS INMOBILIARIO"],
          [],
          ["Etapa", "Volumen", "Conversión", "Acción Táctica"],
          ["Nuevo Lead", "1", "100%", "Contactar en < 1h"],
          ["Contactado", "1", "100%", "Enviar propiedades"],
          ["Visita Agendada", "1", "100%", "Recorrido VIP"],
          ["Propuesta Enviada", "0", "0%", "Seguimiento agresivo"],
          ["Negociacion", "1", "100%", "Cierre consultivo"],
          ["Cierre Ganado", "1", "100%", "Fidelización"]
        ]
      }
    });

    // Pestaña Propiedades: fila 9 encabezados, fila 10+ datos
    console.log("-> Configurando Propiedades...");
    const propHeaders = [
      "ID Propiedad", "Nombre / Referencia", "Tipo de propiedad", "Tipo de operación", "Zona", "Dirección / Sector", 
      "Precio", "Moneda", "Mantenimiento", "Habitaciones", "Baños", "Parqueos", "M2", "Amueblado", "Airbnb ready", 
      "Corporativo", "Retiro", "Inversión", "Estado de disponibilidad", "Link fotos", "Link landing", 
      "Propietario", "Comisión esperada", "Responsable", "Notas"
    ];
    const propRows = [
      ["PR-001", "Apartamento Aurora 2H", "Apartamento", "Venta", "Piantini", "Av. Lincoln Esq. Gustavo", "175000", "USD", "150", "2", "2", "1", "85", "No", "Sí", "No", "No", "Sí", "Disponible", "", "", "Juan Pérez", "8750", "Daniel Reyes", "[Origen: demo_publica] [Modo: demo] [Created From: luma-real-estate-crm-os-demo] Excelente opción Airbnb."],
      ["PR-002", "Apartamento Aurora 3H", "Apartamento", "Venta", "Naco", "Calle Alberto Larancuent", "250000", "USD", "200", "3", "3", "2", "140", "No", "No", "No", "No", "No", "Disponible", "", "", "María López", "12500", "Daniel Reyes", "[Origen: demo_publica] [Modo: demo] [Created From: luma-real-estate-crm-os-demo] Familiar con áreas comunes."],
      ["PR-003", "Penthouse Vista Norte", "Penthouse", "Venta", "Bella Vista", "Av. Sarasota", "420000", "USD", "350", "4", "4.5", "3", "280", "Sí", "No", "No", "No", "No", "Disponible", "", "", "Carlos Gómez", "21000", "Camila Torres", "[Origen: demo_publica] [Modo: demo] [Created From: luma-real-estate-crm-os-demo] Terraza con jacuzzi."],
      ["PR-004", "Villa Serena", "Villa", "Venta", "Punta Cana", "Punta Cana Resort & Club", "380000", "USD", "180", "3", "3.5", "2", "220", "Sí", "Sí", "No", "Sí", "Sí", "Disponible", "", "", "Pedro Martínez", "19000", "Laura Méndez", "[Origen: demo_publica] [Modo: demo] [Created From: luma-real-estate-crm-os-demo] A pasos de la playa."],
      ["PR-005", "Local Comercial Prisma", "Local", "Venta", "Bella Vista", "Av. Rómulo Betancourt", "150000", "USD", "100", "0", "1", "1", "50", "No", "No", "Sí", "No", "Sí", "Reservada", "", "", "Construcciones Prisma", "7500", "Laura Méndez", "[Origen: demo_publica] [Modo: demo] [Created From: luma-real-estate-crm-os-demo] Local a pie de calle."]
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Propiedades!A9:Y14",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [propHeaders, ...propRows]
      }
    });

    // Pestaña Leads: fila 7 encabezados, fila 8+ datos
    console.log("-> Configurando Leads...");
    const leadHeaders = [
      "ID Lead", "Fecha Registro", "Nombre Prospecto", "Email", "WhatsApp", "Fuente", "Landing Page", 
      "Oportunidad / Modelo", "Presupuesto", "Ciudad / País", "Prioridad", "Estatus", "Último Contacto", 
      "Próximo Seguimiento", "Asesor Responsable", "Observaciones", "Etiquetas", "Resultado", "Link WhatsApp", 
      "Acción", "ID Propiedad de interés", "Propiedad de interés", "Tipo de cliente", "Tipo de operación", 
      "Zona de interés", "Temperatura", "Comisión potencial", "Etapa pipeline", "Probabilidad", "Motivo pérdida", 
      "Fecha última etapa", "Canal principal", "Campaña", "Grupo de anuncios", "Anuncio", "UTM Source", 
      "UTM Medium", "UTM Campaign", "UTM Content", "UTM Term", "Landing Page URL", "Referrer URL", "Click ID", "Tipo de Click ID"
    ];
    const leadRows = [
      ["VR-0001", "04/06/2026", "Laura Méndez", "laura.m@example.com", "+18095550101", "WhatsApp", "", "Airbnb", "180000", "", "Alta", "Nuevo", "04/06/2026", "05/06/2026", "Daniel Reyes", "[Origen: demo_publica] [Modo: demo] [Created From: luma-real-estate-crm-os-demo] Interesada en 2H.", "Vivir", "", "", "", "PR-001", "Apartamento Aurora 2H", "Comprador", "Venta", "Piantini", "Caliente", "8750", "Nuevo lead", "80%", "", "", "WhatsApp", "Orgánico"],
      ["VR-0002", "03/06/2026", "Carlos Rivera", "carlos.r@example.com", "+18095550102", "Instagram", "", "Airbnb", "260000", "", "Media", "Contactado", "03/06/2026", "06/06/2026", "Daniel Reyes", "[Origen: demo_publica] [Modo: demo] [Created From: luma-real-estate-crm-os-demo] Preguntó por fotos.", "Catálogo", "", "", "", "PR-002", "Apartamento Aurora 3H", "Comprador", "Venta", "Naco", "Tibio", "12500", "Contactado", "50%", "", "", "Redes Sociales"],
      ["VR-0003", "02/06/2026", "Sofía Peña", "sofia.p@example.com", "+18095550103", "Landing", "/propiedades/penthouse", "Airbnb", "450000", "", "Alta", "Nuevo", "02/06/2026", "05/06/2026", "Camila Torres", "[Origen: demo_publica] [Modo: demo] [Created From: luma-real-estate-crm-os-demo] Busca plusvalía.", "Inversión", "", "", "", "PR-003", "Penthouse Vista Norte", "Invertir", "Venta", "Bella Vista", "Caliente", "21000", "Seguimiento", "75%", "", "", "Meta Ads demo"],
      ["VR-0004", "01/06/2026", "Andrés Castillo", "andres.c@example.com", "+18095550104", "Referido", "", "Airbnb", "380000", "", "Alta", "Cita", "01/06/2026", "04/06/2026", "Laura Méndez", "[Origen: demo_publica] [Modo: demo] [Created From: luma-real-estate-crm-os-demo] Visita coordinada.", "Segunda línea", "", "", "", "PR-004", "Villa Serena", "Invertir", "Venta", "Punta Cana", "Caliente", "19000", "Visita agendada", "90%", "", "", "Referido"],
      ["VR-0005", "28/05/2026", "Natalia Gómez", "natalia.g@example.com", "+18095550105", "Feria inmobiliaria", "", "Airbnb", "160000", "", "Media", "Seguimiento", "30/05/2026", "05/06/2026", "Laura Méndez", "[Origen: demo_publica] [Modo: demo] [Created From: luma-real-estate-crm-os-demo] Esperando contrato.", "Comercial", "", "", "", "PR-005", "Local Comercial Prisma", "Invertir", "Venta", "Bella Vista", "Caliente", "7500", "Negociación", "95%", "", "", "Feria"]
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Leads!A7:AS12",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [leadHeaders, ...leadRows]
      }
    });

    // Pestaña Visitas: fila 7 encabezados, fila 8+ datos
    console.log("-> Configurando Visitas...");
    const visitasHeaders = ["ID Visita", "Fecha Visita", "Hora", "ID Lead", "ID Propiedad", "Asesor", "Estatus Visita", "Nivel de Interés", "Comentarios del Cliente", "Siguiente Paso"];
    const visitasRows = [
      ["V-001", "06/06/2026", "10:00 AM", "VR-0004", "PR-004", "Laura Méndez", "Agendada", "Alto", "[Origen: demo_publica] [Modo: demo] [Created From: luma-real-estate-crm-os-demo] El cliente viaja desde Santo Domingo especialmente para la visita.", "Firmar acuerdo de visita y recorrer la propiedad."]
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Visitas!A7:J8",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [visitasHeaders, ...visitasRows]
      }
    });

    // Pestaña Cierres: fila 7 encabezados, fila 8+ datos
    console.log("-> Configurando Cierres...");
    const cierresHeaders = ["ID Cierre", "Fecha Cierre", "ID Lead", "ID Propiedad", "Tipo Operación", "Precio Cierre", "Moneda", "% Comisión", "Comisión Bruta", "Estatus Cobro", "Fecha Facturación", "Observaciones"];
    const cierresRows = [
      ["CL-001", "30/05/2026", "VR-0005", "PR-005", "Venta Local", "150000", "USD", "5", "7500", "Cobrado", "30/05/2026", "[Origen: demo_publica] [Modo: demo] [Created From: luma-real-estate-crm-os-demo] Cierre exitoso en preventa."]
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Cierres!A7:L8",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [cierresHeaders, ...cierresRows]
      }
    });

    // Pestaña Seguimiento: fila 7 encabezados, fila 8+ datos
    console.log("-> Configurando Seguimiento...");
    const seguimientoHeaders = ["ID Seguimiento", "ID Lead", "Canal principal", "Nota / Comentario", "Estado nuevo", "Fecha seguimiento", "Creado por", "Fecha creación"];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Seguimiento!A7:H7",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [seguimientoHeaders]
      }
    });

    // Pestaña Asesores: fila 1 encabezados, fila 2+ datos
    console.log("-> Configurando Asesores...");
    const asesoresHeaders = ["ID Asesor", "Nombre Completo", "Rol / Cargo", "Teléfono Demo", "Email Demo", "Estado"];
    const asesoresRows = [
      ["AS-001", "Laura Méndez", "Admin Comercial", "+18095550101", "laura.m@example.com", "Activo"],
      ["AS-002", "Daniel Reyes", "Asesor Comercial", "+18095550102", "daniel.r@example.com", "Activo"],
      ["AS-003", "Camila Torres", "Asesor Digital", "+18095550103", "camila.t@example.com", "Activo"]
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Asesores!A1:F4",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [asesoresHeaders, ...asesoresRows]
      }
    });

    // Pestaña Configuracion: fila 1 encabezados, fila 2+ datos
    console.log("-> Configurando Configuracion...");
    const configHeaders = ["Clave", "Valor", "Descripción"];
    const configRows = [
      ["brand_name", "Aurora CRM Inmobiliario", "Nombre del sistema CRM"],
      ["demo_mode", "true", "Indica si el CRM está en modo de demostración"],
      ["sheets_connected", "true", "Confirma la conexión activa a Google Sheets"]
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Configuracion!A1:C4",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [configHeaders, ...configRows]
      }
    });

    console.log("\n=========================================================================");
    console.log(`🚀 GOOGLE SHEET DEMO PREPARADA CON ÉXITO:`);
    console.log(`   Spreadsheet ID: ${spreadsheetId}`);
    console.log("=========================================================================\n");

  } catch (error) {
    console.error("❌ ERROR CONFIGURANDO LA GOOGLE SHEET:", error);
    process.exit(1);
  }
}

createDemoSheet();
