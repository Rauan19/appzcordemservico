import { priorityColors, priorityOptions } from "../utils/labels";
import "./PrioritySelect.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function PrioritySelect({ value, onChange }: Props) {
  return (
    <div className="priority-select">
      {priorityOptions.map((opt) => {
        const color = priorityColors[opt.value];
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={active ? "priority-chip active" : "priority-chip"}
            style={{
              ["--priority-color" as string]: color,
              borderColor: active ? color : `${color}55`,
              background: active ? `${color}18` : "var(--surface)",
              color: active ? color : "var(--text)",
            }}
            onClick={() => onChange(opt.value)}
          >
            <span className="priority-dot" style={{ background: color }} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const color = priorityColors[priority] ?? "#64748b";
  const label = priorityOptions.find((p) => p.value === priority)?.label ?? priority;
  return (
    <span
      className="priority-badge"
      style={{
        color,
        background: `${color}18`,
        borderColor: `${color}40`,
      }}
    >
      <span className="priority-dot" style={{ background: color }} />
      {label}
    </span>
  );
}
