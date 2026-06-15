import type { TipCategory } from './tips-content'

export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
}

// ── CATEGORY QUIZZES ───────────────────────────────────────────────────────
// Unlocked once a player has read every article in that category.
export const CATEGORY_QUIZZES: Record<TipCategory, QuizQuestion[]> = {
  fundamentals: [
    {
      question: 'When setting up your stance, your back foot, hips and shoulder should line up with...',
      options: ['The rail behind you', 'The shot line — cue ball through object ball to pocket', "Your opponent's position", 'The center of the table'],
      correctIndex: 1,
    },
    {
      question: "What's the main danger of gripping the cue too tightly?",
      options: ['It makes the cue too heavy to swing', 'Tension causes the cue to wobble off line', 'It shortens your bridge', 'It speeds up your stroke too much'],
      correctIndex: 1,
    },
    {
      question: "What is the bridge hand's primary job?",
      options: ['To add power to the stroke', 'To hold the cue ball in place', 'To create a stable, straight channel for the cue to slide through', 'To measure distance to the object ball'],
      correctIndex: 2,
    },
    {
      question: 'In a smooth stroke, what should happen at the very back of your backswing?',
      options: ['A complete pause before delivering forward', 'An immediate snap forward', 'A second backswing', 'A grip tightening'],
      correctIndex: 0,
    },
    {
      question: 'A common beginner mistake is stopping the cue right at the cue ball. What does this cause?',
      options: ['Better accuracy on cuts', 'Inconsistent power and spin', 'A faster cue ball', 'Less squirt'],
      correctIndex: 1,
    },
  ],
  aiming: [
    {
      question: 'In the ghost ball method, where do you aim your cue ball?',
      options: ['Directly at the center of the object ball', 'At the pocket itself', 'At the spot where an imaginary ball would need to sit to send the object ball to the pocket', 'Behind the object ball'],
      correctIndex: 2,
    },
    {
      question: "In fractional aiming, a 'half ball' hit sends the object ball off at roughly what angle?",
      options: ['0° (straight ahead)', '30°', '49°', '90°'],
      correctIndex: 1,
    },
    {
      question: 'On a very thin cut, where should you aim your cue ball path?',
      options: ['At the center of the object ball', 'Toward the edge of the object ball, near the ghost ball position', 'At the rail behind the object ball', 'With heavy side spin for extra control'],
      correctIndex: 1,
    },
    {
      question: 'Why are combination shots risky?',
      options: ['They use too much chalk', 'Every extra ball in the chain multiplies your aiming error', 'They always require a kick shot', 'They are illegal in most rule sets'],
      correctIndex: 1,
    },
    {
      question: 'What should you do after getting down on the shot, before your final stroke?',
      options: ['Stand up and re-rack', 'Take at least one more full look from cue ball to target and back', 'Switch your grip hand', 'Add extra side spin for safety'],
      correctIndex: 1,
    },
  ],
  position: [
    {
      question: 'A stun shot is struck...',
      options: ['Above center with a soft stroke', 'At (or very near) center with a firm, accelerating stroke', 'Below center with side spin', 'On the rail'],
      correctIndex: 1,
    },
    {
      question: 'A follow shot is created by striking the cue ball...',
      options: ['Below center', 'Above center, giving top spin', 'On the far left edge', 'With an elevated cue'],
      correctIndex: 1,
    },
    {
      question: "What's a common mistake when trying to draw the cue ball more?",
      options: ['Hitting too low and too hard at the same time, risking a miscue', 'Hitting too high', 'Using too much chalk', 'Standing too far from the table'],
      correctIndex: 0,
    },
    {
      question: "With a stun (center-ball) hit, the cue ball's 'natural' path after contact is roughly...",
      options: ["Parallel to the object ball's path", "90° from the object ball's direction of travel", 'Straight back toward the shooter', 'Random, depending on speed'],
      correctIndex: 1,
    },
    {
      question: "Why is it better to aim for a 'zone' rather than a single perfect spot for position?",
      options: ['Zones are easier to mark with chalk', 'A whole area often gives an equally easy next shot, and aiming for a zone keeps you relaxed', 'Zones guarantee a pot every time', 'It only matters on the break'],
      correctIndex: 1,
    },
  ],
  spin: [
    {
      question: "On the cue ball's 3x3 grid, what does the column (left/center/right) control?",
      options: ['Follow vs draw', 'Speed', 'Left/right English (sidespin)', 'Cut angle'],
      correctIndex: 2,
    },
    {
      question: 'When you apply side spin, the cue ball initially squirts...',
      options: ['In the same direction as the English', 'In the opposite direction of the English applied', 'Straight up', 'Backward toward the shooter'],
      correctIndex: 1,
    },
    {
      question: 'Swerve is most pronounced when you...',
      options: ['Use a firm, level stroke with no English', 'Elevate the cue, add side spin, and stroke softly', 'Hit dead center as hard as possible', 'Use a jump cue'],
      correctIndex: 1,
    },
    {
      question: "What's the recommended approach to using English?",
      options: ['Use it on every shot for consistency', "Only use it when a center-ball or vertical-spin shot can't do the job", 'Use it only on the break', 'Avoid it completely, always'],
      correctIndex: 1,
    },
    {
      question: 'Massé and jump shots should generally be treated as...',
      options: ['Your first choice on any tough shot', 'Rescue tools for genuinely blocked situations, used as a last resort', 'Required on every break', 'Safer than a simple stun shot'],
      correctIndex: 1,
    },
  ],
  safety: [
    {
      question: "What's the clearest signal that you should play a safety?",
      options: ["You're already winning by a lot", "You genuinely can't picture clearing the table from this layout", 'Your opponent suggests it', "It's the first shot of the rack"],
      correctIndex: 1,
    },
    {
      question: 'Why is freezing the cue ball to a rail effective as a safety?',
      options: ['It makes the cue ball heavier', "It removes roughly half of your opponent's possible shot angles", 'It guarantees a foul', 'It speeds up the next shot'],
      correctIndex: 1,
    },
    {
      question: 'A snooker forces your opponent into trouble because...',
      options: ['They have no direct path to any legal ball', 'They lose their turn automatically', 'The cue ball is removed from the table', 'It changes the rules of the game'],
      correctIndex: 0,
    },
    {
      question: 'When snookered, what should you check for first?',
      options: ['A massé shot', 'A kick shot off one or more rails', 'Conceding the game', 'A break shot'],
      correctIndex: 1,
    },
    {
      question: "The 'two-way shot' mindset asks which question before every shot?",
      options: ['How hard can I hit this?', 'If this misses, is my opponent still in trouble?', 'Should I skip my turn?', "What's the score?"],
      correctIndex: 1,
    },
  ],
  break: [
    {
      question: 'The single biggest factor in a powerful, scattering break is...',
      options: ['Swinging as hard as physically possible', 'Hitting the head ball as fully and squarely as possible', 'Using maximum side spin', 'A very short backswing'],
      correctIndex: 1,
    },
    {
      question: 'Many strong breakers swing at roughly what percentage of their max power?',
      options: ['100%', 'Two-thirds (~2/3)', 'One-third', "It doesn't matter"],
      correctIndex: 1,
    },
    {
      question: 'Why does rack tightness matter so much?',
      options: ['Gaps between balls absorb energy and kill the spread', 'Loose racks make the break louder', 'It only affects the 8-ball', "Tight racks are required by the cue's warranty"],
      correctIndex: 0,
    },
    {
      question: "A 'soft' break differs from a hard break mainly in its...",
      options: ['Accuracy', "Speed — it's still a clean, full hit, just with less pace", 'Side spin', 'Cue ball placement on the head string'],
      correctIndex: 1,
    },
    {
      question: 'After a bad break, what should you do first?',
      options: ['Immediately fire at the hardest available ball', 'Take a full lap around the table before deciding on a shot', 'Concede the rack', 'Re-break immediately'],
      correctIndex: 1,
    },
  ],
  mental: [
    {
      question: 'Why is using the exact same pre-shot routine on easy AND hard shots valuable?',
      options: ['It wastes time intentionally', 'It gives your mind a familiar track to run on, reducing room for nerves', "It's required by the rules", 'It makes hard shots easier physically'],
      correctIndex: 1,
    },
    {
      question: 'After a miss, which kind of self-talk helps you most for the next shot?',
      options: ['Harsh criticism ("how did you miss that")', 'Specific, forward-looking feedback ("a little short — adjust the speed")', 'Ignoring the miss completely', 'Comparing yourself to a pro'],
      correctIndex: 1,
    },
    {
      question: "Once you've started your pre-shot routine, what should you be thinking about?",
      options: ['The current score', 'Only the shot in front of you — the cue ball, object ball, and the line between them', 'What your opponent thinks', 'Your overall win record'],
      correctIndex: 1,
    },
    {
      question: 'What helps players reset quickly after a miss?',
      options: ['Dwelling on the mistake for several shots', "A consistent physical action (like stepping back or chalking up) that signals 'that shot is over'", 'Changing your grip permanently', 'Skipping your routine on the next shot'],
      correctIndex: 1,
    },
    {
      question: 'Where does real, durable confidence come from?',
      options: ['Positive self-talk right before the shot, with no other basis', 'Having successfully done the shot many times before, especially in practice', 'Watching professional matches', "Your opponent's mistakes"],
      correctIndex: 1,
    },
  ],
  strategy: [
    {
      question: 'Stronger players plan ahead by...',
      options: ['Only thinking about the very next shot', 'Thinking about shot three while choosing shot one', 'Never planning, just reacting', 'Always shooting the closest ball first'],
      correctIndex: 1,
    },
    {
      question: 'Why should clusters be addressed early in a rack?',
      options: ['They become easier to break apart as the table empties', 'Early on you have more balls and angles to nudge them apart safely; late, options shrink', 'Clusters disappear on their own', 'They only matter on the break'],
      correctIndex: 1,
    },
    {
      question: "What's the value of a 15-second look around the whole table before your first shot?",
      options: ['It builds a mental map of easy/hard balls, clusters, and hidden opportunities like safeties', 'It lets your opponent relax', 'It is required to start the timer', 'It only helps with the break shot'],
      correctIndex: 0,
    },
    {
      question: "The 'mirror method' for bank shots involves...",
      options: ['Hitting the cue ball as hard as possible', 'Imagining a mirror-image pocket reflected across the rail and aiming the object ball at it', 'Always using side spin', 'Avoiding rails entirely'],
      correctIndex: 1,
    },
    {
      question: 'Two-rail and three-rail kick shots are best used as...',
      options: ['Primary scoring methods', 'Safety-escape tools, since precision drops with each extra rail', 'Break shots', 'Warm-up shots'],
      correctIndex: 1,
    },
  ],
}

