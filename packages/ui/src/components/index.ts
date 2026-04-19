export interface StickerLabelProps {
  text: string;
  accent: "pink" | "cyan" | "lime";
}

export function createStickerLabel(props: StickerLabelProps) {
  return {
    text: props.text.toUpperCase(),
    accent: props.accent,
    rotation: props.accent === "pink" ? "-3deg" : props.accent === "cyan" ? "2deg" : "-1deg",
  };
}

export function glitchText(text: string) {
  return `${text} // ${text}`;
}
