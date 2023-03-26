import { Component } from '@angular/core';
import { Move } from './editor/Move';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  socket: WebSocket = new WebSocket("ws://localhost:3000/ws");
  moves: Move[] = [];

  recieveMove($event: Move) {
    this.moves.push($event);
    // console.log(this.moves);
  }
}
