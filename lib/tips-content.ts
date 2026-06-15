// Top Tips — a coaching "blog" distilled from classic billiards instruction
// (Dr. Dave Pool Info, PoolDawg Academy, Basic Billiards, and other long-running
// pool coaching resources). Rewritten in our own words for the Thonara League.

export type TipCategory =
  | 'fundamentals'
  | 'aiming'
  | 'position'
  | 'spin'
  | 'safety'
  | 'break'
  | 'mental'
  | 'strategy'

export type TipLevel = 'beginner' | 'intermediate' | 'advanced'

export type DiagramKey =
  | 'ghost-ball'
  | 'contact-zones'
  | 'draw-follow-stun'
  | 'curve-english'
  | 'natural-angle'
  | 'safety-rail'
  | 'break-setup'
  | 'pattern-runout'

export interface TipCategoryInfo {
  label: string
  icon: string
  color: string
  desc: string
}

export const TIP_CATEGORIES: Record<TipCategory, TipCategoryInfo> = {
  fundamentals: { label: 'Fundamentals',   icon: '🎯', color: '#f5c518', desc: 'Stance, grip, bridge & stroke' },
  aiming:       { label: 'Aiming',         icon: '👁️', color: '#60a5fa', desc: 'See the line, make the ball' },
  position:     { label: 'Position Play',  icon: '🧭', color: '#22c55e', desc: 'Control the cue ball after contact' },
  spin:         { label: 'Spin & English', icon: '🌀', color: '#f87171', desc: 'Curve, throw, squirt & swerve' },
  safety:       { label: 'Safety & Defense', icon: '🛡️', color: '#a855f7', desc: 'Win the game without the shot' },
  break:        { label: 'The Break',      icon: '💥', color: '#e8c547', desc: 'Start every rack with intent' },
  mental:       { label: 'Mental Game',    icon: '🧠', color: '#38bdf8', desc: 'Confidence, focus & routine' },
  strategy:     { label: 'Strategy',       icon: '🗺️', color: '#fb923c', desc: 'Plan the table like a pro' },
}

export const TIP_CATEGORY_ORDER: TipCategory[] = [
  'fundamentals', 'aiming', 'position', 'spin', 'safety', 'break', 'mental', 'strategy',
]

export const TIP_LEVEL_STYLES: Record<TipLevel, { label: string; color: string }> = {
  beginner:     { label: 'Beginner',     color: '#22c55e' },
  intermediate: { label: 'Intermediate', color: '#f5c518' },
  advanced:     { label: 'Advanced',     color: '#ef4444' },
}

export interface TipArticle {
  slug: string
  title: string
  category: TipCategory
  level: TipLevel
  readMin: number
  summary: string
  diagram?: DiagramKey
  body: string[]
  takeaway: string
}

// ── FUNDAMENTALS ──────────────────────────────────────────────────────────
export const FUNDAMENTALS_TIPS: TipArticle[] = [
  {
    slug: 'build-a-repeatable-stance',
    title: 'Build a Repeatable Stance',
    category: 'fundamentals',
    level: 'beginner',
    readMin: 3,
    summary: 'Your stance is the foundation everything else is built on — get it wrong and no amount of stroke can fix it.',
    body: [
      "Before you even think about the cue, get your feet right. Step into the shot along the line of the shot, not sideways — your back foot, hips and shoulder should all sit on (or close to) the line running from the cue ball through the object ball to the pocket.",
      "Keep your legs comfortable, not locked. A slight bend in the knees lets you settle into the same height every time, which is the whole point of a 'repeatable' stance — your eyes need to end up at the same spot relative to the cue every single shot.",
      "Lower into the shot in stages: feet first, then bend at the waist, then bring your head down over the cue last. Rushing straight down often drags your alignment off line without you noticing.",
    ],
    takeaway: 'A consistent stance is what makes a consistent stroke possible — set your feet on the shot line first, everything else follows.',
  },
  {
    slug: 'the-pendulum-grip',
    title: 'The Pendulum Grip',
    category: 'fundamentals',
    level: 'beginner',
    readMin: 3,
    summary: 'A loose, relaxed grip lets the cue swing like a pendulum — a tight fist is the #1 cause of crooked shots.',
    body: [
      "Hold the cue with your fingers, not your palm. For most people, the sweet spot is gripping about 4–6 inches from the butt end, where your forearm hangs roughly perpendicular to the cue when the tip is near the cue ball.",
      "The grip should be loose enough that if someone gently pulled the cue forward, it would slide through your fingers. Squeezing tighter doesn't add power — it adds tension, and tension is what causes the cue to wobble off line during the stroke.",
      "Think of your forearm as the pendulum and your elbow as the hinge. The grip hand's only job is to let that pendulum swing freely and bring the cue back to the same spot it started from.",
    ],
    takeaway: 'Loosen your grip until the cue could slide through your fingers — tension kills accuracy, not power.',
  },
  {
    slug: 'bridge-hand-unsung-hero',
    title: 'Your Bridge Hand: The Unsung Hero',
    category: 'fundamentals',
    level: 'beginner',
    readMin: 3,
    summary: 'The bridge hand barely gets mentioned, but a wobbly bridge ruins more shots than a bad stroke ever could.',
    body: [
      "Your bridge hand's job is simple: create a stable channel that lets the shaft slide back and forth in a perfectly straight line, with zero side-to-side play. If the channel moves, the cue moves with it — even if your stroke is perfect.",
      "For the standard open bridge, spread your fingers on the table for a wide, stable base, and form a 'V' with your thumb and the side of your index finger for the shaft to ride in. For a closed bridge (useful with more power), loop your index finger over the shaft for extra control.",
      "Get your bridge hand close enough to the cue ball — roughly 6–10 inches — so the tip travels a short, controlled distance to contact. A bridge that's too far away amplifies any small wobble into a big miss.",
    ],
    takeaway: 'A stable, close bridge is cheap insurance — it turns a shaky stroke into a straight one.',
  },
  {
    slug: 'anatomy-of-a-smooth-stroke',
    title: 'Anatomy of a Smooth Stroke',
    category: 'fundamentals',
    level: 'beginner',
    readMin: 4,
    summary: 'A great stroke isn\'t one motion — it\'s a rhythm: set, warm-up, pause, and release.',
    body: [
      "Most inconsistency doesn't come from a bad stroke — it comes from rushing the steps before it. A repeatable stroke follows a rhythm: settle into your final position, take a couple of slow warm-up strokes to confirm your line, pause completely still at the back of the stroke, then deliver.",
      "That pause matters more than players think. It's the moment your brain does a final check that everything is aligned before you commit. Skipping it is like releasing an arrow before you've finished aiming.",
      "On the forward stroke, accelerate smoothly through the cue ball rather than jabbing at it. The cue should feel like it's being released, not thrown — let the pendulum motion from your elbow do the work while your grip stays relaxed all the way through.",
    ],
    takeaway: 'Slow down the steps before the shot — the pause at the back of your stroke is where accuracy gets locked in.',
  },
  {
    slug: 'eye-pattern-and-alignment',
    title: 'Lining Up: Eye Pattern & Alignment',
    category: 'fundamentals',
    level: 'beginner',
    readMin: 3,
    summary: 'Where — and how — you look at the shot changes where the cue ends up pointing.',
    body: [
      "Once you're down on the shot, your eyes should move back and forth between the cue ball's contact point and the target — the ghost-ball spot on the object ball, or the pocket itself — checking the line two or three times before you commit.",
      "Many players have a dominant eye that subtly pulls their aim to one side without them realizing it. A simple test: get down on a straight-in shot, close one eye, then the other, and see which view matches what you saw with both eyes open. Knowing your dominant eye helps you understand why certain cuts consistently feel 'off'.",
      "On your final look, let your eyes settle on the target — not the cue ball — just before you pull the trigger. Staring at the object ball (or pocket) on the last glance helps your body deliver the cue to where your eyes are pointed.",
    ],
    takeaway: 'Finish your pre-shot glances on the target, not the cue ball — your body tends to go where your eyes last looked.',
  },
  {
    slug: 'follow-through-finishing-the-shot',
    title: 'Follow-Through: Finishing the Shot',
    category: 'fundamentals',
    level: 'beginner',
    readMin: 3,
    summary: 'What happens *after* you hit the ball matters just as much as the swing itself.',
    body: [
      "A common beginner habit is to stop the cue right at the cue ball, almost flinching away from contact. This shortens the stroke and makes both power and spin wildly inconsistent from shot to shot.",
      "Aim to let the tip travel several inches past where the cue ball used to be, keeping the cue level and on the same line it traveled on the way forward. A long, straight follow-through is what actually delivers spin cleanly — stopping short robs the ball of the spin you intended.",
      "A good check: stay down in your stance for a beat after the shot and watch the cue ball do its thing. If you're popping up before contact even happens, your follow-through (and your accuracy) is paying the price.",
    ],
    takeaway: 'Finish the stroke past the cue ball and stay down to watch it happen — popping up early sabotages both power and spin.',
  },
  {
    slug: 'warm-up-routine-before-you-play',
    title: 'Warm-Up Routine Before You Play',
    category: 'fundamentals',
    level: 'beginner',
    readMin: 2,
    summary: 'Five minutes of the right warm-up shots can save you a whole rack of cold misses.',
    body: [
      "Don't start your session with the hardest shot on the table. Begin with long, straight-in shots down the rail — they're the purest test of your stroke and stance, with no cut angle to mask a flaw.",
      "Next, run through a few stop shots and stun shots from short range. These build the feel for speed and tip contact that everything else is layered on top of.",
      "Finally, hit a handful of soft draw and follow shots. By the time you're three or four minutes in, your stance should feel automatic and your stroke should feel loose — exactly the state you want before the first real rack.",
    ],
    takeaway: 'Warm up with straight shots and basic stun/draw/follow before anything fancy — build feel before you build difficulty.',
  },
]

