import "server-only";

import { getLeads } from "@/lib/crm-data/get-leads";
import { getSheetsClient } from "@/lib/google-sheets";
import {
  buildCreateLeadPreview,
  CreateLeadInput,
  validateCreateLeadInput,
} from "@/lib/crm-write/contracts";
import { Lead } from "@/types/crm";

type CreateLeadSuccess = {
  success: true;
  leadId: string;
};

type CreateLeadFailure = {
  success: false;
  error: string;
  errors?: string[];
  code?: "VALIDATION" | "DUPLICATE" | "CONFIG" | "WRITE";
};

export type CreateLeadResult = CreateLeadSuccess | CreateLeadFailure;

const LEAD_ROW_LENGTH_WITH_ATTRIBUTION = 44;

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function extractLeadNumber(id: string) {
  const match = id.trim().match(/^VR-(\d+)$/i);
  if (!match) return 0;

  return Number.parseInt(match[1], 10) || 0;
}

function getMaxLeadNumber(leads: Lead[]) {
  return leads.reduce(
    (max, lead) => Math.max(max, extractLeadNumber(lead.id)),
    0
  );
}

function hasDuplicateLead(input: CreateLeadInput, leads: Lead[]) {
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);

  return leads.some((lead) => {
    const samePhone = phone && normalizePhone(lead.phone) === phone;
    const sameEmail = email && normalizeEmail(lead.email) === email;

    return Boolean(samePhone || sameEmail);
  });
}

function safeWriteError(error: unknown) {
  if (error instanceof Error && error.message) {
    if (error.message.includes("permission")) {
      return "No se pudo crear el lead: la Service Account no tiene permiso de editor en el Sheet.";
    }

    if (error.message.includes("insufficient authentication scopes")) {
      return "No se pudo crear el lead: el scope de Google Sheets no permite escritura.";
    }
  }

  return "No se pudo crear el lead en Google Sheets.";
}

import { readMockDb, writeMockDb } from "../crm-data/mock-db";

export async function createLead(
  input: CreateLeadInput
): Promise<CreateLeadResult> {
  const validation = validateCreateLeadInput(input);

  if (!validation.valid) {
    return {
      success: false,
      code: "VALIDATION",
      error: "El lead no cumple las validaciones mínimas.",
      errors: validation.errors,
    };
  }

  const existingLeads = await getLeads();

  if (hasDuplicateLead(input, existingLeads)) {
    return {
      success: false,
      code: "DUPLICATE",
      error: "Ya existe un lead con este teléfono o email.",
    };
  }

  const { sheets, spreadsheetId } = await getSheetsClient();
  const maxLeadNumber = getMaxLeadNumber(existingLeads);
  const preview = buildCreateLeadPreview(input, maxLeadNumber);

  if (!sheets || !spreadsheetId) {
    const db = readMockDb();
    
    // Map values array to Lead object
    const newLead: Lead = {
      id: preview.values[0] || "",
      date: preview.values[1] || "",
      name: preview.values[2] || "",
      email: preview.values[3] || "",
      phone: preview.values[4] || "",
      source: preview.values[5] || "",
      landing: preview.values[6] || "",
      opp: preview.values[7] || "",
      budget: preview.values[8] || "",
      priority: preview.values[10] || "Baja",
      status: preview.values[11] || "Nuevo",
      lastContact: preview.values[12] || "",
      nextFollowUp: preview.values[13] || "",
      agent: preview.values[14] || "",
      notes: preview.values[15] || "",
      tags: preview.values[16] || "",
      result: preview.values[17] || "",
      action: preview.values[19] || "",
      propIdOfInterest: preview.values[20] || "",
      propNameOfInterest: preview.values[21] || "",
      clientType: preview.values[22] || "",
      opType: preview.values[23] || "",
      zoneOfInterest: preview.values[24] || "",
      temperature: preview.values[25] || "",
      potentialComm: preview.values[26] || "",
      pipelineStage: preview.values[27] || "",
      probability: preview.values[28] || "",
      sourceChannel: preview.values[31] || "",
      campaignName: preview.values[32] || "",
      adSetName: preview.values[33] || "",
      adName: preview.values[34] || "",
      utmSource: preview.values[35] || "",
      utmMedium: preview.values[36] || "",
      utmCampaign: preview.values[37] || "",
      utmContent: preview.values[38] || "",
      utmTerm: preview.values[39] || "",
      landingPage: preview.values[40] || "",
      referrer: preview.values[41] || "",
      clickId: preview.values[42] || "",
      clickIdType: preview.values[43] || "",
    } as unknown as Lead;

    db.leads.push(newLead);
    writeMockDb(db);

    return {
      success: true,
      leadId: preview.id,
    };
  }

  if (preview.values.length !== LEAD_ROW_LENGTH_WITH_ATTRIBUTION) {
    return {
      success: false,
      code: "WRITE",
      error: "No se pudo crear el lead: la fila preparada no coincide con el esquema Leads!A:AR.",
    };
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: preview.range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [preview.values],
      },
    });

    return {
      success: true,
      leadId: preview.id,
    };
  } catch (error) {
    console.error("Error creating lead in Google Sheets:", safeWriteError(error));

    return {
      success: false,
      code: "WRITE",
      error: safeWriteError(error),
    };
  }
}
