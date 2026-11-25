// CongoFlow — génération des 17 images de démonstration (→ WebP)
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT = '/home/z/my-project/scripts/congoflow/images';

const STYLE = 'realistic warm photography, authentic Kinshasa DR Congo atmosphere, golden evening light, rich tones with dark reds and deep blacks, a few off-white highlights, diverse joyful fictional people in natural situations, no readable text, no brand logos, high quality, detailed, professional photography';

// A — Affiches d'événements (portrait 4:5 → 864x1152)
const posters = [
  { id: 'rumba',    p: 'Outdoor rumba concert at night in Kinshasa, stage bathed in deep red and dark spotlights, singer with guitar, crowd with hands raised, warm atmosphere, ' + STYLE },
  { id: 'club',     p: 'Dance party inside a stylish club, red and golden lights, silhouettes of people dancing joyfully, bokeh, ' + STYLE },
  { id: 'conf',     p: 'Young entrepreneurs conference in a modern hall, confident female speaker on stage with microphone, attentive seated audience, sober professional ambiance, ' + STYLE },
  { id: 'foot',     p: 'Neighborhood football tournament at sunset in Kinshasa, dusty pitch, players in colorful jerseys, cheering supporters around the field, ' + STYLE },
  { id: 'wax',      p: 'African wax print fashion fair, colorful fabric stands with bold patterns, elegant models in wax outfits, joyful crowd browsing, ' + STYLE },
  { id: 'gospel',   p: 'Gospel choir concert, singers in matching outfits, warm stage light, raised hands, spiritual joyful atmosphere, ' + STYLE },
  { id: 'gastro',   p: 'Outdoor gastronomy festival at dusk on a terrace, tables with Congolese dishes, string lights above, people tasting food and laughing, ' + STYLE },
  { id: 'roof',     p: 'Birthday rooftop party at night with view over Kinshasa skyline and Congo river, friends toasting with glasses, warm string lights, ' + STYLE },
];

// C — Fonds section 3 (paysage 3:2 → 1152x864)
const scenes = [
  { id: 'crowd',  p: 'Joyful crowd at an outdoor concert, hands raised, golden backlight silhouettes, ' + STYLE },
  { id: 'friends',p: 'Group of friends laughing at an evening party, warm festive lights, candid moment, ' + STYLE },
  { id: 'dancers',p: 'Dancers in motion with slight motion blur, colorful outfits, evening celebration, ' + STYLE },
  { id: 'hall',   p: 'Wide view of a festive hall with string lights, round tables, dark red warm atmosphere, ' + STYLE },
];

// D — Auth (portrait 3:4 → 864x1152 ; mobile 9:16 → recadrage WebP)
const auth = [
  { id: 'concert', p: 'Crowd at a live concert at night, hands in the air, red stage glow, ' + STYLE },
  { id: 'dance',   p: 'Friends dancing together at a party, joyful energy, warm golden lights, ' + STYLE },
  { id: 'orga',    p: 'Female event organizer speaking on stage with a microphone, confident smile, evening event, ' + STYLE },
  { id: 'street',  p: 'Lively Kinshasa street at dusk, boulevards, colorful storefronts, street life, warm city lights, ' + STYLE },
  { id: 'culture', p: 'Family and friends at a cultural event, traditional and modern outfits mingling, sharing a warm moment, ' + STYLE },
];

const jobs = [
  ...posters.map(j => ({ ...j, size: '864x1152', tag: 'poster' })),
  ...scenes.map(j => ({ ...j, size: '1152x864', tag: 'scene' })),
  ...auth.map(j => ({ ...j, size: '864x1152', tag: 'auth' })),
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const zai = await ZAI.create();
  let ok = 0, fail = 0;
  for (const j of jobs) {
    const out = path.join(OUT, `${j.tag}-${j.id}.png`);
    if (fs.existsSync(out) && fs.statSync(out).size > 10000) { console.log('skip', j.id); ok++; continue; }
    let done = false;
    for (let a = 1; a <= 3 && !done; a++) {
      try {
        const r = await zai.images.generations.create({ prompt: j.p, size: j.size });
        const b64 = r?.data?.[0]?.base64;
        if (!b64) throw new Error('empty');
        fs.writeFileSync(out, Buffer.from(b64, 'base64'));
        console.log('OK', j.tag + '-' + j.id, fs.statSync(out).size);
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
