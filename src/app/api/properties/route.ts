import { NextResponse } from "next/server";
import { createProperty, CreatePropertyInput, validatePropertyInput } from "@/lib/crm-write/create-property";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CREATE_PROPERTY_FIELDS: (keyof CreatePropertyInput)[] = [
  "ref",
  "type",
  "operation",
  "zone",
  "address",
  "price",
  "currency",
  "maintenance",
  "beds",
  "baths",
  "parking",
  "m2",
  "furnished",
  "airbnbReady",
  "corp",
  "retirement",
  "investment",
  "status",
  "owner",
  "expectedComm",
  "agent",
  "notes"
];

function toCreatePropertyInput(payload: unknown): CreatePropertyInput {
  const source =
    typeof payload === "object" && payload !== null
      ? (payload as Partial<Record<keyof CreatePropertyInput, unknown>>)
      : {};

  return CREATE_PROPERTY_FIELDS.reduce((input, field) => {
    input[field] = String(source[field] ?? "");
    return input;
  }, {} as CreatePropertyInput);
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "El cuerpo de la solicitud debe ser JSON válido.",
      },
      { status: 400 }
    );
  }

  const input = toCreatePropertyInput(payload);
  const validation = validatePropertyInput(input);

  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: "La propiedad no cumple con las validaciones.",
        errors: validation.errors,
      },
      { status: 400 }
    );
  }

  // Sanitización básica de campos contra scripts e inyecciones básicas
  input.ref = input.ref.replace(/<[^>]*>/g, "");
  input.zone = input.zone.replace(/<[^>]*>/g, "");
  input.address = input.address.replace(/<[^>]*>/g, "");
  input.notes = input.notes.replace(/<[^>]*>/g, "");
  input.owner = input.owner.replace(/<[^>]*>/g, "");

  const result = await createProperty(input);

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result, { status: 201 });
}
