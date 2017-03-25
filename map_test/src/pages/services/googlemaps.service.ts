import { Injectable } from '@angular/core';
import { Geolocation } from 'ionic-native';

declare var google;

@Injectable()
export class GoogleMapsService{

  apiKey: any = "AIzaSyCpG4B_z3mwmttoVZyQv7mgOm0Vm7h0pgo";

  mapElement;
  input;
  searchBar;
  rightPanel;

  map: any;
  isMapInitialised: boolean = false;
  isShowingRoute: boolean = false;
  defaultLatLng = {lat: -22.902938, lng: -43.176605};

  geocoder;
  directionsDisplay;
  directionsService;

  public currentAddress = "Loading Address...";

  markers = [];
  currentLocationMarker;
  maxNBatteries = 15;

  InitMap(){

    this.isMapInitialised = true;

    let mapOptions = {
      center: this.defaultLatLng,
      zoom: 17,
      disableDefaultUI: true,
      disableDoubleClickZoom: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    this.directionsDisplay = new google.maps.DirectionsRenderer;
    this.directionsService = new google.maps.DirectionsService;
    this.geocoder = new google.maps.Geocoder;

    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    this.directionsDisplay.setMap(this.map);
    this.directionsDisplay.setPanel(this.rightPanel);

    this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(this.searchBar);
    var autocomplete = new google.maps.places.Autocomplete(this.input);
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

  SetCurrentAddress(latLng) {
    return new Promise((resolve, reject) => {
      this.geocoder.geocode({'location': latLng}, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
          if (results[0]) {
            this.currentAddress = results[0].formatted_address;
            console.log(this.currentAddress);
            resolve(1);
          } else {
            console.log('No results found');
            reject("error while setting current address.");
          }
        } else {
          console.log('Geocoder failed due to: ' + status);
          reject("error while setting current address.");
        }
      });
    });
  }

  GoTo(position){
    this.map.setCenter(position);
    this.map.setZoom(17);
    this.SetCurrentAddress(position);
  }

  RouteTo(end){
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition().then((position) => {
        var start = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        this.directionsService.route({
          origin: start,
          destination: end,
          travelMode: google.maps.TravelMode.DRIVING
        }, (response, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            this.directionsDisplay.setDirections(response);
            this.directionsDisplay.setMap(this.map);
            this.directionsDisplay.setOptions( { suppressMarkers: true } );
            this.isShowingRoute = true;
            resolve(1);
          } else {
            window.alert('Directions request failed due to ' + status);
            reject("error while routing to target.");
          }
        });
      });
    });
  }

  RemoveRoute(){
    this.directionsDisplay.setMap(null);
    this.isShowingRoute = false;
  }

  GetCurrentLatLng(){
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition().then((position) => {
        var currentLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        resolve(currentLatLng);
      },() => {
        reject("error while getting current position.");
      });
    });
  }

  GetDistanceBetween(start,end){
    return google.maps.geometry.spherical.computeDistanceBetween(start,end);
  }

  ConvertToLatLngObj(lat,lng){
    return  new google.maps.LatLng(lat, lng);
  }

  GetCenterLocation(){
    return new Promise((resolve, reject) => {
      this.geocoder.geocode({'location': this.map.getCenter()}, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
          if (results[0]) {
            resolve(results);
          } else {
            console.log('No results found');
            reject("error while getting center location.");
          }
        } else {
          console.log('Geocoder failed due to: ' + status);
          reject("error while getting center location.");
        }
      });
    });
  }

  GetCenter(){
    return this.map.getCenter();
  }

  HasNotGoogleJSLoaded(){
    return typeof google == "undefined" || typeof google.maps == "undefined"
  }

  AddMarker(id,lat,lng,nBatteries,address){

    let latLng = this.ConvertToLatLngObj(lat, lng);

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
      id: id,
      map: this.map,
      icon: icon,
      animation: google.maps.Animation.DROP,
      position: latLng
    });

    let content = "<h4>Machine (" + id + ")</h4><p>" + address + "</p><p>Number of Available Batteries: " + nBatteries + "</p>";
    this.addInfoWindow(marker, content);

    this.markers.push(marker);
  }

  SetCurrentLocationMarker(latLng){

    if(this.currentLocationMarker != null){
      this.currentLocationMarker.setMap(null);
      this.currentLocationMarker = null;
    }

    var icon = {
      url: "assets/images/current.png", // url
      scaledSize: new google.maps.Size(20, 20), // scaled size
      origin: new google.maps.Point(0,0), // origin
      anchor: new google.maps.Point(10, 20) // anchor
    };
    let marker = new google.maps.Marker({
      map: this.map,
      icon: icon,
      animation: google.maps.Animation.DROP,
      position: latLng
    });
    this.currentLocationMarker = marker;
  }

  addInfoWindow(marker, content){

    let infoWindow = new google.maps.InfoWindow({
      content: content
    });

    google.maps.event.addListener(marker, 'click', () => {
      infoWindow.open(this.map, marker);
    });

  }

  DeleteMarker(id){
    for (var i = 0; i < this.markers.length; i++) {
      if(this.markers[i].id == id){
        this.markers[i].setMap(null);
        this.markers.splice(i);
      }
    }
  }

  CreateAllMarkers(data){
    this.markers = [];
    if(data.rows.length > 0) {
      for(var i = 0; i < data.rows.length; i++) {
        this.AddMarker(data.rows.item(i).id,data.rows.item(i).lat,data.rows.item(i).lng,data.rows.item(i).nbatteries, data.rows.item(i).address);
      }
    }
  }

}
