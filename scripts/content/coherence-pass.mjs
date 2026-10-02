#!/usr/bin/env node
// Content coherence pass: gives each page type its own treatment and fixes
// content-level bugs (LeadForm labels, dead anchors, wrong prices/links,
// placeholder copy, mismatched article images).
//
//   node scripts/content/coherence-pass.mjs            # dry run: backup + planned JSON, no writes
//   BUILDER_PRIVATE_KEY=bpk-... node scripts/content/coherence-pass.mjs --apply
//   node scripts/content/coherence-pass.mjs --only=shop,homepage   # subset by step key
//
// Each run fetches fresh entries (drafts included) from the CDN, writes the
// original and planned entry to .content-backups/<timestamp>/, and with
// --apply PATCHes the Write API. Blocks are rebuilt deterministically, so
// re-running is idempotent. Restore an entry by PATCHing its *.original.json
// `data`/`variations` back. Only `data` (and `variations` where an A/B test
// exists) are written: no model schema, targeting, schedule or URL changes.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_BUILDER_API_KEY || "3a593c5220b04d469e25606e2987ebc0";
const PRIVATE_KEY = process.env.BUILDER_PRIVATE_KEY;
const APPLY = process.argv.includes("--apply");
const ONLY = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7).split(",");
const OUT_ARG = process.argv.find((arg) => arg.startsWith("--out="))?.slice(6);
const OUT_DIR = OUT_ARG || path.join(".content-backups", new Date().toISOString().replace(/[:.]/g, "-"));

if (APPLY && !PRIVATE_KEY) {
  console.error("--apply needs BUILDER_PRIVATE_KEY (a bpk- private key for the Fieldnote space).");
  process.exit(1);
}

// ---------------------------------------------------------------- helpers

const el = (id, name, options, children = [], properties) => ({
  "@type": "@builder.io/sdk:Element",
  id: `builder-${id}`,
  component: { name, options },
  children,
  ...(properties ? { properties } : {}),
});
const root = (id, children) => ({ "@type": "@builder.io/sdk:Element", id: `builder-${id}`, tagName: "div", children });
const container = (id, opts, children) => el(id, "Container", opts, children);
const productRef = (id) => ({ product: { "@type": "@builder.io/core:Reference", id, model: "product" } });
const unsplash = (id) => `https://images.unsplash.com/photo-${id}?w=1600&q=80&auto=format&fit=crop`;
const asset = (id) => `https://cdn.builder.io/api/v1/image/assets%2F3a593c5220b04d469e25606e2987ebc0%2F${id}`;
const pexels = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

const pixelBlocks = (blocks) => (blocks ?? []).filter((b) => b.tagName === "img" && b.id?.startsWith("builder-pixel"));

function walk(blocks, fn) {
  for (const block of blocks ?? []) {
    fn(block);
    walk(block.children, fn);
  }
}

function findComponent(blocks, name) {
  let found;
  walk(blocks, (b) => {
    if (!found && b.component?.name === name) found = b;
  });
  return found;
}

const clone = (value) => JSON.parse(JSON.stringify(value));

// ----------------------------------------------------------------- assets

const IMG = {
  categoryJackets: pexels(13831839),
  categoryPacks: asset("82e54002ba2b4ebab1af0f449a05d87c"),
  categoryFootwear: asset("5d69f887e3d143cf83b8bf3c40145f23"),
  categoryLayers: asset("c6d672cecbb643a3aa4949d1fdefc6c9"),
  categoryAccessories: asset("d082629a6809460c91f75ef0c206d918"),
  categoryCamp: asset("1d07ba4c33a041a2b75d8f736291917b"),
  campfire: unsplash("1478131143081-80f7f84ca84d"),
  valleyHiker: unsplash("1501555088652-021faa106b9b"),
  fieldJournal: unsplash("1452421822248-d4c2b47f0c81"),
  patternTable: unsplash("1581092160562-40aa08e78837"),
  repairBench: unsplash("1530124566582-a618bc2615dc"),
  repairSupplies: unsplash("1597484661643-2f5fef640dd1"),
  forestAerial: unsplash("1473773508845-188df298d2d1"),
  teamLoft: unsplash("1556761175-5973dc0f32e7"),
  lakeOverlook: unsplash("1465311440653-ba9b1d9b0f5b"),
  guidesTrail: unsplash("1551632811-561732d1e306"),
  storeInterior: unsplash("1441986300917-64674bd600d8"),
  courier: unsplash("1612630741022-b29ec17d013d"),
  lakeTent: unsplash("1508873696983-2dfd5898f08b"),
  overcastShell: pexels(35746663),
  woolHoodie: asset("bb39377c52c4482e8d6c72f283147f93"),
};

const SHOP_TILES = [
  { label: "Jackets & Shells", description: "Rain shells, down parkas and softshells.", image: IMG.categoryJackets, imageAlt: "A hiker in a green waterproof shell with the hood up", href: "/shop/jackets" },
  { label: "Packs & Bags", description: "Daypacks, travel duffels and expedition packs.", image: IMG.categoryPacks, imageAlt: "A hiker carrying an orange trekking pack on a forest trail", href: "/shop/packs" },
  { label: "Footwear", description: "Hiking boots, trail runners and camp shoes.", image: IMG.categoryFootwear, imageAlt: "Leather hiking boots on a grassy trail", href: "/shop/footwear" },
  { label: "Layering", description: "Merino base layers, fleece and insulation.", image: IMG.categoryLayers, imageAlt: "A hiker in a yellow puffy jacket in a golden meadow", href: "/shop/layers" },
  { label: "Accessories", description: "Hats, socks, gaiters and the small stuff.", image: IMG.categoryAccessories, imageAlt: "A merino beanie and sunglasses resting on a tree stump", href: "/shop/accessories" },
  { label: "Camp & Travel", description: "Tents, sleeping bags and cook sets.", image: IMG.categoryCamp, imageAlt: "Backpacking tents pitched on a rocky clearing", href: "/shop/camp-travel" },
];

