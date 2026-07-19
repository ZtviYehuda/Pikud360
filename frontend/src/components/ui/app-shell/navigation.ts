import { NavigationItem } from "./types";

export class NavigationRegistry {
  private static items: NavigationItem[] = [];

  /**
   * Registers a single navigation entry to the menu pool.
   * Avoids duplicate entry IDs.
   */
  public static register(item: NavigationItem) {
    const exists = this.items.some((i) => i.id === item.id);
    if (!exists) {
      this.items.push(item);
    }
  }

  /**
   * Registers multiple navigation entries at once.
   */
  public static registerMany(items: NavigationItem[]) {
    items.forEach((item) => this.register(item));
  }

  /**
   * Gets the list of all registered navigation items.
   */
  public static getItems(): NavigationItem[] {
    return [...this.items];
  }

  /**
   * Clears all registered navigation items (mostly for test isolation).
   */
  public static clear() {
    this.items = [];
  }
}
