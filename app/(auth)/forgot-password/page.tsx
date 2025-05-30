
"use client";

import React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo"; // Import the Logo component

const forgotPasswordSchema = z.object({
  emailOrUsername: z.string().min(1, "Email ou nome de usuário é obrigatório"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      emailOrUsername: "",
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    console.log(data);
    // TODO: Implement actual password reset logic (send email with code)
    toast({
      title: "Redefinição de Senha (Simulado)",
      description: `Instruções enviadas para ${data.emailOrUsername} (se a conta existir).`,
    });
    // Consider redirecting or showing a confirmation message
    // router.push('/reset-password'); // Maybe redirect to a code entry page
  };

  return (
    // Container removed, layout handled by (auth)/layout.tsx
    <Card className="w-full max-w-sm shadow-lg border border-border rounded-lg overflow-hidden">
      <CardHeader className="flex flex-col items-center pt-8 pb-6 bg-card">
        <Logo className="h-14 w-auto mb-6" /> {/* Adjusted logo size and margin */}
        {/* Title added for context */}
        <h2 className="text-xl font-semibold text-center text-foreground">Esqueceu a Senha?</h2>
        <p className="text-sm text-muted-foreground text-center mt-1 px-4">
          Insira seu email ou nome de usuário para redefinir
        </p>
      </CardHeader>
      <CardContent className="px-6 pb-6 grid gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="emailOrUsername"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold text-foreground">Email ou Nome de Usuário</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="seuemail@exemplo.com ou seu_usuario"
                      {...field}
                      className="input-line px-0" // Apply line style
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-11 rounded-full text-base font-semibold mt-4">
              Redefinir Senha
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm pb-8">
        {/* Use primary link color */}
        <Button variant="link" size="sm" asChild className="px-1 h-auto text-primary hover:text-primary/80">
           {/* Remove redundant wrapper */}
           <Link href="/login">Voltar para Login</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