// Best Seller / New / Limited mix across six categories.
const EDITORS_PICKS = [
  "06731601bffa45f4892c4b5ad13c726c", // Cascade 3L Shell (Best Seller)
  "73724c90fad04bc9ba6047d6bfcfc705", // Fieldweight Anorak (New)
  "af6bdbf9135f4d759659725e107c536d", // Longhaul 45L Pack (Best Seller)
  "e3c0d3947b9b4d779d0c7b4efea23d1c", // Ridgeline Down Parka (Limited)
  "24b4915c750447b1bf64128e4bc6242f", // Lightweight Puffy Layer (New)
  "9cf51cb6c59943d988f0ed56d7333581", // Traverse Mid GTX (Best Seller)
  "56efdd3a4e0d495fbb814b533b2a9e34", // Transit Duffel 60L (New)
  "1e6b997bf5794e2caf5a17f36593ab0e", // Nightfall 20° Bag (Limited)
].map(productRef);

const SERVICE_CARDS = [
  { icon: "truck", title: "Free shipping over $75", description: "Standard delivery in 3–5 business days, or expedited at checkout for trip-week orders." },
  { icon: "tag", title: "30-day returns", description: "Unworn gear back within 30 days for a full refund, no questions asked.", linkLabel: "Shipping & returns", linkHref: "/help/shipping-returns" },
  { icon: "shield", title: "Repairs for life", description: "Rips, zippers, seams: we fix them free for as long as you own the piece.", linkLabel: "How repairs work", linkHref: "/help/repair-guarantee" },
];

const FICTIONAL_NOTE = {
  heading: "About this site",
  body: "<p>Fieldnote Outfitters is a fictional brand created to demonstrate Builder.io. No real orders are processed and no personal information is collected through this site.</p>",
};

const STORES = [
  { name: "Fieldnote Portland", region: "United States", address: "1420 NW Everett St", city: "Portland, OR 97209", hours: "Mon–Sat 10am–7pm · Sun 11am–6pm", phone: "(503) 555-0142", flagship: true },
  { name: "Fieldnote Seattle", region: "United States", address: "2201 Western Ave", city: "Seattle, WA 98121", hours: "Mon–Sat 10am–7pm · Sun 11am–6pm", phone: "(206) 555-0178" },
  { name: "Fieldnote Denver", region: "United States", address: "1550 Platte St", city: "Denver, CO 80202", hours: "Mon–Sat 10am–7pm · Sun 11am–6pm", phone: "(303) 555-0119" },
  { name: "Fieldnote Austin", region: "United States", address: "1100 S Lamar Blvd", city: "Austin, TX 78704", hours: "Mon–Sat 10am–7pm · Sun 11am–6pm", phone: "(512) 555-0187" },
  { name: "Fieldnote Boston", region: "United States", address: "290 Newbury St", city: "Boston, MA 02115", hours: "Mon–Sat 10am–7pm · Sun 11am–6pm", phone: "(617) 555-0163" },
  { name: "Fieldnote Vancouver", region: "Canada", address: "1055 W Georgia St", city: "Vancouver, BC", hours: "Mon–Sat 10am–7pm · Sun 11am–6pm", phone: "(604) 555-0134" },
  { name: "Fieldnote Montréal", region: "Canada", address: "1250 Rue Sainte-Catherine O", city: "Montréal, QC", hours: "Mon–Sat 10am–7pm · Sun 11am–6pm", phone: "(514) 555-0155" },
  { name: "Fieldnote London", region: "Europe", address: "42 Carnaby St", city: "London, UK", hours: "Mon–Sat 10am–7pm · Sun 11am–5pm", phone: "+44 20 7946 0142" },
  { name: "Fieldnote Manchester", region: "Europe", address: "18 St Ann's Square", city: "Manchester, UK", hours: "Mon–Sat 10am–7pm · Sun 11am–5pm", phone: "+44 161 496 0178" },
  { name: "Fieldnote Paris", region: "Europe", address: "45 Rue de Rivoli", city: "Paris, France", hours: "Mon–Sat 10am–7pm", phone: "+33 1 42 55 01 42" },
  { name: "Fieldnote Berlin", region: "Europe", address: "Kurfürstendamm 200", city: "Berlin, Germany", hours: "Mon–Sat 10am–7pm", phone: "+49 30 5550 142" },
  { name: "Fieldnote Munich", region: "Europe", address: "Kaufingerstraße 15", city: "Munich, Germany", hours: "Mon–Sat 10am–7pm", phone: "+49 89 5550 187" },
  { name: "Fieldnote Tokyo", region: "Asia & Middle East", address: "5-1-2 Jingumae, Shibuya", city: "Tokyo, Japan", hours: "Daily 11am–8pm", phone: "+81 3 5550 1420" },
  { name: "Fieldnote Dubai", region: "Asia & Middle East", address: "Dubai Mall, Fashion Avenue", city: "Dubai, UAE", hours: "Sat–Thu 10am–10pm · Fri 2pm–10pm", phone: "+971 4 555 0142" },
];

const CARD_DISCLOSURE = { "@type": "@builder.io/core:Reference", id: "ee98af4ceed9499ba38e41f5a26ce705", model: "disclosure" };

// ------------------------------------------------------------- page blocks

function shopBlocks() {
  return [
    el("shop-hero", "Hero", {
      variant: "text",
      eyebrow: "Shop",
      heading: "Gear for the trip you're actually taking",
      subheading: "Start with a category, or see what our team is packing this season.",
    }),
    el("shop-categories", "CategoryTiles", { heading: "Shop by category", columns: "3", tiles: SHOP_TILES }),
    container("shop-picks-band", { width: "default", padding: "md", background: "surfaceAlt" }, [
      el("shop-grid", "ProductGrid", {
        source: "builder",
        columns: "4",
        heading: "Editor's picks",
        subheading: "Best sellers, new arrivals and limited runs our guides keep reaching for.",
        linkLabel: "Shop new arrivals",
        linkHref: "/shop/new",
        products: EDITORS_PICKS,
      }),
    ]),
    el("shop-services", "FeatureCards", { heading: "Every order includes", columns: "3", cards: SERVICE_CARDS }),
  ];
}

