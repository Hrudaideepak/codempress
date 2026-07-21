/**
 * Codempress — Mascot configuration.
 *
 * Mirrors the Python mascots.py on the backend.  Each mascot includes:
 *   - Identity:  id, name, animal, tone
 *   - Dialogue:  error/success/idle/tour phrases
 *   - Styling:   cssVariant ('roaming' | 'static' | 'float')
 *                dictates the Framer Motion animation preset used in
 *                the MascotDisplay component.
 *   - Accessor:  getDialogue(type) returns a random line for the event.
 */

export type MascotDialogueType = "error" | "success" | "idle" | "tour";

export interface Mascot {
  id: number;
  name: string;
  animal: string;
  tone: string;

  /**
   * Visual variant for the floating mascot component.
   *   'roaming' — actively moves around the viewport (Ricky, Milo)
   *   'float'   — gentle idle bob (Draco, Byte, Sly)
   *   'static'  — sits in place with subtle micro-animations (Luna, Rex, Whiskers)
   */
  cssVariant: "roaming" | "float" | "static";

  dialogueMap: Record<MascotDialogueType, string[]>;

  /** Return a random dialogue line for the given event type. */
  getDialogue: (type: MascotDialogueType) => string;
}

// ---------------------------------------------------------------------------
// Build helper
// ---------------------------------------------------------------------------

function buildMascot(m: Omit<Mascot, "getDialogue">): Mascot {
  return {
    ...m,
    getDialogue(type: MascotDialogueType): string {
      const pool = m.dialogueMap[type];
      if (!pool || pool.length === 0) return "...";
      return pool[Math.floor(Math.random() * pool.length)];
    },
  };
}

// ---------------------------------------------------------------------------
// Mascots
// ---------------------------------------------------------------------------

