import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import servers from './routes/servers';
import rounds from './routes/rounds';
import rcon from './routes/rcon';
import matches from './routes/matches';
import { getExpressAccessLogger, getExpressErrorLogger } from '@bf2-matchmaking/logging';

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
