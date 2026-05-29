import type { User } from "../types/api";
import "./TechnicianMultiPicker.css";

type Props = {
  technicians: User[];
  value: string[];
  onChange: (ids: string[]) => void;
};

export function TechnicianMultiPicker({ technicians, value, onChange }: Props) {
  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  }

  if (technicians.length === 0) {
    return <p className="technician-picker-empty">Nenhum técnico cadastrado.</p>;
  }

  return (
    <div className="technician-picker">
      <div className="technician-picker-chips">
        {technicians.map((t) => {
          const active = value.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              className={active ? "technician-chip active" : "technician-chip"}
              onClick={() => toggle(t.id)}
            >
              {active ? "✓ " : ""}
              {t.name}
            </button>
          );
        })}
      </div>
      {value.length > 0 ? (
        <div className="technician-picker-meta">
          <span>{value.length} selecionado(s)</span>
          <button type="button" className="technician-clear" onClick={() => onChange([])}>
            Limpar
          </button>
        </div>
      ) : (
        <p className="technician-picker-hint">Opcional  clique para selecionar um ou mais técnicos.</p>
      )}
    </div>
  );
}
