/**
 * ENTERPRISE PATTERN: DAM COEXISTENCE — Builder Asset Manager + Cloudinary
 *
 * ⚠️ Builder's own native Asset Manager remains this app's primary, default
 * DAM. Every `type: "file"` input already registered in
 * `src/builder-registry.ts` (Hero's `heroImage`, ProductCard's
 * `staticImage`, etc.) uses it, and that should stay true for the vast
 * majority of images in this app — Builder's Asset Manager needs zero setup,
 * has no separate account to manage, and is already where content
 * governance/permissions for images live for everyone using this space.
 *
 * This plugin exists for a narrower, very real situation: an enterprise
 * customer migrating to Builder who already has an active Cloudinary
 * contract, an existing library of tens of thousands of assets, and
 * transformation pipelines (responsive breakpoints, format negotiation,
 * on-the-fly cropping) built directly on Cloudinary's URL API. Telling that
 * customer "move every asset into Builder's Asset Manager before you can
 * start building pages" is often a non-starter — it's a large, risky
 * migration project decoupled from the actual page-building work Builder is
 * being adopted for. The realistic answer is coexistence: keep publishing
 * new/simple images through Builder's Asset Manager by default, and offer a
 * "Choose from Cloudinary" option on specific fields where a team still
 * wants to pull from their existing library or lean on a transformation
 * pipeline they've already built. As more of the org's asset workflows move
 * to Builder natively, fewer fields need this option — nothing forces that
 * migration to happen before Builder can be used at all.
 *
 * WHY THIS FILE LIVES IN ITS OWN `plugins/` PACKAGE, NOT IN `src/`
 * A custom Builder *field type* (as opposed to a custom *component*, which
 * this app registers plenty of directly from `src/builder-registry.ts` via
 * `@builder.io/sdk-react`'s `register("component", ...)`) is a different
 * registration surface: `Builder.registerEditor()`, from the classic
 * `@builder.io/react` package. Confirmed directly from that package's own
 * source (`packages/core/src/builder.class.ts` in the BuilderIO/builder
 * GitHub repo): calling `Builder.registerEditor()` from a normal app
 * (including this one, rendered inside the editor's own live-preview iframe)
 * hits an explicit guard and logs "Builder.registerEditor() called in the
 * wrong environment! You cannot load custom editors from your app, they
 * must be loaded through the Builder.io app itself." Unlike
 * `register("component", ...)`, which this app calls on itself and which
 * *does* work via postMessage into the parent editor frame, a registered
 * editor's `component` is deliberately stripped before that postMessage is
 * even sent — there is no cross-origin way to hand Builder's own hosted
 * editor UI (app.builder.io) a live React component reference from a
 * different origin's app. Custom field-type editors like this one are real
 * Builder *plugins*: standalone bundles that get hosted somewhere Builder
 * can fetch them from, then registered once via **Space Settings → Plugins**
 * in the Builder dashboard — a manual, one-time admin action, not something
 * any application code (this repo included) can do on its own. This mirrors
 * Builder's own official Cloudinary plugin, which lives in its own package
 * at `github.com/BuilderIO/builder/tree/main/plugins/cloudinary` for exactly
 * this reason.
 *
 * WHAT'S REAL HERE AND WHAT STILL NEEDS A MANUAL STEP
 * The `CloudinaryImagePicker` component below, the Upload Widget wiring, and
 * the `fieldnote_unsigned` upload preset it depends on (created for real in
 * the connected Cloudinary account by `scripts/setup-cloudinary.ts` — see
 * `src/lib/cloudinary/ensure-upload-preset.ts`) are all genuine, working
 * code, not stubs. `Hero`'s optional `cloudinaryImage` input in
 * `src/builder-registry.ts` is also registered for real, with the field
 * `type` set to this plugin's `cloudinaryImage` name. The one remaining step
 * — building this package and registering its hosted URL under **Space
 * Settings → Plugins** in the Fieldnote Builder space — is a Builder-
 * dashboard admin action outside what any repository's code can perform,
 * exactly like this repo's Validation-command setting (see AGENTS.md /
 * CLAUDE.md) is a Project-Settings UI action Claude/Builder Code can't reach
 * either. Until that step happens, Builder's editor renders this field with
 * its "unrecognized custom type" fallback instead of the picker UI below —
 * that's expected, not a bug in this code.
 *
 * SIGNED VS. UNSIGNED UPLOADS — why this picker never touches the API secret
 * Cloudinary supports two ways to authorize an upload:
 *   - SIGNED: the caller sends an HMAC signature computed from the request
 *     params plus the account's API secret. Computing that signature
 *     requires the secret, so it MUST happen server-side (typically: browser
 *     asks a server endpoint for a signature, then uploads directly to
 *     Cloudinary with it). More flexible — arbitrary transformation params
 *     per upload — at the cost of that extra server round-trip.
 *   - UNSIGNED: the caller instead sends the name of a pre-configured
 *     "upload preset" (created ahead of time via the Admin API — see
 *     `src/lib/cloudinary/ensure-upload-preset.ts`) that already encodes the
 *     destination folder and allowed formats. No secret is ever needed
 *     client-side.
 * This picker uses the unsigned preset (`fieldnote_unsigned`, folder
 * `fieldnote-demo`) specifically so it can run entirely inside Builder's
 * hosted editor UI's browser context, with zero secrets anywhere in this
 * plugin bundle — the same reasoning as any client-side widget that must
 * never ship a server secret to whoever loads the page.
 */

