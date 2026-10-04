(function (root) {
const NAMES = [
  'Bearded Taco of Regret',
  'ODM Brain',
  'Refurbished Braincell',
  'Aggressively Bald Dorito',
  'Crayon Chewer Prime',
  'Sentient Wet Sock',
  'King Nyawit',
  'Subwoofer Snore Monster',
  'Hindsight Warlock',
  'Barbenheimer’s Left Knee',
  'Depressed Solar Calculator',
  'Lord of Pure Guesswork',
  'Panic Button Masher',
  'Greasy Napkin Physicist',
  'Clearance Rack Einstein',
  'Microwave Burrito Philosopher',
  'Highway Traffic Honk-Dancer',
  'Desperate WiFi Sniffer',
  'Cold Crusty Rice Sommelier',
  'Refurbished Genius (Parts Missing)',
  'Supreme Overlord of Naps',
  'Snack Smuggling Raccoon',
  'Captain Actually',
  'Infinite Buffering Wheel',
  'Deep-Fried Hamster Brain',
  '3 A.M. Ceiling Staring Pro',
  'Unblinking Void Gazer',
  'Tears-Flavored Instant Noodle',
  'Rabid Roomba with a Butter Knife',
  'Lactose Intolerant Cheese Demon',
  'Backwards-Walking Pigeon',
  'Pocket Lint Aficionado',
  '24/7 Madura Store Cashier',
  'Warmindo WiFi Leech',
  'Illegal Parking Fee Mafia',
  'Loud Exhaust Scooter Terrorist',
  'Cold Fried Tofu Enthusiast',
  'Sweet Iced Tea Addict',
  'Full-Time Sleep Call Champion',
  'Class Skipper Supreme',
  'Free Fire Skin Beggar',
  'Unpaid Online Loan Ambassador',
  'Mom Tupperware Smuggler',
  'Receipt Collector at Alfamart',
  'Furious Delivery Guy Victim',
  'Orange Cat Behaviorist',
  'Neighborhood Watch Conspiracy Theorist',
  'Kids Train Racing Driver',
  'Fake Math Tutor',
  'Overcooked Noodle Sommelier',
  'Ghosting Champion 2026',
  'Broken Calculator Owner',
  'Certified Exact Change Payer',
  'Backseat Motorcycle Navigator',
  'Public Minibus Drift Master',
  'MSG Overdose Survivor',
  'Crying Roblox Toddler',
  'Minister of Extreme Napping',
  'Spicy Chili Paste Doctor',
  'Local Apocalypse Coordinator',
  'Water Gallon Delivery Prodigy',
  'Crying Over Bad Math',
  'Remedial Subscription',
  'Teachers Favorite',
  'Princess',
  'Goverment Haters',
  'MBG Addiction',
  'Kopdes Manager',
  'IB Trader',
  'Get A Job, Unc',
  'PFC Part Damaged',
  'GPT Abuser',
  'AI Graduates',
  'Thanks ChatGPT',
  'I Love You',
  'I Dont Love You',
  'I Hate You',
  'Your Haters',
  'Parents Hopes',
];

  const SUFFIX_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const STORE_KEY = 'mathsprint.name';

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomName() {
    return NAMES[randInt(0, NAMES.length - 1)];
  }

  function normalize(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function suffix() {
    return SUFFIX_ALPHABET[randInt(0, SUFFIX_ALPHABET.length - 1)] +
      SUFFIX_ALPHABET[randInt(0, SUFFIX_ALPHABET.length - 1)];
  }

  function uniqueName(base, taken) {
    const clean = String(base == null ? '' : base).trim().slice(0, 20) || randomName();
    const used = {};
    for (let i = 0; i < (taken || []).length; i++) {
      used[normalize(taken[i])] = true;
    }
    if (!used[normalize(clean)]) return clean;
    for (let i = 0; i < 50; i++) {
      const cand = clean + '-' + suffix();
      if (!used[normalize(cand)]) return cand;
    }
    return clean + '-' + suffix() + suffix();
  }

  function store() {
    try {
      return root.localStorage || null;
    } catch (e) {
      return null;
    }
  }

  // Only user-typed names are persisted. Random defaults are never saved,
  // so each fresh session rerolls a new funny name.
  function loadCustom() {
    const s = store();
    if (!s) return '';
    try {
      return String(s.getItem(STORE_KEY) || '').trim().slice(0, 20);
    } catch (e) {
      return '';
    }
  }

  function saveCustom(name) {
    const clean = String(name == null ? '' : name).trim().slice(0, 20);
    if (!clean) return;
    const s = store();
    if (!s) return;
    try {
      s.setItem(STORE_KEY, clean);
    } catch (e) {}
  }

  const api = {
    NAMES: NAMES,
    randomName: randomName,
    normalize: normalize,
    uniqueName: uniqueName,
    loadCustom: loadCustom,
    saveCustom: saveCustom,
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MathSprintNames = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
