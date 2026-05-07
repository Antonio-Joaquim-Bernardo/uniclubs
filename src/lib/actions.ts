"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  ActionState,
  AccountRegistrationInput,
  JoinClubInput,
  NewClubInput,
  NewEventInput,
  NewRegistrationInput,
  UserRole,
} from "@/lib/domain";
import {
  approvePendingAccount,
  createApprovedAccount,
  getViewer,
  loginAccount,
  registerAccount,
  rejectPendingAccount,
  updateProfile,
} from "@/lib/auth";
import {
  createClubRecord,
  createEventRecord,
  joinClubRecord,
  registerEventRecord,
} from "@/lib/repository";

function success(message: string): ActionState {
  return {
    status: "success",
    message,
  };
}

function error(message: string, fieldErrors: Record<string, string> = {}): ActionState {
  return {
    status: "error",
    message,
    fieldErrors,
  };
}

function readText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, field: string) {
  const value = readText(formData, field);
  return value ? value : null;
}

function readNumber(formData: FormData, field: string) {
  const value = readText(formData, field);
  if (!value) {
    return NaN;
  }

  return Number(value);
}

function readOptionalNumber(formData: FormData, field: string) {
  const value = readText(formData, field);

  if (!value) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : NaN;
}

function readBoolean(formData: FormData, field: string) {
  return formData.get(field) === "on";
}

function normalizeHex(value: string) {
  const candidate = value.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(candidate)) {
    return candidate;
  }

  return "#22c55e";
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateRequired(value: string) {
  return value.trim().length > 0;
}

type AccountInputResult =
  | { fieldErrors: Record<string, string> }
  | { input: AccountRegistrationInput };

function buildAccountInput(formData: FormData): AccountInputResult {
  const name = readText(formData, "name");
  const email = readText(formData, "email");
  const password = readText(formData, "password");
  const role = readText(formData, "role") as UserRole | "";
  const clubAdminId = readOptionalNumber(formData, "clubAdminId");

  const fieldErrors: Record<string, string> = {};

  if (!validateRequired(name)) {
    fieldErrors.name = "Informe o nome.";
  }

  if (!validateEmail(email)) {
    fieldErrors.email = "Informe um email valido.";
  }

  if (password.length < 6) {
    fieldErrors.password = "A password precisa de pelo menos 6 caracteres.";
  }

  const course = readOptionalText(formData, "course");
  const phone = readOptionalText(formData, "phone");
  const resolvedRole: UserRole =
    role === "admin_sistema" || role === "admin_clube" ? role : "membro";

  if (clubAdminId !== null && !Number.isFinite(clubAdminId)) {
    fieldErrors.clubAdminId = "Selecione um clube valido.";
  }

  if (Number.isFinite(clubAdminId) && clubAdminId !== null && clubAdminId <= 0) {
    fieldErrors.clubAdminId = "Selecione um clube valido.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    input: {
      name,
      email,
      course,
      phone,
      password,
      role: resolvedRole,
      clubAdminId: Number.isFinite(clubAdminId) ? clubAdminId : null,
    } satisfies AccountRegistrationInput,
  };
}

export async function loginAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = readText(formData, "email");
  const password = readText(formData, "password");

  if (!validateEmail(email)) {
    return error("Corrige os campos destacados.", {
      email: "Informe um email valido.",
    });
  }

  if (password.length < 6) {
    return error("Corrige os campos destacados.", {
      password: "A password precisa de pelo menos 6 caracteres.",
    });
  }

  try {
    await loginAccount({ email, password });
    revalidatePath("/");
    revalidatePath("/dashboard");
    redirect("/dashboard");
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Nao foi possivel iniciar a sessao.";
    return error(message);
  }
}

export async function registerAccountAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const account = buildAccountInput(formData);

  if ("fieldErrors" in account) {
    return error("Corrige os campos destacados.", account.fieldErrors);
  }

  try {
    const result = await registerAccount({
      ...account.input,
      role: "membro",
      clubAdminId: null,
    });

    if ("fieldErrors" in result) {
      return error("Corrige os campos destacados.", result.fieldErrors);
    }

    revalidatePath("/");
    revalidatePath("/login");
    redirect(`/pendente?email=${encodeURIComponent(account.input.email)}`);
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Nao foi possivel criar a conta.";
    return error(message);
  }
}

