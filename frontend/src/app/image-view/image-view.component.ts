import * as p5 from 'p5';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.css']
})
export class ImageViewComponent implements OnInit, OnDestroy {

  private p5: any;

  @Input() width?: number;
  @Input() height?: number;
  @Input() socket?: WebSocket;

  constructor() {
    console.log('Analog-constructed');
  }

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

  drawing(p: p5) {
    let image: p5.Image;
    let translateX: number;
    let translateY: number;

    const DEFAULT_ZOOM_LEVEL: number = 1;
    let zoomLevel: number = DEFAULT_ZOOM_LEVEL;

    const DEFAULT_TRANSLATE_RATE: number = 1.0;
    let translate_rate: number = DEFAULT_TRANSLATE_RATE;

    let upPressed: boolean;
    let downPressed: boolean;
    let leftPressed: boolean;
    let rightPressed: boolean;


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

      image = p.createImage(1000, 1000);

      translateX = 0;
      translateY = 0;
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
      p.translate(translateX, translateY);
      p.scale(zoomLevel)

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
          translateX = Math.floor(image.width / 2);
          translateY = Math.floor(image.height / 2);
          zoomLevel = DEFAULT_ZOOM_LEVEL;
        }

        // Zoom "+" and "-" buttons
        let changedZoom = false;
        if (p.key === '-') {
          zoomLevel -= 0.1;
        } else if (p.key === "=") {
          zoomLevel += 0.1;
        }
      }
    };
  }
}
