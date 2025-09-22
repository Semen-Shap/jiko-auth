import { Loader2 } from "lucide-react";
import { Card, CardContent} from "./ui/card";


export default function Fallback() {
    return (
        <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardContent className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}