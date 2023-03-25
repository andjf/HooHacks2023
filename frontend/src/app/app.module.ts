import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';
import { ImageViewComponent } from './image-view/image-view.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent,
    ImageViewComponent
  ],
  imports: [
    BrowserModule,
    CodemirrorModule,
    FormsModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
