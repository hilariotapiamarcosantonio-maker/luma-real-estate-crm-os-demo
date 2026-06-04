import "server-only";
import { getSheetsClient } from "../google-sheets";
import { getProperties } from "../crm-data/get-properties";
import { readMockDb, writeMockDb } from "../crm-data/mock-db";
import { Property } from "@/types/crm";

export type CreatePropertyInput = {
  ref: string;
  type: string;
  operation: string;
  zone: string;
  address: string;
  price: string;
  currency: string;
  maintenance: string;
  beds: string;
  baths: string;
  parking: string;
  m2: string;
  furnished: string;
  airbnbReady: string;
  corp: string;
  retirement: string;
  investment: string;
  status: string;
  owner: string;
  expectedComm: string;
  agent: string;
  notes: string;
};

type CreatePropertyResult =
  | { success: true; propertyId: string }
  | { success: false; error: string; errors?: string[] };

function extractPropertyNumber(id: string) {
  const match = id.trim().match(/^PR-(\d+)$/i);
  if (!match) return 0;
  return Number.parseInt(match[1], 10) || 0;
}

function getMaxPropertyNumber(properties: Property[]) {
  return properties.reduce(
    (max, prop) => Math.max(max, extractPropertyNumber(prop.id)),
    0
  );
}

export function validatePropertyInput(input: CreatePropertyInput) {
  const errors: string[] = [];
  if (!input.ref.trim()) errors.push("El nombre/referencia es obligatorio.");
  if (!input.type.trim()) errors.push("El tipo de propiedad es obligatorio.");
  if (!input.zone.trim()) errors.push("La zona es obligatoria.");
  if (!input.price.trim() || isNaN(Number(input.price.replace(/[^\d.]/g, "")))) {
    errors.push("El precio debe ser un número válido.");
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

export async function createProperty(input: CreatePropertyInput): Promise<CreatePropertyResult> {
  const validation = validatePropertyInput(input);
  if (!validation.valid) {
    return {
      success: false,
      error: "La propiedad no cumple con las validaciones.",
      errors: validation.errors
    };
  }

  const properties = await getProperties();
  const nextNum = getMaxPropertyNumber(properties) + 1;
  const propertyId = `PR-${String(nextNum).padStart(3, "0")}`;

  const cleanPrice = String(Number(input.price.replace(/[^\d.]/g, "")) || 0);
  const cleanComm = String(Number(input.expectedComm.replace(/[^\d.]/g, "")) || 0);

  const refWords = input.ref.split(" ");
  const imgInitials = refWords.length >= 2
    ? `${refWords[0][0]}${refWords[1][0]}`.toUpperCase()
    : input.ref.substring(0, 2).toUpperCase();

  const notesWithTag = `[Origen: demo_publica] [Modo: demo] [Created From: luma-real-estate-crm-os-demo] ${input.notes}`.trim();

  const { sheets, spreadsheetId } = await getSheetsClient();

  if (!sheets || !spreadsheetId) {
    const db = readMockDb();
    const newProp: Property = {
      id: propertyId,
      ref: input.ref.trim(),
      type: input.type.trim(),
      operation: input.operation || "Venta",
      zone: input.zone.trim(),
      address: input.address.trim(),
      price: `${input.currency || "USD"} ${cleanPrice}`,
      currency: input.currency || "USD",
      maintenance: input.maintenance || "0",
      beds: input.beds || "0",
      baths: input.baths || "0",
      parking: input.parking || "0",
      m2: input.m2 || "0",
      furnished: input.furnished || "No",
      airbnbReady: input.airbnbReady || "No",
      corp: input.corp || "No",
      retirement: input.retirement || "No",
      investment: input.investment || "No",
      status: input.status || "Disponible",
      owner: input.owner || "Demo Owner",
      expectedComm: `${input.currency || "USD"} ${cleanComm}`,
      agent: input.agent || "Laura Méndez",
      notes: notesWithTag,
      img: imgInitials
    };

    db.properties.push(newProp);
    writeMockDb(db);

    return {
      success: true,
      propertyId
    };
  }

  // Sheets representation: 25 columns (A to Y)
  // A: id, B: ref, C: type, D: operation, E: zone, F: address, G: price, H: currency, I: maint, J: beds, K: baths, L: parking, M: m2, N: furnished, O: airbnb, P: corp, Q: retire, R: invest, S: status, T: "", U: "", V: owner, W: comm, X: agent, Y: notes
  const rowValues = [
    propertyId,
    input.ref.trim(),
    input.type.trim(),
    input.operation || "Venta",
    input.zone.trim(),
    input.address.trim(),
    cleanPrice,
    input.currency || "USD",
    input.maintenance || "0",
    input.beds || "0",
    input.baths || "0",
    input.parking || "0",
    input.m2 || "0",
    input.furnished || "No",
    input.airbnbReady || "No",
    input.corp || "No",
    input.retirement || "No",
    input.investment || "No",
    input.status || "Disponible",
    "",
    "",
    input.owner || "Demo Owner",
    cleanComm,
    input.agent || "Laura Méndez",
    notesWithTag
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Propiedades!A10:Y",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [rowValues],
      },
    });

    return {
      success: true,
      propertyId
    };
  } catch (error) {
    console.error("Error creating property in Google Sheets:", error);
    return {
      success: false,
      error: "No se pudo escribir la propiedad en Google Sheets."
    };
  }
}
