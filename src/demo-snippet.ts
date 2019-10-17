import {
  LitElement,
  html,
  customElement,
  css,
  property,
  TemplateResult,
} from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { until } from 'lit-html/directives/until';

import 'prismjs';
import 'prismjs/components/prism-js-templates.js';

import { FileRecord } from './types.js';
import { EMPTY_INDEX } from './constants.js';
import { fetchProject } from './util.js';

import './demo-snippet-layout.js';

// @ts-ignore
const { highlight, languages } = Prism;

import prismTheme from './prism-theme.js';

@customElement('demo-snippet')
export class DemoSnippet extends LitElement {

  @property({ attribute: 'project-path', type: String })
  projectPath?: string;

  private lastProjectPath?: string;
  private projectContentsReady: Promise<FileRecord[]> = Promise.resolve([
    EMPTY_INDEX
  ]);

  private async renderSnippets(
    projectFetched: Promise<FileRecord[]>
  ): Promise<TemplateResult[]> {
    const fileRecords = await projectFetched;
    let firstEditor = true;
    let index = 0;

    const tabs: TemplateResult[] = fileRecords.map(fileRecord => {
      let grammar;

      switch (fileRecord.extension) {
        case 'js':
          grammar = languages.javascript;
          break;
        default:
          grammar = languages.markup;
      }

      const formatted = unsafeHTML(highlight(fileRecord.content, grammar, fileRecord.extension));

      const tResult = html`
        <span
          slot="tab"
          class=${'link-' + index.toString()}
          ?selected=${firstEditor}
        >
          ${fileRecord.extension}
        </span>
        <pre
          slot="code"
          class=${'link-' + index.toString()}
          ?selected=${firstEditor}
          .name=${fileRecord.name}
          .extension=${fileRecord.extension}
          ><code>${formatted}</code></pre>
      `;

      firstEditor = false;
      index++;
      return tResult;
    });

    return tabs;
  }

  static get styles() {
    return [
      prismTheme,
      css`
        :host {
          display: block;
          height: 350px;
        }

        pre {
          margin: 0;
        }
      `
    ];
  }

  render() {
    const isNewProject = this.projectPath && this.lastProjectPath !== this.projectPath;

    if (isNewProject) {
      this.lastProjectPath = this.projectPath;
      this.projectContentsReady = fetchProject(this.projectPath!);
    }

    return html`
      <div id="wrapper">
        <demo-snippet-layout>
          ${until(this.renderSnippets(this.projectContentsReady))}
        </demo-snippet-layout>
      </div>
    `;
  }
}
