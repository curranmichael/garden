import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  return (
    <>
      <ThemeToggle />
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-24">
        <p className="font-serif text-2xl font-light leading-snug text-foreground sm:text-[2rem] sm:leading-snug">
          Researching how to live a beautiful life that honors
          the time we have in this world.
        </p>

        <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
          <p>
            I&rsquo;m building Enai, a calm computer that organizes itself for you. 
          </p>
          <p>
            Attention, media design, and phenomenology are primary focus areas
            of my research. I&rsquo;m also asking how human and
            machine intelligences will exist symbiotically, and how
            artificial intelligence can be introduced into a computer interface
            in a way that extends the ability of people to connect and engage
            with other people in ways that might be meaningful to them.
          </p>
        </div>
      </main>
    </>
  );
}