// ── AIMING ─────────────────────────────────────────────────────────────
export const AIMING_TIPS: TipArticle[] = [
  {
    slug: 'the-ghost-ball-method',
    title: 'The Ghost Ball Method, Explained',
    category: 'aiming',
    level: 'beginner',
    readMin: 4,
    summary: 'The classic aiming system: picture a second ball touching the object ball on the side away from the pocket.',
    diagram: 'ghost-ball',
    body: [
      "Ghost ball aiming starts with the pocket. Draw an imaginary line from the center of the pocket through the center of the object ball, and keep extending it the same distance again — that's where an imaginary 'ghost' cue ball would need to be to send the object ball into the pocket.",
      "Your job is then simple to describe (even if it takes practice to execute): aim your real cue ball at that ghost position. If the cue ball arrives where the ghost ball was, it will strike the object ball at the exact contact point needed to send it toward the pocket.",
      "The hard part is visualizing a ball that isn't there. A good trick is to look at the gap between the cue ball and object ball and imagine a ball-sized circle sitting flush against the object ball on the line you drew — then aim your actual cue ball to occupy that space at the moment of contact.",
    ],
    takeaway: 'Picture a ball-sized gap between the cue ball and the object ball on the pocket line — that gap is where your cue ball needs to arrive.',
  },
  {
    slug: 'fractional-aiming',
    title: 'Fractional Aiming: Quarters, Halves & Thirds',
    category: 'aiming',
    level: 'intermediate',
    readMin: 4,
    summary: 'A faster mental shortcut for cut shots — describe the shot as a fraction of the object ball.',
    body: [
      "Fractional aiming breaks a cut shot down by how much of the object ball your cue ball needs to overlap. A 'full ball' hit sends the object ball straight ahead. A 'half ball' hit — where the cue ball covers half the object ball at contact — sends it off at roughly a 30° angle. A 'quarter ball' hit is a much thinner cut, around a 49° angle.",
      "The appeal of fractions is speed: instead of constructing a whole imaginary ghost ball, you just estimate 'this looks like about a half-ball hit' and aim your cue ball's center at that overlap point on the object ball.",
      "Fractional aiming is approximate by nature — it's a starting point, not gospel. Use it to get your stance and stroke roughly on line quickly, then fine-tune with your final look before you shoot.",
    ],
    takeaway: 'Estimate the cut as a fraction (full, three-quarter, half, quarter) of the object ball — it gets you on line fast, then refine from there.',
  },
  {
    slug: 'finding-your-dominant-eye',
    title: 'Finding Your Dominant Eye',
    category: 'aiming',
    level: 'beginner',
    readMin: 2,
    summary: 'Two eyes, one cue — your brain has to pick one to trust, and knowing which one helps your alignment.',
    body: [
      "Make a small triangle with your thumbs and index fingers, hold it out at arm's length, and frame a distant object through it with both eyes open. Slowly bring your hands toward your face without moving them — the triangle will drift toward whichever eye is dominant.",
      "Most players naturally place their dominant eye directly over the cue, or very close to it, when they get down on a shot. If your stance puts your dominant eye well off the cue's centerline, you may be unconsciously compensating on every shot — which can show up as a consistent 'pull' on certain cuts.",
      "You don't need to overhaul your stance overnight. Just knowing your dominant eye gives you a diagnostic: if cuts to one side consistently feel more awkward than the other, your eye dominance and head position are worth a second look.",
    ],
    takeaway: 'Know your dominant eye — a consistent miss pattern to one side is often an alignment issue, not an aiming-system issue.',
  },
  {
    slug: 'aiming-thin-cuts-without-fear',
    title: 'Aiming Thin Cuts Without Fear',
    category: 'aiming',
    level: 'intermediate',
    readMin: 3,
    summary: 'Thin cuts feel impossible until you stop aiming at the ball and start aiming at the edge.',
    body: [
      "On a very thin cut, beginners instinctively aim toward the center of the object ball because that's where the eye is drawn — and then wonder why the cue ball clips it and barely deflects it. The fix is to consciously aim your cue ball's path toward the *edge* of the object ball, well outside where it looks like it should go.",
      "It helps to think of the ghost ball position rather than the object ball itself. On a thin cut, that ghost ball sits almost entirely off to one side of the object ball — your eyes need to get comfortable settling on a point that looks like 'empty space' next to the ball.",
      "Speed matters too: thinner cuts are more sensitive to deflection (squirt) if you're using any side spin. On tough thin cuts, favor a center-ball hit so the only variable left to manage is the angle itself.",
    ],
    takeaway: 'On thin cuts, aim at the empty space beside the object ball (the ghost ball position), not the ball itself — and keep the hit centered.',
  },
  {
    slug: 'reading-combination-shots',
    title: 'Reading Combination Shots',
    category: 'aiming',
    level: 'advanced',
    readMin: 4,
    summary: 'Combos multiply your margin for error — here\'s how to size up whether one is actually worth taking.',
    body: [
      "A combination shot chains the ghost-ball idea twice: first work out the ghost-ball position needed for the *second* ball to reach the pocket, then treat that ghost-ball spot as the 'pocket' for the *first* ball, and find the ghost-ball position the cue ball needs to hit.",
      "Every extra ball in the chain multiplies your aiming error. A combo where both balls are nearly in line with the pocket (a 'stack') is forgiving; a combo where the first ball has to deflect the second one at a sharp angle is brutally tight, even for pros.",
      "Before committing to a combo, ask: is there a safety here instead? A combo you make 1 time in 10 is rarely better than a solid safety you can play 9 times in 10 — unless it's a shot to win the game outright.",
    ],
    takeaway: 'Chain the ghost-ball method twice for combos, and weigh the (often low) odds against the safer alternative before pulling the trigger.',
  },
  {
    slug: 'why-pros-recheck-aim-twice',
    title: 'Why Pros Re-Check Their Aim Twice',
    category: 'aiming',
    level: 'beginner',
    readMin: 2,
    summary: 'The habit that separates careful players from streaky ones: looking again before you shoot.',
    body: [
      "Your first read of a shot is a hypothesis, not a fact. Lighting, your angle of approach to the table, and even fatigue can all subtly distort how a shot looks from a distance versus from down in your stance.",
      "After getting down on the shot, take at least one full look from cue ball to target and back before your final stroke. If something feels off on the second look, it's almost always worth standing up and resetting rather than trying to 'steer' the shot mid-stroke.",
      "This habit costs maybe two extra seconds per shot. Over a whole session, it quietly removes a huge chunk of careless misses — the ones where, afterward, you immediately know exactly what you got wrong.",
    ],
    takeaway: 'Always take a second look once you\'re down on the shot — a two-second recheck eliminates most "I knew better" misses.',
  },
]

