"use client";

import { useForm } from "@tanstack/react-form";
import { sileo } from "sileo";
import * as z from "zod";

import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

import Link from "next/link";
import { useRegister } from "@/hooks/use-auth";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  username: z.string().min(2, "Min characters 2").max(20, "Max 20"),
  password: z.string().min(6, "Min 6"),
});

export function RegisterForm() {
  const register = useRegister();

  const form = useForm({
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      register.mutate(value, {
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
        <CardContent>
          <form
            id="register-playground"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="username"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        autoFocus={true}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="mosayed002"
                        autoComplete="off"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
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
              />

              <form.Field
                name="password"
                children={(field) => {
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
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Field orientation="vertical">
            <Button className="w-full" type="submit" form="register-playground">
              Register
            </Button>
            <span>
              Already have an account?
              <Link className="underline ml-1" href="/auth/login">
                Login
              </Link>
            </span>
          </Field>
        </CardFooter>
      </Card>
    </main>
  );
}