export async function updateProfileAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await getViewer();

  if (!viewer) {
    return error("Precisas de iniciar sessao para alterar o perfil.");
  }

  const name = readText(formData, "name");
  const email = readText(formData, "email");
  const course = readOptionalText(formData, "course");
  const phone = readOptionalText(formData, "phone");
  const password = readOptionalText(formData, "password");

  const fieldErrors: Record<string, string> = {};

  if (name.length < 3) {
    fieldErrors.name = "Informe o nome.";
  }

  if (!validateEmail(email)) {
    fieldErrors.email = "Informe um email valido.";
  }

  if (password && password.length < 6) {
    fieldErrors.password = "A password precisa de pelo menos 6 caracteres.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return error("Corrige os campos destacados.", fieldErrors);
  }

  try {
    await updateProfile(viewer.id, {
      name,
      email,
      course,
      phone,
      password,
    });

    revalidatePath("/");
    revalidatePath("/perfil");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/dashboard_admin");
    revalidatePath("/dashboard/dashboard_admin_clube");
    revalidatePath("/dashboard/dashboard_membro");

    return success("Perfil actualizado com sucesso.");
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Nao foi possivel actualizar o perfil.";
    return error(message);
  }
}

export async function approveAccountAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await getViewer();

  if (!viewer || viewer.role !== "admin_sistema") {
    return error("Sem permissao para aprovar contas.");
  }

  const memberId = readNumber(formData, "memberId");
  const role = readText(formData, "role") as UserRole;
  const clubAdminId = readOptionalNumber(formData, "clubAdminId");

  if (!Number.isInteger(memberId) || memberId <= 0) {
    return error("Corrige os campos destacados.", {
      memberId: "Informe um membro valido.",
    });
  }

  await approvePendingAccount(memberId, {
    role: role === "admin_sistema" || role === "admin_clube" ? role : undefined,
    clubAdminId: Number.isFinite(clubAdminId) ? clubAdminId : null,
  });

  revalidatePath("/membros");
  revalidatePath("/dashboard/dashboard_admin");
  return success("Conta aprovada com sucesso.");
}

export async function rejectAccountAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await getViewer();

  if (!viewer || viewer.role !== "admin_sistema") {
    return error("Sem permissao para eliminar contas pendentes.");
  }

  const memberId = readNumber(formData, "memberId");

  if (!Number.isInteger(memberId) || memberId <= 0) {
    return error("Corrige os campos destacados.", {
      memberId: "Informe um membro valido.",
    });
  }

  await rejectPendingAccount(memberId);

  revalidatePath("/membros");
  revalidatePath("/dashboard/dashboard_admin");
  return success("Conta rejeitada.");
}

export async function createClubAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await getViewer();

  if (!viewer || viewer.role !== "admin_sistema") {
    return error("Sem permissao para criar clubes.");
  }

  const name = readText(formData, "name");
  const category = readText(formData, "category");
  const description = readText(formData, "description");
  const objective = readOptionalText(formData, "objective");
  const location = readOptionalText(formData, "location");
  const accentColor = normalizeHex(readText(formData, "accentColor"));

  const fieldErrors: Record<string, string> = {};

  if (name.length < 3) {
    fieldErrors.name = "O nome precisa de pelo menos 3 caracteres.";
  }

  if (category.length < 2) {
    fieldErrors.category = "Escolha ou escreva uma categoria.";
  }

  if (description.length < 20) {
    fieldErrors.description = "Descreva melhor o clube.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return error("Corrige os campos destacados.", fieldErrors);
  }

  const input: NewClubInput = {
    name,
    category,
    description,
    objective,
    location,
    accentColor,
  };

  await createClubRecord(input);

  revalidatePath("/");
  revalidatePath("/clubes");
  revalidatePath("/dashboard/dashboard_admin");

  return success(`Clube "${name}" criado com sucesso.`);
}

export async function createMemberAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await getViewer();

  if (!viewer || viewer.role !== "admin_sistema") {
    return error("Sem permissao para criar contas de membros.");
  }

  const member = buildAccountInput(formData);

  if ("fieldErrors" in member) {
    return error("Corrige os campos destacados.", member.fieldErrors);
  }

  if (member.input.role === "admin_clube" && !member.input.clubAdminId) {
    return error("Corrige os campos destacados.", {
      clubAdminId: "Escolhe o clube do administrador.",
    });
  }

  await createApprovedAccount(member.input);

  revalidatePath("/membros");
  revalidatePath("/dashboard/dashboard_admin");

  return success(`Membro "${member.input.name}" criado com sucesso.`);
}

