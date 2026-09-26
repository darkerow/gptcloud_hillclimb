import { VEHICLES, readBest } from "./storage.js";

const previews = {
  car: `<svg viewBox="0 0 240 160" aria-hidden="true"><path d="M15 137 Q110 130 225 114" fill="none" stroke="#adc891" stroke-width="8"/><g stroke="#24394b" stroke-width="5" stroke-linejoin="round"><circle cx="65" cy="120" r="27" fill="#263648"/><circle cx="181" cy="120" r="27" fill="#263648"/><circle cx="65" cy="120" r="12" fill="#bbd2df"/><circle cx="181" cy="120" r="12" fill="#bbd2df"/><path d="M28 78 L160 78 L207 95 L206 112 L28 112 Z" fill="#f77832"/><path d="M83 78 L108 41 L151 41 L170 78 Z" fill="#bceef7"/><path d="M124 43 L124 78"/><path d="M38 94 L92 94" stroke="#ffb259"/></g></svg>`,
  monowheel: `<svg viewBox="0 0 240 160" aria-hidden="true"><path d="M15 144 Q130 137 225 126" fill="none" stroke="#adc891" stroke-width="8"/><g stroke="#24394b" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><circle cx="120" cy="121" r="27" fill="#263648"/><circle cx="120" cy="121" r="13" fill="#ffad3c"/><path d="M108 107 L107 91 L133 90 L139 109" fill="#345367"/><path d="M115 72 L105 90 L115 117 M125 71 L139 91 L127 117" fill="none" stroke-width="9"/><path d="M108 45 L127 43 L133 71 L114 77 L105 65 Z" fill="#f98b38"/><path d="M125 49 L146 66 L157 55" fill="none" stroke="#f98b38" stroke-width="8"/><circle cx="115" cy="29" r="17" fill="#24394b"/><path d="M116 19 L134 22 L136 32 L117 32" fill="#8ae5ef"/><path d="M117 38 L137 38 L130 45 L113 45" fill="#f98b38"/><path d="M110 120 L140 120"/></g></svg>`
};

/** Native buttons keep the garage usable by touch, keyboard and screen readers. */
export function createInterface(scene) {
  const root = document.createElement("div");
  root.className = "game-interface";
  root.innerHTML = `
    <header class="game-hud">
      <div class="score"><strong id="distance">0 м</strong><span id="vehicle-name"></span><small id="best"></small></div>
      <nav aria-label="Управление игрой"><button id="open-garage" type="button">Транспорт <kbd>V</kbd></button><button id="restart" type="button" aria-label="Начать заезд заново">↻ <span>Заново</span></button></nav>
    </header>
    <p id="run-status" class="run-status" role="status"></p>
    <div class="pedals"><button id="brake" type="button" aria-label="Тормоз и задний ход">◀<span>ТОРМОЗ</span></button><p>A / D или ← / →<br><span>R — заново · V — транспорт</span></p><button id="throttle" type="button" aria-label="Газ">▶<span>ГАЗ</span></button></div>
    <section id="garage" class="garage-overlay" role="dialog" aria-modal="true" aria-labelledby="garage-title">
      <div class="garage-panel"><div class="garage-eyebrow">HILL CLIMB / ГАРАЖ</div><h1 id="garage-title">На чём поедем?</h1><p class="garage-subtitle">Одна трасса. Два разных характера.</p>
        <div class="vehicle-cards">${Object.entries(VEHICLES).map(([id, info], i) => `
          <button type="button" class="vehicle-card" data-vehicle="${id}" aria-pressed="false">
            <div class="card-top"><span>0${i + 1}</span><span class="selected-mark">✓ ВЫБРАНО</span></div>${previews[id]}
            <strong>${info.name}</strong><span class="vehicle-description">${info.description}</span><span class="vehicle-record" data-record="${id}"></span>
          </button>`).join("")}</div>
        <p class="garage-note">Газ — вперёд, тормоз — назад. В воздухе педали управляют наклоном.</p>
        <div class="garage-actions"><button id="start-run" type="button">Поехали <span>→</span></button><button id="resume-run" type="button" hidden>Продолжить заезд</button></div>
      </div>
    </section>`;
  document.body.append(root);
  const find = selector => root.querySelector(selector);
  const dialog = find("#garage");
  const holds = { left: new Set(), right: new Set() };
  let selected = scene.vehicleType;
  const clear = () => { holds.left.clear(); holds.right.clear(); };
  const select = type => {
    selected = type;
    root.querySelectorAll("[data-vehicle]").forEach(card => {
      card.setAttribute("aria-pressed", String(card.dataset.vehicle === type));
    });
  };
  root.querySelectorAll("[data-vehicle]").forEach(card => {
    card.addEventListener("click", () => select(card.dataset.vehicle));
  });
  find("#start-run").onclick = () => scene.startRun(selected);
  find("#resume-run").onclick = () => scene.closeGarage();
  find("#open-garage").onclick = () => scene.openGarage();
  find("#restart").onclick = () => scene.startRun(scene.vehicleType);
  for (const [selector, side] of [["#brake", "left"], ["#throttle", "right"]]) {
    const button = find(selector);
    button.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (scene.menuOpen) return;
      button.setPointerCapture(e.pointerId);
      holds[side].add(e.pointerId);
    });
    const release = e => holds[side].delete(e.pointerId);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("contextmenu", e => e.preventDefault());
  }
  const menuKeys = e => {
    if (!scene.menuOpen) return;
    if (["1", "2", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault(); select(e.key === "1" || e.key === "ArrowLeft" ? "car" : "monowheel");
    }
    if (e.key === "Tab") {
      const buttons = [...dialog.querySelectorAll("button:not([hidden])")];
      const first = buttons[0], last = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  dialog.addEventListener("keydown", menuKeys);
  return {
    get throttle() { return Number(holds.right.size > 0) - Number(holds.left.size > 0); },
    clear,
    show() {
      clear(); select(scene.vehicleType);
      for (const id of Object.keys(VEHICLES)) find(`[data-record="${id}"]`).textContent = `Рекорд: ${readBest(id)} м`;
      find("#resume-run").hidden = !scene.hasStarted || scene.finished;
      dialog.hidden = false;
      find(".game-hud").inert = true; find(".pedals").inert = true;
      find(`[data-vehicle="${selected}"]`).focus({ preventScroll: true });
    },
    hide() {
      clear(); dialog.hidden = true;
      find(".game-hud").inert = false; find(".pedals").inert = false;
      document.activeElement?.blur();
    },
    update(distance, best, type, status = "") {
      find("#distance").textContent = `${distance} м`;
      find("#best").textContent = `РЕКОРД ${best} м`;
      find("#vehicle-name").textContent = VEHICLES[type].name;
      find("#run-status").textContent = status;
    },
    destroy() { root.remove(); }
  };
}
