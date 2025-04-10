import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts'; // If you're using ngx-echarts

import { AppComponent } from './app.component';
import { TripVisualizerComponent } from './trip-visualizer/trip-visualizer.component';

@NgModule({
  declarations: [AppComponent, TripVisualizerComponent],
  imports: [
    BrowserModule,
    FormsModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