// ── POSITION PLAY ─────────────────────────────────────────────────────
export const POSITION_TIPS: TipArticle[] = [
  {
    slug: 'the-stun-shot',
    title: "The Stun Shot: Pool's Most Useful Weapon",
    category: 'position',
    level: 'beginner',
    readMin: 3,
    summary: 'Hit the cue ball dead center with a crisp stroke and it stops dead on contact — predictable, repeatable, and everywhere.',
    diagram: 'draw-follow-stun',
    body: [
      "A stun shot is struck at (or very near) the cue ball's center, with a firm, accelerating stroke. On contact with the object ball, all of the cue ball's forward roll is converted into the collision, and it stops — or continues along a very predictable path determined purely by the cut angle.",
      "Because stun removes 'how much spin is left' from the equation, it's the most predictable of the basic shots. For straight-in shots, a pure stun stops the cue ball almost exactly where it made contact. For cut shots, stun sends the cue ball off at 90° to the object ball's direction — a hugely useful, repeatable reference point.",
      "Beginners often default to a soft, rolling stroke for everything because it feels 'safer'. Learning to trust a firm stun shot opens up a whole category of position play that rolling cue balls simply can't reach.",
    ],
    takeaway: 'A center-ball hit with a firm stroke stuns the cue ball — for cut shots, it sends the cue ball off at 90° to the object ball, a hugely reliable reference.',
  },
  {
    slug: 'mastering-the-follow-shot',
    title: 'Mastering the Follow Shot',
    category: 'position',
    level: 'beginner',
    readMin: 3,
    summary: 'Top spin sends the cue ball rolling through and past the object ball — your go-to for reaching position further down the table.',
    body: [
      "A follow shot is struck above center, giving the cue ball forward (top) spin. When it reaches the object ball, that spin keeps driving it forward past the contact point, continuing roughly along the same line the cue ball was already traveling.",
      "How far the cue ball follows depends on how high above center you strike it and how hard you hit — a firm stroke with a lot of top spin can send the cue ball a surprising distance forward, even on a near-straight shot.",
      "The most common mistake is over-elevating the cue to 'help' the spin take, which actually introduces unwanted swerve. Keep the cue level and let the height of your tip contact — not the angle of the cue — do the work.",
    ],
    takeaway: 'Strike above center with a level cue — the higher the contact point and firmer the stroke, the further the cue ball rolls forward after contact.',
  },
  {
    slug: 'mastering-the-draw-shot',
    title: 'Mastering the Draw Shot',
    category: 'position',
    level: 'intermediate',
    readMin: 3,
    summary: 'Bottom spin sends the cue ball back toward you after contact — essential for working back up the table.',
    body: [
      "A draw shot is struck below center. The backspin you put on the cue ball survives the collision with the object ball and pulls the cue ball back along (roughly) the line it came in on.",
      "The lower you strike below center and the smoother (but still accelerating) your stroke, the more the cue ball draws back. A common mistake is hitting too low and too hard at the same time — this risks a miscue (the tip sliding off the ball) rather than adding more draw.",
      "Distance matters: backspin 'wears off' the longer the cue ball travels before contact, so a draw shot from far away needs noticeably more spin (lower contact, firmer stroke) than the same draw from close range to get the same result.",
    ],
    takeaway: 'Strike below center with a smooth, accelerating stroke — and hit harder (not just lower) for draw shots from further away, since backspin fades with distance.',
  },
  {
    slug: 'speed-control-power-scale',
    title: 'Speed Control: Thinking in a Power Scale',
    category: 'position',
    level: 'intermediate',
    readMin: 3,
    summary: 'Give every stroke a number from 1–10 in your head — it turns "soft, medium, hard" into something you can actually repeat.',
    body: [
      "Most players think about speed in vague terms — soft, medium, hard — which makes it hard to calibrate. Instead, imagine a scale from 1 (the gentlest tap that still reaches the object ball) to 10 (your hardest controlled break-like stroke), and assign every shot a number on that scale before you get down.",
      "Practicing long, straight shots at each speed — say, 2, 4, 6, and 8 — and watching how far the cue ball travels after a stun hit builds an internal map. Over time, 'I need about a 5 to get two diamonds of roll' becomes second nature.",
      "Speed control is also about consistency of stroke length and acceleration, not just how 'hard' you swing. The same backswing length, struck smoothly every time, is what makes a given number on your scale actually repeatable.",
    ],
    takeaway: 'Give shots a number on a personal 1–10 power scale and practice it on straight shots — vague "soft/medium/hard" can\'t be repeated, a calibrated scale can.',
  },
  {
    slug: 'natural-angles-let-physics-help',
    title: 'Natural Angles: Let Physics Do the Work',
    category: 'position',
    level: 'intermediate',
    readMin: 3,
    diagram: 'natural-angle',
    summary: 'The cue ball wants to go somewhere after contact, even with zero spin — learn to use that "free" path.',
    body: [
      "Every cut shot has a 'natural' path the cue ball will take with a stun (center-ball) hit: roughly 90° away from the object ball's direction of travel. This natural path is essentially free — you don't need any spin or special speed to get it, just a clean stun.",
      "Good position players look for shots where that natural 90° path already points toward where they want to go next. When it does, the shot becomes simple: stun it, and the cue ball arrives close to ideal position with almost no risk.",
      "When the natural angle *doesn't* line up with where you need to be, that's when you reach for follow, draw, or English — but always check the natural path first. It's the lowest-risk option, and often it's closer to what you need than it first appears.",
    ],
    takeaway: 'Before adding spin, check where a plain stun shot naturally sends the cue ball (≈90° off the object ball\'s path) — it\'s often closer to your next position than you think.',
  },
  {
    slug: 'the-two-way-shot',
    title: 'The Two-Way Shot',
    category: 'position',
    level: 'advanced',
    readMin: 3,
    summary: 'The best players are always asking: "if I miss this, where does everything end up?"',
    body: [
      "A two-way shot is one where you're genuinely trying to make the ball — but if it doesn't go in, your cue ball ends up somewhere that leaves your opponent in trouble anyway. It's the bridge between offense and defense.",
      "To plan a two-way shot, pick your intended pot and position as normal, then ask: given my speed and spin, if the ball rattles in the jaws instead of dropping, where does the cue ball travel? If that 'miss path' happens to leave the cue ball tucked near a rail or blocked by another ball, you've found a two-way shot.",
      "These shots are gold in close matches. You're never giving up offense to play them — you're simply choosing, among several shots that look similar, the one whose worst-case outcome is the least damaging.",
    ],
    takeaway: 'When two shots look equally makeable, prefer the one whose "miss" still leaves your opponent with a hard shot.',
  },
  {
    slug: 'position-zones-not-points',
    title: 'Position Zones: Thinking in Areas, Not Points',
    category: 'position',
    level: 'intermediate',
    readMin: 3,
    summary: 'Stop aiming for a single perfect spot — aim for a generous zone, and your position play gets dramatically more reliable.',
    body: [
      "New players often pick one exact spot on the table as their position target, then feel like every shot is a near-failure if the cue ball lands two inches away. But for almost every next shot, there's a whole *zone* — sometimes a region the size of a dinner plate — from which the next shot is equally easy.",
      "Before the shot, identify that zone rather than a point: 'anywhere in this general area along the rail gives me a straightforward shot on the next ball.' This reframes small errors in speed or spin as still-successful outcomes, rather than misses.",
      "Aiming for a zone also tends to *increase* accuracy paradoxically — players who chase a pinpoint target often tense up and overcorrect, while players aiming for a generous zone stay loose and let their natural stroke do the work.",
    ],
    takeaway: 'Identify a whole zone where your next shot stays easy — not one perfect pixel — and you\'ll both relax and land position more often.',
  },
]

