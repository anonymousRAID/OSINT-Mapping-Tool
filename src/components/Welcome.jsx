import { useState } from 'react';
import { useAppConfig } from '../context/AppConfigContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import './Welcome.css';

/**
 * First-run chooser. Shown when the user has never picked a map provider
 * and doesn't already have an API key configured. Picking either option
 * writes `map.provider` to localStorage, which means this screen won't
 * appear again on subsequent visits.
 */
export default function Welcome() {
  const { setMapProvider, setGoogleMapsApiKey } = useAppConfig();
  // 'choose' = picking provider; 'google-key' = entering the optional key.
  const [step, setStep] = useState('choose');
  const [apiKey, setApiKey] = useState('');

  const pickOSM = async () => {
    await setMapProvider('osm');
  };

  const pickGoogle = () => {
    setStep('google-key');
  };

  const continueWithGoogle = async () => {
    const trimmed = apiKey.trim();
    if (trimmed) setGoogleMapsApiKey(trimmed);
    await setMapProvider('google');
  };

  return (
    <div className="welcome">
      <div className="welcome-topbar">
        <ThemeToggle />
      </div>

      <div className="welcome-content">
        <div className="welcome-brand">
          <div className="welcome-logo">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h1 className="welcome-title">Welcome</h1>
          <p className="welcome-sub">
            Pick how you want to use the map. You can switch later from the
            gear icon in the Map tab.
          </p>
        </div>

        {step === 'choose' && (
          <div className="welcome-cards">
            <button
              type="button"
              className="welcome-card"
              onClick={pickOSM}
            >
              <div className="welcome-card-icon">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
                </svg>
              </div>
              <div className="welcome-card-title">OpenStreetMap</div>
              <div className="welcome-card-desc">
                Free, no signup. Works immediately.
              </div>
            </button>

            <button
              type="button"
              className="welcome-card"
              onClick={pickGoogle}
            >
              <div className="welcome-card-icon">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="welcome-card-title">Google Maps</div>
              <div className="welcome-card-desc">
                Richer place details (ratings, hours, phone). Needs an API key.
              </div>
              <span className="welcome-card-tag">Recommended</span>
            </button>
          </div>
        )}

        {step === 'google-key' && (
          <form
            className="welcome-key-form"
            onSubmit={(e) => {
              e.preventDefault();
              continueWithGoogle();
            }}
          >
            <div className="field">
              <label htmlFor="welcome-api-key">
                Google Maps API key{' '}
                <span className="welcome-optional">(optional)</span>
              </label>
              <input
                id="welcome-api-key"
                type="password"
                autoFocus
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy…"
              />
              <p className="welcome-help">
                Skip this for now if you want — you can paste the key into the
                Map tab whenever you're ready. The key stays on this device.
              </p>
            </div>
            <div className="welcome-key-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setStep('choose')}
              >
                Back
              </button>
              <button type="submit" className="btn btn-primary">
                {apiKey.trim() ? 'Save key & continue' : 'Skip for now'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="welcome-footer">
        Local-only · Your data stays on this device
      </div>
    </div>
  );
}
