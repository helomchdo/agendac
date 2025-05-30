
"use client";

import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Schema similar to registration, excluding passwords
const editProfileSchema = z.object({
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido").refine(value => value.trim().length > 0, {
    message: "Email é obrigatório", // Ensure email is not just spaces
  }),
  username: z.string().min(3, "Mínimo 3 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Apenas letras, números e _"),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

// Mock current user data - in a real app, this would be fetched
const mockCurrentUser = {
  fullName: "Usuário Padrão",
  email: "usuario@exemplo.com",
  username: "usuario_padrao",
};

export default function EditProfilePage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: mockCurrentUser, 
    mode: "onChange",
  });

  useEffect(() => {
    // Simulate fetching user data and populating the form
    // In a real app, fetch data here and then reset
    form.reset(mockCurrentUser);
  }, [form]); // form.reset is stable, mockCurrentUser is constant here.

  const onSubmit = (data: EditProfileFormValues) => {
    console.log("Dados do perfil atualizados (simulado):", data);
    // TODO: Implement actual profile update logic with backend
    toast({
      title: "Perfil Atualizado",
      description: "Suas informações foram salvas com sucesso! (Simulado)",
    });
    // router.push('/profile'); // Optionally redirect to a profile view page
  };

  return (
    <div className="w-full max-w-2xl mx-auto"> {/* Center content */}
      <Card className="shadow-lg border border-border rounded-lg overflow-hidden">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 flex-shrink-0">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Button>
            <div className="flex-grow">
              <CardTitle className="text-xl sm:text-2xl">Editar Perfil</CardTitle>
              <CardDescription className="text-sm text-muted-foreground pt-0.5">
                Atualize suas informações pessoais.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0"> {/* Removed space-y-6 from form tag */}
            <CardContent className="p-6 space-y-6"> {/* Added space-y-6 to CardContent */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seuemail@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="@seu_usuario" {...field} />
                    </FormControl>
                    <FormDescription>
                      Este será seu nome de exibição público.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t p-6 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Salvar Alterações
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

