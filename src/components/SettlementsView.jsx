import { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, ArrowRight } from 'lucide-react';
import Avatar from './Avatar';
import { meApi, groupsApi, settlementsApi } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { peso, METHOD_LABELS } from '../lib/format';

/**
 * Turn the API's settle-up data into table rows.
 *   owe      → a suggested payment you should make            [Pay]
 *   owed     → a suggested payment someone should make to you [Mark received]
 *   confirm  → someone says they paid you; confirm it          [Confirm]
 *   pending  → you paid; waiting for them to confirm           [Undo]
 *   paid     → completed payments                              (no action)
 */
function toRows(data) {
  if (!data) return [];
  return [
    ...data.toPay.map((p) => ({
      id: `owe-${p.group.id}-${p.to.memberId}`,
      kind: 'owe',
      person: p.to,
      description: p.group.name,
      group: p.group,
      amount: p.amount,
      unpaid: p.amount,
      paid: 0,
    })),
    ...data.awaitingMyConfirmation.map((s) => ({
      id: s.id,
      kind: 'confirm',
      person: s.from,
      description: `${s.group.name} · says paid via ${METHOD_LABELS[s.method]}`,
      settlement: s,
      amount: s.amount,
      unpaid: s.amount,
      paid: 0,
    })),
    ...data.toReceive.map((p) => ({
      id: `owed-${p.group.id}-${p.from.memberId}`,
      kind: 'owed',
      person: p.from,
      description: p.group.name,
      group: p.group,
      amount: p.amount,
      unpaid: p.amount,
      paid: 0,
    })),
    ...data.awaitingTheirConfirmation.map((s) => ({
      id: s.id,
      kind: 'pending',
      person: s.to,
      description: `${s.group.name} · ${METHOD_LABELS[s.method]}, waiting for ${s.to.name} to confirm`,
      settlement: s,
      amount: s.amount,
      unpaid: 0,
      paid: s.amount,
    })),
    ...data.recent.map((s) => {
      const outgoing = s.from.isCurrentUser;
      return {
        id: s.id,
        kind: 'paid',
        person: outgoing ? s.to : s.from,
        description: `${s.group.name} · ${outgoing ? 'you paid' : 'paid you'} via ${METHOD_LABELS[s.method]}`,
        amount: s.amount,
        unpaid: 0,
        paid: s.amount,
      };
    }),
  ];
}

const FILTERS = {
  all: () => true,
  owed: (r) => r.kind === 'owed' || r.kind === 'confirm',
  owe: (r) => r.kind === 'owe',
  paid: (r) => r.kind === 'paid' || r.kind === 'pending',
};

const BADGES = {
  owe: ['badge-owe', 'YOU OWE'],
  owed: ['badge-owed', 'OWED TO YOU'],
  confirm: ['badge-owed', 'CONFIRM'],
  pending: ['badge-paid', 'PENDING'],
  paid: ['badge-paid', 'PAID'],
};

const ACTION_LABELS = { owe: 'Pay', owed: 'Mark received', confirm: 'Confirm', pending: 'Undo', paid: 'Paid' };

