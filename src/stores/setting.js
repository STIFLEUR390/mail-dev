import {defineStore} from 'pinia';

export const useSettingStore = defineStore('setting', {
  state: () => ({
    srvStatus: false,
    srvResponseMessage: "",
    framework: "Laravel (11+)",
    ipAddress: "127.0.0.1",
    port: 2525,
    spamChecking: true,

    forwardEmailHost: "smtp.gmail.com",
    forwardEmailPort: "587",
    forwardEmailUsername: "",
    forwardEmailPassword: "",
    forwardEnabled: false,

    useNotification: true,
  }),
  actions: {
    setSrvStatus(value) {
      this.srvStatus = value;
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
  },
});