function homepageBodyBlocks(existingGrid, suffix = "") {
  return [
    el(`homepage-categories${suffix}`, "CategoryTiles", {
      heading: "Shop by category",
      columns: "3",
      linkLabel: "All categories",
      linkHref: "/shop",
      tiles: SHOP_TILES.slice(0, 3),
    }),
    el(`homepage-productgrid${suffix}`, "ProductGrid", {
      source: "builder",
      columns: "4",
      heading: "Field-tested favorites",
      subheading: "The pieces our guides reach for first, season after season.",
      linkLabel: "Shop new arrivals",
      linkHref: "/shop/new",
      products: existingGrid?.component?.options?.products ?? EDITORS_PICKS,
    }),
    container(`homepage-story-band${suffix}`, { width: "default", padding: "md", background: "primary" }, [
      el(`homepage-story${suffix}`, "MediaText", {
        eyebrow: "Field-tested, not lab-tested",
        heading: "Every product spends a season with our guides first",
        body: "<p>Before anything gets a SKU, it goes out with the working guides who started this company: wet shoulder seasons, ten-day traverses, gear packed away soaked and pulled out again at dawn. What fails gets redesigned. What survives ships to you.</p>",
        image: IMG.valleyHiker,
        imageAlt: "A hiker with a yellow pack walking into a green mountain valley",
        imagePosition: "right",
        linkLabel: "Read our story",
        linkHref: "/about-fieldnote",
      }),
    ]),
  ];
}

function legalBlocks(prefix, heading, intro, sections) {
  return [
    root(`${prefix}-root`, [
      el(`${prefix}-hero`, "Hero", { variant: "minimal", eyebrow: "Legal", heading, subheading: "Last updated January 15, 2026" }),
      el(`${prefix}-document`, "PolicyDocument", { intro, sections, showToc: true }),
    ]),
  ];
}

const TERMS_SECTIONS = [
  { heading: "Agreement to these terms", body: "<p>These terms govern your use of fieldnote-outfitters.com, our retail stores, and any purchase you make from Fieldnote Outfitters, Inc. (\"Fieldnote\", \"we\"). By using the site or placing an order, you agree to them.</p>" },
  { heading: "Using our site", body: "<p>Use the site for lawful, personal shopping purposes only. Don't attempt to disrupt the site, access accounts that aren't yours, or scrape content or pricing at scale.</p>" },
  { heading: "Orders and pricing", body: "<p>Prices are listed in USD unless otherwise noted and may change without notice. An order is accepted when it ships, not when you receive a confirmation email. If a price or availability error affects your order, we'll contact you before charging you, and you can cancel at no cost.</p>" },
  { heading: "Shipping, returns and exchanges", body: "<p>Shipping times, costs, and our 30-day return window are described on our <a href=\"/help/shipping-returns\">Shipping &amp; Returns</a> page, which forms part of these terms.</p>" },
  { heading: "Lifetime repair guarantee", body: "<p>Fieldnote products are covered by free repairs for damage from normal use for as long as you own them. Coverage, exclusions, and how to start a claim are on our <a href=\"/help/repair-guarantee\">Repair Guarantee</a> page.</p>" },
  { heading: "Fieldnote Pro accounts", body: "<p>Trade pricing for <a href=\"/pro\">Fieldnote Pro</a> members is for verified business use and may not be resold. We may suspend Pro pricing on accounts that don't meet the program's eligibility requirements.</p>" },
  { heading: "Intellectual property", body: "<p>Product designs, photography, and copy on this site belong to Fieldnote or our licensors. You may share links and screenshots for personal, non-commercial use.</p>" },
  { heading: "Limitation of liability", body: "<p>To the extent permitted by law, Fieldnote isn't liable for indirect or consequential damages arising from your use of our products or this site. Nothing in these terms limits rights you have under consumer protection law.</p>" },
  { heading: "Changes and contact", body: "<p>We'll post updates here and change the date above. Questions? Email <a href=\"mailto:legal@fieldnote-outfitters.com\">legal@fieldnote-outfitters.com</a>.</p>" },
  FICTIONAL_NOTE,
];

const PRIVACY_SECTIONS = [
  { heading: "Information we collect", body: "<p>What you give us (name, email, shipping address, order details, and anything you send support), and what's generated as you use the site (pages viewed, device and browser type, and approximate location from your IP address).</p>" },
  { heading: "How we use it", body: "<ul><li>To process orders, returns, and repairs</li><li>To answer support requests</li><li>To improve the site and the gear we make</li><li>To send marketing email, only if you opt in</li></ul>" },
  { heading: "Cookies and analytics", body: "<p>We use essential cookies to keep the site working and analytics cookies to understand which pages help people find the right gear. You can block non-essential cookies in your browser without affecting checkout.</p>" },
  { heading: "Who we share it with", body: "<p>Only the service providers that help us run the business (payment processing, shipping carriers, email delivery), under contracts that limit how they use your data. We don't sell your personal information.</p>" },
  { heading: "Your choices and rights", body: "<p>You can request a copy of your data, ask us to correct or delete it, or unsubscribe from marketing at any time. Email <a href=\"mailto:privacy@fieldnote-outfitters.com\">privacy@fieldnote-outfitters.com</a> and we'll respond within 30 days.</p>" },
  { heading: "How long we keep it", body: "<p>Order records are kept for seven years for tax and warranty purposes. Everything else is deleted or anonymized when it's no longer needed.</p>" },
  FICTIONAL_NOTE,
];

