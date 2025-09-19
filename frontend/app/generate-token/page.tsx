"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";

interface OAuthClient {
  id: string;
  name: string;
  redirect_uris: string[];
  grants: string[];
  scope: string;
}

export default function GenerateToken() {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [scope, setScope] = useState<string>("");
  const [generatedToken, setGeneratedToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetchUserClients();
  }, []);

  const fetchUserClients = async () => {
    try {
      const response = await apiClient.getUserClients();
      
      if (response.data) {
        setClients(response.data);
      } else if (response.error) {
        if (response.status === 401) {
          router.push("/login");
        } else {
          setError(response.error);
        }
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError("Failed to load applications");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient) {
      setError("Please select an application");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiClient.createToken(selectedClient, scope);
      
      if (response.data) {
        setGeneratedToken(response.data.token);
        setMessage("Token generated successfully!");
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      console.error("Error generating token:", err);
      setError("Failed to generate token");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedToken);
    setMessage("Token copied to clipboard!");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-background p-8 rounded-lg shadow-md border border-border">
        <h1 className="text-2xl font-bold mb-6 text-center text-foreground">
          Generate Access Token
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-error/10 rounded-lg border border-error/20 text-error">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-success/10 rounded-lg border border-success/20 text-success">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="client" className="block text-sm font-medium text-foreground mb-2">
              Application
            </label>
            <select
              id="client"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              required
            >
              <option value="">Select an application</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="scope" className="block text-sm font-medium text-foreground mb-2">
              Permissions (Scope)
            </label>
            <input
              type="text"
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="e.g., read, write, profile"
            />
            <p className="text-xs text-muted mt-1">
              Separate multiple permissions with commas or spaces
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-foreground bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
              isLoading ? "bg-primary/70" : ""
            }`}
          >
            {isLoading ? "Generating..." : "Generate Token"}
          </button>
        </form>

        {generatedToken && (
          <div className="mt-6 p-4 bg-secondary/10 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Your Access Token</h3>
            <div className="relative">
              <pre className="p-3 bg-background border border-border rounded-md overflow-x-auto text-sm text-foreground">
                {generatedToken}
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 p-1 bg-primary text-primary-foreground rounded-md text-xs hover:bg-primary-hover"
                title="Copy to clipboard"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-muted mt-2">
              <strong>Warning:</strong> This token will only be shown once. Make sure to copy it now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}