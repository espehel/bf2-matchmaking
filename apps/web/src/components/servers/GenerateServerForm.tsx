'use client';
import { toast } from 'react-toastify';
import FormSubmitButton from '@/components/FormSubmitButton';
import { generateServer } from '@/app/servers/actions';
import { Region } from '@bf2-matchmaking/types';
import Select from '@/components/commons/Select';
import React from 'react';

interface Props {
  regions: Array<Region>;
}
export default function GenerateServerForm({ regions }: Props) {
  const handleFormAction = async (data: FormData) => {
    const { data: server, error } = await generateServer(data);
    if (error) {
      toast.error(error.message);
    }

    if (server) {
      toast.success(`New server is starting up`);
    }
  };
  return (
    <form action={handleFormAction} className="form-control grid grid-cols-2 gap-4">
      <div>
        <label className="label" htmlFor="matchInput">
          <span className="label-text">Match ID</span>
        </label>
        <input className="input input-bordered" name="matchInput" />
      </div>
      <div className="w-fit">
        <Select
          label="Region"
          name="regionInput"
          options={regions.map(({ id, city, country }) => [id, `${city}, ${country}`])}
        />
      </div>
      <FormSubmitButton>Generate</FormSubmitButton>
    </form>
  );
}
