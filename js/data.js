/**
 * 角色与技能数据模型
 * 技能类型：damage | heal | buff_atk | debuff_def
 * target：enemy | ally | self
 */

// 运行时立绘：assets/ultraman_heroes / assets/ultraman_kaiju
// 经典角色扩充：初代 / 赛文 / 杰克（及佐菲）
// 中文名按素材文件名翻译；旧 SVG 不再作为运行时主素材

const SKILL_TYPES = {
  DAMAGE: "damage",
  HEAL: "heal",
  BUFF_ATK: "buff_atk",
  DEBUFF_DEF: "debuff_def",
};

const TARGET_TYPES = {
  ENEMY: "enemy",
  ALLY: "ally",
  SELF: "self",
};

/** @type {Array<Object>} */
const HERO_ROSTER = [
  {
    id: "ultra_tiga",
    name: "迪迦奥特曼",
    title: "光之巨人",
    side: "hero",
    maxHp: 1180,
    atk: 145,
    def: 42,
    spd: 88,
    color: "#4fc3f7",
    image: "assets/ultraman_heroes/ULTRAMAN TIGA.png",
    skills: [
      { id: "basic", name: "光之拳", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础近战攻击" },
      { id: "zeperion", name: "泽佩利昂光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.75, cooldown: 2, desc: "强力光线，造成高额伤害" },
      { id: "light_heal", name: "光能治愈", type: SKILL_TYPES.HEAL, target: TARGET_TYPES.ALLY, power: 0.55, cooldown: 3, desc: "恢复一名队友生命" },
    ],
  },
  {
    id: "ultra_original",
    name: "初代奥特曼",
    title: "光之国传说",
    side: "hero",
    maxHp: 1200,
    atk: 150,
    def: 46,
    spd: 86,
    color: "#e53935",
    image: "assets/ultraman_heroes/ULTRAMAN.jpg",
    skills: [
      { id: "basic", name: "斯派修姆拳", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "经典近战打击" },
      { id: "specium", name: "斯派修姆光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.8, cooldown: 2, desc: "十字手势必杀光线" },
      { id: "ultra_slash", name: "八分光轮", type: SKILL_TYPES.DEBUFF_DEF, target: TARGET_TYPES.ENEMY, power: 0.36, cooldown: 3, duration: 2, desc: "光轮破防，降低敌方防御" },
    ],
  },
  {
    id: "ultra_seven",
    name: "赛文奥特曼",
    title: "宇宙警备队",
    side: "hero",
    maxHp: 1120,
    atk: 138,
    def: 48,
    spd: 84,
    color: "#90caf9",
    image: "assets/ultraman_heroes/ULTRASEVEN.jpg",
    skills: [
      { id: "basic", name: "眼部光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础远程攻击" },
      { id: "emerium", name: "艾梅利姆光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.65, cooldown: 2, desc: "精准高伤技能" },
      { id: "shield_break", name: "破防射线", type: SKILL_TYPES.DEBUFF_DEF, target: TARGET_TYPES.ENEMY, power: 0.4, cooldown: 3, duration: 2, desc: "降低敌方防御 2 回合" },
    ],
  },
  {
    id: "ultra_jack",
    name: "杰克奥特曼",
    title: "归来的奥特曼",
    side: "hero",
    maxHp: 1150,
    atk: 148,
    def: 45,
    spd: 91,
    color: "#1e88e5",
    image: "assets/ultraman_heroes/ULTRAMAN JACK.jpg",
    skills: [
      { id: "basic", name: "斯派修姆斩", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础斩击" },
      { id: "ultra_bracelet", name: "奥特手镯", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.68, cooldown: 2, desc: "手镯变化攻击" },
      { id: "cinerama", name: "希奈拉玛光线", type: SKILL_TYPES.BUFF_ATK, target: TARGET_TYPES.SELF, power: 0.33, cooldown: 3, duration: 2, desc: "积蓄光能提升攻击" },
    ],
  },
  {
    id: "ultra_zoffy",
    name: "佐菲",
    title: "奥特兄弟队长",
    side: "hero",
    maxHp: 1180,
    atk: 142,
    def: 50,
    spd: 83,
    color: "#fb8c00",
    image: "assets/ultraman_heroes/ZOFFY.png",
    skills: [
      { id: "basic", name: "M87 拳", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础打击" },
      { id: "m87", name: "M87 光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.78, cooldown: 2, desc: "队长级强力光线" },
      { id: "command", name: "指挥号令", type: SKILL_TYPES.BUFF_ATK, target: TARGET_TYPES.ALLY, power: 0.3, cooldown: 3, duration: 2, desc: "提升一名队友攻击" },
    ],
  },
  {
    id: "ultra_zero",
    name: "赛罗奥特曼",
    title: "新世代之光",
    side: "hero",
    maxHp: 1050,
    atk: 160,
    def: 36,
    spd: 102,
    color: "#81d4fa",
    image: "assets/ultraman_heroes/ULTRAMAN ZERO.jpg",
    skills: [
      { id: "basic", name: "高速踢击", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "快速基础攻击" },
      { id: "wide_shot", name: "宽幅光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.55, cooldown: 2, desc: "中高伤害光线" },
      { id: "zero_drive", name: "赛罗驱动", type: SKILL_TYPES.BUFF_ATK, target: TARGET_TYPES.SELF, power: 0.35, cooldown: 3, duration: 2, desc: "提升自身攻击 2 回合" },
    ],
  },
  {
    id: "ultra_geed",
    name: "捷德奥特曼",
    title: "融合上升",
    side: "hero",
    maxHp: 1080,
    atk: 150,
    def: 40,
    spd: 95,
    color: "#64b5f6",
    image: "assets/ultraman_heroes/ULTRAMAN GEED.jpg",
    skills: [
      { id: "basic", name: "融合拳", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "wreaking", name: "破坏冲击波", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.7, cooldown: 2, desc: "爆发伤害" },
      { id: "rally", name: "战意鼓舞", type: SKILL_TYPES.BUFF_ATK, target: TARGET_TYPES.ALLY, power: 0.3, cooldown: 3, duration: 2, desc: "提升一名队友攻击" },
    ],
  },
  {
    id: "ultra_z",
    name: "泽塔奥特曼",
    title: "新生代之光",
    side: "hero",
    maxHp: 1100,
    atk: 142,
    def: 44,
    spd: 90,
    color: "#29b6f6",
    image: "assets/ultraman_heroes/ULTRAMAN Z.jpg",
    skills: [
      { id: "basic", name: "Z 斩击", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础斩击" },
      { id: "zestium", name: "泽斯提乌姆光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.8, cooldown: 3, desc: "超高伤害必杀" },
      { id: "mend", name: "光粒子修复", type: SKILL_TYPES.HEAL, target: TARGET_TYPES.SELF, power: 0.45, cooldown: 2, desc: "自我恢复" },
    ],
  },
  {
    id: "ultra_cosmos",
    name: "高斯奥特曼",
    title: "蓝色和平",
    side: "hero",
    maxHp: 1200,
    atk: 130,
    def: 50,
    spd: 78,
    color: "#4dd0e1",
    image: "assets/ultraman_heroes/ULTRAMAN COSMOS.jpg",
    skills: [
      { id: "basic", name: "和平之拳", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "full_moon", name: "满月光环", type: SKILL_TYPES.HEAL, target: TARGET_TYPES.ALLY, power: 0.65, cooldown: 3, desc: "强力治疗队友" },
      { id: "blaster", name: "高斯爆裂", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.5, cooldown: 2, desc: "稳定输出技能" },
    ],
  },
  {
    id: "ultra_dyna",
    name: "戴拿奥特曼",
    title: "未来之光",
    side: "hero",
    maxHp: 1140,
    atk: 148,
    def: 41,
    spd: 93,
    color: "#42a5f5",
    image: "assets/ultraman_heroes/ULTRAMAN DYNA.jpg",
    skills: [
      { id: "basic", name: "闪光拳", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "solgent", name: "索尔真特光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.68, cooldown: 2, desc: "强力光线" },
      { id: "strong_form", name: "强力形态", type: SKILL_TYPES.BUFF_ATK, target: TARGET_TYPES.SELF, power: 0.32, cooldown: 3, duration: 2, desc: "提升自身攻击" },
    ],
  },
  {
    id: "ultra_gaia",
    name: "盖亚奥特曼",
    title: "大地之光",
    side: "hero",
    maxHp: 1220,
    atk: 136,
    def: 54,
    spd: 80,
    color: "#26c6da",
    image: "assets/ultraman_heroes/ULTRAMAN GAIA.jpg",
    skills: [
      { id: "basic", name: "光子拳", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "quantum", name: "量子光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.6, cooldown: 2, desc: "稳定高伤" },
      { id: "earth_guard", name: "大地守护", type: SKILL_TYPES.HEAL, target: TARGET_TYPES.ALLY, power: 0.5, cooldown: 3, desc: "恢复队友生命" },
    ],
  },
  {
    id: "ultra_mebius",
    name: "梦比优斯",
    title: "继承之光",
    side: "hero",
    maxHp: 1090,
    atk: 146,
    def: 43,
    spd: 96,
    color: "#5c6bc0",
    image: "assets/ultraman_heroes/ULTRAMAN MEBIUS.jpg",
    skills: [
      { id: "basic", name: "梦比优斯拳", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "mebius_ray", name: "梦比优斯光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.66, cooldown: 2, desc: "强力光线" },
      { id: "courage", name: "燃烧勇气", type: SKILL_TYPES.BUFF_ATK, target: TARGET_TYPES.ALLY, power: 0.28, cooldown: 3, duration: 2, desc: "鼓舞队友攻击" },
    ],
  },
  {
    id: "ultra_orb",
    name: "欧布奥特曼",
    title: "源气之光",
    side: "hero",
    maxHp: 1110,
    atk: 152,
    def: 39,
    spd: 97,
    color: "#7e57c2",
    image: "assets/ultraman_heroes/ULTRAMAN ORB.jpg",
    skills: [
      { id: "basic", name: "欧布斩", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础斩击" },
      { id: "orb_ray", name: "欧布终极光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.72, cooldown: 2, desc: "爆发伤害" },
      { id: "origin", name: "源气增幅", type: SKILL_TYPES.BUFF_ATK, target: TARGET_TYPES.SELF, power: 0.34, cooldown: 3, duration: 2, desc: "提升自身攻击" },
    ],
  },
  {
    id: "ultra_taro",
    name: "泰罗奥特曼",
    title: "奥特六兄弟",
    side: "hero",
    maxHp: 1160,
    atk: 144,
    def: 47,
    spd: 86,
    color: "#ef6c00",
    image: "assets/ultraman_heroes/ULTRAMAN TARO.jpg",
    skills: [
      { id: "basic", name: "斯托利姆拳", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "storium", name: "斯托利姆光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.7, cooldown: 2, desc: "强力光线" },
      { id: "badge", name: "奥特徽章", type: SKILL_TYPES.HEAL, target: TARGET_TYPES.SELF, power: 0.48, cooldown: 2, desc: "自我恢复" },
    ],
  },
  {
    id: "ultra_leo",
    name: "雷欧奥特曼",
    title: "宇宙拳王",
    side: "hero",
    maxHp: 1070,
    atk: 168,
    def: 35,
    spd: 104,
    color: "#ff7043",
    image: "assets/ultraman_heroes/ULTRAMAN LEO.jpg",
    skills: [
      { id: "basic", name: "雷欧踢", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础踢击" },
      { id: "leo_kick", name: "雷欧飞踢", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.7, cooldown: 2, desc: "高伤踢技" },
      { id: "armor_break", name: "破甲连击", type: SKILL_TYPES.DEBUFF_DEF, target: TARGET_TYPES.ENEMY, power: 0.38, cooldown: 3, duration: 2, desc: "降低敌方防御" },
    ],
  },
];

/** @type {Array<Object>} */
const MONSTER_ROSTER = [
  {
    id: "kaiju_gomora",
    name: "哥莫拉",
    title: "古代怪兽",
    side: "monster",
    maxHp: 1250,
    atk: 148,
    def: 52,
    spd: 70,
    color: "#ef5350",
    image: "assets/ultraman_kaiju/GOMORA (1).jpg",
    skills: [
      { id: "basic", name: "角击", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础冲撞" },
      { id: "super_oscillo", name: "超振荡波", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.6, cooldown: 2, desc: "高伤震荡攻击" },
      { id: "harden", name: "岩甲硬化", type: SKILL_TYPES.BUFF_ATK, target: TARGET_TYPES.SELF, power: 0.25, cooldown: 3, duration: 2, desc: "提升自身攻击" },
    ],
  },
  {
    id: "kaiju_redking",
    name: "红王",
    title: "怪力怪兽",
    side: "monster",
    maxHp: 1180,
    atk: 165,
    def: 38,
    spd: 76,
    color: "#e53935",
    image: "assets/ultraman_kaiju/RED KING II.jpg",
    skills: [
      { id: "basic", name: "重拳", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础重击" },
      { id: "power_bomb", name: "怪力投摔", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.75, cooldown: 2, desc: "爆发物理伤害" },
      { id: "intimidate", name: "威吓咆哮", type: SKILL_TYPES.DEBUFF_DEF, target: TARGET_TYPES.ENEMY, power: 0.35, cooldown: 3, duration: 2, desc: "降低目标防御" },
    ],
  },
  {
    id: "kaiju_eleking",
    name: "艾雷王",
    title: "电流怪兽",
    side: "monster",
    maxHp: 1100,
    atk: 140,
    def: 40,
    spd: 92,
    color: "#ff7043",
    image: "assets/ultraman_kaiju/ELEKING.jpg",
    skills: [
      { id: "basic", name: "电击尾", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础电击" },
      { id: "thunder", name: "百万伏特", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.7, cooldown: 2, desc: "强力电流" },
      { id: "spark_heal", name: "电荷再生", type: SKILL_TYPES.HEAL, target: TARGET_TYPES.SELF, power: 0.4, cooldown: 3, desc: "自我恢复" },
    ],
  },
  {
    id: "kaiju_zetton",
    name: "杰顿",
    title: "宇宙恐龙",
    side: "monster",
    maxHp: 1220,
    atk: 155,
    def: 46,
    spd: 80,
    color: "#d32f2f",
    image: "assets/ultraman_kaiju/ZETTON (1).jpg",
    skills: [
      { id: "basic", name: "火球", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础火球" },
      { id: "one_trillion", name: "一兆度火球", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.85, cooldown: 3, desc: "超高伤害必杀" },
      { id: "barrier_break", name: "屏障瓦解", type: SKILL_TYPES.DEBUFF_DEF, target: TARGET_TYPES.ENEMY, power: 0.45, cooldown: 3, duration: 2, desc: "大幅降低防御" },
    ],
  },
  {
    id: "kaiju_alien_baltan",
    name: "巴尔坦星人",
    title: "宇宙忍者",
    side: "monster",
    maxHp: 1000,
    atk: 135,
    def: 34,
    spd: 110,
    color: "#ff8a65",
    image: "assets/ultraman_kaiju/ALIEN BALTAN (1).jpg",
    skills: [
      { id: "basic", name: "钳子斩", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "white_destroy", name: "白色破坏光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.55, cooldown: 2, desc: "快速高伤" },
      { id: "clone_boost", name: "分身增幅", type: SKILL_TYPES.BUFF_ATK, target: TARGET_TYPES.SELF, power: 0.4, cooldown: 3, duration: 2, desc: "大幅提升攻击" },
    ],
  },
  {
    id: "kaiju_king_joe",
    name: "金古桥",
    title: "机器人军团",
    side: "monster",
    maxHp: 1300,
    atk: 132,
    def: 58,
    spd: 68,
    color: "#c62828",
    image: "assets/ultraman_kaiju/KING JOE.jpg",
    skills: [
      { id: "basic", name: "金属拳", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "pedanium", name: "佩达尼姆射线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.6, cooldown: 2, desc: "装甲射线" },
      { id: "repair", name: "自修复协议", type: SKILL_TYPES.HEAL, target: TARGET_TYPES.ALLY, power: 0.5, cooldown: 3, desc: "修复一名队友" },
    ],
  },
  {
    id: "kaiju_belial",
    name: "贝利亚",
    title: "黑暗奥特曼",
    side: "monster",
    maxHp: 1240,
    atk: 170,
    def: 42,
    spd: 94,
    color: "#8e24aa",
    image: "assets/ultraman_kaiju/ULTRAMAN BELIAL.jpg",
    skills: [
      { id: "basic", name: "暗黑爪击", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "deathcium", name: "死灭光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.8, cooldown: 3, desc: "超高伤害必杀" },
      { id: "dark_boost", name: "黑暗增幅", type: SKILL_TYPES.BUFF_ATK, target: TARGET_TYPES.SELF, power: 0.36, cooldown: 3, duration: 2, desc: "提升自身攻击" },
    ],
  },
  {
    id: "kaiju_tyrant",
    name: "泰兰特",
    title: "合成怪兽",
    side: "monster",
    maxHp: 1280,
    atk: 158,
    def: 50,
    spd: 72,
    color: "#6d4c41",
    image: "assets/ultraman_kaiju/TYRANT.jpg",
    skills: [
      { id: "basic", name: "合成重击", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "flame", name: "火焰喷射", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.68, cooldown: 2, desc: "强力火焰" },
      { id: "roar", name: "威压咆哮", type: SKILL_TYPES.DEBUFF_DEF, target: TARGET_TYPES.ENEMY, power: 0.4, cooldown: 3, duration: 2, desc: "降低目标防御" },
    ],
  },
  {
    id: "kaiju_bemstar",
    name: "贝姆斯塔",
    title: "宇宙怪兽",
    side: "monster",
    maxHp: 1150,
    atk: 138,
    def: 48,
    spd: 82,
    color: "#00897b",
    image: "assets/ultraman_kaiju/BEMSTAR.png",
    skills: [
      { id: "basic", name: "吸能冲击", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "reflect", name: "能量反弹", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.58, cooldown: 2, desc: "反弹能量攻击" },
      { id: "absorb", name: "能量吸收", type: SKILL_TYPES.HEAL, target: TARGET_TYPES.SELF, power: 0.42, cooldown: 3, desc: "吸收能量恢复自身" },
    ],
  },
  {
    id: "kaiju_mefilas",
    name: "美菲拉斯星人",
    title: "策谋星人",
    side: "monster",
    maxHp: 1040,
    atk: 142,
    def: 36,
    spd: 108,
    color: "#5e35b1",
    image: "assets/ultraman_kaiju/ALIEN MEFILAS.jpg",
    skills: [
      { id: "basic", name: "精神冲击", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "hypno", name: "催眠光线", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.52, cooldown: 2, desc: "精神系伤害" },
      { id: "scheme", name: "谋略削弱", type: SKILL_TYPES.DEBUFF_DEF, target: TARGET_TYPES.ENEMY, power: 0.42, cooldown: 3, duration: 2, desc: "降低目标防御" },
    ],
  },
  {
    id: "kaiju_black_king",
    name: "黑王",
    title: "凶暴怪兽",
    side: "monster",
    maxHp: 1260,
    atk: 160,
    def: 49,
    spd: 74,
    color: "#37474f",
    image: "assets/ultraman_kaiju/BLACK KING.jpg",
    skills: [
      { id: "basic", name: "蛮力冲撞", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "horn", name: "角刺突进", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.7, cooldown: 2, desc: "强力冲锋" },
      { id: "berserk", name: "狂暴化", type: SKILL_TYPES.BUFF_ATK, target: TARGET_TYPES.SELF, power: 0.3, cooldown: 3, duration: 2, desc: "提升自身攻击" },
    ],
  },
  {
    id: "kaiju_twintail",
    name: "双尾怪",
    title: "古代怪兽",
    side: "monster",
    maxHp: 1120,
    atk: 146,
    def: 41,
    spd: 98,
    color: "#f4511e",
    image: "assets/ultraman_kaiju/TWINTAIL.png",
    skills: [
      { id: "basic", name: "双尾鞭击", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1, cooldown: 0, desc: "基础攻击" },
      { id: "sting", name: "毒刺突袭", type: SKILL_TYPES.DAMAGE, target: TARGET_TYPES.ENEMY, power: 1.56, cooldown: 2, desc: "快速高伤" },
      { id: "swift", name: "迅捷强化", type: SKILL_TYPES.BUFF_ATK, target: TARGET_TYPES.SELF, power: 0.28, cooldown: 3, duration: 2, desc: "提升自身攻击" },
    ],
  },
];

/**
 * 深拷贝角色模板为战斗单位
 * @param {Object} template
 * @param {string} uid
 */
function createFighter(template, uid) {
  return {
    uid,
    templateId: template.id,
    name: template.name,
    title: template.title,
    side: template.side,
    maxHp: template.maxHp,
    hp: template.maxHp,
    baseAtk: template.atk,
    baseDef: template.def,
    atk: template.atk,
    def: template.def,
    spd: template.spd,
    color: template.color,
    image: template.image,
    alive: true,
    buffs: [],
    skills: template.skills.map((s) => ({
      ...s,
      currentCd: 0,
    })),
  };
}

/**
 * 随机挑选 n 个不重复怪兽
 * @param {number} n
 */
function pickRandomMonsters(n = 3) {
  const pool = [...MONSTER_ROSTER];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).map((m, idx) => createFighter(m, `m${idx + 1}`));
}

/**
 * 根据 id 列表创建奥特曼小队
 * @param {string[]} ids
 */
function createHeroTeam(ids) {
  return ids.map((id, idx) => {
    const template = HERO_ROSTER.find((h) => h.id === id);
    if (!template) throw new Error(`未知奥特曼: ${id}`);
    return createFighter(template, `h${idx + 1}`);
  });
}

window.GameData = {
  SKILL_TYPES,
  TARGET_TYPES,
  HERO_ROSTER,
  MONSTER_ROSTER,
  createFighter,
  pickRandomMonsters,
  createHeroTeam,
};
