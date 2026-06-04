import fs from "fs";
import path from "path";
import { Property, Lead, Visit, Closing } from "@/types/crm";

const MOCK_DB_PATH = path.join(process.cwd(), "tmp", "mock-db-state.json");

const initialProperties: Property[] = [
  {
    id: "PR-001",
    ref: "Apartamento Aurora 2H",
    type: "Apartamento",
    operation: "Venta",
    zone: "Piantini",
    address: "Av. Abraham Lincoln Esq. Gustavo Mejía Ricart",
    price: "USD 175,000",
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
    expectedComm: "USD 8,750",
    agent: "Daniel Reyes",
    notes: "Excelente opción para inversión Airbnb. Vista despejada.",
    img: "AA"
  },
  {
    id: "PR-002",
    ref: "Apartamento Aurora 3H",
    type: "Apartamento",
    operation: "Venta",
    zone: "Naco",
    address: "Calle Alberto Larancuent",
    price: "USD 250,000",
    currency: "USD",
    maintenance: "200",
    beds: "3",
    baths: "3",
    parking: "2",
    m2: "140",
    furnished: "No",
    airbnbReady: "No",
    corp: "No",
    retirement: "No",
    investment: "No",
    status: "Disponible",
    owner: "María López",
    expectedComm: "USD 12,500",
    agent: "Daniel Reyes",
    notes: "Familiar con excelentes áreas comunes y planta full.",
    img: "AB"
  },
  {
    id: "PR-003",
    ref: "Penthouse Vista Norte",
    type: "Penthouse",
    operation: "Venta",
    zone: "Bella Vista",
    address: "Av. Sarasota",
    price: "USD 420,000",
    currency: "USD",
    maintenance: "350",
    beds: "4",
    baths: "4.5",
    parking: "3",
    m2: "280",
    furnished: "Sí",
    airbnbReady: "No",
    corp: "No",
    retirement: "No",
    investment: "No",
    status: "Disponible",
    owner: "Carlos Gómez",
    expectedComm: "USD 21,000",
    agent: "Camila Torres",
    notes: "Terraza privada techada y destechada con jacuzzi.",
    img: "PN"
  },
  {
    id: "PR-004",
    ref: "Villa Serena",
    type: "Villa",
    operation: "Venta",
    zone: "Punta Cana",
    address: "Punta Cana Resort & Club",
    price: "USD 380,000",
    currency: "USD",
    maintenance: "180",
    beds: "3",
    baths: "3.5",
    parking: "2",
    m2: "220",
    furnished: "Sí",
    airbnbReady: "Sí",
    corp: "No",
    retirement: "Sí",
    investment: "Sí",
    status: "Disponible",
    owner: "Pedro Martínez",
    expectedComm: "USD 19,000",
    agent: "Laura Méndez",
    notes: "A pasos de la playa, amueblada por diseñador.",
    img: "VS"
  },
  {
    id: "PR-005",
    ref: "Local Comercial Prisma",
    type: "Local",
    operation: "Venta",
    zone: "Bella Vista",
    address: "Av. Rómulo Betancourt",
    price: "USD 150,000",
    currency: "USD",
    maintenance: "100",
    beds: "0",
    baths: "1",
    parking: "1",
    m2: "50",
    furnished: "No",
    airbnbReady: "No",
    corp: "Sí",
    retirement: "No",
    investment: "Sí",
    status: "Reservada",
    owner: "Construcciones Prisma",
    expectedComm: "USD 7,500",
    agent: "Laura Méndez",
    notes: "Local comercial a pie de calle en torre corporativa moderna.",
    img: "LC"
  }
];

