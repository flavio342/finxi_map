import { Injectable } from '@angular/core';
import {SQLite} from 'ionic-native';

@Injectable()
export class DataBaseService{

  public database:SQLite;

  CreateDatabase(){
    this.database = new SQLite();
    this.OpenDatabase().then(()=>{
      this.database.executeSql("CREATE TABLE IF NOT EXISTS machines (id INTEGER PRIMARY KEY AUTOINCREMENT, lat LONG, lng LONG, nbatteries INTEGER, address TEXT)", {}).then((data) => {
        console.log("TABLE CREATED: ", data);
      }, (error) => {
        console.error("Unable to execute sql", error);
      });
    });
  }

  OpenDatabase(){
    return new Promise( (resolve, reject) => {
      this.database.openDatabase({name: "data.db", location: "default"}).then(() => {
        resolve(1);
      }, (error) => {
        console.log("ERROR: ", error);
        reject("error while opening database.");
      });
    });
  }

  CreateMachine(lat,lng,nbatteries,address){
    return new Promise((resolve, reject) => {
      this.database.executeSql("INSERT INTO machines (lat,lng,nbatteries,address) VALUES ('" + lat + "','" + lng + "','" + nbatteries + "','" + address + "')", []).then((data) => {
        console.log("INSERTED: " + JSON.stringify(data));
      }, (error) => {
        console.log("ERROR: " + JSON.stringify(error.err));
      });
      this.database.executeSql("select * from machines order by id desc limit 2;", []).then((data) => {
        resolve(data.rows.item(0).id);
      }, (error) => {
        console.log("ERROR: " + JSON.stringify(error));
        reject("error while creating a machine.");
      });
    });
  }

  DeleteMachine(machine){
    return new Promise((resolve, reject) => {
      this.database.executeSql("DELETE FROM machines WHERE id IN (" + machine.id + ")", []).then((data) => {
        console.log("DELETED: " + JSON.stringify(data));
        resolve(1);
      }, (error) => {
        console.log("ERROR: " + JSON.stringify(error.err));
        reject("error while deleting a machine.");
      });
    });
  }

  ReadMachines(){
    return new Promise( (resolve, reject) => {
      this.database.executeSql("SELECT * FROM machines", []).then((data) => {
        var data = data;
        resolve(data);
      }, (error) => {
        console.log("ERROR: " + JSON.stringify(error));
        reject("error while retrieving machines.");
      });
    });
  }
}
