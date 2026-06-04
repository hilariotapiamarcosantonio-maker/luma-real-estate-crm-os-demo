import "server-only";
import { getSheetsClient } from "../google-sheets";
import { DashboardData } from "@/types/crm";
import { getVisits } from "./get-visits";

const FILL_COLORS = {
  blue: "#315D91",
  teal: "#2BAE9E",
  cyan: "#2A8C95",
  amber: "#B8860B",
  violet: "#61498A",
  green: "#2F7D52",
};

const emptyDashboard: DashboardData = {
  totalLeads: 0,
  visitasAgendadas: 0,
  cierresGanados: 0,
  comisionesAcumuladas: "$ 0",
  funnelData: [],
  upcomingVisits: [],
};

import { readMockDb } from "./mock-db";

export async function getDashboardData(): Promise<DashboardData> {
  const { sheets, spreadsheetId } = await getSheetsClient();

  if (!sheets || !spreadsheetId) {
    const db = readMockDb();
    
    // Calculate total leads
    const totalLeads = db.leads.length;
    
    // Calculate visits count
    const visitasAgendadas = db.visits.filter(v => v.status === "Agendada").length;
    
    // Calculate closings count
    const cierresGanados = db.closings.filter(c => c.status === "Cobrado" || c.status === "Cerrado").length;
    
    // Calculate comisiones
    let totalComm = 0;
    db.closings.forEach(c => {
      const val = parseFloat(String(c.commGross).replace(/[^\d.]/g, "")) || 0;
      totalComm += val;
    });
    const comisionesAcumuladas = `USD ${totalComm.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    
    // Calculate funnelData
    const stageCounts: Record<string, number> = {
      "Nuevo Lead": 0,
      "Contactado": 0,
      "Visita Agendada": 0,
      "Propuesta Enviada": 0,
      "Negociacion": 0,
      "Cierre Ganado": 0
    };
    
    db.leads.forEach(lead => {
      const stage = lead.pipelineStage || lead.status;
      if (stage === "Nuevo" || stage === "Nuevo lead" || stage === "Nuevo Lead") {
        stageCounts["Nuevo Lead"]++;
      } else if (stage === "Contactado") {
        stageCounts["Contactado"]++;
      } else if (stage === "Seguimiento" || stage === "Visita agendada" || stage === "Visita Agendada") {
        stageCounts["Visita Agendada"]++;
      } else if (stage === "Propuesta enviada" || stage === "Propuesta Enviada") {
        stageCounts["Propuesta Enviada"]++;
      } else if (stage === "Negociacion" || stage === "Negociación") {
        stageCounts["Negociacion"]++;
      } else if (stage === "Cerrado" || stage === "Cierre ganado" || stage === "Cierre Ganado") {
        stageCounts["Cierre Ganado"]++;
      } else {
        stageCounts["Nuevo Lead"]++;
      }
    });
    
    const colors = [FILL_COLORS.blue, FILL_COLORS.teal, FILL_COLORS.cyan, FILL_COLORS.amber, FILL_COLORS.violet, FILL_COLORS.green];
    const funnelData = Object.keys(stageCounts).map((key, i) => ({
      name: key,
      value: stageCounts[key],
      fill: colors[i % colors.length]
    }));
    
    return {
      totalLeads,
      visitasAgendadas,
      cierresGanados,
      comisionesAcumuladas,
      funnelData,
      upcomingVisits: db.visits.slice(0, 5)
    };
  }

  try {
    // Obtenemos los KPIs directamente del Dashboard sheet de Google Sheets
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: [
        "Dashboard!B4:B4", // Leads
        "Dashboard!E4:E4", // Visitas
        "Dashboard!H4:H4", // Cierres
        "Dashboard!K4:K4", // Comisiones
        "Dashboard!B13:C18" // Funnel
      ],
    });

    const vr = response.data.valueRanges;
    if (!vr) throw new Error("No data ranges returned");

    const totalLeads = parseInt(vr[0].values?.[0]?.[0] || "0", 10);
    const visitas = parseInt(vr[1].values?.[0]?.[0] || "0", 10);
    const cierres = parseInt(vr[2].values?.[0]?.[0] || "0", 10);
    const comisiones = vr[3].values?.[0]?.[0] || "$ 0";

    const funnelRows = vr[4].values || [];
    const colors = [FILL_COLORS.blue, FILL_COLORS.teal, FILL_COLORS.cyan, FILL_COLORS.amber, FILL_COLORS.violet, FILL_COLORS.green];

    const funnelData = funnelRows.map((row, i) => ({
      name: row[0],
      value: parseInt(row[1] || "0", 10),
      fill: colors[i % colors.length]
    }));

    // Visitas reales para la tabla inferior
    const upcomingVisits = await getVisits();

    return {
      totalLeads,
      visitasAgendadas: visitas,
      cierresGanados: cierres,
      comisionesAcumuladas: comisiones,
      funnelData,
      upcomingVisits: upcomingVisits.slice(0, 5)
    };

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return emptyDashboard;
  }
}
