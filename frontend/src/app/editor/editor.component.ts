import { Component, OnInit } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';

import * as Module from '../../assets/pkg/compiler';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  animations: [
    trigger('outAnimation', [
      transition(':leave', [animate('0.75s ease-in', style({ height: 0, opacity: 0 }))])
    ])
  ]
})
export class EditorComponent implements OnInit {

  content: string = `set sides 10
set turn_amount 360
set side_length 15

div turn_amount sides

pendown
repeat sides:
  forward side_length
  turn turn_amount
`;

  private rust?: typeof Module;

  ngOnInit(): void {
    const rustPromise: Promise<typeof Module> = import('../../assets/pkg');
    rustPromise.then(r => (this.rust = r)).catch(console.error);
  }


  showError: boolean = true;
  errorMessage: string = `This is a multiline error message\n\n  Line 15 column 89: unrecognized token "among"\n\nFix or blah, blah, blah`

  lineFormatter(line: string): string {
    return `${line} | `;
  }

  submitClicked() {
    console.log(this.rust?.compile_and_execute(this.content, { x: 500, y: 500 }));
  }

  runClicked() {
    this.raiseError(this.content);
  }

  closeErrorMessage() {
    this.showError = false;
    this.errorMessage = "";
  }

  raiseError(errorMessage: string) {
    this.showError = true;
    this.errorMessage = errorMessage;
  }
}
