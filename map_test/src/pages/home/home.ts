import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';

import { MenuController } from 'ionic-angular';

import { Geolocation } from 'ionic-native';

import {ConnectivityService} from '../../providers/connectivity-service'

import { LoadingController } from 'ionic-angular';

declare var google;

import{BatteryMachine} from '../battery/battery-machine'

import { AlertController } from 'ionic-angular';

import {SQLite} from "ionic-native";
import {Platform} from 'ionic-angular';

@Component({
  selector: 'home-page',
  templateUrl: 'home.html'
})
export class HomePage {

  batteryMachines: BatteryMachine[] = [];
  maxNBatteries = 15;

  markers = [];

  @ViewChild('map') mapElement: ElementRef;

  map: any;
  mapInitialised: boolean = false;
  apiKey: any = "AIzaSyCpG4B_z3mwmttoVZyQv7mgOm0Vm7h0pgo";

  latLng = {lat: -22.902938, lng: -43.176605};

  public database:SQLite;

  geocoder;

  public currentLocation;

  loader: any = this.loadingCtrl.create({
    content: "Connecting..."
  });

  constructor(public menuCtrl: MenuController, public navCtrl: NavController, public connectivityService: ConnectivityService, public loadingCtrl: LoadingController, private alertCtrl: AlertController,public platform:Platform) {
    this.platform.ready().then(() => {
      this.database = new SQLite();
      this.database.openDatabase({name: "data.db", location: "default"}).then(() => {
        this.refreshMachines();
      }, (error) => {
        console.log("ERROR: ", error);
      });

    });

  }

  goToMachine(machine){
    this.menuCtrl.close();
    var latLng = new google.maps.LatLng(machine.lat, machine.lng);
    this.map.setCenter(latLng);
    this.map.setZoom(17);
    this.setCurrentLocation();
  }

  createMachine(lat,lng,nbatteries,address){
    this.database.executeSql("INSERT INTO machines (lat,lng,nbatteries,address) VALUES ('" + lat + "','" + lng + "','" + nbatteries + "','" + address + "')", []).then((data) => {
      console.log("INSERTED: " + JSON.stringify(data));
    }, (error) => {
      console.log("ERROR: " + JSON.stringify(error.err));
    });
    this.refreshMachines();
  }

  deleteMachine(machine){
    this.database.executeSql("DELETE FROM machines WHERE id IN (" + machine.id + ")", []).then((data) => {
      console.log("DELETED: " + JSON.stringify(data));
    }, (error) => {
      console.log("ERROR: " + JSON.stringify(error.err));
    });
    this.refreshMachines();
  }

  refreshMachines() {
    this.database.executeSql("SELECT * FROM machines", []).then((data) => {
      for (var i = 0; i < this.markers.length; i++) {
        this.markers[i].setMap(null);
      }
      this.markers = [];
      this.batteryMachines = [];
      if(data.rows.length > 0) {
        for(var i = 0; i < data.rows.length; i++) {
          this.batteryMachines.push({id: data.rows.item(i).id, lat: data.rows.item(i).lat, lng: data.rows.item(i).lng, nBatteries: data.rows.item(i).nbatteries, address: data.rows.item(i).address});
          this.addMarker(this.batteryMachines[i].id,this.batteryMachines[i].lat,this.batteryMachines[i].lng,this.batteryMachines[i].nBatteries);
        }
        this.batteryMachines.reverse();
      }
    }, (error) => {
      console.log("ERROR: " + JSON.stringify(error));
    });
    console.log("refreshed");
  }

  updateMachine(machine){

    this.database.executeSql("UPDATE machines SET nbatteries = '" + machine.nBatteries + "' WHERE id =" + machine.id, []).then((data) => {
      console.log("UPDATED: " + JSON.stringify(data));
    }, (error) => {
      console.log("ERROR: " + JSON.stringify(error.err));
    });
    this.refreshMachines();
  }

  ngAfterViewInit(){
    this.loadGoogleMaps();
  }

  openMenu() {
    this.menuCtrl.open();
  }

