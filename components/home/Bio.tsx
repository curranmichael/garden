import Underline from './Underline';

/** Bio block; part of the still landing. Its line-ends soften under the
 *  progressive blur when a section is open. */
export default function Bio() {
  return (
    <div
      className="absolute z-10 text-xl leading-[26px] text-muted"
      style={{
        top: 'var(--bio-top)',
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
          className="group pointer-events-auto relative inline-block"
        >
          Enai
          <Underline src="/underlines/enai.svg" width={45} height={7} />
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
