'use client';

import { useState } from 'react';

const sections = ['Inspiration', 'Diary', 'Reading', 'About'] as const;
const placeholders = Array.from({ length: 20 }, (_, index) => index);

type ViewState = 'landing' | 'preview' | 'open';

export default function GardenExperience() {
  const [viewState, setViewState] = useState<ViewState>('landing');
  const isOpen = viewState === 'open';

  function previewInspiration() {
    if (!isOpen) setViewState('preview');
  }

  function dismissPreview() {
    if (!isOpen) setViewState('landing');
  }

  return (
    <main className="garden-page" data-view={viewState}>
      <section className="garden-intro" aria-labelledby="garden-owner">
        <h1 id="garden-owner" className="garden-identity">
          <span>Curran Dwyer,</span>{' '}
          <em>a software designer and founder</em>
        </h1>

        <div className="garden-description">
          <p>
            Building <span className="garden-enai">Enai</span>, a computer that
            organizes itself for you.
          </p>
          <p>
            I&rsquo;m interested in media design as it relates to attention and
            phenomenology in general.
          </p>
          <p>
            How might the computing medium be designed to promote deeper
            attention?
          </p>
        </div>
      </section>

      <section
        id="inspiration"
        className="garden-workspace"
        aria-label="Garden sections"
        onMouseLeave={dismissPreview}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            dismissPreview();
          }
        }}
      >
        <nav className="garden-navigation" aria-label="Primary">
          <ul>
            {sections.map((section) => (
              <li key={section} className={section === 'Inspiration' ? 'is-current' : undefined}>
                {section === 'Inspiration' ? (
                  <button
                    type="button"
                    aria-pressed={isOpen}
                    onMouseEnter={previewInspiration}
                    onFocus={previewInspiration}
                    onClick={() => setViewState('open')}
                  >
                    {section}
                  </button>
                ) : (
                  <span aria-disabled="true">{section}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="garden-surface" aria-hidden={!isOpen}>
          <div className="garden-placeholder-grid">
            {placeholders.map((placeholder) => (
              <div className="garden-placeholder" key={placeholder} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
