import {
  LitElement,
  customElement,
  html,
  css
} from 'lit-element';

@customElement('demo-snippet-layout')
export class DemoSnippetLayout extends LitElement {
  static get styles() {
    return css`
      #root {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      #tabs,
      #snippets {
        display: flex;
      }

      #snippets {
        flex-grow: 1;
      }

      #tabs ::slotted([slot='tab']) {
        padding: 0 6px 0 6px;
        border: solid black 1px;
      }

      #tabs ::slotted([slot='tab'][selected]) {
        background-color: black;
        color: white;
      }

      #tabs ::slotted([slot='tab']:hover) {
        cursor: pointer;
      }

      #snippets ::slotted([slot='code']) {
        width: 100%;
        padding: 1rem;
        border: solid 1px #ccc;
        border-bottom: none;
      }

      #snippets ::slotted([slot='code']:not([selected])) {
        display: none;
      }
    `;
  }

  private onTabClick(e: Event) {
    const eventPath = e.composedPath() as (EventTarget | HTMLElement)[];
    let slottedTarget: HTMLElement | null = null;
    for (let target of eventPath) {
      if (!('getAttribute' in target)) {
        continue;
      }

      const slot = target.getAttribute('slot');
      if (slot === 'tab') {
        slottedTarget = target;
        break;
      }
    }

    if (slottedTarget) {
      const currentlySelectedTab = this.querySelector('[slot="tab"][selected]');
      if (currentlySelectedTab) {
        currentlySelectedTab.removeAttribute('selected');
      }

      const currentlySelectedCode = this.querySelector('[slot="code"][selected]');
      if (currentlySelectedCode) {
        currentlySelectedCode.removeAttribute('selected');
      }

      slottedTarget.toggleAttribute('selected', true);
      const classNames = Array.from(slottedTarget.classList).filter(cl =>
        cl.startsWith('link-')
      );
      if (classNames.length) {
        const className = classNames[0];
        const code = this.querySelector(`.${className}[slot="code"]`);

        if (code) {
          code.toggleAttribute('selected', true);
        }
      }
    }
  }

  render() {
    return html`
      <div id="root">
        <div id="tabs" @click=${this.onTabClick}>
          <slot name="tab"></slot>
        </div>
        <div id="snippets">
          <slot name="code"></slot>
        </div>
      </div>
    `;
  }
}