const ACCESSIBILITY_SECTIONS = [
  { heading: "Our commitment", body: "<p>Everyone should be able to research, choose, and buy gear on fieldnote-outfitters.com, including people who use screen readers, keyboard navigation, magnification, or voice control.</p>" },
  { heading: "The standard we work to", body: "<p>We aim to meet WCAG 2.1 Level AA across the site. New pages and components are checked for color contrast, keyboard access, and screen reader labels before they launch.</p>" },
  { heading: "Known limitations", body: "<p>Some older product photography lacks detailed alt text, and a few third-party embeds (such as map links) aren't fully under our control. We're working through both.</p>" },
  { heading: "Tell us about a barrier", body: "<p>If something on the site doesn't work for you, email <a href=\"mailto:access@fieldnote-outfitters.com\">access@fieldnote-outfitters.com</a> with the page URL and what happened. We'll reply within two business days, and our <a href=\"/stores\">store teams</a> can also help you complete an order.</p>" },
];

function ourStoryBlocks() {
  return [
    root("about-root", [
      el("about-hero", "Hero", {
        variant: "image",
        eyebrow: "Our Story",
        heading: "Gear built by people who actually use it",
        subheading: "Fieldnote started with a single guide's rain shell that wouldn't quit, and a hunch that most outdoor gear was built for a catalog photo, not a real trip.",
        heroImage: IMG.campfire,
        heroImageAlt: "A group of hikers gathered around a campfire in the woods at dusk",
      }),
      el("about-origin", "MediaText", {
        eyebrow: "How it started",
        heading: "One rain shell that wouldn't quit",
        body: "<p>In 2014, four backcountry guides in Portland were replacing their rain shells every season. One of them, patched, re-taped, and on its fifth year, was still outlasting everything new on the shelf.</p><p>So they started making gear the way that shell was made: simple patterns, overbuilt seams, and parts you can replace. Every product still spends a full season with working guides before it gets a SKU.</p>",
        image: IMG.fieldJournal,
        imageAlt: "A field journal, map, and camera laid out on a table",
        imagePosition: "right",
      }),
      container("about-stats-band", { width: "default", padding: "md", background: "primary" }, [
        el("about-stats", "StatBand", {
          heading: "Fieldnote by the numbers",
          stats: [
            { value: "2014", label: "Founded by four backcountry guides in Portland, Oregon" },
            { value: "1 season", label: "Of guide field-testing before anything gets a SKU" },
            { value: "4,000+", label: "Pieces repaired free at our Portland bench last year" },
            { value: "14", label: "Stores across seven countries" },
          ],
        }),
      ]),
      el("about-craft", "MediaText", {
        eyebrow: "How we build",
        heading: "Designed at the pattern table, proven on the trail",
        body: "<p>Our design team works three floors above the repair bench. Every repair that comes in is logged against its pattern, so the seam that fails this year is the seam that gets redesigned next year.</p>",
        image: IMG.patternTable,
        imageAlt: "A designer sketching technical drawings at a worktable",
        imagePosition: "left",
        linkLabel: "How we test every shell",
        linkHref: "/blog/how-we-test-every-shell",
      }),
      container("about-quote-band", { width: "default", padding: "md", background: "sand" }, [
        el("about-quote", "PullQuote", {
          quote: "If a jacket can't survive a season with our guides, it has no business on a shelf with our name on it.",
          attribution: "Dana Whitcomb",
          role: "Co-founder, Fieldnote",
        }),
      ]),
      el("about-explore", "FeatureCards", {
        heading: "Keep exploring",
        columns: "3",
        cards: [
          { icon: "leaf", title: "Sustainability", description: "Why a lifetime repair guarantee is our biggest environmental lever.", linkLabel: "Read more", linkHref: "/sustainability" },
          { icon: "compass", title: "Careers", description: "Small teams, real trips, and five paid field days a year.", linkLabel: "See open roles", linkHref: "/careers" },
          { icon: "mountain", title: "Visit a store", description: "Expert fitting and a guide on staff at all 14 locations.", linkLabel: "Find a store", linkHref: "/stores" },
        ],
      }),
    ]),
  ];
}

function sustainabilityBlocks(existingCards) {
  return [
    root("sustain-root", [
      el("sustain-hero", "Hero", {
        variant: "image",
        eyebrow: "Sustainability",
        heading: "The most sustainable jacket is the one you don't replace",
        subheading: "Our lifetime repair guarantee isn't a marketing line. It's our biggest sustainability lever, and it's backed by real numbers.",
        heroImage: IMG.forestAerial,
        heroImageAlt: "An aerial view looking straight down into a dense evergreen forest",
      }),
      container("sustain-stats-band", { width: "default", padding: "md", background: "primary" }, [
        el("sustain-stats", "StatBand", {
          stats: [
            { value: "4,000+", label: "Pieces repaired free last year instead of replaced" },
            { value: "18 days", label: "Average repair turnaround, door to door" },
            { value: "Every shell", label: "Built with replaceable zipper pulls, buckles and cord locks" },
          ],
        }),
      ]),
      el("sustain-focus", "FeatureCards", { heading: "Where we focus", columns: "3", cards: existingCards }),
      container("sustain-bench-band", { width: "default", padding: "md", background: "surfaceAlt" }, [
        el("sustain-bench", "MediaText", {
          eyebrow: "The repair bench",
          heading: "Every repair starts at our Portland bench",
          body: "<p>Torn shells, blown zippers, delaminated seams: our technicians fix them free, for as long as you own the piece. No receipt needed. Ship it in or drop it at any store.</p><p>Each repair is logged against the product's pattern, so the weak points we see most get engineered out of the next version.</p>",
          image: IMG.repairBench,
          imageAlt: "Hand tools hanging on a repair workshop wall",
          imagePosition: "right",
          linkLabel: "How the repair guarantee works",
          linkHref: "/help/repair-guarantee",
        }),
      ]),
      container("sustain-note-container", { width: "narrow", padding: "md", background: "surface" }, [
        el("sustain-note", "RichText", {
          width: "default",
          content: "<h2>What we won't claim</h2><p>We don't have a perfect supply chain, and we're wary of over-claiming. What we do have is a business model that rewards making gear last: a repair guarantee that costs us real money when it's used, so we're incentivized to build things that don't need it often.</p><p>Read more in <a href=\"/blog/repair-instead-of-replace\">The Case for Repairing Gear Instead of Replacing It</a>.</p>",
        }),
      ]),
    ]),
  ];
}

