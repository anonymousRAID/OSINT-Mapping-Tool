import { useState } from 'react';
import { useAppConfig } from '../context/AppConfigContext.jsx';
import { APP_CONFIG_PATH_HINT } from '../utils/appConfig.js';
import './MapsKeySetup.css';

export default function MapsKeySetup({ compact = false, onSaved }) {
  const { setGoogleMapsApiKey, googleMapsApiKeySource } = useAppConfig();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Paste your Google Maps API key first.');
      return;
    }
    setGoogleMapsApiKey(trimmed);
    setValue('');
    setError('');
    onSaved?.();
  };

  return (
    <div className={`maps-setup ${compact ? 'compact' : ''}`}>
      <div className="maps-setup-card">
        <div className="maps-setup-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <h2>Connect Google Maps</h2>
        <p className="maps-setup-sub">
          The map needs a Google Maps JavaScript API key. Your key stays on this
          device — it never gets sent anywhere or stored in project files.
        </p>

        <form onSubmit={handleSubmit} className="maps-setup-form">
          <label htmlFor="gmaps-key">Google Maps API key</label>
          <input
            id="gmaps-key"
            type="text"
            autoComplete="off"
            spellCheck="false"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="AIza..."
          />
          {error && <div className="maps-setup-error">{error}</div>}
          <div className="maps-setup-actions">
            <button type="submit" className="btn btn-primary">
              Save key
            </button>
          </div>
        </form>

        <div className="maps-setup-divider"><span>or</span></div>

        <div className="maps-setup-alt">
          <p>
            Prefer editing a file? Copy <code>public/app.config.example.json</code> to{' '}
            <code>{APP_CONFIG_PATH_HINT}</code> and paste your key under{' '}
            <code>googleMaps.apiKey</code>. The app reads it on next load.
          </p>
        </div>

        {googleMapsApiKeySource && (
          <div className="maps-setup-status">
            Current key source: <strong>{googleMapsApiKeySource}</strong>
          </div>
        )}

        <details className="maps-setup-help">
          <summary>How do I get an API key?</summary>
          <ol>
            <li>Open the <strong>Google Cloud Console</strong> and create or select a project.</li>
            <li>Enable the <strong>Maps JavaScript API</strong> (and <strong>Places API</strong> if you want auto-fill for known places).</li>
            <li>Under <strong>APIs &amp; Services → Credentials</strong>, create an API key.</li>
            <li>For safety, restrict the key to <code>http://localhost</code> and any other origins you use.</li>
          </ol>
          <p className="maps-setup-warning">
            Usage is billed by Google under your account's free tier and pricing. Restrict your key.
          </p>
        </details>
      </div>
    </div>
  );
}
