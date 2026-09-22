# Services to Sign Up For — and Exactly Which Keys to Grab

Go top to bottom. **Total required spend: $20/month.** Total setup: ~1.5–2 hours.

Everything here was verified against vendor docs on 2026‑09‑22, and the Builder plugin field names were read out of the actual published npm packages — so they're exact, not paraphrased.

---

## Read these three first, they'll save you the most time

1. **Vercel Hobby won't work.** Not a cron limitation — a licensing one. Vercel's fair-use guidelines restrict Hobby to *"non-commercial, personal use only."* A vendor sales demo is commercial. You need **Pro, $20/seat/mo**. (Hobby cron is also capped at once per day with **±59 minutes of jitter**, so it won't fire at a predictable time anyway.)

2. **Shopify's custom-app flow changed on 1 Jan 2026, and Builder's Shopify docs are stale.** They still reference "Manage private apps," a UI that no longer exists. If you follow them you will get stuck. Use the **Headless sales channel** instead — it's now the only quick path to a Storefront API token.

3. **The Builder Shopify plugin's `apiVersion` field defaults to `2020-07`**, which has been retired for years. Shopify "falls forward" to the oldest supported version rather than erroring, so this breaks *silently and unpredictably*. **Set it explicitly to `2026-07`.**

---

## Required — do these 6

### 1. Vercel Pro · $20/mo · 10 min

- **Sign up:** https://vercel.com/signup → upgrade to **Pro**
- **Card required:** yes (a Pro trial exists if you want to defer the charge)
- **Why Pro:** commercial-use licensing, plus cron with **per-minute precision** instead of Hobby's ±59-minute window. Your analytics generator needs to run on a schedule you can rely on.
- **Gotcha:** cron routes are publicly reachable. Gate yours with a `CRON_SECRET` bearer check. Crons only activate on a **production** deployment.

### 2. Shopify dev store · free · 20–30 min

- **Sign up:** https://www.shopify.com/partners → then https://dev.shopify.com/dashboard
- **Card required:** no. Instant, no approval delay.
- **Create the store:** Dev Dashboard → Stores → Create store → type **Dev** → plan **`plus`** (free, unlocks Plus-only surfaces for the narrative) → Create.
  Or CLI — **use `--demo-data`, it saves an hour of manual product entry:**
  ```
  shopify store create dev --name "Fieldnote Demo" --plan plus --demo-data --country US
  ```
- **Dev stores never expire.** Cap is 250 per org.

**Get the token via the Headless channel, not Builder's docs:**
1. Install the **Headless** sales channel: https://apps.shopify.com/headless
2. **Create storefront** → you get a **public** and a **private** access token
3. Give Builder the **public access token**
4. Shopify admin → Headless → your storefront → **Storefront API permissions** → Edit → grant product/collection read scopes → Save

**Credentials — the Builder plugin has exactly three fields:**

| Plugin field | Value |
|---|---|
| `storefrontAccessToken` | The **public** access token from the Headless channel |
| `storeDomain` | `your-store.myshopify.com` — full host, no `https://`, no trailing slash |
| `apiVersion` | **`2026-07`** — set this explicitly (see warning above) |

**Storefront API, not Admin API.** The plugin sends `X-Shopify-Storefront-Access-Token`. No Admin token is needed anywhere. (Blog posts saying otherwise describe an old Gatsby starter.)

**Demo gotcha:** dev stores keep a password page you can't remove. Storefront API product/collection queries work fine, but the *hosted checkout URL* will bounce off it. **Demo the PLP and PDP, not a completed checkout** — or keep the store password handy.

**Where it plugs in:** Builder → Integrations (builder.io/app/integrations) → Shopify → Enable → Configure.

### 3. Algolia · free · 20–30 min

- **Sign up:** https://dashboard.algolia.com/users/sign_up — no card
- **Free plan:** 50,000 records, 10,000 searches/month, **1 application**, US/UK/EU-West regions only. Perpetual.

**You need TWO keys, and they're different things.** This trips people up:

| Key | Where to get it | Used for | Safe in browser? |
|---|---|---|---|
| **Application ID** | Settings → Team and Access → API Keys | Both | ✅ |
| **Search API key** (a.k.a. Search-Only) | Same page | Your product search UI | ✅ Algolia: *"safe to use in your production frontend code"* |
| **A restricted key you create** | API Keys → **All API Keys** tab → **New API Key** → ACL: **`search`, `addObject`, `deleteObject`** | **The Builder Algolia plugin** | Server-side |
| Write / Admin API key | Same page | Your indexing script | 🔒 Never in the browser |

**Important:** the Builder Algolia plugin is **not** a product-search integration — it **syncs your Builder content models into Algolia** as indices prefixed `builder-` (e.g. `builder-page`). Its settings are just two fields: `algoliaAppId` and `algoliaKey`, and `algoliaKey` must be the **restricted key** above — not the search-only one, not the admin one. Then per model: **Advanced tab → Sync to Algolia**.

**Gotchas:**
- Indices auto-create on first write. No dashboard step.
- `objectID` is mandatory unless you pass `autoGenerateObjectIDIfNotExist: true` — the most common first-run failure.
- Indexing is async — use `waitForTasks: true` or your script exits before data lands.
- 🔴 **"If your account remains inactive for more than 30 days, Algolia may remove your Subscriber Data."** A demo parked between meetings can come back empty. Poke it monthly.
- Region is chosen at app creation and Free allows only 1 app — effectively irreversible.
- No A/B testing, NeuralSearch or Personalization on Free. Don't promise them.

### 4. Cloudinary · free · 5–20 min

- **Sign up:** https://cloudinary.com/users/register_free — *"Free forever. No credit card required."*
- **Free tier:** 25 monthly credits. One credit = 1,000 transformations **or** 1 GB storage **or** 1 GB bandwidth. Plenty — but note `f_auto,q_auto` plus responsive widths means every distinct URL is a transformation, so it burns faster than you'd expect.

**Credentials — Console → Settings → API Keys:**

| Name | Needed by Builder plugin? | Safe in browser? |
|---|---|---|
| **Cloud Name** | ✅ yes | ✅ (it's in every delivery URL) |
| **API Key** | ✅ yes | ✅ Cloudinary says client-side exposure is fine |
| **API Secret** | ❌ **not needed** | 🔒 never |

The plugin stores these as `cloudinaryCloud` and `cloudinaryKey`. You enter them by dropping a component with a `cloudinaryImageEditor` input into content and clicking **Set Credentials**.

**Gotchas:**
- Generating a key emails a confirmation code to the account address. Budget an extra minute.
- 🔴 **Verify on day one:** the plugin's GitHub README says the Cloudinary Media Library widget *"requires SSO enabled and be previously logged in."* **SSO is not available on a free Cloudinary account.** Builder's docs page omits this. Test the picker immediately — if it's blocked, fall back to `next-cloudinary` with plain delivery URLs, or just use Builder's own DAM and skip Cloudinary entirely.
- Your cloud name is public, permanent-ish, and visible in every image URL on screen. **Pick something presentable.**

### 5. Slack · free · 10–15 min

For the workflow-webhook → notification beat.

- 🔴 **Create a throwaway personal workspace** at https://slack.com/get-started. On corporate Slack an Owner can enable "Approve apps," which blocks your install pending admin review — and you may already be at the 10-app free limit.
- **Path:** https://api.slack.com/apps?new_app=1 → **From scratch** → name + workspace → Create → sidebar **Incoming Webhooks** → toggle **Activate** → **Add New Webhook to Workspace** → pick channel → Allow → copy the URL.
- **Credential:** just the **Webhook URL** (`https://hooks.slack.com/services/T…/B…/…`). You do *not* need the Bot Token or Signing Secret for outbound notifications.

**Gotchas:**
- A webhook URL is bound to **one channel**, permanently. The old `"channel": "#other"` payload override no longer works. Need a second channel → create a second webhook.
- **Rate limit: 1 message/second.** Put a ~1.1s sleep between demo messages or you'll get 429s.
- Webhooks **cannot edit or delete** messages. No do-overs mid-demo.
- Slack scans public repos and revokes leaked webhook URLs. Env var only.

### 6. Builder.io space · — · —

Covered in the plan, but note the dependency: **Builder Content Pro is a prerequisite for both localization connectors** (Crowdin and Phrase), on top of whatever the provider requires.

---

## Strongly recommended — cheap, high payoff

### 7. DummyJSON product data · free · 15 min · **highest value per minute on this list**

Your "first-party PIM / your own database" story needs a data source that isn't Shopify. DummyJSON is the best stand-in.

- **URL:** https://dummyjson.com/products — no signup, no key, MIT licensed
- **194 products**, each with `title`, `price` + `discountPercentage`, `images[]` + `thumbnail`, `category` (24 of them), `stock`, `availabilityStatus`, `brand`, `sku`, `barcode`, `rating`, `reviews[]`, `tags[]`, `dimensions`, `weight`, `warrantyInformation`, `shippingInformation`, `returnPolicy`. That reads like a real PIM record, which is exactly the point.

🔴 **Do not let a live demo depend on a third-party host.** Do a one-time `GET /products?limit=0`, **commit the JSON into the repo**, serve it from a Next.js route handler, and mirror the images into Builder's DAM. Fifteen minutes, removes all runtime dependency, identical response shape — and *"this is your PIM feeding Builder"* is a better story than *"this is a public mock API."*

**Two gaps:** no variants (no size/colour — synthesize if you need a variant picker), and writes are simulated.

**Rejected alternatives, for the record:** *Fake Store API* — only 20 products, and its images are **scraped Amazon product photography**, which is a licensing risk in a public commercial demo. *Platzi Fake Store* — writes are **real and unauthenticated**, so the shared dataset is currently full of entries like `title-24f15021-4e06-…`; you could open the demo in front of a prospect and find garbage SKUs on the PLP.

### 8. Pexels · free · 2 min

For lifestyle, hero and banner imagery.

- **Sign up:** https://www.pexels.com/api/ → Get Started. Key appears instantly in your profile's **API** tab. No card, no review.
- **Credential:** one **API key**. Sent as `Authorization: YOUR_API_KEY` — **no `Bearer` prefix** (common mistake).
- **Limits:** 200 req/hour, 20,000/month.
- **License:** free commercial use, attribution not required, modification allowed. No hotlinking mandate — **you may download and re-host in Builder's DAM**, which matters for the DAM beat.

**Restrictions to respect:** identifiable people may not appear in a bad light; don't imply endorsement by people or brands; and **don't sell unaltered copies of a photo on a physical product.**

🔴 **Use Unsplash for nothing here.** Two of its API rules directly conflict with this demo: *"All API uses must use the hotlinked image URLs returned by the API"* — which forbids putting the files in a DAM — and *"You cannot use the API to sell unaltered Unsplash photos directly or indirectly (prints, on products, etc.)"* — which is what a product grid with prices and an Add to Cart looks like. Breaching either is called "a material breach" in their API Terms.

**For anything rendered as a purchasable SKU, use owned or generated imagery.** Near-zero cost, zero risk, and it avoids a conversation with somebody's legal team about a public demo that prices stock photos. Avoid faces, visible logos and recognizable landmarks on anything captioned as a product.

### 9. Crowdin · free · 20–30 min · **use this instead of Phrase**

- **Sign up:** https://accounts.crowdin.com/register — no card
- **Builder connector:** https://store.crowdin.com/builder — **free** on the Crowdin store (their Storyblok connector is $90/mo, for contrast)
- **Free plan, $0 forever:** 60,000 hosted words, 1 private project, **1 integration**, unlimited translators, API, CLI, TM, glossary, MT engines

**Credentials — note the direction of travel.** The Builder connector asks for *Builder's* keys, not the other way round: in the connector's **Setup integration** panel you enter your Builder **Private API Key** and **Public API Key**, then click **Login with Builder.io**.

For direct Crowdin API work you'd also want a **Personal Access Token** (Account Settings → API → New Token, shown once) and the numeric **Project ID** (project → Tools → API).

**Gotchas:**
- Requires **Builder Content Pro or Enterprise**.
- **Free = 1 integration total.** The Builder connector consumes it.
- **Webhooks are not on Free** — if your story is "Crowdin fires a webhook on completion," you need Pro ($50/mo).
- **0 manager seats on Free.** Solo demo works; multi-person approval flow doesn't.
- Free-plan translations are donated to Crowdin's shared TM. Don't paste customer-confidential copy in.

**Skip Phrase.** No free tier at all. 14-day trial that *excludes integrations*. Builder's docs additionally require a **Phrase "Ultimate" plan or higher**, which maps to today's sales-gated Business/Enterprise tier — so the trial can't satisfy the requirement. Also, the Builder plugin targets **Phrase TMS (formerly Memsource)** and authenticates with **username and password**, not an API token — and the username is generated by Phrase, it isn't your email. Expect 45–90 minutes with a real chance it never works. Mention Phrase verbally; demo Crowdin.

---

## Optional

### 10. Google Analytics 4 · free · 15–20 min

Only if analytics integration is an actual beat.

- **Set up:** https://analytics.google.com → Start measuring → Account → Property → **Admin → Data collection and modification → Data Streams → Add stream → Web**
- **Credential you need:** **Measurement ID** (`G-XXXXXXXXXX`), at Data streams → your stream → Stream details. Also labeled "Google tag ID." Public by design.
  - Don't confuse it with **Stream ID** (numeric, same panel) or **Property ID** (9–10 digits, Admin → Property details). Neither goes in gtag.
- **Next.js:** `npm i @next/third-parties` → `<GoogleAnalytics gaId={...} />` in `app/layout.tsx`

**Gotchas:**
- 🔴 **Install at least 24 hours before any demo.** Realtime = minutes, but intraday = 2–6 hours and daily = 12 hours, with a blanket "processing can take 24–48 hours." Otherwise drive the demo off **Reports → Realtime** and **DebugView** only.
- Vercel mints a new hostname per deploy — gate on `process.env.VERCEL_ENV === 'production'` or previews pollute your data.
- Ad blockers block `googletagmanager.com`. Expect a 10–40% undercount, worse with a developer audience. **Test in a clean browser profile before presenting.**
- Set data retention to 14 months at Admin → Data settings → Data retention (default is 2).

### 11. Fonts · free · 0 min

**Use Google Fonts via `next/font/google`.** No API key needed for the CSS API. `next/font` downloads and **self-hosts at build time**, so no requests reach Google from the browser — which also resolves the German GDPR exposure around hotlinking `fonts.googleapis.com`.

⚠️ **Don't use Fontshare fonts in the Builder font picker.** Their ITF Free Font License bars making a font *"available as a selectable font for third-party users to create, edit, customize or generate their own content"* — explicitly even if users can't download the file. A Builder visual-editor font picker is precisely that. Adobe Fonts and Klim have equivalent bans. If you want Satoshi for polish, confine it to hardcoded brand chrome and never expose it as a token option.

Also: strip any leftover `<link rel="preconnect" href="https://fonts.gstatic.com">` from templates.

---

## Order of operations

**Today (do these while the agent builds):**
1. **Shopify Partners + dev store with `--demo-data`** — nothing downstream works without product data
2. **Vercel Pro**
3. **Cloudinary** — so you can test the SSO blocker while there's still time to pivot

**Next:**
4. Algolia (both keys)
5. Slack throwaway workspace
6. Pexels
7. DummyJSON snapshot into the repo

**Then:**
8. Crowdin (if the demo has a localization act — it should)
9. GA4, **at least a day before any demo**

---

## Credentials checklist to hand the agent

```bash
# Builder
NEXT_PUBLIC_BUILDER_API_KEY=            # Public API key, new space
BUILDER_PRIVATE_KEY=                    # Write API + Crowdin connector

# Shopify  (Headless sales channel → Create storefront → PUBLIC access token)
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_API_VERSION=2026-07             # MUST set explicitly — plugin defaults to dead 2020-07

# Algolia
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=     # "Search API key" — safe in browser
ALGOLIA_WRITE_API_KEY=                  # server only, for the indexing script
# Plus a separate RESTRICTED key (ACL: search, addObject, deleteObject)
# pasted into Builder's Algolia plugin settings — not into .env

# Cloudinary   (Builder plugin needs only Cloud name + API key)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=                  # NOT needed by the Builder plugin

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Vercel cron
CRON_SECRET=

# Optional
PEXELS_API_KEY=                         # header: "Authorization: <key>" — no Bearer
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

⚠️ **`.gitignore` must cover `.env`.** The old `unified-demo` repo's didn't, and its `.env` is in public git history permanently.
