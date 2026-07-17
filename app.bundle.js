(() => {
  // app.jsx
  var { useState, useEffect, useRef } = React;
  var MIO_ID_KEY = "lamentometro:mio-id";
  var PROXY_URL = "https://lamentometro-proxy.giovanni-c4c.workers.dev";
  var APP_SECRET = "4d6f30c2e1174c3a31005b189d5775d0cef351cd5ab56577";
  var proxyHeaders = { "X-App-Secret": APP_SECRET, "Content-Type": "application/json" };
  function b64EncodeUtf8(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64DecodeUtf8(str) {
    return decodeURIComponent(escape(atob(str.replace(/\n/g, ""))));
  }
  async function ghLeggiFile() {
    const res = await fetch(`${PROXY_URL}?_=${Date.now()}`, { headers: proxyHeaders, cache: "no-store" });
    if (!res.ok) throw new Error("Lettura fallita: " + res.status);
    const data = await res.json();
    if (!data.content) return { content: null, sha: null };
    return { content: JSON.parse(b64DecodeUtf8(data.content)), sha: data.sha };
  }
  async function ghScriviFile(obj, sha) {
    const body = { content: b64EncodeUtf8(JSON.stringify(obj)) };
    if (sha) body.sha = sha;
    const res = await fetch(PROXY_URL, { method: "PUT", headers: proxyHeaders, body: JSON.stringify(body) });
    if (!res.ok) throw new Error("Scrittura fallita: " + res.status);
    return res.json();
  }
  var GH_RAW_BASE = "https://raw.githubusercontent.com/San7u7/lamentometro/main/";
  function ridimensionaImmagine(file, maxW = 1600, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxW) {
          h = Math.round(h * (maxW / w));
          w = maxW;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Conversione immagine fallita"));
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }, "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = url;
    });
  }
  async function ghCaricaFoto(day, filename, base64Content) {
    const res = await fetch(`${PROXY_URL}/photo`, {
      method: "POST",
      headers: proxyHeaders,
      body: JSON.stringify({ day, filename, content: base64Content })
    });
    if (!res.ok) throw new Error("Upload foto fallito: " + res.status);
    return res.json();
  }
  async function ghEliminaFoto(path) {
    const res = await fetch(`${PROXY_URL}/photo`, {
      method: "DELETE",
      headers: proxyHeaders,
      body: JSON.stringify({ path })
    });
    if (!res.ok) throw new Error("Eliminazione foto fallita: " + res.status);
    return res.json();
  }
  function localGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function localSet(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {
    }
  }
  var CAT_VIAGGIO = [
    { id: "piede", emoji: "\u{1F97E}", label: "Piede Stanco", punti: 1 },
    { id: "gastro", emoji: "\u{1F35D}", label: "Critico Gastronomico", punti: 2 },
    { id: "meteo", emoji: "\u{1F326}\uFE0F", label: "Meteorologo Disperato", punti: 2 },
    { id: "ritardo", emoji: "\u23F0", label: "Ritardatario Cronico", punti: 3 },
    { id: "budget", emoji: "\u{1F4B8}", label: "Lamento sul Budget", punti: 1 }
  ];
  var GRAVITA = [
    { id: "lieve", emoji: "\u{1F62E}\u200D\u{1F4A8}", label: "Lieve", punti: 1 },
    { id: "moderato", emoji: "\u{1F624}", label: "Moderato", punti: 3 },
    { id: "grave", emoji: "\u{1F30B}", label: "Grave / Tossico", punti: 5 },
    { id: "meta", emoji: "\u{1F501}", label: "Lamento sul Lamento", punti: 2 }
  ];
  var TUTTE_CAT = [...CAT_VIAGGIO, ...GRAVITA];
  var FACCE = ["\u{1F600}", "\u{1F60E}", "\u{1F92A}", "\u{1F60F}", "\u{1F634}", "\u{1F913}", "\u{1F61C}", "\u{1F978}", "\u{1F607}", "\u{1FAE0}", "\u{1F920}", "\u{1F624}"];
  var ACCESSORI = ["", "\u{1F576}\uFE0F", "\u{1F452}", "\u{1F9E2}", "\u{1F93F}", "\u{1F379}", "\u{1F338}", "\u{1F3A7}", "\u{1F451}", "\u{1F980}", "\u{1F366}", "\u26F1\uFE0F"];
  var COLORI = ["#FFD666", "#FF8A7E", "#33D1BE", "#7EC8F0", "#C9A6F5", "#FBA6C9", "#A8E06B", "#FFB570"];
  function Avatar({ av, emoji, size = 48 }) {
    if (!av || !av.f) return /* @__PURE__ */ React.createElement("span", { style: { fontSize: size * 0.82, lineHeight: 1 } }, emoji || "\u{1F600}");
    return /* @__PURE__ */ React.createElement("span", { className: "avatar", style: { width: size, height: size, background: av.c || COLORI[0], fontSize: size * 0.56 } }, av.f, av.a && /* @__PURE__ */ React.createElement("span", { className: "avatar-acc", style: { fontSize: size * 0.42 } }, av.a));
  }
  var CARNET_DEFAULT = [
    "Prepara il caff\xE8 per tutti domattina",
    "Porta gli zaini del gruppo per un'ora",
    "Offre il gelato a tutto il gruppo",
    "Canta una canzone a squarciagola in pubblico",
    "20 flessioni in spiaggia davanti a tutti",
    "Lava i piatti / sistema l'appartamento stasera",
    "Fa da fotografo ufficiale per tutta la giornata",
    "Offre il primo giro all'aperitivo"
  ];
  var SCHEDINA_CATALOG = [
    { id: "primo_lamento", tipo: "persona", testo: "Chi si lamenter\xE0 per primo oggi?" },
    { id: "sporco", tipo: "persona", testo: "Chi si sporcher\xE0 mangiando?" },
    { id: "ubriaco", tipo: "persona", testo: "Chi si ubriacher\xE0 stasera?" },
    { id: "ritardo", tipo: "persona", testo: "Chi arriver\xE0 in ritardo?" },
    { id: "primo_bagno", tipo: "persona", testo: "Chi far\xE0 il bagno per primo?" },
    { id: "primo_a_dormire", tipo: "persona", testo: "Chi si addormenter\xE0 per primo stasera?" },
    { id: "foto", tipo: "persona", testo: "Chi scatter\xE0 pi\xF9 foto oggi?" },
    { id: "lamento_prezzo", tipo: "persona", testo: "Chi si lamenter\xE0 per un prezzo?" },
    { id: "n_lamenti", tipo: "numero", testo: "Quante volte {nome} si lamenter\xE0 oggi?", min: 0, max: 10 },
    { id: "n_bicchieri", tipo: "numero", testo: "Quanti bicchieri berr\xE0 {nome} stasera?", min: 0, max: 10 },
    { id: "n_pesci", tipo: "numero", testo: "Quanti pesci pescher\xE0 {nome} oggi?", min: 0, max: 20 },
    { id: "ora_sveglia", tipo: "numero", testo: "A che ora si sveglier\xE0 {nome} domani?", min: 6, max: 12, unit: ":00" }
  ];
  var chiaveDomanda = (catalogId, targetId) => targetId ? `${catalogId}:${targetId}` : catalogId;
  var moltiplicatoreSchedina = (n) => n <= 3 ? { vinci: 0.5, perdi: 0 } : n <= 6 ? { vinci: 1, perdi: 0.5 } : { vinci: 2, perdi: 1 };
  var SOGLIA_NOTIFICA = 5;
  var SALVA_MINUTI = 2;
  var LIVELLI = [
    { max: 0, label: "Zen totale" },
    { max: 8, label: "Brontolio" },
    { max: 18, label: "Mugugno" },
    { max: 35, label: "Lagna" },
    { max: Infinity, label: "DEFCON LAGNA" }
  ];
  var uid = () => Math.random().toString(36).slice(2, 10);
  var INTRO_SLIDES = [
    { emoji: "\u{1F3D6}\uFE0F", title: "Benvenuti al mare.", sub: "Sole, amici, relax. Tutto perfetto\u2026", anim: "float" },
    { emoji: "\u{1F624}", title: "Ma in ogni gruppo si nasconde\u2026 IL LAMENTOSO.", sub: "Forse sei proprio tu.", anim: "shake" },
    { emoji: "\u{1F975}\u{1F35D}\u{1F97E}", title: "\xABChe caldo. Che fame. Quanto si cammina.\xBB", sub: "Ogni lamento vale punti: lieve +1, moderato +3, grave +5.", anim: "drop" },
    { emoji: "\u{1F319}", title: "Ogni sera, una vittima.", sub: "Il pi\xF9 lamentoso del giorno pesca una penitenza dal carnet. Parit\xE0? Decide l'Arbitro.", anim: "float" },
    { emoji: "\u2696\uFE0F\u{1F0CF}", title: "Il gruppo decide. Sempre.", sub: "Ogni lamentela vale solo se la maggioranza approva. E occhio al Bastian Contrario\u2026", anim: "shake" },
    { emoji: "\u{1F4E1}", title: "Regola del Telegrafo da Spiaggia", sub: "L'app non si aggiorna da sola in tempo reale: premi \u{1F504} per ricevere le lagne dagli altri ombrelloni.", anim: "float" },
    { emoji: "\u{1F3AF}\u{1F579}\uFE0F", title: "Schedine e sfide.", sub: "Pronostica la giornata e ruba punti agli amici nei minigiochi. I punti \u2B50 risalgono la classifica.", anim: "drop" },
    { emoji: "\u{1F451}", title: "\xC8 una Fantavacanza.", sub: "4 classifiche: Generale, Lamentosi, Scommettitori, Player. Che vinca il migliore!", anim: "drop" }
  ];
  var REGOLE_CARDS = [
    { emoji: "\u{1F624}", title: "I lamenti", testo: "Lieve +1 \xB7 Moderato +3 \xB7 Grave +5 \xB7 Lamento sul lamento +2. Auto-segnalarsi entro 1 minuto dimezza la penalit\xE0." },
    { emoji: "\u{1F9F3}", title: "Lamenti da viaggio", testo: "Piede Stanco +1 \xB7 Critico Gastronomico +2 \xB7 Meteorologo +2 \xB7 Ritardatario +3 \xB7 Budget +1." },
    { emoji: "\u2696\uFE0F", title: "Il voto del gruppo", testo: "Ogni lamentela vale solo se approvata a maggioranza. Il diretto interessato non vota. Parit\xE0 = respinta (l'Arbitro pesa doppio apposta)." },
    { emoji: "\u{1F9B8}", title: "Salva-In Extremis", testo: "Entro 2 minuti puoi proporre una soluzione e annullare il punto. Una volta al giorno." },
    { emoji: "\u{1F319}", title: "Penitenza del giorno", testo: "Ogni sera il pi\xF9 lamentoso di oggi pesca una penitenza dal carnet. In caso di parit\xE0 decide l'Arbitro." },
    { emoji: "\u{1F3AF}", title: "La schedina", testo: "Una al giorno a testa: da 3 a 15 pronostici sulla giornata. 3 = \xD70,5 senza malus \xB7 4-6 = +1 / \u22120,5 \xB7 7-15 = \xD72 / \u22121. I risultati reali li inserisce solo l'Arbitro del giorno, e solo quando tutti hanno compilato." },
    { emoji: "\u{1F579}\uFE0F", title: "I minigiochi", testo: "Sfide 1vs1 per accoppiamenti di classifica (1\xB0 vs ultimo\u2026). Ognuno gioca solo la propria sfida (riconosciuto dal telefono). 3 tentativi a testa, conta il migliore. Il vincitore ruba punti: 3 se parte da sotto, 2 se parte da sopra." },
    { emoji: "\u{1F3AD}", title: "I ruoli", testo: "Arbitro del giorno: scelto a caso dal sistema, scritto in Home. Voto \xD72 e solo lui inserisce i risultati della schedina. Conducente: primi 2 lamenti gratis. Bastian Contrario segreto: smascherato +3, salvo \u22123." },
    { emoji: "\u{1F6E1}\uFE0F", title: "Streak & scudi", testo: "3 / 5 / 7 giorni senza lamenti = badge e scudi che annullano il prossimo lamento lieve." },
    { emoji: "\u{1F4E1}", title: "Il Telegrafo da Spiaggia", testo: "L'app non si aggiorna da sola in tempo reale: premi \u{1F504} per ricevere le lagne dagli altri ombrelloni." },
    { emoji: "\u{1F3C6}", title: "Le classifiche", testo: "Netto = \u2B50 Fanta \u2212 \u{1F624} Lagna. Quattro graduatorie: Generale, Lamentosi, Scommettitori, Player. Chi \xE8 ultimo nella Generale sconta le penitenze." }
  ];
  var oggi = () => (/* @__PURE__ */ new Date()).toLocaleDateString("sv");
  var hashStr = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) >>> 0;
    return h;
  };
  function fasciaOraria(h = (/* @__PURE__ */ new Date()).getHours()) {
    if (h >= 5 && h < 12) return "mattino";
    if (h >= 12 && h < 18) return "pomeriggio";
    if (h >= 18 && h < 23) return "sera";
    return "notte";
  }
  var FRASI = {
    mattino: [
      "Ti sei svegliato solo per controllare chi si \xE8 lamentato, vero?",
      "Buongiorno campione. Quanto ci metti a lamentarti del caff\xE8?",
      "Sveglia all'alba per la spiaggia? Tu? Ci crediamo tutti.",
      "La colazione non ti piacer\xE0. Lo sappiamo gi\xE0 io e te.",
      "Oggi zero lamenti, dai. Scommettiamo che non arrivi a pranzo?"
    ],
    pomeriggio: [
      "Fa caldo, eh? Diccelo, non tenerti tutto dentro.",
      "Stai gi\xE0 pensando di lamentarti della camminata. Ammettilo.",
      "La sabbia ti d\xE0 fastidio ovunque. E lo dirai. Lo dici sempre.",
      "L'ombrellone dei vicini \xE8 pi\xF9 bello del tuo. Sopportalo in silenzio, se ci riesci.",
      "Di nuovo pesce a pranzo? Tranquillo, il tuo lamento \xE8 gi\xE0 in classifica."
    ],
    sera: [
      "Non sai dove andare a cena, ma sai gi\xE0 che ti lamenterai del conto.",
      "Le zanzare puntano te. Persino loro sanno chi si lamenta di pi\xF9.",
      "Ti sei scottato, vero? 3\u2026 2\u2026 1\u2026 lamentati.",
      "Stasera offri tu? Ah no, tu sei quello che si lamenta e basta.",
      "\xABL'aperitivo costava meno l'anno scorso.\xBB Dillo, ti ascoltiamo."
    ],
    notte: [
      "Ancora sveglio? Il condizionatore o la classifica che ti perseguita?",
      "Conta i lamenti invece delle pecore: ti addormenti prima.",
      "\xABDomani sveglia presto.\xBB S\xEC, come no.",
      "Ora perfetta per un lamento notturno. Segnalati da solo: vale met\xE0.",
      "Dormi, che domani potresti avere una penitenza da scontare."
    ]
  };
  var fraseDelGiorno = () => {
    const f = fasciaOraria();
    const arr = FRASI[f];
    const seed = hashStr(oggi() + f + String(Math.floor((/* @__PURE__ */ new Date()).getHours() / 6)));
    return { fascia: f, testo: arr[seed % arr.length] };
  };
  var SALUTO = { mattino: "Buongiorno", pomeriggio: "Buon pomeriggio", sera: "Buonasera", notte: "A quest'ora ancora sveglio?" };
  var ieri = () => new Date(Date.now() - 864e5).toLocaleDateString("sv");
  var countdownMezzanotte = () => {
    const d = /* @__PURE__ */ new Date();
    const m = new Date(d);
    m.setHours(24, 0, 0, 0);
    const ms = m - d;
    const h = Math.floor(ms / 36e5);
    const min = Math.floor(ms % 36e5 / 6e4);
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };
  var ICONA_FASCIA = { mattino: "\u{1F305}", pomeriggio: "\u2600\uFE0F", sera: "\u{1F307}", notte: "\u{1F319}" };
  function GiocoReazione({ onFinish }) {
    const [stato, setStato] = useState("attesa");
    const [msRisultato, setMsRisultato] = useState(null);
    const tRef = useRef(null);
    const startRef = useRef(0);
    useEffect(() => {
      setStato("attesa");
      const delay = 1200 + Math.random() * 2500;
      tRef.current = setTimeout(() => {
        startRef.current = performance.now();
        setStato("via");
      }, delay);
      return () => clearTimeout(tRef.current);
    }, []);
    const tap = () => {
      if (stato === "attesa") {
        clearTimeout(tRef.current);
        setStato("troppo_presto");
        return;
      }
      if (stato === "via") {
        const ms = Math.round(performance.now() - startRef.current);
        setMsRisultato(ms);
        setStato("fatto");
      }
    };
    const riprova = () => {
      setStato("attesa");
      const delay = 1200 + Math.random() * 2500;
      tRef.current = setTimeout(() => {
        startRef.current = performance.now();
        setStato("via");
      }, delay);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "game-box" }, stato === "fatto" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "game-result" }, "\u26A1 ", msRisultato, " ms"), /* @__PURE__ */ React.createElement("button", { className: "candy candy-green", onClick: () => onFinish(msRisultato) }, "\u2705 Conferma risultato")) : /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "game-tap" + (stato === "via" ? " game-go" : stato === "troppo_presto" ? " game-early" : ""),
        onClick: stato === "troppo_presto" ? riprova : tap
      },
      stato === "attesa" && "Aspetta il verde\u2026",
      stato === "via" && "TAP ORA!",
      stato === "troppo_presto" && "Troppo presto! Tap per riprovare"
    ));
  }
  function GiocoMemoria({ onFinish }) {
    const ICONE = ["\u{1F3D6}\uFE0F", "\u{1F366}", "\u{1F980}", "\u{1F576}\uFE0F"];
    const [seq, setSeq] = useState([]);
    const [mostra, setMostra] = useState(true);
    const [passo, setPasso] = useState(0);
    const [input, setInput] = useState([]);
    const [attivo, setAttivo] = useState(null);
    const [finito, setFinito] = useState(false);
    useEffect(() => {
      setSeq([Math.floor(Math.random() * 4)]);
    }, []);
    useEffect(() => {
      if (seq.length === 0 || finito) return;
      setMostra(true);
      setInput([]);
      setPasso(0);
      let i = 0;
      const iv = setInterval(() => {
        setAttivo(seq[i]);
        setTimeout(() => setAttivo(null), 380);
        i++;
        if (i >= seq.length) {
          clearInterval(iv);
          setTimeout(() => setMostra(false), 500);
        }
      }, 650);
      return () => clearInterval(iv);
    }, [seq]);
    const tocca = (idx) => {
      if (mostra || finito) return;
      const nuovo = [...input, idx];
      setInput(nuovo);
      if (seq[nuovo.length - 1] !== idx) {
        setFinito(true);
        return;
      }
      if (nuovo.length === seq.length) setSeq([...seq, Math.floor(Math.random() * 4)]);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "game-box" }, finito ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "game-result" }, "\u{1F9E0} Sequenza: ", seq.length - 1), /* @__PURE__ */ React.createElement("button", { className: "candy candy-green", onClick: () => onFinish(seq.length - 1) }, "\u2705 Conferma risultato")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, mostra ? "Guarda la sequenza\u2026" : `Ripetila! (${input.length + 1}/${seq.length})`), /* @__PURE__ */ React.createElement("div", { className: "memory-grid" }, ICONE.map((ic, idx) => /* @__PURE__ */ React.createElement("button", { key: idx, className: "memory-tile" + (attivo === idx ? " memory-on" : ""), onClick: () => tocca(idx), disabled: mostra }, ic)))));
  }
  function MinigiocoRunner({ gioco, onFine }) {
    const [tentativo, setTentativo] = useState(1);
    const [punteggi, setPunteggi] = useState([]);
    const [risultatoParziale, setRisultatoParziale] = useState(null);
    const handleRoundFinish = (score) => {
      setRisultatoParziale(score);
    };
    const confermaEProsegui = () => {
      const nuovi = [...punteggi, risultatoParziale];
      setRisultatoParziale(null);
      if (tentativo >= 3) {
        const migliore = gioco === "reazione" ? Math.min(...nuovi) : Math.max(...nuovi);
        onFine(migliore);
      } else {
        setPunteggi(nuovi);
        setTentativo((t) => t + 1);
      }
    };
    const unita = gioco === "reazione" ? " ms" : "";
    if (risultatoParziale != null) {
      return /* @__PURE__ */ React.createElement("div", { className: "game-box" }, /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Tentativo ", tentativo, "/3 completato"), /* @__PURE__ */ React.createElement("div", { className: "game-result" }, risultatoParziale, unita), punteggi.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { fontSize: 12 } }, "Precedenti: ", punteggi.join(", "), unita), /* @__PURE__ */ React.createElement("button", { className: "candy candy-green", onClick: confermaEProsegui }, tentativo >= 3 ? "\u2705 Vedi il risultato finale" : `Avanti \u2192 tentativo ${tentativo + 1}/3`));
    }
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Tentativo ", tentativo, "/3", punteggi.length > 0 ? ` \xB7 finora: ${punteggi.join(", ")}${unita}` : ""), gioco === "reazione" ? /* @__PURE__ */ React.createElement(GiocoReazione, { key: tentativo, onFinish: handleRoundFinish }) : /* @__PURE__ */ React.createElement(GiocoMemoria, { key: tentativo, onFinish: handleRoundFinish }));
  }
  function SwipeDeck({ cards, renderCard, height = 300 }) {
    const [i, setI] = useState(0);
    const [dx, setDx] = useState(0);
    const [anim, setAnim] = useState(false);
    const startX = useRef(null);
    const n = cards.length;
    const getX = (e) => e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const onDown = (e) => {
      startX.current = getX(e);
      setAnim(false);
    };
    const onMove = (e) => {
      if (startX.current != null) setDx(getX(e) - startX.current);
    };
    const onUp = () => {
      if (startX.current == null) return;
      startX.current = null;
      if (Math.abs(dx) > 80) {
        setAnim(true);
        setDx(dx > 0 ? 560 : -560);
        setTimeout(() => {
          setAnim(false);
          setDx(0);
          setI((x) => (x + 1) % n);
        }, 200);
      } else {
        setAnim(true);
        setDx(0);
        setTimeout(() => setAnim(false), 200);
      }
    };
    if (n === 0) return null;
    const next = (i + 1) % n;
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "deck", style: { height } }, n > 1 && /* @__PURE__ */ React.createElement("div", { className: "deck-card deck-under" }, renderCard(cards[next], next)), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "deck-card deck-top",
        style: { transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition: anim ? "transform .2s ease" : "none" },
        onMouseDown: onDown,
        onMouseMove: onMove,
        onMouseUp: onUp,
        onMouseLeave: onUp,
        onTouchStart: onDown,
        onTouchMove: onMove,
        onTouchEnd: onUp
      },
      renderCard(cards[i], i)
    )), /* @__PURE__ */ React.createElement("div", { className: "deck-dots" }, cards.map((_, k) => /* @__PURE__ */ React.createElement("button", { key: k, className: "dot2" + (k === i ? " dot2-on" : ""), onClick: () => {
      setI(k);
      setDx(0);
    }, "aria-label": "Card " + (k + 1) }))), /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { marginTop: 4 } }, "\u{1F446} Trascina la card per cambiarla"));
  }
  function statoIniziale() {
    return {
      friends: [],
      log: [],
      gratitudine: {},
      scudiUsati: {},
      conducente: {},
      bastian: { seed: uid(), giorni: {} },
      arbitroSeed: uid(),
      carnet: [...CARNET_DEFAULT],
      penitenzeAssegnate: [],
      contatorePenitenze: {},
      salvataggiUsati: {},
      schedine: {},
      risultatiSchedina: {},
      vacanza: { start: Date.now() },
      foto: []
    };
  }
  async function loadState() {
    try {
      const { content } = await ghLeggiFile();
      if (content) return { ...statoIniziale(), ...content };
    } catch (e) {
    }
    return statoIniziale();
  }
  function puntiValidi(e) {
    if (e.status === "annullato" || e.status === "salvato" || e.status === "contested" || e.status === "pending") return 0;
    return e.punti;
  }
  var kindOf = (e) => e.kind || "lagna";
  var puntiLagna = (s, id) => s.log.filter((l) => l.targetId === id && kindOf(l) === "lagna").reduce((a, l) => a + puntiValidi(l), 0);
  var puntiKind = (s, id, kind) => s.log.filter((l) => l.targetId === id && kindOf(l) === kind).reduce((a, l) => a + puntiValidi(l), 0);
  var puntiFanta = (s, id) => puntiKind(s, id, "schedina") + puntiKind(s, id, "minigioco");
  var nettoFanta = (s, id) => puntiFanta(s, id) - puntiLagna(s, id);
  var lamentiDelGiorno = (s, id, day) => s.log.filter((l) => l.targetId === id && kindOf(l) === "lagna" && l.day === day && l.status !== "annullato" && l.status !== "salvato" && l.punti > 0).length;
  function streakGiorni(s, id) {
    const con = new Set(s.log.filter((l) => l.targetId === id && kindOf(l) === "lagna" && puntiValidi(l) > 0).map((l) => l.day));
    let n = 0;
    const d = /* @__PURE__ */ new Date();
    for (let i = 0; i < 30; i++) {
      const k = d.toLocaleDateString("sv");
      if (con.has(k)) break;
      n++;
      d.setDate(d.getDate() - 1);
      if (new Date(k).getTime() < s.vacanza.start - 864e5) break;
    }
    return n;
  }
  function titoloAttuale(s, id) {
    let best = null;
    CAT_VIAGGIO.forEach((c) => {
      const v = s.log.filter((l) => l.targetId === id && l.catId === c.id && kindOf(l) === "lagna").reduce((a, l) => a + puntiValidi(l), 0);
      if (v > 0 && (!best || v > best.v)) best = { c, v };
    });
    return best ? best.c : null;
  }
  function scudiDisponibili(s, id) {
    const st = streakGiorni(s, id);
    const g = (st >= 3 ? 1 : 0) + (st >= 5 ? 1 : 0) + (st >= 7 ? 1 : 0);
    return Math.max(0, g - (s.scudiUsati[id] || 0));
  }
  function arbitroDelGiorno(s, day) {
    var _a;
    if (!s.friends.length) return null;
    const seed = s.arbitroSeed || ((_a = s.bastian) == null ? void 0 : _a.seed) || "arbitro";
    return s.friends[hashStr(day + ":arbitro:" + seed) % s.friends.length];
  }
  function bastianDelGiorno(s, day) {
    if (s.friends.length < 3) return null;
    return s.friends[hashStr(day + s.bastian.seed) % s.friends.length];
  }
  function BeachBackground({ dark }) {
    return /* @__PURE__ */ React.createElement("div", { className: "bg-scene" + (dark ? " bg-dark" : ""), "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 400 900", preserveAspectRatio: "xMidYMax slice", style: { width: "100%", height: "100%", display: "block" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "sky", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: dark ? "#12264F" : "#6EC9EE" }), /* @__PURE__ */ React.createElement("stop", { offset: "0.55", stopColor: dark ? "#1C3A6B" : "#AEE6F5" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: dark ? "#2A4A80" : "#FFF0CE" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "sea", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: dark ? "#0E3057" : "#2FB6D9" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: dark ? "#0A2444" : "#0E86B2" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "sand", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: dark ? "#3A3560" : "#FBE7B2" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: dark ? "#2C2950" : "#EFC988" }))), /* @__PURE__ */ React.createElement("rect", { width: "400", height: "560", fill: "url(#sky)" }), !dark && /* @__PURE__ */ React.createElement("circle", { cx: "320", cy: "120", r: "42", fill: "#FFE9A8", opacity: "0.95" }), !dark && /* @__PURE__ */ React.createElement("circle", { cx: "320", cy: "120", r: "58", fill: "#FFE9A8", opacity: "0.28" }), dark && [[40, 60], [90, 140], [160, 50], [230, 110], [300, 70], [350, 160], [60, 220], [200, 190], [330, 240]].map(([x, y], i) => /* @__PURE__ */ React.createElement("circle", { key: i, cx: x, cy: y, r: i % 3 === 0 ? 2.4 : 1.5, fill: "#FFF6D8", opacity: "0.9", className: "star", style: { animationDelay: `${i * 0.7}s` } })), /* @__PURE__ */ React.createElement("ellipse", { cx: "70", cy: "150", rx: "55", ry: "16", fill: "#fff", opacity: dark ? 0.06 : 0.6 }), /* @__PURE__ */ React.createElement("ellipse", { cx: "120", cy: "165", rx: "40", ry: "12", fill: "#fff", opacity: dark ? 0.05 : 0.5 }), /* @__PURE__ */ React.createElement("path", { d: "M0 430 Q 90 380 200 420 T 400 415 V 560 H 0 Z", fill: dark ? "#16305C" : "#57C4E5", opacity: "0.55" }), /* @__PURE__ */ React.createElement("rect", { y: "440", width: "400", height: "180", fill: "url(#sea)" }), /* @__PURE__ */ React.createElement("path", { d: "M0 452 Q 50 446 100 452 T 200 452 T 300 452 T 400 452", stroke: "#fff", strokeWidth: "3", fill: "none", opacity: dark ? 0.15 : 0.55 }), /* @__PURE__ */ React.createElement("path", { d: "M0 492 Q 60 486 120 492 T 240 492 T 360 492 T 400 490", stroke: "#fff", strokeWidth: "2.5", fill: "none", opacity: dark ? 0.1 : 0.4 }), !dark && /* @__PURE__ */ React.createElement("g", { opacity: "0.9" }, /* @__PURE__ */ React.createElement("path", { d: "M60 470 L96 470 L88 482 L68 482 Z", fill: "#FF6F61" }), /* @__PURE__ */ React.createElement("path", { d: "M78 470 L78 442 L94 466 Z", fill: "#fff" })), /* @__PURE__ */ React.createElement("path", { d: "M0 590 Q 120 555 260 585 T 400 575 V 900 H 0 Z", fill: "url(#sand)" }), /* @__PURE__ */ React.createElement("g", { transform: "translate(300 560)" }, /* @__PURE__ */ React.createElement("line", { x1: "0", y1: "0", x2: "0", y2: "95", stroke: dark ? "#1E1B3A" : "#B0653A", strokeWidth: "6", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M-62 6 Q 0 -52 62 6 Q 41 -8 20 4 Q 10 -12 0 4 Q -10 -12 -20 4 Q -41 -8 -62 6 Z",
        fill: dark ? "#4A3F7A" : "#FF6F61"
      }
    ), /* @__PURE__ */ React.createElement("path", { d: "M-21 3 Q -10 -13 0 3 Q 10 -13 21 3 Q 10 -6 0 2 Q -10 -6 -21 3 Z", fill: dark ? "#5D549B" : "#FFF3D6" })), /* @__PURE__ */ React.createElement("path", { d: "M-10 900 Q 30 760 12 700 Q 60 750 55 830 Q 95 740 80 690 Q 120 760 105 900 Z", fill: dark ? "#141230" : "#1D6E63", opacity: "0.85" }), /* @__PURE__ */ React.createElement("path", { d: "M410 900 Q 370 780 388 720 Q 345 770 350 850 Q 315 760 330 705 Q 290 780 300 900 Z", fill: dark ? "#141230" : "#1D6E63", opacity: "0.85" }), !dark && /* @__PURE__ */ React.createElement("text", { x: "180", y: "720", fontSize: "26" }, "\u{1F980}")));
  }
  function Panel({ title, children, style }) {
    return /* @__PURE__ */ React.createElement("div", { className: "panel", style }, title && /* @__PURE__ */ React.createElement("div", { className: "panel-tab" }, title), /* @__PURE__ */ React.createElement("div", { className: "panel-body" }, children));
  }
  function MeterBar({ punti24h }) {
    const livello = LIVELLI.find((l) => punti24h <= l.max) || LIVELLI[LIVELLI.length - 1];
    const idx = LIVELLI.indexOf(livello);
    const frac = Math.min(punti24h / 40, 1);
    return /* @__PURE__ */ React.createElement("div", { className: "meter" }, /* @__PURE__ */ React.createElement("div", { className: "meter-head" }, /* @__PURE__ */ React.createElement("span", { className: "meter-label" }, livello.label), /* @__PURE__ */ React.createElement("span", { className: "meter-val" }, punti24h, " pt / 24h")), /* @__PURE__ */ React.createElement("div", { className: "meter-track" }, /* @__PURE__ */ React.createElement("div", { className: "meter-fill", style: { width: `${Math.max(frac * 100, 4)}%`, background: idx >= 3 ? "var(--corallo)" : idx >= 2 ? "var(--sole)" : "var(--verde)" } })));
  }
  function formattaGiorno(d) {
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  }
  function mediaStelle(foto) {
    const voti = Object.values(foto.voti || {});
    if (voti.length === 0) return 0;
    return voti.reduce((a, v) => a + v, 0) / voti.length;
  }
  function Stelle({ value, onRate, size = 20 }) {
    return /* @__PURE__ */ React.createElement(
      "div",
      { className: "chip-row", style: { gap: 2 } },
      [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ React.createElement(
        "span",
        {
          key: n,
          onClick: onRate ? () => onRate(n) : void 0,
          style: { fontSize: size, cursor: onRate ? "pointer" : "default", lineHeight: 1 }
        },
        n <= Math.round(value) ? "\u2B50" : "\u2606"
      ))
    );
  }
  function AlbumView({ state, mioIdValido, friendById, mutate, showToast }) {
    const [open, setOpen] = useState(null);
    const [uploading, setUploading] = useState(false);
    const foto = state.foto || [];
    const giorni = [...new Set(foto.map((f) => f.day))].sort();
    const flat = [...foto].sort((a, b) => a.ts - b.ts);
    const handleFile = async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file) return;
      if (!mioIdValido) {
        showToast("\u{1F464} Scegli prima chi sei nella Schedina");
        return;
      }
      setUploading(true);
      try {
        const base64 = await ridimensionaImmagine(file);
        const day = oggi();
        const filename = `${uid()}.jpg`;
        const { path } = await ghCaricaFoto(day, filename, base64);
        await mutate((s) => {
          s.foto = s.foto || [];
          s.foto.push({ id: uid(), day, path, uploaderId: mioIdValido, ts: Date.now(), voti: {} });
          return s;
        });
        showToast("\u{1F4F8} Foto aggiunta!");
      } catch (err) {
        showToast("\u26A0\uFE0F Caricamento fallito, riprova");
      } finally {
        setUploading(false);
      }
    };
    const votaFoto = (fotoId, stelle) => {
      if (!mioIdValido) {
        showToast("\u{1F464} Scegli prima chi sei nella Schedina");
        return;
      }
      mutate((s) => {
        const f = (s.foto || []).find((x) => x.id === fotoId);
        if (f) {
          f.voti = f.voti || {};
          f.voti[mioIdValido] = stelle;
        }
        return s;
      });
    };
    const eliminaFotoLocale = async (fo) => {
      setOpen(null);
      await mutate((s) => {
        s.foto = (s.foto || []).filter((f) => f.id !== fo.id);
        return s;
      });
      ghEliminaFoto(fo.path).catch(() => {
      });
    };
    const corrente = open != null ? flat[open] : null;
    const MEDAGLIE = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
    const topFoto = [...foto].filter((f) => Object.keys(f.voti || {}).length > 0).sort((a, b) => mediaStelle(b) - mediaStelle(a)).slice(0, 3);
    const h = React.createElement;
    const headerPanel = h(
      Panel,
      { title: "\u{1F4F8} ALBUM VACANZA" },
      h(
        "label",
        { className: "candy candy-coral menu-btn", style: { display: "block", textAlign: "center" } },
        uploading ? "\u23F3 Caricamento..." : "\u{1F4F7} Aggiungi foto",
        h("input", {
          type: "file",
          accept: "image/*",
          capture: "environment",
          style: { display: "none" },
          disabled: uploading,
          onChange: handleFile
        })
      ),
      foto.length === 0 ? h("p", { className: "txt-c", style: { marginTop: 12 } }, "Nessuna foto ancora. Scatta il primo ricordo! \u{1F3D6}\uFE0F") : null
    );
    const dayPanels = giorni.map((day) => {
      const fotoGiorno = foto.filter((f) => f.day === day);
      const grid = h(
        "div",
        { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 } },
        fotoGiorno.map((f) => {
          const badge = mediaStelle(f) > 0 ? h(
            "span",
            { key: "b", style: { position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, borderRadius: 8, padding: "1px 6px" } },
            "\u2B50 " + mediaStelle(f).toFixed(1)
          ) : null;
          return h(
            "div",
            { key: f.id, onClick: () => setOpen(flat.findIndex((x) => x.id === f.id)), style: { position: "relative", cursor: "pointer" } },
            h("img", {
              src: GH_RAW_BASE + f.path,
              loading: "lazy",
              style: { width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10, display: "block" }
            }),
            badge
          );
        })
      );
      return h(Panel, { key: day, title: formattaGiorno(day) }, grid);
    });
    let lightbox = null;
    if (corrente) {
      const stelleRow = h(
        "div",
        { className: "chip-row", style: { justifyContent: "center", marginBottom: 10 } },
        h(Stelle, { value: (corrente.voti || {})[mioIdValido] || 0, onRate: (n) => votaFoto(corrente.id, n) })
      );
      const navRow = h(
        "div",
        { className: "chip-row", style: { justifyContent: "center" } },
        h("button", { className: "chip", disabled: open === 0, onClick: () => setOpen(open - 1) }, "\u2190"),
        h("button", { className: "chip", disabled: open === flat.length - 1, onClick: () => setOpen(open + 1) }, "\u2192"),
        mioIdValido === corrente.uploaderId ? h("button", { className: "chip chip-red", onClick: () => eliminaFotoLocale(corrente) }, "\u{1F5D1}\uFE0F Elimina") : null,
        h("button", { className: "chip", onClick: () => setOpen(null) }, "Chiudi")
      );
      lightbox = h(
        "div",
        { className: "overlay", onClick: () => setOpen(null) },
        h(
          "div",
          { className: "sheet", onClick: (e) => e.stopPropagation() },
          h("div", { className: "sheet-handle" }),
          h("img", {
            src: GH_RAW_BASE + corrente.path,
            style: { width: "100%", borderRadius: 12, display: "block", marginBottom: 10 }
          }),
          h("p", { className: "txt-c", style: { marginBottom: 4 } }, (friendById(corrente.uploaderId) || {}).name || "??", " \xB7 ", formattaGiorno(corrente.day)),
          stelleRow,
          navRow
        )
      );
    }
    const classificaPanel = topFoto.length > 0 ? h(
      Panel,
      { title: "\u{1F3C6} TOP 3 FOTO" },
      h(
        "div",
        { style: { display: "flex", gap: 10, justifyContent: "center" } },
        topFoto.map((f, i) => h(
          "div",
          {
            key: f.id,
            onClick: () => setOpen(flat.findIndex((x) => x.id === f.id)),
            style: { textAlign: "center", cursor: "pointer", flex: "1 1 0", maxWidth: 110 }
          },
          h("div", { style: { fontSize: 20 } }, MEDAGLIE[i]),
          h("img", {
            src: GH_RAW_BASE + f.path,
            loading: "lazy",
            style: { width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10, display: "block", marginBottom: 4 }
          }),
          h("div", { className: "txt-c", style: { fontSize: 12 } }, "\u2B50 " + mediaStelle(f).toFixed(1))
        ))
      )
    ) : null;
    return h(React.Fragment, null, classificaPanel, headerPanel, dayPanels, lightbox);
  }
  function LamentometroBeach() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
    const [state, setState] = useState(null);
    const [tab, setTab] = useState("home");
    const [lamentoView, setLamentoView] = useState("segnala");
    const [fraseCustom, setFraseCustom] = useState(null);
    const [schedinaChi, setSchedinaChi] = useState("");
    const [schedinaSel, setSchedinaSel] = useState([]);
    const [minigiocoAttivo, setMinigiocoAttivo] = useState(null);
    const [custTesto, setCustTesto] = useState("");
    const [custPunti, setCustPunti] = useState(1);
    const [mioId, setMioIdState] = useState(null);
    const [, setTick] = useState(0);
    const [sheet, setSheet] = useState(null);
    const [toast, setToast] = useState(null);
    const [newName, setNewName] = useState("");
    const [editAv, setEditAv] = useState({ f: FACCE[0], a: "", c: COLORI[0] });
    const [editingId, setEditingId] = useState(null);
    const [cartaChi, setCartaChi] = useState("");
    const [cartaVista, setCartaVista] = useState(false);
    const [accusa, setAccusa] = useState({ accuser: "", accused: "" });
    const [nuovaPenitenza, setNuovaPenitenza] = useState("");
    const [salvaMotivo, setSalvaMotivo] = useState("");
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(0);
    const [showIntro, setShowIntro] = useState(false);
    const [introSlide, setIntroSlide] = useState(0);
    const toastTimer = useRef(null);
    const stateRef = useRef(null);
    const dayCheckedRef = useRef(null);
    useEffect(() => {
      stateRef.current = state;
    }, [state]);
    useEffect(() => {
      const v = localGet(MIO_ID_KEY);
      if (v) setMioIdState(v);
    }, []);
    const impostaMioId = (id) => {
      setMioIdState(id);
      localSet(MIO_ID_KEY, id);
    };
    useEffect(() => {
      if (!state) return;
      const today = oggi();
      if (dayCheckedRef.current === today) return;
      dayCheckedRef.current = today;
      mutate((s) => s);
    }, [state]);
    const showToast = (msg) => {
      setToast(msg);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2400);
    };
    const sync = async (mode = "manual") => {
      if (syncing) return;
      if (mode === "manual") setSyncing(true);
      try {
        const prev = stateRef.current;
        const s = await loadState();
        setState(s);
        setLastSync(Date.now());
        if (prev) {
          const nuovi = s.log.filter((l) => !prev.log.some((p) => p.id === l.id));
          if (mode === "manual") {
            showToast(nuovi.length > 0 ? `\u{1F4E1} Sincronizzato: ${nuovi.length} ${nuovi.length === 1 ? "nuova lagna" : "nuove lagne"} in arrivo!` : "\u{1F3D6}\uFE0F Tutto fermo: nessuna novit\xE0 dagli altri ombrelloni");
          } else if (nuovi.length > 0) {
            showToast(`\u{1F4E1} ${nuovi.length} ${nuovi.length === 1 ? "nuova lagna" : "nuove lagne"} dagli altri ombrelloni`);
          }
        }
      } catch (e) {
        if (mode === "manual") showToast("\u26A0\uFE0F Il telegrafo non risponde: riprova");
      }
      setSyncing(false);
    };
    const refresh = () => sync("manual");
    useEffect(() => {
      (async () => {
        const s = await loadState();
        setState(s);
        setLastSync(Date.now());
        setShowIntro(true);
      })();
    }, []);
    useEffect(() => {
      const t = setInterval(() => setTick((x) => x + 1), 3e4);
      return () => clearInterval(t);
    }, []);
    useEffect(() => {
      const t = setInterval(() => {
        if (document.visibilityState === "visible" && stateRef.current) sync("auto");
      }, 75e3);
      return () => clearInterval(t);
    }, []);
    const chiudiIntro = () => {
      setShowIntro(false);
      setIntroSlide(0);
    };
    const lagnaDelGiornoDi = (s, id, d) => s.log.filter((l) => l.targetId === id && kindOf(l) === "lagna" && l.day === d).reduce((a, l) => a + puntiValidi(l), 0);
    const apriVotoPenitenza = (s, friendId, d) => {
      s.giornateChiuse = s.giornateChiuse || {};
      s.giornateChiuse[d] = { friendId, votata: false };
      const carnet = s.carnet.length ? s.carnet : ["Penitenza a scelta del gruppo"];
      const nOpz = Math.min(3, carnet.length);
      const idxBase = hashStr(friendId + d + s.bastian.seed);
      const scelte = [];
      for (let i = 0; scelte.length < nOpz; i++) {
        const idx = (idxBase + i * 7) % carnet.length;
        if (!scelte.includes(idx)) scelte.push(idx);
      }
      s.penitenzaVoto = { day: d, friendId, opzioni: scelte.map((idx) => carnet[idx]), votes: {} };
    };
    const risolviGiorno = (s, d) => {
      s.giornateChiuse = s.giornateChiuse || {};
      if (s.giornateChiuse[d]) return s;
      const punteggi = s.friends.map((f) => ({ id: f.id, v: lagnaDelGiornoDi(s, f.id, d) }));
      const max = Math.max(0, ...punteggi.map((p) => p.v));
      if (max <= 0) {
        s.giornateChiuse[d] = { friendId: null, votata: true };
        return s;
      }
      const candidati = punteggi.filter((p) => p.v === max).map((p) => p.id);
      if (candidati.length === 1) apriVotoPenitenza(s, candidati[0], d);
      else s.pendingPenitenza = { day: d, candidati };
      return s;
    };
    const controllaMezzanotte = (s) => {
      const y = ieri();
      let next = s;
      if (!next.log.some((l) => l.status === "pending" && l.day === y)) next = risolviGiorno(next, y);
      next = generaMinigiochiOggi(next);
      return next;
    };
    const arbitroScegliePenitenza = (friendId) => {
      mutate((s) => {
        if (!s.pendingPenitenza) return s;
        apriVotoPenitenza(s, friendId, s.pendingPenitenza.day);
        s.pendingPenitenza = null;
        return s;
      });
    };
    const votaPenitenza = (optIdx, voterId) => {
      mutate((s) => {
        const pv = s.penitenzaVoto;
        if (!pv || voterId === pv.friendId) return s;
        pv.votes[voterId] = optIdx;
        const votanti = s.friends.filter((f) => f.id !== pv.friendId);
        const arb = arbitroDelGiorno(s, pv.day);
        const peso = (fid) => arb && fid === arb.id ? 2 : 1;
        const tot = {};
        votanti.forEach((f) => {
          const v = pv.votes[f.id];
          if (v != null) tot[v] = (tot[v] || 0) + peso(f.id);
        });
        const W = votanti.reduce((a, f) => a + peso(f.id), 0);
        const tuttiVotato = votanti.every((f) => pv.votes[f.id] != null);
        const entries = Object.entries(tot).sort((a, b) => b[1] - a[1]);
        const vincitoreCerto = entries[0] && entries[0][1] > W / 2;
        if (vincitoreCerto || tuttiVotato) {
          const winIdx = entries.length ? Number(entries[0][0]) : 0;
          const testo = pv.opzioni[winIdx] || pv.opzioni[0];
          s.penitenzeAssegnate.unshift({ id: uid(), friendId: pv.friendId, testo, ts: Date.now(), fatta: false, giorno: pv.day });
          s.giornateChiuse[pv.day] = { friendId: pv.friendId, votata: true };
          s.penitenzaVoto = null;
        }
        return s;
      });
    };
    const salvaSchedina = (friendId, selezione) => {
      if (selezione.length < 3) {
        showToast("Servono almeno 3 pronostici");
        return;
      }
      mutate((s) => {
        s.schedine[day] = s.schedine[day] || {};
        if (s.schedine[day][friendId]) {
          showToast("Schedina gi\xE0 presentata oggi");
          return s;
        }
        s.schedine[day][friendId] = { opzioni: selezione, punteggiata: false, ts: Date.now() };
        return s;
      });
      setSchedinaSel([]);
      showToast("\u{1F3AF} Schedina presentata! In bocca al lupo");
    };
    const impostaRisultato = (key, valore) => {
      if (!sonoArbitroOggi || !tuttiHannoCompilatoSchedina) {
        showToast("\u2696\uFE0F Solo l'Arbitro di oggi pu\xF2 farlo, e solo a schedine tutte compilate");
        return;
      }
      mutate((s) => {
        s.risultatiSchedina[day] = s.risultatiSchedina[day] || {};
        if (s.risultatiSchedina[day].confermati) return s;
        s.risultatiSchedina[day][key] = valore;
        return s;
      });
    };
    const confermaRisultatiSchedina = () => {
      if (!sonoArbitroOggi || !tuttiHannoCompilatoSchedina) {
        showToast("\u2696\uFE0F Solo l'Arbitro di oggi pu\xF2 confermare");
        return;
      }
      mutate((s) => {
        const ris = s.risultatiSchedina[day];
        if (!ris || ris.confermati) return s;
        const schedineOggi2 = s.schedine[day] || {};
        Object.entries(schedineOggi2).forEach(([friendId, sched]) => {
          if (sched.punteggiata) return;
          let corrette = 0, sbagliate = 0;
          sched.opzioni.forEach((op) => {
            const key = chiaveDomanda(op.catalogId, op.target);
            const vero = ris[key];
            if (vero == null) return;
            const ok = op.tipo === "persona" ? vero === op.pronostico : Number(vero) === Number(op.pronostico);
            if (ok) corrette++;
            else sbagliate++;
          });
          const mult = moltiplicatoreSchedina(sched.opzioni.length);
          const punti = corrette * mult.vinci - sbagliate * mult.perdi;
          s.log.unshift({
            id: uid(),
            targetId: friendId,
            byId: friendId,
            catId: "schedina",
            kind: "schedina",
            puntiBase: punti,
            punti,
            ts: Date.now(),
            day,
            status: "ok",
            flags: [],
            votes: {},
            motivo: `${corrette}/${sched.opzioni.length} corretti`
          });
          sched.punteggiata = true;
        });
        ris.confermati = true;
        return s;
      });
      showToast("\u{1F3AF} Risultati confermati, punti assegnati!");
    };
    const GIOCHI = ["reazione", "memoria"];
    const generaMinigiochiOggi = (s) => {
      s.minigiochi = s.minigiochi || {};
      if (s.minigiochi[day]) return s;
      if (s.friends.length < 2) return s;
      const ordinati = [...s.friends].sort((a, b) => nettoFanta(s, b.id) - nettoFanta(s, a.id));
      const n = ordinati.length;
      const coppie = [];
      for (let i = 0; i < Math.floor(n / 2); i++) {
        const top = ordinati[i], bottom = ordinati[n - 1 - i];
        if (top.id === bottom.id) break;
        coppie.push({ id: uid(), a: top.id, b: bottom.id, rankA: i, rankB: n - 1 - i, risultati: {}, vincitore: null, risolta: false });
      }
      const gioco = GIOCHI[hashStr(day + s.bastian.seed) % GIOCHI.length];
      s.minigiochi[day] = { coppie, gioco };
      return s;
    };
    const giocaMinigioco = (coppiaId, friendId, punteggio) => {
      mutate((s) => {
        var _a2, _b2, _c2;
        const m = (_a2 = s.minigiochi) == null ? void 0 : _a2[day];
        if (!m) return s;
        const c = m.coppie.find((x) => x.id === coppiaId);
        if (!c || c.risolta) return s;
        c.risultati[friendId] = punteggio;
        const rA = c.risultati[c.a], rB = c.risultati[c.b];
        if (rA == null || rB == null) return s;
        const migliore = m.gioco === "reazione" ? rA < rB ? c.a : c.b : rA > rB ? c.a : c.b;
        const perdente = migliore === c.a ? c.b : c.a;
        const rankVincitore = migliore === c.a ? c.rankA : c.rankB;
        const rankPerdente = migliore === c.a ? c.rankB : c.rankA;
        const partitoDaSotto = rankVincitore > rankPerdente;
        const rubati = partitoDaSotto ? 3 : 2;
        c.vincitore = migliore;
        c.risolta = true;
        c.rubati = rubati;
        s.log.unshift({ id: uid(), targetId: migliore, byId: migliore, catId: "minigioco", kind: "minigioco", puntiBase: rubati, punti: rubati, ts: Date.now(), day, status: "ok", flags: [], votes: {}, motivo: `vinto vs ${(_b2 = s.friends.find((f) => f.id === perdente)) == null ? void 0 : _b2.name}` });
        s.log.unshift({ id: uid(), targetId: perdente, byId: perdente, catId: "minigioco", kind: "minigioco", puntiBase: -rubati, punti: -rubati, ts: Date.now(), day, status: "ok", flags: [], votes: {}, motivo: `perso vs ${(_c2 = s.friends.find((f) => f.id === migliore)) == null ? void 0 : _c2.name}` });
        return s;
      });
      showToast("\u{1F579}\uFE0F Sfida risolta!");
    };
    const mutate = async (fn) => {
      for (let tentativo = 0; tentativo < 4; tentativo++) {
        try {
          const { content, sha } = await ghLeggiFile();
          const latest = content ? { ...statoIniziale(), ...content } : statoIniziale();
          const next = controllaMezzanotte(fn(structuredClone(latest)));
          setState(next);
          await ghScriviFile(next, sha);
          return next;
        } catch (e) {
          if (tentativo === 3) {
            showToast("\u26A0\uFE0F Salvataggio fallito, riprova");
            return null;
          }
          await new Promise((r) => setTimeout(r, 350 + tentativo * 250));
        }
      }
    };
    if (!state) {
      return /* @__PURE__ */ React.createElement("div", { className: "app" }, /* @__PURE__ */ React.createElement("style", null, CSS), /* @__PURE__ */ React.createElement(BeachBackground, null), /* @__PURE__ */ React.createElement("div", { className: "loading" }, /* @__PURE__ */ React.createElement("div", { className: "panel panel-body", style: { padding: 20 } }, "\u26F1\uFE0F Carico il Lamentometro\u2026")));
    }
    const day = oggi();
    const now = Date.now();
    const friendById = (id) => state.friends.find((f) => f.id === id);
    const catById = (id) => TUTTE_CAT.find((c) => c.id === id);
    const punti24h = state.log.filter((l) => now - l.ts < 864e5 && kindOf(l) === "lagna").reduce((a, l) => a + puntiValidi(l), 0);
    const classifica = [...state.friends].sort((a, b) => nettoFanta(state, b.id) - nettoFanta(state, a.id));
    const pendenti = state.log.filter((l) => l.status === "pending");
    const arbitro = arbitroDelGiorno(state, day);
    const bastian = bastianDelGiorno(state, day);
    const bastianOggi = state.bastian.giorni[day] || { accuse: {}, revealed: false };
    const drammatico = state.friends.find((f) => lamentiDelGiorno(state, f.id, day) > SOGLIA_NOTIFICA);
    const fmtTime = (ts) => new Date(ts).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const badge = (n) => n >= 7 ? "\u{1F947}" : n >= 5 ? "\u{1F948}" : n >= 3 ? "\u{1F949}" : null;
    const fmtNum = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1)).replace(".", ",");
    const puntiFmt = (e) => e.punti === 0 ? e.flags.includes("conducente") ? "gratis \u{1F697}" : e.flags.includes("scudo") ? "gratis \u{1F6E1}\uFE0F" : "+0" : (e.punti > 0 ? "+" : "") + String(e.punti).replace(".", ",") + (e.flags.includes("auto") ? " \xBD" : "");
    const darkMode = tab === "lamento" && lamentoView === "ruoli" && cartaVista;
    const schedineOggi = state.schedine[day] || {};
    const risultatiOggi = state.risultatiSchedina[day] || {};
    const domandeOggi = (() => {
      const mappa = /* @__PURE__ */ new Map();
      Object.values(schedineOggi).forEach((sched) => {
        sched.opzioni.forEach((op) => {
          const key = chiaveDomanda(op.catalogId, op.target);
          if (!mappa.has(key)) mappa.set(key, { key, catalogId: op.catalogId, tipo: op.tipo, target: op.target });
        });
      });
      return [...mappa.values()];
    })();
    const testoDomanda = (catalogId, targetId) => {
      var _a2;
      const c = SCHEDINA_CATALOG.find((x) => x.id === catalogId);
      if (!c) return "";
      return targetId ? c.testo.replace("{nome}", ((_a2 = friendById(targetId)) == null ? void 0 : _a2.name) || "?") : c.testo;
    };
    const schedinaCompletata = risultatiOggi.confermati && Object.values(schedineOggi).every((s) => s.punteggiata);
    const tuttiRisultatiPronti = domandeOggi.length > 0 && domandeOggi.every((d) => risultatiOggi[d.key] != null);
    const votazioniFatto = pendenti.length === 0;
    const penitenzaFatto = !!((_a = state.giornateChiuse) == null ? void 0 : _a[ieri()]) && !state.penitenzaVoto && !state.pendingPenitenza;
    const schedinaFatto = state.friends.length > 0 && Object.keys(schedineOggi).length >= state.friends.length;
    const mioIdValido = mioId && state.friends.some((f) => f.id === mioId) ? mioId : null;
    const tuttiHannoCompilatoSchedina = state.friends.length > 0 && Object.keys(schedineOggi).length >= state.friends.length;
    const sonoArbitroOggi = !!(mioIdValido && arbitro && mioIdValido === arbitro.id);
    const miaSchedinaFatta = mioIdValido ? !!schedineOggi[mioIdValido] : null;
    const minigiochiFatto = !!((_b = state.minigiochi) == null ? void 0 : _b[day]) && state.minigiochi[day].coppie.every((c) => c.risolta);
    const tasksTotale = 4;
    const tasksFatti = [votazioniFatto, penitenzaFatto, schedinaFatto, minigiochiFatto].filter(Boolean).length;
    const registraLamento = (targetId, byId, catId, custom = null) => {
      setSheet(null);
      mutate((s) => {
        const cat2 = custom ? { id: "custom", label: custom.testo, emoji: "\u270F\uFE0F", punti: custom.punti } : TUTTE_CAT.find((c) => c.id === catId);
        let punti = cat2.punti;
        const flags = [];
        if (targetId === byId) {
          punti = punti / 2;
          flags.push("auto");
        }
        if (s.conducente[day] === targetId) {
          const gi\u00E0Oggi = s.log.filter((l) => l.targetId === targetId && l.day === day && l.status !== "annullato" && l.status !== "salvato").length;
          if (gi\u00E0Oggi < 2) {
            punti = 0;
            flags.push("conducente");
          }
        }
        if (punti > 0 && cat2.punti <= 1 && scudiDisponibili(s, targetId) > 0) {
          punti = 0;
          flags.push("scudo");
          s.scudiUsati[targetId] = (s.scudiUsati[targetId] || 0) + 1;
        }
        s.log.unshift({
          id: uid(),
          targetId,
          byId,
          catId: custom ? "custom" : catId,
          customTesto: custom ? custom.testo : null,
          puntiBase: cat2.punti,
          punti,
          ts: Date.now(),
          day,
          status: "pending",
          flags,
          votes: {}
        });
        if (s.log.length > 400) s.log.length = 400;
        return s;
      });
      const cat = custom ? { emoji: "\u270F\uFE0F", label: custom.testo } : catById(catId);
      const f = friendById(targetId);
      showToast(`${cat.emoji} Lamentela di ${f == null ? void 0 : f.name} in attesa di voto \u2696\uFE0F`);
    };
    const infoLamento = (l) => l.catId === "custom" ? { emoji: "\u270F\uFE0F", label: l.customTesto } : catById(l.catId);
    const vota = (entryId, voterId, voto) => {
      mutate((s) => {
        const e = s.log.find((l) => l.id === entryId);
        if (!e || e.status !== "pending" || voterId === e.targetId) return s;
        e.votes[voterId] = voto;
        const votanti = s.friends.filter((f) => f.id !== e.targetId);
        const arb = arbitroDelGiorno(s, e.day);
        const peso = (fid) => arb && fid === arb.id ? 2 : 1;
        const W = votanti.reduce((a, f) => a + peso(f.id), 0);
        let si = 0, no = 0;
        votanti.forEach((f) => {
          const v = e.votes[f.id];
          if (v === "si") si += peso(f.id);
          else if (v === "no") no += peso(f.id);
        });
        const tuttiVotato = votanti.every((f) => e.votes[f.id]);
        const approva = () => {
          e.status = "ok";
          e.flags.push("approvata");
        };
        const respingi = () => {
          e.status = "annullato";
          e.flags.push("respinta");
          if (e.flags.includes("scudo")) s.scudiUsati[e.targetId] = Math.max(0, (s.scudiUsati[e.targetId] || 0) - 1);
        };
        if (si > W / 2) approva();
        else if (no > W / 2) respingi();
        else if (tuttiVotato) {
          si > no ? approva() : respingi();
        }
        return s;
      });
    };
    const salvaInExtremis = (entryId, motivo) => {
      setSalvaMotivo("");
      mutate((s) => {
        const e = s.log.find((l) => l.id === entryId);
        if (!e) return s;
        if (Date.now() - e.ts > SALVA_MINUTI * 6e4) {
          showToast("\u23F1\uFE0F Finestra scaduta");
          return s;
        }
        const usati = s.salvataggiUsati[e.day] || {};
        if (usati[e.targetId]) {
          showToast("\u{1F6AB} Gi\xE0 usato oggi");
          return s;
        }
        e.status = "salvato";
        e.motivo = motivo || "Soluzione proposta";
        usati[e.targetId] = true;
        s.salvataggiUsati[e.day] = usati;
        return s;
      });
      showToast("\u{1F9B8} Punto annullato!");
    };
    const accusaBastian = () => {
      const { accuser, accused } = accusa;
      if (!accuser || !accused || accuser === accused) return;
      mutate((s) => {
        const g = s.bastian.giorni[day] || { accuse: {}, revealed: false };
        if (g.accuse[accuser]) {
          showToast("Hai gi\xE0 accusato oggi");
          return s;
        }
        if (g.revealed) {
          showToast("Bastian gi\xE0 rivelato");
          return s;
        }
        g.accuse[accuser] = accused;
        s.bastian.giorni[day] = g;
        return s;
      });
      setAccusa({ accuser: "", accused: "" });
      showToast("\u{1F575}\uFE0F Accusa registrata");
    };
    const rivelaBastian = () => {
      mutate((s) => {
        const b = bastianDelGiorno(s, day);
        if (!b) return s;
        const g = s.bastian.giorni[day] || { accuse: {}, revealed: false };
        if (g.revealed) return s;
        g.revealed = true;
        const sm = Object.values(g.accuse).includes(b.id);
        g.esito = sm ? "smascherato" : "salvo";
        s.bastian.giorni[day] = g;
        s.log.unshift({ id: uid(), targetId: b.id, byId: b.id, catId: "bastian", puntiBase: sm ? 3 : -3, punti: sm ? 3 : -3, ts: Date.now(), day, status: "ok", flags: [sm ? "bastian-smascherato" : "bastian-salvo"], votes: {} });
        return s;
      });
    };
    const addFriend = () => {
      const name = newName.trim();
      if (!name) {
        showToast("Serve un nome");
        return;
      }
      const av = { ...editAv };
      if (editingId) {
        mutate((s) => {
          const f = s.friends.find((x) => x.id === editingId);
          if (f) {
            f.name = name;
            f.avatar = av;
          }
          return s;
        });
        showToast("\u2705 Avatar aggiornato");
      } else {
        mutate((s) => {
          s.friends.push({ id: uid(), name, emoji: av.f, avatar: av });
          return s;
        });
        showToast(`\u{1F389} ${name} \xE8 nel gioco!`);
      }
      setNewName("");
      setEditingId(null);
      setEditAv({ f: FACCE[Math.floor(Math.random() * FACCE.length)], a: "", c: COLORI[Math.floor(Math.random() * COLORI.length)] });
    };
    const modificaAmico = (f) => {
      setEditingId(f.id);
      setNewName(f.name);
      setEditAv(f.avatar ? { ...f.avatar } : { f: f.emoji && FACCE.includes(f.emoji) ? f.emoji : FACCE[0], a: "", c: COLORI[0] });
    };
    const removeFriend = (id) => mutate((s) => {
      s.friends = s.friends.filter((f) => f.id !== id);
      s.log = s.log.filter((l) => l.targetId !== id && l.byId !== id);
      return s;
    });
    const nuovaVacanza = () => {
      mutate((s) => {
        const n = statoIniziale();
        n.friends = s.friends;
        n.carnet = s.carnet;
        return n;
      });
      showToast("\u{1F305} Nuova vacanza!");
    };
    const NAV = [
      ["home", "\u{1F3E0}", "Home"],
      ["gioca", "\u{1F3AE}", "Gioca", pendenti.length],
      ["album", "\u{1F4F8}", "Album"],
      ["classifica", "\u{1F3C6}", "Classifica"],
      ["altro", "\u{1F9F3}", "Altro"]
    ];
    const isGioca = ["gioca", "lamento", "schedina", "minigiochi", "contest", "carnet"].includes(tab);
    const isAltro = ["diario", "gruppo", "regole"].includes(tab);
    const fraseBase = fraseDelGiorno();
    const frase = fraseCustom || fraseBase;
    const rigeneraFrase = () => {
      const pool = FRASI[fraseBase.fascia].filter((t) => t !== frase.testo);
      setFraseCustom({ fascia: fraseBase.fascia, testo: pool[Math.floor(Math.random() * pool.length)] });
    };
    return /* @__PURE__ */ React.createElement("div", { className: "app" }, /* @__PURE__ */ React.createElement("style", null, CSS), /* @__PURE__ */ React.createElement(BeachBackground, { dark: darkMode }), /* @__PURE__ */ React.createElement("div", { className: "topbar" }, /* @__PURE__ */ React.createElement("nav", { className: "topnav" }, /* @__PURE__ */ React.createElement("button", { className: "topnav-btn" + (tab === "home" ? " topnav-on" : ""), onClick: () => setTab("home") }, /* @__PURE__ */ React.createElement("span", { className: "topnav-icon" }, "\u{1F3E0}"), /* @__PURE__ */ React.createElement("span", { className: "topnav-label" }, "Home")), /* @__PURE__ */ React.createElement("button", { className: "topnav-btn" + (syncing ? " topnav-syncing" : ""), onClick: () => sync("manual") }, /* @__PURE__ */ React.createElement("span", { className: "topnav-icon" + (syncing ? " sync-on" : "") }, "\u{1F504}"), /* @__PURE__ */ React.createElement("span", { className: "topnav-label" }, "Aggiorna")), /* @__PURE__ */ React.createElement("button", { className: "topnav-btn" + (tab === "contest" ? " topnav-on" : ""), onClick: () => setTab(pendenti.length > 0 ? "contest" : "home") }, /* @__PURE__ */ React.createElement("span", { className: "topnav-icon" }, "\u{1F4CB}", tasksFatti < tasksTotale && pendenti.length > 0 ? /* @__PURE__ */ React.createElement("span", { className: "topnav-badge" }, pendenti.length) : null), /* @__PURE__ */ React.createElement("span", { className: "topnav-label" }, "Task ", tasksFatti, "/", tasksTotale)))), /* @__PURE__ */ React.createElement("main", { className: "content" }, drammatico && (tab === "home" || tab === "lamento") && /* @__PURE__ */ React.createElement("div", { className: "banner" }, "\u{1F4E2} ", /* @__PURE__ */ React.createElement("strong", null, drammatico.name), " sta trasformando la vacanza in un film drammatico. Offritegli un caff\xE8 \u2615"), tab === "home" && /* @__PURE__ */ React.createElement("div", { className: "home-center" }, /* @__PURE__ */ React.createElement("div", { className: "hero" }, /* @__PURE__ */ React.createElement("div", { className: "hero-icon" }, ICONA_FASCIA[frase.fascia]), /* @__PURE__ */ React.createElement("div", { className: "hero-quote" }, "\xAB", frase.testo, "\xBB"), /* @__PURE__ */ React.createElement("div", { className: "hero-sub" }, SALUTO[frase.fascia], " \xB7 frase lamentosa del giorno"), /* @__PURE__ */ React.createElement("button", { className: "hero-btn", onClick: rigeneraFrase }, "\u{1F3B2} Un'altra frecciatina")), arbitro && /* @__PURE__ */ React.createElement(Panel, { title: "\u2696\uFE0F ARBITRO DEL GIORNO", style: { marginTop: 30 } }, /* @__PURE__ */ React.createElement("div", { className: "arbitro-row" }, /* @__PURE__ */ React.createElement(Avatar, { av: arbitro.avatar, emoji: arbitro.emoji, size: 44 }), /* @__PURE__ */ React.createElement("div", { className: "arbitro-nome" }, arbitro.name)), /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { marginBottom: 0 } }, "Il suo voto vale doppio \xB7 solo lui inserisce i risultati della schedina")), state.friends.length === 0 ? /* @__PURE__ */ React.createElement(Panel, { title: "BENVENUTI" }, /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Per iniziare la Fantavacanza, crea la banda."), /* @__PURE__ */ React.createElement("button", { className: "candy candy-teal", onClick: () => setTab("gruppo") }, "\u2795 Aggiungi la banda")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Panel, { title: "\u{1F4CB} ATTIVIT\xC0 DI OGGI" }, /* @__PURE__ */ React.createElement("div", { className: "today-list" }, /* @__PURE__ */ React.createElement("button", { className: "today-item today-item-btn", onClick: () => setTab("schedina") }, /* @__PURE__ */ React.createElement("span", null, "\u{1F3AF} Schedina del giorno"), /* @__PURE__ */ React.createElement("span", { className: "today-badge" + (miaSchedinaFatta ? " done" : "") }, !mioIdValido ? "chi sei? \u2192" : miaSchedinaFatta ? "\u2705 fatta" : "da fare")), /* @__PURE__ */ React.createElement("div", { className: "today-item" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F579}\uFE0F Minigioco 1vs1"), /* @__PURE__ */ React.createElement("span", { className: "today-badge" + (!((_d = (_c = state.minigiochi) == null ? void 0 : _c[day]) == null ? void 0 : _d.coppie.length) || state.minigiochi[day].coppie.every((c) => c.risolta) ? " done" : "") }, ((_e = state.minigiochi) == null ? void 0 : _e[day]) ? `${state.minigiochi[day].coppie.filter((c) => c.risolta).length}/${state.minigiochi[day].coppie.length} risolte` : "in generazione")), /* @__PURE__ */ React.createElement("div", { className: "today-item" }, /* @__PURE__ */ React.createElement("span", null, "\u2696\uFE0F Votazioni lamentele"), /* @__PURE__ */ React.createElement("span", { className: "today-badge" + (pendenti.length === 0 ? " done" : " urgent") }, pendenti.length === 0 ? "\u2705 nessuna" : pendenti.length)), /* @__PURE__ */ React.createElement("div", { className: "today-item" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F319} Penitenza di ieri"), /* @__PURE__ */ React.createElement("span", { className: "today-badge" + (state.penitenzaVoto ? " urgent" : ((_f = state.giornateChiuse) == null ? void 0 : _f[ieri()]) ? " done" : "") }, state.penitenzaVoto ? "\u2696\uFE0F da votare" : ((_g = state.giornateChiuse) == null ? void 0 : _g[ieri()]) ? "\u2705 assegnata" : `\u23F3 ${countdownMezzanotte()}`)))), /* @__PURE__ */ React.createElement(MeterBar, { punti24h }))), tab === "gioca" && /* @__PURE__ */ React.createElement("div", { className: "screen-center" }, /* @__PURE__ */ React.createElement(Panel, { title: "\u{1F3AE} SCEGLI COSA GIOCARE" }, /* @__PURE__ */ React.createElement("button", { className: "candy candy-coral menu-btn", onClick: () => {
      setTab("lamento");
      setLamentoView("segnala");
    } }, "\u{1F624} Lamentometro", pendenti.length > 0 ? ` \xB7 \u2696\uFE0F ${pendenti.length}` : ""), /* @__PURE__ */ React.createElement("button", { className: "candy candy-sun menu-btn", onClick: () => setTab("schedina") }, "\u{1F3AF} Schedina del giorno"), /* @__PURE__ */ React.createElement("button", { className: "candy candy-teal menu-btn", onClick: () => setTab("minigiochi") }, "\u{1F579}\uFE0F Minigiochi 1vs1"), /* @__PURE__ */ React.createElement("button", { className: "candy candy-navy menu-btn", onClick: () => setTab("carnet") }, "\u{1F319} Penitenze", state.penitenzaVoto ? " \xB7 \u2696\uFE0F da votare" : ``))), isGioca && tab !== "gioca" && /* @__PURE__ */ React.createElement("button", { className: "back", onClick: () => setTab("gioca") }, "\u2190 Indietro"), tab === "schedina" && /* @__PURE__ */ React.createElement("div", { className: "screen-center" }, /* @__PURE__ */ React.createElement(Panel, { title: "\u{1F3AF} SCHEDINA DEL GIORNO" }, /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Una schedina al giorno a testa \xB7 scegli da 3 a 15 pronostici. 3 = \xD70,5 senza malus \xB7 4-6 = +1 / \u22120,5 \xB7 7-15 = \xD72 / \u22121."), !schedinaChi && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { marginTop: 10 } }, "Chi sei?"), /* @__PURE__ */ React.createElement("div", { className: "pick-grid" }, state.friends.map((f) => /* @__PURE__ */ React.createElement("button", { key: f.id, className: "pick-btn", onClick: () => {
      setSchedinaChi(f.id);
      impostaMioId(f.id);
    } }, /* @__PURE__ */ React.createElement(Avatar, { av: f.avatar, emoji: f.emoji, size: 44 }), /* @__PURE__ */ React.createElement("span", null, f.name, mioId === f.id && " (tu)"), schedineOggi[f.id] && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--verde-scuro)" } }, "\u2705 fatta"))))), schedinaChi && schedineOggi[schedinaChi] && /* @__PURE__ */ React.createElement("div", { className: "contest-card" }, /* @__PURE__ */ React.createElement("p", { className: "txt" }, "\u{1F3AF} ", /* @__PURE__ */ React.createElement("strong", null, (_h = friendById(schedinaChi)) == null ? void 0 : _h.name), " ha gi\xE0 presentato la schedina di oggi:"), schedineOggi[schedinaChi].opzioni.map((op, i) => {
      var _a2;
      return /* @__PURE__ */ React.createElement("div", { key: i, className: "list-row" }, /* @__PURE__ */ React.createElement("span", { className: "row-text" }, testoDomanda(op.catalogId, op.target)), /* @__PURE__ */ React.createElement("span", { className: "row-pts", style: { color: "var(--navy)", fontSize: 12 } }, op.tipo === "persona" ? (_a2 = friendById(op.pronostico)) == null ? void 0 : _a2.name : op.pronostico));
    }), schedineOggi[schedinaChi].punteggiata ? /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { marginTop: 8 } }, "\u2705 Punteggiata: ", (_i = state.log.find((l) => l.day === day && l.targetId === schedinaChi && l.catId === "schedina")) == null ? void 0 : _i.motivo) : /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { marginTop: 8 } }, "\u23F3 In attesa dei risultati reali di stasera."), /* @__PURE__ */ React.createElement("button", { className: "candy candy-navy", onClick: () => setSchedinaChi("") }, "\u2190 Cambia persona")), schedinaChi && !schedineOggi[schedinaChi] && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { marginTop: 10 } }, (_j = friendById(schedinaChi)) == null ? void 0 : _j.name, ", seleziona i pronostici (", schedinaSel.length, "/15) \u2014", " ", schedinaSel.length < 3 ? "minimo 3" : `moltiplicatore ${moltiplicatoreSchedina(schedinaSel.length).vinci}\xD7`), SCHEDINA_CATALOG.map((c) => {
      var _a2, _b2;
      const idx = schedinaSel.findIndex((s) => s.catalogId === c.id && (c.tipo === "persona" || s.target));
      const attiva = schedinaSel.find((s) => s.catalogId === c.id);
      return /* @__PURE__ */ React.createElement("div", { key: c.id, className: "sched-item" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "sched-toggle" + (attiva ? " sched-on" : ""),
          onClick: () => {
            var _a3;
            if (attiva) {
              setSchedinaSel(schedinaSel.filter((s) => s.catalogId !== c.id));
              return;
            }
            if (schedinaSel.length >= 15) {
              showToast("Massimo 15 pronostici");
              return;
            }
            const primo = (_a3 = state.friends[0]) == null ? void 0 : _a3.id;
            setSchedinaSel([...schedinaSel, { catalogId: c.id, tipo: c.tipo, target: c.tipo === "numero" ? primo : null, pronostico: null }]);
          }
        },
        /* @__PURE__ */ React.createElement("span", { className: "sched-check" }, attiva ? "\u2705" : "\u2B1C"),
        /* @__PURE__ */ React.createElement("span", { className: "sched-testo" }, c.tipo === "numero" ? c.testo.replace("{nome}", attiva ? ((_a2 = friendById(attiva.target)) == null ? void 0 : _a2.name) || "?" : "\u2026") : c.testo)
      ), attiva && /* @__PURE__ */ React.createElement("div", { className: "sched-controls" }, c.tipo === "numero" && /* @__PURE__ */ React.createElement("select", { className: "field field-sm", value: attiva.target || "", onChange: (e) => setSchedinaSel(schedinaSel.map((s) => s.catalogId === c.id ? { ...s, target: e.target.value } : s)) }, state.friends.map((f) => /* @__PURE__ */ React.createElement("option", { key: f.id, value: f.id }, f.name))), c.tipo === "persona" ? /* @__PURE__ */ React.createElement("select", { className: "field field-sm", value: attiva.pronostico || "", onChange: (e) => setSchedinaSel(schedinaSel.map((s) => s.catalogId === c.id ? { ...s, pronostico: e.target.value } : s)) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Chi?"), state.friends.map((f) => /* @__PURE__ */ React.createElement("option", { key: f.id, value: f.id }, f.name))) : /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          className: "field field-sm",
          style: { width: 70 },
          min: c.min,
          max: c.max,
          placeholder: `${c.min}-${c.max}${c.unit || ""}`,
          value: (_b2 = attiva.pronostico) != null ? _b2 : "",
          onChange: (e) => setSchedinaSel(schedinaSel.map((s) => s.catalogId === c.id ? { ...s, pronostico: e.target.value } : s))
        }
      )));
    }), /* @__PURE__ */ React.createElement("button", { className: "candy candy-sun", onClick: () => {
      if (schedinaSel.some((s) => s.pronostico === null || s.pronostico === "")) {
        showToast("Completa tutti i pronostici scelti");
        return;
      }
      salvaSchedina(schedinaChi, schedinaSel);
    } }, "\u{1F3AF} Presenta la schedina"), /* @__PURE__ */ React.createElement("button", { className: "candy candy-navy", onClick: () => {
      setSchedinaChi("");
      setSchedinaSel([]);
    } }, "\u2190 Cambia persona")), domandeOggi.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "contest-card", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("p", { className: "txt" }, "\u{1F319} ", /* @__PURE__ */ React.createElement("strong", null, "Risultati reali di oggi")), !tuttiHannoCompilatoSchedina ? /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "\u23F3 In attesa che tutti completino la schedina (", Object.keys(schedineOggi).length, "/", state.friends.length, ") prima di poter inserire i risultati.") : !sonoArbitroOggi ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "\u2696\uFE0F Solo l'Arbitro di oggi", arbitro ? /* @__PURE__ */ React.createElement(React.Fragment, null, " \u2014 ", /* @__PURE__ */ React.createElement("strong", null, arbitro.name)) : "", " pu\xF2 inserire i risultati reali."), /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { fontSize: 11.5 } }, arbitro ? `Se sei tu, seleziona il tuo nome nella schedina qui sopra per confermare la tua identit\xE0.` : ""), domandeOggi.map((d) => {
      var _a2;
      return /* @__PURE__ */ React.createElement("div", { key: d.key, className: "sched-item" }, /* @__PURE__ */ React.createElement("span", { className: "sched-testo" }, testoDomanda(d.catalogId, d.target)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 800, color: "var(--navy)" } }, risultatiOggi[d.key] != null ? d.tipo === "persona" ? (_a2 = friendById(risultatiOggi[d.key])) == null ? void 0 : _a2.name : risultatiOggi[d.key] : "?"));
    })) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { fontSize: 11.5 } }, "\u2696\uFE0F Sei l'Arbitro di oggi: solo tu puoi inserire questi risultati."), domandeOggi.map((d) => {
      var _a2;
      return /* @__PURE__ */ React.createElement("div", { key: d.key, className: "sched-item" }, /* @__PURE__ */ React.createElement("span", { className: "sched-testo" }, testoDomanda(d.catalogId, d.target)), /* @__PURE__ */ React.createElement("div", { className: "sched-controls" }, d.tipo === "persona" ? /* @__PURE__ */ React.createElement("select", { className: "field field-sm", disabled: risultatiOggi.confermati, value: risultatiOggi[d.key] || "", onChange: (e) => impostaRisultato(d.key, e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "?"), state.friends.map((f) => /* @__PURE__ */ React.createElement("option", { key: f.id, value: f.id }, f.name))) : /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "number",
          className: "field field-sm",
          style: { width: 70 },
          disabled: risultatiOggi.confermati,
          value: (_a2 = risultatiOggi[d.key]) != null ? _a2 : "",
          onChange: (e) => impostaRisultato(d.key, e.target.value)
        }
      )));
    }), risultatiOggi.confermati ? /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { marginTop: 8 } }, "\u2705 Risultati confermati, punti assegnati a tutti.") : /* @__PURE__ */ React.createElement("button", { className: "candy candy-green", onClick: confermaRisultatiSchedina, disabled: !tuttiRisultatiPronti }, tuttiRisultatiPronti ? "\u2705 Conferma e calcola punti" : "Completa tutti i risultati prima"))))), tab === "minigiochi" && (() => {
      var _a2, _b2;
      const m = (_a2 = state.minigiochi) == null ? void 0 : _a2[day];
      const nomeGioco = { reazione: "\u26A1 Riflessi", memoria: "\u{1F9E0} Memoria" };
      const mieCoppie = (m == null ? void 0 : m.coppie.filter((c) => c.a === mioIdValido || c.b === mioIdValido)) || [];
      const coppiaAperta = minigiocoAttivo ? m == null ? void 0 : m.coppie.find((c) => c.id === minigiocoAttivo) : null;
      return /* @__PURE__ */ React.createElement("div", { className: "screen-center" }, /* @__PURE__ */ React.createElement(Panel, { title: "\u{1F579}\uFE0F MINIGIOCHI" }, !m ? /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Gli abbinamenti di oggi si generano da soli a inizio giornata. Torna pi\xF9 tardi!") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Gioco di oggi: ", /* @__PURE__ */ React.createElement("strong", null, nomeGioco[m.gioco]), " \xB7 3 tentativi a testa, conta il migliore. Il vincitore ruba punti allo sconfitto (3 se parte da sotto in classifica, 2 se da sopra)."), !mioIdValido ? /* @__PURE__ */ React.createElement("div", { className: "note", style: { marginTop: 10 } }, "\u{1F464} L'app non sa ancora chi sei su questo telefono. Vai in ", /* @__PURE__ */ React.createElement("strong", null, "\u{1F3AF} Schedina"), " e scegli il tuo nome \u2014 ogni persona gioca solo le proprie sfide, cos\xEC nessuno pu\xF2 giocare per un altro.", /* @__PURE__ */ React.createElement("button", { className: "candy candy-navy", style: { marginTop: 10 }, onClick: () => setTab("schedina") }, "Vai alla Schedina \u2192")) : !coppiaAperta && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { marginTop: 10 } }, "Le tue sfide, ", /* @__PURE__ */ React.createElement("strong", null, (_b2 = friendById(mioIdValido)) == null ? void 0 : _b2.name), ":"), mieCoppie.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Oggi sei il numero dispari: nessuna sfida per te. Ci si rif\xE0 domani!"), mieCoppie.map((c) => {
        var _a3, _b3, _c2, _d2, _e2;
        const avversarioId = c.a === mioIdValido ? c.b : c.a;
        const hoGiocato = c.risultati[mioIdValido] != null;
        return /* @__PURE__ */ React.createElement("div", { key: c.id, className: "contest-card" }, /* @__PURE__ */ React.createElement("p", { className: "txt" }, "\u{1F19A} ", /* @__PURE__ */ React.createElement("strong", null, (_a3 = friendById(mioIdValido)) == null ? void 0 : _a3.name), " vs ", /* @__PURE__ */ React.createElement("strong", null, (_b3 = friendById(avversarioId)) == null ? void 0 : _b3.name)), c.risolta ? /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, c.vincitore === mioIdValido ? "\u{1F3C6} Hai vinto!" : "\u{1F624} Hai perso.", " ", (_c2 = friendById(c.vincitore)) == null ? void 0 : _c2.name, " ruba ", c.rubati, " punti a ", (_d2 = friendById(c.vincitore === c.a ? c.b : c.a)) == null ? void 0 : _d2.name, ".") : hoGiocato ? /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "\u2705 Hai giocato, aspetta che tocchi a ", (_e2 = friendById(avversarioId)) == null ? void 0 : _e2.name, ".") : /* @__PURE__ */ React.createElement("button", { className: "candy candy-coral", onClick: () => setMinigiocoAttivo(c.id) }, "\u{1F3AE} Gioca ora"));
      })), mioIdValido && coppiaAperta && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, nomeGioco[m.gioco], " \xB7 3 tentativi, conta il migliore"), /* @__PURE__ */ React.createElement(
        MinigiocoRunner,
        {
          gioco: m.gioco,
          onFine: (punteggio) => {
            giocaMinigioco(coppiaAperta.id, mioIdValido, punteggio);
            setMinigiocoAttivo(null);
          }
        }
      ), /* @__PURE__ */ React.createElement("button", { className: "candy candy-navy", onClick: () => setMinigiocoAttivo(null) }, "\u2190 Annulla")), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Tutti gli abbinamenti di oggi:"), m.coppie.map((c) => {
        var _a3, _b3, _c2, _d2, _e2, _f2, _g2;
        return /* @__PURE__ */ React.createElement("div", { key: c.id, className: "list-row" }, /* @__PURE__ */ React.createElement(Avatar, { av: (_a3 = friendById(c.a)) == null ? void 0 : _a3.avatar, emoji: (_b3 = friendById(c.a)) == null ? void 0 : _b3.emoji, size: 26 }), /* @__PURE__ */ React.createElement("span", { className: "row-text" }, (_c2 = friendById(c.a)) == null ? void 0 : _c2.name, " vs ", (_d2 = friendById(c.b)) == null ? void 0 : _d2.name), /* @__PURE__ */ React.createElement(Avatar, { av: (_e2 = friendById(c.b)) == null ? void 0 : _e2.avatar, emoji: (_f2 = friendById(c.b)) == null ? void 0 : _f2.emoji, size: 26 }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 800, color: c.risolta ? "var(--verde-scuro)" : "#8FB4C6", marginLeft: 6 } }, c.risolta ? `\u{1F3C6} ${(_g2 = friendById(c.vincitore)) == null ? void 0 : _g2.name}` : "in corso"));
      }))));
    })(), tab === "lamento" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "subtabs" }, /* @__PURE__ */ React.createElement("button", { className: "subtab" + (lamentoView === "segnala" ? " subtab-on" : ""), onClick: () => setLamentoView("segnala") }, "\u{1F624} Segnala"), /* @__PURE__ */ React.createElement("button", { className: "subtab" + (lamentoView === "ruoli" ? " subtab-on" : ""), onClick: () => setLamentoView("ruoli") }, "\u{1F3AD} Ruoli")), lamentoView === "segnala" && /* @__PURE__ */ React.createElement(React.Fragment, null, state.friends.length > 0 && /* @__PURE__ */ React.createElement("button", { className: "candy candy-coral action-big action-solo", onClick: () => {
      setSheet({ mode: "lamento", targetId: "", byId: "" });
      sync("auto");
    } }, /* @__PURE__ */ React.createElement("span", { className: "action-emoji" }, "\u{1F624}"), "SI \xC8 LAMENTATO!", /* @__PURE__ */ React.createElement("span", { className: "action-sub" }, "segnala una lamentela")), state.friends.length === 0 && /* @__PURE__ */ React.createElement(Panel, { title: "BENVENUTI" }, /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Nessun amico nel gruppo."), /* @__PURE__ */ React.createElement("button", { className: "candy candy-teal", onClick: () => setTab("gruppo") }, "\u2795 Aggiungi la banda")), /* @__PURE__ */ React.createElement("div", { className: "friend-grid" }, state.friends.map((f) => {
      const lag = puntiLagna(state, f.id);
      const fan = puntiFanta(state, f.id);
      const oggiN = lamentiDelGiorno(state, f.id, day);
      const scudi = scudiDisponibili(state, f.id);
      const tit = titoloAttuale(state, f.id);
      return /* @__PURE__ */ React.createElement("button", { key: f.id, className: "friend-card", onClick: () => {
        setSheet({ mode: "lamento", targetId: f.id, byId: "" });
        sync("auto");
      } }, /* @__PURE__ */ React.createElement("div", { className: "friend-avatar" }, /* @__PURE__ */ React.createElement(Avatar, { av: f.avatar, emoji: f.emoji, size: 56 })), /* @__PURE__ */ React.createElement("div", { className: "friend-name" }, f.name, " ", badge(streakGiorni(state, f.id)), state.conducente[day] === f.id && " \u{1F697}"), tit && /* @__PURE__ */ React.createElement("div", { className: "friend-title" }, tit.emoji, " ", tit.label), /* @__PURE__ */ React.createElement("div", { className: "friend-stats" }, /* @__PURE__ */ React.createElement("span", { className: "stat-lag" }, "\u{1F624} ", fmtNum(lag)), /* @__PURE__ */ React.createElement("span", { className: "stat-fan" }, "\u2B50 ", fmtNum(fan))), /* @__PURE__ */ React.createElement("div", { className: "friend-sub" }, "oggi ", oggiN, " lagne", scudi > 0 ? ` \xB7 \u{1F6E1}\uFE0F\xD7${scudi}` : ""), /* @__PURE__ */ React.createElement("div", { className: "friend-cta" }, "\u{1F624} + LAMENTO"));
    })), state.log[0] && (state.log[0].status === "pending" || state.log[0].status === "ok") && state.log[0].punti > 0 && now - state.log[0].ts < SALVA_MINUTI * 6e4 && /* @__PURE__ */ React.createElement(Panel, { title: "\u{1F9B8} SALVA-IN EXTREMIS" }, /* @__PURE__ */ React.createElement("p", { className: "txt" }, /* @__PURE__ */ React.createElement("strong", null, (_k = friendById(state.log[0].targetId)) == null ? void 0 : _k.name), ", proponi una soluzione entro ", SALVA_MINUTI, " min e annulla il punto:"), /* @__PURE__ */ React.createElement("input", { className: "field", placeholder: "La soluzione che proponi\u2026", value: salvaMotivo, onChange: (e) => setSalvaMotivo(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "candy candy-green", onClick: () => salvaInExtremis(state.log[0].id, salvaMotivo) }, "Annulla il punto")), pendenti.length > 0 && /* @__PURE__ */ React.createElement("button", { className: "candy candy-navy", onClick: () => setTab("contest") }, "\u2696\uFE0F ", pendenti.length, " da votare \u2192"))), tab === "classifica" && (() => {
      const boards = [
        { id: "generale", emoji: "\u{1F451}", title: "Generale", desc: "Netto = \u2B50 \u2212 \u{1F624} \xB7 il migliore in cima", metric: (id) => nettoFanta(state, id), best: true, showNet: true },
        { id: "lagna", emoji: "\u{1F624}", title: "Lamentosi", desc: "Chi si lagna di pi\xF9 (poco invidiabile)", metric: (id) => puntiLagna(state, id) },
        { id: "sched", emoji: "\u{1F3AF}", title: "Scommettitori", desc: "Punti dalle schedine (in arrivo)", metric: (id) => puntiKind(state, id, "schedina") },
        { id: "player", emoji: "\u{1F3AE}", title: "Player", desc: "Punti dai minigiochi (in arrivo)", metric: (id) => puntiKind(state, id, "minigioco") }
      ];
      return /* @__PURE__ */ React.createElement(Panel, { title: "\u{1F3C6} CLASSIFICHE" }, /* @__PURE__ */ React.createElement(
        SwipeDeck,
        {
          height: Math.max(300, 130 + state.friends.length * 56),
          cards: boards,
          renderCard: (b) => {
            const rows = [...state.friends].map((f) => ({ f, v: b.metric(f.id) })).sort((a, x) => x.v - a.v);
            return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "swipe-title" }, b.emoji, " ", b.title), /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { marginTop: 0 } }, b.desc), rows.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Nessuno in gara."), rows.map((r, k) => {
              const isLast = b.showNet && k === rows.length - 1 && rows.length > 1;
              const tit = b.id === "lagna" ? titoloAttuale(state, r.f.id) : null;
              return /* @__PURE__ */ React.createElement("div", { key: r.f.id, className: "rank-row" + (k === 0 ? " rank-top" : "") + (isLast ? " rank-last" : "") }, /* @__PURE__ */ React.createElement("div", { className: "rank-pos" }, k === 0 ? b.emoji : isLast ? "\u{1F4A9}" : k + 1), /* @__PURE__ */ React.createElement("div", { className: "rank-avatar" }, /* @__PURE__ */ React.createElement(Avatar, { av: r.f.avatar, emoji: r.f.emoji, size: 34 })), /* @__PURE__ */ React.createElement("div", { className: "rank-info" }, /* @__PURE__ */ React.createElement("div", { className: "rank-name" }, r.f.name), tit && /* @__PURE__ */ React.createElement("div", { className: "rank-sub" }, tit.emoji, " ", tit.label)), /* @__PURE__ */ React.createElement("div", { className: "rank-score" + (b.showNet ? r.v >= 0 ? " score-pos" : " score-neg" : "") }, b.showNet && r.v > 0 ? "+" : "", fmtNum(r.v)));
            }), b.showNet && rows.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "note" }, "\u{1F4A9} in fondo sconta le penitenze \xB7 \u{1F451} vince la Fantavacanza"));
          }
        }
      ));
    })(), tab === "contest" && /* @__PURE__ */ React.createElement(Panel, { title: "\u2696\uFE0F VOTAZIONI" }, /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Ogni lamentela vale solo se approvata dalla maggioranza."), pendenti.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Niente da votare. Pace sotto l'ombrellone. \u{1F3D6}\uFE0F"), pendenti.map((e) => {
      var _a2, _b2, _c2, _d2, _e2;
      const votanti = state.friends.filter((f) => f.id !== e.targetId);
      return /* @__PURE__ */ React.createElement("div", { key: e.id, className: "contest-card" }, /* @__PURE__ */ React.createElement("p", { className: "txt" }, (_a2 = infoLamento(e)) == null ? void 0 : _a2.emoji, " ", /* @__PURE__ */ React.createElement("strong", null, (_b2 = friendById(e.byId)) == null ? void 0 : _b2.name), ' segnala "', (_c2 = infoLamento(e)) == null ? void 0 : _c2.label, '"', " ", "a ", /* @__PURE__ */ React.createElement("strong", null, (_d2 = friendById(e.targetId)) == null ? void 0 : _d2.name), " (", puntiFmt(e), ")"), /* @__PURE__ */ React.createElement("p", { className: "txt-warn" }, (_e2 = friendById(e.targetId)) == null ? void 0 : _e2.name, " non vota su se stesso.", arbitro && arbitro.id !== e.targetId && ` Il voto di ${arbitro.name} vale doppio.`), votanti.map((v) => /* @__PURE__ */ React.createElement("div", { key: v.id, className: "vote-row" }, /* @__PURE__ */ React.createElement("span", { className: "vote-name" }, /* @__PURE__ */ React.createElement(Avatar, { av: v.avatar, emoji: v.emoji, size: 22 }), " ", v.name, (arbitro == null ? void 0 : arbitro.id) === v.id && " \u2696\uFE0F"), e.votes[v.id] ? /* @__PURE__ */ React.createElement("span", { className: "vote-done" }, "\u2713 ", e.votes[v.id] === "si" ? "approva" : "respinge") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "chip chip-green", onClick: () => vota(e.id, v.id, "si") }, "\u{1F44D} Vale"), /* @__PURE__ */ React.createElement("button", { className: "chip chip-red", onClick: () => vota(e.id, v.id, "no") }, "\u{1F44E} Non vale")))), votanti.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Servono almeno 2 persone nel gruppo per votare."));
    }), /* @__PURE__ */ React.createElement("div", { className: "note" }, "Votazione asincrona: si chiude appena la maggioranza \xE8 certa. Parit\xE0 = respinta (per questo l'Arbitro pesa doppio).")), tab === "lamento" && lamentoView === "ruoli" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Panel, { title: "\u2696\uFE0F ARBITRO DI TURNO" }, arbitro ? /* @__PURE__ */ React.createElement("p", { className: "txt" }, "Oggi comanda ", /* @__PURE__ */ React.createElement("strong", null, /* @__PURE__ */ React.createElement(Avatar, { av: arbitro.avatar, emoji: arbitro.emoji, size: 22 }), " ", arbitro.name), ": il suo voto vale doppio. Temetelo. Corrompetelo.") : /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Aggiungi amici per nominare l'Arbitro.")), /* @__PURE__ */ React.createElement(Panel, { title: "\u{1F697} SCUDO DEL CONDUCENTE" }, /* @__PURE__ */ React.createElement("p", { className: "txt" }, "Chi guida oggi: primi 2 lamenti gratis."), /* @__PURE__ */ React.createElement("div", { className: "chip-row" }, state.friends.map((f) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: f.id,
        className: "chip" + (state.conducente[day] === f.id ? " chip-on" : ""),
        onClick: () => mutate((s) => {
          s.conducente[day] = s.conducente[day] === f.id ? null : f.id;
          return s;
        })
      },
      /* @__PURE__ */ React.createElement(Avatar, { av: f.avatar, emoji: f.emoji, size: 20 }),
      " ",
      f.name
    )))), /* @__PURE__ */ React.createElement(Panel, { title: "\u{1F0CF} BASTIAN CONTRARIO" }, !bastian ? /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Servono almeno 3 amici.") : bastianOggi.revealed ? /* @__PURE__ */ React.createElement("p", { className: "txt" }, "Il Bastian era ", /* @__PURE__ */ React.createElement("strong", null, /* @__PURE__ */ React.createElement(Avatar, { av: bastian.avatar, emoji: bastian.emoji, size: 22 }), " ", bastian.name), ": ", bastianOggi.esito === "smascherato" ? "smascherato! +3 punti \u{1F575}\uFE0F" : "nessuno l'ha beccato: -3 punti \u{1F608}") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "txt" }, "Uno di voi oggi \xE8 segretamente il Bastian. Guarda la tua carta ", /* @__PURE__ */ React.createElement("strong", null, "senza farti vedere"), "."), /* @__PURE__ */ React.createElement("div", { className: "chip-row" }, /* @__PURE__ */ React.createElement("select", { className: "field field-sm", value: cartaChi, onChange: (e) => {
      setCartaChi(e.target.value);
      setCartaVista(false);
    } }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Chi sei?"), state.friends.map((f) => {
      var _a2;
      return /* @__PURE__ */ React.createElement("option", { key: f.id, value: f.id }, ((_a2 = f.avatar) == null ? void 0 : _a2.f) || f.emoji, " ", f.name);
    })), cartaChi && !cartaVista && /* @__PURE__ */ React.createElement("button", { className: "candy candy-coral candy-sm", onClick: () => setCartaVista(true) }, "\u{1F512} Rivela carta")), cartaChi && cartaVista && /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "carta " + (cartaChi === bastian.id ? "carta-bastian" : "carta-turista"),
        onClick: () => {
          setCartaVista(false);
          setCartaChi("");
        }
      },
      cartaChi === bastian.id ? /* @__PURE__ */ React.createElement(React.Fragment, null, "\u{1F608} SEI IL BASTIAN CONTRARIO", /* @__PURE__ */ React.createElement("span", null, "Fai lamentare gli altri senza farti scoprire \xB7 tap per nascondere")) : /* @__PURE__ */ React.createElement(React.Fragment, null, "\u{1F607} TURISTA TRANQUILLO", /* @__PURE__ */ React.createElement("span", null, "Occhio a chi vi provoca \xB7 tap per nascondere"))
    ), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("p", { className: "txt" }, "\u{1F575}\uFE0F Accusa (1 a testa/giorno) \xB7 fatte: ", Object.keys(bastianOggi.accuse).length), /* @__PURE__ */ React.createElement("div", { className: "chip-row" }, /* @__PURE__ */ React.createElement("select", { className: "field field-sm", value: accusa.accuser, onChange: (e) => setAccusa({ ...accusa, accuser: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Io sono\u2026"), state.friends.map((f) => /* @__PURE__ */ React.createElement("option", { key: f.id, value: f.id }, f.name))), /* @__PURE__ */ React.createElement("select", { className: "field field-sm", value: accusa.accused, onChange: (e) => setAccusa({ ...accusa, accused: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Accuso\u2026"), state.friends.filter((f) => f.id !== accusa.accuser).map((f) => /* @__PURE__ */ React.createElement("option", { key: f.id, value: f.id }, f.name))), /* @__PURE__ */ React.createElement("button", { className: "chip", onClick: accusaBastian }, "Accusa")), /* @__PURE__ */ React.createElement("button", { className: "candy candy-navy", style: { marginTop: 10 }, onClick: rivelaBastian }, "\u{1F3AC} Fine giornata: rivela il Bastian")))), tab === "altro" && /* @__PURE__ */ React.createElement("div", { className: "screen-center" }, /* @__PURE__ */ React.createElement(Panel, { title: "\u{1F9F3} ALTRO" }, /* @__PURE__ */ React.createElement("button", { className: "candy candy-sun menu-btn", onClick: () => setTab("regole") }, "\u{1F4D6} Regole del gioco"), /* @__PURE__ */ React.createElement("button", { className: "candy candy-teal menu-btn", onClick: () => setTab("diario") }, "\u{1F4DC} Storico"), /* @__PURE__ */ React.createElement("button", { className: "candy candy-navy menu-btn", onClick: () => setTab("gruppo") }, "\u2699\uFE0F Gruppo & regole"), /* @__PURE__ */ React.createElement("button", { className: "candy candy-navy menu-btn", onClick: () => {
      setIntroSlide(0);
      setShowIntro(true);
    } }, "\u{1F4FA} Rivedi l'intro"))), isAltro && /* @__PURE__ */ React.createElement("button", { className: "back", onClick: () => setTab("altro") }, "\u2190 Indietro"), tab === "regole" && /* @__PURE__ */ React.createElement("div", { className: "screen-center" }, /* @__PURE__ */ React.createElement(Panel, { title: "\u{1F4D6} REGOLE DEL GIOCO" }, /* @__PURE__ */ React.createElement(
      SwipeDeck,
      {
        height: 230,
        cards: REGOLE_CARDS,
        renderCard: (r, i) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "swipe-emoji" }, r.emoji), /* @__PURE__ */ React.createElement("div", { className: "swipe-title" }, r.title), /* @__PURE__ */ React.createElement("div", { className: "swipe-text" }, r.testo), /* @__PURE__ */ React.createElement("div", { className: "swipe-count" }, i + 1, " / ", REGOLE_CARDS.length))
      }
    ))), tab === "carnet" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Panel, { title: "\u{1F319} PENITENZA DEL GIORNO" }, /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "A mezzanotte in punto: il pi\xF9 lamentoso della giornata sconta una penitenza scelta a voto dal gruppo."), !state.penitenzaVoto && !state.pendingPenitenza && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "countdown" }, "\u23F3 ", countdownMezzanotte()), /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { marginTop: 0 } }, "al verdetto di stanotte")), state.pendingPenitenza && /* @__PURE__ */ React.createElement("div", { className: "note", style: { marginBottom: 10 } }, "\u2696\uFE0F Parit\xE0 di lagna ieri! ", (arbitro == null ? void 0 : arbitro.name) || "L'Arbitro", " sceglie chi sconta:", /* @__PURE__ */ React.createElement("div", { className: "chip-row", style: { justifyContent: "center", marginTop: 8 } }, state.pendingPenitenza.candidati.map((id) => {
      var _a2;
      return /* @__PURE__ */ React.createElement("button", { key: id, className: "chip chip-red", onClick: () => arbitroScegliePenitenza(id) }, (_a2 = friendById(id)) == null ? void 0 : _a2.name);
    }))), state.penitenzaVoto && (() => {
      var _a2;
      const pv = state.penitenzaVoto;
      const votanti = state.friends.filter((f) => f.id !== pv.friendId);
      return /* @__PURE__ */ React.createElement("div", { className: "contest-card" }, /* @__PURE__ */ React.createElement("p", { className: "txt" }, "\u{1F624} ", /* @__PURE__ */ React.createElement("strong", null, (_a2 = friendById(pv.friendId)) == null ? void 0 : _a2.name), " \xE8 il pi\xF9 lamentoso di ieri. Quale penitenza sconta?"), /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { marginTop: 0 } }, "Vota da parte di:"), votanti.map((v) => /* @__PURE__ */ React.createElement("div", { key: v.id, className: "vote-row", style: { flexDirection: "column", alignItems: "stretch" } }, /* @__PURE__ */ React.createElement("span", { className: "vote-name", style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement(Avatar, { av: v.avatar, emoji: v.emoji, size: 20 }), " ", v.name, (arbitro == null ? void 0 : arbitro.id) === v.id && " \u2696\uFE0F"), pv.votes[v.id] != null ? /* @__PURE__ */ React.createElement("span", { className: "vote-done" }, "\u2713 ha votato: ", pv.opzioni[pv.votes[v.id]]) : /* @__PURE__ */ React.createElement("div", { className: "chip-row", style: { justifyContent: "flex-start" } }, pv.opzioni.map((testo, idx) => /* @__PURE__ */ React.createElement("button", { key: idx, className: "chip", onClick: () => votaPenitenza(idx, v.id) }, testo))))));
    })(), state.penitenzeAssegnate.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Nessuna penitenza. Per ora. \u{1F60F}"), state.penitenzeAssegnate.map((p) => {
      var _a2, _b2, _c2;
      return /* @__PURE__ */ React.createElement("div", { key: p.id, className: "list-row" + (p.fatta ? " row-done" : "") }, /* @__PURE__ */ React.createElement(Avatar, { av: (_a2 = friendById(p.friendId)) == null ? void 0 : _a2.avatar, emoji: ((_b2 = friendById(p.friendId)) == null ? void 0 : _b2.emoji) || "\u2753", size: 30 }), /* @__PURE__ */ React.createElement("span", { className: "row-text" }, /* @__PURE__ */ React.createElement("strong", null, ((_c2 = friendById(p.friendId)) == null ? void 0 : _c2.name) || "??"), ": ", p.testo), /* @__PURE__ */ React.createElement("button", { className: "chip", onClick: () => mutate((s) => {
        const x = s.penitenzeAssegnate.find((y) => y.id === p.id);
        if (x) x.fatta = !x.fatta;
        return s;
      }) }, p.fatta ? "\u21A9\uFE0F" : "\u2705"));
    })), /* @__PURE__ */ React.createElement(Panel, { title: `IL CARNET (${state.carnet.length})` }, state.carnet.map((testo, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "list-row" }, /* @__PURE__ */ React.createElement("span", { className: "row-text" }, testo), /* @__PURE__ */ React.createElement("button", { className: "chip", onClick: () => mutate((s) => {
      s.carnet.splice(i, 1);
      return s;
    }) }, "\u2715"))), /* @__PURE__ */ React.createElement("div", { className: "chip-row", style: { marginTop: 8 } }, /* @__PURE__ */ React.createElement("input", { className: "field", style: { flex: 1 }, placeholder: "Nuova penitenza\u2026", value: nuovaPenitenza, onChange: (e) => setNuovaPenitenza(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "candy candy-coral candy-sm", onClick: () => {
      if (nuovaPenitenza.trim()) {
        mutate((s) => {
          s.carnet.push(nuovaPenitenza.trim());
          return s;
        });
        setNuovaPenitenza("");
      }
    } }, "\uFF0B")))), tab === "diario" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Panel, { title: "\u{1F4DC} STORICO" }, state.log.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Nessun evento. Miracolo."), state.log.slice(0, 50).map((l) => {
      var _a2, _b2, _c2, _d2;
      const annullato = l.status === "annullato" || l.status === "salvato";
      const speciale = l.catId === "gratitudine" ? "\u{1F305}" : l.catId === "bastian" ? "\u{1F0CF}" : null;
      return /* @__PURE__ */ React.createElement("div", { key: l.id, className: "list-row" + (annullato ? " row-done" : "") }, /* @__PURE__ */ React.createElement("span", { className: "row-emoji" }, speciale || ((_a2 = infoLamento(l)) == null ? void 0 : _a2.emoji)), /* @__PURE__ */ React.createElement("span", { className: "row-text" }, /* @__PURE__ */ React.createElement("strong", null, ((_b2 = friendById(l.targetId)) == null ? void 0 : _b2.name) || "??"), speciale === "\u{1F305}" ? " \xB7 gratitudine" : speciale === "\u{1F0CF}" ? " \xB7 Bastian" : ` \xB7 ${(_c2 = infoLamento(l)) == null ? void 0 : _c2.label}`, l.byId !== l.targetId && !speciale && /* @__PURE__ */ React.createElement(React.Fragment, null, " (da ", (_d2 = friendById(l.byId)) == null ? void 0 : _d2.name, ")"), l.flags.includes("auto") && " \xB7 \xBD", l.flags.includes("conducente") && " \xB7 \u{1F697}", l.flags.includes("scudo") && " \xB7 \u{1F6E1}\uFE0F", l.flags.includes("respinta") && " \xB7 \u{1F44E} respinta dal gruppo", l.status === "pending" && " \xB7 \u2696\uFE0F in voto", l.status === "salvato" && ` \xB7 \u{1F9B8} ${l.motivo}`), /* @__PURE__ */ React.createElement("span", { className: "row-pts" + (puntiValidi(l) < 0 ? " pts-green" : "") }, l.status === "pending" ? "?" : (puntiValidi(l) > 0 ? "+" : "") + puntiValidi(l)), l.status === "pending" && /* @__PURE__ */ React.createElement("button", { className: "chip", onClick: () => setTab("contest") }, "\u2696\uFE0F"));
    }))), tab === "album" && /* @__PURE__ */ React.createElement(AlbumView, { state, mioIdValido, friendById, mutate, showToast }), tab === "gruppo" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Panel, { title: editingId ? "\u270F\uFE0F MODIFICA AVATAR" : "\u{1F3A8} CREA IL TUO AVATAR" }, /* @__PURE__ */ React.createElement("div", { className: "av-preview" }, /* @__PURE__ */ React.createElement(Avatar, { av: editAv, size: 84 })), /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "field",
        style: { textAlign: "center" },
        placeholder: "Nome dell'amico",
        value: newName,
        maxLength: 20,
        onChange: (e) => setNewName(e.target.value),
        onKeyDown: (e) => e.key === "Enter" && addFriend()
      }
    ), /* @__PURE__ */ React.createElement("p", { className: "txt-c", style: { marginTop: 10 } }, "Faccia"), /* @__PURE__ */ React.createElement("div", { className: "swatch-row" }, FACCE.map((f) => /* @__PURE__ */ React.createElement("button", { key: f, className: "swatch" + (editAv.f === f ? " swatch-on" : ""), onClick: () => setEditAv({ ...editAv, f }) }, f))), /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Accessorio da spiaggia"), /* @__PURE__ */ React.createElement("div", { className: "swatch-row" }, ACCESSORI.map((a) => /* @__PURE__ */ React.createElement("button", { key: a || "none", className: "swatch" + (editAv.a === a ? " swatch-on" : ""), onClick: () => setEditAv({ ...editAv, a }) }, a || "\u{1F6AB}"))), /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Colore"), /* @__PURE__ */ React.createElement("div", { className: "swatch-row" }, COLORI.map((c) => /* @__PURE__ */ React.createElement("button", { key: c, className: "swatch swatch-color" + (editAv.c === c ? " swatch-on" : ""), style: { background: c }, onClick: () => setEditAv({ ...editAv, c }), "aria-label": "Colore " + c }))), /* @__PURE__ */ React.createElement("button", { className: "candy candy-coral", onClick: addFriend }, editingId ? "\u{1F4BE} Salva modifiche" : "\u{1F389} Aggiungi alla banda"), editingId && /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "chip",
        style: { width: "100%", marginTop: 8, justifyContent: "center" },
        onClick: () => {
          setEditingId(null);
          setNewName("");
          setEditAv({ f: FACCE[0], a: "", c: COLORI[0] });
        }
      },
      "Annulla modifica"
    )), /* @__PURE__ */ React.createElement(Panel, { title: "\u2699\uFE0F LA BANDA" }, state.friends.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "txt-c" }, "Ancora nessuno. Crea il primo avatar qui sopra! \u261D\uFE0F"), state.friends.map((f) => /* @__PURE__ */ React.createElement("div", { key: f.id, className: "list-row" }, /* @__PURE__ */ React.createElement(Avatar, { av: f.avatar, emoji: f.emoji, size: 34 }), /* @__PURE__ */ React.createElement("span", { className: "row-text" }, /* @__PURE__ */ React.createElement("strong", null, f.name)), /* @__PURE__ */ React.createElement("button", { className: "chip", onClick: () => modificaAmico(f) }, "\u270F\uFE0F"), /* @__PURE__ */ React.createElement("button", { className: "chip", onClick: () => removeFriend(f.id) }, "\u2715"))), /* @__PURE__ */ React.createElement("div", { className: "chip-row", style: { marginTop: 12, justifyContent: "center" } }, /* @__PURE__ */ React.createElement("button", { className: "chip", onClick: refresh }, "\u{1F504} Ricarica dati"), /* @__PURE__ */ React.createElement("button", { className: "chip chip-red", onClick: nuovaVacanza }, "\u{1F305} Nuova vacanza"))))), sheet && /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: () => setSheet(null) }, /* @__PURE__ */ React.createElement("div", { className: "sheet", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "sheet-handle" }), now - lastSync > 3 * 6e4 && /* @__PURE__ */ React.createElement("div", { className: "stale-warn" }, "\u23F3 Dati di ", Math.round((now - lastSync) / 6e4), " min fa \u2014", /* @__PURE__ */ React.createElement("button", { className: "stale-btn", onClick: () => sync("manual") }, "aggiorna prima di segnalare")), !sheet.targetId && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "sheet-title" }, "\u{1F624} Chi si \xE8 lamentato?"), /* @__PURE__ */ React.createElement("div", { className: "pick-grid" }, state.friends.map((f) => /* @__PURE__ */ React.createElement("button", { key: f.id, className: "pick-btn", onClick: () => setSheet({ ...sheet, targetId: f.id }) }, /* @__PURE__ */ React.createElement(Avatar, { av: f.avatar, emoji: f.emoji, size: 54 }), /* @__PURE__ */ React.createElement("span", null, f.name))))), sheet.targetId && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "sheet-title" }, /* @__PURE__ */ React.createElement(Avatar, { av: (_l = friendById(sheet.targetId)) == null ? void 0 : _l.avatar, emoji: (_m = friendById(sheet.targetId)) == null ? void 0 : _m.emoji, size: 26 }), " Lamento di ", (_n = friendById(sheet.targetId)) == null ? void 0 : _n.name), /* @__PURE__ */ React.createElement("p", { className: "txt" }, "Chi segnala?"), /* @__PURE__ */ React.createElement("div", { className: "chip-row" }, state.friends.map((f) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: f.id,
        className: "chip" + (sheet.byId === f.id ? " chip-on" : ""),
        onClick: () => setSheet({ ...sheet, byId: f.id })
      },
      /* @__PURE__ */ React.createElement(Avatar, { av: f.avatar, emoji: f.emoji, size: 20 }),
      " ",
      f.name,
      f.id === sheet.targetId ? " \xBD" : ""
    ))), sheet.byId && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "txt", style: { marginTop: 12 } }, "Lamenti da viaggio"), /* @__PURE__ */ React.createElement("div", { className: "cat-grid" }, CAT_VIAGGIO.map((c) => /* @__PURE__ */ React.createElement("button", { key: c.id, className: "cat-btn", onClick: () => registraLamento(sheet.targetId, sheet.byId, c.id) }, /* @__PURE__ */ React.createElement("span", { className: "cat-emoji" }, c.emoji), /* @__PURE__ */ React.createElement("span", { className: "cat-label" }, c.label), /* @__PURE__ */ React.createElement("span", { className: "cat-pts" }, "+", c.punti)))), /* @__PURE__ */ React.createElement("p", { className: "txt", style: { marginTop: 10 } }, "\u2026o per gravit\xE0"), /* @__PURE__ */ React.createElement("div", { className: "cat-grid" }, GRAVITA.map((c) => /* @__PURE__ */ React.createElement("button", { key: c.id, className: "cat-btn", onClick: () => registraLamento(sheet.targetId, sheet.byId, c.id) }, /* @__PURE__ */ React.createElement("span", { className: "cat-emoji" }, c.emoji), /* @__PURE__ */ React.createElement("span", { className: "cat-label" }, c.label), /* @__PURE__ */ React.createElement("span", { className: "cat-pts" }, "+", c.punti)))), /* @__PURE__ */ React.createElement("p", { className: "txt", style: { marginTop: 10 } }, "\u270F\uFE0F Altro (lamentela personalizzata)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "field",
        placeholder: "Descrivi il lamento\u2026",
        value: custTesto,
        maxLength: 80,
        onChange: (e) => setCustTesto(e.target.value)
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "chip-row", style: { marginTop: 8 } }, GRAVITA.map((g) => /* @__PURE__ */ React.createElement("button", { key: g.id, className: "chip" + (custPunti === g.punti ? " chip-on" : ""), onClick: () => setCustPunti(g.punti) }, g.emoji, " +", g.punti))), /* @__PURE__ */ React.createElement("button", { className: "candy candy-coral", onClick: () => {
      if (!custTesto.trim()) {
        showToast("Descrivi il lamento");
        return;
      }
      registraLamento(sheet.targetId, sheet.byId, null, { testo: custTesto.trim(), punti: custPunti });
      setCustTesto("");
      setCustPunti(1);
    } }, "Registra lamento personalizzato"), /* @__PURE__ */ React.createElement("div", { className: "note", style: { marginTop: 12 } }, "\u2696\uFE0F La lamentela vale solo se il gruppo la approva a maggioranza. ", (_o = friendById(sheet.targetId)) == null ? void 0 : _o.name, " non vota."))))), /* @__PURE__ */ React.createElement("nav", { className: "bottomnav" }, NAV.map(([id, icon, label, badgeN]) => /* @__PURE__ */ React.createElement("button", { key: id, className: "nav-btn" + (tab === id || id === "altro" && isAltro || id === "gioca" && isGioca ? " nav-on" : ""), onClick: () => setTab(id) }, /* @__PURE__ */ React.createElement("span", { className: "nav-icon" }, icon, badgeN ? /* @__PURE__ */ React.createElement("span", { className: "nav-badge" }, badgeN) : null), /* @__PURE__ */ React.createElement("span", { className: "nav-label" }, label)))), showIntro && /* @__PURE__ */ React.createElement("div", { className: "intro" }, /* @__PURE__ */ React.createElement("button", { className: "intro-skip", onClick: chiudiIntro }, "Salta \u2715"), /* @__PURE__ */ React.createElement("div", { className: "intro-stage", key: introSlide, onClick: () => introSlide < INTRO_SLIDES.length - 1 && setIntroSlide(introSlide + 1) }, /* @__PURE__ */ React.createElement("div", { className: "intro-emoji anim-" + INTRO_SLIDES[introSlide].anim }, INTRO_SLIDES[introSlide].emoji), /* @__PURE__ */ React.createElement("div", { className: "intro-title" }, INTRO_SLIDES[introSlide].title), /* @__PURE__ */ React.createElement("div", { className: "intro-sub" }, INTRO_SLIDES[introSlide].sub)), /* @__PURE__ */ React.createElement("div", { className: "intro-dots" }, INTRO_SLIDES.map((_, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "dot" + (i === introSlide ? " dot-on" : "") }))), introSlide < INTRO_SLIDES.length - 1 ? /* @__PURE__ */ React.createElement("button", { className: "candy candy-coral intro-btn", onClick: () => setIntroSlide(introSlide + 1) }, "Avanti \u2192") : /* @__PURE__ */ React.createElement("button", { className: "candy candy-green intro-btn", onClick: chiudiIntro }, "\u{1F3AE} GIOCA")), toast && /* @__PURE__ */ React.createElement("div", { className: "toast" }, toast));
  }
  var CSS = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;700;800&display=swap');
