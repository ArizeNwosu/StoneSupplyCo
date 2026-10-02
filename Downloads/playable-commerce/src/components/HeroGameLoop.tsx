import './heroGameLoop.css';

export function HeroGameLoop() {
  return (
    <div className="hero-phone" aria-hidden="true">
      <div className="hero-phone__screen">
        <div className="hero-rink hero-rink--animated">
          {/* Headline overlay */}
          <div className="hero-headline">
            <p className="hero-headline__title">THINK YOU'VE GOT A<br/><strong style={{color:'#f01923',fontSize:'13px'}}>QUICK RELEASE?</strong></p>
            <p className="hero-headline__sub">Hit the corner before the goalie reacts</p>
          </div>

          {/* Net */}
          <div className="hero-net" />

          {/* Four corner targets */}
          <div className="hero-targets">
            <div className="hero-target hero-target--tl"><span className="hero-target__ring" /></div>
            <div className="hero-target hero-target--tr"><span className="hero-target__ring" /></div>
            <div className="hero-target hero-target--bl"><span className="hero-target__ring" /></div>
            <div className="hero-target hero-target--br"><span className="hero-target__ring" /></div>
          </div>

          {/* Puck */}
          <div className="hero-puck" />

          {/* Result overlay */}
          <div className="hero-result">
            <span className="hero-result__time">247 MS</span>
            <span className="hero-result__goal">GOAL!</span>
            <span className="hero-result__reward">YOU UNLOCKED 15% OFF</span>
          </div>

          {/* Mini CTA */}
          <div className="hero-minicta">TAKE THE SHOT</div>
        </div>
      </div>
    </div>
  );
}
