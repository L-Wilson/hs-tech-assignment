import { useState, useEffect } from 'react'
import ContactRow from './ContactRow'

function ContactsTable({ refreshTrigger, dealsRefreshTrigger }) {
  const [contacts, setContacts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchContacts()
  }, [refreshTrigger])

  const fetchContacts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/contacts')

      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }

      const data = await response.json()
      setContacts(data.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="table-container">
        <div className="loading-state">Loading contacts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="table-container">
        <div className="error-state">Error: {error}</div>
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          No contacts found. Create your first contact using the form above.
        </div>
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="contacts-table">
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Job Title</th>
            <th>Company</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <ContactRow key={contact.id} contact={contact} dealsRefreshTrigger={dealsRefreshTrigger} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ContactsTable
