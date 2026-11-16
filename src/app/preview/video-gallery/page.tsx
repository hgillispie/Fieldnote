import type { Metadata } from "next";
import { VideoGallery, DEFAULT_VIDEOS } from "@/components/builder/VideoGallery";

export const metadata: Metadata = {
  title: "VideoGallery preview",
  robots: { index: false, follow: false },
};

export default function VideoGalleryPreviewPage() {
  return (
    <main>
      <p className="mx-auto max-w-6xl px-4 pt-8 text-xs font-medium uppercase tracking-wide text-slate sm:px-6 lg:px-8">
        Layout: grid (3 columns)
      </p>
      <VideoGallery
        heading="Watch and learn"
        subheading="Films, how-tos and field stories from the Fieldnote team."
        layout="grid"
        columns="3"
        videos={DEFAULT_VIDEOS}
        attributes={{}}
      />
      <p className="mx-auto max-w-6xl px-4 pt-8 text-xs font-medium uppercase tracking-wide text-slate sm:px-6 lg:px-8">
        Layout: featured
      </p>
      <VideoGallery
        heading="Watch and learn"
        subheading="Films, how-tos and field stories from the Fieldnote team."
        layout="featured"
        videos={DEFAULT_VIDEOS}
        attributes={{}}
      />
    </main>
  );
}
