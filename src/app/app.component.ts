import { Component, OnInit } from '@angular/core';
import * as io from "socket.io-client";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

  userText: string;
  translationText: string;
  targets: [string];
  target: string;
  visibility = {
    canListen: false,
    translationVisible: false
  }

  socket: SocketIOClient.Socket;

  constructor() {
    this.socket = io.connect();
  }
  
  ngOnInit() {
    this.userText = "";
    this.translationText = "";
    this.target = "";
    this.visibility.canListen = false;
    this.visibility.translationVisible = false;
    this.listenToEvents();
  }


  listenToEvents() {
    this.socket.on("targets", targets => {
      this.targets = targets.targets;
    });

    this.socket.on("translation", translation => {
      this.translationText = translation;
      this.visibility.translationVisible = true;
    });

    this.socket.on("mp3", fileName => {
      const audioTag = <HTMLAudioElement>document.getElementById("au");
      audioTag.src = `${fileName}?time=` + new Date().getTime();
      audioTag.load();
      this.visibility.canListen = true;
    }); 
  }

  submitText() {
    this.socket.emit("newText", {
      target: this.target,
      text: this.userText
    })
    this.visibility.canListen = false;
    this.visibility.translationVisible = false;
  }

  onSelect(target: string) {
    this.target = target;
  }

}
