import { FormField } from "@/components/ui/form-field";

export function MemberFields({
  errors,
  includePassword = false,
  passwordLabel = "Password",
  passwordDescription = "Usa pelo menos 6 caracteres para proteger a conta.",
  defaults,
}: {
  errors?: Record<string, string>;
  includePassword?: boolean;
  passwordLabel?: string;
  passwordDescription?: string;
  defaults?: {
    name?: string;
    email?: string;
    course?: string | null;
    phone?: string | null;
  };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        htmlFor="name"
        label="Nome completo"
        required
        error={errors?.name}
        description="Nome do membro tal como deve aparecer no sistema."
      >
        <input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Ex.: Ana Paixao"
          className="input-field"
          defaultValue={defaults?.name ?? ""}
          required
        />
      </FormField>

      <FormField
        htmlFor="email"
        label="Email"
        required
        error={errors?.email}
        description="Usa um email que identifique o membro de forma unica."
      >
        <input
          id="email"
          name="email"
          autoComplete="email"
          type="email"
          placeholder="ana@uniclubs.edu"
          className="input-field"
          defaultValue={defaults?.email ?? ""}
          required
        />
      </FormField>

      <FormField
        htmlFor="course"
        label="Curso"
        error={errors?.course}
        description="Campo opcional para segmentar estudantes por area."
      >
        <input
          id="course"
          name="course"
          autoComplete="organization-title"
          placeholder="Ex.: Engenharia Informatica"
          className="input-field"
          defaultValue={defaults?.course ?? ""}
        />
      </FormField>

      <FormField
        htmlFor="phone"
        label="Telefone"
        error={errors?.phone}
        description="Campo opcional para contactos rapidos."
      >
        <input
          id="phone"
          name="phone"
          autoComplete="tel"
          type="tel"
          placeholder="+244 921 000 000"
          className="input-field"
          defaultValue={defaults?.phone ?? ""}
        />
      </FormField>

      {includePassword ? (
        <FormField
          htmlFor="password"
          label={passwordLabel}
          required
          error={errors?.password}
          description={passwordDescription}
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="input-field"
            minLength={6}
            required
          />
        </FormField>
      ) : null}
    </div>
  );
}
