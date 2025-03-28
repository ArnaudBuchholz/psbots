import { defineConfig } from 'vite';

export default defineConfig({
  base: '',
  build: {
    // caniuse[.]com/mdn-javascript_operators_await_top_level
    target: ['chrome89', 'edge89', 'safari15', 'firefox89', 'opera75']
  }
});
