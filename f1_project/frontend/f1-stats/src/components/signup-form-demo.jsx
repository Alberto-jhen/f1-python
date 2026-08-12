"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn, emailValidator, passwordCompare, usernameValidator } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { IconBrandGoogle, IconInfoCircle } from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function SignupFormDemo({ onSubmit, mode = 'signup' }) {
  const isLogin = mode === 'login';
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [googleLoading, setGoogleLoading] = useState(false);

  const inputClasses = (field) =>
    errors[field] ? "ring-1 ring-red-500" : ""; 

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!isLogin) {
      if (!username) nextErrors.username = true;
      else if (!usernameValidator(username)) nextErrors.username = true;
    }

    if (!email) nextErrors.email = true;
    else if (!emailValidator(email)) nextErrors.email = true;

    if (!password) nextErrors.password = true;
    else if (!isLogin && password.length < 8) nextErrors.password = true;

    if (!isLogin && !confirmPassword) nextErrors.confirmPassword = true;
    else if (!isLogin && !passwordCompare(password, confirmPassword)) nextErrors.confirmPassword = true;

    return nextErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);

      if (!email || !password || (!isLogin && (!username || !confirmPassword))) {
        toast.error("Por favor, completa todos los campos");
      } else if (!isLogin && !usernameValidator(username)) {
        toast.error("El nombre de usuario solo puede contener letras, números, guiones y guiones bajos (3-30 caracteres)");
      } else if (!emailValidator(email)) {
        toast.error("Introduce un correo electrónico válido");
      } else if (!isLogin && !passwordCompare(password, confirmPassword)) {
        toast.error("Las contraseñas no coinciden");
      } else if (!isLogin && password.length < 8) {
        toast.error("La contraseña debe tener al menos 8 caracteres");
      }

      return;
    }

    setErrors({});
    if (onSubmit) {
      if (isLogin) {
        onSubmit({ email, password });
      } else {
        onSubmit({ username, email, password });
      }
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);

    try {
      const redirectTo = `${window.location.origin}/form`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });

      if (error) {
        toast.error(error.message || 'No se pudo iniciar sesión con Google');
      }
    } catch (err) {
      toast.error(err.message || 'Error inesperado con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-white p-4 md:p-8 dark:bg-black">
      <TooltipProvider>
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <LabelInputContainer>
              <div className="flex items-center gap-2">
                <Label htmlFor="username">Nombre de usuario</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                      <IconInfoCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Entre 3 y 30 caracteres. Solo letras, números, guiones y guiones bajos.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input id="username" placeholder="tu_usuario" type="text" value={username} onChange={(e) => { setUsername(e.target.value); clearError('username'); }} className={inputClasses('username')} />
            </LabelInputContainer>
          )}
          <LabelInputContainer>
            <div className="flex items-center gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                    <IconInfoCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Usarás este correo para iniciar sesión.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input id="email" placeholder="piloto@f1insights.com" type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError('email'); }} className={inputClasses('email')} />
          </LabelInputContainer>
          <LabelInputContainer>
            <div className="flex items-center gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                    <IconInfoCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mínimo 8 caracteres. Recomendado: mezcla de letras, números y símbolos.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input id="password" placeholder="••••••••" type="password" value={password} onChange={(e) => { setPassword(e.target.value); clearError('password'); }} className={inputClasses('password')} />
          </LabelInputContainer>
          {!isLogin && (
            <LabelInputContainer>
              <div className="flex items-center gap-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                      <IconInfoCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Repite la contraseña para verificar que no hay errores.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input id="confirmPassword" placeholder="••••••••" type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }} className={inputClasses('confirmPassword')} />
            </LabelInputContainer>
          )}

          <button
            className="group/btn cursor-pointer relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
            type="submit">
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'} &rarr;
            <BottomGradient />
          </button>

          <div
            className="h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

          <button
            className="group/btn cursor-pointer shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black disabled:opacity-60 disabled:cursor-not-allowed dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleAuth}>
            <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {googleLoading
                ? 'Redirigiendo a Google...'
                : (isLogin ? 'Iniciar sesión con Google' : 'Registrarse con Google')}
            </span>
            <BottomGradient />
          </button>
        </form>
      </TooltipProvider>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span
        className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span
        className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