// ── SPIN & ENGLISH ─────────────────────────────────────────────────────
export const SPIN_TIPS: TipArticle[] = [
  {
    slug: 'sidespin-english-basics',
    title: 'Sidespin (English) Basics',
    category: 'spin',
    level: 'intermediate',
    readMin: 3,
    summary: 'Striking left or right of center spins the cue ball sideways — useful, but it comes with side effects you need to know about.',
    diagram: 'contact-zones',
    body: [
      "English is simply striking the cue ball to the left or right of its vertical center. It adds sideways spin, which changes two things: how the cue ball rebounds off rails (the spin 'grabs' the cushion and alters the angle), and slightly how the object ball reacts on contact (called throw — more on that separately).",
      "A simple mental map: think of the cue ball's face as a 3×3 grid. Center column = no English. Left column = left (or 'reverse'/'inside' depending on context) English. Right column = right English. The row (top/middle/bottom) controls follow/stun/draw as usual — the column controls sidespin.",
      "English is most valuable for controlling rail rebounds on position shots, and for kick shots and combinations where you need the cue ball's path to bend in a specific direction off a cushion.",
    ],
    takeaway: 'Picture the cue ball as a 3×3 grid — the row controls follow/draw, the column controls left/right English. Use English mainly to shape rail rebounds.',
  },
  {
    slug: 'squirt-and-deflection',
    title: 'Squirt & Deflection: Why Your Aim Shifts',
    category: 'spin',
    level: 'advanced',
    readMin: 3,
    summary: 'Hit the cue ball off-center and it doesn\'t travel exactly where the cue was pointed — here\'s the adjustment.',
    body: [
      "When you strike the cue ball away from its center, the cue ball initially squirts (deflects) slightly in the *opposite* direction of the English you applied — hit the right side, and the cue ball's actual path starts out a touch to the left of where the cue was aimed.",
      "This effect is small but very real, especially on shots with a lot of side spin and a firm stroke. Lower-deflection cue shafts reduce the effect, but every cue has some squirt — there's no such thing as zero.",
      "The practical fix is simple: when using side spin, aim very slightly to the side the spin is pulling toward (i.e., compensate in the direction opposite the squirt). The more spin and the firmer the stroke, the more compensation you'll need — which is one more reason to use English only when you need it.",
    ],
    takeaway: 'Side spin makes the cue ball squirt slightly opposite the spin direction — aim a touch toward the side you applied English to compensate.',
  },
  {
    slug: 'swerve-curving-around-trouble',
    title: 'Swerve: Curving Around Trouble',
    category: 'spin',
    level: 'advanced',
    readMin: 3,
    summary: 'Elevate the cue with side spin and a soft stroke, and the cue ball will arc — sometimes enough to dodge a ball in the way.',
    diagram: 'curve-english',
    body: [
      "Swerve happens when you elevate the back of the cue and apply side spin with a relatively soft stroke. Early in its travel, the cue ball skids sideways (squirt), but as friction with the table grabs the spinning ball, it curves back the *other* way — creating a banana-shaped path.",
      "The softer the stroke and the more the cue is elevated, the more pronounced the curve. A firm, level stroke produces almost pure squirt with very little curve; a soft, elevated stroke gives the curve time to develop.",
      "Swerve is mainly a rescue tool — for getting around a blocking ball when a straight line isn't available. It's hard to control precisely, so it should be a last resort rather than a first choice, and always worth practicing at low stakes before you rely on it in a match.",
    ],
    takeaway: 'Elevate the cue, add side spin, and stroke softly to curve around an obstacle — but treat it as a rescue shot, not a default.',
  },
  {
    slug: 'throw-how-spin-changes-object-ball',
    title: "Throw: How Spin Changes the Object Ball's Path",
    category: 'spin',
    level: 'advanced',
    readMin: 3,
    summary: 'Sidespin doesn\'t just change the cue ball — it can nudge the object ball off its expected line too.',
    body: [
      "When the cue ball contacts the object ball with sidespin (and especially at slower speeds), friction between the two balls at the contact point 'throws' the object ball slightly off the line you'd expect from a pure, spin-free collision.",
      "Throw is most noticeable on slower shots with a lot of side spin, and almost disappears on hard, fast shots where the balls barely have time to grip each other. This is part of why thin cuts with heavy English are unreliable — both squirt *and* throw are working against your aim at once.",
      "The practical takeaway: on shots where precision matters most (tight cuts, shots near a rail), prefer a center-ball or near-center hit. Save heavy side spin for shots where the contact is fuller and the object ball's path is more forgiving.",
    ],
    takeaway: 'Heavy side spin on slow, thin cuts can throw the object ball off-line — keep precision shots closer to center-ball.',
  },
  {
    slug: 'combining-vertical-and-side-spin',
    title: 'Combining Top/Bottom Spin with Side Spin',
    category: 'spin',
    level: 'advanced',
    readMin: 3,
    summary: 'Most real shots use a blend — a touch of draw AND a touch of side. Here\'s how to think about combos.',
    body: [
      "Once follow/draw and left/right English each make sense on their own, the natural next step is combining them — striking, say, low-and-left to get both draw and left English in the same shot. Picture the 3×3 grid again: most useful shots live in one of the eight outer cells, not just the four edges.",
      "Combining spins compounds their side effects. A low-left hit combines draw's distance-sensitivity with left English's squirt and throw — meaning small errors in your contact point get amplified more than with a pure vertical or pure horizontal spin shot.",
      "A good rule for combined-spin shots: reduce your speed slightly compared to what a pure version of the shot would need, since two spin effects working together often produce more total cue-ball movement than either alone.",
    ],
    takeaway: 'Combined spins (e.g. draw + side) stack their effects and their margins for error — dial the speed back slightly when blending spins.',
  },
  {
    slug: 'when-not-to-use-english',
    title: 'When NOT to Use English',
    category: 'spin',
    level: 'intermediate',
    readMin: 2,
    summary: 'The most underrated spin decision is choosing not to use any at all.',
    body: [
      "English adds squirt, throw, and extra rail-angle complexity — all useful when you need them, all extra risk when you don't. If a center-ball stun or simple follow/draw gets the cue ball where you need it, adding English just introduces more ways for the shot to go slightly wrong.",
      "A good habit: before reaching for side spin, ask whether the shot is achievable with vertical spin (follow/draw/stun) alone, possibly combined with the natural angle off the object ball. If yes, that's almost always the higher-percentage choice.",
      "Save English for when it's doing something nothing else can — bending the cue ball's path off a rail, or threading position around an obstacle. When it's solving a problem, it's a tool; when it's just habit, it's a liability.",
    ],
    takeaway: 'If a center-ball or pure vertical-spin shot gets the job done, take it — only reach for English when nothing else solves the problem.',
  },
  {
    slug: 'masse-and-jump-shots',
    title: 'The Massé and Jump Shot (Advanced Spin)',
    category: 'spin',
    level: 'advanced',
    readMin: 3,
    summary: 'The flashiest shots in pool are also the least necessary — know what they are, and why they\'re a last resort.',
    body: [
      "A massé shot uses an almost-vertical cue with heavy side spin to make the cue ball curve sharply — far more dramatically than a regular swerve shot. A jump shot uses a steep downward strike to literally bounce the cue ball over an obstacle in its path.",
      "Both shots look spectacular and both carry real risk: massé shots are notoriously hard to control for distance and direction, and jump shots can damage the table cloth if done with too steep an angle or too much force (many leagues restrict or penalize jumping with anything other than a dedicated jump cue).",
      "These are genuinely last-resort tools — for the rare situation where no safety and no curve/swerve shot exists. If you're reaching for a massé or jump shot as your first idea, it's worth stepping back and re-reading the table for a safer option first.",
    ],
    takeaway: 'Massé and jump shots are rescue tools for genuinely blocked situations — check for a safety or a simpler curve shot first.',
  },
]

