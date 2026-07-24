export type DiaryMedium = 'handwritten' | 'typewriter' | 'computer' | 'voice';

export interface DiaryEntry {
  slug: string;
  title: string;
  medium: DiaryMedium;
  /** Tag text when more specific than the medium (e.g. “Google Docs”). */
  mediumLabel?: string;
  /** Photograph/screenshot of the artifact; shown as a popover on tag hover. */
  image: string;
  /** Entry text as paragraphs; a `# ` prefix marks a section heading and a
   *  `- ` prefix a list item (consecutive items group into one list).
   *  Empty until the content lands. */
  body: string[];
}

export const MEDIUM_LABELS: Record<DiaryMedium, string> = {
  handwritten: 'Handwritten',
  typewriter: 'Typewriter',
  computer: 'Computer',
  voice: 'Voice',
};

export const mediumLabel = (entry: DiaryEntry): string =>
  entry.mediumLabel ?? MEDIUM_LABELS[entry.medium];

export const diaryEntries: DiaryEntry[] = [
  {
    slug: 'the-whole-foods-of-computers',
    title: 'The Whole Foods of Computers',
    medium: 'typewriter',
    image: '/diary/the-whole-foods-of-computers.jpg',
    body: [
      'From brainrot, slop, tiny glowing misery rectangles to something like beautiful, perfect organic produce.',
      'The bounty of the aftermath of the Second World War included amazing advancements in food technology. Now potato chips can be kept fresh for years! Now a square meal can be manufactured, frozen, and microwaved in minutes, to be enjoyed by the warm glow of your TV. These innovative new foods can also be nutritionally enriched, can swap fat for emulsifying fat-free chemicals, or be genetically modified at the ingredient level to achieve new heights of efficiency and maybe flavor.',
      'As marvelous as a microwave TV dinner sometimes is, we collectively eventually caught on that there’s an issue. I personally experienced a version of this collective awakening when, experimenting with Hamburger Helper, I took sourdough bread with olive oil and lemon as a side. I was shocked, after a bite of Hamburger Helper, at how much more flavorful simple bread and olive oil is. And why? Because it’s real, honest food, not a product manufactured and engineered for efficiency.',
      'John Mackey, among others, converted the collective realization that putting real things into our bodies is important into a major supermarket chain and multibillion dollar business. Whole Foods, as we know, is now a subsidiary of Amazon following a $13.7 billion acquisition.',
      'If you are what you eat, there is an increasing realization that you are also what you attend to. The way we direct our attention is to our mind what the things we choose to eat are to our bodies. For many years, tech companies and users have emphasized engagement and dopamine loops in technology. Opening my computer, I feel the souls of ten thousand PMs needing my attention for them to hit their KPIs. It’s not a great feeling. And it’s unhealthy.',
      'With the paradigm change happening in computing, there’s an opportunity to make a new kind of computer that transcends all this, or at least a lot of it, providing a dopaminergically and emotionally healthy computing environment that supports, in its own way, a depth of attention and quality of content that yesterday’s computers never aspired to. Whole Foods, and Superhuman, show that there’s a high-end demographic willing at least to pay for it. Optimistically, hopefully, a cognitively and emotionally healthy computing environment has the potential to move the needle on civic, intellectual, and cultural engagement while enriching the lives of its users.',
    ],
  },
  {
    slug: 'desire-and-authenticity',
    title: 'Desire and Authenticity',
    medium: 'handwritten',
    image: '/diary/desire-and-authenticity.jpg',
    body: [
      'What makes something desirable?',
      'What is desire? The immediate feeling of being into something, of wanting to be part of something. Everyone feels things differently; we all desire different things.',
      'Some things are desired by a small group and often by a large group—maybe it’s part of the appeal in both cases. Some things just aren’t desirable to anyone.',
      'Swiss modernism, Louise Bourgeois, David Johnston, gravitational lensing, Neukölln, oil rigs in Palm Desert, Rothko at the Uffizi Gallery, the Mass, Junkers A50, Albert Einstein, palm trees in Los Angeles, and old BMW dials are confidently themselves—clear expressions of a vibe or an idea which has been developed in love.',
      'A beautiful motion, expertly and intelligently expressed in a pure, uninhibited manner.',
      'This is why AI writing, maggots, and dishonesty are so off-putting. There is something going on, some activity, but it’s not the kind of thing that would happen if those involved knew what they’re doing—which they don’t.',
      'Maybe we could say that a thing is desire-able when it achieves a true expression of itself, of God’s design, or is bringing a practiced perspective. A thing that is well-developed.',
      'There’s often something generous about a desirable thing; it invites you to participate in its beauty and excellence. People can be inspired and even transformed by desire, which is always, in part, a gift.',
      'This is fundamentally different from a focus-grouped product which, like a politician who only seems to believe in what’s popular at the moment, tends ironically towards the undesirable. Because integrity and desirability are so connected.',
      'To be desirable, something must be itself. It doesn’t need the approval of any one person, because there’s something true about it. This takes courage: to be a true expression of something, to have an opinion, to be what one is.',
      'Phil Stutz says God only wants you to do two things: have faith, and act on it.',
    ],
  },
  {
    slug: 'what-kind-of-computer-must-we-build',
    title: 'What Kind of Computer Must We Build?',
    medium: 'handwritten',
    image: '/diary/what-kind-of-computer-must-we-build.jpg',
    body: [
      'How does the medium of computing change when you have this intelligent substrate?',
      'Probably it’s still similar in the sense that you have a desktop, apps, websites, docs, etc. Building a new layer, like in archaeology or an old city, often incorporates the old ones—and becomes more beautiful through the process of accretion.',
      'As the computer becomes a partner, an intelligent companion, and as data understands itself, it becomes able to also understand its environment. So we try to create an environment that empowers the data inside it to be helpful and intelligent in an empowering way.',
      'The idea of magic sand—I often think about it.',
      'What kind of computer do we need to make for the future?',
      'AI-driven automation leads to people focusing more on perfecting themselves through reading, analysis, craft, and so on. B2B SaaS as we know it—boring workflows—is out, and so is this whole clunky, cluttered, [dopaminergic?], and ugly UI situation.',
      'What comes next is a computer interface that people love because it is calm and beautiful—or rather, because it is designed in a way that inculcates beauty and calm in its users, supporting them as they become the best versions of themselves.',
      'What enables this is that the computer has an understanding, more or less, of who you are and what you’re trying to do: now, in the next five minutes, this week, this month, and this year.',
      'Thinking of someone who absolutely doesn’t care about their computer, sitting down and beginning to work: how does work change in the next five years?',
      'We continue to sit down at a screen to learn, communicate, and create.',
      'Probably Enai emphasizes more the learning part, which I think becomes more important—more alpha in learning, post-AGI.',
      'But Enai also supports orientation and observation: the first steps of getting the information you need. This can be a hypermedia experience, using not just text but all kinds of symbols to provide an information-dense [experience] without being overwhelmingly [dense].',
      'That means you need to make a way for all your data to be holistically integrated into a system that can transform it from static, inert, discrete chunks of siloed data into an intelligent, harmonious system.',
      'Computing shifts from clicking around to preemptively and proactively surfacing—or researching first and then surfacing—whatever it is that supports your goal.',
      'This might be:',
      '- An app like Slack, GitHub, or Linear',
      '- A publication like Semafor or Artforum',
      '- A specific GitHub PR or Linear issue',
      '- A specific essay or piece of writing',
      '- A pair of information sources, like an email containing a question and the document or documents containing the data needed to find the answer',
      'We don’t want the computer to be overly prescriptive or for the experience to feel like it’s “on rails,” so this information should always be presented as a variety of options, with the possibility for the user to search, redirect, or even correct the computer dialogically.',
      'This is the essence of the presearch feature we are building, and of the intent stream that informs it.',
      'In this way, the UI shifts from clicking around static information to dynamically presenting information. But how complete is this shift?',
      'Can we still leave things somewhere in our computer to find them later? Or is the whole experience dynamic, on the principle that there is just too much stuff to conveniently leave around?',
      'Already, the UI contains multiple ideas for moving from something to another thing, which help us learn in practice what works and what doesn’t.',
      'The sidebar attempts to be a drawer, keeping things where you left them, but doesn’t do a great job at this. The animation is clunky and the UI feels old and boring. It probably needs more space.',
    ],
  },
  {
    slug: 'whats-a-personal-computer',
    title: 'What’s a Personal Computer? What should it be?',
    medium: 'computer',
    mediumLabel: 'Google Docs',
    image: '/diary/whats-a-personal-computer.jpg',
    body: [
      '# What is a personal computer?',
      'For many people, the first thought that comes to mind is a device. A laptop on your desk, a tablet glowing on the coffee table. Sophisticated as these devices are, they exist in service to the data within or connected to them, and the interface we use to interact with that data. So a computer is really a device, a database, and an interface. Three technologies; coupled, but not the same. If you had all your data and apps together in one interface, it would feel like “your whole computer” no matter which device it was running on. A personal computing environment.',
      'The interface is a medium, like print, radio, and television. But it’s a special kind of medium. It’s a dynamic hypermedium. That means it takes all the other kinds of media, absorbs them, and transforms them. A computer can display images, audio, film, and text. It can make them editable, and hyperlink parts of their content to other pieces of content. It can host conversations across great distances, and process or combine vast amounts of data in an endless variety of ways. It is fluid and programmable, and when it works just right it feels like magic.',
      '# A bicycle for the mind',
      'The idea that computers are to augment human intellect isn’t a cliché. It was the point of all the research and effort from the 40s to the 80s that went into making these extraordinary things. To help people learn, create, and coordinate more effectively, together, at scale. Just like the bicycle multiples the power of your body, the computer is meant to multiply the power of your mind and imagination.',
      'But ask yourself: when you open your computer, do you feel multiplied? Or do you feel swamped?',
      'For most of us, the answer is swamped. We open our computer with some particular task in mind, but the moment the screen lights up, we’re confronted with the Mess. Tabs spill out across multiple browsers, files multiply(2)_final and become inconsistent, screenshots and old projects litter the desktop.',
      'Everything is technically there, but nothing flows. Every oddly placed piece of content and unwanted notification is a nontrivial piece of cognitive interference getting between you, your attention, and what you’re trying to accomplish.',
      'The Mess is more than an inconvenience. It’s a potent cognitive toxin. Attention spans are collapsing — from 2.5 minutes in 2004 to about half a minute today. Knowledge workers lose at least half their potential productivity to digging for files, getting distracted, and reorienting themselves after losing focus. Beyond the lost productivity, distracted patterns of thought are shown to diminish overall cognitive performance while degrading psychological wellbeing.',
      'Douglas Engelbart, mouse and GUI inventor, asked us to imagine what would happen if pencils had always come with bricks strapped to them. You could still write, but slowly and clumsily. Tools shape what we achieve intellectually. The second and third order effects? If just making the letters takes effort, you lose capacity to write extensively or think deeply about them. Civilization itself would have evolved differently, and for the worse.',
      'We have a brick on our pencils today. It is the Mess in our computers, slowing us down like melted ice cream under our keys. Most knowledge workers experience it. It’s not a law of physics, or a fundamental problem with computers. Your computer is stressful and messy because macOS and Windows were designed 40 years ago, before AI or even the internet. Mainstream computing environments are aging, and based on assumptions that are no longer true.',
      'The Mess is a product of an outdated paradigm, and a sign that it is in crisis.',
      '# Thought experiment',
      'What if your computer organized itself? What if when you opened your computer, instead of (rudely) showing you everything you happened to have been working on when you closed it, your computer politely asked what you’d like to learn, do, or create? What if, instead of making you manually click through a bunch of files and apps one-by-one to get what you need, you told your computer what you want and it assembled everything you need for the task at hand?',
      'What are possible futures for personal computing? I hope my computer doesn’t take over my communication with loved ones or my serious engagement with ideas. I hope my computer will help me learn, write, give, collaborate and build. Help me juggle multiple things going on at once while staying focused and composed. And I hope that in the future, my computing experience is as elegant as sketching on an enchanted Midori notebook with a good pen, so that I can make full use of my personal knowledge garden alongside others.',
      'Using a computer today doesn’t always feel like this. That’s why we’re building Enai.',
      '# A calm, focused, interpersonal computer',
      'For the past 40 years, we have been iterating more and more sophisticated apps, web apps, and browsers within the same fundamental computing paradigm. Enai is not an app or a browser. Enai is not trying to do everything. It’s not even trying to accommodate any one specific workflow!',
      'Instead, Enai is a new end-to-end computing environment built with AI and the web at its core. It is a container for apps and, especially, for data. Everything is rendered in a browser engine, removing the artificial barrier between your device and the web. Your data is automatically parsed and embedded into a unified cognitive object model specifically designed as a mechanical extension of your mind. It understands associatively, and uses forgetting to focus. Then your data is electrified by AI interpreters and agents that continuously organize everything around your intent, so you can stay in the flow.',
      '# Why now',
      'In the 40 years that personal computing has been mainstream, a chasm has opened between the sophistication of the information inside computers, and the interfaces we use to interact with that information. Now, multiple enabling technologies (AI, web standards, and search tooling) have simultaneously reached viability, creating a window of opportunity. Three forces make it not only possible, but urgent, to seize the moment.',
      'First, the moat has collapsed. For decades, it’s been infeasible to develop a new computing environment because native apps have been indispensable. You would have had to build a whole OS. Now even IDEs are moving to the web, making native apps little more than a flaw in the information architecture. It’s feasible to build a web-based computing environment deeply designed around the needs of a premium audience while incumbents are chained to generic solutions for their massive market of everyone.',
      'Second, AI wants a container. Agentic workflows do not thrive in a fragmented environment that deprives them of context. Building the right environment for AI-first computing is an opportunity to shape and own the future of knowledge work.',
      'Third, user attitudes and behaviors are changing. Early adopters are already using ChatGPT “like an OS” while becoming increasingly aware of the addictive potential and attentional cost of computers. Thoughtful people are writing about the importance of attention and asking how AI will shape the future of computing and knowledge work. For this audience, we have an answer.',
      'We are in what Thomas Kuhn would call a paradigm shift. Bush imagined the Memex. Engelbart built the NLS. Kay sketched the Dynabook. Xerox produced the Alto. Apple popularized the Mac. Mosaic opened the web. Then came decades of “normal science” — refinements, aesthetics, marginal gains. But the cracks are everywhere. Cloud computing and AI have broken the paradigm. The Mess cannot hold.',
      'Alan Kay has said for years: the real computer revolution hasn’t happened yet. It’s time to make it happen.',
      '# The goal',
      'Our goal is to provide a calm, focused computing environment where everything is organized around your intent and attention. Enai is carefully designed to avoid the task interference, chaos, and distractions that plague legacy computing environments. By overcoming the attentional and cognitive impairments associated with modern computing, Enai has a chance to transform glowing misery rectangles into bicycles for the mind.',
      'A computing environment like Enai would be a relief for the researcher, product manager, architect, and writer currently lost in tab hell and struggling to focus. What’s interesting is that it’s not just those four. There are tens of millions of knowledge workers suffering from diminished attention, cognitive performance and productivity because their computing environment isn’t designed properly.',
      'These students and knowledge workers play a key role in shaping our present and future reality. If there can be shown a reasonable approach to unlocking their full potential, pursuing such an approach would warrant, as Douglas Engelbart put it, full pursuit by an enlightened society.',
      'Distraction isn’t a fundamental characteristic of the computing medium. The Mess is not a product of existing technical constraints, but of design choices made to support narrow engagement or not made at all. It is time to make better and more conscious decisions about how we’d like our computers to be.',
      '# Call to action',
      'The medium is the message: first we shape our tools, and then our tools shape us. I think there’s a good enough chance that we have a unique opportunity right now to fundamentally shape the most important tool in the world (computer) for the better, that I am devoting all of my personal and professional resources to try and make it happen.',
      'Building a company is difficult and sometimes painful. As an attempt to define a new product category, Enai is probably harder than average. But the idea of building in the direction of a future where the next generation of computing options aren’t just dopamine machines and thought replacers but also include options for those of us who care to maintain, grow, and extend our cognitive health has captured me.',
    ],
  },
];