const ROLES = [
  {
    question: "Senior Product Designer, Outerwear · Portland, OR · Hybrid",
    answer: "<p>Own the next generation of our shell and insulation lines, from first pattern to production, working directly with the repair bench data that tells us where gear fails. 6+ years in technical apparel design.</p>",
  },
  {
    question: "Repair Technician · Portland, OR · On-site",
    answer: "<p>Diagnose and fix returned gear on our Portland bench: seam taping, zipper replacement, patching, and down baffle repair. Industrial sewing experience required; we'll teach you the rest.</p>",
  },
  {
    question: "Store Lead · Denver, CO",
    answer: "<p>Run a team of eight, host guide-led clinics, and keep the fitting room the best part of the visit. Retail leadership experience and a genuine love of time outside.</p>",
  },
  {
    question: "Frontend Engineer, Ecommerce · Remote (US)",
    answer: "<p>Build the storefront our customers and content team use every day, with Next.js, TypeScript, and a headless CMS. 4+ years building production React applications.</p>",
  },
  {
    question: "Seasonal Store Associate · London, UK",
    answer: "<p>Help customers find the right fit through our busiest season, November through February. No outdoor industry experience required, just curiosity and patience.</p>",
  },
].map((role) => ({
  ...role,
  answer: `${role.answer}<p>To apply, email <a href="mailto:careers@fieldnote-outfitters.com">careers@fieldnote-outfitters.com</a> with the role in the subject line.</p>`,
}));

function careersBlocks() {
  return [
    root("careers-root", [
      el("careers-hero", "Hero", {
        variant: "image",
        eyebrow: "Careers",
        heading: "Work on gear people actually rely on",
        subheading: "A small, growing team across design, retail, and operations, based in Portland with store teams in seven countries.",
        heroImage: IMG.teamLoft,
        heroImageAlt: "A team meeting in a bright loft office with brick walls",
      }),
      el("careers-culture", "MediaText", {
        eyebrow: "How we work",
        heading: "Small teams, real trips",
        body: "<p>Our design and operations teams work out of Portland on a hybrid schedule. Our store teams are people who actually use the gear they sell.</p><p>Everyone, from the repair bench to engineering, gets five paid field days a year to test gear on a trip of their choosing, and reports back on what broke.</p>",
        image: IMG.lakeOverlook,
        imageAlt: "A hiker resting on a rocky outcrop above an alpine lake",
        imagePosition: "right",
      }),
      container("careers-benefits-band", { width: "default", padding: "md", background: "surfaceAlt" }, [
        el("careers-benefits", "FeatureCards", {
          heading: "Benefits",
          columns: "4",
          cards: [
            { icon: "compass", title: "Five paid field days", description: "Every year, on top of vacation, to test gear on a trip you choose." },
            { icon: "tag", title: "$1,000 gear allowance", description: "Annually, plus 50% off everything we make." },
            { icon: "shield", title: "Full health coverage", description: "Medical, dental, and vision for you and your dependents." },
            { icon: "leaf", title: "16 weeks parental leave", description: "Fully paid, for every parent, however your family grows." },
          ],
        }),
      ]),
      container("careers-roles-container", { width: "narrow", padding: "md", background: "surface" }, [
        el("careers-roles", "Accordion", { heading: "Open roles", behavior: "single", items: ROLES }),
      ]),
      container("careers-quote-band", { width: "default", padding: "md", background: "sand" }, [
        el("careers-quote", "PullQuote", {
          quote: "I came for the field days. I stayed because the repair data actually changes what we design.",
          attribution: "Priya Anand",
          role: "Product Designer, Packs",
        }),
      ]),
    ]),
  ];
}

function helpBlocks(hero, suffix = "") {
  return [
    root(`help2-root${suffix}`, [
      el(`help2-hero${suffix}`, "Hero", hero),
      container(`help2-search-section${suffix}`, { width: "narrow", padding: "sm", background: "surface" }, [
        el(`help2-search${suffix}`, "SearchBox", { scope: "help" }),
      ]),
      container(`help2-articles-section${suffix}`, { width: "default", padding: "md", background: "surface" }, [
        el(`help2-articles${suffix}`, "ArticleList", { source: "surface", surface: "help", heading: "Popular help topics", columns: "4" }),
      ]),
      container(`help2-contact-section${suffix}`, { width: "default", padding: "md", background: "surfaceAlt" }, [
        el(`help2-contact${suffix}`, "FeatureCards", {
          heading: "Still need a hand?",
          columns: "3",
          cards: [
            { icon: "compass", title: "Email support", description: "A real person replies within one business day, usually much sooner.", linkLabel: "support@fieldnote-outfitters.com", linkHref: "mailto:support@fieldnote-outfitters.com" },
            { icon: "shield", title: "Call us", description: "Mon–Fri 7am–6pm PT. Ask for a gear specialist for sizing and fit.", linkLabel: "1-800-555-0199", linkHref: "tel:18005550199" },
            { icon: "mountain", title: "Visit a store", description: "Returns, repairs drop-off, and expert fitting at all 14 locations.", linkLabel: "Find a store", linkHref: "/stores" },
          ],
        }),
      ]),
    ]),
  ];
}

