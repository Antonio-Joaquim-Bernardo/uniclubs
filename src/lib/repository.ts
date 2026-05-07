import bcrypt from "bcrypt";
import { cache } from "react";
import { pool, hasDatabaseUrl, query } from "@/lib/db";
import type {
  AdminDashboardData,
  CategorySummary,
  ClubChoice,
  ClubDashboardData,
  ClubDetail,
  ClubEventSummary,
  ClubMemberSummary,
  ClubSummary,
  DashboardStats,
  EventChoice,
  AccountRegistrationInput,
  JoinClubInput,
  MemberChoice,
  MemberDashboardData,
  MemberDetail,
  MemberSummary,
  NewClubInput,
  NewEventInput,
  NewMemberInput,
  NewRegistrationInput,
  RegistrationSummary,
  StorageMode,
} from "@/lib/domain";
import { normalizeSearch, percentage } from "@/lib/format";
import { getDemoState, type DemoClub, type DemoEvent, type DemoMember } from "@/lib/demo-data";
import type { PoolClient } from "pg";

let storageMode: StorageMode = hasDatabaseUrl ? "postgres" : "demo";

function handleDemoFallback(error: unknown) {
  if (storageMode === "postgres") {
    console.warn("[UniClubs] PostgreSQL indisponivel, a usar modo demo.", error);
  }

  storageMode = "demo";
}

async function withStorage<T>(
  postgresTask: () => Promise<T>,
  demoTask: () => Promise<T>,
) {
  if (storageMode === "demo") {
    return demoTask();
  }

  try {
    return await postgresTask();
  } catch (error) {
    handleDemoFallback(error);
    return demoTask();
  }
}

function resolveStorageLabel() {
  return storageMode === "postgres" ? "PostgreSQL" : "Modo demo";
}

function buildClubSummary(
  club: DemoClub,
  state = getDemoState(),
): ClubSummary {
  const memberCount = state.memberships.filter(
    (membership) => membership.clubId === club.id && membership.status === "ativo",
  ).length;
  const eventList = state.events.filter(
    (event) => event.clubId === club.id && event.status !== "cancelado",
  );
  const nextEvent = eventList
    .filter(
      (event) =>
        event.status === "ativo" && new Date(event.startsAt).getTime() >= Date.now(),
    )
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())[0];

  return {
    id: club.id,
    name: club.name,
    description: club.description,
    category: club.category,
    objective: club.objective,
    location: club.location,
    accentColor: club.accentColor,
    status: club.status,
    memberCount,
    eventCount: eventList.length,
    nextEventAt: nextEvent?.startsAt ?? null,
    createdAt: club.createdAt,
  };
}

function buildMemberSummary(member: DemoMember, state = getDemoState()): MemberSummary {
  const clubCount = state.memberships.filter(
    (membership) => membership.memberId === member.id && membership.status === "ativo",
  ).length;
  const eventRegistrations = state.registrations.filter(
    (registration) =>
      registration.memberId === member.id && registration.status !== "cancelado",
  );
  const uniqueEvents = new Set(eventRegistrations.map((registration) => registration.eventId));

  return {
    id: member.id,
    name: member.name,
    email: member.email,
    course: member.course,
    phone: member.phone,
    status: member.status,
    role: member.role,
    clubAdminId: member.clubAdminId,
    joinedAt: member.createdAt,
    clubCount,
    eventCount: uniqueEvents.size,
    registrationCount: eventRegistrations.length,
  };
}

function buildEventSummary(event: DemoEvent, state = getDemoState()): ClubEventSummary {
  const club = state.clubs.find((item) => item.id === event.clubId);
  const registrationCount = state.registrations.filter(
    (registration) =>
      registration.eventId === event.id && registration.status === "confirmado",
  ).length;

  return {
    id: event.id,
    clubId: event.clubId,
    clubName: club?.name ?? "Clube desconhecido",
    clubColor: club?.accentColor ?? "#22c55e",
    title: event.title,
    description: event.description,
    category: event.category,
    status: event.status,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    location: event.location,
    capacity: event.capacity,
    registrationCount,
    filledPercent: percentage(registrationCount, event.capacity),
    isHighlighted: event.highlighted,
    createdAt: event.createdAt,
  };
}

function buildRegistrationSummary(state = getDemoState()): RegistrationSummary[] {
  return state.registrations
    .map((registration) => {
      const member = state.members.find((item) => item.id === registration.memberId);
      const event = state.events.find((item) => item.id === registration.eventId);
      const club = event
        ? state.clubs.find((item) => item.id === event.clubId)
        : undefined;

      if (!member || !event || !club) {
        return null;
      }

      return {
        id: registration.id,
        memberId: member.id,
        memberName: member.name,
        email: member.email,
        clubName: club.name,
        eventId: event.id,
        eventTitle: event.title,
        eventStatus: event.status,
        status: registration.status,
        registeredAt: registration.registeredAt,
      } satisfies RegistrationSummary;
    })
    .filter(Boolean) as RegistrationSummary[];
}

function searchIn(values: Array<string | null | undefined>, queryValue: string) {
  if (!queryValue) {
    return true;
  }

  return values.some((value) =>
    normalizeSearch(value).includes(queryValue),
  );
}

function demoStats() {
  const state = getDemoState();
  const clubCount = state.clubs.length;
  const activeClubCount = state.clubs.filter((club) => club.status === "ativo").length;
  const memberCount = state.members.length;
  const eventCount = state.events.filter((event) => event.status !== "cancelado").length;
  const upcomingEventCount = state.events.filter(
    (event) => event.status === "ativo" && new Date(event.startsAt).getTime() >= Date.now(),
  ).length;
  const registrationCount = state.registrations.filter(
    (registration) => registration.status === "confirmado",
  ).length;
  const fullyBookedEventCount = state.events.filter((event) => {
    if (!event.capacity) {
      return false;
    }

    const confirmedCount = state.registrations.filter(
      (registration) =>
        registration.eventId === event.id && registration.status === "confirmado",
    ).length;

    return confirmedCount >= event.capacity;
  }).length;

  return {
    clubCount,
    activeClubCount,
    memberCount,
    eventCount,
    upcomingEventCount,
    registrationCount,
    fullyBookedEventCount,
  } satisfies DashboardStats;
}

