import {describe, expect, it} from 'vitest';
import {mount} from '@vue/test-utils';
import SwitchToggle from '../SwitchToggle.vue';

describe('SwitchToggle', () => {
  it('renders the switch role with aria state', () => {
    const wrapper = mount(SwitchToggle, {props: {modelValue: true, label: 'Enable'}});
    expect(wrapper.attributes('role')).toBe('switch');
    expect(wrapper.attributes('aria-checked')).toBe('true');
    expect(wrapper.attributes('aria-label')).toBe('Enable');
  });

  it('reflects the off state', () => {
    const wrapper = mount(SwitchToggle, {props: {modelValue: false, label: 'x'}});
    expect(wrapper.attributes('aria-checked')).toBe('false');
  });

  it('emits update:modelValue with the inverted value on click', async () => {
    const wrapper = mount(SwitchToggle, {props: {modelValue: false, label: 'x'}});
    await wrapper.trigger('click');
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted[0]).toEqual([true]);
  });

  it('does not emit when the value is unchanged (click only)', async () => {
    const wrapper = mount(SwitchToggle, {props: {modelValue: true, label: 'x'}});
    await wrapper.trigger('click');
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
  });
});
