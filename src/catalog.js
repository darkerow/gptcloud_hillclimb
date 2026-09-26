/** Original, data-driven roster. No commercial game assets or extracted data. */
export const VEHICLES = [
  ['car','Внедорожник','car',0,0xed6e39,{width:128,radius:27,axle:48},'Лёгкий старт. Универсальная подвеска.'],
  ['monowheel','Моноколесо','mono',0,0xf89435,{radius:32,fuel:65},'Электробаланс на земле, наклон в полёте.'],
  ['motocross','Мотокросс','bike',3500,0xf24c49,{width:100,radius:26,mass:0.0018,speed:0.57},'Малый вес и быстрые вращения в воздухе.'],
  ['monster','Монстр-трак','monster',6500,0x78a840,{width:142,radius:43,axle:57,clearance:55,power:0.044},'Огромные колёса съедают неровности.'],
  ['tractor','Трактор','tractor',9000,0x75a64d,{width:132,radius:37,frontRadius:25,axle:51,speed:0.36,power:0.055},'Большое заднее колесо и тяговитый мотор.'],
  ['van','Фургон','van',12000,0xe9b84b,{width:150,height:64,axle:58,radius:28,fuel:80},'Вместительный бак, высокая кабина.'],
  ['quad','Квадроцикл','bike',14000,0x639bc5,{width:101,radius:30,axle:43,speed:0.5},'Компактная база и открытый райдер.'],
  ['bus','Автобус','bus',18000,0xf2bf43,{width:220,height:67,axle:88,radius:31,mass:0.0035,fuel:90},'Длинная база: осторожнее на переломах.'],
  ['rally','Ралли','car',20000,0x568bd4,{width:135,radius:29,power:0.043,speed:0.59},'Зацеп, полный привод и плотная подвеска.'],
  ['race','Болид','race',24000,0xdf4f4f,{width:156,height:25,axle:63,radius:23,speed:0.7,clearance:27},'Высокая скорость, низкий клиренс.'],
  ['police','Патруль','police',27000,0xd3e6ed,{width:151,radius:27,speed:0.59},'Быстрый седан с проблесковыми маячками.'],
  ['ambulance','Скорая','ambulance',30000,0xf3efe4,{width:171,height:62,axle:66,radius:30,fuel:80},'Высокий кузов с мягкой подвеской.'],
  ['firetruck','Пожарная','fire',34000,0xce4940,{width:207,height:65,axle:81,radius:34,wheelCount:3,fuel:100},'Три оси, лестница и тяжёлый кузов.'],
  ['snowmobile','Снегоход','snow',38000,0xeda737,{width:132,height:32,axle:51,radius:24,grip:1.3,speed:0.56},'Низкая посадка и зимняя ходовая.'],
  ['offroad','Супервездеход','monster',44000,0x5e7b55,{width:158,radius:39,axle:62,power:0.054,speed:0.56},'Баланс мощности и проходимости.'],
  ['truck','Грузовик','truck',47000,0x549d9c,{width:211,height:55,axle:83,radius:33,wheelCount:3,fuel:105},'Дизельный запас хода и три оси.'],
  ['tank','Танк','tank',52000,0x7a8957,{width:174,height:35,axle:65,radius:22,wheelCount:5,power:0.07,speed:0.37,mass:0.0045,fuel:110},'Пять опорных колёс под гусеницей.'],
  ['buggy','Багги','buggy',55000,0xe4913b,{width:122,radius:34,axle:54,mass:0.002,power:0.047},'Лёгкая рама и длинный ход подвески.'],
  ['dragster','Дрэгстер','race',60000,0xb967a9,{width:190,height:25,axle:80,radius:28,frontRadius:19,speed:0.79,power:0.06},'Длинный нос и взрывной разгон.'],
  ['hotrod','Хот-род','hotrod',65000,0xd75b31,{width:139,radius:31,frontRadius:24,axle:57,speed:0.64,power:0.051},'Короткий кузов, открытый мотор.'],
  ['diesel','Тягач','truck',70000,0x4f70a8,{width:228,height:60,axle:90,radius:36,wheelCount:3,power:0.066,mass:0.004,fuel:125},'Тяжёлый тягач для длинных перегонов.'],
  ['electric','Электрокар','car',76000,0x6cc5b7,{width:142,radius:28,power:0.046,speed:0.64,fuel:95},'Плавная тяга и большой заряд батареи.'],
  ['minibike','Минибайк','bike',82000,0xc684da,{width:79,radius:19,axle:32,mass:0.0015,speed:0.68},'Самая короткая база. Легко делать сальто.'],
  ['superbike','Супербайк','bike',87000,0x418ab6,{width:123,radius:27,axle:52,speed:0.76,power:0.046},'Скорость шоссе и точный контроль наклона.'],
  ['trophy','Трофи-трак','monster',93000,0xe58f3a,{width:173,radius:36,axle:69,power:0.053,speed:0.63,clearance:49},'Длинноходная подвеска для быстрых холмов.'],
  ['safari','Сафари','car',100000,0xc0a568,{width:158,height:52,axle:62,radius:34,fuel:100},'Экспедиционный багажник и большой бак.'],
  ['lowrider','Лоурайдер','car',110000,0x975ab8,{width:181,height:27,axle:75,radius:22,clearance:25,speed:0.64},'Низкий и длинный. Любит ровную дорогу.'],
  ['armored','Броневик','truck',120000,0x647d7e,{width:175,height:54,axle:65,radius:35,wheelCount:3,mass:0.004,power:0.06},'Тяжёлый шестиколёсный внедорожник.'],
  ['lunar','Луноход','buggy',135000,0xd3dfda,{width:161,radius:32,axle:67,wheelCount:3,mass:0.0017,fuel:110},'Лёгкое шасси для низкой гравитации.'],
  ['hovercraft','Аэрокар','hover',150000,0x4dbac3,{width:146,height:35,radius:22,axle:52,power:0.05,fuel:80},'Воздушная подушка удерживает высоту над трассой.'],
  ['rocket','Ракетомобиль','rocket',175000,0xc7784b,{width:131,height:32,radius:26,axle:51,speed:0.63,power:0.055,fuel:65},'Дополнительная реактивная тяга при разгоне.'],
  ['custom','Конструктор','buggy',22000,0x56bdb2,{width:128,radius:30,axle:50},'Собери своё шасси, двигатель и колёса.']
].map(([id,name,style,price,color,spec,description])=>({id,name,style,price,color,description,
  width:128,height:42,radius:27,axle:48,clearance:43,wheelCount:2,mass:0.0027,
  speed:0.48,power:0.035,grip:1,fuel:65,...spec}));

