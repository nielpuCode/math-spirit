(function (root) {
  var ZERO = [
    ['0 Braincell Detected', 'Bro got 0. Even an indomaret receipt has more useful numbers than this.'],
    ['Gak Lulus SD Energy', 'Literally zero correct. Did you answer this using your forehead?'],
    ['Brain Left The Chat', 'Not a single point. Go wash your face with warm tea and think about your life choices.'],
    ['Screen Smudger Pro Max', 'You just rubbed your thumb on the screen and prayed to Lord. It did not work.'],
    ['Disowned By Parents', 'Zero score bro. Do not let your family find out you struggle with primary school math.'],
    ['Brain Left At Home', 'Zero points on the board. Did you leave your brain charging on the nightstand?'],
    ['Bocil Top Up Level Math', 'Bro can memorize ML diamond prices but folded instantly on a single plus sign.'],
    ['Minus IQ Exhibition', 'Not one right answer. Genuinely hard to get a flat zero by accident, so respect the dedication.'],
    ['Calculator Battery Leaked', 'Zero correct answers. The phone screen was bright but the head was pitch black.'],
    ['Gak Usah Pamer Nilai', 'Zero points flat. Hide your phone screen before someone looks over your shoulder.'],
  ];

  var SPEED = [
    ['Speedrunning Skena Failure', 'Finished in 2 seconds just to miss every single problem. Absolute clown behavior.'],
    ['Panic Tapper Final Boss', 'Fingers moving like a pro gamer, brain working like a potato battery.'],
    ['Fast But Dumb', 'Bro tapped at lightning speed straight into a ditch. Where were you even rushing to?'],
    ['Loud, Fast, Becusn\u2019t', '100% confidence, 0% accuracy. That takes special talent honestly.'],
    ['All Gas, No IQ', 'Tapped before reading a single number. Go drink some water, calm down.'],
    ['Finger Racing, Brain Parking', 'Tapped like a StarCraft pro with the mental processing power of a brick.'],
    ['Speedrun Masuk Jurang', 'Finished the entire round in record time just to get clowned by the leaderboard.'],
    ['Touchscreen Abuser', 'Bro didn’t even glance at the question, just threw hands at the glass panel.'],
    ['Spam Tapper No Jutsu', 'Tapped faster than a delivery courier on a deadline, missed every single target.'],
    ['Turbo Flop', 'Zero hesitation, zero points. Going fast doesn’t count when every guess is garbage.'],
  ];

  var PERFECT = [
    ['Touch Grass Sweat Lord', '100% clean run. Put the phone down bro, nobody is clapping for you.'],
    ['Kalkulator Berjalan', 'Flawless score. We know damn well your daily screen time is 18 hours.'],
    ['Bro Thinks He Is Him', 'Perfect math score on a troll game. Your ego is going to be unbearable today.'],
    ['Teacher\u2019s Pet Scent', 'Full marks. Enjoy your imaginary medal because nobody is inviting you to nongkrong.'],
    ['Joki Ujian Vibes', 'Clean 100% run. Did you pay someone under the table to tap your screen for you?'],
    ['Suspiciously Too Smart', 'Zero wrong answers in a room full of clowns. You clearly don’t belong in this circle.'],
    ['Einstein Jalur Haram', 'Every single question nailed. Your friends are already checking your screen for open cheat tabs.'],
    ['Otak Pinjaman', 'Flawless score. Whose brain did you rent for this 30-second math sprint?'],
    ['Sweat Dripping On Glass', '100% accuracy on basic arithmetic. Go put this monumental achievement on your CV.'],
  ];

  var WIN = [
    ['1st Place Tryhard', 'Bro locked in for basic addition. Go outside, the sun is shining.'],
    ['Gaji UMR Mindset', 'You won a math sprint game. Put this on your LinkedIn profile right now.'],
    ['Sweaty Fingers Champion', 'First place winner. Go wash your hands, the screen is crying.'],
    ['Unemployed Final Boss', 'Nobody calculates that fast unless they have zero tasks and zero social life.'],
    ['Ego Naik Ke Langit', 'You took first place in a meme math game. Your friends will never hear the end of this.'],
  ['Sok Paling Cerdas', 'First place trophy secured. Enjoy talking trash until the next round humbles you.'],
  ['Juara Tingkat RT', 'Congratulations, you beat 7 clueless friends in 2-digit math. World tour when?'],
  ['Aura Farm Succeeded', 'Claimed the top spot on the podium. Bask in the glory before your luck runs out.'],
  ['Menang Hoki Doang', 'Rank 1 on the board. You know damn well half of those taps were blind panic choices.'],
  ];

  var TIE = [
    ['Kalah Cuma Beda Jari', 'Same score, lost by 0.1 seconds. Your fingers literally threw the bag.'],
    ['Juara 2 Abadi', 'Got all the math right just to lose the race. The pain is genuine.'],
    ['Minus Aura Runner Up', 'Tied on points, zero trophy. Literally nobody remembers second place.'],
    ['Kalah Beda Kedipan Mata', 'Identical score line, but your opponent’s thumb had 5G reflexes while yours had 3G.'],
  ['Juara 2 Jalur Ngenes', 'Matched the winner point for point only to get wiped out on millisecond split time.'],
  ['Sedikit Lagi Jadi Juara', 'All that mental strain just to end up on the losing end of a tiebreaker. Tragic.'],
  ['Refleks Kakek-Kakek', 'Got the exact same math right, lost because your fingers needed a warm-up session.'],
  ['Runner-Up Tanpa Mahkota', 'Equal brainpower, slower thumbs. Second place gets you a participation sigh and nothing else.'],
  ];

  var BOTTOM = [
    ['Bottom Frag NPC', 'Dead last. If anyone asks who you are, we do not know you.'],
    ['Paling Beban Di Tongkrongan', 'Bro came to the match just to lower the room\u2019s average IQ.'],
    ['Brain Rotted By TikTok', 'Lost focus immediately. Need subway surfers footage under the math problem?'],
    ['How Do You Even Survive?', 'Watching you struggle with two digits gave everyone second-hand embarrassment.'],
    ['Walking L Energy', 'Lowest score, slowest taps, zero aura. A complete disaster across the board.'],
    ['Beban Keluarga Season 2', 'Bottom of the food chain. Your score is low enough to make your squad lose their appetite.'],
  ['Pajangan Lobby', 'Dead last with zero resistance. You contributed nothing to this match except comic relief.'],
  ['Duta Remedial', 'Anchor of the scoreboard. If we dropped you any lower, you would fall off the screen.'],
  ['Jualan Es Saja Bro', 'Math clearly isn’t in your future plans. Time to pivot into opening a roadside drinks stall.'],
  ['Malu-Maluin Tongkrongan', 'Last place by a mile. Do us a favor and deny you were in this room if anyone asks.'],
  ];

  var SLOW = [
    ['Ngelag Kayak WiFi Warteg', 'Took 5 business days for one question. Did your phone freeze or was it your brain?'],
    ['Counting On Toes And Fingers', 'Bro had to write draft notes on paper just to add two simple numbers.'],
    ['Loading Bar In Real Life', 'Good accuracy, but your squad graduated college while waiting for your turn.'],
    ['Tertidur Pas Ngerjain', 'We had enough time to order coffee and eat gorengan before you finished.'],
    ['Tunggu Lebaran Selesai', 'Still tapping question 3 while the rest of the squad already went home and slept.'],
  ['Ngecas Otak Dulu', 'Took so long per question we thought your internet package ran out mid-sentence.'],
  ['Manual Gearbox Thinking', 'We literally watched your brain crank the manual lever just to process a single digit.'],
  ['Siput Pake Rem', 'High precision, glacial movement. We could have boiled instant noodles while waiting on you.'],
  ['Prosesor Jaman Batu', 'Did you have to verify each equation with your neighborhood community leader first?'],
  ];

  var MID = [
    ['Side Character Scent', 'Dead center of the scoreboard. Zero aura, zero threat, perfectly forgettable.'],
    ['Air Kobokan Energy', 'Not good enough to boast, not bad enough to roast. Just plain tasteless.'],
    ['Penonton Bayaran', 'Technically played, but literally nobody in the room noticed you were there.'],
    ['Pas KKM Pas-Pasan', 'Did just enough to not cry, but your ancestors are still shaking their heads.'],
    ['Aman Cari Selamat', 'Middle of the pack. You definitely sleep at 9 PM with no alarms.'],
    ['Warga Sipil Biasa', 'Right down the middle. No highlights, no roasts, just pure neutral background noise.'],
  ['Skor Rata-Rata Air', 'Sitting comfortably in third place where nobody has any expectations of you anyway.'],
  ['Ghosting The Leaderboard', 'Not high enough to celebrate, not low enough to cry. Completely forgettable run.'],
  ['Ambil Jalan Tengah', 'You didn’t win, you didn’t embarrass yourself, you just existed for two minutes.'],
  ['Bukan Ancaman Siapapun', 'Zero threat to the frontrunners, zero sympathy for the bottom fraggers. Just floating.'],
  ];

  var FALLBACK = [
    ['Error 404 Brain', 'The system doesn\u2019t even know how to rank that mess. Just restart the game.'],
    ['Mystery Flop', 'Your stats make no sense. Tap replay and pretend this never happened.'],
    ['Server Kebingungan', 'Your match data is so weird even the game logic gave up trying to categorize it.'],
  ['Anomali Ruang Angkasa', 'The numbers came back completely scrambled. Hit restart and wipe the slate clean.'],
  ['Otak Korslet', 'Something broke between your finger and the database. Take the mulligan and run it back.'],
  ['Data Hilang Di Jalan', 'Scoreboard refused to rank that performance. Tap again and pretend that run never happened.'],
  ['Misteri Tanpa Jawaban', 'Nobody knows what happened in that round. Best to wipe your hands and try another run.'],
  ];

  // Priority classifier: first match wins. stat = {correct, answered, ms,
  // rank (1-based), players, total, firstCorrect}.
  function bracket(stat) {
    var s = stat || {};
    var correct = Number(s.correct) || 0;
    var answered = Number(s.answered) || 0;
    var total = Number(s.total) || 0;
    if (correct <= 0) return ZERO;
    if (total > 0 && correct >= total) return PERFECT;
    if (s.rank === 1) return WIN;
    // Same score, slower time — at any depth, not just head-to-head.
    if (s.rank > 1 && correct === Number(s.firstCorrect)) return TIE;
    if (answered > 0) {
      var acc = correct / answered;
      var avg = Number(s.ms) / answered;
      if (acc < 0.5 && avg < 3000) return SPEED;
    }
    if (Number(s.players) >= 2 && s.rank === Number(s.players)) return BOTTOM;
    if (answered > 0) {
      var acc2 = correct / answered;
      var avg2 = Number(s.ms) / answered;
      if (avg2 > 8000 && acc2 >= 0.5) return SLOW;
    }
    if (s.rank != null) return MID;
    return FALLBACK;
  }

  function hashId(id) {
    var str = String(id == null ? '' : id);
    var h = 5381;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    }
    return h >>> 0;
  }

  // Deterministic per player: same input always yields the same line, and
  // every client computes the same line from the shared roster — no messages.
  function pick(stat) {
    var list = bracket(stat);
    var entry = list[hashId(stat && stat.id) % list.length];
    return { title: entry[0], line: entry[1] };
  }

  // Results header. A tie is ONLY the exact same score AND the exact same
  // time — same score with a slower time is a clean loss, any rank.
  // board: rank-sorted [{id, name, correct, ms}]. Returns {title, cls, note}.
  function headline(board, meId) {
    var list = board || [];
    var first = list[0] || { name: 'Nobody', correct: 0, ms: 0 };
    var tied = function (p) { return p.correct === first.correct && p.ms === first.ms; };
    var winners = list.filter(tied);
    var me = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === meId) me = list[i];
    }
    var iWon = !!me && tied(me);
    var out;
    if (iWon && winners.length === 1) {
      out = { title: 'You Win!', cls: 'result-win' };
    } else if (iWon) {
      out = { title: 'Tie for 1st!', cls: 'result-draw' };
    } else {
      var pos = me ? list.indexOf(me) + 1 : list.length;
      out = { title: '#' + pos + ' of ' + list.length, cls: 'result-lose' };
    }
    out.note = list.length > 1
      ? (winners.length > 1 ? 'Exact tie — same score, same time' : 'Most correct wins')
      : '';
    return out;
  }

  var api = {
    pick: pick,
    headline: headline,
    bracket: bracket,
    tables: {
      ZERO: ZERO,
      SPEED: SPEED,
      PERFECT: PERFECT,
      WIN: WIN,
      TIE: TIE,
      BOTTOM: BOTTOM,
      SLOW: SLOW,
      MID: MID,
      FALLBACK: FALLBACK,
    },
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MathSprintRoast = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
