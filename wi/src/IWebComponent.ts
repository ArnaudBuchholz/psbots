export interface IWebComponent {
  /** Invoked when the custom element is first connected to the document's DOM */
  connectedCallback?: () => void;

  /** Invoked when the custom element is disconnected from the document's DOM */
  disconnectedCallback?: () => void;

  /** Invoked when the custom element is moved to a new document */
  adoptedCallback?: () => void;

  /**
   * Invoked when one of the custom element's attributes is added, removed, or changed.
   * Use static observedAttributes: string[]; to specify which attributes to observe.
   */
  attributeChangedCallback?: (name: string, oldValue: string | null, newValue: string) => void;
}
