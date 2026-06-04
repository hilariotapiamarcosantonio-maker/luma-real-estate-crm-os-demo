"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { CreatePropertyInput } from "@/lib/crm-write/create-property";
import { agentOptions, zoneOptions } from "@/lib/crm-options";

type CreatePropertyModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (propertyId: string) => void;
};

const DEFAULT_FORM: CreatePropertyInput = {
  ref: "",
  type: "Apartamento",
  operation: "Venta",
  zone: "Piantini",
  address: "",
  price: "",
  currency: "USD",
  maintenance: "",
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
  owner: "",
  expectedComm: "",
  agent: "Laura Méndez",
  notes: ""
};

export function CreatePropertyModal({ open, onClose, onCreated }: CreatePropertyModalProps) {
  const [form, setForm] = useState<CreatePropertyInput>(DEFAULT_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(DEFAULT_FORM);
    setErrors([]);
    setIsSaving(false);
    setCreatedPropertyId(null);
  }, [open]);

  if (!open) return null;

  function updateField(field: keyof CreatePropertyInput, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);

    if (!form.ref.trim()) {
      setErrors(["La referencia/nombre es obligatoria."]);
      return;
    }
    if (!form.price.trim() || isNaN(Number(form.price.replace(/[^\d.]/g, "")))) {
      setErrors(["El precio debe ser un número válido."]);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.propertyId) {
        setErrors(
          data.errors?.length
            ? data.errors
            : [data.error || "No se pudo crear la propiedad."]
        );
        return;
      }

      setCreatedPropertyId(data.propertyId);
      onCreated(data.propertyId);
    } catch {
      setErrors(["No se pudo conectar con el servidor para crear la propiedad."]);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <button
        type="button"
        aria-label="Cerrar formulario"
        className="absolute inset-0"
        onClick={isSaving ? undefined : onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-prop-title"
        className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-crm-line bg-crm-bg2 shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-crm-line bg-crm-surface px-5 py-4">
          <div>
            <h2 id="create-prop-title" className="text-lg font-semibold text-crm-text">
              Añadir Propiedad
            </h2>
            <p className="mt-1 text-sm text-crm-muted">
              Registra una nueva propiedad en la base de datos comercial.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            disabled={isSaving}
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-crm-line bg-crm-surface2 text-crm-muted transition-colors hover:text-crm-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {createdPropertyId ? (
          <div className="max-h-[calc(90vh-84px)] overflow-y-auto p-5">
            <div className="rounded-md border border-crm-green/40 bg-crm-green/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-crm-green" />
                <div>
                  <p className="text-sm font-semibold text-crm-text">
                    Propiedad creada correctamente:{" "}
                    <span className="text-crm-green">{createdPropertyId}</span>
                  </p>
                  <p className="mt-1 text-sm text-crm-muted">
                    El catálogo inmobiliario ha sido actualizado con éxito.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-crm-line">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-md border border-crm-line bg-crm-surface px-4 text-sm font-medium text-crm-muted hover:text-crm-text"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex max-h-[calc(90vh-84px)] flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-6">
              {errors.length > 0 && (
                <div className="rounded-md border border-crm-red/50 bg-crm-red/10 p-3 text-sm text-crm-text">
                  <ul className="list-disc pl-5 space-y-1">
                    {errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label htmlFor="ref" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Nombre / Referencia *
                  </span>
                  <input
                    id="ref"
                    type="text"
                    required
                    value={form.ref}
                    onChange={(e) => updateField("ref", e.target.value)}
                    placeholder="Ej: Apartamento Aurora 2H"
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  />
                </label>

                <label htmlFor="type" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Tipo de Propiedad
                  </span>
                  <select
                    id="type"
                    value={form.type}
                    onChange={(e) => updateField("type", e.target.value)}
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  >
                    {["Apartamento", "Penthouse", "Villa", "Local", "Casa", "Solar"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>

                <label htmlFor="operation" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Operación
                  </span>
                  <select
                    id="operation"
                    value={form.operation}
                    onChange={(e) => updateField("operation", e.target.value)}
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  >
                    {["Venta", "Alquiler"].map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </label>

                <label htmlFor="zone" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Zona
                  </span>
                  <select
                    id="zone"
                    value={form.zone}
                    onChange={(e) => updateField("zone", e.target.value)}
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  >
                    {zoneOptions.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </label>

                <label htmlFor="address" className="flex flex-col md:col-span-2">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Dirección
                  </span>
                  <input
                    id="address"
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Ej: Av. Winston Churchill"
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  />
                </label>

                <label htmlFor="currency" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Moneda
                  </span>
                  <select
                    id="currency"
                    value={form.currency}
                    onChange={(e) => updateField("currency", e.target.value)}
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  >
                    {["USD", "DOP"].map((curr) => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </label>

                <label htmlFor="price" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Precio *
                  </span>
                  <input
                    id="price"
                    type="text"
                    required
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    placeholder="Ej: 150000"
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  />
                </label>

                <label htmlFor="beds" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Habitaciones
                  </span>
                  <input
                    id="beds"
                    type="number"
                    value={form.beds}
                    onChange={(e) => updateField("beds", e.target.value)}
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  />
                </label>

                <label htmlFor="baths" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Baños
                  </span>
                  <input
                    id="baths"
                    type="text"
                    value={form.baths}
                    onChange={(e) => updateField("baths", e.target.value)}
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  />
                </label>

                <label htmlFor="parking" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Parqueos
                  </span>
                  <input
                    id="parking"
                    type="number"
                    value={form.parking}
                    onChange={(e) => updateField("parking", e.target.value)}
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  />
                </label>

                <label htmlFor="m2" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Área (M²)
                  </span>
                  <input
                    id="m2"
                    type="number"
                    value={form.m2}
                    onChange={(e) => updateField("m2", e.target.value)}
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  />
                </label>

                <label htmlFor="furnished" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Amueblada
                  </span>
                  <select
                    id="furnished"
                    value={form.furnished}
                    onChange={(e) => updateField("furnished", e.target.value)}
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  >
                    {["Sí", "No"].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </label>

                <label htmlFor="airbnbReady" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Airbnb Ready
                  </span>
                  <select
                    id="airbnbReady"
                    value={form.airbnbReady}
                    onChange={(e) => updateField("airbnbReady", e.target.value)}
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  >
                    {["Sí", "No"].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </label>

                <label htmlFor="status" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Estatus
                  </span>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  >
                    {["Disponible", "Reservada", "Vendida", "Pausada"].map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </label>

                <label htmlFor="agent" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Asesor Responsable
                  </span>
                  <select
                    id="agent"
                    value={form.agent}
                    onChange={(e) => updateField("agent", e.target.value)}
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  >
                    {agentOptions.map((ag) => (
                      <option key={ag} value={ag}>{ag}</option>
                    ))}
                  </select>
                </label>

                <label htmlFor="owner" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Propietario / Constructor
                  </span>
                  <input
                    id="owner"
                    type="text"
                    value={form.owner}
                    onChange={(e) => updateField("owner", e.target.value)}
                    placeholder="Ej: Inversiones del Norte"
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  />
                </label>

                <label htmlFor="expectedComm" className="flex flex-col">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Comisión Estimada (Monto)
                  </span>
                  <input
                    id="expectedComm"
                    type="text"
                    value={form.expectedComm}
                    onChange={(e) => updateField("expectedComm", e.target.value)}
                    placeholder="Ej: 7500"
                    className="h-10 rounded-md border border-crm-line bg-crm-surface2 px-3 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  />
                </label>

                <label htmlFor="notes" className="flex flex-col md:col-span-2">
                  <span className="mb-1 text-xs font-medium uppercase tracking-wide text-crm-faint">
                    Notas adicionales
                  </span>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Detalles sobre disponibilidad, condiciones de venta, etc."
                    rows={3}
                    className="rounded-md border border-crm-line bg-crm-surface2 px-3 py-2 text-sm text-crm-text focus:border-crm-gold focus:outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-crm-line bg-crm-bg2 px-5 py-4">
              <button
                type="button"
                disabled={isSaving}
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-md border border-crm-line bg-crm-surface px-4 text-sm font-medium text-crm-muted hover:text-crm-text disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-10 items-center justify-center rounded-md bg-crm-gold px-4 text-sm font-medium text-[#080B0E] transition-colors hover:bg-[#b59552] disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando
                  </>
                ) : (
                  "Guardar propiedad"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
