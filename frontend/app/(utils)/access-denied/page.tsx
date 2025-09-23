import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AccessDenied() {
    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-destructive">Access Denied</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <CardDescription className="mb-4">
                        You do not have permission to access this page.
                    </CardDescription>
                    <Button asChild>
                        <Link href="/">Go Home</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}