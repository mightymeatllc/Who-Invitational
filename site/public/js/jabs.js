/*
 * THE WHO? INVITATIONAL OPEN — the jabs.
 *
 * Roast copy only, keyed to roster.json by player name. There is no dedicated
 * roast page; this material is dealt out across the site so that every table,
 * every cart row and every duel has a knife in it somewhere.
 *
 * Where each field surfaces:
 *   tag    → the epithet under a man's name on the Teams roster
 *   line   → his one-liner on the Teams roster
 *   drop   → what the scoreboard says about him when he is the dropped score
 *   CARTS  → one line per cart on the Event page
 *   DUELS  → one line per duel on the Duel Card
 */

export const PLAYERS = {
  Jipp: {
    tag: 'The Liability',
    line: 'Lowest index in the field and the highest risk on the property. A 3 handicap and a three-drink limit nobody has ever enforced.',
    drop: 'The best golfer on this team contributed nothing. Somewhere around the eleventh beer, a 3 handicap became a rounding error.'
  },
  Adam: {
    tag: 'The Little Brother',
    line: 'Toe’s little brother. Put on the opposite team as a public safety measure, then invited to a party at Toe’s house.',
    drop: 'Threw away eighteen holes and still has the pool party to lose. His brother will bring this up tonight, in front of everyone, with a drink in his hand.'
  },
  Neels: {
    tag: 'The Arithmetic',
    line: 'Thirty-nine, dating someone twenty-two. Or twenty-three. Nobody is sure, possibly including Neels.',
    drop: 'Played eighteen holes for no reason. His playing handicap is 13, which is still the second-youngest number he will mention today.'
  },
  Pat: {
    tag: 'The Curse',
    line: 'It is always the world versus Pat — sick kids, corporate malfeasance, and an AT&T campaign now in its third fiscal year.',
    drop: 'Of course it was Pat. Nobody on this team is surprised, least of all Pat, who saw it coming from the first tee.'
  },
  Dan: {
    tag: 'The Pharmacy',
    line: 'Cocaine, mushrooms, whatever the parking lot produced by 8:40. Says nine words a round and one of them is the funniest thing all day.',
    drop: 'His round has been thrown away, which he will take better than anyone here. He may not be entirely certain it happened.'
  },
  Landon: {
    tag: 'The Simulator',
    line: 'Has a golf simulator in his garage, turned in a 25, and claims he never plays. The case against him is circumstantial and damning.',
    drop: 'A simulator in the garage, a committee 23, and the worst score on the team. One of those three things is a lie and this page has an opinion about which.'
  },
  String: {
    tag: 'The Loophole',
    line: 'Cheats at everything. Read the rules page looking for exploits and asked, in writing, how to reach the triple-bogey cap on purpose.',
    drop: 'He asked how the drop score worked before the round. He has found out. Working the angles for eighteen holes and the angles won.'
  },
  Terb: {
    tag: 'The Monument',
    line: 'Six foot ten. The largest object on the property that is not a tree, and the only one that cannot judge distance.',
    drop: 'Aimed approximately, for eighteen holes, from a great height. Nothing came of it.'
  },

  Joe: {
    tag: 'The Member',
    line: 'Nine children and a country club membership, and he still finds hours for his swing. That settles which one has his attention.',
    drop: 'The only man here who will be genuinely upset about this, which is precisely why it is in large type. He will explain what went wrong. At length.'
  },
  Tito: {
    tag: 'The Protocol',
    line: 'Drinks vodka like water. Past a certain hour the group assigns him a chaperone. This is a standing arrangement with a rotation.',
    drop: 'Eighteen holes, no contribution, and a chaperone who watched all of it happen and said nothing.'
  },
  Meat: {
    tag: 'The Architect',
    line: 'Fat, bald, and the author of the spreadsheet, the handicap system and this website. More hours on the tournament than in it.',
    drop: 'He built this scoreboard. He wrote the words "contributed nothing." He is now reading them about himself, on his own website, in a font he chose.'
  },
  Ron: {
    tag: 'The Petitioner',
    line: 'At war with a swimming pool for years. Has been trying to out-Jew Latex for a membership he does not have since the day he first heard about it.',
    drop: 'Spent the round litigating a swim club membership and posted the worst number on the team. Latex will mention both tonight, at the pool, unprompted.'
  },
  Latex: {
    tag: 'The Membership',
    line: 'Belongs to an exclusive Jewish swim club and has never let a round pass without saying so. Raises it first, every time, usually before the third tee.',
    drop: 'An accredited swim club and an unaccredited golf score. He will explain that the club has a much better course, which it does not have at all.'
  },
  Toe: {
    tag: 'The Host',
    line: 'A divorce lawyer who has never been married. Solves everything with money, cooks nothing, and moved his index 20 to 23 with no explanation offered.',
    drop: 'Hosts the party, drops the score. He will pay for something expensive tonight and expect that to settle it, which — depressingly — it will.'
  },
  Hulk: {
    tag: 'The Alleged Attendee',
    line: 'The reason the group is called Who? Speaks, and the conversation carries on over the top of him. His favourite sport is soccer.',
    drop: 'Nobody will remember that he was dropped. Nobody will remember that he played. This line is the only record that he was here.'
  },
  Rat: {
    tag: 'The Unspecified',
    line: 'The quirkiest man in the field. Everyone has seen something; nobody will say what, and the refusal is unanimous.',
    drop: 'Contributed nothing, in a manner nobody wants to describe.'
  }

  /*
   * MILO — ships commented out. See _pending.milo in data/roster.json.
   * Milo and Adam are mutually exclusive; the field is 16 either way.
   * If the knee goes the other way, uncomment this and swap the Adam record in
   * data/roster.json — every page follows.
   *
   * ,Milo: {
   *   tag: 'The Knee',
   *   line: 'Spent the entire build listed as questionable, which got him a committee 25 with no round on record to argue with it.',
   *   drop: 'A man who got a 23 handicap out of a knee surgery and still finished last. That took real commitment.'
   * }
   */
};