// ── SAFETY & DEFENSE ─────────────────────────────────────────────────
export const SAFETY_TIPS: TipArticle[] = [
  {
    slug: 'when-to-play-a-safety',
    title: 'When to Play a Safety',
    category: 'safety',
    level: 'intermediate',
    readMin: 3,
    summary: 'The simplest rule in pool strategy: if you can\'t see a realistic run-out, stop trying to force one.',
    body: [
      "The clearest signal to play safe is when you genuinely can't picture clearing the table from here — whether that's because the layout is too spread out, a key ball is blocked, or the shot in front of you is low-percentage with no good position afterward.",
      "A second signal: you have a makeable shot, but it leaves you nothing for the next ball. If taking it would hand the table right back to your opponent anyway, a good safety that denies them an easy shot is often worth more than a pot that doesn't lead anywhere.",
      "Train yourself to scan for safeties *first*, before you fall in love with a tough pot. Players who only consider defense once they've already decided a shot is too hard tend to play worse safeties — under pressure, rushed, and reactive — than players who treat it as a real option from the start.",
    ],
    takeaway: 'Scan for a good safety before you commit to a tough or pointless pot — defense considered early is sharper than defense as a last resort.',
  },
  {
    slug: 'rail-safeties-hugging-the-cushion',
    title: 'Rail Safeties: Hugging the Cushion',
    category: 'safety',
    level: 'intermediate',
    readMin: 3,
    summary: 'Tuck the cue ball against a rail and you instantly remove half your opponent\'s options.',
    diagram: 'safety-rail',
    body: [
      "When the cue ball ends up frozen or nearly frozen against a rail, your opponent loses access to every shot that would require hitting the cue ball from that side — cutting their realistic options roughly in half before they even look at the table.",
      "To set one up, use a soft stun or a touch of draw/follow off the object ball, aiming to die the cue ball gently into the cushion behind it. Speed control matters enormously here — too much pace and the cue ball bounces back out into the open, giving away exactly the freedom you were trying to remove.",
      "Rail safeties are especially strong combined with leaving the object ball (or the rest of the cluster) far away — now your opponent faces both a restricted cue-ball angle *and* a long, risky shot.",
    ],
    takeaway: 'A cue ball frozen to a rail cuts your opponent\'s angles in half — use soft stun/draw and prioritize speed control over precision.',
  },
  {
    slug: 'distance-safeties-out-of-reach',
    title: 'Distance Safeties: Out of Reach',
    category: 'safety',
    level: 'beginner',
    readMin: 2,
    summary: 'Sometimes the simplest safety is just... far away.',
    body: [
      "If your opponent's next ball is on the opposite end of the table, even a wide-open cue ball can be a perfectly good safety — long, full-table shots carry far more risk of a scratch or a miss than short ones, simply due to the distance the cue ball has to travel accurately.",
      "Look for shots where you can pot (or at least move) a ball while sending your cue ball to the far end of the table, away from your opponent's remaining balls. Even without hiding behind anything, distance alone raises the difficulty of their reply.",
      "Distance safeties are forgiving for beginners because they don't require precise position play — just a sense of where 'far away from their stuff' is, and a willingness to not chase a risky pot you don't need to take.",
    ],
    takeaway: 'When your opponent\'s balls are clustered at one end, simply sending the cue ball to the other end is often safety enough.',
  },
  {
    slug: 'the-snooker-blocking-the-path',
    title: 'The Snooker: Blocking the Path',
    category: 'safety',
    level: 'advanced',
    readMin: 3,
    summary: 'The most aggressive safety: leave a ball directly in the way so your opponent can\'t even see their shot.',
    body: [
      "A snooker is when you leave the cue ball with no direct (straight-line) path to any ball you're legally allowed to hit — your own ball, a rail, or the cue ball itself is physically in the way.",
      "Snookers are powerful because they can force your opponent into a foul: if they genuinely can't hit a legal ball, their best options are often a low-percentage kick shot, a risky curve/swerve around the blocker, or conceding ball-in-hand.",
      "To set one up, you generally need a ball of your own (or a non-target ball) positioned between the cue ball's likely resting spot and your opponent's object balls. Plan the snooker *before* the shot — most snookers happen as a byproduct of a shot you were already taking, not as a separate maneuver.",
    ],
    takeaway: 'A snooker — no straight line to a legal ball — can force a foul outright. Look for it as a "free" byproduct of the shot you\'re already playing.',
  },
  {
    slug: 'escaping-a-snooker',
    title: 'Escaping a Snooker',
    category: 'safety',
    level: 'advanced',
    readMin: 3,
    summary: 'You\'ve been snookered — now what? Three escape routes, ranked by reliability.',
    body: [
      "First, check for a kick shot: can you send the cue ball off one or more rails to reach a legal ball directly? Kick shots are generally the most controllable escape because the cue ball's path is determined mostly by angles, which are easier to read than a curving path.",
      "Second, consider a curve (swerve) shot around the blocker if there's a clear-enough gap and the distance is short. This is higher-risk than a kick but can sometimes reach a ball a kick shot simply can't.",
      "If neither works cleanly, the priority shifts from 'hit a legal ball' to 'minimize the damage' — focus on leaving your opponent the toughest possible position even if you can't legally hit anything, since a foul that leaves them nothing is far better than a foul that hands them an easy table.",
    ],
    takeaway: 'When snookered: look for a kick shot first, a curve shot second, and if both fail, aim to leave the smallest possible mess for your opponent.',
  },
  {
    slug: 'two-way-shots-revisited',
    title: 'Two-Way Shots Revisited: Attack AND Defend',
    category: 'safety',
    level: 'advanced',
    readMin: 2,
    summary: 'The strongest "safety" mindset isn\'t choosing between offense and defense — it\'s making every shot do both jobs.',
    body: [
      "We covered two-way shots under position play, but they belong here too: the very best safeties often started life as a pot attempt. You're shooting to make the ball — but you've also checked where the cue ball goes if it doesn't drop, and that 'miss' outcome is still a strong safety.",
      "This mindset shift — from 'pot or safety?' to 'how do I make this shot good for me either way?' — is one of the biggest jumps from intermediate to advanced play. It removes the pressure of an all-or-nothing decision.",
      "Practicing this is simple: on any shot you're about to take, pause and ask 'if I miss this exactly as planned, is my opponent in trouble?' If the honest answer is no, see if a small adjustment to speed or angle can make it yes — without meaningfully hurting your chance to pot.",
    ],
    takeaway: 'Before every shot, ask "if this misses, is my opponent still in trouble?" — small tweaks can turn a pure pot attempt into a two-way shot for free.',
  },
]

