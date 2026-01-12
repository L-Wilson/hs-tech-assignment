import ContactsTable from './ContactsTable'

function SyncStatusSection({ refreshTrigger, dealsRefreshTrigger, onRefresh }) {
  return (
    <section className="section">
      <div className="section-header section-header-with-action">
        <div>
          <h2 className="section-title">HUBSPOT SYNC STATUS</h2>
          <p className="section-subtitle">What your marketing team sees in HubSpot</p>
        </div>
        <button onClick={onRefresh} className="refresh-button">
          Refresh
        </button>
      </div>
      <ContactsTable refreshTrigger={refreshTrigger} dealsRefreshTrigger={dealsRefreshTrigger} />
    </section>
  )
}

export default SyncStatusSection
