import {defineStore} from 'pinia';
import {
  loadMails,
  insertMail,
  deleteMail as dbDeleteMail,
  clearMails as dbClearMails,
  updateMailSeen,
  updateMailSpam,
} from './db';

export const useMailboxStore = defineStore('mailbox', {
  state: () => ({
    mails: [],
    mailIndex: null,
    mail: {},
  }),
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
      this.mails = [];
      this.mailIndex = null;
      this.mail = {};
      dbClearMails();
    },
    addMail(payload) {
      const arr = payload.to.match(/^<(.+?)>$/);
      if (arr) payload.to = arr[1];
      const mail = {
        ...payload,
        key: Math.random().toString(),
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
      this.mails = this.mails.filter(mail => mail.key !== key);
      this.mailIndex = null;
      this.mail = {};
      dbDeleteMail(key);
    },
  },
});
