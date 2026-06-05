import React from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Library, Send, Image, Settings, Bell, Plus, Search, Grid2X2, List, Instagram, Linkedin, Facebook, Check, Zap, Users, CreditCard, Palette, PenLine, Clock, Rocket, Shield, Menu, Apple } from 'lucide-react';
import './styles.css';

const platforms = ['Instagram', 'TikTok', 'LinkedIn', 'X', 'Facebook'];
const saved = [
  ['Iced Coffee Summer Campaign', 'Instagram · 12 posts', 'visual-coffee'],
  ['Behind the Scenes', 'Instagram · 8 posts', 'visual-team'],
  ['Product Launch', 'X · 6 posts', 'visual-product'],
  ['Summer Vibes', 'LinkedIn · 10 posts', 'visual-sunset'],
  ['Client Success Story', 'LinkedIn · 7 posts', 'visual-client'],
  ['Tips & Tricks', 'TikTok · 9 posts', 'visual-camera'],
];
const queue = [
  ['Iced coffee > bad moods.', 'Instagram', 'Jun 3, 10:00 AM', 'Scheduled'],
  ['Good coffee. Good mood. Good day.', 'TikTok', 'Jun 3, 12:30 PM', 'Ready'],
  ['3 reasons iced coffee is better in summer', 'LinkedIn', 'Jun 4, 9:00 AM', 'Draft'],
  ['Fuel your summer ☕', 'Instagram Story', 'Jun 5, 8:00 AM', 'Ready'],
];

function Logo({ large = false }: { large?: boolean }) {
  return <div className={`logo ${large ? 'logoLarge' : ''}`}>
    <span className="logoMark"><i></i><i></i><i></i></span><span className="wordmark">MINT</span>
  </div>;
}
function Button({ children, variant='primary' }: { children: React.ReactNode; variant?: 'primary'|'ghost' }) {
  return <button className={`btn ${variant}`}>{children}</button>;
}
function PlatformIcon({ name }: { name: string }) {
  const icons:any = { Instagram:<Instagram/>, LinkedIn:<Linkedin/>, Facebook:<Facebook/>, X:<span className="xicon">𝕏</span>, TikTok:<span className="xicon">♪</span> };
  return <span className="platform" title={name}>{icons[name] || <Plus/>}</span>;
}
function Card({ children, className='' }: { children: React.ReactNode; className?: string }) { return <div className={`card ${className}`}>{children}</div>; }
function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) { return <div className="sectionTitle">{eyebrow && <p>{eyebrow}</p>}<h2>{title}</h2></div>; }

