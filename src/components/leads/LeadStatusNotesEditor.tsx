"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MessageSquarePlus } from "lucide-react";
import { agentOptions, pipelineStageOptions } from "@/lib/crm-options";

type LeadStatusNotesEditorProps = {
  leadId: string;
  currentStatus: string;
  currentAgent: string;
};

export function LeadStatusNotesEditor({
  leadId,
  currentStatus,
  currentAgent,
}: LeadStatusNotesEditorProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus || "Nuevo lead");
  const [agent, setAgent] = useState(currentAgent || "Laura Méndez");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, note, agent }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "No se pudo registrar el seguimiento.");
        return;
      }

      setSuccess(true);
      setNote("");
      router.refresh();

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-crm-line bg-crm-surface p-5 shadow-sm space-y-4"
    >
      <h3 className="font-semibold text-crm-text flex items-center gap-2">
        <MessageSquarePlus className="h-4 w-4 text-crm-gold" />
        Registrar Seguimiento
      </h3>

      {error && (
        <div className="rounded-md border border-crm-red/50 bg-crm-red/10 p-2 text-xs text-crm-red">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-crm-green/50 bg-crm-green/10 p-2 text-xs text-crm-green flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5" /> Seguimiento registrado correctamente.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label htmlFor="edit-status" className="flex flex-col">
          <span className="mb-1 text-xs font-medium text-crm-faint uppercase">
            Estado Comercial
          </span>
          <select
            id="edit-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
          >
            {pipelineStageOptions.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="edit-agent" className="flex flex-col">
          <span className="mb-1 text-xs font-medium text-crm-faint uppercase">
            Asesor Responsable
          </span>
          <select
            id="edit-agent"
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
          >
            {agentOptions.map((ag) => (
              <option key={ag} value={ag}>
                {ag}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label htmlFor="edit-note" className="flex flex-col">
        <span className="mb-1 text-xs font-medium text-crm-faint uppercase">
          Nota de Seguimiento
        </span>
        <textarea
          id="edit-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Escribe detalles del contacto, próximos pasos o compromisos..."
          rows={3}
          className="rounded-md border border-crm-line bg-crm-surface2 px-3 py-2 text-sm text-crm-text placeholder:text-crm-faint focus:border-crm-gold focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full inline-flex h-10 items-center justify-center rounded-md bg-crm-gold px-4 text-sm font-medium text-[#080B0E] transition-colors hover:bg-[#b59552] disabled:opacity-60"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando
          </>
        ) : (
          "Guardar Seguimiento"
        )}
      </button>
    </form>
  );
}