export const SettlementsView = ({ refreshKey, onNavigatePayment, onViewGroupMembers, onChanged, showToast }) => {
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const { data, error, loading } = useAsync(() => meApi.settleUp(), [refreshKey]);

  const rows = toRows(data);
  const filteredRows = rows.filter(FILTERS[filter]);
  const payRows = rows.filter((r) => r.kind === 'owe');

  const act = async (row) => {
    if (row.kind === 'owe') return onNavigatePayment([row]);
    if (row.kind === 'paid') return undefined;

    if (row.kind === 'owed' && !window.confirm(`Record that ${row.person.name} paid you ${peso(row.amount)} in ${row.group.name}?`)) {
      return undefined;
    }
    if (row.kind === 'pending' && !window.confirm(`Withdraw your ${peso(row.amount)} payment to ${row.person.name}?`)) {
      return undefined;
    }

    setBusyId(row.id);
    try {
      if (row.kind === 'owed') {
        await settlementsApi.record(row.group.id, {
          fromMemberId: row.person.memberId,
          toMemberId: row.group.myMemberId,
          amount: row.amount,
          method: 'cash',
        });
        showToast(`Recorded ${peso(row.amount)} from ${row.person.name} ✅`);
      } else if (row.kind === 'confirm') {
        await settlementsApi.confirm(row.settlement.id);
        showToast(`Confirmed ${peso(row.amount)} from ${row.person.name} ✅`);
      } else if (row.kind === 'pending') {
        await settlementsApi.remove(row.settlement.id);
        showToast('Payment withdrawn.');
      }
      onChanged();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
    return undefined;
  };

  const handleSettleAll = () => {
    if (!payRows.length) return showToast("You don't owe anyone right now. 🎉");
    return onNavigatePayment(payRows);
  };

  const handleSendReminders = async () => {
    const groupIds = [...new Set((data?.toReceive ?? []).map((p) => p.group.id))];
    if (!groupIds.length) return showToast('Nobody owes you right now. 🎉');
    try {
      const results = await Promise.all(groupIds.map((id) => groupsApi.sendReminders(id)));
      const sent = results.reduce((n, r) => n + r.sent.length, 0);
      const skipped = results.flatMap((r) => r.skipped);
      if (sent) showToast(`Sent ${sent} reminder${sent === 1 ? '' : 's'} 📬`);
      else if (skipped.some((x) => x.reason === 'recently_reminded')) showToast('Already reminded in the last 12 hours.');
      else showToast('Only guests owe you — they have no account to notify.');
    } catch (err) {
      showToast(err.message, 'error');
    }
    return undefined;
  };

  const renderBadge = (row) => {
    const [cls, label] = BADGES[row.kind];
    return <span className={`status-badge-pill ${cls}`}>{label}</span>;
  };

  const renderAction = (row, idPrefix) => (
    <button
      className={`btn btn-sm ${row.kind === 'paid' ? 'btn-muted' : 'btn-primary'}`}
      onClick={() => act(row)}
      disabled={row.kind === 'paid' || busyId === row.id}
      id={`${idPrefix}-${row.id}`}
    >
      {busyId === row.id ? '…' : ACTION_LABELS[row.kind]}
    </button>
  );

  const emptyText = loading && !data ? 'Loading…' : error ? error.message : 'Nothing here yet — you are all settled. 🦖';

  return (
    <div className="settlements-page-container animate-fade-in">
      <div className="page-intro">
        <div className="page-intro-text">
          <h1 className="page-title">Balances &amp; Settlement</h1>
          <p className="page-subtitle">Manage your shared expenses and open tabs seamlessly.</p>
        </div>
      </div>

      <div className="settlements-summary-grid">
        <div className="settlement-stat-card card-owe">
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="eyebrow">Total you owe</span>
              <div className="stat-card-amount owe-amount">{peso(data?.totalToPay ?? 0)}</div>
            </div>
            <div className="stat-card-icon-wrap owe-arrow">
              <div className="arrow-circle-badge owe">
                <ArrowUpRight size={24} strokeWidth={2.4} />
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSettleAll} id="btn-settle-all-debts">
            Settle All Debts
          </button>
        </div>

        <div className="settlement-stat-card card-owed">
          <div className="stat-card-inner">
            <div className="stat-card-text">
              <span className="eyebrow">Total you are owed</span>
              <div className="stat-card-amount owed-amount">{peso(data?.totalToReceive ?? 0)}</div>
            </div>
            <div className="stat-card-icon-wrap owed-arrow">
              <div className="arrow-circle-badge owed">
                <ArrowDownLeft size={24} strokeWidth={2.4} />
              </div>
            </div>
          </div>
          <button className="btn btn-soft" onClick={handleSendReminders} id="btn-send-reminders">
            Send Reminders
          </button>
        </div>
      </div>

      <div className="settlements-filter-bar">
        <div className="chip-group" role="group" aria-label="Filter settlements">
          {[
            ['all', 'All'],
            ['owed', 'Owed'],
            ['owe', 'Owe'],
            ['paid', 'Paid'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`chip ${filter === id ? 'active' : ''}`}
              onClick={() => setFilter(id)}
              id={`filter-pill-${id}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="group-members-link-wrap">
          <button className="btn btn-ghost btn-sm" onClick={onViewGroupMembers} id="btn-see-group-members">
            <span>See Group Members</span>
            <ArrowRight size={14} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="settlements-table-card desktop-table-view">
        <table className="settlements-data-table">
          <thead>
            <tr>
              <th className="th-person">Person</th>
              <th className="th-desc">Description</th>
              <th className="th-status">Status</th>
              <th className="th-amount">Amount</th>
              <th className="th-unpaid">Unpaid</th>
              <th className="th-total">Total Payment</th>
              <th className="th-action"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const done = row.kind === 'paid' || row.kind === 'pending';
              return (
                <tr key={row.id} className={`settlement-table-row ${done ? 'row-paid' : ''}`}>
                  <td className="td-person">
                    <div className="person-cell-wrapper">
                      <Avatar person={row.person} className="person-emoji-avatar" />
                      <span className="person-table-name">{row.person.name}</span>
                    </div>
                  </td>
                  <td className={`td-desc ${done ? 'text-dimmed' : ''}`}>{row.description}</td>
                  <td className="td-status">{renderBadge(row)}</td>
                  <td className={`td-amount ${done ? 'text-dimmed' : ''}`}>{peso(row.amount)}</td>
                  <td className={`td-unpaid ${done ? 'text-dimmed' : row.unpaid > 0 ? 'text-unpaid-red' : ''}`}>
                    {peso(row.unpaid)}
                  </td>
                  <td className={`td-total ${done ? 'text-dimmed' : ''}`}>{peso(row.paid)}</td>
                  <td className="td-action">{renderAction(row, 'btn-pay')}</td>
                </tr>
              );
            })}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan="7" className="table-empty-message">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="settlements-mobile-cards-list mobile-only">
        {filteredRows.map((row) => {
          const done = row.kind === 'paid' || row.kind === 'pending';
          return (
            <div key={row.id} className={`settlement-mobile-card ${done ? 'card-paid' : ''}`}>
              <div className="settlement-mobile-header">
                <div className="person-cell-wrapper">
                  <Avatar person={row.person} className="person-emoji-avatar" />
                  <div>
                    <span className="person-table-name">{row.person.name}</span>
                    <span className={`mobile-desc ${done ? 'text-dimmed' : ''}`}>{row.description}</span>
                  </div>
                </div>
                <div className="mobile-status-wrap">{renderBadge(row)}</div>
              </div>

              <div className="settlement-mobile-amounts-grid">
                <div className="mobile-amount-item">
                  <span className="mobile-amount-label">Amount</span>
                  <span className={`mobile-amount-val ${done ? 'text-dimmed' : ''}`}>{peso(row.amount)}</span>
                </div>
                <div className="mobile-amount-item">
                  <span className="mobile-amount-label">Unpaid</span>
                  <span className={`mobile-amount-val ${row.unpaid > 0 ? 'text-unpaid-red' : ''} ${done ? 'text-dimmed' : ''}`}>
                    {peso(row.unpaid)}
                  </span>
                </div>
                <div className="mobile-amount-item">
                  <span className="mobile-amount-label">Paid</span>
                  <span className={`mobile-amount-val highlight ${done ? 'text-dimmed' : ''}`}>{peso(row.paid)}</span>
                </div>
              </div>

              <div className="settlement-mobile-action">{renderAction(row, 'btn-mobile-pay')}</div>
            </div>
          );
        })}
        {filteredRows.length === 0 && <div className="mobile-empty-message">{emptyText}</div>}
      </div>
    </div>
  );
};

export default SettlementsView;
