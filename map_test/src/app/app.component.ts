import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen, SQLite  } from 'ionic-native';

import { HomePage } from '../pages/home/home';


@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage = HomePage;

  constructor(platform: Platform) {

    platform.ready().then(() => {
        StatusBar.styleDefault();
        Splashscreen.hide();
        let db = new SQLite();
        db.openDatabase({
            name: "data.db",
            location: "default"
        }).then(() => {
            /*db.executeSql("DROP TABLE machines", {}).then((data) => {
                console.log("TABLE DROPED: ", data);
            }, (error) => {
                console.error("Unable to execute sql", error);
            })*/
            db.executeSql("CREATE TABLE IF NOT EXISTS machines (id INTEGER PRIMARY KEY AUTOINCREMENT, lat LONG, lng LONG, nbatteries INTEGER, address TEXT)", {}).then((data) => {
                console.log("TABLE CREATED: ", data);
            }, (error) => {
                console.error("Unable to execute sql", error);
            })
        }, (error) => {
            console.error("Unable to open database", error);
        });
      });
  }
}
