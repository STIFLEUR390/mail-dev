import {defineStore} from 'pinia';
import {loadSettings} from './db';

export const useSettingStore = defineStore('setting', {
  state: () => ({
    srvStatus: false,
    srvBusy: false,
    srvResponseMessage: "",
    framework: "Laravel 13",
    ipAddress: "127.0.0.1",
    port: 2525,
    spamChecking: true,

    srvAuthEnabled: false,
    srvUsername: "",
    srvPassword: "",

    forwardEmailHost: "smtp.gmail.com",
    forwardEmailPort: "587",
    forwardEmailUsername: "",
    forwardEmailPassword: "",
    forwardEnabled: false,

    useNotification: true,

    theme: 'system', // 'system' | 'light' | 'dark'
    locale: (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('fr')) ? 'fr' : 'en',
  }),
  actions: {
    async initFromDb() {
      try {
        const data = await loadSettings();
        if (data) {
          this.$patch(data);
        }
      } catch (err) {
        console.warn('[settings] no persisted settings:', err);
      }
      // A transient busy flag must never survive a restart.
      this.srvBusy = false;
    },
    setSrvStatus(value) {
      this.srvStatus = value;
    },
    setSrvBusy(value) {
      this.srvBusy = value;
    },
    setSrvResponseMessage(value) {
      this.srvResponseMessage = value;
    },
    setFramework(value) {
      this.framework = value;
    },
    setIpAddress(value) {
      this.ipAddress = value;
    },
    setPort(value) {
      this.port = value;
    },
    setSpamChecking(value) {
      this.spamChecking = value;
    },
    setSrvAuthEnabled(value) {
      this.srvAuthEnabled = value;
    },
    setSrvUsername(value) {
      this.srvUsername = value;
    },
    setSrvPassword(value) {
      this.srvPassword = value;
    },
    setForwardEmailHost(value) {
      this.forwardEmailHost = value;
    },
    setForwardEmailPort(value) {
      this.forwardEmailPort = value;
    },
    setForwardEmailUsername(value) {
      this.forwardEmailUsername = value;
    },
    setForwardEmailPassword(value) {
      this.forwardEmailPassword = value;
    },
    setForwardEnabled(value) {
      this.forwardEnabled = value;
    },
    setUseNotification(value) {
      this.useNotification = value;
    },
    setTheme(value) {
      this.theme = value;
    },
    setLocale(value) {
      this.locale = value;
    },
  },
});