:root {
  --navy: #0E5A7A;
  --mare: #1FA9C9;
  --mare-scuro: #0E86B2;
  --sabbia: #FBE7B2;
  --corallo: #FF6F61;
  --corallo-scuro: #D94F42;
  --verde: #17B8A6;
  --verde-scuro: #0F8A7C;
  --sole: #FFC53D;
  --carta: #FFFFFF;
  --display: 'Baloo 2', system-ui, sans-serif;
  --body: 'Nunito', system-ui, sans-serif;
}
* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
.app {
  min-height: 100vh; min-height: 100dvh;
  font-family: var(--body); color: var(--navy);
  position: relative; overflow-x: hidden;
}
.bg-scene { position: fixed; inset: 0; z-index: 0; }
.bg-dark { }
.star { animation: twinkle 3s ease-in-out infinite; }
@keyframes twinkle { 0%,100% { opacity: .9; } 50% { opacity: .25; } }

.loading { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; min-height: 60vh; font-family: var(--display); }

/* \u2500\u2500 Top bar \u2500\u2500 */
.topbar {
  position: sticky; top: 0; z-index: 20;
  display: flex; justify-content: center; align-items: center;
  padding: calc(10px + env(safe-area-inset-top)) 14px 8px;
  max-width: 480px; margin: 0 auto; width: 100%;
}