// ── THE BREAK ──
export const BREAK_TIPS: TipArticle[] = [
  {
    slug: 'anatomy-of-a-great-break',
    title: 'Anatomy of a Great Break',
    category: 'break',
    level: 'intermediate',
    readMin: 3,
    summary: 'A great break is about a clean, full hit on the head ball — not just swinging as hard as you can.',
    diagram: 'break-setup',
    body: [
      "Cue ball placement starts every break. Spotting it near the head string, a few inches off the rail (slightly off-center toward the side you want the cue ball to end up after impact), gives you a clean, fairly straight shot at the head ball of the rack.",
      "The single biggest factor in a powerful, scattering break is hitting the head ball as fully and squarely as possible. Even a great break with tons of speed will scatter weakly if the cue ball clips the head ball off-center — all that energy gets wasted as spin and deflection instead of transferring into the rack.",
      "Stance and grip widen slightly for a break shot compared to a normal shot, giving you a longer, freer pendulum stroke. But the extra power should come from a longer, looser backswing and a relaxed grip through contact — not from muscling the cue or lunging at the ball, which actually costs you accuracy on that crucial full hit.",
    ],
    takeaway: 'Speed is secondary — a square, full hit on the head ball is what actually produces a powerful, scattering break.',
  },
  {
    slug: 'power-vs-control-the-two-thirds-rule',
    title: 'Power vs. Control: The Two-Thirds Rule',
    category: 'break',
    level: 'intermediate',
    readMin: 2,
    summary: 'Most strong breakers aren\'t swinging at 100% — they\'re swinging at about 2/3 power with much better accuracy.',
    body: [
      "It's tempting to treat the break as a chance to hit the ball as hard as humanly possible. But cue speed and accuracy trade off against each other — past a certain point, every bit of extra speed costs you more in aim than it gains you in scatter.",
      "A widely used benchmark among strong players is to break at roughly two-thirds of your absolute maximum power. At that speed you can still keep the stroke smooth and the hit accurate, and in most cases it produces just as much rack action as a wild full-power swing — sometimes more, because the hit is cleaner.",
      "Try this in practice: break a few racks at full effort, then a few at about 2/3 effort with extra focus on a square hit. Watch what happens to the cue ball and the spread of the balls. Many players find the 'controlled' break pockets just as many balls, with a cue ball that finishes in a much more useful spot.",
    ],
    takeaway: 'Dial the break back to about 2/3 of your max power and put the saved effort into hitting the head ball square — you\'ll often get just as much action with a far more useful cue ball.',
  },
  {
    slug: 'rack-tightness-matters',
    title: 'Rack Tightness Matters More Than You Think',
    category: 'break',
    level: 'beginner',
    readMin: 2,
    summary: 'The best break in the world can\'t overcome a loose rack — tight balls are non-negotiable.',
    body: [
      "Energy transfers through a rack ball-to-ball almost instantly only if the balls are touching. Any small gaps between balls absorb energy and kill the spread — a gap you can't even see can be the difference between a violent scatter and a rack that barely moves.",
      "Whoever racks should push the balls together firmly from behind before lifting the rack template, and lift it straight up slowly so the balls don't get nudged out of position on the way up. If you're not using a template/triangle that locks the balls tightly, double-check the front and the rows behind it by hand.",
      "This matters for both players, not just the breaker — a poorly racked set can lead to disputes about a 'bad break' that was actually a bad rack. Taking ten extra seconds to rack tight removes that argument entirely and makes every break a fair test of the breaker's actual stroke.",
    ],
    takeaway: 'Always push the rack tight and lift the triangle slowly and straight up — a loose rack ruins even a perfect break.',
  },
  {
    slug: 'the-soft-break-for-position-games',
    title: 'The Soft Break: When Less Is More',
    category: 'break',
    level: 'advanced',
    readMin: 2,
    summary: 'In games where pocketing on the break isn\'t the main goal, a soft, controlled break can be the smarter choice.',
    body: [
      "Not every game rewards a crashing break. In games focused on continuous position play, a 'soft' break — just enough speed to legally open the rack and satisfy any required contact — keeps the balls in a tight, predictable cluster near where they started, which is far easier to plan around than balls scattered to all four corners.",
      "A soft break still needs to be a clean, full hit on the head ball; 'soft' refers to speed, not accuracy. The cue ball should die near the center of the table with no risk of scratching, leaving a simple, calm position to start your runout or your opponent's turn.",
      "For our weekly games this mostly applies if you ever play a ruleset other than our standard format — but it's worth knowing the soft break exists as an option, rather than assuming every break has to be a all-out blast.",
    ],
    takeaway: 'A soft, accurate break that keeps the rack tight and the cue ball safe is a legitimate tactic in position-focused games — power isn\'t always the goal.',
  },
  {
    slug: 'recovering-from-a-bad-break',
    title: 'Recovering From a Bad Break',
    category: 'break',
    level: 'intermediate',
    readMin: 3,
    summary: 'Even great players get an ugly spread sometimes. What you do on the very next shot decides whether it costs you the game.',
    body: [
      "A bad break usually means one of two things: nothing useful opened up, or the balls are still clustered together. Either way, resist the urge to immediately fire at the hardest available ball just to 'do something' — a rushed shot after a bad break is how one mistake becomes two.",
      "Take a full lap around the table before deciding. Look for any shot that's both makeable and leaves you a reasonable next shot — even a modest, low-difficulty pot that keeps you at the table is better than a flashy attempt that hands your opponent a turn.",
      "If truly nothing is on, this is exactly when the safety skills from earlier articles earn their keep. A disciplined safety after a bad break — leaving your opponent a tough shot rather than gifting them an open table — turns a bad break from 'I'm now losing' into 'it's still anyone's game.'",
    ],
    takeaway: 'After a bad break, slow down: take the best available shot even if it\'s modest, and don\'t be afraid to play a safety if nothing good is on.',
  },
]