function Landing() {
  return <section className="panel landing">
    <nav className="topnav"><Logo/><div className="navlinks"><a>Product</a><a>Use Cases</a><a>Resources</a><a>Pricing</a><a>About</a></div><div className="navActions"><Button variant="ghost">Sign in</Button><Button>Start Creating</Button></div><Menu className="mobileMenu"/></nav>
    <div className="hero">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.7}} className="heroCopy">
        <span className="pill">AI CONTENT STUDIO</span>
        <h1>Create social content at the <span>speed of light.</span></h1>
        <p>Turn one raw idea into ready-to-post strategy, captions, visuals, and scheduling in minutes.</p>
        <div className="ctaRow"><Button>Start Creating</Button><Button variant="ghost">See How It Works ▶</Button></div>
        <div className="trust"><span className="avatars">● ● ● ● ●</span><span>Trusted by creators, teams & agencies · ★★★★★ 4.9/5</span></div>
      </motion.div>
      <motion.div className="heroOrb" initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:.9}}>
        <Logo large />
        {platforms.map((p,i)=><motion.div className={`floatIcon f${i}`} key={p} animate={{y:[0,-10,0]}} transition={{duration:3+i*.4,repeat:Infinity}}><PlatformIcon name={p}/></motion.div>)}
      </motion.div>
    </div>
    <div className="workflow"><SectionTitle eyebrow="THE MINT WORKFLOW" title="From idea to impact in minutes."/><div className="steps">{[['Share Your Idea',PenLine],['AI Creates',Sparkles],['Refine & Save',Library],['Schedule & Publish',Calendar]].map(([t,I]:any,i)=><div className="step" key={t}><I/><b>{i+1}. {t}</b><span>{['Tell us about your concept or campaign.','Generate post ideas, captions and visuals.','Edit, adjust and save your favorites.','Queue, schedule and publish across platforms.'][i]}</span></div>)}</div></div>
    <div className="features">{[['AI Content Generation',Sparkles],['AI Image Studio',Image],['Content Library',Library],['Smart Scheduling',Clock],['Multi-Platform Ready',Send],['Team Collaboration',Users]].map(([t,I]:any)=><Card key={t} className="feature"><I/><b>{t}</b><span>{featureText(t)}</span></Card>)}</div>
  </section>
}
function featureText(t:string){return ({'AI Content Generation':'Ideas, captions, hashtags and strategy in seconds.','AI Image Studio':'Visual directions and image concepts tailored to your brand.','Content Library':'Save, organize and reuse your best content.','Smart Scheduling':'Plan, queue and publish at the perfect time.','Multi-Platform Ready':'Optimized formats for Instagram, TikTok, LinkedIn, X and Facebook.','Team Collaboration':'Review, approve and move faster together.'} as any)[t]}