/* Barra dedicata in alto, stesso linguaggio della bottom nav */
.topnav {
  display: flex; gap: 4px;
  background: var(--carta); border-radius: 999px; padding: 4px;
  box-shadow: 0 3px 0 rgba(14,90,122,.2), 0 6px 16px rgba(14,90,122,.18);
}
.topnav-btn {
  border: none; background: none; cursor: pointer; position: relative;
  display: flex; align-items: center; gap: 5px;
  font-family: var(--body); color: #8FB4C6; padding: 6px 12px;
  border-radius: 999px; transition: transform .1s;
}
.topnav-btn:active { transform: scale(.94); }
.topnav-on { color: var(--navy); background: #EAF6FB; }
.topnav-icon { font-size: 16px; line-height: 1; position: relative; }
.topnav-syncing .topnav-icon { color: var(--navy); }
.topnav-label { font-size: 11.5px; font-weight: 800; }
.topnav-badge {
  position: absolute; top: -6px; right: -8px;
  background: var(--corallo); color: #fff; border-radius: 999px;
  font-size: 9.5px; font-weight: 800; padding: 1px 5px; font-family: var(--body); line-height: 1.3;
}

/* \u2500\u2500 Contenuto \u2500\u2500 */
.content {
  position: relative; z-index: 10;
  max-width: 480px; margin: 0 auto; width: 100%;
  padding: 6px 14px calc(96px + env(safe-area-inset-bottom));
  display: flex; flex-direction: column;
  min-height: calc(100dvh - 170px);
}
.content::before, .content::after { content: ""; flex: 1 0 12px; }
.banner {
  background: linear-gradient(180deg, #FF8A7E, var(--corallo));
  color: #fff; border-radius: 18px; padding: 12px 16px;
  font-size: 14px; font-weight: 700; margin-bottom: 12px;
  box-shadow: 0 4px 0 var(--corallo-scuro), 0 8px 20px rgba(217,79,66,.35);
  text-align: center;
}

/* \u2500\u2500 Meter \u2500\u2500 */
.meter {
  background: var(--carta); border-radius: 18px; padding: 12px 16px; margin-bottom: 14px;
  box-shadow: 0 4px 0 rgba(14,90,122,.15), 0 10px 24px rgba(14,90,122,.15);
}
.meter-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 7px; }
.meter-label { font-family: var(--display); font-weight: 800; font-size: 16px; }
.meter-val { font-size: 12px; font-weight: 700; color: #6B93A8; }
.meter-track { height: 14px; background: #E3F2F8; border-radius: 999px; overflow: hidden; }
.meter-fill { height: 100%; border-radius: 999px; transition: width .6s cubic-bezier(.2,1.2,.4,1); }

/* \u2500\u2500 Panel \u2500\u2500 */
.panel { position: relative; margin: 22px 0 16px; }
.panel-tab {
  position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
  background: var(--carta); border-radius: 999px; padding: 5px 18px;
  font-family: var(--display); font-weight: 800; font-size: 13px; letter-spacing: .5px;
  color: var(--navy); white-space: nowrap; max-width: 90%;
  box-shadow: 0 3px 0 rgba(14,90,122,.18), 0 5px 12px rgba(14,90,122,.15);
  z-index: 2;
}
.panel-body {
  background: var(--carta); border-radius: 24px; padding: 24px 16px 18px;
  box-shadow: 0 6px 0 rgba(14,90,122,.14), 0 16px 34px rgba(14,90,122,.2);
  text-align: center;
}
.panel-tab { text-align: center; }
.panel-body .txt { text-align: center; }

/* \u2500\u2500 Hero / frase del giorno \u2500\u2500 */
.hero {
  background: linear-gradient(180deg, #2E86AB, var(--navy));
  border-radius: 24px; padding: 22px 18px; text-align: center; color: #fff;
  box-shadow: 0 6px 0 #093F56, 0 16px 34px rgba(14,90,122,.28);
  margin-top: 6px;
}
.hero-icon { font-size: 40px; }
.hero-quote { font-family: var(--display); font-weight: 800; font-size: 19px; line-height: 1.3; margin: 6px 0; text-shadow: 0 2px 6px rgba(9,63,86,.4); }
.hero-sub { font-size: 12px; font-weight: 700; opacity: .85; }

/* \u2500\u2500 Attivit\xE0 di oggi \u2500\u2500 */
.today-list { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
.today-item {
  display: flex; justify-content: space-between; align-items: center;
  background: #F4FAFD; border-radius: 12px; padding: 10px 14px; font-weight: 800; font-size: 13.5px; color: var(--navy);
}
.today-item-btn {
  width: 100%; border: none; cursor: pointer; font-family: var(--body); text-align: left;
  transition: transform .1s;
}
.today-item-btn:active { transform: scale(.98); }
.today-soon { font-size: 11px; font-weight: 800; color: #8FB4C6; background: #EAF6FB; padding: 3px 9px; border-radius: 999px; }
.today-badge { font-size: 11px; font-weight: 800; color: var(--corallo-scuro); background: #FFF0EE; padding: 3px 10px; border-radius: 999px; text-align: right; white-space: nowrap; }
.today-badge.done { color: var(--verde-scuro); background: #EAFBF7; }
.today-badge.urgent { color: #fff; background: var(--corallo); }

/* \u2500\u2500 Subtab (dentro Lamentometro) \u2500\u2500 */
.subtabs { display: flex; gap: 8px; justify-content: center; margin: 4px 0; }
.subtab {
  border: 2.5px solid #CBE4EF; background: #F4FAFD; color: var(--navy);
  border-radius: 999px; padding: 9px 20px; font-family: var(--display);
  font-weight: 800; font-size: 14px; cursor: pointer;
}
.subtab-on { background: var(--navy); border-color: var(--navy); color: #fff; }

/* \u2500\u2500 Box "in arrivo" \u2500\u2500 */
.soon-box { text-align: center; padding: 10px 4px; }
.soon-emoji { font-size: 54px; margin-bottom: 6px; }

/* \u2500\u2500 Schedina builder \u2500\u2500 */
.sched-item {
  display: flex; flex-direction: column; gap: 6px;
  background: #F4FAFD; border-radius: 12px; padding: 9px 11px; margin-top: 7px; text-align: left;
}
.sched-toggle {
  border: none; background: none; cursor: pointer; display: flex; align-items: center; gap: 8px;
  font-family: var(--body); font-weight: 700; font-size: 13px; color: var(--navy); padding: 0; text-align: left;
}
.sched-on { color: var(--corallo-scuro); font-weight: 800; }
.sched-check { font-size: 15px; }
.sched-testo { flex: 1; }
.sched-controls { display: flex; gap: 8px; padding-left: 24px; }



/* \u2500\u2500 Minigiochi \u2500\u2500 */
.game-box { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 10px 0; }
.game-tap {
  width: 100%; min-height: 140px; border: none; border-radius: 18px; cursor: pointer;
  background: linear-gradient(180deg, #FF8A7E, var(--corallo)); color: #fff;
  font-family: var(--display); font-weight: 800; font-size: 17px;
  box-shadow: 0 4px 0 var(--corallo-scuro);
}
.game-go { background: linear-gradient(180deg, #33D1BE, var(--verde)); box-shadow: 0 4px 0 var(--verde-scuro); }
.game-early { background: linear-gradient(180deg, #FFD666, var(--sole)); box-shadow: 0 4px 0 #D99E1E; color: #6B4E0A; }
.game-result { font-family: var(--display); font-weight: 800; font-size: 26px; color: var(--navy); }
.memory-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; max-width: 260px; }
.memory-tile {
  min-height: 70px; border: 2.5px solid #CBE4EF; border-radius: 16px; background: #F4FAFD;
  font-size: 30px; cursor: pointer; transition: transform .1s, background .1s;
}
.memory-tile:active { transform: scale(.94); }
.memory-on { background: var(--sabbia); border-color: var(--sole); }

/* \u2500\u2500 Swipe cards (regole & classifiche) \u2500\u2500 */
.swipe-track {
  display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory;
  padding: 4px 2px 10px; margin: 0 -4px; -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.swipe-track::-webkit-scrollbar { display: none; }
.swipe-card {
  flex: 0 0 88%; scroll-snap-align: center;
  background: #F4FAFD; border: 2.5px solid #CBE4EF; border-radius: 18px;
  padding: 18px 14px; text-align: center; display: flex; flex-direction: column;
  align-items: center; justify-content: center; min-height: 170px;
}
.board-card { justify-content: flex-start; min-height: 220px; }
.board-card .rank-row { width: 100%; }
.swipe-emoji { font-size: 44px; }
.swipe-title { font-family: var(--display); font-weight: 800; font-size: 17px; color: var(--navy); margin: 4px 0; }
.swipe-text { font-size: 13.5px; font-weight: 600; line-height: 1.5; color: #33607A; }
.swipe-count { margin-top: 10px; font-size: 11px; font-weight: 800; color: #8FB4C6; }

/* \u2500\u2500 SwipeDeck stile Tinder \u2500\u2500 */
.deck { position: relative; margin: 8px 0 10px; user-select: none; -webkit-user-select: none; }
.deck-card {
  position: absolute; inset: 0;
  background: #F4FAFD; border: 2.5px solid #CBE4EF; border-radius: 20px;
  padding: 16px 14px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  overflow-y: auto; text-align: center;
}
.deck-top { cursor: grab; z-index: 2; box-shadow: 0 8px 22px rgba(14,90,122,.18); touch-action: pan-y; }
.deck-top:active { cursor: grabbing; }
.deck-under { transform: scale(.94) translateY(12px); opacity: .7; z-index: 1; }
.deck-card .rank-row { width: 100%; flex: none; }
.deck-dots { display: flex; gap: 6px; justify-content: center; margin-top: 6px; }
.dot2 { width: 8px; height: 8px; border-radius: 999px; background: #CBE4EF; border: none; padding: 0; cursor: pointer; transition: all .2s; }
.dot2-on { background: var(--navy); width: 20px; }

/* \u2500\u2500 Hero button & countdown \u2500\u2500 */
.hero-btn {
  margin-top: 12px; border: none; background: rgba(255,255,255,.18); color: #fff;
  border-radius: 999px; padding: 8px 16px; font-family: var(--display);
  font-weight: 800; font-size: 12.5px; cursor: pointer; letter-spacing: .3px;
}
.hero-btn:active { background: rgba(255,255,255,.3); }
.countdown { font-family: var(--display); font-weight: 800; font-size: 34px; color: var(--navy); margin-top: 6px; }

/* \u2500\u2500 Arbitro del giorno (Home) \u2500\u2500 */
.home-center {
  display: flex; flex-direction: column; justify-content: center;
  min-height: calc(100dvh - 190px);
}
.arbitro-row { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 4px; }
.arbitro-nome { font-family: var(--display); font-weight: 800; font-size: 18px; color: var(--navy); }

/* \u2500\u2500 Centratura verticale schermate \u2500\u2500 */
.screen-center { display: contents; }

/* \u2500\u2500 Compattamento \u2500\u2500 */
.panel { margin: 20px 0 12px; }
.panel-body { padding: 22px 14px 14px; }
.txt { margin: 2px 0 6px; }
.txt-c { margin: 4px 0; }

/* \u2500\u2500 Pulsantoni azione \u2500\u2500 */
.action-duo { display: grid; grid-template-columns: 1.25fr 1fr; gap: 10px; margin-bottom: 14px; }
.action-solo { width: 100%; margin-bottom: 14px; }
.action-big {
  margin-top: 0; padding: 14px 10px 12px; font-size: 16px; letter-spacing: .5px;
  display: flex; flex-direction: column; align-items: center; gap: 2px; line-height: 1.15;
}
.action-emoji { font-size: 30px; }
.action-sub { font-size: 10.5px; font-weight: 700; opacity: .9; letter-spacing: 0; font-family: var(--body); text-transform: none; }
.pick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 6px 0 2px; }
.pick-btn {
  border: 2.5px solid #CBE4EF; background: #F4FAFD; border-radius: 16px;
  padding: 12px 6px 10px; cursor: pointer; font-family: var(--body);
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  font-weight: 800; font-size: 12.5px; color: var(--navy); transition: transform .08s;
}
.pick-btn:active { transform: scale(.93); background: var(--sabbia); }

/* \u2500\u2500 Friend cards \u2500\u2500 */
.friend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.friend-card {
  background: var(--carta); border: none; border-radius: 22px;
  padding: 14px 8px 12px; text-align: center; cursor: pointer;
  font-family: var(--body);
  box-shadow: 0 5px 0 rgba(14,90,122,.16), 0 12px 26px rgba(14,90,122,.18);
  transition: transform .08s;
}
.friend-card:active { transform: translateY(4px); box-shadow: 0 1px 0 rgba(14,90,122,.16), 0 6px 14px rgba(14,90,122,.15); }
.friend-avatar { font-size: 44px; line-height: 1.1; }
.friend-name { font-family: var(--display); font-weight: 800; font-size: 15px; color: var(--navy); margin-top: 2px; }
.friend-title {
  font-size: 10.5px; font-weight: 800; color: var(--corallo-scuro);
  background: #FFF0EE; border-radius: 999px; padding: 2px 9px; display: inline-block; margin: 2px 0;
}
.friend-score { font-family: var(--display); font-weight: 800; font-size: 34px; color: var(--corallo); line-height: 1.05; }
.friend-stats { display: flex; justify-content: center; gap: 10px; margin: 4px 0 2px; }
.stat-lag { font-family: var(--display); font-weight: 800; font-size: 17px; color: var(--corallo); }
.stat-fan { font-family: var(--display); font-weight: 800; font-size: 17px; color: var(--verde-scuro); }
.score-pos { color: var(--verde-scuro) !important; }
.score-neg { color: var(--corallo) !important; }
.rank-last { background: #FFF0EE; }
.friend-sub { font-size: 11px; font-weight: 700; color: #6B93A8; }
.friend-cta {
  margin-top: 9px; background: linear-gradient(180deg, #FF8A7E, var(--corallo));
  color: #fff; border-radius: 12px; padding: 8px 4px;
  font-family: var(--display); font-weight: 800; font-size: 12px; letter-spacing: 1px;
  box-shadow: 0 3px 0 var(--corallo-scuro);
}

/* \u2500\u2500 Candy buttons \u2500\u2500 */
.candy {
  display: block; width: 100%; border: none; cursor: pointer;
  border-radius: 16px; padding: 13px 16px; margin-top: 10px;
  font-family: var(--display); font-weight: 800; font-size: 15px; color: #fff;
  letter-spacing: .3px; transition: transform .08s;
  text-shadow: 0 1px 2px rgba(0,0,0,.15);
}
.candy:active { transform: translateY(3px); filter: brightness(.97); }
.candy-sm { width: auto; padding: 10px 16px; margin-top: 0; font-size: 13px; }
.candy-coral { background: linear-gradient(180deg, #FF8A7E, var(--corallo)); box-shadow: 0 4px 0 var(--corallo-scuro), 0 8px 18px rgba(217,79,66,.3); }
.candy-teal  { background: linear-gradient(180deg, #33D1BE, var(--verde)); box-shadow: 0 4px 0 var(--verde-scuro), 0 8px 18px rgba(15,138,124,.3); }
.candy-green { background: linear-gradient(180deg, #33D1BE, var(--verde)); box-shadow: 0 4px 0 var(--verde-scuro), 0 8px 18px rgba(15,138,124,.3); }
.candy-navy  { background: linear-gradient(180deg, #2E86AB, var(--navy)); box-shadow: 0 4px 0 #093F56, 0 8px 18px rgba(14,90,122,.3); }
.menu-btn { }

/* \u2500\u2500 Chips, fields, rows \u2500\u2500 */
.chip-row { display: flex; gap: 7px; flex-wrap: wrap; align-items: center; }
.chip {
  border: 2.5px solid #CBE4EF; background: #F4FAFD; color: var(--navy);
  border-radius: 999px; padding: 8px 13px; font-family: var(--body);
  font-weight: 800; font-size: 13px; cursor: pointer; min-height: 38px;
}
.chip-on { background: var(--navy); border-color: var(--navy); color: #fff; }
.chip-red { border-color: #FFC4BE; color: var(--corallo-scuro); background: #FFF3F1; }
.chip-green { border-color: #B5E8E1; color: var(--verde-scuro); background: #F0FBF9; }
.chip-avatar { font-size: 20px; padding: 6px 12px; }
.field {
  width: 100%; border: 2.5px solid #CBE4EF; background: #F4FAFD; color: var(--navy);
  border-radius: 14px; padding: 11px 14px; font-family: var(--body);
  font-weight: 700; font-size: 15px; outline: none; margin-top: 8px;
}
.field-sm { width: auto; flex: 1; margin-top: 0; padding: 9px 12px; font-size: 13px; }
.field:focus { border-color: var(--mare); }
.list-row {
  display: flex; align-items: center; gap: 9px;
  background: #F4FAFD; border-radius: 14px; padding: 10px 12px; margin-top: 8px;
  font-size: 13.5px;
}
.row-done { opacity: .5; }
.row-done .row-text { text-decoration: line-through; }
.row-emoji { font-size: 20px; }
.row-text { flex: 1; min-width: 0; font-weight: 600; text-align: left; }
.row-pts { font-family: var(--display); font-weight: 800; color: var(--corallo); white-space: nowrap; }
.pts-green { color: var(--verde-scuro); }
.txt { font-size: 14px; font-weight: 600; margin: 4px 0 8px; line-height: 1.45; }
.txt-c { font-size: 13px; font-weight: 700; color: #6B93A8; text-align: center; margin: 6px 0; }
.txt-warn { font-size: 12.5px; font-weight: 800; color: var(--corallo-scuro); margin: 2px 0 8px; }
.txt-rules { font-size: 12.5px; color: #4A7A93; }
.note {
  margin-top: 12px; background: var(--sabbia); border-radius: 14px;
  padding: 10px 13px; font-size: 12.5px; font-weight: 700; color: #8A6A2F;
}
.divider { border-top: 2px dashed #E3F2F8; margin: 14px 0 10px; }
.back {
  position: relative; z-index: 10; display: block; margin: 4px 0 -8px;
  border: none; background: none; color: var(--navy);
  font-family: var(--display); font-weight: 800; font-size: 14px; cursor: pointer; padding: 6px 2px;
}

/* \u2500\u2500 Classifica \u2500\u2500 */
.rank-row { display: flex; align-items: center; gap: 10px; background: #F4FAFD; border-radius: 16px; padding: 11px 13px; margin-top: 9px; }
.rank-top { background: linear-gradient(180deg, #FFF3CE, #FFE9A8); }
.rank-pos { font-family: var(--display); font-weight: 800; font-size: 18px; width: 24px; text-align: center; }
.rank-avatar { font-size: 28px; }
.rank-info { flex: 1; min-width: 0; text-align: left; }
.rank-name { font-family: var(--display); font-weight: 800; font-size: 15px; }
.rank-sub { font-size: 11.5px; font-weight: 700; color: #6B93A8; }
.rank-score { font-family: var(--display); font-weight: 800; font-size: 24px; color: var(--corallo); }

/* \u2500\u2500 Contest & vote \u2500\u2500 */
.contest-card { background: #F4FAFD; border-radius: 16px; padding: 12px 13px; margin-top: 10px; text-align: left; }
.vote-row { display: flex; align-items: center; gap: 6px; margin-top: 7px; flex-wrap: wrap; }
.vote-name { flex: 1; font-weight: 800; font-size: 13.5px; min-width: 110px; }
.vote-done { font-size: 13px; font-weight: 800; color: var(--verde-scuro); }

/* \u2500\u2500 Carta segreta \u2500\u2500 */
.carta {
  display: block; width: 100%; border: none; cursor: pointer;
  border-radius: 20px; padding: 22px 16px; margin-top: 12px;
  font-family: var(--display); font-weight: 800; font-size: 17px; color: #fff;
  letter-spacing: .5px; text-align: center;
}
.carta span { display: block; font-size: 12px; font-weight: 700; margin-top: 8px; opacity: .85; font-family: var(--body); letter-spacing: 0; }
.carta-bastian { background: linear-gradient(180deg, #3A1030, #1E0A2E); box-shadow: 0 5px 0 #12061C, 0 12px 28px rgba(30,10,46,.5); }
.carta-turista { background: linear-gradient(180deg, #1B7F6E, #0E5A4E); box-shadow: 0 5px 0 #093B33, 0 12px 28px rgba(14,90,78,.4); }

/* \u2500\u2500 Bottom sheet \u2500\u2500 */
.overlay {
  position: fixed; inset: 0; z-index: 40;
  background: rgba(14,60,90,.5); backdrop-filter: blur(3px);
  display: flex; align-items: flex-end; justify-content: center;
}
.sheet {
  background: var(--carta); width: 100%; max-width: 480px;
  border-radius: 26px 26px 0 0; padding: 10px 18px calc(20px + env(safe-area-inset-bottom));
  max-height: 82dvh; overflow-y: auto;
  animation: slideup .28s cubic-bezier(.2,1.1,.4,1);
  box-shadow: 0 -12px 40px rgba(14,60,90,.35);
}
@keyframes slideup { from { transform: translateY(60%); opacity: .4; } to { transform: none; opacity: 1; } }
.sheet-handle { width: 44px; height: 5px; background: #CBE4EF; border-radius: 999px; margin: 4px auto 12px; }
.sheet-title { font-family: var(--display); font-weight: 800; font-size: 18px; text-align: center; margin-bottom: 8px; }
.cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.cat-btn {
  display: flex; align-items: center; gap: 7px;
  border: 2.5px solid #CBE4EF; background: #F4FAFD; border-radius: 14px;
  padding: 11px 10px; cursor: pointer; font-family: var(--body); min-height: 52px;
  transition: transform .08s;
}
.cat-btn:active { transform: scale(.96); background: var(--sabbia); }
.cat-emoji { font-size: 22px; }
.cat-label { flex: 1; text-align: left; font-weight: 800; font-size: 12px; color: var(--navy); line-height: 1.2; }
.cat-pts { font-family: var(--display); font-weight: 800; font-size: 14px; color: var(--corallo); }

/* \u2500\u2500 Bottom nav \u2500\u2500 */
.bottomnav {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 30;
  display: flex; justify-content: space-around;
  background: var(--carta);
  padding: 8px 6px calc(10px + env(safe-area-inset-bottom));
  box-shadow: 0 -8px 28px rgba(14,60,90,.22);
  border-radius: 22px 22px 0 0;
  max-width: 520px; margin: 0 auto;
}
.nav-btn {
  border: none; background: none; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  font-family: var(--body); color: #8FB4C6; padding: 4px 8px; min-width: 56px;
  border-radius: 14px; transition: transform .1s;
}
.nav-btn:active { transform: scale(.92); }
.nav-on { color: var(--navy); background: #EAF6FB; }
.nav-icon { font-size: 22px; position: relative; }
.nav-badge {
  position: absolute; top: -4px; right: -10px;
  background: var(--corallo); color: #fff; border-radius: 999px;
  font-size: 10px; font-weight: 800; padding: 1px 5px; font-family: var(--body);
}
.nav-label { font-size: 10.5px; font-weight: 800; }

/* \u2500\u2500 Toast \u2500\u2500 */
.toast {
  position: fixed; bottom: calc(86px + env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%);
  background: var(--navy); color: #fff; padding: 11px 20px; border-radius: 999px;
  font-size: 14px; font-weight: 800; z-index: 60; white-space: nowrap; max-width: 92vw;
  overflow: hidden; text-overflow: ellipsis;
  box-shadow: 0 4px 0 #093F56, 0 10px 26px rgba(9,63,86,.4);
  animation: pop .25s cubic-bezier(.2,1.4,.4,1);
}
@keyframes pop { from { transform: translate(-50%, 14px) scale(.9); opacity: 0; } to { transform: translate(-50%, 0) scale(1); opacity: 1; } }

button:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid var(--sole); outline-offset: 2px; }

/* \u2500\u2500 Avatar \u2500\u2500 */
.avatar {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 999px; position: relative; vertical-align: middle;
  box-shadow: inset 0 -3px 0 rgba(0,0,0,.08), 0 2px 5px rgba(14,90,122,.2);
  border: 2.5px solid #fff; flex: none;
}
.avatar-acc {
  position: absolute; right: -6%; bottom: -8%;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.25));
}
.av-preview { display: flex; justify-content: center; margin: 6px 0 4px; }
.swatch-row { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; margin: 4px 0 10px; }
.swatch {
  width: 42px; height: 42px; border-radius: 12px; border: 2.5px solid #CBE4EF;
  background: #F4FAFD; font-size: 21px; cursor: pointer; padding: 0;
  display: flex; align-items: center; justify-content: center; transition: transform .08s;
}
.swatch:active { transform: scale(.9); }
.swatch-on { border-color: var(--navy); box-shadow: 0 0 0 2.5px var(--sole); }
.swatch-color { font-size: 0; }

/* \u2500\u2500 Equilibrio & centratura \u2500\u2500 */
.topbar { max-width: 480px; margin: 0 auto; width: 100%; }
.friend-grid { justify-items: stretch; }
.friend-card:last-child:nth-child(odd) { grid-column: 1 / -1; max-width: 60%; width: 100%; margin: 0 auto; }
@media (min-width: 500px) {
  .friend-card:last-child:nth-child(odd) { grid-column: auto; max-width: none; margin: 0; }
}
.menu-btn { text-align: center; }
.banner, .meter, .note { max-width: 100%; }
.back { text-align: center; width: 100%; }
.vote-name, .rank-name, .sheet-title { display: flex; align-items: center; gap: 6px; }
.sheet-title { justify-content: center; }
.list-row .chip { padding: 6px 10px; min-height: 34px; }

/* \u2500\u2500 Sync \u2500\u2500 */
.sync-on { display: inline-block; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.stale-warn {
  background: var(--sabbia); border-radius: 12px; padding: 9px 12px; margin-bottom: 10px;
  font-size: 12.5px; font-weight: 800; color: #8A6A2F; text-align: center;
}
.stale-btn {
  border: none; background: none; color: var(--corallo-scuro); font-weight: 800;
  font-size: 12.5px; cursor: pointer; text-decoration: underline; font-family: var(--body); padding: 0 3px;
}

/* \u2500\u2500 Intro \u2500\u2500 */
.intro {
  position: fixed; inset: 0; z-index: 100;
  background: linear-gradient(180deg, #0E5A7A 0%, #1FA9C9 55%, #FBE7B2 130%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 24px 20px calc(28px + env(safe-area-inset-bottom));
}
.intro-skip {
  position: absolute; top: calc(14px + env(safe-area-inset-top)); right: 16px;
  border: none; background: rgba(255,255,255,.2); color: #fff;
  border-radius: 999px; padding: 8px 15px; font-family: var(--display);
  font-weight: 800; font-size: 13px; cursor: pointer;
}
.intro-stage { text-align: center; max-width: 340px; cursor: pointer; flex: 0 1 auto; }
.intro-emoji { font-size: 76px; line-height: 1.15; margin-bottom: 18px; }
.intro-title {
  font-family: var(--display); font-weight: 800; font-size: 26px; color: #fff;
  line-height: 1.2; text-shadow: 0 2px 8px rgba(9,63,86,.4);
  animation: introtxt .5s cubic-bezier(.2,1.3,.4,1) both;
}
.intro-sub {
  margin-top: 12px; font-size: 15px; font-weight: 700; color: #EAF8FD;
  line-height: 1.45; animation: introtxt .5s .15s cubic-bezier(.2,1.3,.4,1) both;
}
@keyframes introtxt { from { transform: translateY(22px) scale(.94); opacity: 0; } to { transform: none; opacity: 1; } }
.anim-float { animation: introfloat 2.6s ease-in-out infinite; }
@keyframes introfloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-13px); } }
.anim-shake { animation: introshake .55s .3s cubic-bezier(.3,1.6,.5,1) both; }
@keyframes introshake {
  0% { transform: scale(0) rotate(-20deg); } 55% { transform: scale(1.25) rotate(9deg); }
  75% { transform: scale(.95) rotate(-5deg); } 100% { transform: scale(1) rotate(0); }
}
.anim-drop { animation: introdrop .6s cubic-bezier(.25,1.5,.4,1) both; }
@keyframes introdrop { from { transform: translateY(-90px); opacity: 0; } 65% { transform: translateY(10px); opacity: 1; } to { transform: none; } }
.intro-dots { display: flex; gap: 7px; margin: 26px 0 14px; }
.dot { width: 8px; height: 8px; border-radius: 999px; background: rgba(255,255,255,.35); transition: all .2s; }
.dot-on { background: #fff; width: 22px; }
.intro-btn { max-width: 300px; font-size: 17px; padding: 15px 16px; }
.candy-sun { background: linear-gradient(180deg, #FFD666, var(--sole)); box-shadow: 0 4px 0 #D99E1E, 0 8px 18px rgba(217,158,30,.3); color: #6B4E0A; text-shadow: none; }

@media (prefers-reduced-motion: reduce) { *, .star { animation: none !important; transition: none !important; } }
@media (min-width: 500px) { .friend-grid { grid-template-columns: 1fr 1fr 1fr; } }
`;
  window.LamentometroBeach = LamentometroBeach;
})();
