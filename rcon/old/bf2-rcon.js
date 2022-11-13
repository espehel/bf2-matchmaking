var net = require('net');
var crypto = require('crypto');
var util = require('util');
var events = require('events');

function rcon(options) {
  $rcon = this;
  this.client = net.connect(
    {
      host: options.host,
      port: options.port,
    },
    function () {
      console.log('Connected!');
    }
  );
  this.client.on('data', function (data) {
    var sent = data.toString();
    if (sent.indexOf('### Digest seed: ') != -1) {
      var seed = sent.replace('### Digest seed: ', '').trim();
      console.log('seed: ' + seed);
      $rcon.client.write(
        'login ' +
          crypto
            .createHash('md5')
            .update(seed + options.password)
            .digest('hex') +
          '\n'
      );
    }
    if (sent.indexOf('Authentication successful') != -1) {
      $rcon.emit('authed');
    }
  });
}
util.inherits(rcon, events.EventEmitter);
rcon.prototype.send = function (data, callback) {
  this.client.write(data + '\n');
  this.client.once('data', function (data) {
    callback(data);
  });
};
exports.rcon = rcon;
