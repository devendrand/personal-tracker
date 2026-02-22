// Swim Performance Tracker - Type definitions

export enum PoolType {
  SCY = 'SCY',
  SCM = 'SCM',
  LCM = 'LCM'
}

export enum Stroke {
  FREESTYLE = 'freestyle',
  BACKSTROKE = 'backstroke',
  BREASTSTROKE = 'breaststroke',
  BUTTERFLY = 'butterfly',
  IM = 'im'
}

export interface Swimmer {
  id: number;
  name: string;
  dateOfBirth: string;
  teamName?: string;
  age: number;
}

export interface SwimmerCreate {
  name: string;
  dateOfBirth: string;
  teamName?: string;
}

export interface SwimEvent {
  id: number;
  distance: number;
  unit: string;
  stroke: string;
  poolType: string;
  displayName: string;
}

export interface SwimMeet {
  id: number;
  name: string;
  date: string;
  location?: string;
  notes?: string;
}

export interface SwimMeetCreate {
  name: string;
  date: string;
  location?: string;
  notes?: string;
}

export interface SwimTime {
  id: number;
  swimmerId: number;
  eventId: number;
  meetId?: number;
  timeSeconds: number;
  timeFormatted: string;
  recordedDate: string;
  poolType: string;
  notes?: string;
  isPr: boolean;
  event: SwimEvent;
}

export interface SwimTimeCreate {
  eventId: number;
  timeFormatted: string;
  recordedDate: string;
  poolType: string;
  meetName?: string;
  notes?: string;
}

export interface PRDashboardRow {
  eventId: number;
  eventName: string;
  poolType: string;
  currentPr: string;
  currentPrSeconds: number;
  prDate: string;
  firstTime: string;
  firstTimeSeconds: number;
  improvementSeconds: number;
  improvementPercent: number;
  totalTimesLogged: number;
}

export interface EventProgressionPoint {
  date: string;
  timeSeconds: number;
  timeFormatted: string;
  isPr: boolean;
  meetName?: string;
}

export interface EventProgressionResponse {
  event: SwimEvent;
  times: EventProgressionPoint[];
}
