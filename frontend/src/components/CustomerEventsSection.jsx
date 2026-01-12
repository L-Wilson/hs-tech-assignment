import NewCustomerForm from './NewCustomerForm'
import ConversionForm from './ConversionForm'

function CustomerEventsSection({ onContactCreated, onDealCreated }) {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">SIMULATE CUSTOMER EVENTS</h2>
        <p className="section-subtitle">
          (In production, these happen automatically from your e-commerce and subscription systems)
        </p>
      </div>
      <div className="cards-container">
        <NewCustomerForm onContactCreated={onContactCreated} />
        <ConversionForm onDealCreated={onDealCreated} />
      </div>
    </section>
  )
}

export default CustomerEventsSection
