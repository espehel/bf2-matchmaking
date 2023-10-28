export type DateResolvable = Date | number | string;
export declare enum GuildScheduledEventPrivacyLevel {
  /**
   * The scheduled event is only accessible to guild members
   */
  GuildOnly = 2,
}

export declare enum GuildScheduledEventEntityType {
  StageInstance = 1,
  Voice = 2,
  External = 3,
}
export interface GuildScheduledEventEntityMetadataOptions {
  location?: string;
}
export type BufferResolvable = Buffer | string;
export type Base64Resolvable = Buffer | Base64String;

export type Base64String = string;

export interface GuildScheduledEventCreateOptions {
  name: string;
  scheduledStartTime: DateResolvable;
  scheduledEndTime?: DateResolvable;
  privacyLevel: GuildScheduledEventPrivacyLevel;
  entityType: GuildScheduledEventEntityType;
  description?: string;
  channel?: string;
  entityMetadata?: GuildScheduledEventEntityMetadataOptions;
  image?: BufferResolvable | Base64Resolvable | null;
  reason?: string;
}
