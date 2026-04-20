import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import logoWhite from "@/assets/logo-white.png";

interface Brief {
  id: string;
  client_name: string | null;
  brief_data: Record<string, any>;
  full_data: Record<string, any> | null;
  chat_history: Array<{ role: string; content: string }>;
  phase: string;
  project: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectInfo {
  name: string;
  slug: string;
}

const FIELD_LABELS: Record<string, string> = {
  nombre_negocio: "Nombre del Negocio",
  nombre_contacto: "Nombre del Contacto",
  giro_actividad: "Giro / Actividad",
  objetivo_sitio: "Objetivo del Sitio",
  publico_objetivo: "Público Objetivo",
  competidores_urls: "Competidores / URLs",
  competidores_referencias: "Competidores / Referencias",
  sitios_que_les_gustan: "Sitios que les Gustan",
  tono_personalidad: "Tono y Personalidad",
  diferenciador: "Diferenciador",
  tono_feel: "Tono y Feel",
  identidad_visual: "Identidad Visual",
  secciones_necesarias: "Secciones Necesarias",
  contenido_disponible: "Contenido Disponible",
  llamadas_a_accion: "Llamadas a la Acción",
  redes_sociales: "Redes Sociales",
  referencias_visuales_adicionales: "Referencias Visuales",
  funcionalidades_especiales: "Funcionalidades Especiales",
  idiomas: "Idiomas",
  extras: "Extras",
  nombre_interlocutor: "Nombre del Interlocutor",
  cargo: "Cargo",
  organizacion_interlocutor: "Organización",
  nombre_proyecto: "Nombre del Proyecto",
  objetivos_proyecto: "Objetivos del Proyecto",
  mision_proyecto: "Misión",
  vision_proyecto: "Visión",
  sitio_web_necesario: "¿Sitio Web Necesario?",
  justificacion_sitio_web: "Justificación",
};

const HIDDEN_FIELDS = ["_partial"];

const formatLabel = (key: string) =>
  FIELD_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map((v) => `• ${String(v)}`).join("\n");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const cleanMessage = (content: string): string =>
  content
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/\{"suggestions"[\s\S]*$/, "")
    .replace(/\{"action"[\s\S]*$/, "")
    .trim();

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const phaseLabel = (phase: string) =>
  phase === "done" ? "Completo" : phase === "full" ? "Técnico" : "Brief";

const getDisplayName = (b: Brief): string =>
  b.client_name ||
  (b.brief_data as any)?.nombre_negocio ||
  (b.brief_data as any)?.nombre_interlocutor ||
  (b.brief_data as any)?.nombre_contacto ||
  "Sin nombre";

// ---------- PDF ----------
const loadImageAsDataUrl = (src: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No canvas context"));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });

export async function exportProjectBriefsPDF(project: ProjectInfo, briefs: Brief[]) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;

  // Cover page
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Logo (left-aligned, top portion)
  try {
    const logoData = await loadImageAsDataUrl(logoWhite);
    const logoSize = 130;
    doc.addImage(logoData, "PNG", margin, 100, logoSize, logoSize);
  } catch {
    // ignore logo errors, continue without it
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(project.name, margin, 260, { maxWidth: contentWidth });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(180, 180, 180);
  doc.text(`Exportación de respuestas — ${briefs.length} participante${briefs.length !== 1 ? "s" : ""}`, margin, 295);
  doc.setFontSize(10);
  doc.setTextColor(140, 140, 140);
  doc.text(formatDate(new Date().toISOString()), margin, 315);

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Im-Pulsa · Agencia de Automatizaciones y Tecnología", margin, pageHeight - margin);


  // Briefs
  briefs.forEach((brief, idx) => {
    doc.addPage();
    let y = margin;

    // Header
    doc.setFillColor(245, 245, 247);
    doc.rect(0, 0, pageWidth, 70, "F");
    doc.setTextColor(20, 136, 252);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`PARTICIPANTE ${idx + 1} / ${briefs.length}`, margin, 28);
    doc.setTextColor(15, 15, 15);
    doc.setFontSize(18);
    doc.text(getDisplayName(brief), margin, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`${phaseLabel(brief.phase)} · ${formatDate(brief.updated_at || brief.created_at)}`, margin, 62);

    y = 100;

    // Summary table
    const allData = { ...brief.brief_data, ...(brief.full_data || {}) };
    const rows = Object.entries(allData)
      .filter(([k]) => !HIDDEN_FIELDS.includes(k))
      .map(([k, v]) => [formatLabel(k), formatValue(v)]);

    if (rows.length > 0) {
      doc.setTextColor(15, 15, 15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Resumen", margin, y);
      y += 14;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [],
        body: rows,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 6, valign: "top", textColor: [40, 40, 40] },
        columnStyles: {
          0: { cellWidth: 150, fontStyle: "bold", textColor: [20, 136, 252] },
          1: { cellWidth: contentWidth - 150 },
        },
        didDrawCell: (data) => {
          if (data.section === "body" && data.column.index === 0) {
            const { x, y: cellY, height } = data.cell;
            doc.setDrawColor(230, 230, 230);
            doc.line(x, cellY + height, x + contentWidth, cellY + height);
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 24;
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(140, 140, 140);
      doc.text("Sin datos de resumen.", margin, y);
      y += 24;
    }

    // Conversation
    const messages = (brief.chat_history || [])
      .map((m) => ({ role: m.role, content: cleanMessage(m.content || "") }))
      .filter((m) => m.content);

    if (messages.length > 0) {
      if (y > pageHeight - 120) {
        doc.addPage();
        y = margin;
      }
      doc.setTextColor(15, 15, 15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Conversación", margin, y);
      y += 16;

      messages.forEach((msg) => {
        const isUser = msg.role === "user";
        const label = isUser ? "Usuario" : "Asistente";
        const bodyLines = doc.splitTextToSize(msg.content, contentWidth - 16);
        const blockHeight = bodyLines.length * 11 + 22;

        if (y + blockHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        if (isUser) {
          doc.setFillColor(20, 136, 252);
          doc.setTextColor(255, 255, 255);
        } else {
          doc.setFillColor(245, 245, 247);
          doc.setTextColor(30, 30, 30);
        }
        doc.roundedRect(margin, y, contentWidth, blockHeight - 6, 6, 6, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(label.toUpperCase(), margin + 10, y + 12);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(bodyLines, margin + 10, y + 26);

        y += blockHeight + 4;
      });
    }
  });

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`${i - 1} / ${pageCount - 1}`, pageWidth - margin, pageHeight - 20, { align: "right" });
    doc.text("Im-Pulsa", margin, pageHeight - 20);
  }

  doc.save(`${project.slug}-briefs-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ---------- Excel ----------
export function exportProjectBriefsExcel(project: ProjectInfo, briefs: Brief[]) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumen — one row per brief with all fields as columns
  const allKeys = new Set<string>();
  briefs.forEach((b) => {
    const all = { ...b.brief_data, ...(b.full_data || {}) };
    Object.keys(all).forEach((k) => {
      if (!HIDDEN_FIELDS.includes(k)) allKeys.add(k);
    });
  });
  const keyList = Array.from(allKeys);

  const summaryRows = briefs.map((b) => {
    const all = { ...b.brief_data, ...(b.full_data || {}) };
    const row: Record<string, any> = {
      Participante: getDisplayName(b),
      Estado: phaseLabel(b.phase),
      Creado: formatDate(b.created_at),
      Actualizado: formatDate(b.updated_at),
    };
    keyList.forEach((k) => {
      row[formatLabel(k)] = formatValue(all[k]);
    });
    return row;
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  // Auto column widths
  const headers = Object.keys(summaryRows[0] || { Participante: "" });
  wsSummary["!cols"] = headers.map((h) => {
    const maxLen = Math.max(
      h.length,
      ...summaryRows.map((r) => String(r[h] || "").split("\n")[0].length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 12), 60) };
  });
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

  // Sheet 2: Conversaciones — one row per message
  const conversationRows: any[] = [];
  briefs.forEach((b) => {
    const name = getDisplayName(b);
    (b.chat_history || []).forEach((m, i) => {
      const content = cleanMessage(m.content || "");
      if (!content) return;
      conversationRows.push({
        Participante: name,
        "#": i + 1,
        Rol: m.role === "user" ? "Usuario" : "Asistente",
        Mensaje: content,
      });
    });
  });

  if (conversationRows.length > 0) {
    const wsChat = XLSX.utils.json_to_sheet(conversationRows);
    wsChat["!cols"] = [{ wch: 28 }, { wch: 5 }, { wch: 12 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(wb, wsChat, "Conversaciones");
  }

  XLSX.writeFile(wb, `${project.slug}-briefs-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
