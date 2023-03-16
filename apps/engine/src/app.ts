import 'dotenv/config';
import express, { Request } from 'express';
import bodyParser from 'body-parser';
import {
  MatchConfigEvent,
  MatchConfigsRow,
  MatchesRow,
  MatchPlayersRow,
  RoundsRow,
  WEBHOOK_POSTGRES_CHANGES_TYPE,
  WebhookPostgresChangesPayload,
} from '@bf2-matchmaking/types';
import {
  error,
  getExpressAccessLogger,
  getExpressErrorLogger,
  info,
} from '@bf2-matchmaking/logging';
import { handleDeletedMatch, handleInsertedMatch, handleUpdatedMatch } from './matches';
import {
  handleDeletedMatchPlayer,
  handleInsertedMatchPlayer,
  handleUpdatedMatchPlayer,
} from './match-players';
import { handleInsertedRound } from './rounds';
import { api } from '@bf2-matchmaking/utils';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(getExpressAccessLogger());

app.post(
  '/matches',
  async (req: Request<{}, {}, WebhookPostgresChangesPayload<MatchesRow>>, res) => {
    info('POST /matches', `Request body: ${JSON.stringify(req.body)}`);
    try {
      switch (req.body.type) {
        case WEBHOOK_POSTGRES_CHANGES_TYPE.INSERT: {
          await handleInsertedMatch(req.body.record);
          break;
        }
        case WEBHOOK_POSTGRES_CHANGES_TYPE.UPDATE: {
          await handleUpdatedMatch(req.body);
          break;
        }
        case WEBHOOK_POSTGRES_CHANGES_TYPE.DELETE: {
          handleDeletedMatch(req.body.old_record);
          break;
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        error('/matches', e.message);
      } else if (typeof e === 'string') {
        error('/matches', e);
      } else {
        error('/matches', JSON.stringify(e));
      }
    }
    res.end();
  }
);

app.post(
  '/match_players',
  async (req: Request<{}, {}, WebhookPostgresChangesPayload<MatchPlayersRow>>, res) => {
    info('POST /match_players', `Request body: ${JSON.stringify(req.body)}`);
    try {
      switch (req.body.type) {
        case WEBHOOK_POSTGRES_CHANGES_TYPE.INSERT: {
          await handleInsertedMatchPlayer(req.body.record);
          break;
        }
        case WEBHOOK_POSTGRES_CHANGES_TYPE.UPDATE: {
          await handleUpdatedMatchPlayer(req.body);
          break;
        }
        case WEBHOOK_POSTGRES_CHANGES_TYPE.DELETE: {
          await handleDeletedMatchPlayer(req.body.old_record);
          break;
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        error('/match_players', e.message);
      } else if (typeof e === 'string') {
        error('/match_players', e);
      } else {
        error('/match_players', JSON.stringify(e));
      }
    }
    res.end();
  }
);

app.post(
  '/rounds',
  async (req: Request<{}, {}, WebhookPostgresChangesPayload<RoundsRow>>, res) => {
    info('POST /rounds', `Request body: ${JSON.stringify(req.body)}`);
    try {
      switch (req.body.type) {
        case WEBHOOK_POSTGRES_CHANGES_TYPE.INSERT: {
          await handleInsertedRound(req.body.record);
          break;
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        error('/rounds', e.message);
      } else if (typeof e === 'string') {
        error('/rounds', e);
      } else {
        error('/rounds', JSON.stringify(e));
      }
    }
    res.end();
  }
);

app.post(
  '/match_configs',
  async (req: Request<{}, {}, WebhookPostgresChangesPayload<MatchConfigsRow>>, res) => {
    info('POST /match_configs', `Request body: ${JSON.stringify(req.body)}`);
    try {
      switch (req.body.type) {
        case WEBHOOK_POSTGRES_CHANGES_TYPE.INSERT: {
          await api
            .bot()
            .postMatchConfigEvent(req.body.record.channel, MatchConfigEvent.INSERT);
          break;
        }
        case WEBHOOK_POSTGRES_CHANGES_TYPE.UPDATE: {
          await api
            .bot()
            .postMatchConfigEvent(req.body.record.channel, MatchConfigEvent.UPDATE);
          break;
        }
        case WEBHOOK_POSTGRES_CHANGES_TYPE.DELETE: {
          if (!req.body.old_record.channel) {
            throw new Error('Deleted match config does not contain channel');
          }
          await api
            .bot()
            .postMatchConfigEvent(req.body.old_record.channel, MatchConfigEvent.DELETE);
          break;
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        error('POST /match_configs', e.message);
      } else if (typeof e === 'string') {
        error('POST /match_configs', e);
      } else {
        error('POST /match_configs', JSON.stringify(e));
      }
    }
    res.end();
  }
);

app.get('/health', (req, res) => {
  res.status(200).send('Ok');
});

app.use(getExpressErrorLogger());
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5004;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`engine listening on port ${PORT}`);
});
