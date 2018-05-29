var pcConfig = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};
var socket = io.connect();
var pc;

function logError(err) { console.log(err.toString(), err); }

name = prompt('Enter your name:');


pc = new RTCPeerConnection(pcConfig);

socket.on('message', function(message) {
  if (message.type === 'answer') {
    pc.setRemoteDescription(new RTCSessionDescription(message), function(){}, logError);
  } else if (message.type === 'candidate') {
    pc.addIceCandidate(message.candidate);
  }
});

console.log('sending ready.. ');
socket.emit('ready');

pc.onicecandidate = function(candidate) {
  if (!candidate.candidate) return;
  console.log('candidate! ');
  console.log(candidate.candidate);
  socket.emit('message', {
    type: 'candidate',
    label: candidate.sdpMLineIndex,
    id: candidate.sdpMid,
    candidate: candidate.candidate
  });
};


console.log('creating data channel');
dc = pc.createDataChannel('test1', { ordered: false, maxRetransmits: 0 });
dc.onopen = function() {
  console.log('data channel open');
  dc.onmessage = function(event) {
    var data = event.data;
    console.log('dc1: received "' + data + '" at ' + Date.now());
  };
  setTimeout(function() { dc.send('x: 1234, y: 99.1, more: sefgv'); }, 33);
};


console.log('creating offer.. ');
pc.createOffer().then(
  function (sessionDescription) {
    console.log('set local session description');
    pc.setLocalDescription(sessionDescription);
    socket.emit('message', sessionDescription);
  },
  logError
);

