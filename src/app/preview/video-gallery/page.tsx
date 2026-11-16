import type { Metadata } from "next";
import { VideoGallery, DEFAULT_VIDEOS } from "@/components/builder/VideoGallery";

export const metadata: Metadata = {
  title: "VideoGallery preview",
  robots: { index: false, follow: false },
};

export default function VideoGalleryPreviewPage() {
  return (
    <main>
      <VideoGallery
        heading="Watch and learn"
        subheading="Films, how-tos and field stories from the Fieldnote team."
        videos={DEFAULT_VIDEOS}
        attributes={{}}
      />
    </main>
  );
}
