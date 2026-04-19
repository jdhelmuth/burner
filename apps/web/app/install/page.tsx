export default function InstallPage() {
  return (
    <main className="app-shell">
      <header className="masthead">
        <span className="eyebrow">install burner</span>
        <h1>Web first. YouTube first.</h1>
        <p className="install-copy">
          Burner’s sender flow and mystery receiver experience both work directly in the browser now. Paste YouTube
          songs, arrange the disc, and play reveals inline without needing a companion app.
        </p>
      </header>
      <section className="panel install-grid">
        <article>
          <span className="eyebrow">ios</span>
          <h2>Optional</h2>
          <p className="install-copy">A future companion app can still matter for shortcuts, notifications, and share-sheet polish.</p>
        </article>
        <article>
          <span className="eyebrow">android</span>
          <h2>Optional</h2>
          <p className="install-copy">The core Burner workflow no longer depends on native playback handoff or separate provider apps.</p>
        </article>
        <article>
          <span className="eyebrow">web</span>
          <h2>Main product</h2>
          <p className="install-copy">Create burners, publish secret links, and unlock YouTube tracks directly in the browser.</p>
        </article>
      </section>
    </main>
  );
}
