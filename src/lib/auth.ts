"use server";

import "server-only";

import bcrypt from "bcrypt";
import crypto from "crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasDatabaseUrl, query } from "@/lib/db";
import type {
  AccountLoginInput,
  AccountRegistrationInput,
  MemberStatus,
  PendingAccountSummary,
  UpdateProfileInput,
  UserRole,
  Viewer,
} from "@/lib/domain";
import { getDemoState, type DemoMember, type DemoSession } from "@/lib/demo-data";

const SESSION_COOKIE = "uniclubs_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_ROUNDS = 10;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function isBcryptHash(value: string | null | undefined) {
  return Boolean(value && value.startsWith("$2"));
}

async function verifyPassword(candidate: string, stored: string | null) {
  if (!stored) {
    return false;
  }

  if (isBcryptHash(stored)) {
    return bcrypt.compare(candidate, stored);
  }

  return candidate === stored;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildViewer(member: {
  id: number;
  name: string;
  email: string;
  course: string | null;
  phone: string | null;
  status: MemberStatus;
  role: UserRole;
  clubAdminId: number | null;
}): Viewer {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    course: member.course,
    phone: member.phone,
    status: member.status,
    role: member.role,
    clubAdminId: member.clubAdminId,
  };
}

function mapDemoMember(member: DemoMember): Viewer {
  return buildViewer(member);
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

async function saveSession(memberId: number) {
  const token = crypto.randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  if (hasDatabaseUrl) {
    await query(
      `
        INSERT INTO sessoes (member_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
      `,
      [memberId, tokenHash, expiresAt.toISOString()],
    );
  } else {
    const state = getDemoState();
    state.sessions.push({
      tokenHash,
      memberId,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  await setSessionCookie(token, expiresAt);
}

async function removeSession(tokenHash: string) {
  if (hasDatabaseUrl) {
    await query(`DELETE FROM sessoes WHERE token_hash = $1`, [tokenHash]);
    return;
  }

  const state = getDemoState();
  state.sessions = state.sessions.filter((session) => session.tokenHash !== tokenHash);
}

async function findSessionViewer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  if (hasDatabaseUrl) {
    const result = await query<{
      id: number;
      name: string;
      email: string;
      course: string | null;
      phone: string | null;
      status: MemberStatus;
      role: UserRole;
      clubAdminId: number | null;
      expiresAt: string;
    }>(
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
          s.expires_at AS "expiresAt"
        FROM sessoes s
        INNER JOIN membros m ON m.id = s.member_id
        WHERE s.token_hash = $1
          AND s.revoked_at IS NULL
          AND s.expires_at > NOW()
        LIMIT 1
      `,
      [tokenHash],
    );

    const viewer = result.rows[0];

    if (!viewer) {
      await clearSessionCookie();
      return null;
    }

    return buildViewer(viewer);
  }

  const state = getDemoState();
  const session = state.sessions.find(
    (item) => item.tokenHash === tokenHash && new Date(item.expiresAt).getTime() > Date.now(),
  );

  if (!session) {
    state.sessions = state.sessions.filter((item) => item.tokenHash !== tokenHash);
    await clearSessionCookie();
    return null;
  }

  const member = state.members.find((item) => item.id === session.memberId);

  if (!member) {
    state.sessions = state.sessions.filter((item) => item.tokenHash !== tokenHash);
    await clearSessionCookie();
    return null;
  }

  return mapDemoMember(member);
}

function validateRegistration(input: AccountRegistrationInput) {
  const fieldErrors: Record<string, string> = {};

  if (input.name.trim().length < 3) {
    fieldErrors.name = "Informe um nome completo.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    fieldErrors.email = "Informe um email valido.";
  }

  if (input.password.trim().length < 6) {
    fieldErrors.password = "A password precisa de pelo menos 6 caracteres.";
  }

  return fieldErrors;
}

async function upsertAccount(input: AccountRegistrationInput, status: MemberStatus) {
  const email = normalizeEmail(input.email);
  const passwordHash = await bcrypt.hash(input.password, PASSWORD_ROUNDS);
  const role = input.role ?? "membro";
  const clubAdminId = input.clubAdminId ?? null;

  if (hasDatabaseUrl) {
    const existing = await query<{
      id: number;
      status: MemberStatus;
      role: UserRole;
    }>(
      `
        SELECT id, status, papel AS "role"
        FROM membros
        WHERE email = $1
        LIMIT 1
      `,
      [email],
    );

    const existingMember = existing.rows[0];

    if (existingMember && existingMember.status === "ativo" && status === "pendente") {
      throw new Error("Ja existe uma conta activa com este email.");
    }

    if (existingMember) {
      await query(
        `
          UPDATE membros
          SET
            nome = $2,
            curso = $3,
            telefone = $4,
            status = $5,
            papel = $6,
            clube_admin_id = $7,
            senha_hash = $8
          WHERE id = $1
        `,
        [
          existingMember.id,
          input.name,
          input.course,
          input.phone,
          status,
          role,
          clubAdminId,
          passwordHash,
        ],
      );

      return existingMember.id;
    }

    const created = await query<{ id: number }>(
      `
        INSERT INTO membros (
          nome,
          email,
          curso,
          telefone,
          status,
          papel,
          clube_admin_id,
          senha_hash
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [input.name, email, input.course, input.phone, status, role, clubAdminId, passwordHash],
    );

    return created.rows[0]?.id ?? null;
  }

  const state = getDemoState();
  const existingMember = state.members.find((member) => member.email === email);

  if (existingMember && existingMember.status === "ativo" && status === "pendente") {
    throw new Error("Ja existe uma conta activa com este email.");
  }

  if (existingMember) {
    existingMember.name = input.name;
    existingMember.course = input.course;
    existingMember.phone = input.phone;
    existingMember.status = status;
    existingMember.role = role;
    existingMember.clubAdminId = clubAdminId;
    existingMember.passwordHash = passwordHash;
    return existingMember.id;
  }

  const newId = state.nextIds.member++;
  state.members.push({
    id: newId,
    name: input.name,
    email,
    course: input.course,
    phone: input.phone,
    status,
    role,
    clubAdminId,
    passwordHash,
    createdAt: new Date().toISOString(),
  });

  return newId;
}

export const getViewer = cache(async (): Promise<Viewer | null> => {
  return findSessionViewer();
});

export async function requireViewer() {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.status === "pendente") {
    redirect("/pendente");
  }

  return viewer;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const viewer = await requireViewer();

  if (!allowedRoles.includes(viewer.role)) {
    redirect("/dashboard");
  }

  return viewer;
}

export async function getSessionViewer() {
  return getViewer();
}

export async function loginAccount(input: AccountLoginInput) {
  const email = normalizeEmail(input.email);

  if (hasDatabaseUrl) {
    const result = await query<{
      id: number;
      name: string;
      email: string;
      course: string | null;
      phone: string | null;
      status: MemberStatus;
      role: UserRole;
      clubAdminId: number | null;
      passwordHash: string | null;
    }>(
      `
        SELECT
          id,
          nome AS "name",
          email,
          curso AS "course",
          telefone AS "phone",
          status,
          papel AS "role",
          clube_admin_id AS "clubAdminId",
          senha_hash AS "passwordHash"
        FROM membros
        WHERE email = $1
        LIMIT 1
      `,
      [email],
    );

    const member = result.rows[0];

    if (!member) {
      throw new Error("Email ou password incorretos.");
    }

    if (member.status === "suspenso") {
      throw new Error("Esta conta encontra-se suspensa.");
    }

    if (!(await verifyPassword(input.password, member.passwordHash))) {
      throw new Error("Email ou password incorretos.");
    }

    await saveSession(member.id);
    return buildViewer(member);
  }

  const state = getDemoState();
  const member = state.members.find((item) => item.email === email);

  if (!member) {
    throw new Error("Email ou password incorretos.");
  }

  if (member.status === "suspenso") {
    throw new Error("Esta conta encontra-se suspensa.");
  }

  if (!(await verifyPassword(input.password, member.passwordHash))) {
    throw new Error("Email ou password incorretos.");
  }

  await saveSession(member.id);
  return mapDemoMember(member);
}

export async function registerAccount(input: AccountRegistrationInput) {
  const fieldErrors = validateRegistration(input);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const email = normalizeEmail(input.email);
  const accountInput = {
    ...input,
    email,
    role: input.role ?? "membro",
    clubAdminId: input.clubAdminId ?? null,
  } satisfies AccountRegistrationInput;

  const memberId = await upsertAccount(accountInput, "pendente");

  return {
    memberId,
  };
}

export async function createApprovedAccount(input: AccountRegistrationInput) {
  const fieldErrors = validateRegistration(input);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const email = normalizeEmail(input.email);
  const accountInput = {
    ...input,
    email,
    role: input.role ?? "membro",
    clubAdminId: input.clubAdminId ?? null,
  } satisfies AccountRegistrationInput;

  const memberId = await upsertAccount(accountInput, "ativo");

  return {
    memberId,
  };
}

export async function approvePendingAccount(
  memberId: number,
  updates: { role?: UserRole; clubAdminId?: number | null } = {},
) {
  if (hasDatabaseUrl) {
    await query(
      `
        UPDATE membros
        SET status = 'ativo',
            papel = COALESCE($2, papel),
            clube_admin_id = COALESCE($3, clube_admin_id)
        WHERE id = $1
      `,
      [memberId, updates.role ?? null, updates.clubAdminId ?? null],
    );

    return;
  }

  const state = getDemoState();
  const member = state.members.find((item) => item.id === memberId);

  if (!member) {
    throw new Error("Membro nao encontrado.");
  }

  member.status = "ativo";
  if (updates.role) {
    member.role = updates.role;
  }
  if (updates.clubAdminId !== undefined) {
    member.clubAdminId = updates.clubAdminId;
  }
}

export async function rejectPendingAccount(memberId: number) {
  if (hasDatabaseUrl) {
    await query(`DELETE FROM membros WHERE id = $1 AND status = 'pendente'`, [memberId]);
    return;
  }

  const state = getDemoState();
  state.members = state.members.filter((item) => item.id !== memberId);
  state.memberships = state.memberships.filter((item) => item.memberId !== memberId);
  state.registrations = state.registrations.filter((item) => item.memberId !== memberId);
  state.sessions = state.sessions.filter((item) => item.memberId !== memberId);
}

export async function updateProfile(
  viewerId: number,
  input: UpdateProfileInput,
) {
  const email = normalizeEmail(input.email);
  const passwordHash = input.password?.trim()
    ? await bcrypt.hash(input.password.trim(), PASSWORD_ROUNDS)
    : null;

  if (hasDatabaseUrl) {
    const result = await query<{
      id: number;
      name: string;
      email: string;
      course: string | null;
      phone: string | null;
      status: MemberStatus;
      role: UserRole;
      clubAdminId: number | null;
    }>(
      `
        UPDATE membros
        SET
          nome = $2,
          email = $3,
          curso = $4,
          telefone = $5,
          senha_hash = COALESCE($6, senha_hash)
        WHERE id = $1
        RETURNING
          id,
          nome AS "name",
          email,
          curso AS "course",
          telefone AS "phone",
          status,
          papel AS "role",
          clube_admin_id AS "clubAdminId"
      `,
      [viewerId, input.name, email, input.course, input.phone, passwordHash],
    );

    const member = result.rows[0];

    if (!member) {
      throw new Error("Perfil nao encontrado.");
    }

    return buildViewer(member);
  }

  const state = getDemoState();
  const member = state.members.find((item) => item.id === viewerId);

  if (!member) {
    throw new Error("Perfil nao encontrado.");
  }

  member.name = input.name;
  member.email = email;
  member.course = input.course;
  member.phone = input.phone;

  if (passwordHash) {
    member.passwordHash = passwordHash;
  }

  return mapDemoMember(member);
}

export async function listPendingAccounts(): Promise<PendingAccountSummary[]> {
  if (hasDatabaseUrl) {
    const result = await query<PendingAccountSummary>(
      `
        SELECT
          id,
          nome AS "name",
          email,
          curso AS "course",
          telefone AS "phone",
          papel AS "role",
          clube_admin_id AS "clubAdminId",
          status,
          data_registro AS "createdAt"
        FROM membros
        WHERE status = 'pendente'
        ORDER BY data_registro ASC, nome ASC
      `,
    );

    return result.rows;
  }

  const state = getDemoState();
  return state.members
    .filter((member) => member.status === "pendente")
    .map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      course: member.course,
      phone: member.phone,
      role: member.role,
      clubAdminId: member.clubAdminId,
      status: member.status,
      createdAt: member.createdAt,
    }));
}

export async function signOutCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await removeSession(hashToken(token));
  }

  await clearSessionCookie();
}
