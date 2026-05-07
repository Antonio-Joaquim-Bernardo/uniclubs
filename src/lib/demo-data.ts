import type {
  ClubStatus,
  EventStatus,
  MembershipRole,
  MemberStatus,
  RegistrationStatus,
  UserRole,
} from "@/lib/domain";

export interface DemoClub {
  id: number;
  name: string;
  description: string;
  category: string;
  objective: string | null;
  location: string | null;
  accentColor: string;
  status: ClubStatus;
  createdAt: string;
}

export interface DemoMember {
  id: number;
  name: string;
  email: string;
  course: string | null;
  phone: string | null;
  status: MemberStatus;
  role: UserRole;
  clubAdminId: number | null;
  passwordHash: string | null;
  createdAt: string;
}

export interface DemoMembership {
  id: number;
  memberId: number;
  clubId: number;
  role: MembershipRole;
  status: MemberStatus;
  joinedAt: string;
}

export interface DemoEvent {
  id: number;
  clubId: number;
  title: string;
  description: string | null;
  category: string;
  status: EventStatus;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  capacity: number | null;
  highlighted: boolean;
  createdAt: string;
}

export interface DemoRegistration {
  id: number;
  memberId: number;
  eventId: number;
  status: RegistrationStatus;
  registeredAt: string;
}

export interface DemoSession {
  tokenHash: string;
  memberId: number;
  expiresAt: string;
  createdAt: string;
}

