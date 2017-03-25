import { Component} from '@angular/core';
import { NavController } from 'ionic-angular';
import { MenuController } from 'ionic-angular';
import {ConnectivityService} from '../../providers/connectivity-service'
import { LoadingController } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import {Platform} from 'ionic-angular';
import {Keyboard} from 'ionic-native'

import { ViewChild, ElementRef } from '@angular/core';

import{GoogleMapsService} from '../services/googlemaps.service'
import{DataBaseService} from '../services/database.service'

@Component({
  selector: 'home-page',
  templateUrl: 'home.html'
})
export class HomePage {

  batteryMachines = [];
  loader = this.loadingCtrl.create({
    content: "Connecting..."
  });
  marker = this.loadingCtrl.create({
    content: "Creating Machine..."
  });
  address = this.loadingCtrl.create({
    content: "Getting Current Address..."
  });
  nearest = this.loadingCtrl.create({
    content: "Searching for nearest machine..."
  });;
  route = this.loadingCtrl.create({
    content: "Creating Route..."
  });;

  @ViewChild('map') mapElement: ElementRef;

  constructor(private databaseService:DataBaseService, private googlemapsService: GoogleMapsService, public menuCtrl: MenuController, public navCtrl: NavController, public connectivityService: ConnectivityService, public loadingCtrl: LoadingController, private alertCtrl: AlertController,public platform:Platform) {
    this.platform.ready().then(() => {
      databaseService.OpenDatabase().then(() => {
        this.refreshMachines();
        this.createAllMarkers();
      });
      this.menuCtrl.swipeEnable(false, 'rightMenu');
    });
  }

  ngAfterViewInit(){
    this.googlemapsService.mapElement = this.mapElement;
    this.googlemapsService.rightPanel = document.getElementById('right-panel');
    this.googlemapsService.searchBar = document.getElementById('pac-input');
    this.googlemapsService.input = document.getElementById('pac-input').getElementsByClassName('searchbar-input-container')[0].getElementsByTagName('input')[0];

    this.loadGoogleMaps();
  }

  goToCurrentLocation(){
    this.address = this.loadingCtrl.create({
      content: "Getting Current Address..."
    });
    this.address.present();
    this.googlemapsService.GetCurrentLatLng().then((currentLatLng) =>{
      this.googlemapsService.GoTo(currentLatLng);
      this.googlemapsService.SetCurrentLocationMarker(currentLatLng);
      this.address.dismiss();
    });
  }

  setCurrentLocation(){
    var center = this.googlemapsService.GetCenter();
    var centerLatLng = this.googlemapsService.ConvertToLatLngObj(center.lat(),center.lng());
    this.googlemapsService.SetCurrentAddress(centerLatLng).then(()=>{
      this.googlemapsService.SetCurrentAddress(centerLatLng);
    });
  }

  ToogleRoute(){
    if(this.googlemapsService.isShowingRoute){
      this.googlemapsService.RemoveRoute();
    }else{
      this.route = this.loadingCtrl.create({
        content: "Creating Route..."
      });;
      this.route.present();
      var center = this.googlemapsService.GetCenter();
      this.googlemapsService.RouteTo(this.googlemapsService.ConvertToLatLngObj(center.lat(), center.lng())).then(()=>{
        this.route.dismiss();
      });
    }
  }

  createMachine(lat,lng,nbatteries,address){
    this.databaseService.CreateMachine(lat,lng,nbatteries,address).then((id)=>{
      this.googlemapsService.AddMarker(id,lat,lng,nbatteries,address);
      this.refreshMachines();
      this.marker.dismiss();
    });
  }

  deleteMachine(machine){
    this.googlemapsService.DeleteMarker(machine.id);
    this.databaseService.DeleteMachine(machine);
    this.refreshMachines();
  }

  refreshMachines() {
    this.databaseService.database.executeSql("SELECT * FROM machines", []).then((data) => {
      this.batteryMachines = [];
      if(data.rows.length > 0) {
        for(var i = 0; i < data.rows.length; i++) {
          this.batteryMachines.push({id: data.rows.item(i).id, lat: data.rows.item(i).lat, lng: data.rows.item(i).lng, nBatteries: data.rows.item(i).nbatteries, address: data.rows.item(i).address});
        }
        this.batteryMachines.reverse();
      }
    });
  }

  routeToMachine(machine){
    this.route = this.loadingCtrl.create({
      content: "Creating Route..."
    });;
    this.route.present();
    this.googlemapsService.RouteTo(this.googlemapsService.ConvertToLatLngObj(machine.lat,machine.lng)).then(()=>{
      this.route.dismiss();
      this.menuCtrl.close();
    });
  }

  routeToNearestMachine() {
    this.nearest = this.loadingCtrl.create({
      content: "Searching for nearest machine..."
    });
    this.nearest.present();
    this.googlemapsService.GetCurrentLatLng().then((currentLatLng)=>{
      var closest = -1;
      var distances = [];
      if(this.batteryMachines.length <= 0){
        this.nearest.dismiss();
        return;
      }
      for(let i=0;i<this.batteryMachines.length; i++ ) {
        var mLatLng = this.googlemapsService.ConvertToLatLngObj(this.batteryMachines[i].lat, this.batteryMachines[i].lng);
        distances[i] = this.googlemapsService.GetDistanceBetween(currentLatLng,mLatLng);
        if ( closest == -1 || distances[i] < distances[closest] ) {
          closest = i;
        }
      }
      this.googlemapsService.RouteTo(this.batteryMachines[closest]).then(()=>{
        this.nearest.dismiss();
      });
    });
  }

  createAllMarkers(){
    this.databaseService.ReadMachines().then((data)=>{
      this.googlemapsService.CreateAllMarkers(data);
    });
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
            Keyboard.close();
            this.marker = this.loadingCtrl.create({
              content: "Creating Machine..."
            });
            this.marker.present();
            setTimeout(()=>{
              this.googlemapsService.GetCenterLocation().then((results)=>{
                var center = this.googlemapsService.GetCenter();
                this.createMachine(center.lat(), center.lng(), data.nBatteries, results[0].formatted_address);
              });
            },1000);
          }
        }
      ]
    });
    alert.present();
  }

  loadGoogleMaps(){

    this.addConnectivityListeners();

    if(this.googlemapsService.HasNotGoogleJSLoaded()){

      console.log("Google maps JavaScript needs to be loaded.");
      this.disableMap();

      if(this.connectivityService.isOnline()){
        console.log("online, loading map");

        //Load the SDK
        window['InitMap'] = () => {
          this.googlemapsService.InitMap();
          this.enableMap();
          this.goToCurrentLocation();
        }

        let script = document.createElement("script");
        script.id = "googleMaps";

        if(this.googlemapsService.apiKey){
          script.src = 'http://maps.google.com/maps/api/js?key=' + this.googlemapsService.apiKey + '&libraries=places&callback=InitMap';
        } else {
          script.src = 'http://maps.google.com/maps/api/js?libraries=places&callback=InitMap';
        }

        document.body.appendChild(script);

      }
    }
    else {

      if(this.connectivityService.isOnline()){
        console.log("showing map");
        this.googlemapsService.InitMap();
        this.enableMap();
        this.goToCurrentLocation();

      }
      else {
        console.log("disabling map");
        this.disableMap();
      }

    }

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
        if(this.googlemapsService.HasNotGoogleJSLoaded()){

          this.loadGoogleMaps();

        } else {

          if(!this.googlemapsService.isMapInitialised){
            this.googlemapsService.InitMap();
            this.goToCurrentLocation();
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
