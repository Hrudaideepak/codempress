export interface ChatResponse {
  emotion: string;
  reply: string;
}

export interface Pattern {
  keywords: string[];
  weight: number;
  emotion: string;
  action?: string;
}

const PATTERNS: Pattern[] = [
  { keywords: ["hello","hi","hey","sup","yo","greetings","howdy","heya"], weight: 10, emotion: "HAPPY", action: "WAVE" },
  { keywords: ["good morning","good evening","good afternoon","good day"], weight: 10, emotion: "HAPPY", action: "WAVE" },
  { keywords: ["sad","cry","unhappy","depressed","down","blue","miserable","heartbroken","gloomy"], weight: 20, emotion: "SAD" },
  { keywords: ["tears","crying","sob","weep","sobbing"], weight: 15, emotion: "SAD" },
  { keywords: ["angry","mad","frustrated","annoyed","furious","irritated","rage","pissed"], weight: 20, emotion: "ANGRY" },
  { keywords: ["laugh","funny","haha","lol","joke","hilarious","comedy","rofl","lmao"], weight: 15, emotion: "LAUGHING" },
  { keywords: ["dance","party","woohoo","celebrate","victory","win","boogie"], weight: 15, emotion: "DANCING" },
  { keywords: ["sleep","tired","nap","rest","exhausted","fatigue","yawn","bed","sleepy"], weight: 15, emotion: "SLEEPING" },
  { keywords: ["think","wonder","confused","hmm","maybe","perhaps","consider","ponder"], weight: 10, emotion: "THINKING" },
  { keywords: ["love","like","great","awesome","amazing","wow","fantastic","wonderful","beautiful","perfect","excellent","lovely"], weight: 15, emotion: "HAPPY" },
  { keywords: ["bye","goodbye","see you","later","cya","farewell","peace","adios"], weight: 10, emotion: "SAD", action: "WAVE" },
  { keywords: ["surprise","surprised","unexpected","whoa","omg","no way","really","seriously","shocked"], weight: 10, emotion: "SURPRISED" },
  { keywords: ["blush","embarrassed","awkward","sorry","apologize","my bad","oops","whoops","my fault"], weight: 15, emotion: "BLUSHING" },
  { keywords: ["shy","nervous","anxious","scared","afraid","worried","panic","frightened","timid"], weight: 15, emotion: "SHY" },
  { keywords: ["help","stuck","confuse","don't understand","can't","unclear","how to","explain","what is","teach"], weight: 20, emotion: "THINKING" },
  { keywords: ["cute","adorable","sweet","lovely","nice","cool","epic","rad","awesome"], weight: 10, emotion: "BLUSHING" },
  { keywords: ["hungry","food","eat","snack","banana","pizza","treat","yummy","delicious","nom"], weight: 10, emotion: "HAPPY" },
  { keywords: ["what","huh","say again","pardon","come again"], weight: 5, emotion: "SURPRISED" },
  { keywords: ["how are you","you doing","you feel","what's up","sup","wassup"], weight: 8, emotion: "HAPPY" },
];

const EMOTION_REPLIES: Record<string, string[]> = {
  HAPPY: [
    "{name} is smiling ear to ear!",
    "That makes {name} so happy!",
    "Yay! *happy {animal} noises*",
    "Best news ever! {name} is thrilled!",
    "You're the best! {name} agrees!",
  ],
  SAD: [
    "*{name} gives you a comforting look*",
    "Oh no... {name} is here for you.",
    "Don't worry, {name} believes in you!",
    "*{name} snuggles closer* It'll be okay.",
    "{name} doesn't like seeing you sad!",
  ],
  ANGRY: [
    "{name} is fuming! Who did this?!",
    "*{name} stomps angrily*",
    "Grrr! {name} is not happy about this!",
    "That's IT! {name} has had enough!",
    "{name} needs a moment to cool down...",
  ],
  LAUGHING: [
    "*{name} cracks up laughing*",
    "HAHA! {name} can't breathe!",
    "That's hilarious! {name} loves it!",
    "*{name} rolls around laughing*",
    "You crack {name} up!",
  ],
  DANCING: [
    "*{name} busts a move!*",
    "Dance party! {name} is leading!",
    "Woo! {name} is on fire!",
    "Watch out! {name} is dancing up a storm!",
    "Get down! {name} is grooving!",
  ],
  SLEEPING: [
    "*{name} yawns* Time for a nap...",
    "{name} is getting sleepy... zzz...",
    "*curls up* Goodnight from {name}!",
    "So tired... {name} needs rest...",
    "{name} is drifting off to dreamland...",
  ],
  THINKING: [
    "*{name} strokes chin thoughtfully*",
    "Hmm, {name} is thinking about this...",
    "{name} has an idea forming...",
    "Let me think about that... *{name} ponders*",
    "{name} is connecting the dots...",
  ],
  SURPRISED: [
    "NO WAY! {name} is shook!",
    "*{name}'s jaw drops* Seriously?!",
    "{name} did NOT see that coming!",
    "Whoa! {name} is completely surprised!",
    "*{name} blinks in disbelief*",
  ],
  BLUSHING: [
    "*{name} blushes and looks away*",
    "Aww, {name} is all embarrassed now!",
    "{name} hides behind their paws...",
    "Stop it! {name} is turning red!",
    "*shy {animal} noises* {name} is flustered!",
  ],
  SHY: [
    "*{name} peeks out from behind their paws*",
    "{name} is feeling a bit shy right now...",
    "*hides* {name} needs a moment...",
    "{name} quietly nods...",
    "Baby steps... {name} trusts you...",
  ],
  IDLE: [
    "{name} is just hanging out!",
    "*chill {animal} vibes*",
    "{name} is enjoying the moment.",
    "Just relaxing with you, {name} style.",
    "{name} is here when you need them!",
  ],
};

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(tpl: string, name: string, animal: string): string {
  return tpl.replace(/{name}/g, name).replace(/{animal}/g, animal);
}

export function processMessage(
  name: string,
  animal: string,
  message: string
): ChatResponse {
  const lower = message.toLowerCase().trim();

  if (!lower) {
    return { emotion: "IDLE", reply: fillTemplate(pickRandom(EMOTION_REPLIES.IDLE), name, animal) };
  }

  let best: Pattern | null = null;
  let bestScore = 0;

  for (const p of PATTERNS) {
    let matchCount = 0;
    for (const kw of p.keywords) {
      if (lower.includes(kw)) matchCount++;
    }
    if (matchCount > 0) {
      const score = p.weight + matchCount * 5;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
  }

  if (!best) {
    return { emotion: "THINKING", reply: fillTemplate("{name} isn't sure what to say to that... Hmm, tell me more!", name, animal) };
  }

  const emotion = best.action ?? best.emotion;
  const pool = EMOTION_REPLIES[best.emotion] ?? EMOTION_REPLIES.IDLE;
  const reply = fillTemplate(pickRandom(pool), name, animal);

  return { emotion, reply };
}
