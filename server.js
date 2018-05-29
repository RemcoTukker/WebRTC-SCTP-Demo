'use strict';

var static1 = require('node-static');
var http = require('http');
var file = new(static1.Server)();
var app = http.createServer(function (req, res) { file.serve(req, res); }).listen(8000);
console.log('Listening at http://localhost:8000');

var io = require('socket.io').listen(app);
var webrtc = require('wrtc');
var RTCPeerConnection = webrtc.RTCPeerConnection;
var RTCSessionDescription = webrtc.RTCSessionDescription;

var pcConfig = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
var aSocket; // TODO manage multiple sockets to allow for multiple players..
var pc;

function logError(err) { console.log(err.toString(), err); }


io.sockets.on('connection', function (socket){
  console.log('a user connected');
  aSocket = socket;
  socket.on('ready', createPeerConnection);
  socket.on('message', function (message){
    console.log('We received message:', message);
    if (message.type === 'offer') {
      console.log('Got offer. Sending answer to peer.');
      pc.setRemoteDescription(new RTCSessionDescription(message), function(){}, logError);
      pc.createAnswer().then(
        function (sessionDescription) {
          pc.setLocalDescription(sessionDescription);
          aSocket.emit('message', sessionDescription);
        },
        logError
      );
    } else if (message.type === 'candidate') {
      pc.addIceCandidate(message.candidate);
    }
  });
});


function createPeerConnection() {
  pc = new RTCPeerConnection(pcConfig);
  pc.onicecandidate = function(candidate) {
    if (!candidate.candidate) return;
    console.log('candidate! ');
    console.log(candidate.candidate);
    aSocket.emit('message', {
      type: 'candidate',
      label: candidate.sdpMLineIndex,
      id: candidate.sdpMid,
      candidate: candidate.candidate
    });
  };
  pc.ondatachannel = function(event) {
    var dc = event.channel;
    dc.onopen = function() {
      console.log('data channel open');
      dc.onmessage = function(event) {
        var data = event.data;
        console.log('dc: received "' + data + '" at ' + Date.now());
      };
    };
    setTimeout(function() { dc.send('x:42, y:-2.99, more: asdfghj'); }, 33);
  };
}

