import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-5">
      <div className="absolute top-4 right-4 flex gap-2">
        <Link href="/sign-in">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button variant="outline" size="sm">
            Sign Up
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
            JIKO
          </CardTitle>
          <CardDescription className="text-gray-400">
            Welcome to JIKO Authentication System
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-300 mb-6">
            Choose an option to get started
          </p>
          <div className="space-y-3">
            <Link href="/sign-in" className="block">
              <Button className="w-full bg-cyan-500 text-black hover:bg-cyan-400">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up" className="block">
              <Button variant="outline" className="w-full">
                Sign Up
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
