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
  }

  private destroyCanvas = () => {
    console.log('destroying canvas');
    this.p5.noCanvas();
  }

  private drawing = function (p: p5) {
    let image: p5.Image;
    let centerX: number;
    let centerY: number;
    let zoomLevel: number = 20;

    let upPressed: boolean;
    let downPressed: boolean;
    let leftPressed: boolean;
    let rightPressed: boolean;

    const getState = () => {
      p.httpGet("http://localhost:3000/api/state", "json", false, (resp) => {
        console.log(resp);
        const W = resp.state.width;
        const H = resp.state.height;
        console.log(H, W);

        image.loadPixels();

        let pos = 0;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            let color = resp.state.state[y][x];
            image.pixels[pos + 0] = (color & 0xFF0000); // r
            image.pixels[pos + 1] = (color & 0x00FF00); // g
            image.pixels[pos + 2] = (color & 0x0000FF); // b
            image.pixels[pos + 3] = 255; // a
            pos += 4;
          }
        }

        image.updatePixels();
      });
    };

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
      p.createCanvas(W, H).parent('p5-target');

      image = p.createImage(1000, 1000);

      getState();

      centerX = Math.floor(W / 2);
      centerY = H;

      p.noSmooth();
    };

    p.draw = () => {
      let destWidth = p.width / (zoomLevel * 2);
      let destHeight = p.height / (zoomLevel * 2);

      if (upPressed)
        centerY -= 0.5;
      if (downPressed)
        centerY += 0.5;
      if (leftPressed)
        centerX -= 0.5;
      if (rightPressed)
        centerX += 0.5;

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
      if (p.keyCode == p.UP_ARROW) {
        upPressed = true;
      } else if (p.keyCode == p.DOWN_ARROW) {
        downPressed = true;
      } else if (p.keyCode == p.LEFT_ARROW) {
        leftPressed = true;
      } else if (p.keyCode == p.RIGHT_ARROW) {
        rightPressed = true;
      }

      if (p.key === '-') {
        zoomLevel = Math.max(5, zoomLevel - 10);
      } else if (p.key === "=") {
        zoomLevel = Math.min(80, zoomLevel + 10);
      }
    };
  }
}