async function postgresStats() {
  const result = await query<DashboardStats & { fullyBookedEventCount: number }>(`
    SELECT
      (SELECT COUNT(*)::int FROM clubes) AS "clubCount",
      (SELECT COUNT(*)::int FROM clubes WHERE status = 'ativo') AS "activeClubCount",
      (SELECT COUNT(*)::int FROM membros) AS "memberCount",
      (SELECT COUNT(*)::int FROM eventos WHERE status <> 'cancelado') AS "eventCount",
      (SELECT COUNT(*)::int FROM eventos WHERE status = 'ativo' AND data_inicio >= NOW()) AS "upcomingEventCount",
      (SELECT COUNT(*)::int FROM inscricoes WHERE status = 'confirmado') AS "registrationCount",
      (
        SELECT COUNT(*)::int
        FROM eventos e
        WHERE e.capacidade_maxima IS NOT NULL
          AND (
            SELECT COUNT(*)
            FROM inscricoes i
            WHERE i.evento_id = e.id AND i.status = 'confirmado'
          ) >= e.capacidade_maxima
      ) AS "fullyBookedEventCount"
  `);
  const row = result.rows[0];

  return row ?? demoStats();
}

async function postgresClubChoices() {
  return query<ClubChoice>(`
    SELECT id, nome AS "name", cor_primaria AS "accentColor"
    FROM clubes
    ORDER BY nome ASC
  `);
}

async function postgresMemberChoices() {
  return query<MemberChoice>(`
    SELECT id, nome AS "name", email
    FROM membros
    ORDER BY nome ASC
  `);
}

async function postgresEventChoices(clubId?: number) {
  const params: unknown[] = [];
  const where = ["e.status = 'ativo'"];

  if (clubId) {
    params.push(clubId);
    where.push(`clube_id = $${params.length}`);
  }

  return query<EventChoice>(
    `
      SELECT
        e.id,
        e.titulo AS "title",
        c.nome AS "clubName",
        c.cor_primaria AS "clubColor",
        e.data_inicio AS "startsAt"
      FROM eventos e
      INNER JOIN clubes c ON c.id = e.clube_id
      WHERE ${where.join(" AND ")}
      ORDER BY e.data_inicio ASC
    `,
    params,
  );
}

async function postgresClubCategories() {
  const rows = await query<CategorySummary>(`
    SELECT categoria AS category, COUNT(*)::int AS count
    FROM clubes
    GROUP BY categoria
    ORDER BY count DESC, categoria ASC
  `);

  return rows.rows;
}

async function postgresClubList(
  search: string,
  category: string,
  limit = 12,
) {
  const params: unknown[] = [];
  const where: string[] = [];
  const searchValue = normalizeSearch(search);

  if (searchValue) {
    params.push(`%${searchValue}%`);
    where.push(
      `(LOWER(c.nome) LIKE $${params.length} OR LOWER(c.descricao) LIKE $${params.length} OR LOWER(c.categoria) LIKE $${params.length})`,
    );
  }

  if (category && category !== "all") {
    params.push(category);
    where.push(`c.categoria = $${params.length}`);
  }

  params.push(limit);

  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return query<ClubSummary>(
    `
      SELECT
        c.id,
        c.nome AS "name",
        c.descricao AS "description",
        c.categoria AS "category",
        c.objetivo AS "objective",
        c.local_base AS "location",
        c.cor_primaria AS "accentColor",
        c.status,
        COUNT(DISTINCT mc.id)::int AS "memberCount",
        COUNT(DISTINCT e.id)::int AS "eventCount",
        (
          SELECT MIN(ev.data_inicio)
          FROM eventos ev
          WHERE ev.clube_id = c.id AND ev.status = 'ativo' AND ev.data_inicio >= NOW()
        ) AS "nextEventAt",
        c.criado_em AS "createdAt"
      FROM clubes c
      LEFT JOIN membro_clube mc ON mc.clube_id = c.id AND mc.status = 'ativo'
      LEFT JOIN eventos e ON e.clube_id = c.id AND e.status = 'ativo'
      ${clause}
      GROUP BY c.id
      ORDER BY c.criado_em DESC, c.nome ASC
      LIMIT $${params.length}
    `,
    params,
  );
}

