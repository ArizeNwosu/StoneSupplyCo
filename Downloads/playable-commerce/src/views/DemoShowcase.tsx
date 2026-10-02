import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Copy, Gamepad2, LoaderCircle, Mail, Monitor, Play, RotateCcw, Smartphone, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { CONTACT_EMAIL, isShowcaseDemoId, showcaseContactLink, showcaseDemos, type ShowcaseDemoId } from '../data/showcase';
import { HeroGameLoop } from '../components/HeroGameLoop';
import './demoShowcase.css';
import './demoShowcaseBrand.css';

function DemoArtwork({id}:{id:ShowcaseDemoId}){
  if(id==='swift-hockey')return <img src="/showcase/swift-poster.webp" alt="Swift Hockey’s playable goalie and four-corner target design" loading="lazy" width={390} height={844}/>;
  if(id==='reekon')return <img src="/showcase/reekon-poster.webp" alt="REEKON’s industrial digital tape measure and precision challenge" loading="lazy" width={800} height={1200}/>;
  if(id==='cyberbackpack')return <img src="/showcase/cyber-poster.webp" alt="Cyberbackpack's original combination-lock game screen" loading="lazy" width={390} height={844}/>;
  return <div className="sg-mini-split"><span className="sg-mini-wordmark">SPLITFLASK</span><span className="sg-mini-clock">10:00</span><strong>Try your luck</strong><p>Stop the clock at exactly <b>02:00</b><br/>to win a free Splitflask.</p><span className="sg-mini-cta">PUSH TO PLAY</span></div>;
}

function DemoPlayer({id,onClose}:{id:ShowcaseDemoId;onClose:()=>void}){
  const demo=showcaseDemos.find(item=>item.id===id)!;
  const dialog=useRef<HTMLDialogElement>(null),frame=useRef<HTMLIFrameElement>(null);
  const [wide,setWide]=useState(false),[revision,setRevision]=useState(0),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[copied,setCopied]=useState(false);
  const copyTimer=useRef<number|undefined>(undefined);
  useLayoutEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;
    dialog.current?.showModal();document.body.style.overflow='hidden';
    return()=>{dialog.current?.close();document.body.style.overflow=overflow;previous?.focus({preventScroll:true});clearTimeout(copyTimer.current);};
  },[]);
  useEffect(()=>{
    setReady(false);setFailed(false);
    const timer=window.setTimeout(()=>setFailed(true),15000);
    const message=(event:MessageEvent)=>{
      if(event.origin!==location.origin||event.source!==frame.current?.contentWindow||event.data?.source!=='playpopups-showcase'||event.data.game!==id)return;
      if(event.data.type==='ready'){clearTimeout(timer);setReady(true);setFailed(false);}
      if(event.data.type==='close')onClose();
      if(event.data.type==='contact')location.href=showcaseContactLink(demo.brand);
    };
    window.addEventListener('message',message);return()=>{clearTimeout(timer);window.removeEventListener('message',message);};
  },[id,revision,onClose,demo.brand]);
  const share=async()=>{
    const url=new URL('/demos',location.origin);url.searchParams.set('demo',id);
    try{await navigator.clipboard.writeText(url.toString());setCopied(true);clearTimeout(copyTimer.current);copyTimer.current=window.setTimeout(()=>setCopied(false),2400);}
    catch{setCopied(false);window.prompt('Copy this demo link',url.toString());}
  };
  return <dialog className="sg-player" ref={dialog} aria-labelledby="sg-player-title" onCancel={event=>{event.preventDefault();onClose();}}>
    <header className="sg-player-header"><div><span className="sg-kicker">THE PLAYABLE GALLERY</span><h2 id="sg-player-title">{demo.brand}</h2></div><button className="sg-icon-button" onClick={onClose} aria-label="Close demo gallery player"><X/></button></header>
    <div className="sg-player-layout"><aside className="sg-player-info"><span className="sg-tag">{demo.mechanic}</span><h3>{demo.title}</h3><p>{demo.instruction}</p>
      <div className="sg-player-tools"><div className="sg-view-toggle" aria-label="Preview width"><button aria-pressed={!wide} onClick={()=>setWide(false)}><Smartphone size={16}/>Phone</button><button aria-pressed={wide} onClick={()=>setWide(true)}><Monitor size={16}/>Wide</button></div>
        <button className="sg-tool" onClick={()=>setRevision(n=>n+1)}><RotateCcw size={16}/>Restart demo</button><button className="sg-tool" onClick={share}>{copied?<Check size={16}/>:<Copy size={16}/>}<span role="status">{copied?'Link copied':'Copy this demo link'}</span></button></div>
      <div className="sg-demo-note"><span className="sg-status-dot"/>Interactive demo, not a live offer.<p>Sample rewards and the email step are for demonstration only. No subscription, purchase, or real coupon.</p></div>
      <a className="sg-button sg-button--dark" href={showcaseContactLink(demo.brand)}>Build one for my store<ArrowUpRight size={18}/></a>
    </aside><div className={`sg-player-stage ${wide?'sg-player-stage--wide':''}`}>
      {!ready&&<div className="sg-player-loading" role="status">{failed?<><p>The demo is taking longer to load.</p><button className="sg-button" onClick={()=>setRevision(n=>n+1)}>Try again</button></>:<><LoaderCircle className="sg-spin"/>Loading {demo.brand}…</>}</div>}
      <iframe ref={frame} key={`${id}-${revision}`} src={`/demo-player.html?game=${id}`} title={`${demo.brand} playable demo`}
        sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" className={ready?'is-ready':''}/>
    </div></div>
  </dialog>;
}