function storesBlocks(hero, suffix = "") {
  return [
    root(`stores2-root${suffix}`, [
      el(`stores2-hero${suffix}`, "Hero", hero),
      el(
        `stores2-list${suffix}`,
        "StoreList",
        {
          heading: "14 stores, seven countries",
          subheading: "Every location has expert fitting, a repair drop-off counter, and a guide on staff.",
          stores: STORES,
        },
        [],
        { id: "store-list" },
      ),
      container(`stores2-services-band${suffix}`, { width: "default", padding: "md", background: "surfaceAlt" }, [
        el(`stores2-services${suffix}`, "FeatureCards", {
          heading: "In every store",
          columns: "3",
          cards: [
            { icon: "compass", title: "Expert fitting", description: "Bring the pack you have and the trip you're planning. We'll fit both." },
            { icon: "shield", title: "Repair drop-off", description: "Leave damaged gear at the counter. No receipt needed, ever.", linkLabel: "Repair guarantee", linkHref: "/help/repair-guarantee" },
            { icon: "mountain", title: "Guide-led clinics", description: "Free monthly evenings on layering, navigation, and trip planning." },
          ],
        }),
      ]),
    ]),
  ];
}

function cardRateBlocks() {
  return [
    root("rate-root", [
      el("rate-hero", "Hero", {
        variant: "text",
        eyebrow: "Fieldnote Card",
        heading: "Check your rate in about a minute",
        subheading: "See the APR you'd qualify for. Checking has no impact on your credit score.",
      }),
      container("rate-form-container", { width: "narrow", padding: "md", background: "surface" }, [
        el(
          "rate-form",
          "LeadForm",
          {
            heading: "Check your rate",
            subheading: "Tell us where to send your personalized offer.",
            ctaLabel: "Check my rate",
            messagePlaceholder: "Anything we should know?",
            successMessage: "We'll email your personalized rate offer within one business day. Checking your rate doesn't affect your credit score.",
          },
          [],
          { id: "apply" },
        ),
      ]),
      container("rate-disclosure-container", { width: "narrow", padding: "md", background: "surfaceAlt" }, [
        el("rate-disclosure", "Disclosure", { disclosure: CARD_DISCLOSURE, collapsed: false, label: "Rates, fees, and terms" }),
      ]),
    ]),
  ];
}

function cartBlocks(existing) {
  const blocks = clone(existing);
  const hero = findComponent(blocks, "Hero");
  Object.assign(hero.component.options, {
    variant: "text",
    eyebrow: "Cart",
    heading: "Your cart is empty",
    subheading: "Find something worth packing. A few favorites to start with:",
    ctaLabel: "Start shopping",
    ctaHref: "/shop",
  });
  return blocks;
}

function accountBlocks(existing) {
  const blocks = clone(existing);
  const hero = findComponent(blocks, "Hero");
  Object.assign(hero.component.options, {
    variant: "text",
    eyebrow: "Account",
    heading: "Your Fieldnote account",
    subheading: "Order history, saved addresses, and Pro pricing in one place.",
  });
  const body = findComponent(blocks, "RichText");
  body.component.options.content =
    "<p>Online accounts are launching later this season. Until then, everything you need is a click away:</p><ul><li><a href=\"/help/tracking-your-order\">Track an order</a> with the link in your shipping email</li><li><a href=\"/help/shipping-returns\">Start a return or exchange</a> within 30 days</li><li><a href=\"/help/repair-guarantee\">Request a free repair</a>, no receipt required</li><li><a href=\"/pro\">Apply for Fieldnote Pro</a> trade pricing</li></ul>";
  return blocks;
}

// LeadForm on campaign pages: content used `submitLabel` (never a LeadForm
// input) and an `id` option (never applied); move both to what renders.
function fixLeadForms(blocks, { ctaLabel, successMessage, messagePlaceholder, anchor }) {
  const next = clone(blocks);
  walk(next, (b) => {
    if (b.component?.name !== "LeadForm") return;
    const opts = b.component.options;
    const id = anchor ?? opts.id;
    opts.ctaLabel = ctaLabel ?? opts.submitLabel ?? opts.ctaLabel;
    delete opts.submitLabel;
    delete opts.id;
    if (successMessage) opts.successMessage = successMessage;
    if (messagePlaceholder) opts.messagePlaceholder = messagePlaceholder;
    if (id) b.properties = { ...(b.properties ?? {}), id };
  });
  return next;
}

function moveOptionIdToProperties(blocks, componentName) {
  walk(blocks, (b) => {
    if (b.component?.name !== componentName || !b.component.options.id) return;
    b.properties = { ...(b.properties ?? {}), id: b.component.options.id };
    delete b.component.options.id;
  });
  return blocks;
}

const PRO_SUCCESS = "A Fieldnote Pro specialist will verify your business and activate trade pricing within 2 business days.";
const PRO_PLACEHOLDER = "Tell us about your team size and what you're outfitting for.";

// ------------------------------------------------------------------ steps

