import { c as createComponent } from './astro-component_D7UjfuKB.mjs';
import 'piccolore';
import { j as addAttribute, q as renderHead, s as renderSlot, t as renderTemplate } from './entrypoint_BfcPdgDB.mjs';
import 'clsx';

const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="description" content="Ophelia Creator Studio"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title} | Ophelia Studio</title>${renderHead()}</head> <body class="bg-[#0a0a0a] text-white selection:bg-[#ff7a1a] selection:text-white"> ${renderSlot($$result, $$slots["default"])}</body></html>`;
}, "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