// ── MENTAL GAME ──
export const MENTAL_TIPS: TipArticle[] = [
  {
    slug: 'building-a-pre-shot-routine',
    title: 'Build a Pre-Shot Routine — and Never Skip It',
    category: 'mental',
    level: 'beginner',
    readMin: 3,
    summary: 'The same routine on every shot, easy or hard, is one of the simplest ways to play more consistently under pressure.',
    body: [
      "Watch any strong player and you'll notice their routine barely changes whether they're facing a simple straight-in shot or a nervy game-winner: walk in, check the line from behind the cue ball, get down, a couple of warm-up strokes, a final look at the target, and go. The shot itself might be hard, but the routine is identical every time.",
      "That sameness is the point. A routine gives your mind a familiar track to run on, so nerves have less room to creep in — you're just doing the thing you always do, for the thousandth time. Players who skip their routine on 'easy' shots and only slow down for hard ones often find the hard shots feel foreign and tense by comparison.",
      "Build yours from a handful of steps you can do the same way every time: a fixed number of practice strokes, a specific final look (cue ball, then object ball, then back to cue ball), and a clear mental cue for when it's time to go. Then use it on literally every shot — including the simple ones in practice — until it's automatic.",
    ],
    takeaway: 'Use the exact same routine on easy shots and hard ones — consistency in your routine is what keeps nerves from changing your stroke when it matters.',
  },
  {
    slug: 'talk-to-yourself-like-a-coach',
    title: 'Talk to Yourself Like a Coach, Not a Critic',
    category: 'mental',
    level: 'beginner',
    readMin: 2,
    summary: 'The voice in your head after a miss has a direct effect on your next shot — make sure it\'s on your side.',
    body: [
      "After a miss, it's natural for an internal voice to pipe up — and for a lot of players, that voice is harsh: 'how did you miss that,' 'you always do this,' 'you're terrible today.' That self-talk feels harmless, but it actively works against you: it raises tension, narrows focus to the mistake, and primes you to expect the next miss too.",
      "A good coach, watching the same miss, would say something completely different: 'okay, that one came up a little short — feel the speed, adjust, next ball.' Specific, forward-looking, no judgment attached. The information is the same; the effect on the next shot is not.",
      "You don't have to fake positivity or pretend a bad shot was good. The goal is just to replace 'what's wrong with me' with 'what do I adjust' — a small wording shift that keeps you analytical instead of anxious, which is exactly the state you want walking up to your next shot.",
    ],
    takeaway: 'After a miss, narrate it like feedback ("a little short — adjust the speed") instead of judgment ("how did I miss that") — same information, much better effect on your next shot.',
  },
  {
    slug: 'breathing-between-shots',
    title: 'One Breath Between Shots',
    category: 'mental',
    level: 'beginner',
    readMin: 2,
    summary: 'A single slow breath before you walk up to the table is a tiny habit with an outsized effect on tension.',
    body: [
      "When the pressure rises — a close game, a tough opponent, a shot you really want to make — your breathing tends to get shorter and higher in your chest without you noticing. That shift alone can add tension to your shoulders and arm, which shows up as a jerkier stroke.",
      "Before you step up to the table, take one slow breath in through the nose and let it out fully. It costs you two or three seconds, which is nothing in the context of a shot, but it resets your breathing pattern and gives your shoulders a chance to drop back down from wherever stress has pushed them.",
      "This is especially useful right after a big shot — made or missed. The adrenaline from a clutch pot is just as likely to tighten you up as the frustration from a miss. One breath, then start your pre-shot routine, keeps both extremes from carrying over into the next shot.",
    ],
    takeaway: 'Take one slow breath before every shot, especially right after a big make or a frustrating miss — it resets tension before it reaches your stroke.',
  },
  {
    slug: 'play-the-process-not-the-score',
    title: 'Play the Process, Not the Score',
    category: 'mental',
    level: 'intermediate',
    readMin: 3,
    summary: 'The moment you start thinking about the score instead of the shot in front of you, your stroke usually gets worse.',
    body: [
      "It's easy to slip into scoreboard thinking: 'if I make this I'll be 3-1 up,' or 'if I miss this I'm probably losing this game.' The problem is that none of that information helps you make the shot — and thinking about it pulls your attention away from the one thing that does: the shot itself.",
      "The players who handle pressure well aren't immune to caring about the score — they just compartmentalize it. Between shots, sure, think about the game state if you need to for strategy. But once you've decided on your shot and started your routine, the score should disappear completely. There's only the cue ball, the object ball, and the line between them.",
      "A simple way to practice this: notice when scoreboard thoughts show up during your routine, and treat it as a signal to restart the routine from the top. Over time this builds a habit of catching yourself before the thought derails the shot, rather than after.",
    ],
    takeaway: 'Once you\'ve started your pre-shot routine, the score doesn\'t exist — there\'s only this shot. If scoreboard thoughts intrude, restart your routine.',
  },
  {
    slug: 'bouncing-back-from-a-miss',
    title: 'Bouncing Back From a Miss — Fast',
    category: 'mental',
    level: 'intermediate',
    readMin: 2,
    summary: 'How quickly you let go of the last shot often matters more than the shot itself.',
    body: [
      "Every player misses shots — including the best in the world. What separates strong players isn't a lower miss rate on hard shots, it's how fast they reset afterward. A miss that lingers in your head for the next three shots does far more damage than the miss itself.",
      "One useful trick is a physical reset: a specific small action — stepping back from the table, chalking your cue, or even just that one slow breath from earlier — that you do after every shot, hit or miss, as a signal to yourself that this shot is now over and the next one starts fresh.",
      "It also helps to remember that your opponent is now at the table dealing with whatever you left them — your job for the next minute or two is just to watch, learn what you can about the table from their shots, and be ready when it's your turn. There's nothing productive left to do about the shot you just missed.",
    ],
    takeaway: 'Give yourself one consistent physical action — step back, chalk up — that marks "that shot is over" every single time, miss or make, so the last shot never bleeds into the next.',
  },
  {
    slug: 'confidence-comes-from-repetition',
    title: 'Confidence Comes From Repetition, Not Hope',
    category: 'mental',
    level: 'beginner',
    readMin: 2,
    summary: 'Real confidence isn\'t a feeling you summon before a shot — it\'s the residue of having made that shot many times before.',
    body: [
      "It's common advice to 'just be confident' before a big shot, as if confidence were a switch you could flip on demand. But confidence that isn't backed by anything is just hope — and hope doesn't hold up well under pressure.",
      "Real, durable confidence comes from a simple source: having successfully done the thing before, many times, including in practice. If you've drilled a particular cut angle or a particular speed of stun shot fifty times in practice, your body already knows what it feels like — under pressure, you're not hoping it works, you're recognizing a shot you've already made.",
      "This is also the best argument for treating practice shots seriously rather than casually. Every shot you take with real focus — checking your aim, completing your stroke, watching the result — is a small deposit into the confidence account you'll draw on during an actual game.",
    ],
    takeaway: 'Confidence isn\'t something you talk yourself into right before a shot — it\'s built beforehand, one focused repetition at a time.',
  },
]