/* Event page — one line per cart. Sixteen men, eight jabs, no survivors. */
export const CARTS = {
  1: 'The scratch player and the little brother. One of them will be driving by the twelfth and it will not be the one with the licence to lose.',
  2: 'The man who takes this too seriously, riding with the man who requires a chaperone. Neither has been told which role he is filling.',
  3: 'The pharmacy and the organiser. Meat gets four hours to explain the handicap system to a man watching the fairway breathe.',
  4: 'The host and the arithmetic. Two men who will each raise their favourite subject on the first tee and never once change it.',
  5: 'Latex and Ron. Four hours, one swim club, no possibility of a new topic. Committee sends its condolences to the group behind.',
  6: 'The simulator and the rain cloud. Landon will play beautifully and Pat will watch something go wrong that has never gone wrong before.',
  7: 'Six foot ten and the man looking for the loophole. Terb cannot see where it went and String will tell him it was in the fairway.',
  8: 'The scramble pair nobody can describe and nobody can remember. They are riding together because it seemed safest.'
};

/* Duel Card — one line per duel. */
export const DUELS = {
  1: 'The best player in the field gives four to a man with nine children and a real membership. Jipp will still find a way, somewhere around the eleventh beer.',
  2: 'Dead even at scratch: the little brother against the man with a chaperone. First one to remember he is playing golf wins.',
  3: 'Neels gets one from the man who built the system that gave it to him. Meat has already checked the arithmetic twice.',
  4: 'Pat gets a stroke and will still be the unluckiest man on the property by the fourth. Ron will spend the round talking about a pool.',
  5: 'Dan gives one to Latex. One of them may not be entirely present; the other will be describing his swim club to a man who is not listening.',
  6: 'The most honest matchup on the card: a committee 23 with a simulator in his garage against a man whose index moved three strokes last month with no explanation. Two alleged sandbaggers, pointed directly at each other.',
  7: 'Four men, two balls, one duel, and dead even at 12 apiece. The committee gave them the same number specifically so that nobody could complain, and they will.'
};

export default PLAYERS;
