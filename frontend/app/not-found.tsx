import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                        <FileQuestion className="h-8 w-8 text-gray-500" />
                    </div>
                    <CardTitle>404 - Page Not Found</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <CardDescription className="mb-4">
                        The page you are looking for does not exist.
                    </CardDescription>
                    <Button asChild>
                        <a href="/">Go Home</a>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}