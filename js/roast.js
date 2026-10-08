(function (root) {
  var ZERO = [
    ['Zero Aura Detected', 'Bro scored 0. Even a parking ticket has more useful numbers than this.'],
    ['Gagal SNBP Energy', 'Zero correct. Did you fill the answers using autofill?'],
    ['Cooked Beyond Repair', 'Not a single point. You are officially cooked, no kitchen can save this.'],
    ['Bansos Brain Program', 'Zero score. Your brain applied for aid and got rejected twice.'],
    ['Screen Smudger Pro Max', 'You rubbed your thumb on the glass and prayed. It did not work.'],
    ['KKM Tertinggi Sedunia', 'Even the lowest passing grade in history looks at this score and gives up.'],
    ['Diamond ML, Brain AFK', 'Bro memorizes every skin price but folded on one plus sign.'],
    ['Minus Aura Exhibition', 'A flat zero takes dedication. Respect the commitment to the bit.'],
    ['Calculator Button Missing', 'Zero correct. The screen was bright but the head had low battery.'],
    ['Remedial Jalur VIP', 'Straight to remedial with priority seating. The teacher already printed your name.'],
  ];

  var SPEED = [
    ['Speedrun 6-7', 'Finished in record time just to miss everything. 6-7 indeed.'],
    ['Panic Tapper Final Boss', 'Fingers move like a pro gamer, brain runs like a potato battery.'],
    ['Fast But Wrong', 'Bro tapped at lightning speed straight into a ditch. Where were you rushing to?'],
    ['All Gas, No Brain', 'Tapped before reading a single number. Drink some water and calm down.'],
    ['Skipped Reading Challenge', 'Who needs the question when you have confidence and two fast thumbs?'],
    ['Turbo Flop Era', 'Zero hesitation, zero points. Speed means nothing when every guess misses.'],
    ['Spam Tap No Jutsu', 'Tapped faster than an ojol chasing a bonus, missed every target.'],
    ['Clicked First, Cried Later', '100% confidence, 0% accuracy. That takes special talent honestly.'],
    ['Touchscreen Final Victim', 'Bro never glanced at the numbers, just threw hands at the glass.'],
    ['Rushed Into a Wall', 'Finished the whole round early just to get clowned by the board.'],
  ];

  var PERFECT = [
    ['Certified Tryhard', '100% clean run. Put the phone down, nobody is clapping for you.'],
    ['Human Calculator Mode', 'Flawless score. Your daily screen time is definitely 18 hours.'],
    ['Bro Thinks He Is Him', 'Perfect score on a troll game. Your ego will be unbearable today.'],
    ['Joki Ujian Suspect', 'Clean 100% run. Did someone tap the screen for you under the table?'],
    ['Too Smart for This Room', 'Zero wrong answers among clowns. You clearly joined the wrong lobby.'],
    ['Skripsi-Proof Brain', 'Every question nailed. This brain could finish chapter 4 in one night.'],
    ['Open Tab Allegedly', 'Flawless run. Your friends are checking your browser tabs right now.'],
    ['Sweat on the Glass', '100% on basic math. Go add this achievement to your CV.'],
    ['Dosen Favorite Student', 'Full marks. Enjoy the imaginary medal, nobody invites you to hang out.'],
  ];

  var WIN = [
    ['Champion of the Kos', 'First place. Your biggest trophy still fits on a boarding-house shelf.'],
    ['LinkedIn Achievement', 'You won a math sprint. Add it to your profile right now.'],
    ['Sweaty Fingers Trophy', 'First place. Go wash your hands, the screen is crying.'],
    ['No Tasks, Just Math', 'Nobody calculates that fast unless the calendar is empty and the bed is calling.'],
    ['Ego to the Moon', 'You won a meme math game. Your squad will never hear the end of it.'],
    ['Self-Crowned Genius', 'Trophy secured. Enjoy the fame until the rematch humbles you.'],
    ['Juara Tingkat RT', 'You beat 7 friends in 2-digit math. World tour when?'],
    ['Aura Farming Success', 'Top of the board. Bask in the glory before your luck runs out.'],
    ['Won on Pure Luck', 'Rank 1. You know half of those taps were blind panic.'],
    ['THR Came Early', 'First place feels like a bonus dropping a month early. Spend it wisely.'],
  ];

  var TIE = [
    ['Lost by One Blink', 'Same score, slower thumbs. Your fingers threw the bag.'],
    ['Forever Runner-Up', 'All the math right, lost the race. The pain is real.'],
    ['No Crown for Second', 'Tied on points, zero trophy. Nobody remembers second place.'],
    ['5G vs 3G Thumbs', 'Same answers, but their thumb had 5G reflexes and yours had 3G.'],
    ['One Tap From Glory', 'Matched the winner point for point, then lost on milliseconds. Tragic.'],
    ['Grandpa Reflexes', 'Same score, slower hands. Your fingers needed a warm-up round.'],
    ['Silver Without Shine', 'Equal brainpower, slower thumbs. Second place gets a sigh.'],
    ['Photo Finish Loser', 'The board needed a zoom lens to separate you two. It chose them.'],
  ];

  var BOTTOM = [
    ['Bottom Frag NPC', 'Dead last. If anyone asks, we do not know you.'],
    ['Squad Burden Season 2', 'Bro joined just to lower the room average. Mission accomplished.'],
    ['Brain Fried by FYP', 'Lost focus instantly. Need edits playing under the math problem?'],
    ['Certified L', 'Lowest score, slowest taps, zero aura. A complete disaster everywhere.'],
    ['Family Burden VIP', 'Bottom of the food chain. Your score killed the group appetite.'],
    ['Lobby Decoration', 'Dead last with zero resistance. You added comic relief and nothing else.'],
    ['Remedial Ambassador', 'Anchor of the board. Any lower and you fall off the screen.'],
    ['Es Teh Career Path', 'Math is not in your future. Time to open a roadside drink stall.'],
    ['Deny This Room', 'Last by a mile. If anyone asks, you were never here.'],
    ['Ghosted by Numbers', 'The math left you on read. Zero replies, zero points.'],
  ];

  var SLOW = [
    ['Warteg WiFi Speed', 'One question took 5 business days. Did the phone freeze or the brain?'],
    ['Paper Draft Needed', 'Bro needed notes on paper just to add two small numbers.'],
    ['Loading Bar Human', 'Good accuracy, but your squad graduated while waiting.'],
    ['Asleep Mid Question', 'We ordered coffee and finished gorengan before you tapped.'],
    ['Waiting for THR', 'Still on question 3 while the squad already went home to sleep.'],
    ['Charging Brain 1%', 'So slow we thought your data package ran out mid-round.'],
    ['Manual Transmission Mind', 'We watched your brain crank the lever for a single digit.'],
    ['Snail With Brakes', 'High precision, glacial pace. We boiled noodles while waiting.'],
    ['Stone Age Processor', 'Did each equation need approval from the neighborhood chief first?'],
  ];

  var MID = [
    ['Side Character Energy', 'Dead center of the board. Zero threat, perfectly forgettable.'],
    ['Background Extra', 'Not good enough to flex, not bad enough to roast. Just there.'],
    ['Paid Audience', 'Technically played, but nobody noticed you were in the room.'],
    ['KKM Survivor', 'Scored exactly enough to pass and not a point more. Efficient, honestly.'],
    ['SBL: Santai Banget Loh', 'Middle of the pack forever. Zero ambition, zero stress, zero memories.'],
    ['Ordinary Citizen', 'Right down the middle. No highlights, no roasts, pure neutral noise.'],
    ['Comfortably Third', 'Sitting where nobody expects anything from you anyway.'],
    ['Ghosted the Board', 'Not high enough to celebrate, not low enough to cry. Forgettable run.'],
    ['Took the Middle Road', 'You did not win, you did not embarrass yourself. You just existed.'],
    ['Threat to Nobody', 'Zero danger to the leaders, zero sympathy for last place. Just floating.'],
  ];

  var FALLBACK = [
    ['Error 404 Brain', 'The system cannot rank that mess. Restart the game.'],
    ['Mystery Flop', 'Your stats make no sense. Replay and pretend this never happened.'],
    ['Confused Server', 'Your match data is so weird the game logic gave up categorizing it.'],
    ['Space Anomaly', 'The numbers came back scrambled. Restart and wipe the slate.'],
    ['Short Circuit', 'Something broke between your finger and the score. Take the mulligan.'],
    ['Affiliate Link Brain', 'Your answers got stuck at checkout. Complete the purchase and retry.'],
    ['Unsolved Mystery', 'Nobody knows what happened that round. Wash your hands and retry.'],
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
    // Same score, slower time - at any depth, not just head-to-head.
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
  // every client computes the same line from the shared roster - no messages.
  function pick(stat) {
    var list = bracket(stat);
    var entry = list[hashId(stat && stat.id) % list.length];
    return { title: entry[0], line: entry[1] };
  }

  // Results header. A tie is ONLY the exact same score AND the exact same
  // time - same score with a slower time is a clean loss, any rank.
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
      ? (winners.length > 1 ? 'Exact tie: same score, same time' : 'Most correct wins · ties: accuracy, then time')
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
