"use client";

import { useLogin } from "@/hooks/use-auth";
import { useForm } from "@tanstack/react-form";
import { sileo } from "sileo";
import * as z from "zod";

import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import { SocialMediaButtons } from "./providers-buttons";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(3, "Min characters 3").max(99, "Max characters 99"),
});

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      login.mutate(value, {
        onSuccess: () => {
          sileo.success({
            title: "Logged in successfully",
          });
        },
        onError: (error) => {
          sileo.error({
            title: "Error",
            description: error.message,
          });
        },
      });
    },
  });

  return (
    <main className="container mx-auto min-h-screen place-items-center grid">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center tracking-tight">
            Welcome to my Arsenal
          </CardTitle>
        </CardHeader>
        <SocialMediaButtons />

        <CardContent>
          <form
            id="login-playground"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field name="email">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        autoFocus={true}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="mo@gmail.com"
                        autoComplete="off"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="password">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="*****"
                        autoComplete="off"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Field orientation="vertical">
            <Button className="w-full" type="submit" form="login-playground">
              Login
            </Button>
            <p>
              Create new account?{" "}
              <span
                className="underline cursor-pointer"
                onClick={() => router.push("/auth/register")}
              >
                Register
              </span>
            </p>
          </Field>
        </CardFooter>
      </Card>
    </main>
  );
}
