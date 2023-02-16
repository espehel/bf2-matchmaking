const net = require('net');
const crypto = require('crypto');
const fs = require('fs');

const eventPort = 8080;
const LOCALHOST = '127.0.0.1';
let client;

const eventHandler = net.createServer((socket) => {
  console.log('wa connected');
  let serverInfo;
  let isForcefullyEndingRound = false;

  socket.on('data', (chunk) => {
    const data = chunk.toString().split('\t');
    const eventType = data[0];
    try {
      switch (eventType) {
        case 'gameStateEndGame':
          return handleGameStateEndGame(data);
        case 'serverInfo':
          return handleServerInfo(data);
        case 'chatServer':
          return handleChatServer(data);
        default:
          console.log(`wa: ${chunk.toString()}.`);
      }
    } catch (e) {
      console.error(e);
    }
  });
  socket.on('end', () => {
    console.log('wa disconnected');
    handleClientError()
    //handleDisconnect(5000);
  });
  socket.on('error', (err) => {
    console.log(`Event handler error: ${err}`);
  });

  const handleGameStateEndGame = async (data) => {
    console.log(`handling ${data[0]}`);

    if (isForcefullyEndingRound) {
      console.log('Forcefully ended round detected.');
      isForcefullyEndingRound = false;
      return;
    }
    const event = {
      type: data[0],
      team1: {
        name: data[1],
        tickets: data[2],
      },
      team2: {
        name: data[3],
        tickets: data[4],
      },
      map: data[5],
    };

    const si = await client?.send('bf2cc si');
    const pl = await client?.send('bf2cc pl');

    const res = await fetch('https://bf2-rcon-api-production.up.railway.app/rounds', {
      method: 'POST',
      body: JSON.stringify({ event, serverInfo, si, pl }),
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    });
    const textRes = await res.text();
    console.log(`POST /rounds, Status: ${res.status}, Message: ${textRes}`);
  };

  const handleServerInfo = (data) => {
    console.log(`handling ${data[0]}`);
    const event = {
      type: data[0],
      serverName: data[1],
      mapList: data[2],
      gamePort: data[3],
      queryPort: data[4],
      maxPlayers: data[5],
      ip: process.env.BF2_SERVER_IP,
    };
    serverInfo = event;
  };

  const handleChatServer = (data) => {
    const [type, channel, flags, text] = data;
    console.log(`${channel}: ${text} [flags: ${flags}]`);
    if (channel === 'ServerMessage' && text.includes('Changing Map to:')) {
      isForcefullyEndingRound = true;
    }
  };
});
const handleDisconnect = (timeout) => {
  client = initWebAdmin();
  setTimeout(() => {
    eventHandler.getConnections((err, count) => {
      if (count === 0) {
        console.log(`retrying connection in ${timeout / 1000} seconds...`);
        handleDisconnect(timeout*1.5);
      }
    });
  }, timeout);
};

eventHandler.listen(eventPort, () => {
  console.log(`Event handler listening on port ${eventPort}.`);
  client = initWebAdmin();
});

const initWebAdmin = () => {
  console.log(`connecting to ${LOCALHOST}:${process.env.RCON_PORT}`);

  const waClient = net.createConnection(
    { port: process.env.RCON_PORT, host: LOCALHOST },
    () => {
      console.log('connected to rcon');
    }
  );

  waClient.on('data', (chunk) => {
    const data = chunk.toString();
    if (data.includes('### Digest seed: ')) {
      handleLogin(data);
    }
    if (data.includes('Authentication successful')) {
      console.log('authenticated');
      handleWaConnection();
    }
  });

  waClient.on('end', () => {
    console.log('disconnected from rcon');
  });

  waClient.on('error', (err) => {
    console.log(`WA client error: ${err}`);
    handleClientError();
  });

  const handleLogin = (data) => {
    const seed = data.split('### Digest seed: ').at(-1).trim();
    console.log(`authenticating with seed ${seed}`);
    waClient.write(
      'login ' +
        crypto
          .createHash('md5')
          .update(seed + process.env.RCON_PASSWORD)
          .digest('hex') +
        '\n'
    );
  };

  const handleWaConnection = () => {
    const rconCmd = `wa connect ${LOCALHOST} ${eventPort} \n`;
    console.log(`setting up wa connection with command "${rconCmd}"`);
    waClient.write(rconCmd);
    waClient.once('data', (response) => {
      console.log(`response from wa: ${response.toString()}`);
    });
  };

  return {
    send: (message) =>
      new Promise((resolve, reject) => {
        console.log(`sending message: ${message}`);
        waClient.write(message + '\n');
        waClient.once('data', (response) => {
          console.log('response received');
          resolve(response.toString());
        });
      }),
  };
};

