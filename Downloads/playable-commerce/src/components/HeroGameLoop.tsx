import './heroGameLoop.css';

export function HeroGameLoop() {
  return (
    <div className="hero-phone" aria-hidden="true">
      <div className="hero-phone__screen">
        <img src="/showcase/swift-poster.webp" alt="" className="hero-phone__poster" />
        <div className="hero-anim">
          <div className="hero-anim__glow hero-anim__glow--tr" />
          <div className="hero-anim__puck" />
          <div className="hero-anim__flash" />
          <div className="hero-anim__result">
            <span className="hero-anim__time">247 MS</span>
            <span className="hero-anim__goal">GOAL!</span>
            <span className="hero-anim__reward">YOU UNLOCKED 15% OFF</span>
          </div>
        </div>
      </div>
    </div>
  );
}
