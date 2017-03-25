import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen  } from 'ionic-native';

import { HomePage } from '../pages/home/home';

import{DataBaseService} from '../pages/services/database.service'

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage = HomePage;

  constructor(platform: Platform, private databaseService: DataBaseService) {
    platform.ready().then(() => {
      StatusBar.styleDefault();
      Splashscreen.hide();
      databaseService.CreateDatabase();
    });
  }
}