export interface DemoState {
  clubs: DemoClub[];
  members: DemoMember[];
  memberships: DemoMembership[];
  events: DemoEvent[];
  registrations: DemoRegistration[];
  sessions: DemoSession[];
  nextIds: {
    club: number;
    member: number;
    membership: number;
    event: number;
    registration: number;
  };
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function createInitialDemoState(): DemoState {
  return {
    clubs: [
      {
        id: 1,
        name: "Clube de Tecnologia Orion",
        description:
          "Espaco para programacao, automacao, robotica e projetos digitais com impacto real no campus.",
        category: "Tecnologia",
        objective: "Formar talentos e acelerar solucoes academicas.",
        location: "Laboratorio 3",
        accentColor: "#22c55e",
        status: "ativo",
        createdAt: daysFromNow(-90),
      },
      {
        id: 2,
        name: "Clube de Desporto Falcoes",
        description:
          "Treinos, torneios internos e iniciativas de bem-estar para manter a universidade em movimento.",
        category: "Desporto",
        objective: "Promover saude, disciplina e espirito de equipa.",
        location: "Pavilhao Principal",
        accentColor: "#38bdf8",
        status: "ativo",
        createdAt: daysFromNow(-120),
      },
      {
        id: 3,
        name: "Clube Cultural Horizonte",
        description:
          "Musica, poesia, teatro e producoes criativas para dar palco a expressao dos estudantes.",
        category: "Cultura",
        objective: "Valorizar a identidade e a criacao artistica.",
        location: "Auditorio B",
        accentColor: "#f97316",
        status: "ativo",
        createdAt: daysFromNow(-75),
      },
      {
        id: 4,
        name: "Clube de Inovacao Nexus",
        description:
          "Ideias, empreendedorismo e prototipagem para transformar problemas academicos em oportunidades.",
        category: "Inovacao",
        objective: "Apoiar projectos com potencial de negocio e impacto social.",
        location: "Sala de Startups",
        accentColor: "#a855f7",
        status: "ativo",
        createdAt: daysFromNow(-60),
      },
    ],
    members: [
      {
        id: 1,
        name: "Ana Paixao",
        email: "ana@uniclubs.edu",
        course: "Engenharia Informatica",
        phone: "+244 921 000 001",
        status: "ativo",
        role: "admin_sistema",
        clubAdminId: 1,
        passwordHash: "admin123",
        createdAt: daysFromNow(-58),
      },
      {
        id: 2,
        name: "Bruno Cangundo",
        email: "bruno@uniclubs.edu",
        course: "Gestao",
        phone: "+244 921 000 002",
        status: "ativo",
        role: "membro",
        clubAdminId: null,
        passwordHash: null,
        createdAt: daysFromNow(-52),
      },
      {
        id: 3,
        name: "Carla Mbo",
        email: "carla@uniclubs.edu",
        course: "Design de Comunicacao",
        phone: "+244 921 000 003",
        status: "ativo",
        role: "admin_clube",
        clubAdminId: 3,
        passwordHash: "club123",
        createdAt: daysFromNow(-49),
      },
      {
        id: 4,
        name: "Diego Santos",
        email: "diego@uniclubs.edu",
        course: "Engenharia Civil",
        phone: "+244 921 000 004",
        status: "ativo",
        role: "admin_clube",
        clubAdminId: 2,
        passwordHash: "club123",
        createdAt: daysFromNow(-43),
      },
      {
        id: 5,
        name: "Elisa Kiala",
        email: "elisa@uniclubs.edu",
        course: "Psicologia",
        phone: "+244 921 000 005",
        status: "ativo",
        role: "admin_clube",
        clubAdminId: 4,
        passwordHash: "club123",
        createdAt: daysFromNow(-38),
      },
      {
        id: 6,
        name: "Fabio Tavares",
        email: "fabio@uniclubs.edu",
        course: "Informatica de Gestao",
        phone: "+244 921 000 006",
        status: "ativo",
        role: "membro",
        clubAdminId: null,
        passwordHash: null,
        createdAt: daysFromNow(-31),
      },
      {
        id: 7,
        name: "Gina Lemos",
        email: "gina@uniclubs.edu",
        course: "Arquitectura",
        phone: "+244 921 000 007",
        status: "pendente",
        role: "membro",
        clubAdminId: null,
        passwordHash: null,
        createdAt: daysFromNow(-22),
      },
      {
        id: 8,
        name: "Henrique Domingos",
        email: "henrique@uniclubs.edu",
        course: "Educacao Fisica",
        phone: "+244 921 000 008",
        status: "ativo",
        role: "membro",
        clubAdminId: null,
        passwordHash: null,
        createdAt: daysFromNow(-18),
      },
    ],
    memberships: [
      { id: 1, memberId: 1, clubId: 1, role: "admin_clube", status: "ativo", joinedAt: daysFromNow(-50) },
      { id: 2, memberId: 2, clubId: 1, role: "membro", status: "ativo", joinedAt: daysFromNow(-48) },
      { id: 3, memberId: 3, clubId: 3, role: "admin_clube", status: "ativo", joinedAt: daysFromNow(-40) },
      { id: 4, memberId: 4, clubId: 2, role: "admin_clube", status: "ativo", joinedAt: daysFromNow(-35) },
      { id: 5, memberId: 5, clubId: 4, role: "admin_clube", status: "ativo", joinedAt: daysFromNow(-30) },
      { id: 6, memberId: 6, clubId: 4, role: "membro", status: "ativo", joinedAt: daysFromNow(-28) },
      { id: 7, memberId: 7, clubId: 2, role: "membro", status: "pendente", joinedAt: daysFromNow(-20) },
      { id: 8, memberId: 8, clubId: 2, role: "membro", status: "ativo", joinedAt: daysFromNow(-15) },
      { id: 9, memberId: 2, clubId: 4, role: "membro", status: "ativo", joinedAt: daysFromNow(-24) },
      { id: 10, memberId: 3, clubId: 4, role: "membro", status: "ativo", joinedAt: daysFromNow(-23) },
      { id: 11, memberId: 1, clubId: 3, role: "membro", status: "ativo", joinedAt: daysFromNow(-26) },
      { id: 12, memberId: 6, clubId: 1, role: "membro", status: "ativo", joinedAt: daysFromNow(-19) },
    ],
    events: [
      {
        id: 1,
        clubId: 1,
        title: "Hackathon UniClubs 2026",
        description:
          "24 hours of prototyping with mentors, APIs and a final pitch for technology clubs.",
        category: "Tecnologia",
        status: "ativo",
        startsAt: daysFromNow(5),
        endsAt: daysFromNow(6),
        location: "Laboratorio 1",
        capacity: 80,
        highlighted: true,
        createdAt: daysFromNow(-10),
      },
      {
        id: 2,
        clubId: 2,
        title: "Torneio Interclubes",
        description:
          "Friendly competition between teams, with ranking and a trophy for the winning club.",
        category: "Desporto",
        status: "ativo",
        startsAt: daysFromNow(8),
        endsAt: daysFromNow(8),
        location: "Pavilhao Principal",
        capacity: 120,
        highlighted: true,
        createdAt: daysFromNow(-12),
      },
      {
        id: 3,
        clubId: 3,
        title: "Noite Cultural",
        description:
          "Art session with music, poetry, creative exhibition and student presentations.",
        category: "Cultura",
        status: "ativo",
        startsAt: daysFromNow(12),
        endsAt: daysFromNow(12),
        location: "Auditorio B",
        capacity: 150,
        highlighted: false,
        createdAt: daysFromNow(-8),
      },
      {
        id: 4,
        clubId: 4,
        title: "Demo Day Nexus",
        description:
          "Public presentation of innovation projects developed during the semester.",
        category: "Inovacao",
        status: "ativo",
        startsAt: daysFromNow(2),
        endsAt: daysFromNow(2),
        location: "Sala de Startups",
        capacity: 40,
        highlighted: true,
        createdAt: daysFromNow(-6),
      },
      {
        id: 5,
        clubId: 2,
        title: "Clinica de Futsal",
        description:
          "Technical practice focused on passing, positioning and team work.",
        category: "Desporto",
        status: "finalizado",
        startsAt: daysFromNow(-7),
        endsAt: daysFromNow(-7),
        location: "Campo 2",
        capacity: 50,
        highlighted: false,
        createdAt: daysFromNow(-20),
      },
      {
        id: 6,
        clubId: 1,
        title: "Workshop de UI/UX",
        description:
          "Practical session about flows, prototyping and user experience.",
        category: "Tecnologia",
        status: "ativo",
        startsAt: hoursFromNow(36),
        endsAt: hoursFromNow(38),
        location: "Laboratorio 2",
        capacity: 70,
        highlighted: true,
        createdAt: daysFromNow(-4),
      },
    ],
    registrations: [
      { id: 1, memberId: 1, eventId: 1, status: "confirmado", registeredAt: daysFromNow(-2) },
      { id: 2, memberId: 2, eventId: 1, status: "confirmado", registeredAt: daysFromNow(-1) },
      { id: 3, memberId: 3, eventId: 3, status: "confirmado", registeredAt: daysFromNow(-3) },
      { id: 4, memberId: 4, eventId: 2, status: "confirmado", registeredAt: daysFromNow(-5) },
      { id: 5, memberId: 5, eventId: 4, status: "confirmado", registeredAt: daysFromNow(-1) },
      { id: 6, memberId: 6, eventId: 6, status: "pendente", registeredAt: hoursFromNow(-6) },
      { id: 7, memberId: 7, eventId: 2, status: "confirmado", registeredAt: daysFromNow(-4) },
      { id: 8, memberId: 8, eventId: 2, status: "confirmado", registeredAt: daysFromNow(-6) },
      { id: 9, memberId: 2, eventId: 6, status: "confirmado", registeredAt: daysFromNow(-1) },
      { id: 10, memberId: 3, eventId: 6, status: "confirmado", registeredAt: daysFromNow(-1) },
    ],
    sessions: [],
    nextIds: {
      club: 5,
      member: 9,
      membership: 13,
      event: 7,
      registration: 11,
    },
  };
}

type GlobalDemoState = typeof globalThis & {
  __uniclubsDemoState?: DemoState;
};

const globalForDemo = globalThis as GlobalDemoState;

export function getDemoState() {
  if (!globalForDemo.__uniclubsDemoState) {
    globalForDemo.__uniclubsDemoState = createInitialDemoState();
  }

  return globalForDemo.__uniclubsDemoState;
}
