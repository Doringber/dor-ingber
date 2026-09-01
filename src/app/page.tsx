import { WorkCard } from "@/components/work-card";
import { WritingCard } from "@/components/writing-card";
import { getWorks } from "@/lib/works";
import { formatNoteNumber, getWriting } from "@/lib/writing";

export default function Home() {
  const works = getWorks().slice(0, 3);
  const notes = getWriting().slice(0, 2);

  return (
    <main>
      <section className="hero">
        <div className="site-wrap">
          <p className="kicker hero-kicker">FILMS · NOTES</p>
          <h1 className="hero-wordmark">Dor Ingber</h1>
          <div className="hero-lede">
            <p dir="rtl" lang="he">
              סרטי AI והערות.
            </p>
            <p className="hero-lede-en" dir="ltr" lang="en">
              AI films and notes.
            </p>
          </div>
        </div>
      </section>

      <section id="work" className="section">
        <div className="site-wrap">
          <div className="section-head">
            <p className="kicker">WORK · {formatNoteNumber(works.length - 1)}</p>
          </div>
          <div className="work-grid">
            {works.map((work) => (
              <WorkCard key={work.slug} work={work} />
            ))}
          </div>
        </div>
      </section>

      <section id="writing" className="section">
        <div className="site-wrap">
          <div className="section-head">
            <p className="kicker">
              WRITING · {formatNoteNumber(notes.length - 1)}
            </p>
          </div>
          <div className="writing-grid">
            {notes.map((note, index) => (
              <WritingCard key={note.slug} note={note} index={index} />
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-wrap">DOR INGBER · 2026</div>
      </footer>
    </main>
  );
}
