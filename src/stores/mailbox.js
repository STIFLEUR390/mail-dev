import {defineStore} from 'pinia';
import {
  loadMails,
  insertMail,
  deleteMail as dbDeleteMail,
  clearMails as dbClearMails,
  deleteAttachmentFiles,
  updateMailSeen,
  updateMailSpam,
} from './db';

// crypto.randomUUID is available in WebView2/WKWebView/WebKitGTK 4.1 and in
// modern jsdom; fall back to a random hex string anywhere else.
function newMailKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useMailboxStore = defineStore('mailbox', {
  state: () => ({
    mails: [],
    mailIndex: null,
    mail: {},
    searchQuery: '',
  }),
  getters: {
    // Mails matching the search query (subject, from, to, message-id).
    // Empty query returns the full list.
    filteredMails(state) {
      const q = state.searchQuery.trim().toLowerCase();
      if (!q) return state.mails;
      return state.mails.filter(mail => {
        return (
          (mail.subject || '').toLowerCase().includes(q) ||
          (mail.from || '').toLowerCase().includes(q) ||
          (mail.to || '').toLowerCase().includes(q) ||
          (mail.message_id || '').toLowerCase().includes(q)
        );
      });
    },
  },
  actions: {
    async initFromDb() {
      try {
        const mails = await loadMails();
        if (mails) {
          this.mails = mails;
        }
      } catch (err) {
        console.warn('[mailbox] no persisted mails:', err);
      }
    },
    clearMails() {
      const all = [...this.mails];
      this.mails = [];
      this.mailIndex = null;
      this.mail = {};
      dbClearMails();
      deleteAttachmentFiles(all);
    },
    addMail(payload) {
      const arr = payload.to.match(/^<(.+?)>$/);
      if (arr) payload.to = arr[1];
      const mail = {
        ...payload,
        key: newMailKey(),
        seen: false,
        spam_score: "",
        spam_rules: [],
      };
      this.mails.push(mail);
      insertMail(mail);
    },
    setMailIndex(key) {
      let mail_object = {};
      this.mails = this.mails.map(mail => {
        if (mail.key === key) {
          mail_object = mail;
          return {...mail, seen: true};
        }
        return {...mail};
      });
      this.mailIndex = key;
      this.mail = mail_object;
      updateMailSeen(key);
    },
    clearSelection() {
      this.mailIndex = null;
      this.mail = {};
    },
    setSpamScore({key, spam_score, spam_rules}) {
      let mail_object = {};
      this.mails = this.mails.map(mail => {
        if (mail.key === key) {
          mail_object = {...mail, seen: true, spam_score, spam_rules};
          return mail_object;
        }
        return {...mail};
      });
      this.mail = mail_object;
      updateMailSpam(key, spam_score, spam_rules);
    },
    deleteMail(key) {
      const mail = this.mails.find(m => m.key === key);
      this.mails = this.mails.filter(mail => mail.key !== key);
      this.mailIndex = null;
      this.mail = {};
      dbDeleteMail(key);
      if (mail) deleteAttachmentFiles([mail]);
    },
  },
});
