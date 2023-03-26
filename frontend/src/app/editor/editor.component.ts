import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';

import * as Module from '../../assets/pkg/compiler';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { Doc, TextMarker } from 'codemirror';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  animations: [
    trigger('outAnimation', [
      transition(':leave', [animate('0.5s ease-in', style({ height: 0, opacity: 0 }))])
    ])
  ]
})
export class EditorComponent implements OnInit {
  @ViewChild('codeEditor', { static: false }) codeEditor?: CodemirrorComponent;

  content: string = `set sides 10
set turn_amount 360
set side_length 15

div turn_amount sides

pendown
repeat sides:
  forward side_length
  turn turn_amount
`;

  @Input() socket?: WebSocket;

  private rust?: typeof Module;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    const rustPromise: Promise<typeof Module> = import('../../assets/pkg');
    rustPromise.then(r => (this.rust = r)).catch(console.error);
  }

  showError: boolean = false;
  errorMessage: SafeHtml = `This is a multiline error message\n\n  Line 15 column 89: unrecognized token "among"\n\nFix or blah, blah, blah`

  lineHighlight: null | number = null;
  ticks: any[] = [];
  tickIndex = 0;
  showRun: boolean = false;
  marker: null | TextMarker = null;
  updates: Set<any> = new Set();

  lineFormatter(line: string): string {
    return `${line} | `;
  }

  submitClicked() {
    this.ticks = this.rust?.compile_and_execute(this.content, { x: 500, y: 500 }, 1000, 1000);
    this.tickIndex = 0;
    this.stepAll();

    let data: any[] = [];
    this.updates.forEach((val) => {
      data.push(val);
    });
    console.log(data);
    this.socket?.send(JSON.stringify({message: "post_update", data: data}));
  }

  runClicked() {
    try {
      this.closeErrorMessage();
      this.showRun = false;
      this.ticks = this.rust?.compile_and_execute(this.content, { x: 500, y: 500 }, 1000, 1000);
      this.tickIndex = 0;
      this.showRun = true;
      this.step();
    }
    catch (error: any) {
      this.raiseError(error.toString());
    }
  }


  step() {
    if (this.tickIndex >= this.ticks.length) {
      this.showRun = false;
      this.marker?.clear();
      return false;
    }
    let tick = this.ticks[this.tickIndex];

    this.lineHighlight = tick.Tick?.line;
    if (this.lineHighlight === null || this.lineHighlight === undefined)  {
      this.lineHighlight = tick.Changed?.line;
    }
    if (this.lineHighlight === null || this.lineHighlight === undefined)  {
      this.lineHighlight = tick.Invalid?.line;
    }

    if (this.lineHighlight !== null) {
      const { doc } = this;
      if (doc) {
        // Clear markers
        this.marker?.clear();
        this.marker = doc.markText({ line: this.lineHighlight, ch: 0 }, { line: this.lineHighlight, ch: 100 }, {
          className: "current-inst",
        });
      }
    }

    if (tick.Invalid) {
      this.raiseError(tick.Invalid.message);
      this.showRun = false;
      return false;
    }
    else if (tick.Changed) {
      for (let p of tick.Changed.modified) {
        this.updates.add({"x": p.x, "y": p.y, "color": parseInt(tick.Changed.color.substring(1), 16)});
      }
    }

    this.tickIndex++;
    return true;
  }

  stepAll() {
    while (this.step()) {}
  }

  get doc() {
    return (this.codeEditor?.codeMirror as any) as Doc;
  }

  closeErrorMessage() {
    this.showError = false;
    this.errorMessage = "";
  }

  raiseError(errorMessage: string) {
    this.showError = true;
    this.errorMessage = this.sanitizer.bypassSecurityTrustHtml(errorMessage.replaceAll("'\r'", "'\\r'").replaceAll("'\n'", "'\\n'"));
  }
}
