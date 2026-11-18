/**
 * Translations (German is the default, English is one click away).
 *
 * Static markup uses:
 *   data-i18n="key"                      -> sets textContent
 *   data-i18n-attr="attr:key;attr:key"   -> sets attributes (placeholder, title, aria-label ...)
 * Dynamic text in app.js calls I18N.t(key, { params }).
 *
 * The *Hint keys hold the historical German term next to the English label.
 * In German they are empty, and empty <small> elements are hidden by the CSS.
 */
(function (root) {
  "use strict";

  const DICT = {
    de: {
      title: "Enigma I / M3 Simulator",
      description: "Eine funktionierende Simulation der deutschen Chiffriermaschine Enigma I / M3: Walzen I bis VIII, Umkehrwalzen B und C, Ringstellung, Steckerbrett und Doppelschritt.",
      langSwitch: "English",
      langTitle: "Switch to English",
      intro: "Die Chiffriermaschine von Wehrmacht und Luftwaffe. Tippe auf deiner Tastatur oder klicke auf die Tasten. Jeder Tastendruck dreht die Walzen, bevor die Lampe aufleuchtet.",

      machineAria: "Enigma-Maschine",
      reflector: "Umkehrwalze",
      reflectorHint: "",
      lampboard: "Lampenfeld",
      lampboardHint: "",
      keyboard: "Tastatur",
      keyboardHint: "",
      plugboard: "Steckerbrett",
      plugboardHint: "",

      slotLabel0: "Links", slotLabel1: "Mitte", slotLabel2: "Rechts",
      slotName0: "links", slotName1: "Mitte", slotName2: "rechts",
      rotorAria: "Walze {slot}",
      nextAria: "Walze {slot}: nächster Buchstabe",
      prevAria: "Walze {slot}: vorheriger Buchstabe",
      posAria: "Position der Walze {slot}",
      ringAria: "Ringstellung der Walze {slot}",
      ring: "Ring",
      start: "Start",
      notch: "Kerbe",
      keyAria: "Taste {L}",

      plugPairs: "Steckverbindungen",
      plugRemoveAll: "Alle entfernen",
      plugHelp: "Klicke erst auf eine Buchse, dann auf eine zweite, um sie zu verbinden. Klicke auf eine belegte Buchse, um ihr Kabel zu entfernen.",
      plugInvalid: "Ungültiges Steckerpaar „{pair}“. Verwende Paare aus zwei verschiedenen Buchstaben, zum Beispiel AB CD EF.",
      plugDuplicate: "Im Paar „{pair}“ ist ein Buchstabe schon belegt. Jeder Buchstabe darf nur einmal vorkommen.",
      socketAria: "Steckerbuchse {L}",
      socketAriaPlugged: "Steckerbuchse {L}, verbunden mit {M}. Aktivieren zum Entfernen.",

      messageAria: "Nachricht",
      input: "Eingabe",
      inputPlaceholder: "Hier tippen, auf deiner Tastatur oder mit den Tasten der Maschine",
      output: "Ausgabe",
      outputAria: "Ausgabetext",
      outputEmpty: "Der verschlüsselte Text erscheint hier",
      letter: "Buchstabe",
      letters: "Buchstaben",
      copy: "Ausgabe kopieren",
      copied: "Kopiert",
      swap: "Ausgabe als Eingabe verwenden",
      swapTitle: "Ersetzt die Eingabe durch die Ausgabe. Mit denselben Einstellungen erhältst du die ursprüngliche Nachricht zurück.",
      clear: "Nachricht löschen",
      groups: "Fünfergruppen",
      settings: "Maschineneinstellungen",
      random: "Zufällig einstellen",
      reset: "Auf Standard zurücksetzen",
      hint: "Die Maschine ist reziprok. Verschlüssele eine Nachricht, kopiere die Ausgabe bei gleichen Einstellungen in die Eingabe, und der Originaltext kommt zurück. Leerzeichen und Satzzeichen werden verworfen, wie bei der echten Maschine.",
    },

    en: {
      title: "Enigma I / M3 Simulator",
      description: "A working simulation of the German Enigma I / M3 cipher machine: rotors I to VIII, reflectors B and C, ring settings, plugboard and the double-step.",
      langSwitch: "Deutsch",
      langTitle: "Auf Deutsch wechseln",
      intro: "The Wehrmacht and Luftwaffe cipher machine. Type on your keyboard or click the keys. Every key press turns the rotors before the lamp lights.",

      machineAria: "Enigma machine",
      reflector: "Reflector",
      reflectorHint: "Umkehrwalze",
      lampboard: "Lampboard",
      lampboardHint: "Lampenfeld",
      keyboard: "Keyboard",
      keyboardHint: "Tastatur",
      plugboard: "Plugboard",
      plugboardHint: "Steckerbrett",

      slotLabel0: "Left", slotLabel1: "Middle", slotLabel2: "Right",
      slotName0: "left", slotName1: "middle", slotName2: "right",
      rotorAria: "{slot} rotor",
      nextAria: "{slot} rotor: next letter",
      prevAria: "{slot} rotor: previous letter",
      posAria: "{slot} rotor position",
      ringAria: "{slot} ring setting",
      ring: "Ring",
      start: "Start",
      notch: "Notch",
      keyAria: "Key {L}",

      plugPairs: "Plug pairs",
      plugRemoveAll: "Remove all",
      plugHelp: "Click one socket, then another, to connect them. Click a plugged socket to remove its cable.",
      plugInvalid: "“{pair}” is not a valid plug pair. Use pairs of two different letters, such as AB CD EF.",
      plugDuplicate: "A letter in “{pair}” is already plugged. Each letter can be used only once.",
      socketAria: "Plug socket {L}",
      socketAriaPlugged: "Plug socket {L}, connected to {M}. Activate to remove.",

      messageAria: "Message",
      input: "Input",
      inputPlaceholder: "Type here, on your keyboard, or on the machine's keys",
      output: "Output",
      outputAria: "Output text",
      outputEmpty: "Encrypted text appears here",
      letter: "letter",
      letters: "letters",
      copy: "Copy output",
      copied: "Copied",
      swap: "Use output as input",
      swapTitle: "Replace the input with the output. With the same settings, you get the original message back.",
      clear: "Clear message",
      groups: "Groups of five",
      settings: "Machine settings",
      random: "Randomize",
      reset: "Reset to defaults",
      hint: "The machine is reciprocal. Encrypt a message, then copy the output into the input with the same settings and the original text comes back. Spaces and punctuation are dropped, as on the real machine.",
    },
  };

  const STORAGE_KEY = "enigma-lang";
  let lang = "de";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "de" || saved === "en") lang = saved;
  } catch (_) { /* storage can be blocked; German stays the default */ }

  function t(key, params) {
    let s = DICT[lang][key];
    if (s === undefined) s = DICT.de[key];
    if (s === undefined) return key;
    return params ? s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m)) : s;
  }

  function applyStatic() {
    const doc = document;
    doc.documentElement.lang = lang;
    doc.title = t("title");
    const meta = doc.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("description"));

    doc.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    doc.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
  }

  function setLang(next) {
    if (next !== "de" && next !== "en") return;
    lang = next;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) { /* ignore */ }
  }

  root.I18N = { t, applyStatic, setLang, getLang: () => lang };
})(window);