import { Builder } from "@builder.io/react";
import { useState } from "react";

const CLOUDINARY_WIDGET_SCRIPT_SRC = "https://upload-widget.cloudinary.com/global/all.js";
const CLOUDINARY_CLOUD_NAME = "hwteeemq";
const CLOUDINARY_UPLOAD_PRESET = "fieldnote_unsigned";
const CLOUDINARY_UPLOAD_FOLDER = "fieldnote-demo";

export interface CloudinaryFieldValue {
  secureUrl: string;
  publicId: string;
}

interface CloudinaryUploadWidgetResult {
  event: string;
  info?: { secure_url: string; public_id: string };
}

interface CloudinaryUploadWidget {
  open: () => void;
}

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: CloudinaryUploadWidgetResult) => void,
      ) => CloudinaryUploadWidget;
    };
  }
}

let widgetScriptPromise: Promise<void> | null = null;

function loadCloudinaryWidgetScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.cloudinary) return Promise.resolve();

  if (!widgetScriptPromise) {
    widgetScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CLOUDINARY_WIDGET_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load the Cloudinary widget script"));
      document.head.appendChild(script);
    });
  }

  return widgetScriptPromise;
}

interface CloudinaryImagePickerProps {
  value?: CloudinaryFieldValue;
  onChange: (value: CloudinaryFieldValue) => void;
}

/**
 * The plugin's editor component itself — a plain React component taking
 * `value`/`onChange`, exactly the contract Builder's docs specify for a
 * `Builder.registerEditor` custom type
 * (builder.io/c/docs/plugins-creating-custom-types). No special adapter or
 * class wrapper is needed; Builder's editor host handles mounting this
 * directly once the plugin bundle is registered.
 */
export function CloudinaryImagePicker({ value, onChange }: CloudinaryImagePickerProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function openWidget() {
    setIsLoading(true);
    try {
      await loadCloudinaryWidgetScript();

      if (!window.cloudinary) {
        console.error("Cloudinary widget script failed to load.");
        return;
      }

      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          folder: CLOUDINARY_UPLOAD_FOLDER,
          sources: ["local", "url", "camera", "image_search"],
          multiple: false,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload widget error:", error);
            return;
          }
          if (result.event === "success" && result.info) {
            onChange({ secureUrl: result.info.secure_url, publicId: result.info.public_id });
          }
        },
      );

      widget.open();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {value?.secureUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- editor-chrome preview thumbnail, not app content
        <img
          src={value.secureUrl}
          alt=""
          style={{ width: "100%", borderRadius: 4, border: "1px solid #e8dfd2" }}
        />
      )}
      <button
        type="button"
        onClick={openWidget}
        disabled={isLoading}
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid #1b3a2f",
          background: "#1b3a2f",
          color: "#fff",
          fontSize: 13,
          cursor: isLoading ? "default" : "pointer",
        }}
      >
        {isLoading ? "Loading..." : "Choose from Cloudinary"}
      </button>
    </div>
  );
}

// Registers the `cloudinaryImage` field type. Only takes effect once this
// plugin package is built and its hosted URL is registered under Builder's
// Space Settings → Plugins — see the top-of-file comment block.
Builder.registerEditor({
  name: "cloudinaryImage",
  component: CloudinaryImagePicker,
});
