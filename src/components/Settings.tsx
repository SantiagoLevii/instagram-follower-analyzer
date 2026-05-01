import type { Settings } from '../types';
import { MIN_SETTINGS } from '../types';
import { exportWhitelist, importJSON } from '../utils/export';

interface Props {
  settings: Settings;
  whitelist: Set<string>;
  onChange: (patch: Partial<Settings>) => void;
  onClearData: () => void;
  onImportWhitelist: (usernames: string[]) => void;
  onClearWhitelist: () => void;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step = 100, unit, onChange }: SliderProps) {
  return (
    <div class="ifa-settings-row">
      <label class="ifa-settings-label">
        {label}
        <span class="ifa-settings-value">{value}{unit}</span>
      </label>
      <input
        type="range"
        class="ifa-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={e => onChange(Number((e.target as HTMLInputElement).value))}
      />
      <span class="ifa-settings-hint">Min: {min}{unit}</span>
    </div>
  );
}

export function Settings({ settings, whitelist, onChange, onClearData, onImportWhitelist, onClearWhitelist }: Props) {
  return (
    <div class="ifa-settings">
      <section class="ifa-settings-section">
        <h3>Scan Delays</h3>
        <Slider
          label="Request delay"
          value={settings.requestDelay}
          min={MIN_SETTINGS.requestDelay}
          max={3000}
          unit="ms"
          onChange={v => onChange({ requestDelay: Math.max(v, MIN_SETTINGS.requestDelay) })}
        />
        <Slider
          label="Scan cooldown (every 10 requests)"
          value={settings.scanCooldown}
          min={MIN_SETTINGS.scanCooldown}
          max={30}
          step={1}
          unit="s"
          onChange={v => onChange({ scanCooldown: Math.max(v, MIN_SETTINGS.scanCooldown) })}
        />
      </section>

      <section class="ifa-settings-section">
        <h3>Unfollow Delays</h3>
        <Slider
          label="Unfollow delay"
          value={settings.unfollowDelay}
          min={MIN_SETTINGS.unfollowDelay}
          max={8000}
          unit="ms"
          onChange={v => onChange({ unfollowDelay: Math.max(v, MIN_SETTINGS.unfollowDelay) })}
        />
        <Slider
          label="Unfollow cooldown (every 10 unfollows)"
          value={settings.unfollowCooldown}
          min={MIN_SETTINGS.unfollowCooldown}
          max={60}
          step={1}
          unit="s"
          onChange={v => onChange({ unfollowCooldown: Math.max(v, MIN_SETTINGS.unfollowCooldown) })}
        />
        <p class="ifa-settings-note">Minimum cooldowns are enforced to protect your account.</p>
      </section>

      <section class="ifa-settings-section">
        <h3>Preferences</h3>
        <div class="ifa-settings-row ifa-settings-row--toggle">
          <label class="ifa-settings-label">Auto-save snapshot after scan</label>
          <input
            type="checkbox"
            class="ifa-toggle"
            checked={settings.autoSaveSnapshot}
            onChange={e => onChange({ autoSaveSnapshot: (e.target as HTMLInputElement).checked })}
          />
        </div>
        <div class="ifa-settings-row ifa-settings-row--toggle">
          <label class="ifa-settings-label">Light mode</label>
          <input
            type="checkbox"
            class="ifa-toggle"
            checked={settings.theme === 'light'}
            onChange={e => onChange({ theme: (e.target as HTMLInputElement).checked ? 'light' : 'dark' })}
          />
        </div>
      </section>

      <section class="ifa-settings-section">
        <h3>Whitelist ({whitelist.size} users)</h3>
        <div class="ifa-settings-actions">
          <button
            class="ifa-btn ifa-btn--ghost ifa-btn--sm"
            onClick={() => exportWhitelist(Array.from(whitelist))}
            disabled={whitelist.size === 0}
          >
            Export whitelist
          </button>
          <button
            class="ifa-btn ifa-btn--ghost ifa-btn--sm"
            onClick={() => importJSON<string[]>(onImportWhitelist)}
          >
            Import whitelist
          </button>
          <button
            class="ifa-btn ifa-btn--danger ifa-btn--sm"
            onClick={onClearWhitelist}
            disabled={whitelist.size === 0}
          >
            Clear whitelist
          </button>
        </div>
      </section>

      <section class="ifa-settings-section">
        <h3>Data</h3>
        <button
          class="ifa-btn ifa-btn--danger"
          onClick={onClearData}
        >
          Clear all data
        </button>
        <p class="ifa-settings-note">Removes all ifa_* entries from localStorage.</p>
      </section>
    </div>
  );
}
