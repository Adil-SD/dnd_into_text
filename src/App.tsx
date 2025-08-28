import {
  DndContext,
  DragOverlay,
  useDndContext,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import "./App.css";
import { useMemo, useState } from "react";
import { Textarea } from "./components/textarea";
import { Grip } from "lucide-react";
import clsx from "clsx";

type Node = {
  name: string;
  variable: string;
};

const NODES: Node[] = [
  {
    name: "Company name",
    variable: "COMPANY_NAME",
  },
  {
    name: "User name",
    variable: "USER_NAME",
  },
];

const TOKEN_RE = /\{\{([A-Z0-9_]+)\}\}/g;

function getUsedVariables(text: string): Set<string> {
  const used = new Set<string>();
  for (const m of text.matchAll(TOKEN_RE)) {
    if (m[1]) used.add(m[1]);
  }
  return used;
}

function stripAllTokens(s: string): string {
  const noTokens = s.replace(TOKEN_RE, "").trim();
  return noTokens
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function NodeDraggableCard({ node }: { node: Node }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: node.variable,
    data: {
      variable: node.variable,
    },
  });
  const { active } = useDndContext();
  const isActive = active?.id === node.variable;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      className={`rounded border border-2 p-2 w-fit ${clsx(isActive && "opacity-0")}`}
    >
      <button className="flex gap-3">
        <div
          ref={setNodeRef}
          style={style}
          {...listeners}
          {...attributes}
          className="cursor-grab"
        >
          <Grip />
        </div>
        {node.name}
      </button>
    </div>
  );
}

function DroppableSlot({ index }: { index: number }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${index}`,
    data: { index },
  });

  return (
    <span
      ref={setNodeRef}
      style={{
        display: "inline-block",
        height: "1.2em",
      }}
      aria-label={`drop at ${index}`}
      className="font-bold text-green-800"
    >
      {isOver ? " | " : " "}
    </span>
  );
}

function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [text, setText] = useState("Hello , I am texting you from ");
  const usedVars = useMemo(() => getUsedVariables(text), [text]);
  return (
    <div className="p-10">
      <h1 className="text-xl font-semibold">Drag and drop into textarea</h1>
      <DndContext
        onDragStart={() => setIsDragging(true)}
        onDragCancel={() => setIsDragging(false)}
        onDragEnd={(event) => {
          setIsDragging(false);
          if (!event.over) return;
          const dropIndex = event.over.data?.current?.index as
            | number
            | undefined;
          const variable =
            (event.active.data?.current as { variable?: string })?.variable ??
            String(event.active.id);

          if (dropIndex == null) return;

          if (getUsedVariables(text).has(variable)) return;

          const token = `{{${variable}}}`;
          setText((prev) => {
            const parts = prev.split(" ");
            const idx = Math.max(0, Math.min(dropIndex, parts.length));
            parts.splice(idx, 0, token);
            return parts.join(" ");
          });
        }}
      >
        <div className="flex flex-col gap-5">
          {isDragging ? (
            <div
              className="border border-2 border-gray-700 rounded-xl px-5 py-3"
              style={{ cursor: "grabbing", userSelect: "none" }}
            >
              {text.split(" ").map((word, i) => (
                <span key={`pair-${i}`} style={{ whiteSpace: "pre-wrap" }}>
                  <span>{word}</span>
                  <DroppableSlot index={i + 1} />
                </span>
              ))}
            </div>
          ) : (
            <Textarea
              id="textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}
          <button
            type="button"
            onClick={() => setText((prev) => stripAllTokens(prev))}
            disabled={usedVars.size === 0}
            className={clsx(
              "ml-auto rounded-lg border px-3 py-2 text-sm",
              usedVars.size === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-100",
            )}
            title={
              usedVars.size === 0
                ? "No variables to remove"
                : "Remove all variables from the text"
            }
          >
            Reset variables
          </button>
        </div>
        <div className="flex flex-col gap-5 mt-6">
          <h3>Nodes</h3>
          {NODES.filter((n) => !usedVars.has(n.variable)).map((node) => (
            <NodeDraggableCard key={node.variable} node={node} />
          ))}
        </div>
        <DragOverlay adjustScale={false} dropAnimation={null}>
          {isDragging ? <Grip /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default App;
