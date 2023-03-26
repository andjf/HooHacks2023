import * as p5 from 'p5';
import { Component, DoCheck, Input, OnDestroy, OnInit } from '@angular/core';
import { Move } from '../editor/Move';

@Component({
  selector: 'app-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.css']
})
export class ImageViewComponent implements OnInit, OnDestroy, DoCheck {

  private p5: any;

  @Input() socket?: WebSocket;

  @Input() currentLocalMoves: Move[] = [];

  useGlobalImage: boolean = true;

  ngOnInit() {
    console.log('image-view init');
    this.createCanvas();
  }

  ngOnDestroy(): void {
    this.destroyCanvas();
    console.log('image-view destroy');
  }

  private createCanvas = () => {
    console.log('creating canvas');
    this.p5 = new p5(this.drawing);
    this.p5.connectWebsocket(this.socket);
  }

  private destroyCanvas = () => {
    console.log('destroying canvas');
    this.p5.noCanvas();
  }

  ngDoCheck() {
    this.p5.executeMoves(this.currentLocalMoves);
  }

  drawing(p: p5) {
    let image: p5.Image;

    let scale = 1;
    let translateX: number = 0;
    let translateY: number = 0;

    function applyScale(s: number) {
      scale = scale * s;
      translateX = p.mouseX * (1 - s) + translateX * s;
      translateY = p.mouseY * (1 - s) + translateY * s;
    }


    const DEFAULT_TRANSLATE_RATE: number = 1.0;
    let translate_rate: number = DEFAULT_TRANSLATE_RATE;

    let upPressed: boolean;
    let downPressed: boolean;
    let leftPressed: boolean;
    let rightPressed: boolean;


    // @ts-ignore
    p5.prototype.executeMoves = function (moves: Move[]) {
      if (!image)
        return;
      image.loadPixels();
      for (let { x, y, color } of moves) {
        image.set(x, y, p.color(color));
      }
      image.updatePixels();
    }

    // @ts-ignore
    p5.prototype.connectWebsocket = function (socket: any) {
      socket.addEventListener("message", (event: any) => {
        let data = JSON.parse(event.data);
        if (data.message !== "success") {
          return;
        }
        data = data.data;

        const W = data.width;
        const H = data.height;
        console.log(H, W);

        image.loadPixels();

        let pos = 0;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            let color = data.state[y][x];
            image.pixels[pos + 0] = (color & 0xFF0000); // r
            image.pixels[pos + 1] = (color & 0x00FF00); // g
            image.pixels[pos + 2] = (color & 0x0000FF); // b
            image.pixels[pos + 3] = 255; // a
            pos += 4;
          }
        }

        image.updatePixels();
      });

      socket.addEventListener("open", () => {
        socket.send(JSON.stringify({ message: "get_update", data: "" }));
      });
    }

    p.setup = () => {
      const parent = document.getElementById('p5-target');
      if (!parent)
        return

      upPressed = false;
      downPressed = false;
      leftPressed = false;
      rightPressed = false;

      const rect: DOMRect = parent.getBoundingClientRect();
      const W = Math.floor(rect.width);
      const H = Math.floor(rect.height);
      let renderer = p.createCanvas(W, H);
      renderer.elt.width = parent.clientWidth;
      renderer.elt.height = parent.clientHeight;

      renderer.parent('p5-target');


      window.addEventListener("wheel", function (e) {
        if ((p.mouseX > 0 && p.mouseX < p.width) && (p.mouseY > 0 && p.mouseY < p.height)) {
          applyScale(e.deltaY > 0 ? 1.05 : 0.95);
        }
      });


      image = p.createImage(1000, 1000);
      p.noSmooth();
    };

    p.draw = () => {
      // If the mouse is "focused" on the canvas
      if ((p.mouseX > 0 && p.mouseX < p.width) && (p.mouseY > 0 && p.mouseY < p.height)) {
        if (upPressed)
          translateY += translate_rate;
        if (downPressed)
          translateY -= translate_rate;
        if (leftPressed)
          translateX += translate_rate;
        if (rightPressed)
          translateX -= translate_rate;

        if (!upPressed && !downPressed && !leftPressed && !rightPressed) {
          translate_rate = DEFAULT_TRANSLATE_RATE;
        } else {
          translate_rate += 0.10;
        }
      }

      // Apply scale
      p.translate(translateX, translateY);
      p.scale(scale);

      p.background(0);
      p.image(image, 0, 0, image.width, image.height);
    };

    p.keyReleased = () => {
      if (p.keyCode == p.UP_ARROW) {
        upPressed = false;
      } else if (p.keyCode == p.DOWN_ARROW) {
        downPressed = false;
      } else if (p.keyCode == p.LEFT_ARROW) {
        leftPressed = false;
      } else if (p.keyCode == p.RIGHT_ARROW) {
        rightPressed = false;
      }
    }

    p.keyPressed = () => {
      if (p.keyCode === p.UP_ARROW) {
        upPressed = true;
      } else if (p.keyCode === p.DOWN_ARROW) {
        downPressed = true;
      } else if (p.keyCode === p.LEFT_ARROW) {
        leftPressed = true;
      } else if (p.keyCode === p.RIGHT_ARROW) {
        rightPressed = true;
      }

      // If the mouse is "focused" on the canvas
      if ((p.mouseX > 0 && p.mouseX < p.width) && (p.mouseY > 0 && p.mouseY < p.height)) {
        // Backslash resetst the position
        if (p.key === '\\') {
          translateX = 0;
          translateY = 0;
          scale = 1;
        }

        // Zoom "+" and "-" buttons
        if (p.key === '-') {
          applyScale(0.95);
        } else if (p.key === "=") {
          applyScale(1.05);
        }
      }
    };
  }
}
