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

  drawing (p: p5) {
    let image: p5.Image;
    let centerX: number;
    let centerY: number;

    const DEFAULT_ZOOM_LEVEL: number = 1;
    let zoomLevel: number = DEFAULT_ZOOM_LEVEL;

    const DEFAULT_TRANSLATE_RATE: number = 1.0;
    let translate_rate: number = DEFAULT_TRANSLATE_RATE;

    let upPressed: boolean;
    let downPressed: boolean;
    let leftPressed: boolean;
    let rightPressed: boolean;


    // @ts-ignore
    p5.prototype.connectWebsocket = function(socket: any) {
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
        socket.send(JSON.stringify({message: "get_update", data: ""}));
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

      // getState();

      centerX = Math.floor(W / 2);
      centerY = Math.floor(H / 2);

      p.noSmooth();
    };

    p.draw = () => {
      let destWidth = p.width / (zoomLevel * 2);
      let destHeight = p.height / (zoomLevel * 2);


      if (upPressed)
        centerY -= translate_rate;
      if (downPressed)
        centerY += translate_rate;
      if (leftPressed)
        centerX -= translate_rate;
      if (rightPressed)
        centerX += translate_rate;

      if (!upPressed && !downPressed && !leftPressed && !rightPressed) {
        translate_rate = DEFAULT_TRANSLATE_RATE;
      } else {
        translate_rate += 0.10;
      }

      p.background(0);
      p.image(image, 0, 0, p.width, p.height, centerX - destWidth, centerY - destHeight, destWidth, destHeight);
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

      if (p.key === ' ') {
        centerX = Math.floor(image.width / 2);
        centerY = Math.floor(image.height / 2);
        zoomLevel = DEFAULT_ZOOM_LEVEL;
      }

      if (p.key === '-') {
        zoomLevel = Math.max(1, zoomLevel - 5);
      } else if (p.key === "=") {
        zoomLevel = Math.min(80, zoomLevel + 5);
      }
    };
  }
}
