(function (root) {
const NAMES = [
  'Bearded Taco of Regret',
  'ODM Brain',
  'Refurbished Braincell',
  'King Nyawit',
  'Subwoofer Snore Monster',
  'Panic Button Masher',
  'Refurbished Genius',
  'Captain Actually',
  'Unblinking Void Gazer',
  'Lactose Intolerant',
  '24/7 Madura Store Cashier',
  'Warmindo WiFi Leech',
  'Illegal Parking Fee Mafia',
  'Sleep Call Champion',
  'Class Skipper',
  'Free Fire Player',
  'Fake Math Tutor',
  'Ghosting Champion 2026',
  'Broken Calculator Owner',
  'MSG Overdose Survivor',
  'Crying Roblox Toddler',
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
  'Nepo Baby Intern',
  'Internship Tea Boy',
  'Mom Said Study Math',
  'Failed SNMPTN',
  'KIP Kuliah Hunter',
  'Slot Spin Survivor',
  'Pecel Lele Connoisseur',
  'Bocil Skibidi',
  'Touch Grass Candidate',
  'Failed UTBK Hopeful',
  'Unemployed Final Boss',
  'Your Ex Boyfriend',
  'Your Ex Girlfriend',
  'Proud Disappointment',
  'Ask Mom For Lunch Money',
  'Unpaid Overtime Enjoyer',
  'Bocil Epep',
  'Corporate Slave Rank 1',
  'Calculated With Fingers',
  'Trust Me Bro Degree',
  'Sleep Call Addict',
  'Skripsi Stalled 4 Years',
  'Who Invited This Guy',
  'Crying In Toilet At 2 PM',
  'Middle Seat On Angkot',
  'Roti O Smeller',
  'Zero Aura Math Student',
  'Aura Farmers',
  'Gambler Haters',
  'I Only Know Copy-Paste',
  'Negative Aura Demon',
  'Infinite Doomscroller',
  'Chronically Online',
  'Brainrot Connoisseur',
  'Side Character Energy',
  'NPC Behavior Analyst',
  'Certified Yapper',
  'Chief Yap Officer',
  'Yap Session Host',
  'Professional Gaslighter',
  'Delulu Pro Max',
  'Attention Span of 2s',
  'Subway Surfers Enjoyer',
  'TikTok Shop Addict',
  'iPad Kid All Grown Up',
  'No Thoughts Head Empty',
  'Cooked Beyond Repair',
  'Let Him Cook (He Burned It)',
  'Crashout Candidate',
  'Rizz Deprived',
  'Unspoken Rizz Failure',
  'Gatekeep Girlboss Slay',
  'Overthinking at 4 AM',
  'Doomscroll Till Sunrise',
  'Caught in 4K',
  'Skill Issue Personified',
  'Ratio Survivor',
  'L + Ratio Enthusiast',
  'I Fear Math',
  'Bro Thinks Hes Him',
  'Who Let Bro Cook',
  'Main Character Syndrome',
  'Microplastics Enjoyer',
  'Screen Time 14 Hours',
  'Professional Doomscroller',
  'I am a Cute Girl',
  'Any Info On Job Openings?',
  'Matcha Addiction',
  'Debt Collector'  
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
