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
  info,
} from '@bf2-matchmaking/logging';
import {
  initLiveServers,
  updateActiveLiveServers,
  updateIdleLiveServers,
  updatePendingServers,
} from './net/ServerManager';
import cron from 'node-cron';
import { updatePendingLiveMatches } from './services/MatchManager';
import { loadMapsCache } from './services/maps';

const inactiveTasks = cron.schedule(
  '*/2 * * * *',
  async () => {
    await updateIdleLiveServers();
    await updatePendingLiveMatches();
  },
  { scheduled: false }
);
const activeTasks = cron.schedule('*/10 * * * * *', updateActiveLiveServers, {
  scheduled: false,
});

const pendingServerTask = cron.schedule('*/30 * * * * *', updatePendingServers, {
  scheduled: false,
});

loadMapsCache();
initLiveServers()
  .then(() => {
    inactiveTasks.start();
    activeTasks.start();
    pendingServerTask.start();
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
  info('app', `rcon api listening on port ${PORT}`);
});
