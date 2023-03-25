import * as p5 from 'p5';
import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.css']
})
export class ImageViewComponent implements OnInit, OnDestroy {

  private toggle = true;
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

  private setup(p: any) {

  }

  private drawing = function (p: any) {
    p.setup = () => {
      console.log(p);
      const parent = document.getElementById('p5-target');
      if (parent) {
        const rect: DOMRect = parent.getBoundingClientRect();
        console.log(rect.width, rect.height)
        p.createCanvas(rect.width, rect.height).parent('p5-target');
      }
    };

    p.draw = () => {
      p.background(0);
    };

  }
}
