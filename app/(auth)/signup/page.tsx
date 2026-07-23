"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema } from "@/schemas/signUpSchema";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import * as z from "zod";
import Link from "next/link";
// import { LayoutKanban, ArrowRight } from "lucide-react";
import { SquareKanban, ArrowRight } from "lucide-react";

type FormData = z.infer<typeof signUpSchema>;

export default function SignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { handleSubmit, control } = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  const [passwordValue, setPasswordValue] = useState("");

  const getStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = getStrength(passwordValue);
  const strengthLabel = ["Too weak", "Weak", "Okay", "Good", "Strong"][
    strength
  ];
  const strengthColor =
    strength <= 1
      ? "bg-red-500"
      : strength <= 2
        ? "bg-yellow-500"
        : "bg-green-500";
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      await axios.post("/api/signup", data);

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Account created, but auto-login failed. Please log in.");
        router.replace("/login");
        return;
      }

      toast.success("Welcome to FlowBoard!");
      router.replace("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex">
      {/* Left panel — brand story */}
      <div className="hidden lg:flex w-[52%] flex-col justify-between p-12 relative overflow-hidden">
        {/* Floating kanban cards illustration */}
        <div className="absolute top-10 -right-8 opacity-90 select-none pointer-events-none">
          <div className="flex gap-2.5">
            <div className="flex flex-col gap-2">
              <div className="w-32 p-2.5 bg-stone-900 border border-stone-800 rounded-lg">
                <div className="w-10 h-1.5 bg-orange-500 rounded-full mb-2" />
                <div className="w-20 h-1 bg-stone-700 rounded-full mb-1" />
                <div className="w-14 h-1 bg-stone-800 rounded-full" />
              </div>
              <div className="w-32 p-2.5 bg-stone-900 border border-stone-800 rounded-lg">
                <div className="w-8 h-1.5 bg-yellow-500 rounded-full mb-2" />
                <div className="w-16 h-1 bg-stone-700 rounded-full" />
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-6">
              <div className="w-32 p-2.5 bg-stone-900 border border-blue-500 rounded-lg">
                <div className="w-11 h-1.5 bg-blue-500 rounded-full mb-2" />
                <div className="w-[85px] h-1 bg-stone-700 rounded-full mb-1" />
                <div className="w-[55px] h-1 bg-stone-800 rounded-full" />
              </div>
              <div className="w-32 p-2.5 bg-stone-900 border border-stone-800 rounded-lg">
                <div className="w-9 h-1.5 bg-green-500 rounded-full mb-2" />
                <div className="w-[75px] h-1 bg-stone-700 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center -rotate-6">
            <SquareKanban className="text-stone-950" size={18} />
          </div>
          <span className="text-stone-50 text-lg font-medium tracking-tight">
            FlowBoard
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 mt-auto">
          <h1 className="text-stone-50 text-4xl font-medium leading-tight tracking-tight mb-4">
            Where work
            <br />
            finds its <span className="text-orange-500">flow.</span>
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed max-w-xs mb-8">
            The project board your team will actually enjoy opening every
            morning.
          </p>

          {/* Social proof avatars */}
          <div className="flex items-center gap-3.5">
            <div className="flex">
              <div className="w-7 h-7 rounded-full bg-violet-600 border-2 border-stone-950 flex items-center justify-center">
                <span className="text-white text-[10px] font-medium">A</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-cyan-600 border-2 border-stone-950 -ml-2 flex items-center justify-center">
                <span className="text-white text-[10px] font-medium">S</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-red-600 border-2 border-stone-950 -ml-2 flex items-center justify-center">
                <span className="text-white text-[10px] font-medium">M</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-stone-800 border-2 border-stone-950 -ml-2 flex items-center justify-center">
                <span className="text-stone-400 text-[9px] font-medium">
                  +9
                </span>
              </div>
            </div>
            <span className="text-stone-600 text-xs">
              Teams shipping with FlowBoard
            </span>
          </div>
        </div>
      </div>

      {/* Right panel — form card */}
      <div className="flex-1 m-3 bg-stone-50 rounded-xl flex flex-col justify-center px-8 py-10 sm:px-12">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile-only logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center -rotate-6">
              <SquareKanban className="text-stone-950" size={15} />
            </div>
            <span className="text-stone-900 font-medium tracking-tight">
              FlowBoard
            </span>
          </div>

          <h2 className="text-stone-900 text-[21px] font-medium tracking-tight mb-1">
            Create your account
          </h2>
          <p className="text-stone-400 text-[13px] mb-7">
            Free forever. No credit card needed.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3.5"
          >
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-xs font-medium text-stone-700">
                    Name
                  </FieldLabel>
                  <Input
                    {...field}
                    placeholder="Hassan Khan"
                    className="h-10 rounded-[9px] border-stone-200 bg-white text-[13px] placeholder:text-stone-300 focus-visible:border-orange-500 focus-visible:ring-orange-500/15 focus-visible:ring-[3px]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-xs font-medium text-stone-700">
                    Email
                  </FieldLabel>
                  <Input
                    {...field}
                    type="email"
                    placeholder="hassan@team.com"
                    className="h-10 rounded-[9px] border-stone-200 bg-white text-[13px] placeholder:text-stone-300 focus-visible:border-orange-500 focus-visible:ring-orange-500/15 focus-visible:ring-[3px]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-xs font-medium text-stone-700">
                    Password
                  </FieldLabel>
                  <Input
                    {...field}
                    type="password"
                    placeholder="At least 8 characters"
                    onChange={(e) => {
                      field.onChange(e);
                      setPasswordValue(e.target.value);
                    }}
                    className="h-10 rounded-[9px] border-stone-200 bg-white text-[13px] placeholder:text-stone-300 focus-visible:border-orange-500 focus-visible:ring-orange-500/15 focus-visible:ring-[3px]"
                  />
                  {passwordValue.length > 0 && (
                    <div className="mt-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-[3px] flex-1 rounded-full ${
                              i <= strength ? strengthColor : "bg-stone-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">
                        {strengthLabel}
                      </p>
                    </div>
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-[42px] bg-stone-900 hover:bg-stone-800 disabled:opacity-60 rounded-[9px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span className="text-stone-50 text-sm font-medium">
                {isSubmitting ? "Creating your space..." : "Start flowing"}
              </span>
              {!isSubmitting && (
                <ArrowRight className="text-orange-500" size={16} />
              )}
            </button>
          </form>

          <p className="text-stone-400 text-[12.5px] text-center mt-4">
            Already on board?{" "}
            <Link
              href="/login"
              className="text-stone-900 font-medium border-b border-orange-500 hover:border-orange-600"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