const STEPS = [
  {
    key: "shop",
    model: "page",
    id: "0e0d7bc8a11141cf82ae3716eeeffcec",
    label: "Shop hub: category tiles + 8 curated picks instead of the 48-item dump",
    plan: (e) => ({ data: { ...e.data, blocks: [root("shop-root", shopBlocks()), ...pixelBlocks(e.data.blocks)] } }),
  },
  {
    key: "homepage",
    model: "homepage",
    id: "0af76f7c14314297be15e1f02291593e",
    label: "Homepage: category tiles, curated favorites, editorial band (+ A/B variation hero fix)",
    plan: (e) => {
      const hero = findComponent(e.data.blocks, "Hero");
      const grid = findComponent(e.data.blocks, "ProductGrid");
      const features = findComponent(e.data.blocks, "FeatureCards");
      const testimonials = findComponent(e.data.blocks, "Testimonials");
      const main = [hero, ...homepageBodyBlocks(grid), features, testimonials, ...pixelBlocks(e.data.blocks)];
      const patch = { data: { ...e.data, blocks: main } };

      const variations = clone(e.variations ?? {});
      for (const variation of Object.values(variations)) {
        const vHero = findComponent(variation.data?.blocks, "Hero");
        if (!vHero) continue;
        // The variation advertised "$249" for a $389 product and linked to
        // /product/... (404). Same test (hero only), correct facts.
        Object.assign(vHero.component.options, {
          eyebrow: "Featured product",
          heading: "The Cascade 3L Shell",
          subheading: "Our best-selling waterproof shell: fully seam-sealed and field-tested through three wet seasons.",
          ctaLabel: "Shop the Cascade 3L",
          ctaHref: "/products/cascade-3l-shell",
        });
        variation.data.blocks = [vHero, ...homepageBodyBlocks(grid, "-v"), features, testimonials, ...pixelBlocks(variation.data.blocks)];
      }
      if (Object.keys(variations).length) patch.variations = variations;
      return patch;
    },
  },
  {
    key: "terms",
    model: "page",
    id: "7873c2c4d270442facd9611a69985919",
    label: "Terms of Service: minimal header + sectioned document with table of contents",
    plan: (e) => ({
      data: {
        ...e.data,
        blocks: [
          ...legalBlocks("terms", "Terms of Service", "<p>The short version: buy gear, use it hard, and if it breaks from normal use, we'll fix it. The details are below.</p>", TERMS_SECTIONS),
          ...pixelBlocks(e.data.blocks),
        ],
      },
    }),
  },
  {
    key: "privacy",
    model: "page",
    id: "df26998a1b19497380a49ae9a9f8f829",
    label: "Privacy Policy: minimal header + sectioned document",
    plan: (e) => ({
      data: {
        ...e.data,
        blocks: [
          ...legalBlocks("privacy", "Privacy Policy", "<p>We collect what we need to get gear to you and keep it working, and nothing we'd be uncomfortable explaining.</p>", PRIVACY_SECTIONS),
          ...pixelBlocks(e.data.blocks),
        ],
      },
    }),
  },
  {
    key: "accessibility",
    model: "page",
    id: "48f256e99f7748799e206577d3de3340",
    label: "Accessibility: minimal header + sectioned document",
    plan: (e) => ({
      data: { ...e.data, blocks: [...legalBlocks("a11y", "Accessibility", "", ACCESSIBILITY_SECTIONS), ...pixelBlocks(e.data.blocks)] },
    }),
  },
  {
    key: "our-story",
    model: "page",
    id: "92c1519038e24484b73ca2835d2ef599",
    label: "Our Story: editorial narrative (story splits, stats, pull quote)",
    plan: (e) => ({ data: { ...e.data, blocks: [...ourStoryBlocks(), ...pixelBlocks(e.data.blocks)] } }),
  },
  {
    key: "sustainability",
    model: "page",
    id: "4d5d07d6f0814ef79d1a8a8f7754546d",
    label: "Sustainability: image hero, stats, repair-bench story",
    plan: (e) => {
      const cards = findComponent(e.data.blocks, "FeatureCards")?.component.options.cards;
      return { data: { ...e.data, blocks: [...sustainabilityBlocks(cards), ...pixelBlocks(e.data.blocks)] } };
    },
  },
  {
    key: "careers",
    model: "page",
    id: "b4a378dd23fe4007967efeb1d14d10b9",
    label: "Careers: replace placeholder copy with culture, benefits and open roles",
    plan: (e) => ({ data: { ...e.data, blocks: [...careersBlocks(), ...pixelBlocks(e.data.blocks)] } }),
  },
  {
    key: "help",
    model: "page",
    id: "552d074a178541439a890d168b832eb8",
    label: "Help Center: help-scoped search, 4-up topics, contact options (+ variation)",
    plan: (e) => {
      const hero = { ...findComponent(e.data.blocks, "Hero").component.options };
      const patch = { data: { ...e.data, blocks: [...helpBlocks(hero), ...pixelBlocks(e.data.blocks)] } };
      const variations = clone(e.variations ?? {});
      for (const variation of Object.values(variations)) {
        const vHero = findComponent(variation.data?.blocks, "Hero");
        if (!vHero) continue;
        variation.data.blocks = [...helpBlocks({ ...vHero.component.options }, "-v"), ...pixelBlocks(variation.data.blocks)];
      }
      if (Object.keys(variations).length) patch.variations = variations;
      return patch;
    },
  },
  {
    key: "stores",
    model: "page",
    id: "f7f2e4fcd28f4001834501922abac408",
    label: "Stores: real store directory (directions + call links) (+ variation)",
    plan: (e) => {
      const hero = { ...findComponent(e.data.blocks, "Hero").component.options };
      const patch = { data: { ...e.data, blocks: [...storesBlocks(hero), ...pixelBlocks(e.data.blocks)] } };
      const variations = clone(e.variations ?? {});
      for (const variation of Object.values(variations)) {
        const vHero = findComponent(variation.data?.blocks, "Hero");
        if (!vHero) continue;
        variation.data.blocks = [...storesBlocks({ ...vHero.component.options }, "-v"), ...pixelBlocks(variation.data.blocks)];
      }
      if (Object.keys(variations).length) patch.variations = variations;
      return patch;
    },
  },
  {
    key: "card-rate",
    model: "page",
    id: "e0f96764abd54d68b58d2d2f3a1e95f4",
    label: "Evergreen /card/intro-apr: real rate-check form instead of \"isn't wired up in this demo\"",
    plan: (e) => ({ data: { ...e.data, blocks: [...cardRateBlocks(), ...pixelBlocks(e.data.blocks)] } }),
  },
  {
    key: "cart",
    model: "page",
    id: "5fb2c9a1323a496d808dc1550dcbdb00",
    label: "Cart: drop \"isn't wired up in this demo\" copy, add a Start shopping CTA",
    plan: (e) => ({ data: { ...e.data, blocks: cartBlocks(e.data.blocks) } }),
  },
  {
    key: "account",
    model: "page",
    id: "46f548d118e840e99d2e38ed829173f7",
    label: "Account: useful self-service links instead of \"isn't wired up in this demo\"",
    plan: (e) => ({ data: { ...e.data, blocks: accountBlocks(e.data.blocks) } }),
  },
  {
    key: "pro",
    model: "landing-page",
    id: "cc2c7f97333b40228b09c4dbd811d099",
    label: "Pro: LeadForm label + #pro-apply anchor actually work (+ variation)",
    plan: (e) => {
      const opts = { successMessage: PRO_SUCCESS, messagePlaceholder: PRO_PLACEHOLDER, anchor: "pro-apply" };
      const patch = { data: { ...e.data, blocks: fixLeadForms(e.data.blocks, opts) } };
      const variations = clone(e.variations ?? {});
      for (const variation of Object.values(variations)) {
        if (variation.data?.blocks) variation.data.blocks = fixLeadForms(variation.data.blocks, opts);
      }
      if (Object.keys(variations).length) patch.variations = variations;
      return patch;
    },
  },
  {
    key: "card-campaign",
    model: "landing-page",
    id: "da330d8fb0c04e51b74558129c8e7095",
    label: "Card APR campaign: \"Check my rate\" label, card-specific success copy, Apply now → form",
    plan: (e) => {
      const blocks = moveOptionIdToProperties(
        fixLeadForms(e.data.blocks, {
          successMessage: "We'll email your personalized rate offer within one business day. Checking your rate doesn't affect your credit score.",
          messagePlaceholder: "Anything we should know?",
          anchor: "apply",
        }),
        "Disclosure",
      );
      const hero = findComponent(blocks, "Hero");
      if (hero?.component.options.ctaHref === "#apr-disclosure") hero.component.options.ctaHref = "#apply";
      return { data: { ...e.data, blocks } };
    },
  },
  {
    key: "pro-trade",
    model: "landing-page",
    id: "66a9b02b6c1c41d48e0be0b726e49d23",
    label: "Pro trade pricing campaign: LeadForm label + Pro success copy",
    plan: (e) => ({
      data: { ...e.data, blocks: fixLeadForms(e.data.blocks, { successMessage: PRO_SUCCESS, messagePlaceholder: PRO_PLACEHOLDER }) },
    }),
  },
  ...[
    ["how-do-i-find-my-size", "a337c233ba6f45cbb524f782b8633c57", IMG.storeInterior, "Jackets and layers on display in a Fieldnote store"],
    ["tracking-your-order", "e57c4b27e10e46cc8da52f654371aee8", IMG.courier, "A courier unloading parcels from a delivery van"],
    ["shipping-returns", "17809d8ff92f4326a627d7114824b5a6", null, "Packed orders on shelves in a fulfillment warehouse"],
    ["repair-guarantee", "1a28159dc689484c971fa3d62c5344bc", IMG.repairBench, "Hand tools hanging on a repair workshop wall"],
    ["repair-instead-of-replace", "d379a75470174e988d9279a956b32f3f", IMG.repairSupplies, "Sewing and repair supplies laid out on a dark workbench"],
    ["how-we-test-every-shell", "768eee6c59224b3cb803e249ba5f566b", IMG.overcastShell, "A hiker in a red shell crossing an exposed moor under grey skies"],
    ["field-testing-with-guides", "679a26d5411f4cd490629d3d77ee80a7", IMG.guidesTrail, "Two hikers with packs on a mountain trail beneath snowy peaks"],
    ["outfitting-a-guide-crew", "6f5a98a4816142bebd0941ecb22d3e73", IMG.lakeTent, "A guide's tent pitched beside an alpine lake"],
    ["layering-101", "1812f063e3314c0a8dc6c9be0a1bfc15", IMG.woolHoodie, "A hiker in a wool hoodie looking out from a cliff edge"],
  ].map(([slug, id, image, alt]) => ({
    key: `article-${slug}`,
    model: "article",
    id,
    label: `Article image: ${slug} (${image ? "replace mismatched/broken photo" : "fix alt text"})`,
    plan: (e) => ({ data: { ...e.data, ...(image ? { heroImage: image } : {}), heroImageAlt: alt } }),
  })),
];

