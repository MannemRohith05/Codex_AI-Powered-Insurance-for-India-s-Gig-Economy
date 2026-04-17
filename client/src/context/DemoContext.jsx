/**
 * DemoContext — Demo Mode Toggle
 *
 * Provides a floating "DEMO MODE" badge visible to judges/reviewers.
 * When enabled, pre-fills a realistic Mumbai monsoon scenario across
 * the app so a live demo can be triggered in one click.
 *
 * Usage:
 *   const { demoMode, demoData, toggleDemo } = useDemo();
 */
import { createContext, useContext, useState } from 'react';

const DemoContext = createContext(null);

/** Realistic Mumbai monsoon scenario for demo */
const DEMO_SCENARIOS = {
  mumbai_monsoon: {
    label:        'Mumbai Monsoon (High Risk)',
    worker: {
      name:                        'Raju Sharma',
      phone:                       '9876543210',
      platform:                    'Swiggy',
      occupation_type:             'delivery_rider',
      city:                        'Mumbai',
      zone_pin_code:               '400078',     // Kurla — highest composite risk zone
      declared_weekly_income_inr:  4500,
      upi_id:                      'raju@upi',
    },
    claim: {
      disruption_type:          'heavy_rain',
      declared_income_loss_inr: 2800,
      notes:                    'Could not work due to severe flooding in Kurla. Roads completely blocked.',
      gps_at_claim: { lat: 19.072, lng: 72.978, accuracy: 12 },
    },
    weather: {
      rainfall_mm_24h: 87,
      temperature_c:   29,
      aqi:             145,
      triggered:       ['HEAVY_RAIN', 'FLOOD_RISK'],
    },
    expectedDecision: 'AUTO_APPROVED',
    expectedFraudScore: 0.08,
  },

  hyderabad_heatwave: {
    label:        'Hyderabad Heatwave (Medium Risk)',
    worker: {
      name:                        'Lakshmi Devi',
      phone:                       '9845671234',
      platform:                    'Zomato',
      occupation_type:             'street_vendor',
      city:                        'Hyderabad',
      zone_pin_code:               '500001',    // Char Minar — high flood+traffic
      declared_weekly_income_inr:  2800,
    },
    claim: {
      disruption_type:          'heatwave',
      declared_income_loss_inr: 1500,
      notes:                    'Cannot vend outside — extreme heat above 43°C.',
    },
    weather: {
      temperature_c:  44,
      rainfall_mm_24h: 0,
      triggered:      ['EXTREME_HEAT'],
    },
    expectedDecision: 'AUTO_APPROVED',
    expectedFraudScore: 0.05,
  },

  fraud_attempt: {
    label:        'Fraud Attempt (Flagged)',
    worker: {
      name:                        'Unknown Actor',
      platform:                    'Other',
      occupation_type:             'other',
      city:                        'Delhi',
      zone_pin_code:               '110044',   // Badarpur — highest crime index in Delhi
      declared_weekly_income_inr:  1500,
    },
    claim: {
      disruption_type:          'flood',
      declared_income_loss_inr: 9000,   // far exceeds weekly income
      notes:                    'Flood claim late at night.',
      gps_at_claim: { lat: 28.5, lng: 77.3, accuracy: 250 }, // poor GPS accuracy
    },
    fraudFlags: {
      geo_fence_violation:        true,
      gps_mock_detected:          true,
      insufficient_activity_history: true,
    },
    expectedDecision: 'REJECTED',
    expectedFraudScore: 0.82,
  },
};

export const DemoProvider = ({ children }) => {
  const [demoMode,     setDemoMode]     = useState(false);
  const [activeScenario, setScenario]   = useState('mumbai_monsoon');

  const toggleDemo = () => setDemoMode(v => !v);

  const demoData = demoMode ? DEMO_SCENARIOS[activeScenario] : null;

  return (
    <DemoContext.Provider value={{ demoMode, demoData, toggleDemo, activeScenario, setScenario, DEMO_SCENARIOS }}>
      {children}
      {/* Floating Demo Badge */}
      {demoMode && (
        <div
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff', borderRadius: 12, padding: '10px 18px',
            boxShadow: '0 4px 24px rgba(245,158,11,0.45)',
            fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', userSelect: 'none',
            border: '2px solid rgba(255,255,255,0.3)',
          }}
          onClick={toggleDemo}
          title="Click to exit demo mode"
        >
          <span style={{ fontSize: 16 }}>🎬</span>
          DEMO MODE
          <span style={{
            background: 'rgba(255,255,255,0.25)', borderRadius: 6,
            padding: '2px 8px', fontSize: 11,
          }}>
            {DEMO_SCENARIOS[activeScenario]?.label}
          </span>
          <span style={{ opacity: 0.75, fontSize: 11 }}>✕</span>
        </div>
      )}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>');
  return ctx;
};

export default DemoContext;