const handleClientError = () => {
  console.log(`WA client retrying in 10 seconds...`);
  setTimeout(() => {
    eventHandler.getConnections((err, count) => {
      if (count === 0) {
        client = initWebAdmin();
      }
    });
  }, 10000);
};

const verify = (variable, message) => {
  if (!variable) {
    throw new Error(message);
  }
};
verify(process.env.RCON_PORT, 'process.env.RCON_PORT is not defined.');
verify(process.env.RCON_PASSWORD, 'process.env.RCON_PASSWORD is not defined.');
verify(process.env.BF2_SERVER_IP, 'process.env.BF2_SERVER_IP is not defined.');
verify(fetch, 'Fetch not defined, use node 18 or newer.');
const http = require('http');
//
const { execFile, exec } = require('child_process');
const path = require('path');

const PORT = 1025;

const restartBf2Path = path.resolve(__dirname, './restart-bf2.sh');
const getWhitelistExec = (ip) =>
  `sudo firewall-cmd --zone=public --add-rich-rule='  rule priority=-1 family="ipv4" source address="${ip}/32" port protocol="udp" port="16567" accept'`;
const getBlockExec = () =>
  `sudo /usr/bin/firewall-cmd --zone=public --add-rich-rule=' rule priority=0 family=ipv4 port port="16567" protocol="udp" reject'`;
const getUnblockExec = () => `sudo /usr/bin/firewall-cmd --reload`;

const hash = crypto.createHash('sha512');
const HASHED_KEY =
  'CDaLUXjI8DHQi2Dk9hn5Aqe1HcSRU8npql+c6DvRrGGPzHgC9HO4jwGhlAC2MLuN3+Tx1FofxOCfZzibpo3ucA==';
const isAuthorized = (apiKey) => {
  return typeof apiKey === 'string'
    ? crypto.timingSafeEqual(hash.copy().update(apiKey).digest(), Buffer.from(HASHED_KEY, 'base64'))
    : false;
};

const httpHandler = (req, res, body) => {
  const { method, url, headers } = req;
  if (!isAuthorized(body.apiKey)) {
    console.log('401');
    res.statusCode = 401;
  } else if (method === 'POST' && url === '/restart' && body.mapName ) {
    console.log('/restart mapName restarting...');
    body.mapName === typeof body.mapName === 'string';
    body.serverName === typeof body.serverName === 'string';
    execFile(restartBf2Path, [body.mapName, "inf", body.serverName] , printExec );
    exec(getUnblockExec(), printExec);
  } else if (method === 'POST' && url === '/restart') {
    console.log('/restart restarting...');
    execFile(restartBf2Path, printExec);
    exec(getUnblockExec(), printExec);
  } else if (method === 'POST' && url === '/restart_vehicles') {
    console.log('/restart_vehicles restarting...');
    body.mapName === typeof body.mapName === 'string';
    body.serverName === typeof body.serverName === 'string';
    execFile(restartBf2Path, [body.mapName, "vehicles", body.serverName], printExec );
    exec(getUnblockExec(), printExec);
  } else if (method === 'POST' && url === '/lock') {
    console.log('locking...');
    exec(getBlockExec(), printExec);
  } else if (method === 'POST' && url === '/whitelist') {
    body.whitelist.forEach((ip) => {
      if (ip.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
        console.log(`whitelisting ip ${ip}...`);
        exec(getWhitelistExec(ip), printExec);
      }
    });
  } else if (method === 'POST' && url === '/unlock') {
    console.log('unlocking...');
    exec(getUnblockExec(), printExec);
  } else {
    console.log('404');
    res.statusCode = 404;
  }
  res.end();
};

