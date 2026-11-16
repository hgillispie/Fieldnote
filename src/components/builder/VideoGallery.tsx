"use client";

import { useState } from "react";
import { EditorEmptyState } from "./EditorEmptyState";
import { SectionHeader } from "./SectionHeader";
import { SectionShell } from "./SectionShell";

type VideoGalleryLayout = "grid" | "featured";
type VideoGalleryColumns = "2" | "3" | "4";

interface VideoItem {
  title: string;
  url: string;
  description?: string;
  duration?: string;
  poster?: string;
}

interface VideoGalleryProps {
  heading?: string;
  subheading?: string;
  layout?: VideoGalleryLayout;
  columns?: VideoGalleryColumns;
  videos?: VideoItem[];
  attributes?: Record<string, unknown>;
}

type VideoSource =
  | { kind: "youtube"; id: string }
  | { kind: "vimeo"; id: string }
  | { kind: "file"; src: string };

export const DEFAULT_VIDEOS: VideoItem[] = [
  {
    title: "Big Buck Bunny",
    url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    description: "Replace with your own story, product demo or trail film.",
    duration: "10:34",
  },
  {
    title: "Sintel",
    url: "https://www.youtube.com/watch?v=eRsGyueVLvQ",
    description: "A lone traveler's long journey across a harsh landscape.",
    duration: "14:48",
  },
  {
    title: "Tears of Steel",
    url: "https://www.youtube.com/watch?v=R6MlUcmOul8",
    description: "Paste a YouTube, Vimeo or direct .mp4 link for each video.",
    duration: "12:14",
  },
  {
    title: "Elephants Dream",
    url: "https://www.youtube.com/watch?v=TLkA0RELQ1g",
    description: "Optional poster image overrides the automatic thumbnail.",
    duration: "10:53",
  },
];

const COLUMN_CLASSES: Record<VideoGalleryColumns, string> = {
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-2 lg:grid-cols-3",
  "4": "sm:grid-cols-2 lg:grid-cols-4",
};

const YOUTUBE_PATTERN = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
const VIMEO_PATTERN = /vimeo\.com\/(?:video\/)?(\d+)/;

function parseVideoUrl(url: string): VideoSource | null {
  const trimmed = url.trim();
  const youtube = YOUTUBE_PATTERN.exec(trimmed);
  if (youtube) return { kind: "youtube", id: youtube[1] };
  const vimeo = VIMEO_PATTERN.exec(trimmed);
  if (vimeo) return { kind: "vimeo", id: vimeo[1] };
  if (/^https?:\/\//i.test(trimmed)) return { kind: "file", src: trimmed };
  return null;
}

function posterFor(item: VideoItem, source: VideoSource): string | undefined {
  if (item.poster) return item.poster;
  if (source.kind === "youtube") return `https://i.ytimg.com/vi/${source.id}/hqdefault.jpg`;
  return undefined;
}

interface ResolvedVideo {
  item: VideoItem;
  source: VideoSource;
  poster?: string;
}

export function VideoGallery({
  heading,
  subheading,
  layout = "grid",
  columns = "3",
  videos,
  attributes,
}: VideoGalleryProps) {
  const items: ResolvedVideo[] = [];
  for (const item of videos ?? []) {
    if (!item?.title || !item.url) continue;
    const source = parseVideoUrl(item.url);
    if (source) items.push({ item, source, poster: posterFor(item, source) });
  }

  const [activeIndex, setActiveIndex] = useState(0);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <EditorEmptyState
        attributes={attributes}
        message="Add videos with a title and a YouTube, Vimeo or direct video URL in the options panel."
      />
    );
  }

  const currentIndex = Math.min(activeIndex, items.length - 1);

  return (
    <SectionShell attributes={attributes} spacing="md">
      <SectionHeader heading={heading} subheading={subheading} />

      {layout === "featured" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] lg:gap-8">
          <div>
            <VideoPlayer
              key={currentIndex}
              video={items[currentIndex]}
              playing={playingIndex === currentIndex}
              onPlay={() => setPlayingIndex(currentIndex)}
            />
            <div className="mt-4">
              <h3 className="font-display text-xl text-ink">{items[currentIndex].item.title}</h3>
              {items[currentIndex].item.description && (
                <p className="mt-2 text-base text-slate">{items[currentIndex].item.description}</p>
              )}
            </div>
          </div>

          <ul className="flex flex-col gap-3">
            {items.map((video, index) => (
              <li key={`${video.item.url}-${index}`}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveIndex(index);
                    setPlayingIndex(index);
                  }}
                  aria-current={index === currentIndex}
                  className={`flex w-full items-center gap-3 rounded-md border p-2 text-left transition hover:bg-surface-alt ${
                    index === currentIndex ? "border-accent bg-surface-alt" : "border-sand bg-surface"
                  }`}
                >
                  <div className="w-28 shrink-0">
                    <VideoThumbnail video={video} size="sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{video.item.title}</p>
                    {video.item.duration && (
                      <p className="mt-0.5 text-xs text-slate">{video.item.duration}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className={`grid grid-cols-1 gap-6 lg:gap-8 ${COLUMN_CLASSES[columns]}`}>
          {items.map((video, index) => (
            <li key={`${video.item.url}-${index}`} className="flex flex-col gap-3">
              <VideoPlayer
                video={video}
                playing={playingIndex === index}
                onPlay={() => setPlayingIndex(index)}
              />
              <div>
                <h3 className="text-base font-medium text-ink">{video.item.title}</h3>
                {video.item.description && (
                  <p className="mt-1 text-sm text-slate">{video.item.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

function VideoPlayer({
  video,
  playing,
  onPlay,
}: {
  video: ResolvedVideo;
  playing: boolean;
  onPlay: () => void;
}) {
  const { item, source, poster } = video;

  if (!playing) {
    return (
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${item.title}`}
        className="group block w-full text-left"
      >
        <VideoThumbnail video={video} size="lg" />
      </button>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-ink">
      {source.kind === "file" ? (
        <video
          src={source.src}
          poster={poster}
          controls
          autoPlay
          playsInline
          className="h-full w-full"
          aria-label={item.title}
        />
      ) : (
        <iframe
          src={
            source.kind === "youtube"
              ? `https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&rel=0`
              : `https://player.vimeo.com/video/${source.id}?autoplay=1`
          }
          title={item.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="h-full w-full border-0"
        />
      )}
    </div>
  );
}

function VideoThumbnail({ video, size }: { video: ResolvedVideo; size: "sm" | "lg" }) {
  const { item, poster } = video;
  const playSize = size === "lg" ? "h-14 w-14" : "h-8 w-8";
  const iconSize = size === "lg" ? "h-6 w-6" : "h-4 w-4";

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-primary">
      {poster && (
        <img
          src={poster}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-ink/20 transition group-hover:bg-ink/30">
        <span
          className={`flex items-center justify-center rounded-full bg-accent text-surface shadow-lg ${playSize}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={`ml-0.5 ${iconSize}`}>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
      {item.duration && size === "lg" && (
        <span className="absolute bottom-2 right-2 rounded-sm bg-ink/80 px-1.5 py-0.5 text-xs font-medium text-surface">
          {item.duration}
        </span>
      )}
    </div>
  );
}