export default function DemoShowcase(){
  const [search,setSearch]=useSearchParams();
  const selected=search.get('demo');const active=isShowcaseDemoId(selected)?selected:null;
  const [emailCopied,setEmailCopied]=useState(false);
  const timer=useRef<number|undefined>(undefined);
  useEffect(()=>{const previous=document.title;document.title='PlayItAgain — Four brands. Four playable experiences.';return()=>{document.title=previous;clearTimeout(timer.current);};},[]);
  const close=useRef(()=>{});close.current=()=>setSearch(params=>{params.delete('demo');return params;},{replace:true});
  // Stable close handler keeps the isolated player's load listener from restarting.
  const [closePlayer]=useState(()=>()=>close.current());
  const open=(id:ShowcaseDemoId)=>setSearch(params=>{params.set('demo',id);return params;});
  const copyEmail=async()=>{try{await navigator.clipboard.writeText(CONTACT_EMAIL);setEmailCopied(true);clearTimeout(timer.current);timer.current=window.setTimeout(()=>setEmailCopied(false),2500);}catch{window.prompt('Copy our email address',CONTACT_EMAIL);}};
  return <div className=”sg-page”>
    <a href=”#demos” className=”sg-skip”>Skip to playable demos</a>
    <header className=”sg-nav sg-wrap”><a className=”sg-brand” href=”/demos” aria-label=”PlayItAgain demo gallery”><span className=”sg-brand-mark”><Gamepad2 size={22}/></span>PlayItAgain<span className=”sg-brand-by”>by Social Gear</span></a>
      <nav aria-label=”Gallery navigation”><a href=”#demos”>The demos</a><a href=”#how-it-works” className=”sg-nav-secondary”>How it works</a><a className=”sg-nav-contact” href={showcaseContactLink()}>Let’s build yours<ArrowUpRight size={16}/></a></nav></header>
    <main>
      {/* ── Section 1: Hero ── */}
      <section className=”sg-hero sg-wrap”>
        <div className=”sg-hero-topline”>
          <span className=”sg-kicker”><span className=”sg-status-dot”/>THE INTERACTIVE POPUP PLATFORM</span>
        </div>
        <div className=”sg-hero-cols”>
          <div className=”sg-hero-copy”>
            <h1>27% of visitors<br/>played the game.<br/><span>3% clicked a normal popup.</span></h1>
            <p className=”sg-hero-sub”>Turn your product’s defining feature into a playable prize experience.</p>
            <div className=”sg-hero-ctas”>
              <a href=”#demos” className=”sg-button sg-button--blue”>Play the demos<ArrowDown size={18}/></a>
              <a className=”sg-button sg-button--outline” href={showcaseContactLink()}>Let’s build yours<ArrowUpRight size={18}/></a>
            </div>
          </div>
          <HeroGameLoop/>
        </div>
      </section>

      {/* ── Section 2: Social Proof Bar ── */}
      <section className=”sg-proof sg-wrap” aria-label=”Performance metrics”>
        <div className=”sg-proof-grid”>
          <div><strong>847K+</strong><span>games played</span></div>
          <div><strong>27.1%</strong><span>avg play rate</span></div>
          <div><strong>$2.4M</strong><span>attributed revenue</span></div>
          <div><strong>18.3%</strong><span>lead capture rate</span></div>
        </div>
      </section>

      {/* ── Section 3: Demo Gallery (upgraded) ── */}
      <section className=”sg-gallery sg-wrap” id=”demos” aria-labelledby=”sg-gallery-title”>
        <div className=”sg-section-heading”>
          <div>
            <p className=”sg-gallery-intro”>Four brands. Four product-specific games. All playable right now.</p>
            <h2 id=”sg-gallery-title”>Pick your first challenge.</h2>
          </div>
          <span>No signup needed to play<ArrowDown size={14}/></span>
        </div>
        <div className=”sg-demo-grid”>{showcaseDemos.map(demo=><article className={`sg-demo-card sg-demo-card--${demo.color}`} key={demo.id}>
          <button className=”sg-demo-art” aria-label={`Play ${demo.brand} demo`} onClick={()=>open(demo.id)}><DemoArtwork id={demo.id}/><span className=”sg-art-label”><span>{demo.number} / PLAYABLE</span><span className=”sg-art-play”><Play size={19} fill=”currentColor”/></span></span></button>
          <div className=”sg-card-body”><div className=”sg-card-title”><h3>{demo.brand}</h3><span>{demo.number}</span></div><p className=”sg-card-mechanic”>{demo.mechanic}</p><p>{demo.description}</p><button onClick={()=>open(demo.id)} className=”sg-play-link”>Play demo<ArrowUpRight size={19}/></button></div>
        </article>)}</div>
        <p className=”sg-gallery-caption”><span className=”sg-status-dot”/>These are playable demonstrations. Rewards and email capture are simulated; no purchase or signup is required.</p>
      </section>

      {/* ── Section 4: Before / After ── */}
      <section className=”sg-compare sg-wrap” aria-labelledby=”sg-compare-title”>
        <h2 id=”sg-compare-title”>Your current popup vs. a PlayItAgain experience.</h2>
        <div className=”sg-compare-grid”>
          <article className=”sg-compare-card sg-compare-card--before”>
            <span className=”sg-compare-label sg-compare-label--before”>BEFORE</span>
            <div className=”sg-compare-visual sg-compare-visual--before”>
              <div className=”sg-wheel” aria-hidden=”true”>
                <div className=”sg-wheel__segment sg-wheel__segment--1”/>
                <div className=”sg-wheel__segment sg-wheel__segment--2”/>
                <div className=”sg-wheel__segment sg-wheel__segment--3”/>
                <div className=”sg-wheel__segment sg-wheel__segment--4”/>
                <div className=”sg-wheel__pointer”/>
              </div>
            </div>
            <strong className=”sg-compare-stat”>~3% conversion</strong>
            <p>Same wheel on every store. Visitors close on reflex.</p>
          </article>
          <article className=”sg-compare-card sg-compare-card--after”>
            <span className=”sg-compare-label sg-compare-label--after”>AFTER</span>
            <div className=”sg-compare-visual sg-compare-visual--after”>
              <div className=”sg-minilock” aria-hidden=”true”>
                <span>3</span><span>1</span><span>4</span>
              </div>
            </div>
            <strong className=”sg-compare-stat”>27% play rate</strong>
            <p>Built around YOUR product. Visitors lean in.</p>
          </article>
        </div>
      </section>

      {/* ── Section 5: How It Works ── */}
      <section className=”sg-process sg-wrap” id=”how-it-works” aria-labelledby=”sg-process-title”>
        <h2 id=”sg-process-title”>From your store URL to a live game in one conversation.</h2>
        <div className=”sg-process-grid”>
          <article className=”sg-process-step”>
            <span className=”sg-process-num”>01</span>
            <h3>Send us your URL</h3>
            <p>We analyze your product, brand, and what makes it playable.</p>
          </article>
          <article className=”sg-process-step”>
            <span className=”sg-process-num”>02</span>
            <h3>Pick your game</h3>
            <p>We design 3 concepts specific to your product. You choose.</p>
          </article>
          <article className=”sg-process-step”>
            <span className=”sg-process-num”>03</span>
            <h3>Go live</h3>
            <p>One script tag. Works with Klaviyo, Shopify, any stack.</p>
          </article>
        </div>
      </section>

      {/* ── Section 6: What Makes This Different ── */}
      <section className=”sg-diff sg-wrap” aria-labelledby=”sg-diff-title”>
        <h2 id=”sg-diff-title”>Not a template. Not a wheel. Not a scratch card.</h2>
        <div className=”sg-diff-grid”>
          <article className=”sg-diff-card”>
            <h3>Brand-native design</h3>
            <p>Matches your store’s look, not a generic overlay.</p>
          </article>
          <article className=”sg-diff-card”>
            <h3>Product-driven mechanic</h3>
            <p>The game IS your product’s story.</p>
          </article>
          <article className=”sg-diff-card”>
            <h3>Klaviyo-native</h3>
            <p>Triggers your existing forms — no new email tool.</p>
          </article>
          <article className=”sg-diff-card”>
            <h3>Real analytics</h3>
            <p>Play rate, completion, revenue per impression.</p>
          </article>
        </div>
      </section>

      {/* ── Section 7: Final CTA ── */}
      <section className=”sg-contact sg-wrap” id=”contact” aria-labelledby=”sg-contact-title”>
        <div>
          <span className=”sg-kicker”>YOUR BRAND COULD BE NEXT</span>
          <h2 id=”sg-contact-title”>What would your<br/>customers love to play?</h2>
          <p>Send us your store URL. We’ll show you what’s playable about your product.</p>
          <a className=”sg-button sg-button--light” href={showcaseContactLink()}>Let’s build yours<ArrowUpRight size={20}/></a>
        </div>
        <div className=”sg-contact-side”>
          <span className=”sg-contact-symbol” aria-hidden=”true”><Gamepad2/></span>
          <a href={`mailto:${CONTACT_EMAIL}`}><Mail size={18}/>{CONTACT_EMAIL}</a>
          <button onClick={copyEmail}><Copy size={14}/><span role=”status”>{emailCopied?’Email copied’:’Copy email address’}</span></button>
          <small>Contact opens your email app.</small>
        </div>
      </section>
    </main>
    <footer className=”sg-footer sg-wrap”><span>PlayItAgain · by Social Gear</span><p>Brand-specific interactive demos. Sample offers are not redeemable.</p><a href=”#demos”>Back to the games<ArrowRight size={15}/></a></footer>
    {active&&<DemoPlayer key={active} id={active} onClose={closePlayer}/>}
  </div>;
}
