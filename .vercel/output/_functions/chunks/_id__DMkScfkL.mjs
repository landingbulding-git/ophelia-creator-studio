import { c as createComponent } from './astro-component_DOS8oIPp.mjs';
import 'piccolore';
import { p as renderComponent, t as renderTemplate, o as maybeRenderHead } from './entrypoint_DAI6Gv_1.mjs';
import { u as useAuth, d as db, $ as $$Layout, A as AuthProvider } from './AuthContext_D8WAReGr.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { memo, useState, useCallback, useEffect } from 'react';
import { Handle, Position, useNodesState, useEdgesState, MarkerType, ReactFlow, Background, Controls, Panel } from '@xyflow/react';
import { HelpCircle, MousePointer2, Eye, Type, ChevronLeft, ExternalLink, Save, Info, X, Trash2, Layers } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';

const StepNode = ({ data, selected }) => {
  const step = data.step;
  const index = data.index;
  const getIcon = (action) => {
    switch (action?.toLowerCase()) {
      case "type":
        return /* @__PURE__ */ jsx(Type, { className: "w-3.5 h-3.5" });
      case "hover":
        return /* @__PURE__ */ jsx(Eye, { className: "w-3.5 h-3.5" });
      default:
        return /* @__PURE__ */ jsx(MousePointer2, { className: "w-3.5 h-3.5" });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: `
      relative group transition-all duration-200
      bg-[#1a1a1a] border rounded-xl overflow-hidden w-52
      ${selected ? "border-ophelia-orange shadow-[0_0_15px_rgba(255,122,26,0.3)] scale-105" : "border-white/10 hover:border-white/20"}
    `, children: [
    /* @__PURE__ */ jsx(Handle, { type: "target", position: Position.Top, className: "!bg-ophelia-orange !border-none !w-2 !h-2" }),
    /* @__PURE__ */ jsxs("div", { className: "aspect-video bg-black/40 relative overflow-hidden flex items-center justify-center border-b border-white/5", children: [
      step.screenshot ? /* @__PURE__ */ jsx(
        "img",
        {
          src: step.screenshot,
          alt: `Step ${index + 1}`,
          className: "w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
        }
      ) : /* @__PURE__ */ jsx(HelpCircle, { className: "w-6 h-6 text-white/10" }),
      /* @__PURE__ */ jsxs("div", { className: "absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10", children: [
        "STEP ",
        index + 1
      ] }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-2 right-2 bg-ophelia-orange text-white p-1 rounded-md shadow-lg", children: getIcon(step.action) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "p-3", children: /* @__PURE__ */ jsx("p", { className: "text-[11px] text-gray-400 line-clamp-2 leading-relaxed", children: step.narration || "No narration provided." }) }),
    /* @__PURE__ */ jsx(Handle, { type: "source", position: Position.Bottom, className: "!bg-ophelia-orange !border-none !w-2 !h-2" })
  ] });
};
const StepNode$1 = memo(StepNode);

const nodeTypes = {
  step: StepNode$1
};
function Editor({ guideId }) {
  const { user } = useAuth();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const fetchGuide = useCallback(async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`https://ophelia-gemini-worker.norbertb-consulting.workers.dev/guide/${guideId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch guide");
      const data = await res.json();
      setGuide(data);
      const initialNodes = data.steps.map((step, i) => ({
        id: `step-${i}`,
        type: "step",
        position: { x: 50, y: i * 250 + 50 },
        data: { step, index: i }
      }));
      const initialEdges = [];
      for (let i = 0; i < data.steps.length - 1; i++) {
        initialEdges.push({
          id: `edge-${i}`,
          source: `step-${i}`,
          target: `step-${i + 1}`,
          animated: true,
          style: { stroke: "#ff7a1a", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#ff7a1a" }
        });
      }
      setNodes(initialNodes);
      setEdges(initialEdges);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [guideId, user, setNodes, setEdges]);
  useEffect(() => {
    if (user) fetchGuide();
  }, [user, fetchGuide]);
  const onNodeClick = (_, node) => {
    setSelectedNode(node);
  };
  const handleUpdateNarration = (newNarration) => {
    if (!selectedNode) return;
    setNodes(
      (nds) => nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              step: { ...node.data.step, narration: newNarration }
            }
          };
        }
        return node;
      })
    );
    setSelectedNode({
      ...selectedNode,
      data: {
        ...selectedNode.data,
        step: { ...selectedNode.data.step, narration: newNarration }
      }
    });
  };
  const handleSave = async () => {
    if (!user || !guide) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const updatedSteps = nodes.sort((a, b) => a.position.y - b.position.y).map((node) => node.data.step);
      const payload = {
        id: guideId,
        name: guide.name,
        steps: updatedSteps,
        updateOnly: true
      };
      const res = await fetch(`https://ophelia-gemini-worker.norbertb-consulting.workers.dev/guide`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Worker update failed");
      await updateDoc(doc(db, "guides", guideId), {
        title: guide.name,
        step_count: updatedSteps.length,
        updated_at: /* @__PURE__ */ new Date()
      });
      alert("Guide saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save guide.");
    } finally {
      setSaving(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-screen bg-[#0a0a0a]", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-ophelia-orange" }) });
  const activeStep = selectedNode?.data.step;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-screen bg-[#0a0a0a]", children: [
    /* @__PURE__ */ jsxs("header", { className: "h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]/80 backdrop-blur-xl z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("a", { href: "/", className: "p-2 hover:bg-white/5 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-5 h-5 text-gray-400" }) }),
        /* @__PURE__ */ jsx("h1", { className: "font-bold text-lg truncate max-w-[200px] sm:max-w-md", children: guide?.name })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => window.open(guide?.pageUrl, "_blank"),
            className: "hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors",
            children: [
              /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4" }),
              "Original Page"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleSave,
            disabled: saving,
            className: "bg-ophelia-orange hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg",
            children: [
              saving ? /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }) : /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
              "Save"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsxs(
        ReactFlow,
        {
          nodes,
          edges,
          onNodesChange,
          onEdgesChange,
          onNodeClick,
          nodeTypes,
          fitView: true,
          className: "bg-[#0c0c0c]",
          children: [
            /* @__PURE__ */ jsx(Background, { color: "#222", gap: 20 }),
            /* @__PURE__ */ jsx(Controls, { className: "!bg-[#1a1a1a] !border-white/10 !fill-white" }),
            /* @__PURE__ */ jsxs(Panel, { position: "top-right", className: "bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 p-3 rounded-xl", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1", children: "Canvas Instructions" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-300 italic text-center", children: "Click a node to edit details." })
            ] })
          ]
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: `
          w-[400px] border-l border-white/5 bg-[#0f0f0f] flex flex-col transition-all duration-300
          ${selectedNode ? "translate-x-0" : "translate-x-full fixed right-0 h-full"}
        `, children: selectedNode ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-white/5 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h2", { className: "font-bold flex items-center gap-2 text-lg", children: [
            /* @__PURE__ */ jsx(Info, { className: "w-4 h-4 text-ophelia-orange" }),
            "Step Details"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setSelectedNode(null), className: "p-2 hover:bg-white/5 rounded-lg", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5 text-gray-500" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-8", children: [
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3", children: "UI Capture" }),
            /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-white/10 overflow-hidden bg-black aspect-video relative group", children: activeStep.screenshot ? /* @__PURE__ */ jsx("img", { src: activeStep.screenshot, className: "w-full h-full object-contain" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-gray-700 italic text-sm", children: "No screenshot captured" }) })
          ] }),
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3", children: "AI Narration" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: activeStep.narration,
                onChange: (e) => handleUpdateNarration(e.target.value),
                className: "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm leading-relaxed focus:border-ophelia-orange/50 outline-none h-32 resize-none transition-colors",
                placeholder: "What should Ophelia say here?"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-600 mt-2 italic", children: "Speak for the ear, not the eye. Keep it warm and direct." })
          ] }),
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3", children: "Interaction" }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-ophelia-orange/10 flex items-center justify-center", children: activeStep.action === "type" ? /* @__PURE__ */ jsx(Type, { className: "w-4 h-4 text-ophelia-orange" }) : /* @__PURE__ */ jsx(MousePointer2, { className: "w-4 h-4 text-ophelia-orange" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-500 font-bold uppercase", children: activeStep.action || "Click" }),
                  /* @__PURE__ */ jsxs("div", { className: "text-xs font-mono text-gray-300", children: [
                    "target: ",
                    activeStep.fingerprint?.tag || "unknown"
                  ] })
                ] })
              ] }),
              activeStep.fingerprint?.aria_label && /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-gray-500 bg-black/40 p-2 rounded-md border border-white/5", children: [
                /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "aria-label:" }),
                " ",
                activeStep.fingerprint.aria_label
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6 border-t border-white/5 bg-black/20", children: /* @__PURE__ */ jsxs(
          "button",
          {
            className: "w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-bold flex items-center justify-center gap-2 transition-all",
            onClick: () => {
              if (confirm("Delete this step?")) {
                setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                setSelectedNode(null);
              }
            },
            children: [
              /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
              "Remove Step"
            ]
          }
        ) })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-600", children: [
        /* @__PURE__ */ jsx(Layers, { className: "w-12 h-12 mb-4 opacity-20" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm italic", children: "Select a node on the canvas to inspect and edit its details." })
      ] }) })
    ] })
  ] });
}

const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  if (!id) {
    return Astro2.redirect("/");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Guide Editor" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main> ${renderComponent($$result2, "AuthProvider", AuthProvider, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/context/AuthContext", "client:component-export": "AuthProvider" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Editor", Editor, { "client:load": true, "guideId": id, "client:component-hydration": "load", "client:component-path": "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/components/Editor", "client:component-export": "default" })} ` })} </main> ` })}`;
}, "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/pages/guide/[id].astro", void 0);

const $$file = "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/pages/guide/[id].astro";
const $$url = "/guide/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
