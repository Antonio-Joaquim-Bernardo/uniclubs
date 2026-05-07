export type StorageMode = "postgres" | "demo";

export type ClubStatus = "ativo" | "pausado" | "arquivado";
export type MemberStatus = "ativo" | "pendente" | "suspenso";
export type UserRole = "admin_sistema" | "admin_clube" | "membro";
export type MembershipRole = "membro" | "admin_clube";
export type EventStatus = "ativo" | "cancelado" | "finalizado";
export type RegistrationStatus = "confirmado" | "pendente" | "cancelado";

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

export const initialActionState: ActionState = {
  status: "idle",
  message: "",
};

export interface ClubSummary {
  id: number;
  name: string;
  description: string;
  category: string;
  objective: string | null;
  location: string | null;
  accentColor: string;
  status: ClubStatus;
  memberCount: number;
  eventCount: number;
  nextEventAt: string | null;
  createdAt: string;
}

export interface ClubMemberSummary {
  id: number;
  memberId: number;
  name: string;
  email: string;
  course: string | null;
  role: MembershipRole;
  status: MemberStatus;
  joinedAt: string;
}

export interface ClubEventSummary {
  id: number;
  clubId: number;
  clubName: string;
  clubColor: string;
  title: string;
  description: string | null;
  category: string;
  status: EventStatus;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  capacity: number | null;
  registrationCount: number;
  filledPercent: number | null;
  isHighlighted: boolean;
  createdAt: string;
}

export interface MemberSummary {
  id: number;
  name: string;
  email: string;
  course: string | null;
  phone: string | null;
  status: MemberStatus;
  role: UserRole;
  clubAdminId: number | null;
  joinedAt: string;
  clubCount: number;
  eventCount: number;
  registrationCount: number;
}

export interface Viewer {
  id: number;
  name: string;
  email: string;
  course: string | null;
  phone: string | null;
  status: MemberStatus;
  role: UserRole;
  clubAdminId: number | null;
}

export interface RegistrationSummary {
  id: number;
  memberId: number;
  memberName: string;
  email: string;
  clubName: string;
  eventId: number;
  eventTitle: string;
  eventStatus: EventStatus;
  status: RegistrationStatus;
  registeredAt: string;
}

export interface DashboardStats {
  clubCount: number;
  activeClubCount: number;
  memberCount: number;
  eventCount: number;
  upcomingEventCount: number;
  registrationCount: number;
  fullyBookedEventCount: number;
}

export interface CategorySummary {
  category: string;
  count: number;
}

export interface ClubDetail {
  club: ClubSummary;
  members: ClubMemberSummary[];
  events: ClubEventSummary[];
  registrations: RegistrationSummary[];
}

export interface MemberDetail {
  member: MemberSummary;
  clubs: ClubSummary[];
  events: ClubEventSummary[];
  registrations: RegistrationSummary[];
}

export interface AdminDashboardData {
  stats: DashboardStats;
  topClubs: ClubSummary[];
  upcomingEvents: ClubEventSummary[];
  recentMembers: MemberSummary[];
  recentRegistrations: RegistrationSummary[];
  categories: CategorySummary[];
}

export interface ClubDashboardData {
  club: ClubSummary;
  members: ClubMemberSummary[];
  events: ClubEventSummary[];
  registrations: RegistrationSummary[];
  stats: DashboardStats;
}

export interface MemberDashboardData {
  member: MemberSummary;
  clubs: ClubSummary[];
  events: ClubEventSummary[];
  registrations: RegistrationSummary[];
  stats: DashboardStats;
}

export interface ClubChoice {
  id: number;
  name: string;
  accentColor: string;
}

export interface MemberChoice {
  id: number;
  name: string;
  email: string;
}

export interface EventChoice {
  id: number;
  title: string;
  clubName: string;
  clubColor: string;
  startsAt: string;
}

export interface NewClubInput {
  name: string;
  category: string;
  description: string;
  objective: string | null;
  location: string | null;
  accentColor: string;
}

export interface NewMemberInput {
  name: string;
  email: string;
  course: string | null;
  phone: string | null;
}

export interface AccountRegistrationInput extends NewMemberInput {
  password: string;
  role: UserRole;
  clubAdminId: number | null;
}

export interface AccountLoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput extends NewMemberInput {
  password?: string | null;
}

export interface JoinClubInput extends NewMemberInput {
  password: string;
  clubId: number;
  role: MembershipRole;
}

export interface NewEventInput {
  clubId: number;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  capacity: number | null;
  category: string;
  highlighted: boolean;
}

export interface NewRegistrationInput extends NewMemberInput {
  password: string;
  eventId: number;
}

export interface PendingAccountSummary {
  id: number;
  name: string;
  email: string;
  course: string | null;
  phone: string | null;
  role: UserRole;
  clubAdminId: number | null;
  status: MemberStatus;
  createdAt: string;
}
