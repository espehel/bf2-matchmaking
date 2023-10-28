import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import servers from './routes/servers';
import rounds from './routes/rounds';
import rcon from './routes/rcon';
import matches from './routes/matches';
import {
  error,
  getExpressAccessLogger,
  getExpressErrorLogger,
} from '@bf2-matchmaking/logging';
import {
  initLiveServers,
  updateActiveLiveServers,
  updateIdleLiveServers,
} from './net/ServerManager';
import cron from 'node-cron';
import { updateLiveMatches } from './services/MatchManager';

initLiveServers()
  .then(() => {
    cron.schedule('*/2 * * * *', updateIdleLiveServers);
    cron.schedule('*/10 * * * * *', updateActiveLiveServers);
    cron.schedule('* * * * *', updateLiveMatches);
  })
  .catch((err) => error('app', err));

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(getExpressAccessLogger());

app.use('/servers', servers);
app.use('/rounds', rounds);
app.use('/rcon', rcon);
app.use('/matches', matches);

app.get('/health', (req, res) => {
  res.status(200).send('Ok');
});

app.use(getExpressErrorLogger());
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5002;
app.listen(PORT, () => {
  console.log(`rcon api listening on port ${PORT}`);
});
