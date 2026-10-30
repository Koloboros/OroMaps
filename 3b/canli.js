// Oro'nun canlı dünyası: gemiler, kervanlar, ordular, kuşlar, ejderhalar, okullar, portallar, Nebrukaddesar.
// Rotalar yollar.json'dadır; yükseklik haritası üzerinde A* ile hesaplandı, kıyıya ve denize taşmaz.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const P = { neb: 'Nebrukaddesar' };
const SEDEF = '#f4ecdc', CAM = '#12291f', ALTIN = '#d9a93a', KIRMIZI = '#9a2828';

export async function initLife(ctx) {
  const { scene, camera, controls, canvas, fToXZ, groundY, sRGB, glowTex, snapToLand, openCodex, getMode, W, D } = ctx;
  const yol = await (await fetch('yollar.json')).json();
  const root = new THREE.Group(); scene.add(root);
  const G = (x, z) => Math.max(groundY(x, z), 0);

  // ---------- küçük geometri kiti: düz gölgeli, köşe renkli ----------
  const col = new THREE.Color();
  const paint = (geo, hex) => {
    const g = geo.index ? geo.toNonIndexed() : geo; g.deleteAttribute('uv'); if (!g.attributes.normal) g.computeVertexNormals();
    col.copy(sRGB(hex)); const n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) a.set([col.r, col.g, col.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
  };
  const at = (g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => { g.scale(sx, sy, sz); g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); return g; };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d), cyl = (a, b, h, n = 6) => new THREE.CylinderGeometry(a, b, h, n), cone = (r, h, n = 6) => new THREE.ConeGeometry(r, h, n), ico = (r, d = 0) => new THREE.IcosahedronGeometry(r, d);
  const M = (...l) => { const g = mergeGeometries(l); g.computeVertexNormals(); return g; };
  function hull(len, wid, hgt, hex) {
    const g = new THREE.BoxGeometry(wid, hgt, len, 1, 1, 6), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const z = p.getZ(i) / (len / 2), y = p.getY(i); const pinch = 1 - Math.pow(Math.abs(z), 2.4) * .92; p.setX(i, p.getX(i) * pinch * (y < 0 ? .72 : 1)); p.setY(i, y + Math.pow(Math.abs(z), 2) * hgt * .45); }
    return paint(g, hex);
  }
  function sail(w, h, hex) {
    const g = new THREE.PlaneGeometry(w, h, 4, 3), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (w / 2), y = p.getY(i) / (h / 2); p.setZ(i, (1 - x * x) * (1 - y * y * .6) * h * .2); }
    return paint(g, hex);
  }
  function shipGeo(sailHex, hullHex, trim) {
    return M(hull(6, 1.7, 1, hullHex), at(paint(box(1.35, .1, 4.4), '#8a6a44'), 0, .5), at(paint(cyl(.07, .1, 5), '#3a2a1c'), 0, 2.8, .2), at(paint(cyl(.05, .07, 3.4), '#3a2a1c'), 0, 2.1, -1.7),
      at(paint(box(3.1, .08, .08), '#3a2a1c'), 0, 4.7, .3), at(sail(3, 3, sailHex), 0, 3.2, .35), at(sail(2, 2, sailHex), 0, 2.4, -1.6),
      at(paint(box(.05, .6, .9), trim), 0, 5.4, .2), at(paint(box(1.2, .55, 1), '#6a4c30'), 0, .85, -2));
  }
  const boatGeo = M(hull(3, 1, .6, '#6a4c30'), at(paint(cyl(.04, .05, 2.2), '#3a2a1c'), 0, 1.3, .2), at(sail(1.2, 1.5, '#d8c9a4'), 0, 1.5, .28), at(paint(ico(.2), '#2a3a44'), 0, .55, -.8));
  const camelGeo = (load) => M(at(paint(box(.6, .65, 1.5), '#b08a58'), 0, 1.25), at(paint(ico(.45), '#a07c4c'), 0, 1.7, -.1), at(paint(cyl(.13, .18, .95), '#b08a58'), 0, 1.8, .9, .7), at(paint(box(.24, .24, .55), '#a07c4c'), 0, 2.2, 1.28),
    ...[[-.2, .55], [.2, .55], [-.2, -.55], [.2, -.55]].map(([x, z]) => at(paint(cyl(.07, .05, 1), '#8a6c44'), x, .5, z)),
    at(paint(box(.95, .42, .6), load), 0, 1.95, -.1), at(paint(box(.3, .3, .3), KIRMIZI), .45, 1.65, .2));
  const riderGeo = (cloak, flag) => M(at(paint(box(.42, .5, 1.3), '#4a3426'), 0, 1), at(paint(box(.2, .5, .22), '#4a3426'), 0, 1.45, .7, .5), at(paint(box(.2, .22, .5), '#3a2a1e'), 0, 1.7, .9),
    ...[[-.14, .5], [.14, .5], [-.14, -.5], [.14, -.5]].map(([x, z]) => at(paint(cyl(.06, .05, .8), '#3a2a1e'), x, .4, z)), at(paint(cone(.36, 1, 5), cloak), 0, 1.6, -.05), at(paint(ico(.17), '#c9a27a'), 0, 2.2, -.05),
    ...(flag ? [at(paint(cyl(.025, .03, 2.4), '#3a2a1c'), .28, 2.2, -.2), at(paint(box(.04, .46, .7), flag), .28, 3.1, .15)] : []));
  const soldierGeo = (body, shield, helm) => M(at(paint(cyl(.2, .3, .95, 5), body), 0, .75), at(paint(cyl(.09, .1, .5, 4), '#2a2420'), -.11, .25), at(paint(cyl(.09, .1, .5, 4), '#2a2420'), .11, .25), at(paint(ico(.17), helm), 0, 1.38), at(paint(cone(.17, .3, 5), helm), 0, 1.55),
    at(paint(box(.07, .62, .5), shield), .3, .85, .12), at(paint(cyl(.02, .02, 2.1, 4), '#4a3a2a'), -.3, 1, .35, .45));
  const birdGeo = (hex) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .4, 0, 0, -.5, -1.2, .3, -.15, 0, 0, .4, 1.2, .3, -.15, 0, 0, -.5], 3)); return paint(g, hex); };
  const wingGeo = M(at(paint(ico(.34), '#b8a27a'), 0, 0, 0, 0, 0, 0, 1, .9, 1.7), at(paint(ico(.24), '#e8dcc0'), 0, .2, .55), at(paint(cone(.09, .3, 4), '#d9a93a'), 0, .17, .85, 1.57),
    at(paint(box(.34, .55, .34), '#9a2828'), 0, -.55), at(paint(box(4, .05, .9), '#d8cdb4'), 0, .05, -.05), at(paint(box(2, .05, .55), '#8a7050'), 0, .08, -.5), at(paint(cyl(.02, .02, 1.8, 4), '#3a2a1c'), .2, -.2, .3, 1.2));

  class Kind {
    constructor(geo, n, opts = {}) {
      this.m = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: opts.single ? THREE.FrontSide : THREE.DoubleSide }), n);
      this.m.frustumCulled = false; this.m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.m.count = 0; root.add(this.m); this.i = 0; this.max = n;
    }
    begin() { this.i = 0; }
    put(x, y, z, yaw, s, sy = s, rx = 0, rz = 0) {
      if (this.i >= this.max) return;
      Kind.e.set(rx, yaw, rz, 'YXZ'); Kind.q.setFromEuler(Kind.e); Kind.p.set(x, y, z); Kind.s.set(s, sy, s);
      this.m.setMatrixAt(this.i++, Kind.m4.compose(Kind.p, Kind.q, Kind.s));
    }
    end() { this.m.count = this.i; this.m.instanceMatrix.needsUpdate = true; }
  }
  Object.assign(Kind, { e: new THREE.Euler(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), m4: new THREE.Matrix4() });
  const K = {
    shipW: new Kind(shipGeo('#efe6d2', '#5a3e28', KIRMIZI), 8), shipR: new Kind(shipGeo('#a8322a', '#4a3020', ALTIN), 6), shipB: new Kind(shipGeo('#26262e', '#2a2420', '#8a8a96'), 4), shipG: new Kind(shipGeo('#2c5a48', '#3a2c20', ALTIN), 4),
    boat: new Kind(boatGeo, 30), camel: new Kind(camelGeo('#7a2a22'), 40), camelG: new Kind(camelGeo('#d8c9a4'), 30),
    envoy: new Kind(riderGeo('#efe6d2', KIRMIZI), 8), envoyD: new Kind(riderGeo('#3a3438', '#7a1f1a'), 4), ucm: new Kind(riderGeo('#a8562e', '#a8562e'), 14), guard: new Kind(riderGeo('#5a4632'), 16),
    solA: new Kind(soldierGeo('#3e3a3a', '#6a1c18', '#6a6a72'), 190, { single: true }), solB: new Kind(soldierGeo('#d8d2c2', '#2f5a7a', '#b8a050'), 190, { single: true }),
    bird: new Kind(birdGeo('#3a3a3e'), 90), birdW: new Kind(birdGeo('#e0d8c8'), 60), owl: new Kind(wingGeo, 6), raven: new Kind(M(birdGeo('#14141a'), at(paint(ico(.22), '#14141a'), 0, 0, 0, 0, 0, 0, 1, 1, 2)), 3),
    arrow: new Kind(M(at(paint(box(.03, .03, 1.5), '#2a2420'), 0, 0, 0)), 40, { single: true }), worm: new Kind(paint(ico(1, 1), '#d8b890'), 18, { single: true }),
  };

  // ---------- rotalar ----------
  class Route {
    constructor(pts, loop = false) {
      this.p = pts.map(([x, y]) => fToXZ(x, y)); this.loop = loop; this.c = [0];
      for (let i = 1; i < this.p.length; i++) this.c.push(this.c[i - 1] + Math.hypot(this.p[i][0] - this.p[i - 1][0], this.p[i][1] - this.p[i - 1][1]));
      this.len = this.c[this.c.length - 1];
    }
    at(d) {
      d = Math.max(0, Math.min(this.len, d)); let a = 0, b = this.c.length - 1;
      while (b - a > 1) { const m = (a + b) >> 1; if (this.c[m] <= d) a = m; else b = m; }
      const f = (d - this.c[a]) / ((this.c[b] - this.c[a]) || 1), A = this.p[a], B = this.p[b];
      return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f];
    }
    // gidiş-dönüş: limanda bekler, sonra döner
    swing(u, wait = 6) { const L = this.len, T = 2 * (L + wait); let v = ((u % T) + T) % T; if (v < L) return [v, 1]; v -= L; if (v < wait) return [L, 1]; v -= wait; if (v < L) return [L - v, -1]; return [0, 1]; }
  }
  const R = {}; for (const k in yol) if (k[0] !== '_') R[k] = new Route(yol[k], k === 'obal');
  const yawAt = (r, d, dir) => { const [a, b] = r.at(d), [c, e] = r.at(d + 3 * dir); return Math.atan2(c - a, e - b); };

  // ---------- hikâyesi olan birimler ----------
  const actors = [];
  const actor = (o) => { o.pos = new THREE.Vector3(...(o.at || [0, 0, 0])); actors.push(o); return o; };
  const LINK = { sozluk: '<a class="buy" href="https://koloboros.com/oro-sozlugu/" target="_blank" rel="noopener">Oro Sözlüğü</a>', kron: '<a class="buy" href="https://koloboros.com/oro-kronolojisi/" target="_blank" rel="noopener">Oro Kronolojisi</a>' };
  const SHIPS = [
    { k: 'shipW', r: 's_mer', v: 5.2, ph: 0, n: 'Mermer Gemisi', s: 'Payendegân ticareti', d: 'Sütunlu Adaları’nın kutsal, damarsız mermerini kıyı eyaletlerine taşır.', ids: [772] },
    { k: 'shipW', r: 's_mer', v: 4.4, ph: 220, n: 'Zenon Tüccarı', s: 'Payendegân ticareti', d: 'Zenon, Sütunlu ve Bekleyentaş arasında mal ve yolcu taşıyan yük gemisi.', ids: [772] },
    { k: 'shipB', r: 's_kar', v: 4.8, ph: 90, n: 'Karatüy Elçi Gemisi', s: 'Pofova · Karatüy Krallığı', d: 'Krallık, Puldöken’i Payendegân’dan bir kez daha resmen talep etmeye gidiyor. Cevabı herkes biliyor.', ids: [644, 565] },
    { k: 'shipG', r: 's_sum', v: 4, ph: 40, n: 'Kartograf Gemisi', s: 'Sümükeli', d: 'Haritaya dökülen her yol Fanusar’a bir ibadettir. Sümükeli kartografları kıyıları ölçerek ilerler.', ids: [906] },
    { k: 'shipR', r: 's_cer', v: 6, ph: 0, n: 'Ceremo Yolcuları', s: 'Ro’dan Ceremo’ya', d: 'Cennet-ül Arz’a varmanın iki yolu bilinir; bu gemilerdekiler ikisini de göze alamamış, kıyıda dua etmeye gidiyor.', ids: [] },
    { k: 'shipR', r: 's_cer', v: 5.4, ph: 900, n: 'Baharat Gemisi', s: 'Batıkdeniz', d: 'Doğunun malını Payendegân limanlarına indiren uzun yol gemisi.', ids: [772] },
    { k: 'shipB', r: 's_nih', v: 3.8, ph: 150, n: 'Nihülus Kaçakçısı', s: 'Yasak sular', d: 'Mana’nın tükendiği kıyılardan dönen gemilerin ne taşıdığı sorulmaz.', ids: [] },
    { k: 'shipW', r: 's_bat', v: 5.6, ph: 300, n: 'Uzun Yol Gemisi', s: 'Payendegân · Pofova hattı', d: 'İki kıyı arasında mektup, tuz ve dedikodu taşır.', ids: [772] },
    { k: 'shipG', r: 's_bat', v: 4.6, ph: 1000, n: 'Korlehçe Tüccarlar', s: 'Yutakdeniz', d: 'Korlehçe pazarın, ordunun ve yeminin dilidir; denizde de geçer akçedir.', ids: [] },
  ].map(o => ({ ...o, route: R[o.r], a: actor({ n: o.n, s: o.s, d: o.d, ids: o.ids, kind: 'ship' }) }));
  const CAR = [
    { r: 'k_surt', k: 'camel', n: 7, v: 1.7, ph: 40, nm: 'Sürtünkaya Kervanı', s: 'Karguşa yolu', d: 'Yosun yeşili ormanlardan kükürtlü koylara, Yaşruk köylerinden Solucan Vadisi’nin eşiğine uzanan yük yolu.', ids: [666, 575] },
    { r: 'k_surt', k: 'camelG', n: 5, v: 1.4, ph: 420, nm: 'Taşsürek Çeliği Kervanı', s: 'Sürtünkaya', d: 'Oro’nun en ağır alaşımını taşıyan kervan; muhafızı malından çok korkar.', ids: [666] },
    { r: 'k_tuz', k: 'camelG', n: 8, v: 1.6, ph: 120, nm: 'Tuz Kervanı', s: 'Kavurova', d: 'Küfkent’in evleri lanete karşı tuzla kaplanır; bu develer o tuzu Haarbova’ya taşır.', ids: [595, 724] },
    { r: 'k_tis', k: 'camel', n: 5, v: 1.5, ph: 60, nm: 'Tıskent Yolu', s: 'Zerksoy diyarı', d: 'Yobuzcuk böcekleri kervanın ardından gelir; nerede Zerksoy, orada ölü deri vardır.', ids: [531] },
    { r: 'k_pay', k: 'camel', n: 6, v: 1.8, ph: 10, nm: 'Çiftçenet Kervanı', s: 'Payendegân', d: 'Bereketli vadilerin mahsulü payitahtın ambarlarına iner.', ids: [772] },
    { r: 'k_tos', k: 'camelG', n: 4, v: 1.3, ph: 0, nm: 'Tosparlak Yolcuları', s: 'Or', d: 'Deniz aşırı kıtanın dolambaçlı yollarında, adı henüz yazılmamış tüccarlar.', ids: [] },
  ].map(o => ({ ...o, route: R[o.r], a: actor({ n: o.nm, s: o.s, d: o.d, ids: o.ids, kind: 'kervan' }) }));
  const ENV = [
    { r: 'e_pay', k: 'envoy', v: 4.6, ph: 0, n: 'Yüce Meclis Elçisi', s: 'Payendegân’dan Bozgunluk’a', d: 'Mühürlü ferman taşır. Dermançöl’de ona okunacak tek cevap, kılıcın sesidir.', ids: [772, 789] },
    { r: 'e_pay', k: 'envoyD', v: 5, ph: 400, n: 'Haşmetşah Ulağı', s: 'Dermançöl', d: 'Lordlara haraç vaktini hatırlatır; hatırlatma ikinci kez yapılmaz.', ids: [789] },
    { r: 'e_tis', k: 'envoy', v: 4.2, ph: 60, n: 'Tıskent Ulağı', s: 'Bin Yıllık Sözleşme', d: 'Sözleşmenin bedelini hatırlatmak için Kavurova’ya inen Zerksoy elçisi.', ids: [531, 595] },
    { r: 'e_cer', k: 'envoy', v: 3.8, ph: 30, n: 'İsimur’un Kâtibi', s: 'Ceremo Vilayeti', d: 'Başkâtip için rivayet toplar. Tarihler zaman zaman tutmaz; yalnızca hatırlayanın elinde can çekişir.', ids: [] },
    { r: 'e_pof', k: 'envoyD', v: 4, ph: 0, n: 'Karatüy Ulağı', s: 'Pofova', d: 'Krallığın sürgün yurdundaki haberleri taşır.', ids: [565] },
  ].map(o => ({ ...o, route: R[o.r], a: actor({ n: o.n, s: o.s, d: o.d, ids: o.ids, kind: 'elci' }) }));
  const OBA = actor({ n: 'Uçmakan Obası', s: 'Haarbova · “Qul bolma!”', d: 'Onlar için durmak çürümektir; yol, evin kendisidir. Göç vakti, göğün tepesinde kara kartal göründüğünde gelir.', ids: [724], kind: 'oba' });

  // ---------- balıkçılar ----------
  const FISH = yol._balik.map(([x, y], i) => { const [X, Z] = fToXZ(x, y); return { X, Z, r: 7 + i % 3 * 3, a: actor({ n: 'Balıkçılar', s: ['Alev Burun', 'Titreksu kıyısı', 'Ceremo sahili', 'Pofova', 'Zenon', 'Sümükeli', 'Sütunlu', 'Ceremo sahili'][i], d: 'Ağlarını serpip akşama dönerler. Kıyı halkının karnını doyuran asıl filo budur.', ids: i === 1 ? [575] : [], kind: 'balikci', at: [X, 0, Z] }) }; });

  // ---------- kuş sürüleri ----------
  const FLOCK = [[728, 940, 0], [731, 532, 0], [802, 411, 0], [640, 415, 0], [1325, 290, 1], [300, 810, 0], [246, 90, 1], [905, 225, 0], [825, 800, 1], [615, 143, 0], [657, 926, 1], [378, 612, 1]].map(([x, y, w], i) => { const [X, Z] = fToXZ(x, y); return { X, Z, Y: G(X, Z) + 16, w, n: 7, ph: i * 1.7 }; });

  // ---------- savaş ----------
  const BAT = (() => { const [X, Z] = fToXZ(930, 520), a = .5, tx = Math.cos(a), tz = Math.sin(a), nx = -tz, nz = tx, list = [];
    for (const s of [-1, 1]) for (let r = 0; r < 6; r++) for (let c = -15; c < 16; c++) { const j1 = Math.sin(c * 12.9 + r * 4.1) * .5, j2 = Math.cos(c * 7.3 + r * 9.7) * .5; const px = X + tx * (c * 2 + j1), pz = Z + tz * (c * 2 + j1); list.push({ s, r, px, pz, j: j2, ph: c * 1.3 + r, y: G(px, pz) }); }
    return { X, Z, tx, tz, nx, nz, list, a: actor({ n: 'Haarbova Seferleri', s: 'S.S.S. 566 · Kavurova', d: 'Payendegân’ın Deryamızrak alayları ile Dermançöl’ün Azman Ocakları çölün ortasında kilitlendi. İki devletin kaderi burada yazılıyor.', ids: [789, 661, 772], kind: 'savas', tag: 'Haarbova Seferleri', at: [X, G(X, Z) + 2, Z] }) }; })();
  const dust = [], spark = [];
  const dustMat = new THREE.SpriteMaterial({ map: glowTex, color: sRGB('#c9a878'), transparent: true, opacity: .2, depthWrite: false, fog: true });
  for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(dustMat.clone()); root.add(s); dust.push({ s, ph: i * 1.1, c: (i - 6) * 5 }); }
  for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: sRGB('#ffb050'), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false })); root.add(s); spark.push({ s, ph: i * 2.3, c: (i - 7) * 4 }); }
  const banners = []; { const pole = new THREE.CylinderGeometry(.06, .08, 6, 5); for (const [s, c, hex] of [[-1, -10, '#7a1f1a'], [-1, 0, '#7a1f1a'], [-1, 10, '#7a1f1a'], [1, -10, '#2f5a7a'], [1, 0, '#efe6d2'], [1, 10, '#2f5a7a']]) { const g = new THREE.Group(); g.add(new THREE.Mesh(pole, new THREE.MeshLambertMaterial({ color: sRGB('#3a2a1c') }))); const f = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshLambertMaterial({ color: sRGB(hex), side: THREE.DoubleSide })); f.position.set(1.2, 2.2, 0); g.add(f); g.userData = { s, c, f }; root.add(g); banners.push(g); } }

  // ---------- Paluzi ----------
  const WORM = (() => { const [X, Z] = fToXZ(826, 640); return { X, Z, a: actor({ n: 'Paluzi Solucanı', s: 'Solucan Vadisi', d: 'Bütün çölün ocağını yakan nimet. Bugün yalnızca burada, nadiren görülür.', ids: [595], kind: 'solucan', at: [X, G(X, Z) + 1, Z] }) }; })();

  // ---------- ejderânlar ----------
  const dragons = [];
  function dragon(c1, c2) {
    const m1 = new THREE.MeshLambertMaterial({ color: sRGB(c1), flatShading: true }), m2 = new THREE.MeshLambertMaterial({ color: sRGB(c2), flatShading: true, side: THREE.DoubleSide }), g = new THREE.Group();
    const add = (geo, x, y, z, rx = 0, m = m1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.x = rx; g.add(o); return o; };
    const b = add(new THREE.IcosahedronGeometry(1.5, 1), 0, 0, 0); b.scale.set(.85, .8, 2.3);
    add(new THREE.ConeGeometry(.75, 4, 6), 0, .7, 3.8, 1.2); const h = add(new THREE.BoxGeometry(.8, .6, 1.8), 0, 1.5, 5.8); h.rotation.x = .1;
    for (const s of [-1, 1]) { const horn = add(new THREE.ConeGeometry(.12, 1.1, 4), s * .35, 2, 5.1, -.9, m2); horn.rotation.z = -s * .2; const horn2 = add(new THREE.ConeGeometry(.1, .8, 4), s * .22, 2, 5.7, -.9, m2); horn2.rotation.z = -s * .15; }
    add(new THREE.ConeGeometry(.9, 8, 6), 0, 0, -6.4, -Math.PI / 2);
    const wing = (s) => { const sh = new THREE.Shape(); sh.moveTo(0, 2); sh.lineTo(s * 8, 3); sh.lineTo(s * 10, -1.4); sh.lineTo(s * 6.2, -.4); sh.lineTo(s * 4.4, -2.3); sh.lineTo(s * 2.4, -.8); sh.lineTo(0, -2.2); sh.closePath(); const geo = new THREE.ShapeGeometry(sh); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, m2), piv = new THREE.Group(); piv.add(m); piv.position.set(s * .6, .5, 0); g.add(piv); return piv; };
    g.userData = { L: wing(1), R: wing(-1) }; root.add(g); return g;
  }
  [['#b8902e', '#7a2a1c', 1320, 250, 95, 70, .16, 0], ['#2c5a48', '#d9a93a', 1240, 300, 70, 90, -.13, 2], ['#9a2828', '#26120e', 1385, 300, 60, 62, .19, 4], ['#c9c0a8', '#5a4632', 1290, 370, 120, 80, -.1, 5]].forEach(([a, b, x, y, r, h, sp, ph], i) => {
    const [X, Z] = fToXZ(x, y); const fire = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: sRGB('#ff9030'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); root.add(fire);
    dragons.push({ g: dragon(a, b), X, Z, r, h: h + G(X, Z), sp, ph, fire, a: actor({ n: 'Ejderân', s: 'Ceremo göğü', d: 'Ceremo’ya varmanın iki yolu bilinir: bir ejderân sürmek, yahut anlam yolunda ölmek. Bunlar binicisini bekliyor.', ids: [], html: LINK.sozluk, kind: 'ejderha', tag: i ? null : 'Ejderânlar' }) });
  });

  // ---------- portal: dönen girdap, yükselen zerreler ----------
  const swirlTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.translate(128, 128); for (let a = 0; a < 3; a++) { g.rotate(2.094); g.beginPath(); for (let t = 0; t < 1; t += .01) { const r = t * 124, th = t * 7; g.lineTo(Math.cos(th) * r, Math.sin(th) * r); } g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 10; g.stroke(); } const t = new THREE.CanvasTexture(c); return t; })();
  const spin = [], motes = [];
  function portal(x, y, hex, r, stone, yaw = 0) {
    const pos = snapToLand(...fToXZ(x, y), 24) || fToXZ(x, y), Y = G(pos[0], pos[1]), g = new THREE.Group(); g.position.set(pos[0], Y + r + 1, pos[1]); g.rotation.y = yaw;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * .13, 8, 28), new THREE.MeshStandardMaterial({ color: sRGB(stone), emissive: sRGB(hex), emissiveIntensity: .8, flatShading: true })); g.add(ring);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r * .92, 28), new THREE.MeshBasicMaterial({ map: swirlTex, color: sRGB(hex), transparent: true, opacity: .75, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(disc); spin.push({ m: disc, v: 1.6 });
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: sRGB(hex), transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.setScalar(r * 5); g.add(glow);
    for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: sRGB(hex), transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.setScalar(.8); root.add(s); motes.push({ s, x: pos[0], z: pos[1], y: Y, r, ph: i / 12 }); }
    root.add(g); return [pos[0], Y + r + 1, pos[1]];
  }
  actor({ n: 'Menfez-i Gayb', s: 'Vefat Dağı', d: 'Bin yıl önce Uçmakanların geçtiği yarık. Hâlâ tam kapanmamıştır; Görümcek de buradan sızmıştır.', ids: [724, 674], kind: 'portal', tag: 'Menfez-i Gayb', at: (() => { const [X, Z] = fToXZ(862, 412); return [X, G(X, Z) + 6, Z]; })() });
  actor({ n: 'Gök-Yarık', s: 'Haarbova · Orhun Taşları', d: 'Taşlar doğru açıyla, doğru gölge boyunda ve doğru gırtlak titreşimiyle dizildiğinde mesafe bükülür.', ids: [724], kind: 'portal', at: portal(968, 640, '#6fd8c8', 4.5, '#4f4a48') });
  actor({ n: 'Ceremo Kapısı', s: 'Cennet-ül Arz', d: 'Anlam yolunda ölenlerin vardığına inanılan eşik.', ids: [], html: LINK.sozluk, kind: 'portal', tag: 'Ceremo Kapısı', at: portal(1250, 280, '#7ab8f0', 7, '#e8e0d0', .6) });
  actor({ n: 'Malathar’ın Yarığı', s: 'Nihülus', d: 'Mana’nın tükendiği kıtada açılan kara girdap. Yakınından geçen gemiler dua etmeyi unutur.', ids: [], html: LINK.sozluk, kind: 'portal', tag: 'Malathar’ın Yarığı', at: portal(640, 165, '#b050e0', 8, '#2a2030', 1.1) });

  // ---------- büyü okulları ----------
  const rings = [], pearls = [];
  function school(x, y, kit) {
    const pos = snapToLand(...fToXZ(x, y), 24) || fToXZ(x, y), Y = G(pos[0], pos[1]), g = new THREE.Group(), L = c => new THREE.MeshLambertMaterial({ color: sRGB(c), flatShading: true });
    g.position.set(pos[0], Y, pos[1]); const add = (geo, c, px, py, pz) => { const m = new THREE.Mesh(geo, L(c)); m.position.set(px, py, pz); g.add(m); return m; };
    if (kit === 'enderun') {
      add(new THREE.BoxGeometry(22, 4, 16), '#ebe3cf', 0, 2, 0); for (let i = -4; i <= 4; i++) { add(new THREE.CylinderGeometry(.45, .55, 4.4, 8), '#f4ecdc', i * 2.4, 2.2, 8.4); }
      add(new THREE.BoxGeometry(23, .7, 17), '#b8643c', 0, 4.3, 0); add(new THREE.CylinderGeometry(4.2, 5, 9, 12), '#ebe3cf', 0, 8, 0); add(new THREE.SphereGeometry(4.2, 14, 8, 0, 6.3, 0, 1.57), '#c9a24a', 0, 12.5, 0);
      for (const [a, b] of [[-11, -8], [11, -8], [-11, 8], [11, 8]]) { add(new THREE.CylinderGeometry(.9, 1.2, 12, 8), '#ebe3cf', a, 6, b); add(new THREE.ConeGeometry(1.2, 3, 8), '#c9a24a', a, 13.5, b); }
    } else {
      for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(26 - i * 4.2, 2.6, 26 - i * 4.2), i % 2 ? '#3f5a44' : '#2c4034', 0, 1.3 + i * 2.6, 0);
      add(new THREE.CylinderGeometry(1.6, 2.4, 5, 6), '#1c2a20', 0, 18, 0); for (const [a, b] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) add(new THREE.ConeGeometry(1.1, 12, 4), '#1c2a20', a, 6, b);
    }
    root.add(g); const hex = kit === 'enderun' ? '#f0d890' : '#7af07a', cy = kit === 'enderun' ? 19 : 24;
    for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(5 + i * 1.5, .1, 6, 40), new THREE.MeshBasicMaterial({ color: sRGB(hex), transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false })); t.position.set(0, cy, 0); t.rotation.x = 1.57; g.add(t); rings.push({ m: t, i }); }
    for (let i = 0; i < 7; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: sRGB(hex), transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.setScalar(1.5); g.add(s); pearls.push({ s, y: cy, i }); }
    return [pos[0], Y + 16, pos[1]];
  }
  actor({ n: 'Sihir Enderunu', s: 'Parılova · Payendegân', d: 'İnci-doğumlular burada yetişir ve yalnızca düşük dozlu Tebeddül öğrenir. En azından kayıtlarda öyle yazar.', ids: [708, 772], kind: 'okul', tag: 'Sihir Enderunu', at: school(790, 868, 'enderun') });
  actor({ n: 'Zehir Mabedi', s: 'Tıskent · Zerksoy', d: 'Zehrin teokrasisinin kalbi. En zehirli olan en yükseğe çıkar; savaş incileri buraya akar.', ids: [531, 708], kind: 'okul', tag: 'Zehir Mabedi', at: school(822, 425, 'zehir') });

  // ---------- Nebrukaddesar: kâtip, kaftan, kor ----------
  const neb = (() => {
    const g = new THREE.Group(), L = (c, e) => new THREE.MeshStandardMaterial({ color: sRGB(c), flatShading: true, roughness: .8, emissive: e ? sRGB(e) : 0, emissiveIntensity: e ? .35 : 0 });
    const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
    add(new THREE.ConeGeometry(1.15, 3.2, 8), L('#1f6a6a', '#0a2a2a'), 0, 1.6, 0); add(new THREE.CylinderGeometry(.62, .78, .36, 8), L('#a8322a'), 0, 1.75, 0);
    add(new THREE.CylinderGeometry(.5, .62, 1, 8), L('#1f6a6a', '#0a2a2a'), 0, 2.6, 0); const head = add(new THREE.IcosahedronGeometry(.42, 1), L('#7a9a62'), 0, 3.4, 0);
    add(new THREE.ConeGeometry(.3, .7, 6), L('#3a2a1c'), 0, 3.05, .22).rotation.x = Math.PI;
    add(new THREE.CylinderGeometry(.56, .46, .36, 10), L('#d9a93a', '#5a3a08'), 0, 3.78, 0); add(new THREE.ConeGeometry(.26, .6, 8), L('#d9a93a', '#5a3a08'), 0, 4.2, 0);
    const pack = add(new THREE.BoxGeometry(1.1, 1.2, .55), L('#6a4c30'), 0, 2.5, -.75); pack.rotation.x = .1; add(new THREE.BoxGeometry(1, .22, .7), L('#a8322a'), 0, 3.15, -.75); add(new THREE.BoxGeometry(.85, .2, .6), L('#2c5a48'), 0, 3.35, -.75);
    const staff = add(new THREE.CylinderGeometry(.05, .07, 4.6, 5), L('#3a2a1c'), .95, 2.3, .4); staff.rotation.z = -.05;
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: sRGB('#ffb24a'), transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false })); flame.scale.setScalar(2.4); flame.position.set(1, 4.8, .4); g.add(flame);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: sRGB('#ffcf70'), transparent: true, opacity: .18, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.setScalar(12); halo.position.y = 3; g.add(halo);
    root.add(g); return { g, flame };
  })();
  const nebRoute = R.neb, nebPts = nebRoute.p.map(([x, z]) => new THREE.Vector3(x, G(x, z) + .9, z));
  const trail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(nebPts), new THREE.LineDashedMaterial({ color: sRGB('#f3d27a'), dashSize: 5, gapSize: 4, transparent: true, opacity: .75 })); trail.computeLineDistances(); root.add(trail);
  const nebA = actor({ n: P.neb, s: 'Payendegân’dan Haarbova’ya', d: 'Bir kâtip, sırtında yükü, elinde koruyla kuzeye yürüyor. Ro’nun on bir lisanını bildiği rivayet edilir. Neden yola çıktığını ve varınca ne olduğunu öğrenmek için kitabı oku, Alemgezer.', ids: [772], book: true, kind: 'neb', tag: P.neb });

  // ---------- görünen ad, ipucu, izleme ----------
  const tagsEl = document.getElementById('labels'), tip = document.createElement('div'); tip.id = 'lifeTip'; document.body.appendChild(tip);
  for (const a of actors) if (a.tag) { const e = document.createElement('div'); e.className = 'lifeTag' + (a.kind === 'neb' ? ' neb' : ''); e.textContent = a.tag; e.onclick = () => pick(a); tagsEl.appendChild(e); a.el = e; }
  let follow = null, hover = null, mouse = null, on = true, zoomT = 0;
  const v3 = new THREE.Vector3();
  function pick(a) {
    openCodex({ id: 'life', n: a.n, s: a.s, d: a.d, groups: [['', a.ids || []]], book: a.book, html: a.html });
    const h = document.querySelector('#codex header'), b = document.createElement('button'); b.className = 't izle'; b.textContent = 'İzle'; b.onclick = () => { const f = follow === a; setFollow(f ? null : a); b.classList.toggle('on', !f); }; h.appendChild(b);
    if (a.kind === 'neb') { setFollow(a); b.classList.add('on'); }
  }
  function setFollow(a) { follow = a; zoomT = a ? 2.4 : 0; if (a && getMode() !== 'orbit') document.querySelector('[data-mode=orbit]').click(); }
  function nearest(x, y) {
    let best = null, bd = 26 * 26; const r = canvas.getBoundingClientRect();
    for (const a of actors) { v3.copy(a.pos).project(camera); if (v3.z > 1) continue; const sx = (v3.x * .5 + .5) * r.width, sy = (-v3.y * .5 + .5) * r.height, d = (sx - x) ** 2 + (sy - y) ** 2; if (d < bd) { bd = d; best = a; } }
    return best;
  }
  canvas.addEventListener('pointermove', e => { mouse = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerleave', () => { mouse = null; });
  let down = null;
  canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', e => { if (!on || !down || getMode() !== 'orbit') return; if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) { const a = nearest(e.clientX, e.clientY); if (a) pick(a); } });

  // ---------- kare güncellemesi ----------
  const vs = (x, y, z) => Math.max(1, Math.min(3.4, camera.position.distanceTo(v3.set(x, y, z)) / 240));
  const mini = [];
  function update(dt, t) {
    if (!on) return;
    for (const k in K) K[k].begin(); mini.length = 0;
    for (const o of SHIPS) {
      const [d, dir] = o.route.swing(t * o.v + o.ph, 8), [x, z] = o.route.at(d), yaw = yawAt(o.route, d, dir), s = vs(x, 0, z), roll = Math.sin(t * .9 + o.ph) * .05, y = .15 + Math.sin(t * 1.2 + o.ph) * .12;
      K[o.k].put(x, y, z, yaw, s * .95, s * .95, Math.sin(t * .7 + o.ph) * .03, roll); o.a.pos.set(x, 3 * s, z); mini.push([x, z, '#efe6d2']);
    }
    for (const o of CAR) {
      const [d, dir] = o.route.swing(t * o.v + o.ph, 10), s0 = vs(...o.route.at(d).flatMap((c, i) => i ? [0, c] : [c]));
      for (let i = 0; i <= o.n; i++) {
        const di = d - dir * i * 2.1 * s0 * .8, [x, z] = o.route.at(di), y = G(x, z), yaw = yawAt(o.route, di, dir), bob = Math.abs(Math.sin(t * 2.6 + i)) * .1;
        if (i === 0 || i === o.n) K.guard.put(x, y + bob, z, yaw, s0 * .85); else K[o.k].put(x, y + bob, z, yaw, s0 * .85);
        if (i === 0) { o.a.pos.set(x, y + 2 * s0, z); mini.push([x, z, '#e8913a']); }
      }
    }
    for (const o of ENV) {
      const [d, dir] = o.route.swing(t * o.v + o.ph, 5), [x, z] = o.route.at(d), y = G(x, z), s = vs(x, y, z); K[o.k].put(x, y + Math.abs(Math.sin(t * 7 + o.ph)) * .25, z, yawAt(o.route, d, dir), s); o.a.pos.set(x, y + 2 * s, z); mini.push([x, z, '#ff6a5a']);
    }
    { const r = R.obal, base = t * 1.3; for (let i = 0; i < 12; i++) { const d = (base + i * 4.2 + Math.sin(i * 7) * 2) % r.len, [x, z] = r.at(d), [c, e] = r.at((d + 2) % r.len), y = G(x, z), s = vs(x, y, z); K.ucm.put(x + Math.sin(i * 3) * 1.5, y + Math.abs(Math.sin(t * 6 + i)) * .2, z + Math.cos(i * 5) * 1.5, Math.atan2(c - x, e - z), s * .85); if (!i) OBA.pos.set(x, y + 2, z); } }
    for (const f of FISH) { for (let i = 0; i < 3; i++) { const a = t * .05 * (i % 2 ? -1 : 1) + i * 2.1, r = f.r + i * 2.5, x = f.X + Math.cos(a) * r, z = f.Z + Math.sin(a) * r, s = vs(x, 0, z); K.boat.put(x, .1 + Math.sin(t * 1.6 + i) * .1, z, -a + (i % 2 ? Math.PI : 0), s * .9, s * .9, 0, Math.sin(t + i) * .07); } }
    for (const f of FLOCK) { const kind = f.w ? K.birdW : K.bird; for (let i = 0; i < f.n; i++) { const a = t * (.28 + i * .012) + i * .9 + f.ph, r = 8 + (i * 37 % 11), x = f.X + Math.cos(a) * r, z = f.Z + Math.sin(a * 1.1) * r * .8, y = f.Y + Math.sin(a * 2.3) * 3 + i % 3 * 2, s = vs(x, y, z) * .9; kind.put(x, y, z, -a + 1.57, s, s * (.3 + Math.abs(Math.sin(t * 8 + i * 2)) * .9)); } }
    { const [X, Z] = fToXZ(775, 890); for (let i = 0; i < 5; i++) { const a = t * .12 + i * .28, x = X + Math.cos(a) * 66, z = Z + Math.sin(a) * 52, y = 42 + G(x, z) * .3, s = vs(x, y, z) * 1.05; K.owl.put(x, y + Math.sin(t * 2 + i) * .4, z, -a + Math.PI, s, s, .05); if (!i) { gok.pos.set(x, y, z); mini.push([x, z, '#d9a93a']); } } }
    { const A = fToXZ(300, 800), B = fToXZ(700, 920), T = 80, u = Math.abs(((t + 11) / T) % 2 - 1), x = A[0] + (B[0] - A[0]) * u, z = A[1] + (B[1] - A[1]) * u, s = vs(x, 40, z) * 1.3; K.raven.put(x, 40, z, Math.atan2(B[0] - A[0], B[1] - A[1]), s, s * (.4 + Math.abs(Math.sin(t * 7)))); kuzgun.pos.set(x, 40, z); }
    // savaş
    { const b = BAT, surge = 3 + 1.8 * (.5 + .5 * Math.sin(t * .35));
      for (const u of b.list) { const k = u.s < 0 ? K.solA : K.solB, front = u.r === 0, lunge = front ? Math.sin(t * 5 + u.ph) * .55 : Math.sin(t * .9 + u.ph) * .2, off = u.s * (surge + u.r * 2.1 + u.j + lunge * -1), x = u.px + b.nx * off, z = u.pz + b.nz * off; k.put(x, u.y + (front ? Math.abs(Math.sin(t * 5 + u.ph)) * .18 : 0), z, Math.atan2(-u.s * b.nx, -u.s * b.nz), 1.5, 1.5, 0, front ? Math.sin(t * 5 + u.ph) * .12 : 0); }
      for (let i = 0; i < 28; i++) { const s = i % 2 ? 1 : -1, u = ((t * .42 + i * .137) % 1), c = (i * 17 % 28) - 14, from = s * 16, to = -s * 11, off = from + (to - from) * u, x = b.X + b.tx * c * 2 + b.nx * off, z = b.Z + b.tz * c * 2 + b.nz * off, y = b.a.pos.y + 1 + Math.sin(u * Math.PI) * 13; K.arrow.put(x, y, z, Math.atan2(-s * b.nx, -s * b.nz), 1, 1, (u - .5) * 1.5); }
      for (const d of dust) { const x = b.X + b.tx * d.c * 2 + b.nx * Math.sin(t * .4 + d.ph) * 3, z = b.Z + b.tz * d.c * 2 + b.nz * Math.sin(t * .4 + d.ph) * 3, l = (t * .22 + d.ph) % 1; d.s.position.set(x, b.a.pos.y + 1 + l * 10, z); const k = 10 + l * 18; d.s.scale.set(k, k * .7, 1); d.s.material.opacity = .26 * Math.sin(l * Math.PI); }
      for (const p of spark) { const on2 = Math.sin(t * 9 + p.ph * 3) > .4; p.s.visible = on2; if (on2) { p.s.position.set(b.X + b.tx * (p.c * 2 + Math.sin(t * 13 + p.ph) * 2), b.a.pos.y + 1.2, b.Z + b.tz * (p.c * 2 + Math.cos(t * 11 + p.ph) * 2)); p.s.scale.setScalar(1 + Math.random() * 1.4); } }
      for (const g of banners) { const u = g.userData, off = u.s * (surge + 6), x = b.X + b.tx * u.c * 2 + b.nx * off, z = b.Z + b.tz * u.c * 2 + b.nz * off; g.position.set(x, G(x, z) + 3, z); u.f.rotation.y = Math.sin(t * 3 + u.c) * .35; }
      mini.push([b.X, b.Z, '#ff3a2a']); }
    // Paluzi
    { const c = (t % 34) / 7; if (c < 1) { for (let i = 0; i < 16; i++) { const u = c * 1.6 - i * .045; if (u < 0 || u > 1) continue; const x = WORM.X - 22 + u * 44, y = G(WORM.X, WORM.Z) + Math.sin(u * Math.PI) * 13 - 1.2, r = 2 - Math.abs(i - 8) * .1; K.worm.put(x, y, WORM.Z + Math.sin(u * 6) * 2, 0, r); } } }
    // ejderânlar
    for (const d of dragons) {
      const a = t * d.sp + d.ph, x = d.X + Math.cos(a) * d.r, z = d.Z + Math.sin(a) * d.r * .8, y = d.h + Math.sin(a * 2.2) * 9, dx = -Math.sin(a) * d.sp, dz = Math.cos(a) * d.sp * .8, s = Math.max(1.1, vs(x, y, z) * .9);
      d.g.position.set(x, y, z); d.g.rotation.set(0, Math.atan2(dx, dz), -Math.sign(d.sp) * .22); d.g.scale.setScalar(s);
      const fl = Math.sin(t * 2.4 + d.ph) * .55; d.g.userData.L.rotation.z = fl; d.g.userData.R.rotation.z = -fl; d.a.pos.set(x, y, z);
      const c = (t + d.ph * 5) % 26, burn = c < 3; d.fire.material.opacity = burn ? .85 * Math.sin(c / 3 * Math.PI) : 0;
      if (burn) { const n = 1 / Math.hypot(dx, dz), l = 8 * s + c * 6 * s; d.fire.position.set(x + dx * n * l, y + 1.5 * s, z + dz * n * l); d.fire.scale.setScalar((6 + c * 5) * s); }
      mini.push([x, z, '#ffcf70']);
    }
    for (const p of spin) p.m.rotation.z = t * p.v;
    for (const m of motes) { const l = (t * .18 + m.ph) % 1, a = m.ph * 40 + t * .5; m.s.position.set(m.x + Math.cos(a) * m.r * 1.2, m.y + l * m.r * 3.4, m.z + Math.sin(a) * m.r * 1.2); m.s.material.opacity = .85 * Math.sin(l * Math.PI); }
    for (const r of rings) { r.m.rotation.x = 1.57 + Math.sin(t * .5 + r.i) * .4; r.m.rotation.y = t * (.3 + r.i * .2); }
    for (const p of pearls) { const a = t * .8 + p.i * .9; p.s.position.set(Math.cos(a) * 6, p.y + Math.sin(a * 1.7) * 2, Math.sin(a) * 6); }
    // Nebrukaddesar
    { const T = nebRoute.len, walk = 1.9, c = (t * walk) % (T + 40), d = Math.min(c, T), [x, z] = nebRoute.at(d), y = G(x, z), s = Math.max(1.5, vs(x, y, z) * 1.25), moving = c < T, stride = moving ? Math.sin(t * 5) : 0;
      neb.g.position.set(x, y + Math.abs(stride) * .12 * s, z); neb.g.rotation.set(0, yawAt(nebRoute, d, 1), stride * .05); neb.g.scale.setScalar(s); neb.flame.scale.setScalar(2.2 + Math.sin(t * 9) * .4); nebA.pos.set(x, y + 3 * s, z); mini.push([x, z, '#f3d27a', 1]);
    }
    for (const k in K) K[k].end();
    // ad etiketleri
    for (const a of actors) if (a.el) { v3.copy(a.pos); const dist = camera.position.distanceTo(v3); v3.project(camera); const show = a.kind === 'neb' ? dist < 1500 : dist < 520; const vis = show && v3.z < 1 && Math.abs(v3.x) < 1.02 && Math.abs(v3.y) < 1.02 && ctx.labelsOn(); a.el.style.display = vis ? 'block' : 'none'; if (vis) a.el.style.transform = `translate(-50%,-140%) translate(${(v3.x * .5 + .5) * innerWidth}px,${(-v3.y * .5 + .5) * innerHeight}px)`; }
    // ipucu
    hover = mouse && getMode() === 'orbit' ? nearest(...mouse) : null;
    canvas.style.cursor = hover ? 'pointer' : '';
    if (hover) { tip.style.display = 'block'; tip.innerHTML = `<b>${hover.n}</b><span>${hover.s}</span>`; tip.style.transform = `translate(${mouse[0] + 14}px,${mouse[1] + 14}px)`; } else tip.style.display = 'none';
    // izleme
    if (follow) {
      if (!document.getElementById('codex').classList.contains('open')) { follow = null; }
      else { const k = 1 - Math.exp(-dt * 3), dx = (follow.pos.x - controls.target.x) * k, dy = (follow.pos.y - controls.target.y) * k, dz = (follow.pos.z - controls.target.z) * k; controls.target.x += dx; controls.target.y += dy; controls.target.z += dz; camera.position.x += dx; camera.position.y += dy; camera.position.z += dz;
        if (zoomT > 0) { zoomT -= dt; const off = camera.position.clone().sub(controls.target), L = off.length(), want = 125; off.setLength(L + (want - L) * Math.min(1, dt * 1.6)); camera.position.copy(controls.target).add(off); } }
    }
  }
  const gok = actor({ n: 'Gökmızrak Devriyesi', s: 'Payendegân göğü', d: 'Tahrul-Ben’in anısına Puhusoylardan seçilen alay; ordunun havadaki gözü.', ids: [772, 644], kind: 'gok' });
  const kuzgun = actor({ n: 'Kanatlı Ulak', s: 'Pofova · Payendegân', d: 'Gaksoylar uçmakta nadiren ustadır; uçabilenlerin taşıdığı mektuplar da o kadar değerlidir. Sesi yoktur, duyduğunu birebir tekrar eder.', ids: [565], kind: 'ulak' });
  return {
    update,
    drawMini(g, w, h) { if (!on) return; for (const [x, z, c, big] of mini) { g.fillStyle = c; const X = (x + W / 2) / W * w, Y = (z + D / 2) / D * h, r = big ? 3.4 : 1.6; g.beginPath(); g.arc(X, Y, r, 0, 7); g.fill(); if (big) { g.strokeStyle = '#120d0a'; g.lineWidth = 1; g.stroke(); } } },
    setVisible(v) { on = v; root.visible = v; tip.style.display = 'none'; for (const a of actors) if (a.el) a.el.style.display = v ? 'block' : 'none'; },
    followNeb() { pick(nebA); },
    debug: { actors, K },
  };
}
