import {
  CONTRACT_VARIABLE_GROUPS,
  CONTRACT_VARIABLES,
  insertIntoTextarea,
  variableToken,
  type ContractVariable,
} from "../utils/contract-variables";
import "./TemplateVariableChips.css";

type Props = {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsert: (value: string) => void;
};

export function TemplateVariableChips({ textareaRef, onInsert }: Props) {
  const groups = (["cliente", "contrato", "provedor"] as const).map((group) => ({
    group,
    title: CONTRACT_VARIABLE_GROUPS[group],
    items: CONTRACT_VARIABLES.filter((v) => v.group === group),
  }));

  function insert(variable: ContractVariable) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    insertIntoTextarea(textarea, variableToken(variable.key), onInsert);
  }

  function handleDragStart(e: React.DragEvent, variable: ContractVariable) {
    e.dataTransfer.setData("text/plain", variableToken(variable.key));
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="template-vars">
      <p className="template-vars-hint">
        Arraste ou clique nas variáveis para inserir no contrato (ex.:{" "}
        <code>{"{{valor}}"}</code>).
      </p>
      {groups.map(({ group, title, items }) => (
        <div key={group} className="template-vars-group">
          <span className="template-vars-group-title">{title}</span>
          <div className="template-vars-chips">
            {items.map((variable) => (
              <button
                key={variable.key}
                type="button"
                className="template-var-chip"
                draggable
                title={variable.hint ?? `Inserir ${variableToken(variable.key)}`}
                onDragStart={(e) => handleDragStart(e, variable)}
                onClick={() => insert(variable)}
              >
                {variable.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function bindTemplateTextareaDrop(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  onInsert: (value: string) => void,
) {
  return {
    onDragOver: (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDrop: (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const token = e.dataTransfer.getData("text/plain");
      if (!token || !textareaRef.current) return;
      insertIntoTextarea(textareaRef.current, token, onInsert);
    },
  };
}
