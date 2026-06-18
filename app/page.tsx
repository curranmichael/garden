import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  return (
    <>
      <ThemeToggle />
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-24">
        <p className="font-serif text-2xl font-light leading-snug text-sand-12 sm:text-[2rem] sm:leading-snug">
          I&rsquo;m learning what it means to live a beautiful life that honors
          the time we have in this world.
        </p>

        <div className="mt-10 space-y-6 text-base leading-relaxed text-sand-11 sm:text-lg">
          <p>
            Enai, the new personal computer I&rsquo;m building, attempts to
            create a computing environment that can contribute to a well-lived
            life.
          </p>
          <p>
            Attention, media design, and phenomenology are primary focus areas
            of my research. These days I&rsquo;m also asking about how human and
            machine intelligences might work symbiotically together, and how
            artificial intelligence can be introduced into a computer interface
            in a way that extends the ability of people to connect and engage
            with other people in ways that might be meaningful to them.
          </p>
        </div>
      </main>
    </>
  );
}
