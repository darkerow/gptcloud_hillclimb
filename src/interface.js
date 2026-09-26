import {VEHICLES,STAGES,UPGRADES,PAINTS,MAX_LEVEL,vehicleById,stageById,upgradeCost,tunedVehicle,hex} from './catalog.js';
import {MISSIONS} from './progression.js';
import {icon,vehicleArt,stageArt} from './art.js';
const fmt=n=>Math.floor(n).toLocaleString('ru-RU');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class GameInterface {
  constructor(scene){
    this.scene=scene;this.progress=scene.progress;this.tab='vehicles';this.mode='career';this.selectedVehicle=this.progress.data.selectedVehicle;this.selectedStage=this.progress.data.selectedStage;this.filter='all';this.pointerGas=new Set();this.pointerBrake=new Set();
    this.root=document.createElement('div');this.root.className='game-interface';
    this.root.innerHTML=`
      <header class="run-hud"><div class="run-score"><span class="eyebrow" id="run-mode">КАРЬЕРА</span><strong id="distance">0 <small>м</small></strong><div class="run-money">${icon('coin')}<b id="run-coins">0</b><span id="run-best">Рекорд 0 м</span></div></div>
        <div class="fuel-panel"><div><span id="fuel-caption">ТОПЛИВО</span><b id="fuel-time">65 с</b></div><div class="fuel-track"><i id="fuel-level"></i></div><small id="run-location"></small></div>
        <nav class="run-buttons"><button id="open-garage" data-action="garage" aria-label="Выбор транспорта">${icon('garage')}</button><button id="pause" data-action="pause" aria-label="Пауза">${icon('pause')}</button></nav></header>
      <div class="run-toast" id="run-status" role="status"></div>
      <div class="boosters"><button data-action="boost" data-id="nitro" id="boost-nitro" aria-label="Нитро — 1">${icon('bolt')}<span>1 · <b>3</b></span></button><button data-action="boost" data-id="fuel" id="boost-fuel" aria-label="Канистра — 2">${icon('fuel')}<span>2 · <b>2</b></span></button><button data-action="boost" data-id="magnet" id="boost-magnet" aria-label="Магнит — 3"><span class="magnet-symbol">∩</span><span>3 · <b>2</b></span></button></div>
      <div class="pedals"><button id="brake" aria-label="Тормоз и задний ход"><span>◀</span><b>ТОРМОЗ</b><small>A / ←</small></button><div class="dials"><div class="dial"><span class="dial-label">СКОРОСТЬ</span><strong id="speed">0</strong><small>км/ч</small></div><div class="dial rpm"><span class="dial-label">ОБОРОТЫ</span><strong id="rpm">0.0</strong><small>×1000</small></div></div><button id="throttle" aria-label="Газ"><span>▶</span><b>ГАЗ</b><small>D / →</small></button></div>
      <section id="garage" class="menu-overlay" role="dialog" aria-modal="true" aria-labelledby="menu-title"><div class="menu-shell">
        <header class="menu-header"><div class="brand"><span class="brand-mark">${icon('flag')}</span><div>HILL<span>GARAGE</span></div></div><div class="menu-balances"><span class="balance coins">${icon('coin')}<b id="wallet">0</b></span><span class="balance gems">${icon('gem')}<b id="gems">0</b></span><button class="icon-button" data-action="settings" aria-label="Настройки">${icon('settings')}</button></div></header>
        <div id="menu-main"></div>
      </div></section>
      <div id="notification" class="notification" role="status" hidden></div>`;
    document.body.appendChild(this.root);this.menu=this.root.querySelector('#garage');this.content=this.root.querySelector('#menu-main');this.elements=Object.fromEntries([...this.root.querySelectorAll('[id]')].map(e=>[e.id,e]));
    this.clickHandler=e=>this.onClick(e);this.root.addEventListener('click',this.clickHandler);
    this.changeHandler=e=>this.onChange(e);this.root.addEventListener('change',this.changeHandler);
    this.keyHandler=e=>{if(!scene.menuOpen||e.key!=='Tab')return;const controls=[...this.menu.querySelectorAll('button,select,input,a')].filter(el=>!el.disabled&&el.offsetParent);const a=controls[0],b=controls.at(-1);if(e.shiftKey&&document.activeElement===a){b?.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===b){a?.focus();e.preventDefault();}};
    document.addEventListener('keydown',this.keyHandler);
    for(const [id,set] of [['throttle',this.pointerGas],['brake',this.pointerBrake]]){const el=this.elements[id];
      el.addEventListener('pointerdown',e=>{if(scene.menuOpen)return;e.preventDefault();scene.audio.unlock();set.add(e.pointerId);el.classList.add('pressed');el.setPointerCapture(e.pointerId);});
      for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,e=>{set.delete(e.pointerId);el.classList.toggle('pressed',set.size>0);});}
    this.render();
  }
  get throttle(){return Number(this.pointerGas.size>0)-Number(this.pointerBrake.size>0);}
  clear(){this.pointerGas.clear();this.pointerBrake.clear();this.elements.brake.classList.remove('pressed');this.elements.throttle.classList.remove('pressed');}
  show(tab){if(tab)this.tab=tab;this.screen='menu';this.menu.hidden=false;this.root.classList.add('in-menu');this.render();}
  hide(){this.menu.hidden=true;this.root.classList.remove('in-menu');document.activeElement?.blur();}
  notify(text){const n=this.elements.notification;n.textContent=text;n.hidden=false;clearTimeout(this.noticeTimer);this.noticeTimer=setTimeout(()=>n.hidden=true,2800);}
  notifyResult(ok,text='Готово'){this.notify(ok?text:'Недостаточно монет');this.render();if(ok)this.scene.audio.tone(660,0.12);}
  canUseVehicle(id){return this.mode==='sandbox'||this.progress.ownsVehicle(id);}
  canUseStage(id){return this.mode==='sandbox'||this.progress.ownsStage(id);}
  currentSpec(){const p=this.progress.data;return tunedVehicle(this.selectedVehicle,this.progress.levels(this.selectedVehicle),p.custom,p.paints[this.selectedVehicle]);}
  render(){
    const p=this.progress.data;this.elements.wallet.textContent=fmt(p.coins);this.elements.gems.textContent=fmt(p.gems);
    if(this.screen==='result')return this.renderResult();if(this.screen==='pause')return this.renderPause();if(this.screen==='settings')return this.renderSettings();
    const tabs=[['vehicles','Транспорт','garage'],['stages','Трассы','flag'],['upgrades','Улучшения','engine'],['missions','Задания','trophy'],['shop','Магазин','shop']];
    this.content.innerHTML=`<nav class="menu-tabs" role="tablist" aria-label="Разделы">${tabs.map(([id,name,i])=>`<button role="tab" aria-selected="${this.tab===id}" data-action="tab" data-id="${id}" class="${this.tab===id?'active':''}">${icon(i)}<span>${name}</span></button>`).join('')}</nav>
      <div class="menu-scroll" id="menu-scroll" role="tabpanel">${this.tab==='vehicles'?this.vehiclePage():this.tab==='stages'?this.stagePage():this.tab==='upgrades'?this.upgradePage():this.tab==='missions'?this.missionPage():this.shopPage()}</div>
      <footer class="menu-footer"><div class="mode-picker"><button data-action="mode" data-id="career" class="${this.mode==='career'?'selected':''}">Карьера</button><button data-action="mode" data-id="sandbox" class="${this.mode==='sandbox'?'selected':''}">Свободный заезд</button></div>
        <div class="footer-selection"><strong>${vehicleById(this.selectedVehicle).name}</strong><span>${stageById(this.selectedStage).name}${this.mode==='sandbox'?' · Всё открыто, без наград':''}</span></div>
        ${this.scene.hasStarted&&!this.scene.finished?'<button class="secondary resume" id="resume-run" data-action="resume">Продолжить</button>':''}
        <button class="primary start-button" id="start-run" data-action="start">${icon('play')} Поехали</button></footer>`;
  }
  vehiclePage(){
    const v=this.currentSpec(),owned=this.progress.ownsVehicle(v.id),vs=this.filter==='owned'?VEHICLES.filter(v=>this.progress.ownsVehicle(v.id)):VEHICLES;
    return `<div class="section-heading"><div><span class="eyebrow">01 / СОБЕРИ СВОЙ АВТОПАРК</span><h1 id="menu-title">Твой следующий заезд</h1></div><span class="counter">${this.progress.data.ownedVehicles.length} / ${VEHICLES.length} открыто</span></div>
      <section class="vehicle-hero"><div class="hero-text"><span class="pill">${owned?'В ТВОЁМ ГАРАЖЕ':'НОВЫЙ ТРАНСПОРТ'}</span><h2>${v.name}</h2><p>${v.description}</p><div class="spec-pills"><span>${icon('bolt')} ${Math.round(v.power*2500)} тяга</span><span>${icon('fuel')} ${Math.round(v.fuel)} с</span></div>
      ${!owned?`<button class="primary" data-action="buy-vehicle" data-id="${v.id}">${icon('lock')} Открыть · ${fmt(v.price)} ${icon('coin')}</button>`:`<button class="secondary" data-action="tab" data-id="upgrades">${icon('engine')} Улучшить</button>`}</div><div class="hero-vehicle">${vehicleArt(v)}<span class="hero-ground"></span></div></section>
      <div class="collection-label"><h3>Транспорт <span>${VEHICLES.length}</span></h3><div class="filter"><button class="${this.filter==='all'?'selected':''}" data-action="filter" data-id="all">Весь</button><button class="${this.filter==='owned'?'selected':''}" data-action="filter" data-id="owned">Мой гараж</button></div></div>
      <div class="vehicle-grid">${vs.map(a=>`<button class="vehicle-card ${a.id===v.id?'chosen':''}" data-action="vehicle" data-id="${a.id}" data-vehicle="${a.id}" aria-pressed="${a.id===v.id}"><span class="card-check">${a.id===v.id?icon('check'):this.progress.ownsVehicle(a.id)?'':icon('lock')}</span>${vehicleArt(a)}<strong>${a.name}</strong><small>${this.progress.ownsVehicle(a.id)?'Доступен':fmt(a.price)+' монет'}</small></button>`).join('')}</div>`;
  }
  stagePage(){const s=stageById(this.selectedStage);return `<div class="section-heading"><div><span class="eyebrow">02 / НАЙДИ СВОЙ МАРШРУТ</span><h1 id="menu-title">Куда отправимся?</h1></div><span class="counter">${this.progress.data.ownedStages.length} / ${STAGES.length} трасс</span></div><div class="stage-summary">${stageArt(s)}<div><span class="pill">${s.gravity<0.8?'НИЗКАЯ ГРАВИТАЦИЯ':s.grip<0.5?'СКОЛЬЗКАЯ ТРАССА':'НОВЫЙ РЕКОРД ВПЕРЕДИ'}</span><h2>${s.name}</h2><p>${s.description}</p><b>Рекорд: ${fmt(this.progress.best(this.selectedVehicle,s.id))} м</b>${!this.progress.ownsStage(s.id)?`<button class="primary" data-action="buy-stage" data-id="${s.id}">Открыть · ${fmt(s.price)} ${icon('coin')}</button>`:''}</div></div><div class="stage-grid">${STAGES.map(a=>`<button class="stage-card ${s.id===a.id?'chosen':''}" data-action="stage" data-id="${a.id}" data-stage="${a.id}" aria-pressed="${s.id===a.id}">${stageArt(a)}<div><strong>${a.name}</strong><small>${this.progress.ownsStage(a.id)?`${fmt(this.progress.best(this.selectedVehicle,a.id))} м · рекорд`:fmt(a.price)+' монет'}</small></div><span class="stage-badge">${this.progress.ownsStage(a.id)?icon('check'):icon('lock')}</span></button>`).join('')}</div>`;}
  upgradePage(){const v=this.currentSpec(),levels=this.progress.levels(v.id),owned=this.progress.ownsVehicle(v.id);return `<div class="section-heading"><div><span class="eyebrow">03 / БОЛЬШЕ МОЩНОСТИ</span><h1 id="menu-title">Мастерская</h1></div><button class="secondary" data-action="tab" data-id="vehicles">${v.name} ▾</button></div><div class="workshop-preview">${vehicleArt(v)}<div><h2>${v.name}</h2><p>Каждое улучшение меняет физику машины. Максимум — ${MAX_LEVEL} уровней на деталь.</p><span class="pill">${owned?'ТВОЙ ТРАНСПОРТ':'СНАЧАЛА ОТКРОЙ ТРАНСПОРТ'}</span></div></div>
      <div class="upgrade-grid">${UPGRADES.map(u=>{const l=levels[u.id]||0;return `<article class="upgrade-card"><div class="part-icon">${icon(u.icon)}</div><h3>${u.name}</h3><p>${u.description}</p><div class="level-label"><b>Уровень ${l}</b><span>/ ${MAX_LEVEL}</span></div><div class="upgrade-track"><i style="width:${l/MAX_LEVEL*100}%"></i></div><button class="${l===MAX_LEVEL?'secondary':'primary'}" data-action="upgrade" data-id="${u.id}" ${!owned||l===MAX_LEVEL?'disabled':''}>${l===MAX_LEVEL?'Максимум':fmt(upgradeCost(l))+' монет'}</button></article>`;}).join('')}</div>
      <section class="paint-panel"><div><h3>Цвет кузова</h3><p>Покраска бесплатная</p></div><div class="paint-options">${PAINTS.map(c=>`<button data-action="paint" data-id="${c}" style="--paint:${hex(c)}" aria-label="Цвет ${hex(c)}" aria-pressed="${v.color===c}" ${!owned?'disabled':''}>${v.color===c?icon('check'):''}</button>`).join('')}</div></section>
      ${v.id==='custom'?`<section class="custom-parts"><h3>Собери свою машину</h3>${[['frame','Шасси',[['standard','Стандарт'],['light','Лёгкое'],['heavy','Тяжёлое']]],['wheels','Колёса',[['standard','Стандарт'],['large','Большие'],['road','Шоссейные']]],['engine','Мотор',[['standard','Стандарт'],['sport','Спорт'],['diesel','Дизель']]]].map(([key,name,options])=>`<label>${name}<select data-custom="${key}" ${!owned?'disabled':''}>${options.map(([id,n])=>`<option value="${id}" ${this.progress.data.custom[key]===id?'selected':''}>${n}</option>`).join('')}</select></label>`).join('')}</section>`:''}`;}
  missionPage(){const d=this.progress.daily();return `<div class="section-heading"><div><span class="eyebrow">04 / КАЖДЫЙ ЗАЕЗД СЧИТАЕТСЯ</span><h1 id="menu-title">Задания и достижения</h1></div></div><section class="daily-card"><div class="daily-emblem">${icon('trophy')}</div><div><span class="eyebrow">ИСПЫТАНИЕ ДНЯ · ${d.key}</span><h2>${d.target} метров без остановки</h2><p>${vehicleById(d.vehicle).name} · ${stageById(d.stage).name}. Покупать транспорт и трассу не нужно.</p><strong>Награда: ${fmt(d.reward)} монет + 10 кристаллов</strong></div><button class="primary" data-action="daily">${d.done?'Повторить без награды':'Принять вызов'}</button></section><div class="mission-grid">${MISSIONS.map(m=>{const n=Math.min(m.target,Math.floor(this.progress.stat(m.stat))),claimed=this.progress.data.claimed.includes(m.id);return `<article class="mission-card"><span class="mission-icon">${icon(claimed?'check':'trophy')}</span><h3>${m.name}</h3><p>${m.description}</p><div class="level-label"><span>${fmt(n)} / ${fmt(m.target)}</span><b>+${fmt(m.reward)}</b></div><div class="upgrade-track"><i style="width:${n/m.target*100}%"></i></div><button class="${n>=m.target&&!claimed?'primary':'secondary'}" data-action="claim" data-id="${m.id}" ${claimed||n<m.target?'disabled':''}>${claimed?'Получено':n>=m.target?'Забрать награду':'В процессе'}</button></article>`;}).join('')}</div>`;}
  shopPage(){const p=this.progress.data,d=this.progress.daily();return `<div class="section-heading"><div><span class="eyebrow">05 / ПОДГОТОВЬСЯ К ДОРОГЕ</span><h1 id="menu-title">Запасы для заезда</h1></div><span class="pill">БЕЗ РЕАЛЬНЫХ ПЛАТЕЖЕЙ</span></div><section class="daily-card"><div class="daily-emblem">${icon('coin')}</div><div><h2>Ежедневный подарок</h2><p>1000 монет и 5 кристаллов. Один раз в день.</p></div><button class="primary" data-action="gift" ${p.dailyGifts.includes(d.key)?'disabled':''}>${p.dailyGifts.includes(d.key)?'Уже получен':'Забрать'}</button></section><div class="shop-grid">${[['nitro','Нитро','bolt','Ускорение на 5 секунд',750],['fuel','Запас топлива','fuel','Полностью пополняет бак',1000],['magnet','Магнит','gem','Притягивает монеты 15 секунд',600]].map(([id,name,i,desc,cost])=>`<article class="shop-card"><span class="part-icon">${icon(i)}</span><h2>${name}</h2><p>${desc}</p><span>В запасе: <b>${p.boosters[id]}</b></span><button class="primary" data-action="buy-boost" data-id="${id}">+1 · ${fmt(cost)} монет</button></article>`).join('')}<article class="shop-card"><span class="part-icon">${icon('gem')}</span><h2>Обмен кристаллов</h2><p>10 кристаллов → 2000 монет. Кристаллы собираются на трассе.</p><button class="secondary" data-action="exchange">Обменять 10 ${icon('gem')}</button></article></div>`;}
  renderPause(){this.content.innerHTML=`<div class="compact-screen"><span class="eyebrow">МОЖНО ПЕРЕВЕСТИ ДУХ</span><h1 id="menu-title">Пауза</h1><p>${vehicleById(this.scene.vehicleType).name} · ${stageById(this.scene.stageId).name}</p><div class="compact-actions"><button class="primary" data-action="resume" id="resume-run">${icon('play')} Продолжить</button><button class="secondary" data-action="restart" id="restart">${icon('reset')} Заново</button><button class="secondary" data-action="garage">${icon('garage')} В гараж</button><button class="secondary" data-action="settings">${icon('settings')} Настройки</button></div></div>`;}
  showPause(){this.screen='pause';this.menu.hidden=false;this.root.classList.add('in-menu');this.render();}
  showResult(result){this.result=result;this.screen='result';this.menu.hidden=false;this.root.classList.add('in-menu');this.render();}
  renderResult(){const r=this.result;this.content.innerHTML=`<div class="result-screen"><span class="result-emblem">${icon('flag')}</span><span class="eyebrow">${r.newBest?'НОВЫЙ ЛИЧНЫЙ РЕКОРД':'ДОРОГА ПРОДОЛЖАЕТСЯ'}</span><h1 id="menu-title">${esc(r.reason)}</h1><p>${vehicleById(this.scene.vehicleType).name} · ${stageById(this.scene.stageId).name}</p><div class="result-stats"><div><span>ДИСТАНЦИЯ</span><strong>${fmt(r.distance)}<small> м</small></strong></div><div><span>МОНЕТЫ</span><strong>+${fmt(r.coins)}</strong></div><div><span>В ВОЗДУХЕ</span><strong>${r.air.toFixed(1)}<small> с</small></strong></div></div><p class="result-note">${this.scene.runMode==='sandbox'?'Свободный заезд: покупки не нужны, награды и рекорды не сохраняются.':this.scene.runMode==='daily'?'Испытание дня: награда выдаётся один раз за выполнение цели.':'Собранные монеты уже в кошельке. Улучши машину и попробуй ещё раз.'}</p><div class="result-actions"><button class="secondary" data-action="garage">${icon('garage')} В гараж</button><button class="primary" data-action="restart">${icon('reset')} Ещё заезд</button></div></div>`;}
  renderSettings(){const s=this.progress.data.settings;this.content.innerHTML=`<div class="settings-screen"><span class="eyebrow">ТВОЯ ИГРА</span><h1 id="menu-title">Настройки</h1><div class="settings-list">${[['sound','Звуки','Мотор, монеты и сигналы'],['music','Музыка','Синтезированная фоновая мелодия'],['hints','Подсказки','Клавиши на педалях и пояснения']].map(([id,name,desc])=>`<label><div><b>${name}</b><small>${desc}</small></div><input type="checkbox" data-setting="${id}" ${s[id]?'checked':''}></label>`).join('')}<label><div><b>Эффекты</b><small>Снег, дождь и частицы</small></div><select data-setting="quality"><option value="auto" ${s.quality==='auto'?'selected':''}>Включены</option><option value="low" ${s.quality==='low'?'selected':''}>Минимум</option></select></label></div><section class="save-panel"><h3>Сохранение</h3><p>${this.progress.persistent?'Прогресс хранится в этом браузере. Экспортируй файл для резервной копии.':'Браузер запретил сохранение. Прогресс доступен до закрытия страницы; используй экспорт.'}</p><div><button class="secondary" data-action="export">Экспорт JSON</button><label class="secondary import-label">Импорт JSON<input id="import-save" type="file" accept=".json,application/json" hidden></label></div><small>Импорт заменит текущий прогресс после подтверждения.</small></section><p class="about-game">HILL GARAGE · самостоятельная браузерная игра на Phaser. Собственная графика и звуки. Нет рекламы, платежей и онлайн-рейтинга.</p><button class="primary" data-action="back-settings">${icon('back')} Назад</button></div>`;}
  onClick(e){
    const b=e.target.closest('[data-action]');if(!b||b.disabled)return;this.scene.audio.unlock();const a=b.dataset.action,id=b.dataset.id,p=this.progress;
    if(a==='tab'){this.tab=id;this.screen='menu';this.render();}
    if(a==='vehicle'){this.selectedVehicle=id;this.render();}
    if(a==='stage'){this.selectedStage=id;this.render();}
    if(a==='filter'){this.filter=id;this.render();}
    if(a==='mode'){this.mode=id;this.render();}
    if(a==='buy-vehicle')this.notifyResult(p.buyVehicle(id),'Транспорт открыт');
    if(a==='buy-stage')this.notifyResult(p.buyStage(id),'Трасса открыта');
    if(a==='upgrade'){const scroll=this.root.querySelector('#menu-scroll')?.scrollTop||0;this.notifyResult(p.upgrade(this.selectedVehicle,id),'Улучшение установлено');this.root.querySelector('#menu-scroll').scrollTop=scroll;}
    if(a==='paint'&&p.ownsVehicle(this.selectedVehicle)&&PAINTS.includes(Number(id))){p.data.paints[this.selectedVehicle]=Number(id);p.save();this.render();}
    if(a==='start'){
      if(!this.canUseVehicle(this.selectedVehicle)){this.notify('Открой транспорт или выбери «Свободный заезд»');return;}
      if(!this.canUseStage(this.selectedStage)){this.notify('Открой трассу или выбери «Свободный заезд»');return;}
      this.scene.startRun(this.selectedVehicle,this.selectedStage,this.mode);
    }
    if(a==='resume')this.scene.closeGarage();
    if(a==='garage')this.scene.openGarage('vehicles');
    if(a==='pause')this.scene.pauseRun();
    if(a==='restart')this.scene.startRun(this.scene.vehicleType,this.scene.stageId,this.scene.runMode);
    if(a==='boost')this.scene.useBooster(id);
    if(a==='claim')this.notifyResult(p.claimMission(id),'Награда получена');
    if(a==='gift')this.notifyResult(p.claimGift(),'Подарок получен');
    if(a==='daily'){const d=p.daily();this.scene.startRun(d.vehicle,d.stage,'daily');}
    if(a==='buy-boost'){const costs={nitro:750,fuel:1000,magnet:600};this.notifyResult(p.spend(costs[id],()=>p.data.boosters[id]++),'Запас пополнен');}
    if(a==='exchange')this.notifyResult(p.spend(10,()=>p.data.coins+=2000,'gems'),'Монеты добавлены');
    if(a==='settings'){this.previousScreen=this.screen||'menu';this.screen='settings';this.render();}
    if(a==='back-settings'){this.screen=this.previousScreen==='settings'?'menu':this.previousScreen||'menu';this.render();}
    if(a==='export'){const url=URL.createObjectURL(new Blob([p.export()],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='hill-garage-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  }
  async onChange(e){
    const key=e.target.dataset.setting;if(key){this.progress.data.settings[key]=e.target.type==='checkbox'?e.target.checked:e.target.value;this.progress.save();this.scene.audio.unlock();this.root.classList.toggle('no-hints',!this.progress.data.settings.hints);}
    const part=e.target.dataset.custom;if(part&&this.progress.ownsVehicle('custom')){this.progress.data.custom[part]=e.target.value;this.progress.save();this.render();}
    if(e.target.id==='import-save'){
      const file=e.target.files?.[0];if(!file)return;
      if(file.size>150000){this.notify('Файл слишком большой');return;}
      try{const text=await file.text();if(!window.confirm('Заменить текущий прогресс данными из файла?'))return;this.progress.import(text);this.selectedVehicle=this.progress.data.selectedVehicle;this.selectedStage=this.progress.data.selectedStage;this.scene.audio.settings=this.progress.data.settings;this.scene.hasStarted=false;this.scene.finished=true;this.notify('Сохранение загружено');this.render();}catch(err){this.notify(err.message);}
    }
  }
  update(){
    const s=this.scene,p=this.progress.data,r=s.run;if(!r)return;
    const display=(id,text)=>{const el=this.elements[id];if(el&&el.textContent!==text)el.textContent=text;};
    display('distance',`${fmt(s.distance)} м`);display('run-coins',fmt(r.coins));display('run-best',`Рекорд ${fmt(s.bestDistance)} м`);
    display('run-mode',s.runMode==='sandbox'?'СВОБОДНЫЙ ЗАЕЗД':s.runMode==='daily'?'ИСПЫТАНИЕ ДНЯ':'КАРЬЕРА');
    display('fuel-time',`${Math.ceil(s.fuel)} с`);display('fuel-caption',['monowheel','electric','lunar'].includes(s.vehicleType)?'ЗАРЯД':'ТОПЛИВО');
    this.elements['fuel-level'].style.width=`${Math.max(0,s.fuel/s.fuelCapacity*100)}%`;this.elements['fuel-level'].classList.toggle('low',s.fuel/s.fuelCapacity<0.23);
    display('run-location',`${vehicleById(s.vehicleType).name} · ${stageById(s.stageId).name}`);
    display('speed',String(Math.round(Math.abs(s.vehicle.body.velocity.x)*21.6)));display('rpm',(Math.abs(s.vehicle.wheels[0].angularVelocity)*12).toFixed(1));
    for(const id of ['nitro','fuel','magnet']){const el=this.elements[`boost-${id}`];el.querySelector('b').textContent=s.runMode==='sandbox'?'∞':p.boosters[id];el.classList.toggle('boost-active',id==='nitro'?s.nitro>0:id==='magnet'?s.magnet>0:false);el.disabled=s.menuOpen;}
    this.root.classList.toggle('no-hints',!p.settings.hints);
  }
  message(text){this.elements['run-status'].textContent=text;clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>this.elements['run-status'].textContent='',1800);}
  destroy(){clearTimeout(this.toastTimer);clearTimeout(this.noticeTimer);document.removeEventListener('keydown',this.keyHandler);this.root.remove();}
}
