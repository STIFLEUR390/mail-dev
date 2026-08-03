import {describe, expect, it} from 'vitest';
import {mount} from '@vue/test-utils';
import {createPinia, setActivePinia} from 'pinia';
import {nextTick} from 'vue';
import Mailbox from '../../screens/Mailbox.vue';
import {useMailboxStore} from '../../stores/mailbox';
import {i18n} from '../../i18n';

// Creates a Pinia, sets it active and mounts the screen with it, so the store
// manipulated by the test is the same instance the component uses.
function setup() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(Mailbox, {global: {plugins: [pinia, i18n]}});
  return {wrapper, store: useMailboxStore()};
}

// Two mails that differ enough for filter assertions. Flushes the render
// queue so the list branch is mounted before assertions.
async function seed(store) {
  store.addMail({
    to: 'rcpt@example.com',
    from: 'alice@example.com',
    subject: 'Invoice #42',
    attachments: [],
    html: '',
  });
  store.addMail({
    to: 'rcpt@example.com',
    from: 'bob@example.com',
    subject: 'Welcome aboard',
    attachments: [],
    html: '',
  });
  await nextTick();
}

const searchInput = 'input[aria-label="Search mails…"]';

describe('Mailbox screen', () => {
  it('shows the empty state when there are no mails', () => {
    const {wrapper} = setup();
    expect(wrapper.text()).toContain('No mail to show!');
    expect(wrapper.find(searchInput).exists()).toBe(false);
  });

  it('renders the mail list', async () => {
    const {wrapper, store} = setup();
    await seed(store);
    expect(wrapper.text()).toContain('Invoice #42');
    expect(wrapper.text()).toContain('Welcome aboard');
    expect(wrapper.text()).not.toContain('No mail to show!');
  });

  it('filters the list as the user types in the search box', async () => {
    const {wrapper, store} = setup();
    await seed(store);
    const input = wrapper.find(searchInput);
    expect(input.exists()).toBe(true);

    await input.setValue('invoice');
    await nextTick();
    expect(wrapper.text()).toContain('Invoice #42');
    expect(wrapper.text()).not.toContain('Welcome aboard');

    await input.setValue('alice');
    await nextTick();
    expect(wrapper.text()).toContain('Invoice #42');
    expect(wrapper.text()).not.toContain('Welcome aboard');
  });

  it('shows the no-results message when nothing matches', async () => {
    const {wrapper} = setup();
    await seed(useMailboxStore());
    await wrapper.find(searchInput).setValue('zzz-no-match');
    await nextTick();
    expect(wrapper.text()).toContain('No mails match your search.');
    expect(wrapper.text()).not.toContain('Invoice #42');
    expect(wrapper.text()).not.toContain('Welcome aboard');
  });

  it('restores the full list when the search is cleared', async () => {
    const {wrapper} = setup();
    await seed(useMailboxStore());
    const input = wrapper.find(searchInput);
    await input.setValue('invoice');
    await nextTick();
    expect(wrapper.text()).not.toContain('Welcome aboard');

    await input.setValue('');
    await nextTick();
    expect(wrapper.text()).toContain('Invoice #42');
    expect(wrapper.text()).toContain('Welcome aboard');
  });

  it('clears the search with the inline clear button', async () => {
    const {wrapper} = setup();
    await seed(useMailboxStore());
    await wrapper.find(searchInput).setValue('invoice');
    await nextTick();
    expect(wrapper.text()).not.toContain('Welcome aboard');

    const clear = wrapper.find('button[aria-label="Clear search"]');
    expect(clear.exists()).toBe(true);
    await clear.trigger('click');
    await nextTick();
    expect(wrapper.text()).toContain('Welcome aboard');
  });

  it('selecting a mail opens the detail pane', async () => {
    const {wrapper, store} = setup();
    await seed(store);
    const row = wrapper
      .findAll('div.cursor-pointer.select-none')
      .find(el => el.text().includes('Invoice #42'));
    expect(row).toBeTruthy();
    await row.trigger('click');
    await nextTick();
    expect(store.mailIndex).toBe(store.mails.find(m => m.subject === 'Invoice #42').key);
    expect(wrapper.text()).toContain('alice@example.com'); // From header in the detail pane
  });

  it('delete all asks for confirmation and clears the mailbox', async () => {
    const {wrapper, store} = setup();
    await seed(store);
    await wrapper.find('button[aria-label="Delete all mails"]').trigger('click');
    await nextTick();
    // The dialog mock resolves `true`, so the mailbox is cleared.
    expect(store.mails).toHaveLength(0);
    expect(wrapper.text()).toContain('No mail to show!');
  });
});
