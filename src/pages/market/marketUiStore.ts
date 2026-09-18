import { createStore } from "elk-components";

/**
 * Global UI flags shared between the Market page and the app shell.
 * When `navHidden` is true the floating bottom navbar is hidden so the market
 * can take a full screen. When `headerHidden` is true the market page's own
 * sticky header (title / search / refresh) is hidden, e.g. while a fullscreen
 * product detail panel is open.
 */
export const marketUiStore = createStore<{ navHidden: boolean; headerHidden: boolean }>({
  navHidden: false,
  headerHidden: false,
});