// ------------------------------------------------------------------ runner

async function fetchEntry(model, id) {
  const params = new URLSearchParams({
    apiKey: PUBLIC_KEY,
    "query.id": id,
    includeUnpublished: "true",
    cachebust: "true",
    limit: "1",
  });
  const res = await fetch(`https://cdn.builder.io/api/v3/content/${model}?${params}`);
  if (!res.ok) throw new Error(`fetch ${model}/${id}: ${res.status}`);
  const entry = (await res.json()).results?.[0];
  if (!entry) throw new Error(`${model}/${id} not found`);
  return entry;
}

async function writeEntry(model, id, patch) {
  const res = await fetch(`https://builder.io/api/v1/write/${model}/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${PRIVATE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`write ${model}/${id}: ${res.status} ${await res.text()}`);
}

mkdirSync(OUT_DIR, { recursive: true });
console.log(`${APPLY ? "APPLYING" : "DRY RUN"} -> ${OUT_DIR}\n`);

let failures = 0;
for (const step of STEPS) {
  if (ONLY && !ONLY.includes(step.key)) continue;
  try {
    const entry = await fetchEntry(step.model, step.id);
    const patch = step.plan(clone(entry));
    const file = `${step.model}-${step.key}`;
    writeFileSync(path.join(OUT_DIR, `${file}.original.json`), JSON.stringify(entry, null, 2));
    writeFileSync(path.join(OUT_DIR, `${file}.planned.json`), JSON.stringify({ ...entry, ...patch }, null, 2));
    if (APPLY) await writeEntry(step.model, step.id, patch);
    console.log(`${APPLY ? "✔ wrote" : "• planned"}  [${step.key}] ${entry.name}: ${step.label}`);
  } catch (error) {
    failures++;
    console.error(`✖ [${step.key}] ${error.message}`);
  }
}

console.log(`\n${failures ? `${failures} step(s) failed.` : "Done."}${APPLY ? "" : " Nothing was written to Builder. Re-run with --apply to write."}`);
process.exit(failures ? 1 : 0);