async function postgresClubDetail(clubId: number) {
  const clubResult = await query<ClubSummary>(
    `
      SELECT
        c.id,
        c.nome AS "name",
        c.descricao AS "description",
        c.categoria AS "category",
        c.objetivo AS "objective",
        c.local_base AS "location",
        c.cor_primaria AS "accentColor",
        c.status,
        COUNT(DISTINCT mc.id)::int AS "memberCount",
        COUNT(DISTINCT e.id)::int AS "eventCount",
        (
          SELECT MIN(ev.data_inicio)
          FROM eventos ev
          WHERE ev.clube_id = c.id AND ev.status = 'ativo' AND ev.data_inicio >= NOW()
        ) AS "nextEventAt",
        c.criado_em AS "createdAt"
      FROM clubes c
      LEFT JOIN membro_clube mc ON mc.clube_id = c.id AND mc.status = 'ativo'
      LEFT JOIN eventos e ON e.clube_id = c.id AND e.status = 'ativo'
      WHERE c.id = $1
      GROUP BY c.id
      LIMIT 1
    `,
    [clubId],
  );
  const club = clubResult.rows[0];

  if (!club) {
    return null;
  }

  const [membersResult, eventsResult, registrationsResult] = await Promise.all([
    query<ClubMemberSummary>(
      `
        SELECT
          mc.id,
          mc.membro_id AS "memberId",
          m.nome AS "name",
          m.email,
          m.curso AS "course",
          mc.papel AS "role",
          m.status,
          mc.data_entrada AS "joinedAt"
        FROM membro_clube mc
        INNER JOIN membros m ON m.id = mc.membro_id
        WHERE mc.clube_id = $1
        ORDER BY mc.data_entrada ASC, m.nome ASC
      `,
      [clubId],
    ),
    query<ClubEventSummary>(
      `
        SELECT
          e.id,
          e.clube_id AS "clubId",
          c.nome AS "clubName",
          c.cor_primaria AS "clubColor",
          e.titulo AS "title",
          e.descricao AS "description",
          e.categoria AS "category",
          e.status,
          e.data_inicio AS "startsAt",
          e.data_fim AS "endsAt",
          e.local_ev AS "location",
          e.capacidade_maxima AS "capacity",
          COUNT(DISTINCT i.id)::int AS "registrationCount",
          e.destacado AS "isHighlighted",
          e.criado_em AS "createdAt"
        FROM eventos e
        INNER JOIN clubes c ON c.id = e.clube_id
        LEFT JOIN inscricoes i ON i.evento_id = e.id AND i.status = 'confirmado'
        WHERE e.clube_id = $1
        GROUP BY e.id, c.id
        ORDER BY e.data_inicio ASC
      `,
      [clubId],
    ),
    query<RegistrationSummary>(
      `
        SELECT
          i.id,
          i.membro_id AS "memberId",
          m.nome AS "memberName",
          m.email,
          c.nome AS "clubName",
          e.id AS "eventId",
          e.titulo AS "eventTitle",
          e.status AS "eventStatus",
          i.status,
          i.data_inscricao AS "registeredAt"
        FROM inscricoes i
        INNER JOIN membros m ON m.id = i.membro_id
        INNER JOIN eventos e ON e.id = i.evento_id
        INNER JOIN clubes c ON c.id = e.clube_id
        WHERE e.clube_id = $1
        ORDER BY i.data_inscricao DESC
        LIMIT 12
      `,
      [clubId],
    ),
  ]);

  return {
    club,
    members: membersResult.rows,
    events: eventsResult.rows.map((event) => ({
      ...event,
      filledPercent: percentage(event.registrationCount, event.capacity),
    })),
    registrations: registrationsResult.rows,
  } satisfies ClubDetail;
}

async function postgresMemberList(search: string, clubId: number | null, limit = 20) {
  const params: unknown[] = [];
  const where: string[] = [];
  const searchValue = normalizeSearch(search);

  if (searchValue) {
    params.push(`%${searchValue}%`);
    where.push(
      `(LOWER(m.nome) LIKE $${params.length} OR LOWER(m.email) LIKE $${params.length} OR LOWER(m.curso) LIKE $${params.length})`,
    );
  }

  if (clubId) {
    params.push(clubId);
    where.push(
      `EXISTS (
        SELECT 1
        FROM membro_clube mcx
        WHERE mcx.membro_id = m.id AND mcx.clube_id = $${params.length}
      )`,
    );
  }

  params.push(limit);

  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return query<MemberSummary>(
    `
      SELECT
        m.id,
        m.nome AS "name",
        m.email,
        m.curso AS "course",
        m.telefone AS "phone",
        m.status,
        m.papel AS "role",
        m.clube_admin_id AS "clubAdminId",
        m.data_registro AS "joinedAt",
        COUNT(DISTINCT mc.clube_id)::int AS "clubCount",
        COUNT(DISTINCT i.evento_id)::int AS "eventCount",
        COUNT(DISTINCT i.id)::int AS "registrationCount"
      FROM membros m
      LEFT JOIN membro_clube mc ON mc.membro_id = m.id AND mc.status = 'ativo'
      LEFT JOIN inscricoes i ON i.membro_id = m.id AND i.status = 'confirmado'
      ${clause}
      GROUP BY m.id
      ORDER BY m.data_registro DESC, m.nome ASC
      LIMIT $${params.length}
    `,
    params,
  );
}

async function postgresMemberDetail(memberId: number) {
  const memberResult = await query<MemberSummary>(
    `
      SELECT
        m.id,
        m.nome AS "name",
        m.email,
        m.curso AS "course",
        m.telefone AS "phone",
        m.status,
        m.papel AS "role",
        m.clube_admin_id AS "clubAdminId",
        m.data_registro AS "joinedAt",
        COUNT(DISTINCT mc.clube_id)::int AS "clubCount",
        COUNT(DISTINCT i.evento_id)::int AS "eventCount",
        COUNT(DISTINCT i.id)::int AS "registrationCount"
      FROM membros m
      LEFT JOIN membro_clube mc ON mc.membro_id = m.id AND mc.status = 'ativo'
      LEFT JOIN inscricoes i ON i.membro_id = m.id AND i.status = 'confirmado'
      WHERE m.id = $1
      GROUP BY m.id
      LIMIT 1
    `,
    [memberId],
  );
  const member = memberResult.rows[0];

  if (!member) {
    return null;
  }

  const [clubsResult, eventsResult, registrationsResult] = await Promise.all([
    query<ClubSummary>(
      `
        SELECT
          c.id,
          c.nome AS "name",
          c.descricao AS "description",
          c.categoria AS "category",
          c.objetivo AS "objective",
          c.local_base AS "location",
          c.cor_primaria AS "accentColor",
          c.status,
          (
            SELECT COUNT(*)::int
            FROM membro_clube mc_count
            WHERE mc_count.clube_id = c.id AND mc_count.status = 'ativo'
          ) AS "memberCount",
          (
            SELECT COUNT(*)::int
            FROM eventos e_count
            WHERE e_count.clube_id = c.id AND e_count.status = 'ativo'
          ) AS "eventCount",
          (
            SELECT MIN(ev.data_inicio)
            FROM eventos ev
            WHERE ev.clube_id = c.id AND ev.status = 'ativo' AND ev.data_inicio >= NOW()
          ) AS "nextEventAt",
          c.criado_em AS "createdAt"
        FROM clubes c
        INNER JOIN membro_clube mc ON mc.clube_id = c.id AND mc.membro_id = $1 AND mc.status = 'ativo'
        ORDER BY mc.data_entrada DESC, c.nome ASC
      `,
      [memberId],
    ),
    query<ClubEventSummary>(
      `
        SELECT
          e.id,
          e.clube_id AS "clubId",
          c.nome AS "clubName",
          c.cor_primaria AS "clubColor",
          e.titulo AS "title",
          e.descricao AS "description",
          e.categoria AS "category",
          e.status,
          e.data_inicio AS "startsAt",
          e.data_fim AS "endsAt",
          e.local_ev AS "location",
          e.capacidade_maxima AS "capacity",
          COUNT(DISTINCT i.id)::int AS "registrationCount",
          e.destacado AS "isHighlighted",
          e.criado_em AS "createdAt"
        FROM inscricoes r
        INNER JOIN eventos e ON e.id = r.evento_id
        INNER JOIN clubes c ON c.id = e.clube_id
        LEFT JOIN inscricoes i ON i.evento_id = e.id AND i.status = 'confirmado'
        WHERE r.membro_id = $1
        GROUP BY e.id, c.id
        ORDER BY e.data_inicio ASC
      `,
      [memberId],
    ),
    query<RegistrationSummary>(
      `
        SELECT
          r.id,
          r.membro_id AS "memberId",
          m.nome AS "memberName",
          m.email,
          c.nome AS "clubName",
          e.id AS "eventId",
          e.titulo AS "eventTitle",
          e.status AS "eventStatus",
          r.status,
          r.data_inscricao AS "registeredAt"
        FROM inscricoes r
        INNER JOIN membros m ON m.id = r.membro_id
        INNER JOIN eventos e ON e.id = r.evento_id
        INNER JOIN clubes c ON c.id = e.clube_id
        WHERE r.membro_id = $1
        ORDER BY r.data_inscricao DESC
      `,
      [memberId],
    ),
  ]);

  return {
    member,
    clubs: clubsResult.rows,
    events: eventsResult.rows.map((event) => ({
      ...event,
      filledPercent: percentage(event.registrationCount, event.capacity),
    })),
    registrations: registrationsResult.rows,
  } satisfies MemberDetail;
}

