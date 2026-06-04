import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log("=== INICIANDO QA FUNCIONAL DE AURORA CRM ===");

  try {
    // 1. Verificar rutas básicas
    const routes = [
      { path: "/", name: "Dashboard" },
      { path: "/propiedades", name: "Propiedades" },
      { path: "/leads", name: "Leads" },
      { path: "/visitas", name: "Visitas" },
      { path: "/cierres", name: "Cierres" },
      { path: "/pipeline", name: "Pipeline" },
      { path: "/leads/VR-0001", name: "Detalle de Lead (Laura Méndez)" }
    ];

    for (const route of routes) {
      const response = await fetch(`${BASE_URL}${route.path}`);
      if (response.status !== 200) {
        throw new Error(`Ruta ${route.name} (${route.path}) retornó código de estado ${response.status}`);
      }
      const html = await response.text();
      
      // Validar branding de INMUEBLES OS y Aurora CRM Inmobiliario
      if (!html.includes("INMUEBLES") && !html.includes("Aurora CRM Inmobiliario") && !html.includes("Luma Real Estate")) {
        console.warn(`[WARN] Ruta ${route.name} puede no tener el branding esperado.`);
      }
      
      // Validar advertencia de modo demo local
      if (!html.includes("Modo demo local")) {
        console.warn(`[WARN] Ruta ${route.name} no muestra la advertencia de modo demo local.`);
      }

      console.log(`✓ Ruta: ${route.name} (${route.path}) - OK (200)`);
    }

    // 2. Añadir propiedad nueva
    const newPropPayload = {
      ref: "Apartamento Aurora Test 1",
      type: "Apartamento",
      operation: "Venta",
      zone: "Piantini",
      address: "Calle de prueba 123",
      price: "195000",
      currency: "USD",
      maintenance: "100",
      beds: "2",
      baths: "2",
      parking: "1",
      m2: "90",
      furnished: "No",
      airbnbReady: "Sí",
      corp: "No",
      retirement: "No",
      investment: "Sí",
      status: "Disponible",
      owner: "Constructor de prueba",
      expectedComm: "9750",
      agent: "Laura Méndez",
      notes: "Propiedad creada durante el test de QA funcional."
    };

    console.log("\n-> Probando creación de propiedad...");
    const propResponse = await fetch(`${BASE_URL}/api/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPropPayload)
    });

    const propResult = await propResponse.json();
    if (!propResult.success || !propResult.propertyId) {
      throw new Error(`Error al crear propiedad: ${JSON.stringify(propResult)}`);
    }
    console.log(`✓ Propiedad creada con éxito. ID: ${propResult.propertyId}`);

    // Verificar que aparece en el listado de propiedades
    const propertiesResponse = await fetch(`${BASE_URL}/propiedades`);
    const propertiesHtml = await propertiesResponse.text();
    if (!propertiesHtml.includes("Apartamento Aurora Test 1")) {
      throw new Error("La propiedad recién creada no aparece en la página de listado.");
    }
    console.log("✓ Propiedad aparece en el listado HTML - OK");

    // 3. Añadir lead nuevo
    const newLeadPayload = {
      name: "Juan Test Lead",
      phone: "+18095559999",
      email: "juan.test@example.com",
      source: "WhatsApp",
      opp: "Airbnb",
      budget: "200000",
      clientType: "Comprador",
      opType: "Venta",
      zoneOfInterest: "Piantini",
      propIdOfInterest: propResult.propertyId,
      propNameOfInterest: "Apartamento Aurora Test 1",
      temperature: "Tibio",
      pipelineStage: "Nuevo lead",
      probability: "20",
      notes: "Lead registrado desde el test de QA funcional.",
      agent: "Asesor Comercial"
    };

    console.log("\n-> Probando creación de lead...");
    const leadResponse = await fetch(`${BASE_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLeadPayload)
    });

    const leadResult = await leadResponse.json();
    if (!leadResult.success || !leadResult.leadId) {
      throw new Error(`Error al crear lead: ${JSON.stringify(leadResult)}`);
    }
    console.log(`✓ Lead creado con éxito. ID: ${leadResult.leadId}`);

    // Verificar que aparece en el listado de leads
    const leadsResponse = await fetch(`${BASE_URL}/leads`);
    const leadsHtml = await leadsResponse.text();
    if (!leadsHtml.includes("Juan Test Lead")) {
      throw new Error("El lead recién creado no aparece en la página de listado.");
    }
    console.log("✓ Lead aparece en el listado HTML - OK");

    // 4. Probar seguimiento (Cambiar estado y agregar nota)
    console.log(`\n-> Probando actualización de seguimiento para lead ${leadResult.leadId}...`);
    const updatePayload = {
      status: "Contactado",
      note: "Hablamos por teléfono, está interesado en visitar la próxima semana.",
      agent: "Marcos Hilario"
    };

    const updateResponse = await fetch(`${BASE_URL}/api/leads/${leadResult.leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload)
    });

    const updateResult = await updateResponse.json();
    if (!updateResult.success) {
      throw new Error(`Error al actualizar lead: ${JSON.stringify(updateResult)}`);
    }
    console.log("✓ Actualización de seguimiento exitosa.");

    // Verificar que el estado y la nota se reflejan en el detalle del lead
    const detailResponse = await fetch(`${BASE_URL}/leads/${leadResult.leadId}`);
    const detailHtml = await detailResponse.text();
    if (!detailHtml.includes("Contactado")) {
      throw new Error("El estado actualizado no se refleja en la página de detalle del lead.");
    }
    if (!detailHtml.includes("Hablamos por teléfono")) {
      throw new Error("La nota de seguimiento no aparece en la sección de observaciones.");
    }
    console.log("✓ Estado y notas reflejados correctamente en el detalle del lead - OK");

    // 5. Verificar persistencia local en tmp/mock-db-state.json
    console.log("\n-> Verificando persistencia local en tmp/mock-db-state.json...");
    const dbPath = path.join(process.cwd(), "tmp", "mock-db-state.json");
    if (!fs.existsSync(dbPath)) {
      throw new Error("El archivo tmp/mock-db-state.json no fue creado.");
    }
    const dbData = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    const foundProp = dbData.properties.find(p => p.id === propResult.propertyId);
    const foundLead = dbData.leads.find(l => l.id === leadResult.leadId);

    if (!foundProp || foundProp.ref !== "Apartamento Aurora Test 1") {
      throw new Error("La propiedad no persistió correctamente en el JSON local.");
    }
    if (!foundLead || foundLead.name !== "Juan Test Lead" || foundLead.status !== "Contactado") {
      throw new Error("El lead o su estado no persistió correctamente en el JSON local.");
    }
    console.log("✓ Datos persistentes en JSON local - OK");

    console.log("\n=== QA FUNCIONAL COMPLETADO CON ÉXITO ===");
  } catch (error) {
    console.error("\n❌ ERROR DURANTE QA FUNCIONAL:", error.message);
    process.exit(1);
  }
}

runTests();