export const THEMES = {
  green: [0x9ed8ff,0x82704e,0x6c9b49,0x3f6f2b,0x78a58a,0xfbc75e],
  desert:[0xf7d7a2,0xbe885b,0xe9bd79,0xa9773b,0xd5a879,0xf79847],
  ice:[0xc4eafa,0x7aabb9,0xe4f5ef,0x82bccf,0x98bec9,0x4ea8cc],
  night:[0x182c4b,0x45505e,0x578278,0x315d58,0x304967,0x93d6ef],
  moon:[0x141e36,0x676d7e,0xa9adba,0x7e879b,0x3e4a67,0xc2d7ef],
  mars:[0x392d46,0x9a5747,0xc9815a,0x794035,0x794b52,0xefb37e],
  lava:[0x482c3c,0x63454c,0x84606b,0xce6e4f,0x633b49,0xffa848],
  forest:[0xbce0ca,0x77614a,0x507b45,0x305c38,0x759779,0xe5c662],
  beach:[0xa8dfea,0xc29f6d,0xf3d592,0xc5aa6b,0x75bcb7,0x47b5ce],
  city:[0xa7cedb,0x636877,0x999da2,0x505565,0x819ca9,0xf7c957],
  purple:[0x38365f,0x6b537e,0x9881aa,0x594675,0x575077,0x74ded1],
  autumn:[0xe9d6ae,0x976e4f,0xc4a15a,0x90763f,0xa5ac80,0xe99648]
};
export const STAGES = [
  ['countryside','Пригород',0,'green',1,1.05,1,'bridges','Зелёные холмы и подвесные мосты.'],
  ['desert','Пустыня',3500,'desert',1.15,1.05,0.72,'dunes','Длинные дюны и вязкий песок.'],
  ['arctic','Арктика',7000,'ice',1.05,1.05,0.13,'snow','Скользкая поверхность и снег.'],
  ['highway','Шоссе',10000,'city',0.4,1.05,1.3,'road','Пологая дорога для скоростных машин.'],
  ['moon','Луна',15000,'moon',1.25,0.19,0.8,'craters','Низкая гравитация и длинные прыжки.'],
  ['forest','Лес',18000,'forest',1.05,1.05,0.9,'bridges','Хвойный лес с деревянными переправами.'],
  ['mountain','Горы',21000,'green',1.75,1.05,1,'climb','Высокие подъёмы и затяжные спуски.'],
  ['cave','Пещера',24000,'night',0.8,1.05,0.9,'ceiling','Низкий каменный потолок. Береги голову.'],
  ['mars','Марс',28000,'mars',1.3,0.43,0.8,'craters','Красные кратеры и ослабленная гравитация.'],
  ['beach','Побережье',31000,'beach',0.8,1.05,0.7,'water','Мелководье тормозит колёса.'],
  ['mud','Грязь',35000,'forest',1.1,1.05,0.35,'mud','Вязкие участки: запасись тягой.'],
  ['volcano','Вулкан',39000,'lava',1.25,1.05,0.9,'lava','Мосты над горячими провалами.'],
  ['city','Город',42000,'city',0.7,1.05,1.2,'road','Городской рельеф и дорожные трамплины.'],
  ['rooftops','Крыши',46000,'city',1.2,1.05,1,'bridges','Переправы высоко над городом.'],
  ['snow','Снежные склоны',50000,'ice',1.6,1.05,0.35,'snow','Крутые снежные волны.'],
  ['factory','Завод',55000,'city',0.85,1.05,0.95,'ceiling','Низкие перекрытия промышленной трассы.'],
  ['construction','Стройка',60000,'desert',1.1,1.05,0.85,'ramps','Череда коротких земляных трамплинов.'],
  ['islands','Острова',65000,'beach',0.9,1.05,0.8,'bridges','Песчаные берега и подвесные мосты.'],
  ['swamp','Болото',70000,'forest',0.7,1.05,0.3,'water','Лужи и мягкие низины.'],
  ['night','Ночной заезд',75000,'night',1.0,1.05,0.8,'bridges','Холмы под звёздным небом.'],
  ['canyon','Каньон',80000,'desert',1.6,1.05,0.85,'bridges','Глубокие ущелья между скалами.'],
  ['dunes','Большие дюны',85000,'desert',1.85,1.05,0.62,'dunes','Высокие песчаные гребни.'],
  ['alien','Другая планета',90000,'purple',1.5,0.32,0.8,'craters','Необычный рельеф и долгие полёты.'],
  ['glacier','Ледник',95000,'ice',1.3,1.05,0.06,'bridges','Очень скользкий лёд перед переправами.'],
  ['wasteland','Пустошь',100000,'autumn',1.35,1.05,0.8,'ramps','Частые неровности и сухая земля.'],
  ['mines','Шахта',110000,'night',1.0,1.05,0.85,'ceiling','Каменные своды и тяжёлые подъёмы.'],
  ['rainbow','Радужные холмы',120000,'purple',1.15,0.75,0.9,'bridges','Мягкая гравитация и цветное небо.'],
  ['roller','Американские горки',130000,'green',1.9,1.05,1.1,'ramps','Последовательность высоких трамплинов.'],
  ['storm','Шторм',140000,'night',1.2,1.05,0.45,'wind','Дождь и меняющиеся порывы ветра.'],
  ['seasons','Осень',160000,'autumn',1.25,1.05,0.65,'bridges','Золотая листва и длинные переправы.']
].map(([id,name,price,theme,amplitude,gravity,grip,hazard,description],seed)=>({id,name,price,theme,amplitude,gravity,grip,hazard,description,seed,palette:THEMES[theme]}));