const parseBody = (cb) => (req, res) => {
  let chunks = [];
  req.on('data', (chunk) => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    const buffer = Buffer.concat(chunks).toString();
    let body;
    try {
      body = JSON.parse(buffer);
    } catch (e) {
      body = {};
    }
    cb(req, res, body);
  });
};

const printExec = (err, stdout, stderr) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  }
};

const server = http.createServer(parseBody(httpHandler));
server.listen(PORT, process.env.BF2_SERVER_IP, () => {
  console.log(`Listening on port http://${process.env.BF2_SERVER_IP}:${PORT}`);
});



const serverLockfile = path.resolve('server/bf2_firewall.lockfile');
const ipStreamLockfile = path.resolve('server/bf2_stream.lockfile');
let lastLine = '';

// Read the initial last line of the file
try {
  lastLine = fs.readFileSync(serverLockfile, 'utf-8').trim().split('\n').pop();
} catch (error) {
  console.error(`Failed to read file: ${error}`);
  fs.writeFileSync(serverLockfile, '');
  console.error(`File ${serverLockfile} created`);
  //process.exit(1);
}
try {
  ipLastLine = fs.readFileSync(ipStreamLockfile, 'utf-8').trim().split('\n').pop();
} catch (error) {
  console.error(`Failed to read file: ${error}`);
  fs.writeFileSync(ipStreamLockfile, '');
  console.error(`File ${ipStreamLockfile} created`);
  //process.exit(1);
}

// Start watching the file for changes
fs.watch(serverLockfile, { persistent: true }, (eventType, filename) => {
 // console.error(eventType, serverLockfile, eventType === 'change' , filename, serverLockfile, filename === path.basename(serverLockfile) )
  if (eventType === 'change' && filename === path.basename(serverLockfile)) {
    // Read the current last line of the file
    let currentLine = '';
    try {
      currentLine = fs.readFileSync(serverLockfile, 'utf-8').trim().split('\n').pop();
    } catch (error) {
      console.error(`Failed to read file: ${error}`);
      return;
    }

    // Check if the last line and current line are different
    if (lastLine !== currentLine) {
      lastLine = currentLine;

      // Check if the current line contains "lock"
      if (currentLine === 'lock') {
        console.log('Run command when file ends with "lock"');
        exec(getBlockExec(), printExec);
        console.log('locking...');
      }

      // Check if the current line contains "unlock"
      else if (currentLine === 'unlock') {
        console.log('Run command when file ends with "unlock"');
        exec(getUnblockExec(), printExec);
        console.log('unlocking...');
      }
    }
  }
});

fs.watch(ipStreamLockfile, { persistent: true }, (eventType, filename) => {
  if (eventType === 'change' && filename === path.basename(ipStreamLockfile)) {
    // Read the current last line of the file
    let currentLine = '';
    try {
      ipCurrentLine = fs.readFileSync(ipStreamLockfile, 'utf8').trim().split('\n').pop();
    } catch (error) {
      console.error(`Failed to read file: ${error}`);
      return;
    }

  // Check if the last line and current line of the IP file are different
  if (ipLastLine !== ipCurrentLine) {
    // Update the last line with the current line
    ipLastLine = ipCurrentLine;

    // Extract IP addresses from the current line
    const ips = ipCurrentLine.match(/\d+\.\d+\.\d+\.\d+/g) || [];

    // Run the firewall command for each IP address
    ips.forEach(ip => {
    exec(getWhitelistExec(ip), printExec);
    console.log('whitelisting some streamer...');
    });
  }
  }
});