async function postgresTopClubs(limit = 4) {
  const rows = await postgresClubList("", "all", limit);
  return rows.rows;
}

async function postgresUpcomingEvents(limit = 4) {
  const rows = await query<ClubEventSummary>(
    `
      SELECT
        e.id,
        e.clube_id AS "clubId",
        c.nome AS "clubName",
        c.cor_primaria AS "clubColor",
        e.titulo AS "title",
        e.descricao AS "description",
        e.categoria AS "category",
        e.status,
        e.data_inicio AS "startsAt",
        e.data_fim AS "endsAt",
        e.local_ev AS "location",
        e.capacidade_maxima AS "capacity",
        COUNT(DISTINCT i.id)::int AS "registrationCount",
        e.destacado AS "isHighlighted",
        e.criado_em AS "createdAt"
      FROM eventos e
      INNER JOIN clubes c ON c.id = e.clube_id
      LEFT JOIN inscricoes i ON i.evento_id = e.id AND i.status = 'confirmado'
      WHERE e.status = 'ativo' AND e.data_inicio >= NOW()
      GROUP BY e.id, c.id
      ORDER BY e.data_inicio ASC
      LIMIT $1
    `,
    [limit],
  );

  return rows.rows.map((event) => ({
    ...event,
    filledPercent: percentage(event.registrationCount, event.capacity),
  }));
}

async function postgresRecentMembers(limit = 4) {
  const rows = await postgresMemberList("", null, limit);
  return rows.rows;
}

async function postgresRecentRegistrations(limit = 5) {
  const rows = await query<RegistrationSummary>(
    `
      SELECT
        r.id,
        r.membro_id AS "memberId",
        m.nome AS "memberName",
        m.email,
        c.nome AS "clubName",
        e.id AS "eventId",
        e.titulo AS "eventTitle",
        e.status AS "eventStatus",
        r.status,
        r.data_inscricao AS "registeredAt"
      FROM inscricoes r
      INNER JOIN membros m ON m.id = r.membro_id
      INNER JOIN eventos e ON e.id = r.evento_id
      INNER JOIN clubes c ON c.id = e.clube_id
      ORDER BY r.data_inscricao DESC
      LIMIT $1
    `,
    [limit],
  );

  return rows.rows;
}

function demoClubChoices(): ClubChoice[] {
  return getDemoState().clubs.map((club) => ({
    id: club.id,
    name: club.name,
    accentColor: club.accentColor,
  }));
}

function demoMemberChoices(): MemberChoice[] {
  return getDemoState().members.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
  }));
}

function demoEventChoices(clubId?: number): EventChoice[] {
  const state = getDemoState();
  const items = state.events.filter((event) => event.status === "ativo");

  return items
    .filter((event) => !clubId || event.clubId === clubId)
    .map((event) => {
      const club = state.clubs.find((item) => item.id === event.clubId);

      return {
        id: event.id,
        title: event.title,
        clubName: club?.name ?? "Clube desconhecido",
        clubColor: club?.accentColor ?? "#22c55e",
        startsAt: event.startsAt,
      };
    })
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
}

function demoCategories(): CategorySummary[] {
  const state = getDemoState();
  const map = new Map<string, number>();

  for (const club of state.clubs) {
    map.set(club.category, (map.get(club.category) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category));
}

function demoClubList(search: string, category: string, limit = 12) {
  const queryValue = normalizeSearch(search);
  const state = getDemoState();
  const clubs = state.clubs
    .filter((club) => {
      if (category && category !== "all" && club.category !== category) {
        return false;
      }

      return searchIn([club.name, club.description, club.category], queryValue);
    })
    .map((club) => buildClubSummary(club, state))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return clubs.slice(0, limit);
}

function demoClubDetail(clubId: number): ClubDetail | null {
  const state = getDemoState();
  const club = state.clubs.find((item) => item.id === clubId);

  if (!club) {
    return null;
  }

  const clubSummary = buildClubSummary(club, state);
  const members = state.memberships
    .filter((membership) => membership.clubId === clubId)
    .map((membership) => {
      const member = state.members.find((item) => item.id === membership.memberId);

      if (!member) {
        return null;
      }

      return {
        id: membership.id,
        memberId: member.id,
        name: member.name,
        email: member.email,
        course: member.course,
        role: membership.role,
        status: member.status,
        joinedAt: membership.joinedAt,
      } satisfies ClubMemberSummary;
    })
    .filter(Boolean) as ClubMemberSummary[];

  const events = state.events
    .filter((event) => event.clubId === clubId)
    .map((event) => buildEventSummary(event, state))
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());

  const registrations = buildRegistrationSummary(state).filter(
    (registration) => registration.clubName === club.name,
  );

  return {
    club: clubSummary,
    members,
    events,
    registrations,
  };
}

