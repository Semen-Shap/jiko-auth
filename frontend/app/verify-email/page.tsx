// frontend/app/verify-email/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const success = searchParams.get("success");
    
    if (success === "true") {
      setMessage("Email успешно подтвержден! Теперь вы можете войти в свой аккаунт.");
      setIsSuccess(true);
      setIsLoading(false);
      return;
    }
    
    if (!token) {
      setMessage("Токен верификации отсутствует");
      setIsLoading(false);
      setIsSuccess(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/v1/auth/verify-email?token=${token}`);
        
        if (response.redirected) {
          // Если сервер вернул редирект, следуем ему
          window.location.href = response.url;
          return;
        }
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setMessage(data.message || "Email успешно подтвержден!");
          setIsSuccess(true);
        } else {
          setMessage(data.message || "Ошибка при верификации email");
          setIsSuccess(false);
        }
      } catch (error) {
        console.error("Verify email error:", error);
        setMessage("Ошибка сети. Попробуйте позже.");
        setIsSuccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-secondary">Проверка токена...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md w-full bg-background p-8 rounded-lg shadow-md text-center border border-border">
        <h1 className="text-2xl font-bold mb-4 text-foreground">
          {isSuccess ? "Email подтвержден" : "Ошибка верификации"}
        </h1>
        <p className="mb-6">{message}</p>
        <a
          href="/login"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover"
        >
          Перейти к входу
        </a>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-secondary">Загрузка...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}