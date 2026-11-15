import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BG = "#07140c";
const GREEN = "#3dff9a";
const LIME = "#d6ff78";
const DIM = "#1f6b45";
const MID = "#2f8f5c";
const AMBER = "#ffc14a";

const radar = ({ size, cx, cy, radius, showWord }) => `
  <g>
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${DIM}" stroke-width="${Math.max(4, size / 140)}"/>
    <circle cx="${cx}" cy="${cy}" r="${radius * 0.66}" fill="none" stroke="${MID}" stroke-width="${Math.max(3, size / 180)}"/>
    <circle cx="${cx}" cy="${cy}" r="${radius * 0.33}" fill="none" stroke="${GREEN}" stroke-width="${Math.max(3, size / 180)}"/>
    <line x1="${cx - radius}" y1="${cy}" x2="${cx + radius}" y2="${cy}" stroke="${DIM}" stroke-width="${Math.max(2, size / 280)}" opacity="0.7"/>
    <line x1="${cx}" y1="${cy - radius}" x2="${cx}" y2="${cy + radius}" stroke="${DIM}" stroke-width="${Math.max(2, size / 280)}" opacity="0.7"/>
    <path d="M${cx} ${cy} L${cx} ${cy - radius} A${radius} ${radius} 0 0 1 ${cx + radius * 0.82} ${cy - radius * 0.57} Z" fill="${GREEN}" opacity="0.28"/>
    <line x1="${cx}" y1="${cy}" x2="${cx + radius * 0.78}" y2="${cy - radius * 0.52}" stroke="${LIME}" stroke-width="${Math.max(6, size / 90)}" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="${Math.max(8, size / 70)}" fill="${LIME}"/>
    <g transform="translate(${cx + radius * 0.42} ${cy - radius * 0.28}) rotate(-32)">
      <polygon points="0,${-size / 28} ${size / 70},${size / 36} 0,${size / 55} ${-size / 70},${size / 36}" fill="${AMBER}"/>
    </g>
    ${showWord ? `<text x="${cx}" y="${cy + radius + size * 0.11}" text-anchor="middle" font-family="JetBrains Mono, DejaVu Sans Mono, monospace" font-size="${Math.round(size * 0.085)}" font-weight="700" fill="${LIME}" letter-spacing="${Math.round(size * 0.012)}">YNK</text>` : ""}
  </g>
`;

function iconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${BG}"/>
  ${radar({ size: 1024, cx: 512, cy: 470, radius: 300, showWord: true })}
</svg>`;
}

function foregroundSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${radar({ size: 1024, cx: 512, cy: 512, radius: 250, showWord: false })}
</svg>`;
}

function splashSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  <rect width="2732" height="2732" fill="${BG}"/>
  ${radar({ size: 2732, cx: 1366, cy: 1180, radius: 460, showWord: false })}
  <text x="1366" y="1820" text-anchor="middle" font-family="JetBrains Mono, DejaVu Sans Mono, monospace" font-size="132" font-weight="700" fill="${LIME}" letter-spacing="18">YNK AIR TRAFFIC</text>
  <text x="1366" y="1940" text-anchor="middle" font-family="Inter, DejaVu Sans, sans-serif" font-size="64" fill="#9dccb0" letter-spacing="16">YOUNEEK</text>
</svg>`;
}

async function pngFromSvg(svg, width, height, file) {
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .flatten({ background: BG })
    .png()
    .toFile(file);
}

async function main() {
  const root = process.cwd();
  const assets = path.join(root, "assets");
  const icons = path.join(root, "public", "icons");
  const store = path.join(root, "docs", "app-store");
  await mkdir(assets, { recursive: true });
  await mkdir(icons, { recursive: true });
  await mkdir(store, { recursive: true });

  const icon = iconSvg();
  const foreground = foregroundSvg();
  const splash = splashSvg();
  await pngFromSvg(icon, 1024, 1024, path.join(assets, "icon-only.png"));
  await pngFromSvg(icon, 1024, 1024, path.join(store, "icon-1024.png"));
  await sharp(Buffer.from(foreground)).resize(1024, 1024).png().toFile(path.join(assets, "icon-foreground.png"));
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: BG },
  }).png().toFile(path.join(assets, "icon-background.png"));
  await pngFromSvg(splash, 2732, 2732, path.join(assets, "splash.png"));
  await pngFromSvg(splash, 2732, 2732, path.join(assets, "splash-dark.png"));
  await pngFromSvg(icon, 192, 192, path.join(icons, "icon-192.png"));
  await pngFromSvg(icon, 512, 512, path.join(icons, "icon-512.png"));
  await pngFromSvg(icon, 180, 180, path.join(icons, "apple-touch-icon.png"));
  await writeFile(path.join(assets, "icon-source.svg"), icon);
  await writeFile(path.join(assets, "splash-source.svg"), splash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
