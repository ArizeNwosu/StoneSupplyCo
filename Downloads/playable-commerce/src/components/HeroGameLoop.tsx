import './heroGameLoop.css';

export function HeroGameLoop() {
  return (
    <div className="hero-phone" aria-hidden="true">
      <div className="hero-phone__screen">
        {/* Layer 1: Intro poster (visible at start, fades out during play) */}
        <img src="/showcase/swift-poster.webp" alt="" className="hero-phone__poster hero-anim-intro" />

        {/* Layer 2: Game scene (fades in during play) */}
        <img src="/showcase/swift-scene.webp" alt="" className="hero-phone__scene hero-anim-scene" />

        {/* Layer 3: Animated game overlays on top of scene */}
        <div className="hero-anim">
          {/* Countdown */}
          <div className="hero-anim__countdown"><span className="hero-anim__count3">3</span><span className="hero-anim__count2">2</span><span className="hero-anim__count1">1</span></div>

          {/* Active target pulse — top-right corner matching actual game position */}
          <div className="hero-anim__target" />

          {/* SHOOT! callout */}
          <div className="hero-anim__shoot">SHOOT!</div>

          {/* Goal flash */}
          <div className="hero-anim__flash" />

          {/* Result overlay */}
          <div className="hero-anim__result">
            <span className="hero-anim__eyebrow">YOUR RELEASE</span>
            <span className="hero-anim__goal">GOAL!</span>
            <span className="hero-anim__time">247<small> MS</small></span>
            <span className="hero-anim__msg">Quick hands. Quick release.</span>
            <span className="hero-anim__unlocked">YOU UNLOCKED</span>
            <span className="hero-anim__reward">15% OFF</span>
          </div>
        </div>
      </div>
    </div>
  );
}
