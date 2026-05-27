import { c as createComponent } from './astro-component_DOS8oIPp.mjs';
import 'piccolore';
import { p as renderComponent, t as renderTemplate, o as maybeRenderHead } from './entrypoint_DAI6Gv_1.mjs';
import { u as useAuth, d as db, $ as $$Layout, A as AuthProvider } from './AuthContext_D8WAReGr.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { query, collection, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Sparkles, LogOut, Layout, Play, Trash2, ExternalLink, Layers, Clock } from 'lucide-react';
import 'clsx';

function Dashboard() {
  const { user, signIn, logOut, loading } = useAuth();
  const [guides, setGuides] = useState([]);
  const [fetching, setFetching] = useState(true);
  useEffect(() => {
    if (!user) {
      setGuides([]);
      setFetching(false);
      return;
    }
    const q = query(
      collection(db, "guides"),
      where("userId", "==", user.uid),
      orderBy("created_at", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc2) => ({
        id: doc2.id,
        ...doc2.data()
      }));
      setGuides(data);
      setFetching(false);
    }, (error) => {
      console.error("Error fetching guides:", error);
      setFetching(false);
    });
    return () => unsubscribe();
  }, [user]);
  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this guide?")) return;
    try {
      await deleteDoc(doc(db, "guides", id));
      const token = await user?.getIdToken();
      await fetch(`https://ophelia-gemini-worker.norbertb-consulting.workers.dev/guide/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };
  if (loading) return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-screen", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-ophelia-orange" }) });
  if (!user) return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen p-4 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-ophelia-orange rounded-full shadow-[0_0_30px_rgba(255,122,26,0.5)] mb-8 animate-pulse" }),
    /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold mb-4", children: "Ophelia Studio" }),
    /* @__PURE__ */ jsx("p", { className: "text-gray-400 mb-8 max-w-md text-lg", children: "The professional way to manage and edit your AI-guided tutorials." }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: signIn,
        className: "bg-ophelia-orange hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 shadow-lg",
        children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5" }),
          "Sign in with Google"
        ]
      }
    )
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto p-6 md:p-8", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex justify-between items-center mb-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-ophelia-orange rounded-full shadow-[0_0_15px_rgba(255,122,26,0.3)]" }),
          "My Guides"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-gray-500 mt-1", children: [
          guides.length,
          " tutorials recorded"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-right hidden sm:block", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: user.displayName || user.email }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: "Creator Account" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: logOut,
            className: "p-2 text-gray-500 hover:text-white transition-colors",
            title: "Sign Out",
            children: /* @__PURE__ */ jsx(LogOut, { className: "w-5 h-5" })
          }
        )
      ] })
    ] }),
    fetching ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx("div", { className: "bg-card-bg border border-white/5 rounded-2xl h-48 animate-pulse" }, i)) }) : guides.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-card-bg border border-white/5 rounded-3xl p-12 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(Layout, { className: "w-8 h-8 text-gray-600" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold mb-2", children: "No guides yet" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 mb-8", children: "Start recording tutorials with the Ophelia extension." })
    ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: guides.map((guide) => /* @__PURE__ */ jsxs(
      "a",
      {
        href: `/guide/${guide.id}`,
        className: "group bg-card-bg border border-white/5 rounded-2xl p-5 hover:border-ophelia-orange/30 transition-all hover:translate-y-[-2px] block",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-ophelia-orange/10 transition-colors", children: /* @__PURE__ */ jsx(Play, { className: "w-5 h-5 text-gray-400 group-hover:text-ophelia-orange transition-colors" }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: (e) => handleDelete(e, guide.id),
                className: "p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all",
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg mb-1 truncate", children: guide.title }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-gray-500 text-sm mb-4", children: [
            /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }),
            /* @__PURE__ */ jsx("span", { className: "truncate", children: guide.domain })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-white/5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Layers, { className: "w-3.5 h-3.5" }),
              guide.step_count,
              " steps"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5" }),
              guide.created_at?.toDate ? new Date(guide.created_at.toDate()).toLocaleDateString() : "Just now"
            ] })
          ] })
        ]
      },
      guide.id
    )) })
  ] });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Dashboard" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main> ${renderComponent($$result2, "AuthProvider", AuthProvider, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/context/AuthContext", "client:component-export": "AuthProvider" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Dashboard", Dashboard, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/components/Dashboard", "client:component-export": "default" })} ` })} </main> ` })}`;
}, "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/pages/index.astro", void 0);

const $$file = "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
