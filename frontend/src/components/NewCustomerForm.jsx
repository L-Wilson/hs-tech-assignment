import { useState } from 'react'

function NewCustomerForm({ onContactCreated }) {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    address: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.firstname || !formData.lastname || !formData.email) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: formData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create contact')
      }

      const data = await response.json()
      setMessage({ type: 'success', text: 'Contact successfully synced to HubSpot!' })

      // Clear form
      setFormData({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        address: ''
      })

      // Notify parent to refresh contacts table
      if (onContactCreated) {
        setTimeout(() => onContactCreated(), 500)
      }

      // Clear success message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)

    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h3 className="card-title">NEW THERMOSTAT PURCHASE</h3>
      <p className="card-subtitle">
        Customer purchases a thermostat and creates their Breezy account
      </p>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-content">
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="firstname" className="form-label">
                First Name*
              </label>
              <input
                type="text"
                id="firstname"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="lastname" className="form-label">
                Last Name*
              </label>
              <input
                type="text"
                id="lastname"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="email" className="form-label">
              Email*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="phone" className="form-label">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="address" className="form-label">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-input"
            />
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
            {isSubmitting ? 'Syncing...' : 'Register & Sync to HubSpot'}
          </button>

          <p className="form-helper-text">→ Creates Contact in HubSpot</p>
        </div>
      </form>
    </div>
  )
}

export default NewCustomerForm
