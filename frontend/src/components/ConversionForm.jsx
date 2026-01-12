import { useEffect, useState } from 'react'

function ConversionForm({ onDealCreated }) {
  const [contacts, setContacts] = useState([])
  const [selectedContactId, setSelectedContactId] = useState('')
  const [planType, setPlanType] = useState('annual')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isLoadingContacts, setIsLoadingContacts] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts')
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }
      const data = await response.json()
      setContacts(data.results || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setIsLoadingContacts(false)
    }
  }

  const getDealDetails = () => {
    const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    if (planType === 'annual') {
      return {
        dealname: 'Breezy Premium - Annual Subscription',
        amount: '99',
        dealstage: 'closedwon',
        closedate: currentDate,
        pipeline: 'default'
      }
    } else {
      return {
        dealname: 'Breezy Premium - Monthly Subscription',
        amount: '9.99',
        dealstage: 'closedwon',
        closedate: currentDate,
        pipeline: 'default'
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedContactId) {
      setMessage({ type: 'error', text: 'Please select a customer' })
      return
    }

    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const dealDetails = getDealDetails()

      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealProperties: dealDetails,
          contactId: selectedContactId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create deal')
      }

      const data = await response.json()
      setMessage({ type: 'success', text: 'Conversion recorded successfully in HubSpot!' })

      // Reset form
      setSelectedContactId('')
      setPlanType('annual')

      // Notify parent to refresh
      if (onDealCreated) {
        setTimeout(() => onDealCreated(), 500)
      }

      // Clear success message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)

    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const dealDetails = getDealDetails()

  const getSelectedCustomerName = () => {
    if (!selectedContactId) return null
    const selectedContact = contacts.find(c => c.id === selectedContactId)
    if (!selectedContact) return null
    return `${selectedContact.properties.firstname} ${selectedContact.properties.lastname}`
  }

  const customerName = getSelectedCustomerName()

  return (
    <div className="card">
      <h3 className="card-title">TRIAL → PAID CONVERSION</h3>
      <p className="card-subtitle">
        Customer converts from 30-day free trial to paid subscription
      </p>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-content">
          <div className="form-field">
            <label htmlFor="customer" className="form-label">
              Customer*
            </label>
            <select
              id="customer"
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="form-input"
              required
              disabled={isLoadingContacts}
            >
              <option value="">
                {isLoadingContacts ? 'Loading customers...' : 'Select a customer...'}
              </option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.properties.firstname} {contact.properties.lastname} ({contact.properties.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Plan*</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="plan"
                  value="annual"
                  checked={planType === 'annual'}
                  onChange={(e) => setPlanType(e.target.value)}
                />
                <span className="radio-label">Annual ($99/year)</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="plan"
                  value="monthly"
                  checked={planType === 'monthly'}
                  onChange={(e) => setPlanType(e.target.value)}
                />
                <span className="radio-label">Monthly ($9.99/month)</span>
              </label>
            </div>
          </div>

          <div className="deal-preview">
            <p className="deal-preview-label">Deal to be created:</p>
            {selectedContactId ? (
              <div className="deal-preview-text">
                <p><strong>{dealDetails.dealname}</strong> - ${dealDetails.amount}</p>
                <p>for {customerName}</p>
              </div>
            ) : (
              <p className="deal-preview-text deal-preview-placeholder">
                Select a customer to see deal details
              </p>
            )}
          </div>
        </div>

        <div className="form-actions">
          {message.text && (
            <div className={`message message-${message.type}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Recording...' : 'Record Conversion'}
          </button>

          <p className="form-helper-text">→ Creates Deal in HubSpot to track subscription revenue</p>
        </div>
      </form>
    </div>
  )
}

export default ConversionForm
