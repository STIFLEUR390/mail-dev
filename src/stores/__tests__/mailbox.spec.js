import {beforeEach, describe, expect, it} from 'vitest';
import {createPinia, setActivePinia} from 'pinia';
import {useMailboxStore} from '../mailbox';

// Builds a complete mail object (as emitted by the Rust backend) with
// overridable fields.
function makeMail(overrides = {}) {
  return {
    key: 'k-' + Math.random().toString(36).slice(2),
    mime: 'From: sender@example.com\r\nSubject: Subject\r\n\r\nBody',
    headers: [['From', 'sender@example.com'], ['Subject', 'Subject']],
    text: 'Body',
    html: '',
    from: 'sender@example.com',
    to: 'rcpt@example.com',
    message_id: '<abc@example.com>',
    subject: 'Subject',
    x_priority: '3',
    attachments: [],
    spam_score: '',
    spam_rules: [],
    seen: false,
    ...overrides,
  };
}

describe('mailbox store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('adds a mail with a unique key and unread state', () => {
    const store = useMailboxStore();
    store.addMail({to: 'rcpt@example.com', from: 'a@b.c', subject: 'Hi'});
    expect(store.mails).toHaveLength(1);
    expect(store.mails[0].key).toBeTruthy();
    expect(store.mails[0].seen).toBe(false);
    expect(store.mails[0].spam_score).toBe('');
  });

  it('strips angle brackets from the To header', () => {
    const store = useMailboxStore();
    store.addMail({to: '<rcpt@example.com>', subject: 'Hi'});
    expect(store.mails[0].to).toBe('rcpt@example.com');
  });

  it('marks a mail as seen when selected', () => {
    const store = useMailboxStore();
    store.addMail(makeMail());
    const key = store.mails[0].key;
    store.setMailIndex(key);
    expect(store.mailIndex).toBe(key);
    expect(store.mail.key).toBe(key);
    expect(store.mails[0].seen).toBe(true);
  });

  it('updates the spam score', () => {
    const store = useMailboxStore();
    store.addMail(makeMail());
    const key = store.mails[0].key;
    store.setSpamScore({
      key,
      spam_score: '2.3',
      spam_rules: [{score: '2.3', description: 'RULE'}],
    });
    expect(store.mail.spam_score).toBe('2.3');
    expect(store.mails[0].spam_score).toBe('2.3');
    expect(store.mails[0].spam_rules).toHaveLength(1);
  });

  it('deletes a mail and clears the selection', () => {
    const store = useMailboxStore();
    store.addMail(makeMail());
    const key = store.mails[0].key;
    store.setMailIndex(key);
    store.deleteMail(key);
    expect(store.mails).toHaveLength(0);
    expect(store.mailIndex).toBeNull();
    expect(store.mail).toEqual({});
  });

  it('clears all mails and the selection', () => {
    const store = useMailboxStore();
    store.addMail(makeMail({subject: 'One'}));
    store.addMail(makeMail({subject: 'Two'}));
    store.setMailIndex(store.mails[0].key);
    store.clearMails();
    expect(store.mails).toHaveLength(0);
    expect(store.mailIndex).toBeNull();
  });

  it('clearSelection resets the active mail without touching the list', () => {
    const store = useMailboxStore();
    store.addMail(makeMail());
    store.setMailIndex(store.mails[0].key);
    store.clearSelection();
    expect(store.mailIndex).toBeNull();
    expect(store.mail).toEqual({});
    expect(store.mails).toHaveLength(1);
  });

  describe('search / filter', () => {
    it('returns all mails when the query is empty', () => {
      const store = useMailboxStore();
      store.addMail(makeMail());
      store.addMail(makeMail({subject: 'Other'}));
      expect(store.filteredMails).toHaveLength(2);
    });

    it('filters by subject, case-insensitive', () => {
      const store = useMailboxStore();
      store.addMail(makeMail({subject: 'Invoice #123'}));
      store.addMail(makeMail({subject: 'Welcome'}));
      store.searchQuery = 'INVOICE';
      expect(store.filteredMails).toHaveLength(1);
      expect(store.filteredMails[0].subject).toBe('Invoice #123');
    });

    it('filters by from address', () => {
      const store = useMailboxStore();
      store.addMail(makeMail({from: 'alice@example.com'}));
      store.addMail(makeMail({from: 'bob@example.com'}));
      store.searchQuery = 'alice';
      expect(store.filteredMails).toHaveLength(1);
      expect(store.filteredMails[0].from).toBe('alice@example.com');
    });

    it('filters by recipient', () => {
      const store = useMailboxStore();
      store.addMail(makeMail({to: 'team@example.com'}));
      store.addMail(makeMail({to: 'other@example.com'}));
      store.searchQuery = 'team@';
      expect(store.filteredMails).toHaveLength(1);
    });

    it('filters by message id', () => {
      const store = useMailboxStore();
      store.addMail(makeMail({message_id: '<order-42@shop.com>'}));
      store.addMail(makeMail({message_id: '<other@shop.com>'}));
      store.searchQuery = 'order-42';
      expect(store.filteredMails).toHaveLength(1);
    });

    it('trims surrounding whitespace in the query', () => {
      const store = useMailboxStore();
      store.addMail(makeMail({subject: 'Hello world'}));
      store.searchQuery = '  hello  ';
      expect(store.filteredMails).toHaveLength(1);
    });

    it('returns no results for an unmatched query', () => {
      const store = useMailboxStore();
      store.addMail(makeMail({subject: 'Invoice'}));
      store.searchQuery = 'zzz-nothing';
      expect(store.filteredMails).toHaveLength(0);
    });

    it('updates results when the query changes back to empty', () => {
      const store = useMailboxStore();
      store.addMail(makeMail({subject: 'Invoice'}));
      store.searchQuery = 'Invoice';
      expect(store.filteredMails).toHaveLength(1);
      store.searchQuery = '';
      expect(store.filteredMails).toHaveLength(1);
    });
  });
});
