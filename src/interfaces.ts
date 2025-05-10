export type City = {
  continent: string;
  name: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  population: number;
  timezone: string;
};

export interface ASNRecord {
  rir: string;
  country: string;
  asn: number;
}

export interface ANSDelegate {
  rir: string;
  country: string;
  ip: string;
  count: number;
}

export interface IpRecord extends ANSDelegate {
  city: string;
  region: string;
  lat: number;
  lon: number;
  continent: string;
  timezone: string;
  currency: string;
}

// ---------------------

export type AsnEntry = {
  asn: number;
  asName: string;
  orgId: string;
};

export type OrgEntry = {
  orgId: string;
  orgName: string;
  country: string;
};

export type AsnRecord = {
  asn: number;
  name: string; // ex: CLOUDFLARENET
  organization: string; // ex: Cloudflare, Inc.
  country: string; // ex: US
};

export interface PrefixEntry {
  prefix: string;
  asn: number;
}

export interface WhoisInfos {
  netrange: string;
  cidr: string;
  netname: string;
  nethandle: string;
  parent: string;
  nettype: string;
  organization: string;
  regdate: string;
  updated: string;
  ref: string;
  resourcelink: string;
  orgname: string;
  orgid: string;
  address: string;
  city: string;
  country: string;
  comment: string;
  referralserver: string;
  orgtechhandle: string;
  orgtechname: string;
  orgtechphone: string;
  orgtechemail: string;
  orgtechref: string;
  orgabusehandle: string;
  orgabusename: string;
  orgabusephone: string;
  orgabuseemail: string;
  orgabuseref: string;
}
