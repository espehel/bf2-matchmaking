import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import ActionForm from '@/components/form/ActionForm';
import TransitionWrapper from '@/components/commons/TransitionWrapper';
import IconBtn from '@/components/commons/IconBtn';
import MultiSelect from '@/components/commons/MultiSelect';
import { Region } from '@bf2-matchmaking/types/platform';
import { addGeneratedServer } from '@/app/matches/[match]/server/actions';
import { getArray } from '@bf2-matchmaking/utils/form';

interface Props {
  regions: Array<Region>;
  matchId: number;
  locations?: Array<string>;
}
export default function RegionsSelectForm({ regions, matchId, locations }: Props) {
  const options: Array<[string, string]> = regions.map((region) => [
    region.id,
    region.city,
  ]);

  async function setRegionsSA(data: FormData) {
    'use server';
    const locations = getArray(data, 'locationSelect');
    // TODO: Need to fix this, proly new kind of form
    return addGeneratedServer({ region: locations[0], id: matchId });
  }

  return (
    <ActionForm
      action={setRegionsSA}
      successMessage={'Set new regions'}
      errorMessage={'Failed to set regions'}
    >
      <div className="flex gap-2 items-end">
        <MultiSelect
          name="locationSelect"
          placeholder="Select locations"
          label="Locations"
          options={options}
          defaultValues={locations}
        />
        <TransitionWrapper button={true}>
          <IconBtn type="submit" variant="primary" Icon={ArrowRightCircleIcon} />
        </TransitionWrapper>
      </div>
    </ActionForm>
  );
}
