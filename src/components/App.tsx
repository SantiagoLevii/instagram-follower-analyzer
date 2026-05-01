import { useState, useMemo, useCallback, useEffect } from 'preact/hooks';
import { Overlay } from './Overlay';
import { ScanButton } from './ScanButton';
import { Dashboard } from './Dashboard';
import { TabNav } from './TabNav';
import { UserList } from './UserList';
import { Snapshots } from './Snapshots';
import { Settings } from './Settings';
import { Toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { useInstagramAPI } from '../hooks/useInstagramAPI';
import { useSnapshots } from '../hooks/useSnapshots';
import { useWhitelist } from '../hooks/useWhitelist';
import { storageGet, storageSet, storageClear } from '../utils/storage';
import { getUserId } from '../api/instagram';
import { DEFAULT_SETTINGS as DEFAULTS } from '../types';
import type { IGUser, TabId, Settings as SettingsType, ToastItem, ConfirmOptions, Snapshot } from '../types';

interface ScanData {
  followers: IGUser[];
  following: IGUser[];
  scannedAt: string;
}

type NavView = 'home' | 'snapshots' | 'settings';

let toastCounter = 0;

export function App() {
  const [minimized, setMinimized] = useState(false);
  const [navView, setNavView] = useState<NavView>('home');
  const [activeTab, setActiveTab] = useState<TabId>('not-following-back');
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirm, setConfirm] = useState<ConfirmOptions | null>(null);
  const [visible, setVisible] = useState(true);
  const [settings, setSettings] = useState<SettingsType>(() =>
    storageGet<SettingsType>('settings', DEFAULTS)
  );

  const { whitelist, toggle: toggleWhitelist, importList: importWhitelist, clear: clearWhitelist } = useWhitelist();
  const { snapshots, save: saveSnapshot, remove: removeSnapshot, rename: renameSnapshot, importSnapshots } = useSnapshots();

  useEffect(() => {
    const root = document.getElementById('ifa-root');
    if (root) root.className = settings.theme === 'light' ? 'ifa-light' : '';
  }, [settings.theme]);

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info', duration = 4000): string => {
    const id = `t${++toastCounter}`;
    setToasts(prev => [...prev.slice(-9), { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const { scanning, progress, unfollowProgress, startScan, cancelScan, runUnfollow } = useInstagramAPI(
    settings,
    addToast,
    removeToast
  );

  const computed = useMemo(() => {
    if (!scanData) return null;
    const followerSet = new Set(scanData.followers.map(u => u.username));
    const followingSet = new Set(scanData.following.map(u => u.username));
    return {
      followerSet,
      followingSet,
      notFollowingBack: scanData.following.filter(u => !followerSet.has(u.username)),
      notFollowedBack: scanData.followers.filter(u => !followingSet.has(u.username)),
      mutuals: scanData.following.filter(u => followerSet.has(u.username)),
    };
  }, [scanData]);

  const tabCounts = useMemo(() => ({
    'not-following-back': computed?.notFollowingBack.length ?? 0,
    'not-followed-back': computed?.notFollowedBack.length ?? 0,
    mutuals: computed?.mutuals.length ?? 0,
    followers: scanData?.followers.length ?? 0,
    following: scanData?.following.length ?? 0,
  }), [computed, scanData]);

  const tabUsers = useMemo((): IGUser[] => {
    if (!scanData || !computed) return [];
    switch (activeTab) {
      case 'not-following-back': return computed.notFollowingBack;
      case 'not-followed-back': return computed.notFollowedBack;
      case 'mutuals': return computed.mutuals;
      case 'followers': return scanData.followers;
      case 'following': return scanData.following;
    }
  }, [activeTab, scanData, computed]);

  useEffect(() => {
    storageSet('settings', settings);
  }, [settings]);

  const handleScan = useCallback(async () => {
    if (!getUserId()) {
      addToast('Not logged in. Log into Instagram and re-run the script.', 'error', 6000);
      return;
    }
    const result = await startScan();
    if (result) {
      setScanData(result);
      if (settings.autoSaveSnapshot) {
        const snap: Snapshot = {
          id: `s${Date.now()}`,
          name: `Auto - ${new Date().toLocaleDateString()}`,
          date: result.scannedAt,
          followers: result.followers.map(u => u.username),
          following: result.following.map(u => u.username),
          followerCount: result.followers.length,
          followingCount: result.following.length,
        };
        saveSnapshot(snap);
        addToast('Snapshot saved automatically', 'success', 3000);
      }
    }
  }, [startScan, settings.autoSaveSnapshot, addToast, saveSnapshot]);

  const handleSaveSnapshot = useCallback(() => {
    if (!scanData) return;
    const snap: Snapshot = {
      id: `s${Date.now()}`,
      name: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      date: scanData.scannedAt,
      followers: scanData.followers.map(u => u.username),
      following: scanData.following.map(u => u.username),
      followerCount: scanData.followers.length,
      followingCount: scanData.following.length,
    };
    saveSnapshot(snap);
    addToast('Snapshot saved', 'success', 3000);
  }, [scanData, saveSnapshot, addToast]);

  const handleRescan = useCallback(() => {
    setScanData(null);
    handleScan();
  }, [handleScan]);

  const handleTabSelect = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setNavView('home');
  }, []);

  const handleUnfollowSelected = useCallback((targets: IGUser[]) => {
    const n = targets.length;
    const estSecs = (n - 1) * (settings.unfollowDelay / 1000) + Math.floor(n / 10) * settings.unfollowCooldown;
    const estMins = Math.ceil(estSecs / 60);

    setConfirm({
      message: `You are about to unfollow ${n} user${n !== 1 ? 's' : ''}. Are you sure?`,
      detail: n > 5
        ? `This will take approximately ${estMins} minute${estMins !== 1 ? 's' : ''} due to anti-ban cooldowns.`
        : undefined,
      onConfirm: () => {
        runUnfollow(targets, unfollowed => {
          setScanData(prev =>
            prev ? { ...prev, following: prev.following.filter(u => !unfollowed.includes(u.pk)) } : prev
          );
        });
      },
    });
  }, [settings.unfollowDelay, settings.unfollowCooldown, runUnfollow]);

  const handleUpdateSettings = useCallback((patch: Partial<SettingsType>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  const handleClearData = useCallback(() => {
    setConfirm({
      message: 'Clear all data? This removes snapshots, whitelist, and settings from localStorage.',
      onConfirm: () => {
        storageClear();
        setSettings(DEFAULTS);
        setScanData(null);
        addToast('All data cleared', 'info', 3000);
      },
    });
  }, [addToast]);

  if (!visible) return null;

  const renderContent = () => {
    if (navView === 'settings') {
      return (
        <Settings
          settings={settings}
          whitelist={whitelist}
          onChange={handleUpdateSettings}
          onClearData={handleClearData}
          onImportWhitelist={importWhitelist}
          onClearWhitelist={clearWhitelist}
        />
      );
    }

    if (navView === 'snapshots') {
      return (
        <Snapshots
          snapshots={snapshots}
          currentFollowers={scanData?.followers}
          currentFollowing={scanData?.following}
          onSave={saveSnapshot}
          onDelete={removeSnapshot}
          onRename={renameSnapshot}
          onImport={importSnapshots}
        />
      );
    }

    if (!scanData) {
      return (
        <ScanButton
          scanning={scanning}
          progress={progress}
          onScan={handleScan}
          onCancel={cancelScan}
        />
      );
    }

    return (
      <>
        <Dashboard
          followers={scanData.followers}
          following={scanData.following}
          computed={computed!}
          scannedAt={scanData.scannedAt}
          snapshots={snapshots}
          onTabSelect={handleTabSelect}
          onRescan={handleRescan}
          onSaveSnapshot={handleSaveSnapshot}
        />
        <TabNav activeTab={activeTab} counts={tabCounts} onChange={setActiveTab} />
        <UserList
          users={tabUsers}
          whitelist={whitelist}
          onToggleWhitelist={toggleWhitelist}
          onUnfollowSelected={handleUnfollowSelected}
          tabId={activeTab}
          unfollowProgress={unfollowProgress}
        />
      </>
    );
  };

  return (
    <>
      <Overlay
        minimized={minimized}
        onMinimize={() => setMinimized(m => !m)}
        onClose={() => setVisible(false)}
      >
        <div class="ifa-nav-bar">
          <button
            class={`ifa-nav-btn${navView === 'home' ? ' ifa-nav-btn--active' : ''}`}
            onClick={() => setNavView('home')}
          >
            Home
          </button>
          <button
            class={`ifa-nav-btn${navView === 'snapshots' ? ' ifa-nav-btn--active' : ''}`}
            onClick={() => setNavView('snapshots')}
          >
            Snapshots
          </button>
          <button
            class={`ifa-nav-btn${navView === 'settings' ? ' ifa-nav-btn--active' : ''}`}
            onClick={() => setNavView('settings')}
          >
            Settings
          </button>
        </div>

        <div class="ifa-content">
          {renderContent()}
        </div>

        <Toast toasts={toasts} onDismiss={removeToast} />
      </Overlay>

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          detail={confirm.detail}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
