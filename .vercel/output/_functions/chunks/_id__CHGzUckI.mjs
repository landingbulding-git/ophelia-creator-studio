import { c as createComponent } from './astro-component_gMKrsvON.mjs';
import 'piccolore';
import { j as addAttribute, q as renderHead, s as renderSlot, t as renderTemplate, p as renderComponent, o as maybeRenderHead } from './entrypoint_C8wGMEuH.mjs';
import 'clsx';

const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="description" content="Ophelia Creator Studio"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title} | Ophelia Studio</title>${renderHead()}</head> <body class="bg-[#0a0a0a] text-white selection:bg-[#ff7a1a] selection:text-white"> ${renderSlot($$result, $$slots["default"])}</body></html>`;
}, "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/layouts/Layout.astro", void 0);

const prerender = false;
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  if (!id) {
    return Astro2.redirect("/");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Guide Editor" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main> ${renderComponent($$result2, "EditorApp", null, { "client:only": "react", "guideId": id, "client:component-hydration": "only", "client:component-path": "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/components/EditorApp", "client:component-export": "default" })} </main> ` })}`;
}, "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/pages/guide/[id].astro", void 0);

const $$file = "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/pages/guide/[id].astro";
const $$url = "/guide/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
