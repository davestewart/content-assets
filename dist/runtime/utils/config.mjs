import { matchTokens } from "./string.mjs";
export const extensions = {
  // used to get image size
  image: matchTokens("png jpg jpeg gif svg webp ico"),
  // unused for now
  media: matchTokens("mp3 m4a wav mp4 mov webm ogg avi flv avchd")
};
export function makeIgnores(extensions2) {
  const included = matchTokens(extensions2).join("|");
  return `^(?:(?!(${included})).)+$`;
}
