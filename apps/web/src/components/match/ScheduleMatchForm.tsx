import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import moment from 'moment';
import FormSubmitButton from '@/components/FormSubmitButton';
import Select from '@/components/commons/Select';
import DatetimeInput from '@/components/commons/DatetimeInput';
import { createScheduledMatch } from '@/app/matches/actions';
import CollapseControl from '@/components/commons/CollapseControl';

export default async function ScheduleMatchForm() {
  const configs = await supabase(cookies)
    .getMatchConfigs()
    .then(verifyResult)
    .then(filterVisible);
  const teams = await supabase(cookies)
    .getVisibleTeams()
    .then(verifyResult)
    .then(filterVisible);
  const servers = await supabase(cookies).getServers().then(verifyResult);

  return (
    <div className="max-w-5xl mx-auto">
      <CollapseControl label="Schedule match">
        <form action={createScheduledMatch} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <Select
              label="Match type"
              name="configSelect"
              options={configs.map(({ id, name }) => [id, name])}
            />
            <DatetimeInput
              label="Match start"
              name="scheduledInput"
              defaultValue={moment()
                .add(1, 'day')
                .hours(21)
                .minute(0)
                .format('YYYY-MM-DDTHH:mm')}
              min={moment().format('YYYY-MM-DDTHH:mm')}
            />
          </div>
          <div className="flex gap-4">
            <Select
              label="Home team"
              name="homeSelect"
              options={teams.map(({ id, name }) => [id, name])}
            />
            <Select
              label="Away team"
              name="awaySelect"
              options={teams.map(({ id, name }) => [id, name])}
            />
          </div>
          <Select
            label="Server"
            name="serverSelect"
            options={servers.map(({ ip, name }) => [ip, name])}
          />
          <div className="flex items-center justify-end">
            <FormSubmitButton>Schedule match</FormSubmitButton>
          </div>
        </form>
      </CollapseControl>
    </div>
  );
}

function filterVisible<T extends { visible: boolean }>(array: Array<T>): Array<T> {
  return array.filter((e) => e.visible);
}