export async function joinClubAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const clubId = readNumber(formData, "clubId");
  const role = readText(formData, "role") as JoinClubInput["role"];
  const member = buildAccountInput(formData);

  const fieldErrors: Record<string, string> = {};

  if (!Number.isInteger(clubId) || clubId <= 0) {
    fieldErrors.clubId = "Selecione um clube valido.";
  }

  if (role !== "membro" && role !== "admin_clube") {
    fieldErrors.role = "Escolha um papel valido.";
  }

  if ("fieldErrors" in member) {
    Object.assign(fieldErrors, member.fieldErrors);
  }

  if (Object.keys(fieldErrors).length > 0) {
    return error("Corrige os campos destacados.", fieldErrors);
  }

  if ("input" in member) {
    const input: JoinClubInput = {
      clubId,
      role,
      ...member.input,
    };

    const result = await joinClubRecord(input);

    revalidatePath("/");
    revalidatePath("/clubes");
    revalidatePath(`/clubes/${clubId}`);
    revalidatePath("/membros");
    revalidatePath("/dashboard/dashboard_admin");
    revalidatePath("/dashboard/dashboard_admin_clube");

    return success(`${result.memberName} entrou no clube ${result.clubName}.`);
  }

  return error("Corrige os campos destacados.", fieldErrors);
}

export async function createEventAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await getViewer();
  const clubId = readNumber(formData, "clubId");
  const title = readText(formData, "title");
  const description = readOptionalText(formData, "description");
  const startsAt = readText(formData, "startsAt");
  const endsAt = readOptionalText(formData, "endsAt");
  const location = readOptionalText(formData, "location");
  const category = readText(formData, "category");
  const capacityRaw = readOptionalText(formData, "capacity");
  const highlighted = readBoolean(formData, "highlighted");

  const fieldErrors: Record<string, string> = {};

  if (!viewer) {
    return error("Precisas de iniciar sessao para criar eventos.");
  }

  if (
    viewer.role !== "admin_sistema" &&
    !(viewer.role === "admin_clube" && viewer.clubAdminId === clubId)
  ) {
    return error("Sem permissao para criar eventos neste clube.");
  }

  if (!Number.isInteger(clubId) || clubId <= 0) {
    fieldErrors.clubId = "Selecione um clube valido.";
  }

  if (title.length < 3) {
    fieldErrors.title = "O titulo precisa de pelo menos 3 caracteres.";
  }

  if (category.length < 2) {
    fieldErrors.category = "Indique uma categoria.";
  }

  if (!startsAt) {
    fieldErrors.startsAt = "Informe a data e hora de inicio.";
  }

  const capacity =
    capacityRaw && capacityRaw.length > 0 ? Number(capacityRaw) : null;

  if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) {
    fieldErrors.capacity = "A capacidade precisa ser um numero inteiro positivo.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return error("Corrige os campos destacados.", fieldErrors);
  }

  const input: NewEventInput = {
    clubId,
    title,
    description,
    startsAt: new Date(startsAt).toISOString(),
    endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    location,
    capacity,
    category,
    highlighted,
  };

  const result = await createEventRecord(input);

  revalidatePath("/");
  revalidatePath("/eventos");
  revalidatePath("/clubes");
  revalidatePath(`/clubes/${clubId}`);
  revalidatePath("/dashboard/dashboard_admin");
  revalidatePath("/dashboard/dashboard_admin_clube");

  return success(`Evento "${result.title}" criado para ${result.clubName}.`);
}

export async function registerEventAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = readNumber(formData, "eventId");
  const member = buildAccountInput(formData);

  const fieldErrors: Record<string, string> = {};

  if (!Number.isInteger(eventId) || eventId <= 0) {
    fieldErrors.eventId = "Selecione um evento valido.";
  }

  if ("fieldErrors" in member) {
    Object.assign(fieldErrors, member.fieldErrors);
  }

  if (Object.keys(fieldErrors).length > 0) {
    return error("Corrige os campos destacados.", fieldErrors);
  }

  if ("input" in member) {
    const input: NewRegistrationInput = {
      eventId,
      ...member.input,
    };

    const result = await registerEventRecord(input);

    revalidatePath("/");
    revalidatePath("/eventos");
    revalidatePath("/inscricoes");
    revalidatePath(`/clubes`);
    revalidatePath("/dashboard/dashboard_membro");

    return success(`${result.memberName} inscrito em ${result.eventTitle}.`);
  }

  return error("Corrige os campos destacados.", fieldErrors);
}
