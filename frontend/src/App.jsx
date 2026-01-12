import { useState } from 'react'
import Header from './components/Header'
import CustomerEventsSection from './components/CustomerEventsSection'
import SyncStatusSection from './components/SyncStatusSection'
import './styles/App.css'

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [dealsRefreshTrigger, setDealsRefreshTrigger] = useState(0)

  const handleContactCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleDealCreated = () => {
    setDealsRefreshTrigger(prev => prev + 1)
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
    setDealsRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <CustomerEventsSection
          onContactCreated={handleContactCreated}
          onDealCreated={handleDealCreated}
        />
        <SyncStatusSection
          refreshTrigger={refreshTrigger}
          dealsRefreshTrigger={dealsRefreshTrigger}
          onRefresh={handleRefresh}
        />
      </main>
    </div>
  )
}

export default App