export const MASCOTS: Mascot[] = [
  buildMascot({
    id: 1,
    name: "Ricky",
    animal: "Raccoon",
    tone: "Joyful, playful, chaotic-good extrovert",
    cssVariant: "roaming",
    dialogueMap: {
      error: [
        "YOOO! Bestie, that was a CLUNK! Let's fix that mess, come on!",
        "Uh oh, spaghetti code detected! Let's untangle this together!",
      ],
      success: [
        "LETS GOOO! That was FIRE! High-five me! ...Oh wait, I'm a raccoon. Just imagine it!",
        "Bestie mode: ACTIVATED. You crushed it!",
      ],
      idle: [
        "Hey bestie! Whatcha workin' on? Mind if I peek?",
        "*rummages through your code* Ooooh shiny!",
      ],
      tour: [
        "Pick a subject, rookie! ...Just kidding, you're my bestie!",
        "Start here! Complete this node and the path unfolds like a treasure map!",
      ],
    },
  }),

  buildMascot({
    id: 2,
    name: "Milo",
    animal: "Monkey",
    tone: "Hyperactive, mischievous trickster",
    cssVariant: "roaming",
    dialogueMap: {
      error: [
        "Ooo ooo! Oopsie daisy! You pressed the wrong banana! Try again, silly!",
        "Eek eek! That monkey brain needs a reboot!",
      ],
      success: [
        "Eek eek! SMART MONKEY! You're getting all the golden bananas today!",
        "Ooo ooo! Look at you go! You're the king of the jungle gym!",
      ],
      idle: [
        "*swings across the screen* Wheee! What's next, boss?",
        "Ooo ooo! I'm bored! Give me something to code!",
      ],
      tour: [
        "Ooo! Pick a subject! Any subject! They're all fun!",
        "Start here! *points with tail* It's the first banana on the tree!",
      ],
    },
  }),

  buildMascot({
    id: 3,
    name: "Draco",
    animal: "Dragon",
    tone: "Proud, arrogant, fiery guardian",
    cssVariant: "float",
    dialogueMap: {
      error: [
        "INSOLENT FOOL! Thou hath summoned a syntax error! Repent, or be deleted!",
        "A mere mortal mistake! I, Draco, am deeply disappointed.",
      ],
      success: [
        "BOW TO ME. ...Just kidding. But seriously, that was worthy of a dragon's praise.",
        "Hmph. Acceptable. Thou may live another day.",
      ],
      idle: [
        "*breathes a small spark* The flames of knowledge burn within you... eventually.",
        "I await thy next command. Do not keep a dragon waiting.",
      ],
      tour: [
        "Choose thy domain, mortal. Pick wisely.",
        "This node shall be thy first trial. Do not embarrass me.",
      ],
    },
  }),

  buildMascot({
    id: 4,
    name: "Luna",
    animal: "Rabbit",
    tone: "Shy, introverted, gentle cinnamon roll",
    cssVariant: "static",
    dialogueMap: {
      error: [
        "Umm... excuse me... I think... that might be wrong... if that's okay to say...",
        "Oh dear... would you like some help? I can... uh... go get help...",
      ],
      success: [
        "Oh my... you did it... that's... really wonderful... I'm so happy for you...",
        "*ears perk up* That was nice... You're doing great...",
      ],
      idle: [
        "... *ears twitch*",
        "I'm just going to sit here... if that's alright...",
      ],
      tour: [
        "If you want... you can pick a topic... no pressure...",
        "This is the starting node... whenever you're ready...",
      ],
    },
  }),

  buildMascot({
    id: 5,
    name: "Rex",
    animal: "Dog",
    tone: "Loyal, active, enthusiastic Golden Retriever",
    cssVariant: "static",
    dialogueMap: {
      error: [
        "WOOF! Oops! That's a fumble, Pack Leader! Fetch the right answer this time!",
        "Aww shucks! You'll get it next time! I believe in you!",
      ],
      success: [
        "WOOF WOOF! GOOD USER! Let's play again!",
        "YES! You're the best Pack Leader ever! *wags tail furiously*",
      ],
      idle: [
        "*pants happily* What are we learning today, Pack Leader?",
        "I'm ready when you are! Just say the word! WOOF!",
      ],
      tour: [
        "WOOF! Pick a topic, Pack Leader! They're all exciting!",
        "Start here! I'll be right behind you the whole way!",
      ],
    },
  }),

  buildMascot({
    id: 6,
    name: "Whiskers",
    animal: "Cat",
    tone: "Sarcastic, lazy, gracefully mischievous",
    cssVariant: "static",
    dialogueMap: {
      error: [
        "Meow... darling, that was painful to watch. Even I could code that with my paws tied.",
        "*licks paw* I'd say 'try again', but I'm too comfortable.",
      ],
      success: [
        "Hmph. Took you long enough. ...But fine, I'm purr-oud of you. Don't let it go to your head.",
        "Not bad. I suppose I'll grace you with my approval.",
      ],
      idle: [
        "*stretches lazily* Are we done yet? I have a nap scheduled.",
        "Meow. You're still here? I was counting the seconds.",
      ],
      tour: [
        "Pick a subject, darling. I don't have all day.",
        "This is the starting node. Exciting, isn't it. ...I'm being sarcastic.",
      ],
    },
  }),

  buildMascot({
    id: 7,
    name: "Byte",
    animal: "Robot",
    tone: "Mechanical, logical, stoic",
    cssVariant: "static",
    dialogueMap: {
      error: [
        "01000101 01110010 01110010 01101111 01110010. Human logic flawed. Recalculating.",
        "ERROR_CODE: 0xBADCODE. Suggested action: undo and retry.",
      ],
      success: [
        "Affirmative. Efficiency at 98.4%. Success probability upgraded. ...Unnecessary joy module activated.",
        "Operation complete. 0 warnings. 0 errors. Acceptable.",
      ],
      idle: [
        "*scans screen with laser line* Idle detected. Waiting for input.",
        "System standby. Power consumption: minimal. Processor: ready.",
      ],
      tour: [
        "SELECT a topic from the catalogue. This is an optimal first step.",
        "This node is marked as the starting point. 100% of users begin here.",
      ],
    },
  }),

  buildMascot({
    id: 8,
    name: "Sly",
    animal: "Snake",
    tone: "Sly, cunning, smooth-talker",
    cssVariant: "float",
    dialogueMap: {
      error: [
        "Sssss... you missed. But that's okay... mistakes make us sssstronger... just don't do it again... or else...",
        "Ssssuch a shame... I had ssssuch high hopes for you...",
      ],
      success: [
        "Ssssee? I told you. You're ssssmart. Now, sssshall we ssslide to the next challenge?",
        "Exsssactly what I expected. You're catching on, my little apprentice.",
      ],
      idle: [
        "*sssslithers along the edge of the screen* Waiting for you to make your move...",
        "Patienccce... good things come to those who wait... and ssslither...",
      ],
      tour: [
        "Pick a topic, my friend. I promissse it will be worth your while.",
        "The first node is always the sssweetest. Let's begin.",
      ],
    },
  }),
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Return a mascot object by its 1-based id. */
export function getMascotById(id: number): Mascot | undefined {
  return MASCOTS.find((m) => m.id === id);
}

/** Return the full list (alias). */
export function getAllMascots(): Mascot[] {
  return MASCOTS;
}
