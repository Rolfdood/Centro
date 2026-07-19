"use client";

import { COMPOSER_TONES, type ComposerTone } from "@/stores/composerStore";

interface ToneSelectorProps {
  value: ComposerTone;
  onChange: (tone: ComposerTone) => void;
}

function formatTone(tone: ComposerTone): string {
  return tone.charAt(0) + tone.slice(1).toLowerCase();
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="font-mono uppercase tracking-wide">Tone</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as ComposerTone)}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {COMPOSER_TONES.map((tone) => (
          <option key={tone} value={tone}>
            {formatTone(tone)}
          </option>
        ))}
      </select>
    </label>
  );
}
