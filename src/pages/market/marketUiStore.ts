import { createStore } from "elk-components";

/**
 * Global UI flags shared between the Market page and the app shell.
 * When `navHidden` is true the floating bottom navbar is hidden so the market
 * search mode can take a full screen, scrolling right under the mobile header.
 */
export const marketUiStore = createStore<{ navHidden: boolean }>({
  navHidden: false,
});
