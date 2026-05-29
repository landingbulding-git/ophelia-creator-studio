import { c as createComponent } from './astro-component_D7UjfuKB.mjs';
import 'piccolore';
import { p as renderComponent, t as renderTemplate, o as maybeRenderHead } from './entrypoint_BfcPdgDB.mjs';
import { $ as $$Layout } from './Layout_Cl-meVxd.mjs';

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