  openAddMarkerModal() {
    let alert = this.alertCtrl.create({
      title: 'BatteryMachine (' + this.batteryMachines.length + ')',
      inputs: [
        {
          name: 'nBatteries',
          placeholder: 'Number of batteries in machine'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Create',
          handler: data => {
            console.log('Create clicked');
            this.geocoder.geocode({'location': this.map.getCenter()}, (results, status) => {
              if (status === google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                  this.createMachine(this.map.getCenter().lat(), this.map.getCenter().lng(),data.nBatteries, results[1].formatted_address);
                } else {
                  console.log('No results found');
                }
              } else {
                console.log('Geocoder failed due to: ' + status);
              }
            });
          }
        }
      ]
    });
    alert.present();
  }

  addMarker(id,lat,lgn,nBatteries){

    let latLng = new google.maps.LatLng(lat, lgn);

    let iconBase = "assets/images/"
    var icons = {
      few: {
        icon: iconBase + 'lightning3.png'
      },
      averege: {
        icon: iconBase + 'lightning2.png'
      },
      many: {
        icon: iconBase + 'lightning.png'
      }
    };
    let type;
    if(nBatteries <= (this.maxNBatteries/3)){
      type = 'few';
    }else if(nBatteries > (this.maxNBatteries/3) && nBatteries <= (this.maxNBatteries/3)*2){
      type = 'averege';
    }else{
      type = 'many';
    }

    var icon = {
        url: icons[type].icon, // url
        scaledSize: new google.maps.Size(50, 50), // scaled size
        origin: new google.maps.Point(0,0), // origin
        anchor: new google.maps.Point(25, 50) // anchor
    };

    let marker = new google.maps.Marker({
      map: this.map,
      icon: icon,
      animation: google.maps.Animation.DROP,
      position: latLng
    });

    let content = "<h4>Battery (" + id + ")</h4><p>Number of Available Batteries: " + nBatteries + "</p>";
    this.addInfoWindow(marker, content);

    this.markers.push(marker);
  }

  addInfoWindow(marker, content){

    let infoWindow = new google.maps.InfoWindow({
      content: content
    });

    google.maps.event.addListener(marker, 'click', () => {
      infoWindow.open(this.map, marker);
    });

  }

  loadGoogleMaps(){

    this.addConnectivityListeners();

    if(typeof google == "undefined" || typeof google.maps == "undefined"){

      console.log("Google maps JavaScript needs to be loaded.");
      this.disableMap();

      if(this.connectivityService.isOnline()){
        console.log("online, loading map");

        //Load the SDK
        window['mapInit'] = () => {
          this.initMap();
          this.enableMap();
        }

        let script = document.createElement("script");
        script.id = "googleMaps";

        if(this.apiKey){
          script.src = 'http://maps.google.com/maps/api/js?key=' + this.apiKey + '&libraries=places&callback=mapInit';
        } else {
          script.src = 'http://maps.google.com/maps/api/js?libraries=places&callback=mapInit';
        }

        document.body.appendChild(script);

      }
    }
    else {

      if(this.connectivityService.isOnline()){
        console.log("showing map");
        this.initMap();
        this.enableMap();
      }
      else {
        console.log("disabling map");
        this.disableMap();
      }

    }

  }

  initMap(){

    this.mapInitialised = true;

    Geolocation.getCurrentPosition().then((position) => {
      this.latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    });

    let mapOptions = {
      center: this.latLng,
      zoom: 17,
      disableDefaultUI: true,
      disableDoubleClickZoom: true,
      zoomControl: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
    this.geocoder = new google.maps.Geocoder;

    this.goToCurrentLocation();


    var input = document.getElementById('pac-input').getElementsByClassName('searchbar-input-container')[0].getElementsByTagName('input')[0];

    this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(document.getElementById('pac-input'));

    var autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', this.map);

    autocomplete.addListener('place_changed', () => {
      var place = autocomplete.getPlace();
      if (!place.geometry) {
        window.alert("Autocomplete's returned place contains no geometry");
        return;
      }

      // If the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {
        this.map.fitBounds(place.geometry.viewport);
      } else {
        this.map.setCenter(place.geometry.location);
        this.map.setZoom(17);  // Why 17? Because it looks good.
      }
    });
  }

  goToCurrentLocation(){

    Geolocation.getCurrentPosition().then((position) => {
      var initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      this.map.setCenter(initialLocation);
      this.map.setZoom(17);
      this.setCurrentLocation();
    });

  }

  setCurrentLocation() {
    this.geocoder.geocode({'location': this.map.getCenter()}, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          this.currentLocation = results[1].formatted_address;
          console.log(this.currentLocation);
        } else {
          console.log('No results found');
        }
      } else {
        console.log('Geocoder failed due to: ' + status);
      }
    });
  }

  disableMap(){
    console.log("disable map");
    this.loader = this.loadingCtrl.create({
      content: "Connecting..."
    });
    this.loader.present();
  }

  enableMap(){
    console.log("enable map");
    this.loader.dismiss();
  }

  addConnectivityListeners(){

    let onOnline = () => {

      setTimeout(() => {
        if(typeof google == "undefined" || typeof google.maps == "undefined"){

          this.loadGoogleMaps();

        } else {

          if(!this.mapInitialised){
            this.initMap();
          }

          this.enableMap();
        }
      }, 2000);

    };

    let onOffline = () => {
      this.disableMap();
    };

    document.addEventListener('online', onOnline, false);
    document.addEventListener('offline', onOffline, false);

  }
}