const initialLeads: Lead[] = [
  {
    id: "VR-0001",
    date: "04/06/2026",
    name: "Laura Méndez",
    email: "laura.m@example.com",
    phone: "+18095550101",
    source: "WhatsApp",
    landing: "",
    opp: "Apartamento Aurora 2H",
    budget: "180000",
    priority: "Alta",
    status: "Nuevo",
    lastContact: "04/06/2026",
    nextFollowUp: "05/06/2026",
    agent: "Daniel Reyes",
    notes: "Interesada en el apartamento de 2 habitaciones para vivir.",
    tags: "Vivir",
    result: "",
    action: "",
    propIdOfInterest: "PR-001",
    propNameOfInterest: "Apartamento Aurora 2H",
    clientType: "Comprar para Vivir",
    opType: "Venta",
    zoneOfInterest: "Piantini",
    temperature: "Caliente",
    potentialComm: "8750",
    pipelineStage: "Nuevo lead",
    probability: "80",
    sourceChannel: "WhatsApp",
    campaignName: "Orgánico",
    created_from: "luma-real-estate-crm-os-demo"
  } as unknown as Lead,
  {
    id: "VR-0002",
    date: "03/06/2026",
    name: "Carlos Rivera",
    email: "carlos.r@example.com",
    phone: "+18095550102",
    source: "Instagram",
    landing: "",
    opp: "Apartamento Aurora 3H",
    budget: "260000",
    priority: "Media",
    status: "Contactado",
    lastContact: "03/06/2026",
    nextFollowUp: "06/06/2026",
    agent: "Daniel Reyes",
    notes: "Preguntó por el catálogo y fotos adicionales de Naco.",
    tags: "Catálogo",
    result: "",
    action: "",
    propIdOfInterest: "PR-002",
    propNameOfInterest: "Apartamento Aurora 3H",
    clientType: "Comprar para Vivir",
    opType: "Venta",
    zoneOfInterest: "Naco",
    temperature: "Tibio",
    potentialComm: "12500",
    pipelineStage: "Contactado",
    probability: "50",
    sourceChannel: "Redes Sociales",
    created_from: "luma-real-estate-crm-os-demo"
  } as unknown as Lead,
  {
    id: "VR-0003",
    date: "02/06/2026",
    name: "Sofía Peña",
    email: "sofia.p@example.com",
    phone: "+18095550103",
    source: "Landing",
    landing: "/propiedades/penthouse",
    opp: "Penthouse Vista Norte",
    budget: "450000",
    priority: "Alta",
    status: "Interesado",
    lastContact: "02/06/2026",
    nextFollowUp: "05/06/2026",
    agent: "Camila Torres",
    notes: "Cliente inversionista, busca plusvalía y retorno rápido.",
    tags: "Inversión",
    result: "",
    action: "",
    propIdOfInterest: "PR-003",
    propNameOfInterest: "Penthouse Vista Norte",
    clientType: "Invertir",
    opType: "Venta",
    zoneOfInterest: "Bella Vista",
    temperature: "Caliente",
    potentialComm: "21000",
    pipelineStage: "Seguimiento",
    probability: "75",
    sourceChannel: "Meta Ads demo",
    created_from: "luma-real-estate-crm-os-demo"
  } as unknown as Lead,
  {
    id: "VR-0004",
    date: "01/06/2026",
    name: "Andrés Castillo",
    email: "andres.c@example.com",
    phone: "+18095550104",
    source: "Referido",
    landing: "",
    opp: "Villa Serena",
    budget: "380000",
    priority: "Alta",
    status: "Visita agendada",
    lastContact: "01/06/2026",
    nextFollowUp: "04/06/2026",
    agent: "Laura Méndez",
    notes: "Visita coordinada en la villa para este fin de semana.",
    tags: "Segunda línea",
    result: "",
    action: "",
    propIdOfInterest: "PR-004",
    propNameOfInterest: "Villa Serena",
    clientType: "Invertir",
    opType: "Venta",
    zoneOfInterest: "Punta Cana",
    temperature: "Caliente",
    potentialComm: "19000",
    pipelineStage: "Visita agendada",
    probability: "90",
    sourceChannel: "Referido",
    created_from: "luma-real-estate-crm-os-demo"
  } as unknown as Lead,
  {
    id: "VR-0005",
    date: "28/05/2026",
    name: "Natalia Gómez",
    email: "natalia.g@example.com",
    phone: "+18095550105",
    source: "Feria inmobiliaria",
    landing: "",
    opp: "Local Comercial Prisma",
    budget: "160000",
    priority: "Media",
    status: "Negociación",
    lastContact: "30/05/2026",
    nextFollowUp: "05/06/2026",
    agent: "Laura Méndez",
    notes: "Enviado borrador de contrato de promesa de compraventa. Esperando firma.",
    tags: "Comercial",
    result: "",
    action: "",
    propIdOfInterest: "PR-005",
    propNameOfInterest: "Local Comercial Prisma",
    clientType: "Invertir",
    opType: "Venta",
    zoneOfInterest: "Bella Vista",
    temperature: "Caliente",
    potentialComm: "7500",
    pipelineStage: "Negociación",
    probability: "95",
    sourceChannel: "Feria",
    created_from: "luma-real-estate-crm-os-demo"
  } as unknown as Lead
];

const initialVisits: Visit[] = [
  {
    id: "V-001",
    date: "06/06/2026",
    time: "10:00 AM",
    leadId: "VR-0004",
    propId: "PR-004",
    agent: "Laura Méndez",
    status: "Agendada",
    interest: "Alto",
    comments: "El cliente viaja desde Santo Domingo especialmente para la visita.",
    nextStep: "Firmar acuerdo de visita y recorrer la propiedad."
  }
];

const initialClosings: Closing[] = [
  {
    id: "CL-001",
    date: "30/05/2026",
    leadId: "VR-0005",
    propId: "PR-005",
    type: "Venta Local",
    price: "150000",
    currency: "USD",
    commPct: "5",
    commGross: "7500",
    status: "Cobrado",
    invoiceDate: "30/05/2026",
    notes: "Cierre exitoso en preventa."
  }
];

export interface MockSchema {
  properties: Property[];
  leads: Lead[];
  visits: Visit[];
  closings: Closing[];
}

function ensureMockDbExists() {
  const dir = path.dirname(MOCK_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(MOCK_DB_PATH)) {
    const data: MockSchema = {
      properties: initialProperties,
      leads: initialLeads,
      visits: initialVisits,
      closings: initialClosings
    };
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), "utf8");
  }
}

export function readMockDb(): MockSchema {
  try {
    ensureMockDbExists();
    const raw = fs.readFileSync(MOCK_DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading mock DB file:", error);
    return {
      properties: initialProperties,
      leads: initialLeads,
      visits: initialVisits,
      closings: initialClosings
    };
  }
}

export function writeMockDb(data: MockSchema): boolean {
  try {
    ensureMockDbExists();
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing mock DB file:", error);
    return false;
  }
}
