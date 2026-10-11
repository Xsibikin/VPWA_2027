import { defineBoot } from '#q-app';
import { Dark } from 'quasar';

export default defineBoot(() => {
  Dark.set(localStorage.getItem('gather-theme') === 'dark');
});
