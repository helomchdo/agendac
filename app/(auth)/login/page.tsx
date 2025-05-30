
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

const loginSchema = z.object({
  username: z.string().min(1, "Usuário / Email é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    console.log(data);
    // TODO: Implement actual login logic
    toast({
      title: "Login (Simulado)",
      description: `Usuário: ${data.username}`,
    });
    // router.push('/'); // Redirect on successful login
  };

  return (
     // Container removed, layout is handled by (auth)/layout.tsx
    <Card className="w-full max-w-sm shadow-lg border border-border rounded-lg overflow-hidden">
      <CardHeader className="flex flex-col items-center pt-8 pb-6 bg-card">
        <Logo className="h-14 w-auto mb-6" /> {/* Adjusted logo size and margin */}
        {/* Removed CardTitle and CardDescription */}
      </CardHeader>
      <CardContent className="px-6 pb-6 grid gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold text-foreground">Usuário / Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="seuemail@exemplo.com"
                      {...field}
                      className="input-line px-0" // Apply line style
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold text-foreground">Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="********"
                      {...field}
                      className="input-line px-0" // Apply line style
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                  <div className="flex justify-end pt-1">
                    <Button variant="link" size="sm" asChild className="px-0 h-auto text-xs text-primary hover:text-primary/80">
                       {/* Remove redundant wrapper */}
                       <Link href="/forgot-password">Esqueceu a senha?</Link>
                    </Button>
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-11 rounded-full text-base font-semibold mt-4">
              Entrar
            </Button>
          </form>
        </Form>
        {/* Optional: Google Login - consider if needed */}
        {/* <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Ou continue com
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full rounded-full" onClick={() => {}}>
          Google
        </Button> */}
      </CardContent>
      <CardFooter className="flex justify-center text-sm pb-8">
        {/* Use primary link color */}
        <Button variant="link" size="sm" asChild className="px-1 h-auto text-primary hover:text-primary/80">
           {/* Remove redundant wrapper */}
           <Link href="/register">Não possui cadastro?</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