function demoMemberList(search: string, clubId: number | null, limit = 20) {
  const queryValue = normalizeSearch(search);
  const state = getDemoState();
  const members = state.members
    .filter((member) => {
      if (!searchIn([member.name, member.email, member.course], queryValue)) {
        return false;
      }

      if (!clubId) {
        return true;
      }

      return state.memberships.some(
        (membership) =>
          membership.memberId === member.id &&
          membership.clubId === clubId &&
          membership.status === "ativo",
      );
    })
    .map((member) => buildMemberSummary(member, state))
    .sort((left, right) => new Date(right.joinedAt).getTime() - new Date(left.joinedAt).getTime());

  return members.slice(0, limit);
}

function demoMemberDetail(memberId: number): MemberDetail | null {
  const state = getDemoState();
  const member = state.members.find((item) => item.id === memberId);

  if (!member) {
    return null;
  }

  const memberSummary = buildMemberSummary(member, state);
  const clubs = state.memberships
    .filter((membership) => membership.memberId === memberId && membership.status === "ativo")
    .map((membership) => {
      const club = state.clubs.find((item) => item.id === membership.clubId);

      if (!club) {
        return null;
      }

      return buildClubSummary(club, state);
    })
    .filter(Boolean) as ClubSummary[];

  const events = state.registrations
    .filter((registration) => registration.memberId === memberId)
    .map((registration) => {
      const event = state.events.find((item) => item.id === registration.eventId);
      if (!event) {
        return null;
      }

      return buildEventSummary(event, state);
    })
    .filter(Boolean) as ClubEventSummary[];

  const registrations = buildRegistrationSummary(state).filter(
    (registration) => registration.memberId === memberId,
  );

  return {
    member: memberSummary,
    clubs,
    events,
    registrations,
  };
}

function demoEventList(search: string, status: string, clubId: number | null, limit = 24) {
  const queryValue = normalizeSearch(search);
  const state = getDemoState();
  const events = state.events
    .filter((event) => {
      if (status && status !== "all" && event.status !== status) {
        return false;
      }

      if (clubId && event.clubId !== clubId) {
        return false;
      }

      const club = state.clubs.find((item) => item.id === event.clubId);

      return searchIn([event.title, event.description, event.category, club?.name], queryValue);
    })
    .map((event) => buildEventSummary(event, state))
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());

  return events.slice(0, limit);
}

function demoRegistrationList(search: string, status: string, clubId: number | null, limit = 30) {
  const queryValue = normalizeSearch(search);
  const state = getDemoState();
  const registrations = buildRegistrationSummary(state)
    .filter((registration) => {
      if (status && status !== "all" && registration.status !== status) {
        return false;
      }

      if (clubId) {
        const event = state.events.find((item) => item.id === registration.eventId);
        if (!event || event.clubId !== clubId) {
          return false;
        }
      }

      return searchIn(
        [registration.memberName, registration.email, registration.clubName, registration.eventTitle],
        queryValue,
      );
    })
    .sort((left, right) => new Date(right.registeredAt).getTime() - new Date(left.registeredAt).getTime());

  return registrations.slice(0, limit);
}

function demoEventChoicesForClub(clubId?: number) {
  return demoEventChoices(clubId);
}

async function demoCreateClub(input: NewClubInput) {
  const state = getDemoState();
  const exists = state.clubs.some(
    (club) => normalizeSearch(club.name) === normalizeSearch(input.name),
  );

  if (exists) {
    throw new Error("Ja existe um clube com este nome.");
  }

  const club = {
    id: state.nextIds.club++,
    name: input.name,
    description: input.description,
    category: input.category,
    objective: input.objective,
    location: input.location,
    accentColor: input.accentColor,
    status: "ativo" as const,
    createdAt: new Date().toISOString(),
  };

  state.clubs.unshift(club);

  return { id: club.id, name: club.name };
}

