import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/google-sheets";
import { getLeads } from "@/lib/crm-data/get-leads";
import { readMockDb, writeMockDb } from "@/lib/crm-data/mock-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatSheetDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/La_Paz",
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";

  return `${day}/${month}/${year}`;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const leadId = params.id;
  let payload: { status?: string; note?: string; agent?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "El cuerpo de la solicitud debe ser JSON válido." },
      { status: 400 }
    );
  }

  const { status, note, agent } = payload;

  if (!status && !note && !agent) {
    return NextResponse.json(
      { success: false, error: "Debe proveer al menos el estado, nota o asesor para actualizar." },
      { status: 400 }
    );
  }

  // Sanitización contra inyección de HTML en la nota
  const cleanNote = note ? note.replace(/<[^>]*>/g, "").trim() : "";
  const cleanStatus = status ? status.replace(/<[^>]*>/g, "").trim() : "";
  const cleanAgent = agent ? agent.replace(/<[^>]*>/g, "").trim() : "";

  const leads = await getLeads();
  const leadIndex = leads.findIndex((l) => l.id === leadId);

  if (leadIndex === -1) {
    return NextResponse.json(
      { success: false, error: "El lead solicitado no existe." },
      { status: 404 }
    );
  }

  const currentLead = leads[leadIndex];
  const todayStr = formatSheetDate();
  
  // Construit el nuevo bloque de notas
  let updatedNotes = currentLead.notes || "";
  if (cleanNote) {
    const timestamp = new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
    const noteHeader = `\n\n[${todayStr} ${timestamp} - ${cleanAgent || currentLead.agent || "Asesor"}]:`;
    updatedNotes = `${updatedNotes}${noteHeader} ${cleanNote}`.trim();
  }

  const finalStatus = cleanStatus || currentLead.status;
  const finalAgent = cleanAgent || currentLead.agent;

  const { sheets, spreadsheetId } = await getSheetsClient();

  if (!sheets || !spreadsheetId) {
    // Modo mock local
    const db = readMockDb();
    const dbLeadIndex = db.leads.findIndex((l) => l.id === leadId);
    
    if (dbLeadIndex !== -1) {
      db.leads[dbLeadIndex].status = finalStatus;
      db.leads[dbLeadIndex].pipelineStage = finalStatus;
      db.leads[dbLeadIndex].notes = updatedNotes;
      db.leads[dbLeadIndex].agent = finalAgent;
      db.leads[dbLeadIndex].lastContact = todayStr;
      
      // Save followup in mock followups
      const newFollowup = {
        id: `SEG-${Date.now()}`,
        lead_id: leadId,
        canal: currentLead.sourceChannel || "demo",
        nota: cleanNote,
        estado: finalStatus,
        proxima_fecha: todayStr,
        creado_por: "demo_publica",
        fecha_creacion: todayStr
      };
      console.log("Mock followup entry:", newFollowup);
      
      if (!db.visits) db.visits = []; // Just for safety
      writeMockDb(db);
    }

    return NextResponse.json({
      success: true,
      leadId,
      message: "Lead actualizado en la base de datos mock."
    });
  }

  try {
    // Encontrar número de fila en Sheets (A8 es index 0, entonces la fila es index + 8)
    const rowNum = leadIndex + 8;

    // Actualizar columnas en Leads:
    // L: status (index 11, Col L)
    // O: agent (index 14, Col O)
    // P: notes (index 15, Col P)
    // AB: pipelineStage (index 27, Col AB)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Leads!L${rowNum}:P${rowNum}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          finalStatus, // L
          currentLead.lastContact || todayStr, // M
          currentLead.nextFollowUp || "", // N
          finalAgent, // O
          updatedNotes // P
        ]]
      }
    });

    // Actualizar AB (pipelineStage)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Leads!AB${rowNum}:AB${rowNum}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[finalStatus]]
      }
    });

    // Si se introdujo nota, guardar en la pestaña de Seguimiento
    if (cleanNote) {
      const followupRow = [
        `SEG-${Date.now()}`,
        leadId,
        currentLead.sourceChannel || currentLead.source || "demo",
        cleanNote,
        finalStatus,
        todayStr,
        "demo_publica",
        todayStr
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Seguimiento!A8:H",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [followupRow],
        },
      });
    }

    return NextResponse.json({
      success: true,
      leadId,
      message: "Lead actualizado en Google Sheets correctamente."
    });
  } catch (error) {
    console.error("Error updating lead in Sheets:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar el lead en Google Sheets." },
      { status: 500 }
    );
  }
}
