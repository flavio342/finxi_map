import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import{FormsModule} from '@angular/forms'
import { MyApp } from './app.component';

import { HomePage } from '../pages/home/home';

import {ConnectivityService} from '../providers/connectivity-service';
import { IonicStorageModule } from '@ionic/storage';

import{GoogleMapsService} from '../pages/services/googlemaps.service'
import{DataBaseService} from '../pages/services/database.service'

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    FormsModule,
    IonicStorageModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [{provide: ErrorHandler, useClass: IonicErrorHandler},ConnectivityService,GoogleMapsService,DataBaseService]
})
export class AppModule {}
