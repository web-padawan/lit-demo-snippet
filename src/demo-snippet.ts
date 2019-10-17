import {
  LitElement,
  html,
  customElement,
  css,
  property,
  TemplateResult,
  PropertyValues,
} from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { until } from 'lit-html/directives/until';

import 'prismjs';
import 'prismjs/components/prism-js-templates.js';

import { FileRecord } from './types.js';
import { EMPTY_INDEX } from './constants.js';
import { fetchProject, fetchTemplate, importJs } from './util.js';

import './demo-snippet-layout.js';

declare global {
  interface Window {
    Prism: typeof import('prismjs');
  }
}

const { highlight, languages } = window.Prism;

import prismTheme from './prism-theme.js';

@customElement('demo-snippet')
export class DemoSnippet extends LitElement {

  @property({ attribute: 'template-path', type: String })
  templatePath?: string;

  @property({ attribute: 'project-path', type: String })
  projectPath?: string;

  @property({ attribute: 'js-path', type: String })
  jsPath?: string;

  @property({ attribute: 'when-defined', type: String })
  whenDefined?: string;

  @property({ type: Boolean }) initialized = false;

  @property({ type: Boolean }) imported = false;

  @property({ type: Boolean }) htmlReady = false;

  private lastProjectPath?: string;
  private snippetsReady: Promise<FileRecord[]> = Promise.resolve([ EMPTY_INDEX ]);
  private templateReady: Promise<string> = Promise.resolve('');
  private jsImported: Promise<Function> = Promise.resolve(() => {});

  private async renderSnippets(
    projectFetched: Promise<FileRecord[]>
  ): Promise<TemplateResult[]> {
    const fileRecords = await projectFetched;
    let firstEditor = true;
    let index = 0;

    // Sort so HTML comes first
    const records = fileRecords.sort((a, b) => {
      return a.extension < b.extension ? -1 : 1;
    });

    const tabs: TemplateResult[] = records.map(fileRecord => {
      let grammar;

      const { extension } = fileRecord;

      switch (extension) {
        case 'js':
          grammar = languages.javascript;
          break;
        default:
          grammar = languages.markup;
      }

      let content = fileRecord.content;
      if (extension === 'js') {
        content = content.replace(/'(.+)(?=@vaadin)/g, `'`);

        if (this.whenDefined) {
          content = content.replace(
            'export default (document => {',
            `customElements.whenDefined('${this.whenDefined}').then(() => {`
          );
        }
      }

      const formatted = unsafeHTML(highlight(content, grammar, extension));

      const tResult = html`
        <span
          slot="tab"
          class=${'link-' + index.toString()}
          ?selected=${firstEditor}
        >
          ${extension}
        </span>
        <pre
          slot="code"
          class=${'link-' + index.toString()}
          ?selected=${firstEditor}
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
          max-width: 800px;
        }

        #output {
          border: solid 1px #ccc;
          padding: 1rem;
        }

        pre {
          margin: 0;
        }
      `
    ];
  }

  private async renderTemplate(
    templateFetched: Promise<string>
  ): Promise<TemplateResult> {
    const template = await templateFetched;
    return html`
      <div id="output">
        ${unsafeHTML(template)}
      </div>
    `;
  }

  render() {
    const isNewProject = this.projectPath &&
      this.templatePath &&
      this.lastProjectPath !== this.projectPath;

    if (isNewProject) {
      this.lastProjectPath = this.projectPath;
      this.snippetsReady = fetchProject(this.projectPath!);
      this.templateReady = fetchTemplate(this.templatePath!).then(tpl => {
        this.htmlReady = true;
        return tpl;
      });

      if (this.jsPath) {
        this.jsImported = importJs(this.jsPath!).then(cb => {
          this.imported = true;
          return cb;
        });
      }
    }

    return html`
      <div id="wrapper">
        <demo-snippet-layout>
          ${until(this.renderSnippets(this.snippetsReady))}
        </demo-snippet-layout>
        ${until(this.renderTemplate(this.templateReady))}
      </div>
    `;
  }

  async updated(props: PropertyValues) {
    super.updated(props);

    if ((props.has('imported') || props.has('htmlReady')) && this.htmlReady && this.imported) {
      const cb = await this.jsImported;
      cb(this.shadowRoot!.querySelector('#output'));
    }
  }
}
