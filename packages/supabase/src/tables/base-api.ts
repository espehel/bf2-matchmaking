import { Database } from '@bf2-matchmaking/types';
import { PostgrestQueryBuilder } from '@supabase/postgrest-js';

type PublicSchema = Database['public'];
export function baseApi<
  TableName extends string & keyof PublicSchema['Tables'],
  Table extends PublicSchema['Tables'][TableName]
>(table: PostgrestQueryBuilder<PublicSchema, Table>) {
  return {
    insert: (values: Table['Insert']) =>
      table
        .insert(values as any)
        .select('*')
        .single(),
    update: () => table.update,
    delete: () => table.delete,
  };
}