// ── STRATEGY ──
export const STRATEGY_TIPS: TipArticle[] = [
  {
    slug: 'think-three-shots-ahead',
    title: 'Think Three Shots Ahead, Not One',
    category: 'strategy',
    level: 'intermediate',
    readMin: 3,
    summary: 'The shot you\'re about to take matters less than the shot it sets up — and the one after that.',
    body: [
      "A common beginner habit is to plan only the shot directly in front of you: pick a ball, pot it, then figure out the next one once the cue ball stops. Stronger players are already thinking about shot three while they're choosing shot one.",
      "In practice this means: before committing to which ball to shoot first, glance at what else is on the table and ask which ball is hardest to get to later. If there's a ball sitting awkwardly near a rail that only a few cue ball positions can reach cleanly, that's often a clue about which ball to take early — and where you need the cue ball to land after this shot to set that up.",
      "You don't need to plan the entire rack perfectly every time — that's unrealistic even for pros. But forming a rough two-or-three-shot plan, and adjusting it as the table changes, turns a string of disconnected pots into an actual run.",
    ],
    takeaway: 'Before your first shot, glance ahead and identify the awkward ball — then let that shape where you send the cue ball now.',
  },
  {
    slug: 'clear-clusters-early',
    title: 'Clear Clusters Early, While You Have Options',
    category: 'strategy',
    level: 'intermediate',
    readMin: 3,
    summary: 'A tight group of balls is a problem that only gets harder to solve as the table empties.',
    body: [
      "Clusters — two or more balls sitting close together — are a common reason a seemingly easy rack falls apart. Early in the rack, you have lots of balls to work with, which gives you many possible angles and speeds to use a shot near the cluster to nudge it apart without disturbing your run.",
      "Late in the rack, your options shrink fast. If you've left a stubborn cluster for last, you may find there's no remaining ball positioned to break it apart safely — and now you either have to gamble on a risky break-up shot or play a safety on your own cluster, losing your turn.",
      "The fix is simple in concept: as you build your shot plan, identify any clusters early and look for a shot — ideally one you were going to take anyway — that sends the cue ball (or, on a pot, the object ball) through or near the cluster to spread it out while it's still 'cheap' to do so.",
    ],
    takeaway: 'Spot clusters at the start of your turn and use an early shot to nudge them apart — waiting until they\'re the last balls left makes them far harder to solve.',
  },
  {
    slug: 'working-backward-from-the-last-ball',
    title: 'Working Backward From the Last Ball',
    category: 'strategy',
    level: 'advanced',
    readMin: 3,
    diagram: 'pattern-runout',
    summary: 'Planning a runout is often easier in reverse: start from the last ball and the eight ball, then work toward the first shot.',
    body: [
      "Planning forward — 'I'll shoot this one, then probably that one' — gets harder the further ahead you try to look, because every shot changes the cue ball position you're working from. Planning backward sidesteps a lot of that uncertainty.",
      "Start with the eight ball (or your final ball): where is it, and roughly where do you want the cue ball when you shoot it? Then look at the second-to-last ball: is there a position for it that naturally leaves the cue ball near that spot? Work backward ball by ball until you reach the shot you're about to take.",
      "You won't always find a perfect chain, and that's fine — even a rough backward plan tells you which balls are 'key' (their position determines a lot of what comes after) and which are flexible. Spend your planning effort on the key balls and stay loose about the rest.",
    ],
    takeaway: 'Start your plan from the last ball and work backward — it reveals which balls are flexible and which ones really determine your route through the rack.',
  },
  {
    slug: 'reading-the-table-layout',
    title: 'Reading the Table Layout Before You Touch a Ball',
    category: 'strategy',
    level: 'beginner',
    readMin: 2,
    summary: 'A 15-second look at the whole table before your first shot pays for itself many times over.',
    body: [
      "When it's your turn, the temptation is to walk straight to the most obvious shot and start lining it up. A better first move is a slow walk (or look) around the whole table — every ball, both ends — before you settle on anything.",
      "During this look, you're roughly answering three questions: which balls are easy, which are hard or awkward, and are there any clusters or balls frozen to the rail or to each other? You don't need exact plans yet — just a mental map of the table's 'shape.'",
      "This 15-second habit is cheap and pays off constantly: it's how you notice the ball that's perfectly set up for a two-way shot, the cluster that needs early attention, or the safety that's hiding in plain sight if your run doesn't pan out.",
    ],
    takeaway: 'Before lining up your first shot, take one slow look at the entire table — easy balls, hard balls, clusters — so your plan is based on the whole picture.',
  },
  {
    slug: 'bank-shots-the-mirror-method',
    title: 'Bank Shots: The Mirror Method',
    category: 'strategy',
    level: 'intermediate',
    readMin: 3,
    summary: 'A simple visualization trick makes aiming bank shots far less guesswork than it feels like.',
    body: [
      "A bank shot sends the object ball into a rail and back across the table into a pocket. The basic physics is like light bouncing off a mirror: the angle the ball arrives at the rail roughly equals the angle it leaves at — though spin, speed, and cushion condition all nudge this slightly in practice.",
      "The 'mirror method' for aiming: imagine a mirror-image pocket reflected across the rail you're banking off of, on the opposite side. If you can picture (or even just estimate) where that mirrored pocket would be, aiming the object ball at that mirrored target — as if the rail weren't there — gives you a solid starting line for the bank.",
      "Speed matters more on bank shots than most players expect: too much speed and the ball 'holds' less angle off the rail (banks shorter than the simple mirror line), while too little can let throw and cushion effects bend the path more than the mirror predicts. Treat the mirror line as your starting point, then adjust based on what you see on similar banks during the game.",
    ],
    takeaway: 'For bank shots, imagine the mirrored pocket on the far side of the rail and aim the object ball at that — then fine-tune for speed, which bends the simple mirror line in practice.',
  },
  {
    slug: 'kick-shots-one-two-three-rail',
    title: 'Kick Shots: One-Rail, Two-Rail, Three-Rail',
    category: 'strategy',
    level: 'advanced',
    readMin: 3,
    summary: 'When you can\'t hit a ball directly, sending the cue ball off one or more rails first might still get the job done.',
    body: [
      "A kick shot is the cue-ball equivalent of a bank shot: instead of the object ball bouncing off a rail, the cue ball does, before it ever touches an object ball. The simplest version — a one-rail kick — uses the same mirror idea as bank shots, but now you're picturing where the cue ball needs to be reflected from to reach its target.",
      "Two-rail and three-rail kicks extend the same idea across multiple cushions, and get progressively harder to read precisely — small errors compound with each rail. They're most useful as safety-escape tools (see the snooker-escape article) where a rough, defensive result is good enough, rather than as a primary scoring method.",
      "A practical starting point: for a one-rail kick, find the mirrored target across the rail you'll use, just like a bank shot, and aim the cue ball at that point with smooth, center-ball speed. For multi-rail kicks, it's often easier to find a 'system' diagram or chart for your table size than to calculate it from scratch — but even a rough version, aimed with the mirror idea, beats no plan at all.",
    ],
    takeaway: 'Kick shots use the same mirror logic as bank shots, applied to the cue ball — great for escapes, but treat anything beyond one rail as a defensive tool, not a sure thing.',
  },
  {
    slug: 'tracking-your-stats-to-find-patterns',
    title: 'Tracking Your Stats to Find Your Patterns',
    category: 'strategy',
    level: 'beginner',
    readMin: 2,
    summary: 'You don\'t need a coach watching every session to find your weaknesses — the Stats page already has the data.',
    body: [
      "Every shot you record in the Thonara League — potted, lucky, miss, or error — feeds into the Stats page, building up a real history of your game over time. That data is one of the most honest coaches you'll ever get, because it has no opinions, just numbers.",
      "After a session, take two minutes to glance at your accuracy trend and your shot breakdown. Is your pot percentage drifting up or down over recent sessions? Are 'errors' (not just misses, but mistakes that gave up ball-in-hand) showing up more in certain sessions — maybe ones where you were tired, distracted, or rushing?",
      "You can also use the head-to-head and wins-by-game-number breakdowns to spot situational patterns — maybe you perform noticeably better or worse in a specific game slot, or against a specific opponent's style. None of this replaces practice, but it tells you where to focus that practice.",
    ],
    takeaway: 'Check your accuracy trend and shot breakdown on the Stats page after each session — your own data will point you toward exactly what to practice next.',
  },
]

export const TIP_ARTICLES: TipArticle[] = [
  ...FUNDAMENTALS_TIPS,
  ...AIMING_TIPS,
  ...POSITION_TIPS,
  ...SPIN_TIPS,
  ...SAFETY_TIPS,
  ...BREAK_TIPS,
  ...MENTAL_TIPS,
  ...STRATEGY_TIPS,
]

export function getTipBySlug(slug: string): TipArticle | undefined {
  return TIP_ARTICLES.find(t => t.slug === slug)
}

export function getTipsByCategory(category: TipCategory): TipArticle[] {
  return TIP_ARTICLES.filter(t => t.category === category)
}
