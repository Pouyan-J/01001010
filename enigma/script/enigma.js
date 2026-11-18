/**
 * Enigma I / M3 core: a JavaScript port of enigma.py.
 *
 * Same data, same maths, same stepping (including the middle-rotor
 * "double step"), same plugboard rules. No DOM access in this file, so it
 * runs in the browser (window.EnigmaCore) and in Node (require).
 *
 * Enigma is reciprocal: with identical settings, processing the ciphertext
 * gives back the plaintext.
 *
 *   const m = new EnigmaCore.Enigma(["I", "II", "III"], "B", "AAA", "AAA", "AB CD");
 *   m.process("HELLO WORLD");
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EnigmaCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // name: [wiring, turnover letters]
  const ROTOR_DATA = {
    I:    ["EKMFLGDQVZNTOWYHXUSPAIBRCJ", "Q"],
    II:   ["AJDKSIRUXBLHWTMCQGZNPYFVOE", "E"],
    III:  ["BDFHJLCPRTXVZNYEIWGAKMUSQO", "V"],
    IV:   ["ESOVPZJAYQUIRHXLNFTGKDCMWB", "J"],
    V:    ["VZBRGITYUPSDNHLXAWMJQOFECK", "Z"],
    VI:   ["JPGVOUMFYQBENHZRDKASXLICTW", "ZM"],
    VII:  ["NZJHGRCXMYSWBOUFAIVLPEKQDT", "ZM"],
    VIII: ["FKQHTLXOCBJSPDZRAMEWNIUYGV", "ZM"],
  };

  const REFLECTOR_DATA = {
    B: "YRUHQSLDPXNGOKMIEBFZCWVJAT",
    C: "FVPJIAOYEDRZXWGCTKUQSBNMHL",
  };

  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const mod26 = (n) => ((n % 26) + 26) % 26;

  function toIndex(letter) {
    const s = String(letter);
    const i = ALPHABET.indexOf(s.toUpperCase());
    if (s.length !== 1 || i === -1) {
      throw new Error(`Not a letter: ${JSON.stringify(letter)}`);
    }
    return i;
  }

  class Rotor {
    constructor(name, ring = "A", position = "A") {
      if (!has(ROTOR_DATA, name)) {
        throw new Error(`Unknown rotor ${JSON.stringify(name)}; choose from ${Object.keys(ROTOR_DATA).join(", ")}`);
      }
      const [wiring, notches] = ROTOR_DATA[name];
      this.name = name;
      this.forwardMap = Array.from(wiring, toIndex);
      this.backwardMap = new Array(26).fill(0);
      this.forwardMap.forEach((out, i) => {
        this.backwardMap[out] = i;
      });
      this.notches = new Set(Array.from(notches, toIndex));
      this.ring = toIndex(ring);
      this.position = toIndex(position);
    }

    /** True if this rotor is at the position that carries the next rotor along. */
    atNotch() {
      return this.notches.has(this.position);
    }

    step() {
      this.position = (this.position + 1) % 26;
    }

    _pass(c, table) {
      const shift = this.position - this.ring;
      return mod26(table[mod26(c + shift)] - shift);
    }

    forward(c) {
      return this._pass(c, this.forwardMap);
    }

    backward(c) {
      return this._pass(c, this.backwardMap);
    }
  }

  class Plugboard {
    constructor(pairs = "") {
      this.mapping = Array.from({ length: 26 }, (_, i) => i);
      const used = new Set();
      const list = String(pairs).toUpperCase().split(/\s+/).filter(Boolean);
      for (const pair of list) {
        if (pair.length !== 2 || !/^[A-Z]{2}$/.test(pair) || pair[0] === pair[1]) {
          throw new Error(`Invalid plug pair ${JSON.stringify(pair)}`);
        }
        const [a, b] = pair;
        if (used.has(a) || used.has(b)) {
          throw new Error(`Letter used twice in plugboard: ${JSON.stringify(pair)}`);
        }
        used.add(a);
        used.add(b);
        this.mapping[toIndex(a)] = toIndex(b);
        this.mapping[toIndex(b)] = toIndex(a);
      }
    }

    swap(c) {
      return this.mapping[c];
    }
  }

  class Enigma {
    /**
     * rotors:    names, left -> right, e.g. ["I", "II", "III"]
     * reflector: "B" or "C"
     * rings:     ring settings, left -> right, e.g. "AAA"
     * positions: starting positions, left -> right, e.g. "AAA"
     * plugboard: plug pairs, e.g. "AB CD EF"
     */
    constructor(rotors = ["I", "II", "III"], reflector = "B", rings = "AAA", positions = "AAA", plugboard = "") {
      const rotorList = Array.from(rotors);
      const ringList = Array.from(rings);
      const posList = Array.from(positions);
      if (rotorList.length !== 3 || ringList.length !== 3 || posList.length !== 3) {
        throw new Error("Rotors, rings and positions must each have 3 entries");
      }
      if (new Set(rotorList).size !== 3) {
        throw new Error("Each rotor may only be used once");
      }
      const refl = String(reflector).toUpperCase();
      if (!has(REFLECTOR_DATA, refl)) {
        throw new Error(`Unknown reflector ${JSON.stringify(reflector)}; choose from ${Object.keys(REFLECTOR_DATA).join(", ")}`);
      }

      [this.left, this.middle, this.right] = rotorList.map((n, i) => new Rotor(n, ringList[i], posList[i]));
      this.reflector = Array.from(REFLECTOR_DATA[refl], toIndex);
      this.plugboard = new Plugboard(plugboard);
    }

    /** Current window letters, left -> right, e.g. "AAB". */
    get positions() {
      return [this.left, this.middle, this.right].map((r) => ALPHABET[r.position]).join("");
    }

    _stepRotors() {
      // Decide using the state *before* any rotor moves.
      if (this.middle.atNotch()) {
        // Double step: middle rotor pushes the left one and steps itself.
        this.left.step();
        this.middle.step();
      } else if (this.right.atNotch()) {
        this.middle.step();
      }
      this.right.step();
    }

    encryptChar(letter) {
      this._stepRotors(); // rotors move before the current flows
      let c = this.plugboard.swap(toIndex(letter));
      c = this.right.forward(c);
      c = this.middle.forward(c);
      c = this.left.forward(c);
      c = this.reflector[c];
      c = this.left.backward(c);
      c = this.middle.backward(c);
      c = this.right.backward(c);
      c = this.plugboard.swap(c);
      return ALPHABET[c];
    }

    /** Encrypt/decrypt text. Non-letters are dropped, as on the real machine. */
    process(text) {
      let out = "";
      for (const ch of String(text).toUpperCase()) {
        if (ch.length === 1 && ALPHABET.includes(ch)) out += this.encryptChar(ch);
      }
      return out;
    }
  }

  // Reciprocal machine: encrypt and decrypt are the same operation. Use a
  // fresh Enigma with the same settings for each direction.
  Enigma.prototype.encrypt = Enigma.prototype.process;
  Enigma.prototype.decrypt = Enigma.prototype.process;

  function group(text, size = 5) {
    const parts = [];
    for (let i = 0; i < text.length; i += size) parts.push(text.slice(i, i + size));
    return parts.join(" ");
  }

  return { ALPHABET, ROTOR_DATA, REFLECTOR_DATA, Rotor, Plugboard, Enigma, group };
});
