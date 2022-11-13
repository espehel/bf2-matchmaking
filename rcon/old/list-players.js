var bf2 = require('./bf2-rcon');
var options = {
  host: 'csgo2.4e.fi',
  port: 4711,
  password: 'super123',
};
var rcon = new bf2.rcon(options);
var usermatch = /Id: \s?([0-9]*) - (.*) is remote ip: ([0-9\.]*):([0-9]*)/g;
var userlist = [];
rcon.on('authed', function () {
  userlist = [];
  this.send('exec admin.listPlayers', function (data) {
    data = data.toString();
    match = usermatch.exec(data);
    while (match != null) {
      userlist.push({
        id: match[1],
        name: match[2],
        ip: match[3],
        port: match[4],
      });
      match = usermatch.exec(data);
    }
    console.log(userlist);
  });
});
