import { ensureUploadPreset, CLOUDINARY_UPLOAD_PRESET } from "../src/lib/cloudinary/ensure-upload-preset";

async function main() {
  const { created } = await ensureUploadPreset();
  console.log(
    created
      ? `Created Cloudinary upload preset "${CLOUDINARY_UPLOAD_PRESET}".`
      : `Cloudinary upload preset "${CLOUDINARY_UPLOAD_PRESET}" already exists — nothing to do.`,
  );
}

main().catch((error) => {
  console.error("Failed to set up Cloudinary upload preset:", error);
  process.exit(1);
});
