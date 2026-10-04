import mascotImg from '../assets/mascot.png';
import { 
  Globe, 
  Calendar, 
  ReceiptIcon, 
  CalculatorIcon, 
  HandshakeIcon
} from './CustomIcons';

export const LandingPage = ({ onStartSaving, onOpenAuth, onOpenDashboard, isLoggedIn = false }) => {
  return (
    <div className="landing-page-container">
      {/* Top Header / Brand */}
      <header className="landing-header">
        <div className="navbar-brand landing-brand">
          <span className="mascot-avatar-wrapper">
            <img src={mascotImg} alt="" className="mascot-avatar-img" />
          </span>
          <span className="brand-name">Gastosaurus</span>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => (isLoggedIn ? onOpenDashboard?.() : onOpenAuth?.('login'))}
        >
          {isLoggedIn ? 'Go to Dashboard' : 'Log In'}
        </button>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-content">
          <div className="hero-text-col">
            <h1 className="hero-title">
              Master Your Budget, <span className="hero-title-accent">Effortlessly.</span>
            </h1>
            <p className="hero-subtitle">
              Track expenses, save smarter, and take control of your finances.
            </p>
            <button 
              className="btn btn-primary btn-lg btn-start-saving"
              onClick={() => onStartSaving?.()}
              id="start-saving-btn"
            >
              Start Saving
            </button>
          </div>

          <div className="hero-visual-col">
            <div className="mascot-badge-circle animate-float">
              <img 
                src={mascotImg} 
                alt="Gastosaurus mascot hugging a piggy bank" 
                className="hero-mascot-img" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Middle White Strip: Smart Categorization & Bill Reminders */}
      <section className="landing-features-strip">
        <div className="features-strip-inner">
          {/* Feature 1 */}
          <div className="feature-strip-item">
            <div className="feature-strip-icon-wrapper">
              <Globe size={42} strokeWidth={1.5} className="feature-strip-icon" />
            </div>
            <div className="feature-strip-text">
              <h2 className="feature-strip-title">Smart Categorization</h2>
              <p className="feature-strip-desc">
                Clarifies and gamifies money's categorization to expenses.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="feature-strip-item">
            <div className="feature-strip-icon-wrapper">
              <Calendar size={42} strokeWidth={1.5} className="feature-strip-icon" />
            </div>
            <div className="feature-strip-text">
              <h2 className="feature-strip-title">Bill Reminders</h2>
              <p className="feature-strip-desc">
                Gentle nudges before a bill is due, so nobody has to chase the barkada for payments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: 3 Feature Cards (Itemized Ambagan, Auto-Balance, Easy Settle-Up) */}
      <section className="landing-bottom-cards-section">
        <div className="bottom-cards-grid">
          {/* Card 1: Itemized Ambagan */}
          <div className="feature-card">
            <div className="card-icon-box">
              <ReceiptIcon size={24} color="#1E2026" />
            </div>
            <div className="card-body">
              <h3 className="card-title">Itemized Ambagan</h3>
              <p className="card-text">
                I-tag na 'yung palaging may extra rice at extra Coke Float sa order, automatic na ang re-compute. Wala nang 'ay mali yata bilang ko'.
              </p>
            </div>
          </div>

          {/* Card 2: Auto-Balance */}
          <div className="feature-card">
            <div className="card-icon-box">
              <CalculatorIcon size={24} color="#1E2026" />
            </div>
            <div className="card-body">
              <h3 className="card-title">Auto-Balance</h3>
              <p className="card-text">
                Paalam na, Google Sheets puno ng #REF! error. Kami na ang bahala sa hirap ng math, mas komplikado pa 'to kaysa sa 'kayo ba o hindi' status niyo ni crush.
              </p>
            </div>
          </div>

          {/* Card 3: Easy Settle-Up */}
          <div className="feature-card">
            <div className="card-icon-box">
              <HandshakeIcon size={24} color="#1E2026" />
            </div>
            <div className="card-body">
              <h3 className="card-title">Easy Settle-Up</h3>
              <p className="card-text">
                Alamin agad kung sino may utang, isang tap lang. Kasi wala nang mas nakakasira ng tropa kaysa 'bukas na lang bayad ko' na di natutupad.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
