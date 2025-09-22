// src/lib/avatar.js
export function dicebearAvatar(seed, size = 256, style = "bottts") {
  return `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(
    seed
  )}&size=${size}`;
}
