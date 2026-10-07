import { ArrowLeft } from './CustomIcons';

/**
 * Sticky bar under the navbar on inner screens:
 * back button · centered title (+ optional subtitle) · optional action (e.g. "Cancel").
 *
 *   <PageHeader title="Payment" onBack={goBack} backLabel="Back to settlements" />
 *
 * The notifications bell is in the navbar, which every logged-in screen shows.
 */
export const PageHeader = ({ title, subtitle, onBack, backLabel = 'Go back', backId, action }) => (
  <header className="page-header-bar">
    {onBack ? (
      <button type="button" className="icon-btn" onClick={onBack} aria-label={backLabel} title={backLabel} id={backId}>
        <ArrowLeft size={20} strokeWidth={2.2} />
      </button>
    ) : (
      <span className="page-header-spacer" aria-hidden="true" />
    )}

    <div className="page-header-center">
      <h2 className="page-header-title">{title}</h2>
      {subtitle && <span className="page-header-subtitle">{subtitle}</span>}
    </div>

    {action ? <div className="page-header-action">{action}</div> : <span className="page-header-spacer" aria-hidden="true" />}
  </header>
);

export default PageHeader;
