export interface Instance {
  id: string;
  os: string;
  ram: number;
  disk: number;
  main_ip: string;
  vcpu_count: number;
  region: string;
  plan: string;
  date_created: string;
  status: 'active' | 'pending' | 'suspended' | 'resizing';
  allowed_bandwidth: number;
  netmask_v4: string;
  gateway_v4: string;
  power_status: 'running' | 'stopped';
  server_status: 'none' | 'locked' | 'installingbooting' | 'ok';
  v6_network: string;
  v6_main_ip: string;
  v6_network_size: string;
  label: string;
  internal_ip: string;
  kvm: string;
  hostname: string;
  tag: string;
  tags: Array<string>;
  os_id: number;
  app_id: number;
  image_id: string;
  firewall_group_id: string;
  features: Array<'auto_backups' | 'ipv6' | 'ddos_protection'>;
  user_scheme: 'root' | 'limited';
  default_password: string;
}

export interface Plan {
  id: string;
  vcpu_count: number;
  ram: number;
  disk: number;
  disk_count: number;
  bandwidth: number;
  monthly_cost: number;
  type: string;
  locations: string[];
}
type RegionOption =
  | 'ddos_protection'
  | 'block_storage_high_perf'
  | 'block_storage_storage_opt'
  | 'kubernetes'
  | 'load_balancers';
export interface Region {
  id: string;
  city: string;
  country: string;
  continent: string;
  options: Array<RegionOption>;
}

export interface StartupScript {
  id: string;
  date_created: string;
  date_modified: string;
  name: string;
  type: 'boot';
}
