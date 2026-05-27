import { c as createComponent } from './astro-component_CpD35ds_.mjs';
import 'piccolore';
import { p as renderComponent, t as renderTemplate, o as maybeRenderHead } from './entrypoint_De9Yjf8S.mjs';
import { $ as $$Layout } from './Layout_DZlZIgcy.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Dashboard" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main> ${renderComponent($$result2, "DashboardApp", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/components/DashboardApp", "client:component-export": "default" })} </main> ` })}`;
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
