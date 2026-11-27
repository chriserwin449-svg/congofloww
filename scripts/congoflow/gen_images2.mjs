// CongoFlow — génération des affiches multi-villes (→ WebP via conv2.py)
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT = '/home/z/my-project/scripts/congoflow/images';

const STYLE = 'realistic warm photography, authentic DR Congo atmosphere, golden evening light, rich tones with dark reds and deep blacks, a few off-white highlights, diverse joyful fictional people in natural situations, no readable text, no brand logos, high quality, detailed, professional photography';

const posters = [
  { id: 'lubi',     p: 'Open-air rumba concert at dusk in Lubumbashi, highland plateau horizon with copper mining hills, warm stage lights, joyful crowd dancing, ' + STYLE },
  { id: 'goma',     p: 'Group of adventurous friends with headlamps hiking at night on the volcanic slopes of Mount Nyiragongo near Goma, faint red lava glow on the horizon, dramatic starry sky, ' + STYLE },
  { id: 'kivu',     p: 'Lakeside evening gathering on the shores of Lake Kivu in Goma, string lights between palm trees, wooden boats silhouettes on calm water, friends laughing around a warm fire, ' + STYLE },
  { id: 'boma',     p: 'Heritage festival in Boma, historic seaside architecture in the background, traditional Kongo dancers in colorful costumes performing for a warm respectful crowd, ' + STYLE },
  { id: 'matadi',   p: 'Sunrise charity run crossing a large steel bridge over the wide Congo river near Matadi, runners in colorful jerseys, soft mist over the water, ' + STYLE },
  { id: 'kisan',    p: 'Cultural festival on the banks of the Congo river in Kisangani at golden hour, pirogues with musicians approaching the shore, joyful crowd waving, ' + STYLE },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const zai = await ZAI.create();
  let ok = 0, fail = 0;
  for (const j of posters) {
    const out = path.join(OUT, `poster-${j.id}.png`);
    if (fs.existsSync(out) && fs.statSync(out).size > 10000) { console.log('skip', j.id); ok++; continue; }
    let done = false;
    for (let a = 1; a <= 3 && !done; a++) {
      try {
        const r = await zai.images.generations.create({ prompt: j.p, size: '864x1152' });
        const b64 = r?.data?.[0]?.base64;
        if (!b64) throw new Error('empty');
        fs.writeFileSync(out, Buffer.from(b64, 'base64'));
        console.log('OK', 'poster-' + j.id, fs.statSync(out).size);
        ok++; done = true;
      } catch (e) {
        console.log('retry', j.id, a, String(e.message || e).slice(0, 120));
        await new Promise(r => setTimeout(r, 1200 * a));
      }
    }
    if (!done) { fail++; console.log('FAIL', j.id); }
  }
  console.log('DONE ok=' + ok + ' fail=' + fail);
}
main().catch(e => { console.error(e); process.exit(1); });