// ── FINAL EXAM ─────────────────────────────────────────────────────────────
// Unlocked once a player has read all 51 articles.
export const FINAL_QUIZ: QuizQuestion[] = [
  {
    question: 'On your final look before the shot, where should your eyes come to rest?',
    options: ['On the cue ball', 'On the tip of the cue', 'On the target — the ghost ball spot or pocket', 'On your bridge hand'],
    correctIndex: 2,
  },
  {
    question: "What's the recommended way to start a warm-up routine?",
    options: ['Hardest shots first to test focus', 'Long, straight-in shots down the rail', 'Massé shots', 'Break shots'],
    correctIndex: 1,
  },
  {
    question: 'What is a sign that your dominant eye might be misaligned with your cue?',
    options: ['You always break well', 'Cuts to one side consistently feel more awkward than the other', 'Your bridge hand gets tired', 'You see two cue balls'],
    correctIndex: 1,
  },
  {
    question: 'The ghost ball method essentially asks you to imagine...',
    options: ['A second cue ball touching the object ball on the side away from the pocket', 'The object ball doubled in size', 'The pocket moved closer', 'A mirror image of the table'],
    correctIndex: 0,
  },
  {
    question: "What's the idea behind a personal 1-10 power scale?",
    options: ["Giving every shot a repeatable speed number instead of vague 'soft/medium/hard'", 'Counting how many rails the cue ball hits', 'Measuring how loud the break is', 'Ranking opponents by skill'],
    correctIndex: 0,
  },
  {
    question: 'A two-way shot is best described as...',
    options: ['A shot taken with two cues', 'A shot where, even if you miss the pot, the cue ball ends up giving your opponent trouble', 'A shot that pockets two balls at once', 'A shot only used on the break'],
    correctIndex: 1,
  },
  {
    question: "'Throw' refers to...",
    options: ['The cue ball bouncing off a rail', 'Friction nudging the object ball off-line when the cue ball has side spin, especially on slow shots', 'Throwing the cue at the table', 'The act of racking the balls'],
    correctIndex: 1,
  },
  {
    question: 'When combining top/bottom spin with side spin, what should you generally do with your speed?',
    options: ['Increase it significantly', 'Dial it back slightly, since combined spins amplify cue-ball movement and error', 'Ignore speed entirely', 'Always use maximum speed for combos'],
    correctIndex: 1,
  },
  {
    question: "A 'distance safety' relies mainly on...",
    options: ['Hiding the cue ball behind a blocker', "Sending the cue ball far away from your opponent's remaining balls, since long shots are riskier", 'Potting every ball on the table', 'Using heavy side spin'],
    correctIndex: 1,
  },
  {
    question: 'Most snookers happen as...',
    options: ['A separate maneuver requiring a special shot', 'A byproduct of a shot you were already taking, planned in advance', 'Pure luck, impossible to plan', 'Something only possible on the break'],
    correctIndex: 1,
  },
  {
    question: 'What does a square, full hit on the head ball primarily produce?',
    options: ['A weaker break overall', 'A powerful, scattering break', 'A guaranteed scratch', 'No effect on the rack'],
    correctIndex: 1,
  },
  {
    question: "Trading some raw power for accuracy on the break (the 'two-thirds rule') often results in...",
    options: ['Less rack action and a worse cue ball position', 'Just as much rack action, with a more useful cue ball', 'An automatic foul', 'A required re-rack'],
    correctIndex: 1,
  },
  {
    question: "What's the suggested habit for managing tension before a shot?",
    options: ['Holding your breath through the entire shot', 'One slow breath in through the nose, fully exhaled, before stepping up', 'Talking loudly to release stress', 'Skipping the warm-up'],
    correctIndex: 1,
  },
  {
    question: 'A good pre-shot routine should be...',
    options: ['Different for every shot depending on difficulty', 'The same steps, every time, on easy and hard shots alike', "Skipped on shots you're confident about", 'Only used in matches, never in practice'],
    correctIndex: 1,
  },
  {
    question: "Planning a runout 'backward' starts from...",
    options: ["The first ball you're about to shoot", 'The last ball (e.g. the 8 ball) and works toward the first shot', 'The break shot', "Your opponent's position"],
    correctIndex: 1,
  },
  {
    question: 'How can the Stats page help your game?',
    options: ['It has no real use beyond bragging rights', 'It reveals patterns like accuracy trends and error rates, pointing you toward what to practice', 'It only tracks wins, nothing else', 'It replaces the need for practice entirely'],
    correctIndex: 1,
  },
]
