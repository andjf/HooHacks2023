import { Component } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  animations: [
    trigger('outAnimation', [transition(':leave', [animate('0.75s ease-in', style({ height: 0, opacity: 0 }))])])
  ]
})
export class EditorComponent {
  content: string = `set sides 10
set turn_amount 360
set side_length 15

div turn_amount sides

pendown
repeat sides:
  forward side_length
  turn turn_amount
`;

  showError: boolean = true;
  errorMessage: string = `This is a multiline error message\n\n  Line 15 column 89: unrecognized token "among"\n\nFix or blah, blah, blah`

  lineFormatter(line: string): string {
    return `${line} | `;
  }

  closeErrorMessage() {
    this.showError = false;
    this.errorMessage = "";
  }
}
