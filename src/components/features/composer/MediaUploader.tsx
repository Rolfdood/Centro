"use client";

import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { ComposerMedia } from "@/stores/composerStore";

interface MediaUploaderProps {
  media: ComposerMedia[];
  onChange: (media: ComposerMedia[]) => void;
}

function createMediaId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function MediaUploader({ media, onChange }: MediaUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null): void {
    if (!files) {
      return;
    }

    const additions = Array.from(files)
      .filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"))
      .map<ComposerMedia>((file) => ({
        id: createMediaId(file),
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
        sizeBytes: file.size,
        mimeType: file.type,
      }));

    const knownIds = new Set(media.map((item) => item.id));
    onChange([...media, ...additions.filter((item) => !knownIds.has(item.id))]);
  }

  function removeMedia(mediaId: string): void {
    const item = media.find((candidate) => candidate.id === mediaId);
    if (item?.url.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
    }
    onChange(media.filter((item) => item.id !== mediaId));
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-5" aria-labelledby="media-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="media-heading" className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Media
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Add local images or video to validate platform requirements. Uploading happens when publishing is available.
          </p>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*,video/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2" />
          Add media
        </Button>
      </div>

      {media.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ImagePlus className="size-4" />
          Choose images or video
        </button>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Selected media">
          {media.map((item) => (
            <li key={item.id} className="relative overflow-hidden rounded-md border border-border bg-background">
              {item.type === "VIDEO" ? (
                <video className="aspect-square w-full object-cover" src={item.url} muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- local previews use object URLs before uploads exist.
                <img className="aspect-square w-full object-cover" src={item.url} alt="Selected media preview" />
              )}
              <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-1.5">
                <span className="font-mono text-[10px] text-muted-foreground">{item.type.toLowerCase()}</span>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeMedia(item.id)} aria-label="Remove media">
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
