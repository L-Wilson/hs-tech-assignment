import { useEffect, useState } from 'react'

function ContactRow({ contact, dealsRefreshTrigger }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [deals, setDeals] = useState([])
  const [isLoadingDeals, setIsLoadingDeals] = useState(false)
  const [dealsError, setDealsError] = useState(null)
  const [aiInsights, setAiInsights] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiError, setAiError] = useState(null)

  const { properties } = contact

  useEffect(() => {
    if (isExpanded) {
      fetchDeals()
    }
  }, [isExpanded, dealsRefreshTrigger])

  const fetchDeals = async () => {
    setIsLoadingDeals(true)
    setDealsError(null)

    try {
      const response = await fetch(`/api/contacts/${contact.id}/deals`)

      if (!response.ok) {
        throw new Error('Failed to fetch deals')
      }

      const data = await response.json()
      setDeals(data.results || [])
    } catch (error) {
      setDealsError(error.message)
    } finally {
      setIsLoadingDeals(false)
    }
  }

  const calculateTotalRevenue = () => {
    return deals.reduce((total, deal) => {
      const amount = parseFloat(deal.properties.amount || 0)
      return total + amount
    }, 0)
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const buildAnonymizedProfile = () => {
    // Extract only behavioral/transactional data, NO PII
    const totalDeals = deals.length
    const totalRevenue = deals.reduce((sum, deal) => {
      return sum + parseFloat(deal.properties.amount || 0)
    }, 0)

    const subscriptions = deals.map(deal => {
      const dealName = deal.properties.dealname || ''
      const isAnnual = dealName.toLowerCase().includes('annual')
      const isMonthly = dealName.toLowerCase().includes('monthly')

      return {
        plan: isAnnual ? 'annual' : isMonthly ? 'monthly' : 'unknown',
        amount: parseFloat(deal.properties.amount || 0),
        stage: deal.properties.dealstage || 'unknown'
      }
    })

    const hasMultipleSubscriptions = totalDeals > 1
    const annualCount = subscriptions.filter(s => s.plan === 'annual').length
    const monthlyCount = subscriptions.filter(s => s.plan === 'monthly').length
    const currentPlanType = annualCount > 0 ? 'annual' : monthlyCount > 0 ? 'monthly' : 'none'

    return {
      totalDeals,
      totalRevenue,
      subscriptions,
      hasMultipleSubscriptions,
      currentPlanType,
      annualSubscriptionCount: annualCount,
      monthlySubscriptionCount: monthlyCount
    }
  }

  const handleAnalyzeCustomer = async () => {
    setIsAnalyzing(true)
    setAiError(null)

    try {
      const customerProfile = buildAnonymizedProfile()

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerProfile })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze customer')
      }

      const data = await response.json()
      setAiInsights(data.insights)
    } catch (error) {
      setAiError(error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <>
      <tr className="contact-row">
        <td>{properties.firstname || '-'}</td>
        <td>{properties.lastname || '-'}</td>
        <td>{properties.email || '-'}</td>
        <td>{properties.jobtitle || '-'}</td>
        <td>{properties.company || '-'}</td>
        <td>
          <button
            className="expand-button"
            onClick={handleToggle}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="expanded-row">
          <td colSpan="6">
            <div className="expanded-content">
              <h4 className="expanded-section-title">Subscriptions (Deals in HubSpot)</h4>

              {isLoadingDeals && (
                <p className="deals-loading">Loading deals...</p>
              )}

              {dealsError && (
                <p className="deals-error">Error loading deals: {dealsError}</p>
              )}

              {!isLoadingDeals && !dealsError && deals.length === 0 && (
                <p className="deals-empty">No deals found for this contact.</p>
              )}

              {!isLoadingDeals && !dealsError && deals.length > 0 && (
                <>
                  <table className="deals-table">
                    <thead>
                      <tr>
                        <th>Deal Name</th>
                        <th>Amount</th>
                        <th>Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deals.map((deal) => (
                        <tr key={deal.id}>
                          <td>{deal.properties.dealname || '-'}</td>
                          <td>${deal.properties.amount || '0'}</td>
                          <td>{deal.properties.dealstage || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="total-revenue">
                    <strong>Total Revenue:</strong> ${calculateTotalRevenue().toFixed(2)}
                  </div>
                </>
              )}

              <div className="ai-insights-section">
                <div className="ai-insights-header">
                  <h4 className="expanded-section-title">AI-Powered Customer Insights</h4>
                  <button
                    className="analyze-button"
                    onClick={handleAnalyzeCustomer}
                    disabled={isAnalyzing || deals.length === 0}
                  >
                    {isAnalyzing ? 'Analyzing...' : '✨ Analyze Customer'}
                  </button>
                </div>

                {deals.length === 0 && !isAnalyzing && (
                  <p className="ai-placeholder-text">Add at least one deal to analyze this customer</p>
                )}

                {aiError && (
                  <div className="ai-error">
                    <strong>Error:</strong> {aiError}
                  </div>
                )}

                {aiInsights && !isAnalyzing && (
                  <div className="ai-insights-content">
                    <div className="insight-grid">
                      <div className="insight-card">
                        <div className="insight-label">Health Score</div>
                        <div className="insight-value health-score">
                          {aiInsights.healthScore}/10
                        </div>
                        {aiInsights.healthScoreReasoning && (
                          <p className="insight-reasoning">{aiInsights.healthScoreReasoning}</p>
                        )}
                      </div>
                      <div className="insight-card">
                        <div className="insight-label">Expansion Potential</div>
                        <div className={`insight-value expansion-${aiInsights.expansionPotential}`}>
                          {aiInsights.expansionPotential.charAt(0).toUpperCase() + aiInsights.expansionPotential.slice(1)}
                        </div>
                        {aiInsights.expansionPotentialReasoning && (
                          <p className="insight-reasoning">{aiInsights.expansionPotentialReasoning}</p>
                        )}
                      </div>
                    </div>

                    <div className="insight-detail">
                      <div className="insight-detail-label">Recommended Action</div>
                      <p className="insight-detail-text">{aiInsights.recommendedAction}</p>
                    </div>

                    <div className="insight-detail">
                      <div className="insight-detail-label">Marketing Angle</div>
                      <p className="insight-detail-text">{aiInsights.marketingAngle}</p>
                    </div>

                    <div className="ai-disclaimer">
                      AI analysis based on anonymized transactional data only (no PII sent to AI)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default ContactRow
