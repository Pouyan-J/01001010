/**
 * Enigma simulator UI. All cipher logic lives in enigma.js (EnigmaCore).
 *
 * Model: the message is the source of truth. Output is always
 * Enigma(settings, start positions).process(message), so changing any
 * setting re-encrypts the whole message. The rotor windows show the live
 * positions after the last letter; the arrows change the start positions.
 */
(() => {
  "use strict";

  const { Enigma, ROTOR_DATA, REFLECTOR_DATA, ALPHABET, group } = EnigmaCore;
  const { t } = I18N; // German by default; see i18n.js

  const ROWS = ["QWERTZUIO", "ASDFGHJK", "PYXCVBNML"]; // the Enigma keyboard layout
  const CABLE_COLORS = [
    "#e5533d", "#4aa3df", "#f0c43c", "#5fc97a", "#b07cd8", "#f08a3c", "#3fc9b4",
    "#ec5f9a", "#9fb0bd", "#c9763c", "#7aa2f7", "#b5c94a", "#d9a0e0",
  ];
  const ROTOR_NAMES = Object.keys(ROTOR_DATA);

  const mod26 = (n) => ((n % 26) + 26) % 26;
  const $ = (sel) => document.querySelector(sel);

  const defaults = () => ({
    rotors: ["I", "II", "III"],
    reflector: "B",
    rings: [0, 0, 0],
    start: [0, 0, 0],
    plugs: [], // { a, b, color }
  });

  const state = { ...defaults(), input: "", grouped: true };
  let lastOutput = "";
  let pendingSocket = null;

  const els = {
    reflector: $("#reflector"),
    rotors: $("#rotors"),
    lampboard: $("#lampboard"),
    keyboard: $("#keyboard"),
    plugboard: $("#plugboard"),
    sockets: $("#sockets"),
    cables: $("#cables"),
    plugText: $("#plugText"),
    plugMsg: $("#plugMsg"),
    input: $("#input"),
    output: $("#output"),
    count: $("#count"),
    grouped: $("#grouped"),
  };

  const lampEls = {};
  const keyEls = {};
  const rotorUI = [];
  const shown = [null, null, null]; // last window letters, to animate changes

  /* ---------------------------------------------------------------- build */

  function buildBoards() {
    for (const [container, kind] of [[els.lampboard, "lamp"], [els.keyboard, "key"]]) {
      container.innerHTML = ROWS.map((row) => {
        const cells = Array.from(row, (L) =>
          kind === "lamp"
            ? `<div class="lamp" data-letter="${L}">${L}</div>`
            : `<button type="button" class="key" data-letter="${L}" tabindex="-1" aria-label="${t("keyAria", { L })}">${L}</button>`
        ).join("");
        return `<div class="row">${cells}</div>`;
      }).join("");
      container.querySelectorAll(`.${kind}`).forEach((el) => {
        (kind === "lamp" ? lampEls : keyEls)[el.dataset.letter] = el;
      });
    }
  }

  function buildSelects() {
    els.reflector.innerHTML = Object.keys(REFLECTOR_DATA)
      .map((r) => `<option value="${r}">${r}</option>`)
      .join("");
  }

  function buildRotors() {
    const rotorOptions = ROTOR_NAMES.map((n) => `<option>${n}</option>`).join("");
    const ringOptions = Array.from(ALPHABET, (L, i) => `<option value="${i}">${L} (${String(i + 1).padStart(2, "0")})</option>`).join("");

    els.rotors.innerHTML = [0, 1, 2].map((i) => {
      const slot = t("slotName" + i);
      return `
      <div class="rotor" data-slot="${i}">
        <label>${t("slotLabel" + i)}<select class="sel-rotor" aria-label="${t("rotorAria", { slot })}">${rotorOptions}</select></label>
        <button type="button" class="step up" aria-label="${t("nextAria", { slot })}">&#9650;</button>
        <div class="window" role="img" aria-label="${t("posAria", { slot })}">
          <span class="w-prev"></span><span class="w-cur"></span><span class="w-next"></span>
        </div>
        <button type="button" class="step down" aria-label="${t("prevAria", { slot })}">&#9660;</button>
        <label>${t("ring")}<select class="sel-ring" aria-label="${t("ringAria", { slot })}">${ringOptions}</select></label>
        <div class="rotor-meta"><span class="start"></span><span class="notch"></span></div>
      </div>`;
    }).join("");

    els.rotors.querySelectorAll(".rotor").forEach((root, i) => {
      rotorUI[i] = {
        root,
        selRotor: root.querySelector(".sel-rotor"),
        selRing: root.querySelector(".sel-ring"),
        win: root.querySelector(".window"),
        prev: root.querySelector(".w-prev"),
        cur: root.querySelector(".w-cur"),
        next: root.querySelector(".w-next"),
        start: root.querySelector(".start"),
        notch: root.querySelector(".notch"),
      };
    });
  }

  function buildPlugboard() {
    els.sockets.innerHTML = ROWS.map((row) =>
      `<div class="row">${Array.from(row, (L) =>
        `<button type="button" class="socket" data-letter="${L}" aria-label="${t("socketAria", { L })}"><span>${L}</span><span class="hole"></span></button>`
      ).join("")}</div>`
    ).join("");
  }

  /* --------------------------------------------------------------- update */

  const plugString = () => state.plugs.map((p) => p.a + p.b).join(" ");
  const letters = (arr) => arr.map((i) => ALPHABET[i]).join("");

  function update() {
    const machine = new Enigma(state.rotors, state.reflector, letters(state.rings), letters(state.start), plugString());
    lastOutput = machine.process(state.input);
    render(machine);
    return lastOutput;
  }

  function render(machine) {
    // rotors
    const live = [machine.left, machine.middle, machine.right];
    live.forEach((rotor, i) => {
      const ui = rotorUI[i];
      const pos = rotor.position;
      const letter = ALPHABET[pos];
      ui.selRotor.value = state.rotors[i];
      ui.selRing.value = String(state.rings[i]);
      ui.prev.textContent = ALPHABET[mod26(pos - 1)];
      ui.cur.textContent = letter;
      ui.next.textContent = ALPHABET[mod26(pos + 1)];
      ui.start.textContent = `${t("start")} ${ALPHABET[state.start[i]]}`;
      if (i === 0) {
        ui.notch.textContent = "";
      } else {
        ui.notch.textContent = `${t("notch")} ${Array.from(rotor.notches, (n) => ALPHABET[n]).sort().join("/")}`;
        ui.root.classList.toggle("at-notch", rotor.atNotch());
      }
      if (shown[i] !== null && shown[i] !== letter && ui.win.animate) {
        ui.win.animate(
          [{ transform: "translateY(10px)", opacity: 0.5 }, { transform: "none", opacity: 1 }],
          { duration: 150, easing: "ease-out" }
        );
      }
      shown[i] = letter;
    });
    els.reflector.value = state.reflector;

    // message
    els.output.textContent = state.grouped ? group(lastOutput) : lastOutput;
    els.output.scrollTop = els.output.scrollHeight;
    els.count.textContent = `${lastOutput.length} ${t(lastOutput.length === 1 ? "letter" : "letters")}`;

    renderPlugboard();
  }

  /* --------------------------------------------------- lamps, keys, typing */

  let lampTimer = 0;
  let heldSource = null;

  function lampOn(letter, source = null, autoOff = 0) {
    lampOff();
    lampEls[letter].classList.add("lit");
    heldSource = source;
    if (autoOff) lampTimer = setTimeout(lampOff, autoOff);
  }

  function lampOff() {
    clearTimeout(lampTimer);
    heldSource = null;
    for (const L in lampEls) lampEls[L].classList.remove("lit");
  }

  function release(letter) {
    keyEls[letter].classList.remove("down");
    if (heldSource === letter) lampOff();
  }

  function releaseAll() {
    for (const L in keyEls) keyEls[L].classList.remove("down");
    lampOff();
  }

  function setInput(text) {
    state.input = text;
    els.input.value = text;
    els.input.scrollTop = els.input.scrollHeight;
  }

  function press(letter) {
    setInput(state.input + letter);
    const out = update();
    if (out) lampOn(out.slice(-1), letter);
  }

  // On-screen keys
  let activePointerLetter = null;
  els.keyboard.addEventListener("pointerdown", (e) => {
    const key = e.target.closest(".key");
    if (!key) return;
    e.preventDefault();
    activePointerLetter = key.dataset.letter;
    key.classList.add("down");
    press(activePointerLetter);
  });
  els.keyboard.addEventListener("mousedown", (e) => e.preventDefault()); // keep focus where it was
  const pointerUp = () => {
    if (activePointerLetter) release(activePointerLetter);
    activePointerLetter = null;
  };
  window.addEventListener("pointerup", pointerUp);
  window.addEventListener("pointercancel", pointerUp);

  // Physical keyboard
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target.tagName;
    if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;

    if (/^[a-z]$/i.test(e.key)) {
      e.preventDefault();
      if (e.repeat) return;
      const L = e.key.toUpperCase();
      keyEls[L].classList.add("down");
      press(L);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      setInput(Array.from(state.input).slice(0, -1).join(""));
      update();
    } else if (e.key === " " && tag !== "BUTTON") {
      e.preventDefault();
      setInput(state.input + " ");
      update();
    } else if (e.key === "Escape" && pendingSocket) {
      pendingSocket = null;
      renderPlugboard();
    }
  });

  document.addEventListener("keyup", (e) => {
    if (/^[a-z]$/i.test(e.key)) release(e.key.toUpperCase());
  });
  window.addEventListener("blur", releaseAll);

  // Typing straight into the input box
  els.input.addEventListener("input", (e) => {
    state.input = els.input.value;
    const out = update();
    if (out && e.inputType && e.inputType.startsWith("insert") && /[a-z]/i.test(e.data || "")) {
      lampOn(out.slice(-1), null, 600);
    }
  });

  /* -------------------------------------------------------- rotor controls */

  els.rotors.addEventListener("change", (e) => {
    const slot = e.target.closest(".rotor");
    if (!slot) return;
    const i = Number(slot.dataset.slot);

    if (e.target.classList.contains("sel-rotor")) {
      const wanted = e.target.value;
      const j = state.rotors.indexOf(wanted);
      if (j !== -1 && j !== i) state.rotors[j] = state.rotors[i]; // each rotor is used once: swap
      state.rotors[i] = wanted;
    } else if (e.target.classList.contains("sel-ring")) {
      state.rings[i] = Number(e.target.value);
    }
    update();
  });

  function turn(i, delta) {
    state.start[i] = mod26(state.start[i] + delta);
    update();
  }

  els.rotors.addEventListener("click", (e) => {
    const btn = e.target.closest(".step");
    if (!btn) return;
    turn(Number(btn.closest(".rotor").dataset.slot), btn.classList.contains("up") ? 1 : -1);
  });

  els.rotors.addEventListener("wheel", (e) => {
    const win = e.target.closest(".window");
    if (!win) return;
    e.preventDefault();
    turn(Number(win.closest(".rotor").dataset.slot), e.deltaY > 0 ? -1 : 1);
  }, { passive: false });

  els.reflector.addEventListener("change", () => {
    state.reflector = els.reflector.value;
    update();
  });

  /* ------------------------------------------------------------ plugboard */

  const plugOf = (L) => state.plugs.find((p) => p.a === L || p.b === L);

  function nextColor() {
    const used = new Set(state.plugs.map((p) => p.color));
    const free = CABLE_COLORS.findIndex((_, i) => !used.has(i));
    return free === -1 ? 0 : free;
  }

  els.sockets.addEventListener("click", (e) => {
    const socket = e.target.closest(".socket");
    if (!socket) return;
    const L = socket.dataset.letter;
    const existing = plugOf(L);

    if (existing) {
      if (pendingSocket) {
        socket.classList.add("nope");
        setTimeout(() => socket.classList.remove("nope"), 300);
        return;
      }
      state.plugs = state.plugs.filter((p) => p !== existing);
    } else if (pendingSocket === null) {
      pendingSocket = L;
    } else if (pendingSocket === L) {
      pendingSocket = null;
    } else {
      state.plugs.push({ a: pendingSocket, b: L, color: nextColor() });
      pendingSocket = null;
    }
    showPlugMessage();
    update();
  });

  // The current message is stored as a key so it can be re-translated on language change.
  let plugMsg = { key: "plugHelp", params: null, error: false };

  function renderPlugMessage() {
    els.plugMsg.textContent = t(plugMsg.key, plugMsg.params);
    els.plugMsg.classList.toggle("error", plugMsg.error);
  }

  function showPlugMessage(key = "plugHelp", params = null, isError = false) {
    plugMsg = { key, params, error: isError };
    renderPlugMessage();
  }

  els.plugText.addEventListener("change", () => {
    const pairs = els.plugText.value.toUpperCase().split(/[\s,]+/).filter(Boolean);
    const used = new Set();
    for (const pair of pairs) {
      if (!/^[A-Z]{2}$/.test(pair) || pair[0] === pair[1]) {
        showPlugMessage("plugInvalid", { pair }, true);
        return;
      }
      if (used.has(pair[0]) || used.has(pair[1])) {
        showPlugMessage("plugDuplicate", { pair }, true);
        return;
      }
      used.add(pair[0]);
      used.add(pair[1]);
    }
    const keep = new Map(state.plugs.map((p) => [p.a + p.b, p.color]));
    state.plugs = [];
    for (const pair of pairs) {
      const color = keep.has(pair) ? keep.get(pair) : keep.get(pair[1] + pair[0]);
      state.plugs.push({ a: pair[0], b: pair[1], color: color !== undefined ? color : nextColor() });
    }
    pendingSocket = null;
    showPlugMessage();
    update();
  });

  $("#plugClear").addEventListener("click", () => {
    state.plugs = [];
    pendingSocket = null;
    showPlugMessage();
    update();
  });

  function renderPlugboard() {
    els.sockets.querySelectorAll(".socket").forEach((s) => {
      const L = s.dataset.letter;
      s.classList.toggle("pending", pendingSocket === L);
      const p = plugOf(L);
      s.setAttribute(
        "aria-label",
        p ? t("socketAriaPlugged", { L, M: p.a === L ? p.b : p.a }) : t("socketAria", { L })
      );
    });
    if (document.activeElement !== els.plugText) els.plugText.value = plugString();
    drawCables();
  }

  function holeCenter(letter, box) {
    const hole = els.sockets.querySelector(`.socket[data-letter="${letter}"] .hole`).getBoundingClientRect();
    return { x: hole.left + hole.width / 2 - box.left, y: hole.top + hole.height / 2 - box.top };
  }

  function drawCables() {
    const box = els.plugboard.getBoundingClientRect();
    if (!box.width) return;
    els.cables.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    els.cables.innerHTML = state.plugs.map((p) => {
      const a = holeCenter(p.a, box);
      const b = holeCenter(p.b, box);
      const sag = 30 + Math.hypot(a.x - b.x, a.y - b.y) * 0.22;
      const d = `M${a.x},${a.y} C${a.x},${a.y + sag} ${b.x},${b.y + sag} ${b.x},${b.y}`;
      const color = CABLE_COLORS[p.color];
      return `
        <path d="${d}" transform="translate(0 3)" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="7" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
        <path d="${d}" transform="translate(-1 -1)" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="${a.x}" cy="${a.y}" r="9" fill="${color}" stroke="#101213" stroke-width="2"/>
        <circle cx="${b.x}" cy="${b.y}" r="9" fill="${color}" stroke="#101213" stroke-width="2"/>`;
    }).join("");
  }

  if (window.ResizeObserver) new ResizeObserver(drawCables).observe(els.plugboard);
  window.addEventListener("resize", drawCables);

  /* ------------------------------------------------------------ tape tools */

  els.grouped.addEventListener("change", () => {
    state.grouped = els.grouped.checked;
    update();
  });

  $("#btnClear").addEventListener("click", () => {
    setInput("");
    update();
    lampOff();
  });

  $("#btnSwap").addEventListener("click", () => {
    if (!lastOutput) return;
    setInput(lastOutput);
    update();
  });

  $("#btnCopy").addEventListener("click", async (btnEvent) => {
    const btn = btnEvent.currentTarget;
    const text = els.output.textContent;
    if (!lastOutput) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (__) { /* nothing more to try */ }
      ta.remove();
    }
    btn.textContent = t("copied");
    setTimeout(() => { btn.textContent = t("copy"); }, 1200);
  });

  /* -------------------------------------------------------- machine presets */

  function randInt(n) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  $("#btnRandom").addEventListener("click", () => {
    const keys = Object.keys(REFLECTOR_DATA);
    state.rotors = shuffle(ROTOR_NAMES).slice(0, 3);
    state.reflector = keys[randInt(keys.length)];
    state.rings = [randInt(26), randInt(26), randInt(26)];
    state.start = [randInt(26), randInt(26), randInt(26)];
    const pool = shuffle(Array.from(ALPHABET)).slice(0, 20);
    state.plugs = [];
    for (let i = 0; i < pool.length; i += 2) {
      state.plugs.push({ a: pool[i], b: pool[i + 1], color: nextColor() });
    }
    pendingSocket = null;
    showPlugMessage();
    update();
  });

  $("#btnReset").addEventListener("click", () => {
    Object.assign(state, defaults());
    pendingSocket = null;
    showPlugMessage();
    update();
  });

  /* ----------------------------------------------------------------- start */

  /* -------------------------------------------------------------- language */

  const langBtn = $("#btnLang");

  function applyLanguage() {
    I18N.applyStatic();
    langBtn.lang = I18N.getLang() === "de" ? "en" : "de"; // the button names the other language
    for (const L in keyEls) keyEls[L].setAttribute("aria-label", t("keyAria", { L }));
    buildRotors(); // rotor labels are generated, so rebuild them in the new language
    renderPlugMessage();
    update();
  }

  langBtn.addEventListener("click", () => {
    I18N.setLang(I18N.getLang() === "de" ? "en" : "de");
    applyLanguage();
  });

  buildBoards();
  buildSelects();
  buildPlugboard();
  applyLanguage(); // also builds the rotors and renders the machine
})();
