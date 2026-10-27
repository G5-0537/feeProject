/**
 * Tabs — Reusable tab strip component with optional badge counts.
 * Demonstrates: Tabs (Syllabus Topics 61-66)
 *
 * Usage:
 *   const [tab, setTab] = useState('queue');
 *   <Tabs tabs={[
 *     { key: 'queue', label: 'Live Queue', icon: <ClipboardList size={16}/>, badge: 5 },
 *     { key: 'appts', label: 'Appointments' }
 *   ]} activeTab={tab} onChange={setTab} />
 *   {tab === 'queue' && <QueueContent />}
 */
export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="tabs-strip" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          aria-controls={`tabpanel-${tab.key}`}
          className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.badge > 0 && (
            <span className="tab-badge" aria-label={`${tab.badge} items`}>{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}