function Sidebar(){const items=[['Studio',Sparkles],['Library',Library],['Queue',Send],['Calendar',Calendar],['Inspiration',Palette],['Settings',Settings]];return <aside className="sidebar"><Logo/>{items.map(([t,I]:any,i)=><a className={i===0?'active':''} key={t}><I/>{t}</a>)}<div className="sideBottom"><a><Settings/> Help & Support</a><div className="profile"><span className="avatar">J</span><div><b>Jane Cooper</b><small>Pro Plan</small></div></div></div></aside>}
function Studio(){return <section className="panel app"><Sidebar/><main className="workspace"><header className="appTop"><div><h2>Good morning, Jane 👋</h2><p>What are we creating today?</p></div><div><button className="upgrade"><Zap/> Upgrade Plan</button><Bell/><span className="avatar">J</span></div></header><Card className="createBox"><label>Describe your campaign or business idea...</label><input defaultValue="Summer campaign for our new iced coffee launch"/><div className="controls"><select defaultValue="Young adults (18-30)"><option>Young adults (18-30)</option></select><select defaultValue="Increase brand awareness"><option>Increase brand awareness</option></select><select defaultValue="Fun, fresh, energetic"><option>Fun, fresh, energetic</option></select></div><div className="createFooter"><div className="platforms">{platforms.slice(0,4).map(p=><PlatformIcon name={p} key={p}/>) }<PlatformIcon name="plus"/></div><Button><Sparkles/> Generate Campaign</Button></div></Card><Generated/></main></section>}
function Generated(){const outputs=[['Post Idea','Iced coffee > bad moods.','Show the transformation from sleepy morning to energized, ready-to-go you.'],['Caption','Good coffee. Good mood. Good day. ✨','Fuel your summer with our new iced coffee. #MintCoffee #IcedToWin'],['Hashtags','#MintCoffee\n#IcedToWin\n#SummerFuel\n#CoffeeLovers\n#StayCool',''],['Visual','Refreshment in every sip.','Cinematic product shot with mint leaves, splash, glow.'],['AI Image','', 'Generated hero image preview']];return <div className="generated"><div className="sectionLine"><h3>Your generated content</h3><span>Just now</span><button>View all</button></div><div className="outputGrid">{outputs.map(([h,a,b],i)=><Card className={i>2?'imageCard':''} key={h}><h4>{h}</h4>{i>2?<div className={`preview p${i}`}>{a}</div>:<><b>{a}</b><p>{b}</p></>}<div className="cardActions">↗ ⧉ ♡</div></Card>)}</div><div className="actionRow"><Button variant="ghost">Save to Library</Button><Button>Add to Queue</Button></div></div>}
function LibraryPage(){return <section className="miniPanel"><div className="miniHead"><h2>Library</h2><div><Search/><Grid2X2/><List/></div></div><div className="tabs"><span className="active">All</span><span>Campaigns</span><span>Posts</span><span>Images</span><span>Captions</span></div><div className="libraryGrid">{saved.map((s,i)=><Card className="libraryCard" key={s[0]}><div className={`thumb ${s[2]}`}></div><b>{s[0]}</b><small>{s[1]}</small></Card>)}</div></section>}
function QueuePage(){return <section className="miniPanel"><div className="miniHead"><h2>Queue</h2><Button><Plus/> New Post</Button></div><div className="tabs"><span className="active">All</span><span>Draft</span><span>Ready</span><span>Scheduled</span><span>Published</span></div>{queue.map(q=><div className="queueRow" key={q[0]}><div className="tinyThumb"></div><div><b>{q[0]}</b><small>{q[1]} · {q[2]}</small></div><span className={`status ${q[3].toLowerCase()}`}>{q[3]}</span></div>)}</section>}
function CalendarPage(){const posts=['Iced coffee > bad moods.','','','Client success story','','Behind the scenes','','','','Summer vibes only ✨','','New flavor alert'];return <section className="miniPanel"><div className="miniHead"><h2>Calendar</h2><div><button className="chip active">Month</button><button className="chip">Week</button></div></div><h3>June 2024</h3><div className="calendarGrid">{Array.from({length:35}).map((_,i)=><div className="date" key={i}><small>{i+1}</small>{posts[i%posts.length]&&<span>{posts[i%posts.length]}</span>}</div>)}</div></section>}
function MobilePreview(){return <section className="miniPanel mobilePreview"><h2>Mobile App</h2><div className="phones">{['Create at the speed of light.','Studio','Generated','Library','Queue'].map((t,i)=><div className="phone" key={t}><Logo/><h3>{t}</h3>{i===0?<><p>AI turns ideas into content people love.</p><Button>Start Creating</Button></>:<div className="phoneCard"></div>}</div>)}</div></section>}
function AuthPricingSettings(){return <section className="bottomGrid"><Card><h2>Auth</h2><div className="authCards"><div><Logo/><h3>Welcome back</h3><Button variant="ghost">G Continue with Google</Button><Button variant="ghost"><Apple/> Continue with Apple</Button><input placeholder="Email address"/><Button>Continue</Button></div><div><Logo/><h3>Create your account</h3><input placeholder="Full name"/><input placeholder="Email address"/><input placeholder="Password"/><Button>Create account</Button></div></div></Card><Card><h2>Pricing</h2><div className="pricing">{['Starter $19','Pro $49','Business $99'].map((p,i)=><div className={i===1?'plan hot':'plan'} key={p}><h3>{p}</h3><p>/month</p><ul><li><Check/> AI content generation</li><li><Check/> Image generation</li><li><Check/> Queue & calendar</li></ul><Button>Start free trial</Button></div>)}</div></Card><Card><h2>Settings</h2><div className="settings"><nav>{['Profile','Workspace','Billing','Team','Integrations','Preferences','Notifications'].map(x=><a key={x}>{x}</a>)}</nav><div><span className="avatar big">J</span><h3>Jane Cooper</h3><p>Workspace: Mint Studio</p><p>Theme: Dark</p><p>Timezone: UTC-05:00</p></div></div></Card></section>}
function App(){return <><div className="bg"><span></span><span></span></div><Landing/><Studio/><div className="three"><LibraryPage/><QueuePage/><CalendarPage/></div><MobilePreview/><AuthPricingSettings/><footer><Logo/><p>Create at the speed of light.</p></footer></>}

createRoot(document.getElementById('root')!).render(<App/>);
