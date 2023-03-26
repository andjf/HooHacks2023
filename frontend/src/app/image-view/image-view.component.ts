import * as p5 from 'p5';
import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.css']
})
export class ImageViewComponent implements OnInit, OnDestroy {

  private p5: any;

  constructor() {
    console.log('Analog-constructed');
    window.onresize = this.onWindowResize;
  }

  ngOnInit() {
    console.log('image-view init');
    this.createCanvas();
  }

  ngOnDestroy(): void {
    this.destroyCanvas();
    console.log('image-view destroy');
  }

  private onWindowResize = (e: any) => {
    this.p5.resizeCanvas(this.p5.windowWidth, this.p5.windowHeight);
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
    let image: p5.Graphics;
    let centerX: number;
    let centerY: number;
    let zoomLevel: number = 50;

    let displayImage: p5.Graphics;

    p.setup = () => {
      const parent = document.getElementById('p5-target');
      if (!parent)
        return

      const rect: DOMRect = parent.getBoundingClientRect();
      const W = Math.floor(rect.width);
      const H = Math.floor(rect.height);
      p.createCanvas(W, H).parent('p5-target');

      image = p.createGraphics(W, H);
      image.loadPixels();
      for (let y = 0; y < H * 4; y++) {
        for (let x = 0; x < W * 4; x++) {
          image.pixels[(y * W + x) * 4 + 0] = p.random(256); // r
          image.pixels[(y * W + x) * 4 + 1] = p.random(256); // g
          image.pixels[(y * W + x) * 4 + 2] = p.random(256); // b
          image.pixels[(y * W + x) * 4 + 3] = 255; // a
        }
      }
      image.updatePixels();

      displayImage = p.createGraphics(Math.floor(W / zoomLevel), Math.floor(H / zoomLevel));

      centerX = Math.floor(W / 2);
      // centerX = 0;
      // centerX = W - displayImage.width;

      centerY = Math.floor(H / 2);
      // centerY = 0;
      // centerY = H - displayImage.height;

      displayImage.loadPixels();
      for (let dy = 0, y = centerY; dy < displayImage.height; dy++, y++) {
        for (let dx = 0, x = centerX; dx < displayImage.width; dx++, x++) {
          displayImage.set(dx, dy, image.get(x, y));
        }
      }
      displayImage.updatePixels();

      p.noSmooth();
    };

    p.draw = () => {
      p.background(0);
      p.image(displayImage, 0, 0, p.width, p.height);
    };

    p.mousePressed = () => {
      if (p.mouseButton == p.RIGHT) {
        zoomLevel = Math.min(80, zoomLevel + 10);
      } else if (p.mouseButton == p.LEFT) {
        zoomLevel = Math.max(10, zoomLevel - 10);
      }
      displayImage = p.createGraphics(Math.floor(image.width / zoomLevel), Math.floor(image.height / zoomLevel));
      displayImage.loadPixels();
      for (let dy = 0, y = centerY; dy < displayImage.height; dy++, y++) {
        for (let dx = 0, x = centerX; dx < displayImage.width; dx++, x++) {
          displayImage.set(dx, dy, image.get(x, y));
        }
      }
      displayImage.updatePixels();
    }

    p.keyPressed = () => {
      let changed = false;
      if (p.key === 'w' && centerY > 0) {
        centerY--;
        changed = true;
      } else if (p.key === 's' && centerY + displayImage.height < image.height) {
        centerY++;
        changed = true;
      } else if (p.key === 'd' && centerX + displayImage.width < image.width) {
        centerX++;
        changed = true;
      } else if (p.key === 'a' && centerX > 0) {
        centerX--;
        changed = true;
      }

      if (changed) {
        displayImage.loadPixels();
        for (let dy = 0, y = centerY; dy < displayImage.height; dy++, y++) {
          for (let dx = 0, x = centerX; dx < displayImage.width; dx++, x++) {
            displayImage.set(dx, dy, image.get(x, y));
          }
        }
        displayImage.updatePixels();
      }
    };
  }
}