export const UPGRADES = [
  {id:'engine',name:'Двигатель',icon:'engine',description:'Мощность и максимальная скорость'},
  {id:'suspension',name:'Подвеска',icon:'spring',description:'Устойчивость и демпфирование'},
  {id:'tires',name:'Шины',icon:'wheel',description:'Сцепление и контроль на склонах'},
  {id:'fuel',name:'Бак / батарея',icon:'fuel',description:'Запас хода между заправками'}
];
export const PAINTS = [0xed6e39,0x4b94cd,0x67af83,0xc281c9,0xe9bb47,0xe6e9e2];
export const MAX_LEVEL = 15;
export const vehicleById = id => VEHICLES.find(v=>v.id===id) || VEHICLES[0];
export const stageById = id => STAGES.find(s=>s.id===id) || STAGES[0];
export const upgradeCost = level => level >= MAX_LEVEL ? 0 : Math.round(350 * Math.pow(1.42,level));
export const hex = n => '#'+n.toString(16).padStart(6,'0');
export function tunedVehicle(id, levels={}, custom={}, paint) {
  const v={...vehicleById(id)};
  if(id==='custom') {
    if(custom.frame==='heavy'){v.width=168;v.axle=66;v.mass=0.0035;v.fuel=85;}
    if(custom.frame==='light'){v.width=102;v.axle=42;v.mass=0.0018;}
    if(custom.wheels==='large'){v.radius=39;v.clearance=52;}
    if(custom.wheels==='road'){v.radius=24;v.speed+=0.09;v.grip=0.8;}
    if(custom.engine==='diesel'){v.power*=1.3;v.fuel+=20;v.speed*=0.9;}
    if(custom.engine==='sport'){v.speed*=1.2;v.power*=1.12;v.fuel-=8;}
  }
  v.power*=1+(levels.engine||0)*0.045;
  v.speed*=1+(levels.engine||0)*0.015;
  v.grip*=1+(levels.tires||0)*0.045;
  v.fuel*=1+(levels.fuel||0)*0.06;
  v.damping=0.16+(levels.suspension||0)*0.009;
  v.balance=1+(levels.suspension||0)*0.025;
  if(Number.isInteger(paint)) v.color=paint;
  return v;
}
