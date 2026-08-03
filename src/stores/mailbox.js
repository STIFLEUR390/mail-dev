import {defineStore} from 'pinia';

export const useMailboxStore = defineStore('mailbox', {
  state: () => ({
    mails: [],
    mailIndex: null,
    mail: {},
  }),
  actions: {
    clearMails() {
      this.mails = [];
      this.mailIndex = null;
      this.mail = {};
    },
    addMail(payload) {
      const arr = payload.to.match(/^<(.+?)>$/);
      if (arr) payload.to = arr[1];
      this.mails.push({
        ...payload,
        key: Math.random().toString(),
        seen: false,
        spam_score: "",
        spam_rules: [],
      });
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
    },
    deleteMail(key) {
      this.mails = this.mails.filter(mail => mail.key !== key);
      this.mailIndex = null;
      this.mail = {};
    },
  },
});