async function demoCreateMember(input: AccountRegistrationInput) {
  const state = getDemoState();
  const email = normalizeSearch(input.email);
  const existing = state.members.find((member) => normalizeSearch(member.email) === email);
  const passwordHash = await bcrypt.hash(input.password, 10);

  if (existing) {
    existing.name = input.name;
    existing.course = input.course;
    existing.phone = input.phone;
    existing.status = "ativo";
    existing.role = input.role;
    existing.clubAdminId = input.clubAdminId;
    existing.passwordHash = passwordHash;
    return { id: existing.id, name: existing.name };
  }

  const member = {
    id: state.nextIds.member++,
    name: input.name,
    email: input.email.toLowerCase(),
    course: input.course,
    phone: input.phone,
    status: "ativo" as const,
    role: input.role,
    clubAdminId: input.clubAdminId,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  state.members.unshift(member);

  return { id: member.id, name: member.name };
}

async function demoJoinClub(input: JoinClubInput) {
  const state = getDemoState();
  const club = state.clubs.find((item) => item.id === input.clubId);

  if (!club) {
    throw new Error("Clube nao encontrado.");
  }

  const memberResult = await demoCreateMember({
    name: input.name,
    email: input.email,
    course: input.course,
    phone: input.phone,
    password: input.password,
    role: input.role === "admin_clube" ? "admin_clube" : "membro",
    clubAdminId: input.role === "admin_clube" ? input.clubId : null,
  });
  const member = state.members.find((item) => item.id === memberResult.id);

  if (!member) {
    throw new Error("Nao foi possivel criar o membro.");
  }

  const membership = state.memberships.find(
    (item) => item.clubId === input.clubId && item.memberId === member.id,
  );

  if (membership) {
    membership.role = input.role;
    membership.status = "ativo";
    membership.joinedAt = membership.joinedAt ?? new Date().toISOString();
  } else {
    state.memberships.unshift({
      id: state.nextIds.membership++,
      memberId: member.id,
      clubId: input.clubId,
      role: input.role,
      status: "ativo",
      joinedAt: new Date().toISOString(),
    });
  }

  return { memberName: member.name, clubName: club.name };
}

async function demoCreateEvent(input: NewEventInput) {
  const state = getDemoState();
  const club = state.clubs.find((item) => item.id === input.clubId);

  if (!club) {
    throw new Error("Clube nao encontrado.");
  }

  const event = {
    id: state.nextIds.event++,
    clubId: input.clubId,
    title: input.title,
    description: input.description,
    category: input.category,
    status: "ativo" as const,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    location: input.location,
    capacity: input.capacity,
    highlighted: input.highlighted,
    createdAt: new Date().toISOString(),
  };

  state.events.unshift(event);

  return { title: event.title, clubName: club.name };
}

async function demoRegisterEvent(input: NewRegistrationInput) {
  const state = getDemoState();
  const event = state.events.find((item) => item.id === input.eventId);

  if (!event) {
    throw new Error("Evento nao encontrado.");
  }

  if (event.status !== "ativo") {
    throw new Error("Este evento nao esta activo.");
  }

  const memberResult = await demoCreateMember({
    name: input.name,
    email: input.email,
    course: input.course,
    phone: input.phone,
    password: input.password,
    role: "membro",
    clubAdminId: null,
  });
  const member = state.members.find((item) => item.id === memberResult.id);
  const registeredCount = state.registrations.filter(
    (registration) =>
      registration.eventId === event.id && registration.status === "confirmado",
  ).length;

  const alreadyRegistered = state.registrations.find(
    (registration) =>
      registration.memberId === memberResult.id && registration.eventId === event.id,
  );

  if (!alreadyRegistered && event.capacity !== null && registeredCount >= event.capacity) {
    throw new Error("Este evento atingiu a capacidade maxima.");
  }

  if (alreadyRegistered) {
    alreadyRegistered.status = "confirmado";
    alreadyRegistered.registeredAt = new Date().toISOString();
  } else {
    state.registrations.unshift({
      id: state.nextIds.registration++,
      memberId: memberResult.id,
      eventId: input.eventId,
      status: "confirmado",
      registeredAt: new Date().toISOString(),
    });
  }

  const club = state.clubs.find((item) => item.id === event.clubId);

  return {
    memberName: member?.name ?? memberResult.name,
    eventTitle: event.title,
    clubName: club?.name ?? "Clube desconhecido",
  };
}

async function postgresTransaction<T>(task: (client: PoolClient) => Promise<T>) {
  if (!pool) {
    throw new Error("DATABASE_URL nao configurado.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await task(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function postgresCreateClub(input: NewClubInput) {
  const result = await query<{ id: number; name: string }>(
    `
      INSERT INTO clubes (nome, descricao, categoria, objetivo, local_base, cor_primaria, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'ativo')
      RETURNING id, nome AS "name"
    `,
    [input.name, input.description, input.category, input.objective, input.location, input.accentColor],
  );

  const row = result.rows[0];
  return row;
}

async function postgresCreateMember(input: AccountRegistrationInput) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const result = await query<{ id: number; name: string }>(
    `
      INSERT INTO membros (nome, email, curso, telefone, status, papel, clube_admin_id, senha_hash)
      VALUES ($1, $2, $3, $4, 'ativo', $5, $6, $7)
      ON CONFLICT (email)
      DO UPDATE SET
        nome = EXCLUDED.nome,
        curso = EXCLUDED.curso,
        telefone = EXCLUDED.telefone,
        status = 'ativo',
        papel = EXCLUDED.papel,
        clube_admin_id = EXCLUDED.clube_admin_id,
        senha_hash = EXCLUDED.senha_hash
      RETURNING id, nome AS "name"
      `,
    [
      input.name,
      input.email.toLowerCase(),
      input.course,
      input.phone,
      input.role,
      input.clubAdminId,
      passwordHash,
    ],
  );

  const row = result.rows[0];
  return row;
}

async function postgresJoinClub(input: JoinClubInput) {
  return postgresTransaction(async (client) => {
    const clubResult = await client.query<{ name: string }>(
      `SELECT nome AS "name" FROM clubes WHERE id = $1 LIMIT 1`,
      [input.clubId],
    );

    const club = clubResult.rows[0];

    if (!club) {
      throw new Error("Clube nao encontrado.");
    }

    const accountInput: AccountRegistrationInput = {
      name: input.name,
      email: input.email,
      course: input.course,
      phone: input.phone,
      password: input.password,
      role: input.role === "admin_clube" ? "admin_clube" : "membro",
      clubAdminId: input.role === "admin_clube" ? input.clubId : null,
    };

    const passwordHash = await bcrypt.hash(accountInput.password, 10);

    const memberResult = await client.query<{ id: number; name: string }>(
      `
        INSERT INTO membros (nome, email, curso, telefone, status, papel, clube_admin_id, senha_hash)
        VALUES ($1, $2, $3, $4, 'ativo', $5, $6, $7)
        ON CONFLICT (email)
        DO UPDATE SET
          nome = EXCLUDED.nome,
          curso = EXCLUDED.curso,
          telefone = EXCLUDED.telefone,
          status = 'ativo',
          papel = EXCLUDED.papel,
          clube_admin_id = EXCLUDED.clube_admin_id,
          senha_hash = EXCLUDED.senha_hash
        RETURNING id, nome AS "name"
      `,
      [
        accountInput.name,
        accountInput.email.toLowerCase(),
        accountInput.course,
        accountInput.phone,
        accountInput.role,
        accountInput.clubAdminId,
        passwordHash,
      ],
    );

    const member = memberResult.rows[0];

    if (!member) {
      throw new Error("Nao foi possivel salvar o membro.");
    }

    await client.query(
      `
        INSERT INTO membro_clube (membro_id, clube_id, papel, status)
        VALUES ($1, $2, $3, 'ativo')
        ON CONFLICT (membro_id, clube_id)
        DO UPDATE SET papel = EXCLUDED.papel, status = 'ativo'
      `,
      [member.id, input.clubId, input.role],
    );

    return { memberName: member.name, clubName: club.name };
  });
}

async function postgresCreateEvent(input: NewEventInput) {
  return postgresTransaction(async (client) => {
    const clubResult = await client.query<{ name: string }>(
      `SELECT nome AS "name" FROM clubes WHERE id = $1 LIMIT 1`,
      [input.clubId],
    );

    const club = clubResult.rows[0];

    if (!club) {
      throw new Error("Clube nao encontrado.");
    }

    const result = await client.query<{ id: number; title: string }>(
      `
        INSERT INTO eventos (
          clube_id,
          titulo,
          descricao,
          data_inicio,
          data_fim,
          local_ev,
          capacidade_maxima,
          categoria,
          destacado,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ativo')
        RETURNING id, titulo AS "title"
      `,
      [
        input.clubId,
        input.title,
        input.description,
        input.startsAt,
        input.endsAt,
        input.location,
        input.capacity,
        input.category,
        input.highlighted,
      ],
    );

    const event = result.rows[0];

    if (!event) {
      throw new Error("Nao foi possivel criar o evento.");
    }

    return { title: event.title, clubName: club.name };
  });
}

async function postgresRegisterEvent(input: NewRegistrationInput) {
  return postgresTransaction(async (client) => {
    const eventResult = await client.query<{
      title: string;
      clubName: string;
      clubId: number;
      capacity: number | null;
      status: string;
    }>(
      `
        SELECT
          e.titulo AS "title",
          c.nome AS "clubName",
          c.id AS "clubId",
          e.capacidade_maxima AS "capacity",
          e.status
        FROM eventos e
        INNER JOIN clubes c ON c.id = e.clube_id
        WHERE e.id = $1
        LIMIT 1
      `,
      [input.eventId],
    );

    const event = eventResult.rows[0];

    if (!event) {
      throw new Error("Evento nao encontrado.");
    }

    if (event.status !== "ativo") {
      throw new Error("Este evento nao esta activo.");
    }

    const accountInput: AccountRegistrationInput = {
      name: input.name,
      email: input.email,
      course: input.course,
      phone: input.phone,
      password: input.password,
      role: "membro",
      clubAdminId: null,
    };

    const passwordHash = await bcrypt.hash(accountInput.password, 10);

    const memberResult = await client.query<{ id: number; name: string }>(
      `
        INSERT INTO membros (nome, email, curso, telefone, status, papel, clube_admin_id, senha_hash)
        VALUES ($1, $2, $3, $4, 'ativo', $5, $6, $7)
        ON CONFLICT (email)
        DO UPDATE SET
          nome = EXCLUDED.nome,
          curso = EXCLUDED.curso,
          telefone = EXCLUDED.telefone,
          status = 'ativo',
          papel = EXCLUDED.papel,
          clube_admin_id = EXCLUDED.clube_admin_id,
          senha_hash = EXCLUDED.senha_hash
        RETURNING id, nome AS "name"
      `,
      [
        accountInput.name,
        accountInput.email.toLowerCase(),
        accountInput.course,
        accountInput.phone,
        accountInput.role,
        accountInput.clubAdminId,
        passwordHash,
      ],
    );

    const member = memberResult.rows[0];

    if (!member) {
      throw new Error("Nao foi possivel salvar o membro.");
    }

    const existingRegistration = await client.query<{ id: number }>(
      `SELECT id FROM inscricoes WHERE membro_id = $1 AND evento_id = $2 LIMIT 1`,
      [member.id, input.eventId],
    );

    const confirmedCountResult = await client.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM inscricoes
        WHERE evento_id = $1 AND status = 'confirmado'
      `,
      [input.eventId],
    );

    const confirmedCount = Number(confirmedCountResult.rows[0]?.count ?? "0");

    if (!existingRegistration.rows[0] && event.capacity !== null && confirmedCount >= event.capacity) {
      throw new Error("Este evento atingiu a capacidade maxima.");
    }

    await client.query(
      `
        INSERT INTO inscricoes (membro_id, evento_id, status)
        VALUES ($1, $2, 'confirmado')
        ON CONFLICT (membro_id, evento_id)
        DO UPDATE SET status = 'confirmado'
      `,
      [member.id, input.eventId],
    );

    return {
      memberName: member.name,
      eventTitle: event.title,
      clubName: event.clubName,
    };
  });
}

export function getStorageMode() {
  return storageMode;
}

export function getStorageLabel() {
  return resolveStorageLabel();
}

export const getHomeData = cache(async (): Promise<AdminDashboardData> => {
  return withStorage(async () => {
    const [stats, topClubs, upcomingEvents, recentMembers, recentRegistrations, categories] =
      await Promise.all([
        postgresStats(),
        postgresTopClubs(4),
        postgresUpcomingEvents(4),
        postgresRecentMembers(4),
        postgresRecentRegistrations(5),
        postgresClubCategories(),
      ]);

    return {
      stats,
      topClubs,
      upcomingEvents,
      recentMembers,
      recentRegistrations,
      categories,
    };
  }, async () => ({
    stats: demoStats(),
    topClubs: demoClubList("", "all", 4),
    upcomingEvents: demoEventList("", "all", null, 4),
    recentMembers: demoMemberList("", null, 4),
    recentRegistrations: demoRegistrationList("", "all", null, 5),
    categories: demoCategories(),
  }));
});

export const getAdminDashboardData = getHomeData;

export const listClubChoices = cache(async (): Promise<ClubChoice[]> => {
  return withStorage(async () => {
    const rows = await postgresClubChoices();
    return rows.rows;
  }, async () => demoClubChoices());
});

export const listMemberChoices = cache(async (): Promise<MemberChoice[]> => {
  return withStorage(async () => {
    const rows = await postgresMemberChoices();
    return rows.rows;
  }, async () => demoMemberChoices());
});

export const listEventChoices = cache(async (clubId?: number): Promise<EventChoice[]> => {
  return withStorage(async () => {
    const rows = await postgresEventChoices(clubId);
    return rows.rows;
  }, async () => demoEventChoicesForClub(clubId));
});

export const listClubCategories = cache(async (): Promise<CategorySummary[]> => {
  return withStorage(async () => {
    return postgresClubCategories();
  }, async () => demoCategories());
});

export const listClubs = cache(
  async (search = "", category = "all", limit = 12): Promise<ClubSummary[]> => {
    return withStorage(async () => {
      const rows = await postgresClubList(search, category, limit);
      return rows.rows;
    }, async () => demoClubList(search, category, limit));
  },
);

export const getClubDetail = cache(async (clubId: number): Promise<ClubDetail | null> => {
  return withStorage(async () => postgresClubDetail(clubId), async () => demoClubDetail(clubId));
});

export const listMembers = cache(
  async (search = "", clubId: number | null = null, limit = 20): Promise<MemberSummary[]> => {
    return withStorage(async () => {
      const rows = await postgresMemberList(search, clubId, limit);
      return rows.rows;
    }, async () => demoMemberList(search, clubId, limit));
  },
);

export const getMemberDetail = cache(async (memberId: number): Promise<MemberDetail | null> => {
  return withStorage(async () => postgresMemberDetail(memberId), async () => demoMemberDetail(memberId));
});

export const listEvents = cache(
  async (
    search = "",
    status = "all",
    clubId: number | null = null,
    limit = 24,
  ): Promise<ClubEventSummary[]> => {
    return withStorage(async () => {
      const rows = await query<ClubEventSummary>(
        `
          SELECT
            e.id,
            e.clube_id AS "clubId",
            c.nome AS "clubName",
            c.cor_primaria AS "clubColor",
            e.titulo AS "title",
            e.descricao AS "description",
            e.categoria AS "category",
            e.status,
            e.data_inicio AS "startsAt",
            e.data_fim AS "endsAt",
            e.local_ev AS "location",
            e.capacidade_maxima AS "capacity",
            COUNT(DISTINCT i.id)::int AS "registrationCount",
            e.destacado AS "isHighlighted",
            e.criado_em AS "createdAt"
          FROM eventos e
          INNER JOIN clubes c ON c.id = e.clube_id
          LEFT JOIN inscricoes i ON i.evento_id = e.id AND i.status = 'confirmado'
          WHERE
            ($1::text IS NULL OR LOWER(e.titulo) LIKE $1 OR LOWER(e.descricao) LIKE $1 OR LOWER(e.categoria) LIKE $1 OR LOWER(c.nome) LIKE $1)
            AND ($2::text = 'all' OR e.status = $2)
            AND ($3::int IS NULL OR e.clube_id = $3)
          GROUP BY e.id, c.id
          ORDER BY e.data_inicio ASC
          LIMIT $4
        `,
        [
          normalizeSearch(search) ? `%${normalizeSearch(search)}%` : null,
          status,
          clubId,
          limit,
        ],
      );

      return rows.rows.map((event) => ({
        ...event,
        filledPercent: percentage(event.registrationCount, event.capacity),
      }));
    }, async () => demoEventList(search, status, clubId, limit));
  },
);

export const listRegistrations = cache(
  async (
    search = "",
    status = "all",
    clubId: number | null = null,
    limit = 30,
  ): Promise<RegistrationSummary[]> => {
    return withStorage(async () => {
      const rows = await query<RegistrationSummary>(
        `
          SELECT
            r.id,
            r.membro_id AS "memberId",
            m.nome AS "memberName",
            m.email,
            c.nome AS "clubName",
            e.id AS "eventId",
            e.titulo AS "eventTitle",
            e.status AS "eventStatus",
            r.status,
            r.data_inscricao AS "registeredAt"
          FROM inscricoes r
          INNER JOIN membros m ON m.id = r.membro_id
          INNER JOIN eventos e ON e.id = r.evento_id
          INNER JOIN clubes c ON c.id = e.clube_id
          WHERE
            ($1::text IS NULL OR LOWER(m.nome) LIKE $1 OR LOWER(m.email) LIKE $1 OR LOWER(c.nome) LIKE $1 OR LOWER(e.titulo) LIKE $1)
            AND ($2::text = 'all' OR r.status = $2)
            AND ($3::int IS NULL OR c.id = $3)
          ORDER BY r.data_inscricao DESC
          LIMIT $4
        `,
        [
          normalizeSearch(search) ? `%${normalizeSearch(search)}%` : null,
          status,
          clubId,
          limit,
        ],
      );

      return rows.rows;
    }, async () => demoRegistrationList(search, status, clubId, limit));
  },
);

export const getClubDashboardData = cache(async (clubId: number): Promise<ClubDashboardData | null> => {
  const detail = await getClubDetail(clubId);

  if (!detail) {
    return null;
  }

  return {
    club: detail.club,
    members: detail.members,
    events: detail.events,
    registrations: detail.registrations,
    stats: await getHomeData().then((data) => data.stats),
  };
});

export const getMemberDashboardData = cache(
  async (memberId: number): Promise<MemberDashboardData | null> => {
    const detail = await getMemberDetail(memberId);

    if (!detail) {
      return null;
    }

    return {
      member: detail.member,
      clubs: detail.clubs,
      events: detail.events,
      registrations: detail.registrations,
      stats: await getHomeData().then((data) => data.stats),
    };
  },
);

export async function createClubRecord(input: NewClubInput) {
  return withStorage(async () => postgresCreateClub(input), async () => demoCreateClub(input));
}

export async function createMemberRecord(input: AccountRegistrationInput) {
  return withStorage(async () => postgresCreateMember(input), async () => demoCreateMember(input));
}

export async function joinClubRecord(input: JoinClubInput) {
  return withStorage(async () => postgresJoinClub(input), async () => demoJoinClub(input));
}

export async function createEventRecord(input: NewEventInput) {
  return withStorage(async () => postgresCreateEvent(input), async () => demoCreateEvent(input));
}

export async function registerEventRecord(input: NewRegistrationInput) {
  return withStorage(async () => postgresRegisterEvent(input), async () => demoRegisterEvent(input));
}
