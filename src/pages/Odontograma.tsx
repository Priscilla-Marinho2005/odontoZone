import { useMemo, useState } from "react";
import { OdontogramaChart } from "../components/OdontogramaChart";
import { usePatients } from "./Pacientes";

export default function Odontograma({ onOpenPatient }: { onOpenPatient?: (protocol: string) => void }) {
  const { patients, setPatients } = usePatients();
  const [protocol, setProtocol] = useState(patients[0]?.protocol ?? "");
  const patient = useMemo(() => patients.find((item) => item.protocol === protocol) ?? patients[0], [patients, protocol]);

  if (!patient) {
    return (
      <main className="min-w-0 flex-1 bg-surface px-4 py-10">
        <p className="text-center text-[13px] text-muted">Nenhum paciente cadastrado.</p>
      </main>
    );
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-4 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal">ÁUREA ODONTO</p>
            <h1 className="mt-0.5 text-[28px] font-semibold leading-tight">Odontograma</h1>
            <p className="text-[13px] text-muted">Arcada dentária, condições e histórico por dente.</p>
          </div>
          <label className="block text-[11px] font-medium text-muted">
            Paciente
            <select value={patient.protocol} onChange={(event) => setProtocol(event.target.value)} className="mt-1 w-full min-w-56 rounded-md border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-teal">
              {patients.map((item) => <option key={item.protocol} value={item.protocol}>{item.name}</option>)}
            </select>
          </label>
        </header>
        {onOpenPatient && (
          <button type="button" onClick={() => onOpenPatient(patient.protocol)} className="mt-3 text-[12px] font-medium text-teal hover:underline">
            Abrir prontuário
          </button>
        )}
        <div className="mt-4">
          <OdontogramaChart
            patient={patient}
            onChange={(next) => setPatients((current) => current.map((item) => item.protocol === next.protocol ? next : item))}
          />
        </div>
      </div>
    </main>
  );
}
