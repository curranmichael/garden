import { BIO_TOP } from '@/lib/home/geometry';

/** Bio block; stays put while the rising panel covers it. */
export default function Bio() {
  return (
    <div
      className="absolute z-10 text-xl leading-[26px] text-muted"
      style={{
        top: BIO_TOP,
        left: 'calc(var(--gutter) + var(--inset))',
        right: 'calc(var(--gutter) + var(--inset))',
        maxWidth: 746,
      }}
    >
      <p>
        Building{' '}
        <a
          href="https://enai.io"
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto relative inline-block"
        >
          Enai
          <img
            src="/underlines/enai.svg"
            alt=""
            width={45}
            height={7}
            className="pointer-events-none absolute -left-[3px] top-[23px] max-w-none"
          />
        </a>
        , a computer that organizes itself for you.
        <br className="hidden lg:inline" /> I&rsquo;m interested in media
        design as it relates to attention and phenomenology in general.
        <br className="hidden lg:inline" /> How might the computing medium be
        designed to promote deeper attention?
      </p>
    </div>
  );
}
